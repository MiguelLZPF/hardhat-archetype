//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { OwnableUpgradeable as Ownable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { TransparentUpgradeableProxy as TUP } from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import { Create2Upgradeable as Create2 } from "@openzeppelin/contracts-upgradeable/utils/Create2Upgradeable.sol";
import { ContractRecord, IContractRegistry } from "./interfaces/IContractRegistry.sol";

/**
 * @title Contract Registry
 * @author Miguel Gomez Carpena
 * @dev This Smart Contract is in charge of keep a registry of deployed SC
 *      for a given system. It can also deploy or upgrade them
 */
contract ContractRegistry is IContractRegistry, Initializable, Ownable {
  // ======
  // VARIABLES
  // Store Contract Records associated to the proxy address
  mapping(address => ContractRecord) private contractRecords;
  // Relation to be able to find Record by Name related to an admin
  // --   (admin,            name) --> proxy
  mapping(address => mapping(bytes32 => address)) private nameToProxy;
  // Relation between admin and contract record names (list)
  // --   admin --> names[]
  mapping(address => bytes32[]) private adminRecordNames;

  // =========
  // FUNCTIONS
  /**
  0. Initialize function that acts like a constructor
  */
  function initialize(
    address proxy,
    bytes32 name,
    bytes2 version,
    bytes32 logicCodeHash
  ) external initializer {
    __Ownable_init();
    if (proxy == address(0)) {
      proxy = address(this);
    }
    if (name == bytes32(0)) {
      name = bytes32("ContractRegistry");
    }
    _register(proxy, address(this), name, version, logicCodeHash);
  }

  // upgrade

  function register(
    address proxy,
    address logic,
    bytes32 name,
    bytes2 version,
    bytes32 logicCodeHash
  ) external {
    _register(proxy, logic, name, version, logicCodeHash);
  }

  function update(
    address proxy,
    address logic,
    bytes32 actualName,
    bytes2 version,
    bytes32 logicCodeHash
  ) external {
    if (proxy == address(0) && actualName != bytes32(0)) {
      // get proxy adress
      proxy = nameToProxy[_msgSender()][keccak256(abi.encodePacked(actualName))];
    }
    _update(proxy, logic, version, logicCodeHash);
  }

  function changeRegisteredAdmin(address proxy, address newAdmin) external {
    // check admin is an address
    require(newAdmin != address(0), "New admin address needed");
    // check that new admin is different from msg.sender
    require(newAdmin != _msgSender(), "New admin address equals sender");
    // change in record
    ContractRecord storage record = contractRecords[proxy];
    // check if registered
    require(record.rat != 0, "Contract not registered");
    // check if msg.sender == admin
    require(record.admin == _msgSender(), "You are not the admin");
    // remove record in array
    _removeRecordAdmin(adminRecordNames[record.admin], record.index);
    // remove record in translate mapping
    nameToProxy[record.admin][keccak256(abi.encodePacked(record.name))] = address(0);
    // update index in record
    record.index = uint16(adminRecordNames[newAdmin].length);
    // add record name in admins's array
    adminRecordNames[newAdmin].push(record.name);
    // add record in translate mapping
    nameToProxy[newAdmin][keccak256(abi.encodePacked(record.name))] = proxy;
    // update actual record admin
    emit AdminChanged(record.admin, newAdmin, record.name);
    record.admin = newAdmin;
  }

  function getRecord(address proxy)
    external
    view
    returns (bool found, ContractRecord memory record)
  {
    return _getRecord(proxy);
  }

  function getRecordByName(bytes32 name, address admin)
    external
    view
    returns (bool found, ContractRecord memory record)
  {
    if (admin == address(0)) {
      admin = _msgSender();
    }
    return _getRecord(nameToProxy[admin][keccak256(abi.encodePacked(name))]);
  }

  function getSystemRecords() external view returns (bytes32[] memory contractNames) {
    return _getRecords(owner());
  }

  function getMyRecords() external view returns (bytes32[] memory contractNames) {
    return _getRecords(_msgSender());
  }

  function _register(
    address proxy,
    address logic,
    bytes32 name,
    bytes2 version,
    bytes32 logicCodeHash
  ) internal {
    // Parameter checks
    require(logic != address(0), "Logic address is nedded");
    // regular deployment proxy = logic
    if (proxy == address(0)) {
      proxy = logic;
    }
    bytes32 nameHash = keccak256(abi.encodePacked(name));
    require(
      name != bytes32(0) && nameToProxy[_msgSender()][nameHash] == address(0),
      "Name must be unique or null"
    );
    // Other checks
    ContractRecord storage record = contractRecords[proxy];
    require(record.rat == 0, "Contract already registered");

    // Register in storage
    record.proxy = proxy;
    record.logic = logic;
    record.admin = _msgSender();
    record.name = name;
    record.version = version;
    record.logicCodeHash = logicCodeHash;
    record.rat = block.timestamp;
    record.uat = block.timestamp;
    record.index = uint16(adminRecordNames[record.admin].length);
    // Store proxy by name
    nameToProxy[_msgSender()][nameHash] = proxy;
    // store admin's name list
    adminRecordNames[record.admin].push(name);
    // events
    emit Registered(record.proxy, record.name, record.version, record.logicCodeHash);
  }

  function _update(
    address proxy,
    address logic,
    bytes2 version,
    bytes32 logicCodeHash
  ) internal {
    // Parameter checks
    // regular deployment not allowed
    require(proxy != logic, "Contract not upgradeable");
    // get record
    ContractRecord storage record = contractRecords[proxy];
    // Other checks
    // -- check if registered
    require(record.rat != 0, "Contract not registered");
    // -- check if diferent logic address
    require(record.logic != logic, "Logic already updated");
    require(record.logicCodeHash != logicCodeHash, "Logic hash already updated");
    require(version != record.version, "New version must be higher");
    // -- check if msg.sender is the admin how registred it
    require(record.admin == _msgSender(), "You are not the admin");
    // Update in storage
    record.logic = logic;
    record.logicCodeHash = logicCodeHash;
    record.version = version;
    record.uat = block.timestamp;
    // events
    emit Updated(record.proxy, record.name, record.version, record.logicCodeHash);
  }

  /**
  @notice removes a record from its admin array
  @param names array of record names for an admin
  @param index the index of the record to be removed
   */
  function _removeRecordAdmin(bytes32[] storage names, uint16 index) internal {
    // for each name in names from index forward, names[i] <- names[i+1] <- names [i+2]
    for (uint16 i = index; i < names.length - 1; i++) {
      names[i] = names[i + 1];
      // update index of the other elemtents in the array
      contractRecords[nameToProxy[_msgSender()][names[i]]].index = i + 1;
    }
    names.pop();
  }

  function _getRecord(address proxy)
    internal
    view
    returns (bool found, ContractRecord memory record)
  {
    record = contractRecords[proxy];
    if (record.rat == 0) {
      found = false;
    } else {
      found = true;
    }
    return (found, record);
  }

  function _getRecords(address from) internal view returns (bytes32[] memory contractNames) {
    return adminRecordNames[from];
  }
}
