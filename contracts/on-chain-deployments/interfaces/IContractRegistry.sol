//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0 <0.9.0;

// represents a contract record or a deployment of a contract in blockchain
struct ContractRecord {
  address proxy; // use as ID too
  address logic;
  address admin;
  bytes32 name; // must be unique OPT DEF: 0x00...00
  bytes2 version;
  uint16 index; // index in array (limit of 65536 per admin)
  bytes32 logicCodeHash; // OPT def: 0x00...00
  uint256 rat; // Registered AT
  uint256 uat; // Updated AT
}

/**
 * @title Contract Registry Interface
 * @author Miguel Gomez Carpena
 * @dev Interface for ContractRegistry Smart Contract
 */
interface IContractRegistry {
  // EVENTS
  // should be emitted when a contract record is registered
  event Registered(
    address indexed proxy,
    bytes32 name,
    bytes2 indexed version,
    bytes32 indexed logicCodeHash
  );
  // should be emitted when a contract record is updated
  event Updated(
    address indexed proxy,
    bytes32 name,
    bytes2 indexed version,
    bytes32 indexed logicCodeHash
  );
  // should be emitted when a contract record changes it's registered admin
  event AdminChanged(address indexed oldAdmin, address indexed newAdmin, bytes32 name);

  // =========
  // FUNCTIONS
  /**
   * @notice Initializes the contract and adds intself as first record
   * @dev The logic address in not needed because is the address(this)
   * @param proxy address of the proxy | storage contract
   * @param name (optional) [ContractRegistry] name to identify this contract
   * @param version (optional) [00.00] initial version of the contract
   * @param logicCodeHash the external bytecode or deployBytecode or off-chain bytecode
   */
  function initialize(
    address proxy,
    bytes32 name,
    bytes2 version,
    bytes32 logicCodeHash
  ) external;

  /**
   * @notice Registers a contract deployed as a new ContractRecord
   * @param proxy Address of the proxy | storage contract. If NO upgradeable deployment proxy = logic
   * @param logic Address of the logic | implementation contract
   * @param name Name to identify this contract
   * @param version Initial version of the contract
   * @param logicCodeHash The external bytecode or deployBytecode or off-chain bytecode
   */
  function register(
    address proxy,
    address logic,
    bytes32 name,
    bytes2 version,
    bytes32 logicCodeHash
  ) external;

  /**
   * @notice Updates the ContractRecord of a contract deployment. Used only when it is upgradeable
   * @param proxy Address of the proxy | storage contract. Identifies the contract if no actualName
   * @param logic Address of the logic | implementation contract
   * @param actualName (optional) [0x0000000000] Name to identify this contract
   * @param version initial version of the contract
   * @param logicCodeHash the external bytecode or deployBytecode or off-chain bytecode
   */
  function update(
    address proxy,
    address logic,
    bytes32 actualName,
    bytes2 version,
    bytes32 logicCodeHash
  ) external;

  /**
   * @notice Changes the registered admin/owner of a Contract Record
   * @param proxy Address of the proxy | storage contract that identifies it
   * @param newAdmin Address of the new admin
   */
  function changeRegisteredAdmin(address proxy, address newAdmin) external;

  /**
   * @notice Retreives the contract record associated to the given proxy address
   * @param proxy Address of the proxy | storage contract. Identifies the contract
   * @return found Whether the contract record is found or not
   * @return record Actual contract record struct object
   */
  function getRecord(address proxy)
    external
    view
    returns (bool found, ContractRecord calldata record);

  /**
   * @notice Retreives the contract record associated to the given contract name
   * @param name Name asigned on contract registration. Identifies the contract
   * @param admin (optional) [msg.sender] Address of the admin to search name
   * @return found Whether the contract record is found or not
   * @return record Actual contract record struct object
   */
  function getRecordByName(bytes32 name, address admin)
    external
    view
    returns (bool found, ContractRecord calldata record);

  /**
   * @notice Retreives the contract record list associated to the system or owner of this ContractRegistry
   * @return contractNames Array of contract names list
   */
  function getSystemRecords() external view returns (bytes32[] calldata contractNames);

  /**
   * @notice Retreives the contract record list associated to the sender of the transaction
   * @return contractNames Array of contract names list
   */
  function getMyRecords() external view returns (bytes32[] calldata contractNames);
}
