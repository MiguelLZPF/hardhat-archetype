//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import { Create2Upgradeable as Create2 } from "@openzeppelin/contracts-upgradeable/utils/Create2Upgradeable.sol";
import { IContractRegistry } from "./interfaces/IContractRegistry.sol";
import { IContractDeployer } from "./interfaces/IContractDeployer.sol";

contract ContractDeployer is IContractDeployer, ProxyAdmin {
  function deployContract(
    IContractRegistry registry,
    bytes memory bytecode,
    bytes memory data,
    bytes32 salt,
    bytes32 name,
    bytes2 version
  ) external {
    address registryAddr = address(registry);
    // calculate sha3 hash of the bytecode
    bytes32 logicCodeHash = keccak256(bytecode);
    // check if salt is empty and generate a random salt
    if (salt == bytes32(0)) {
      salt = keccak256(abi.encodePacked(bytecode, block.timestamp));
    }
    // deploy logic/implementation contract
    address logic = Create2.deploy(0, salt, bytecode);
    // deploy proxy/storage contract TransparentUpgradeableProxy
    address proxy = address(new TransparentUpgradeableProxy(logic, address(this), data));

    // the owner is the msg.sender. Implementation May or may not be ownable
    try Ownable(proxy).transferOwnership(_msgSender()) {} catch {}

    if (registryAddr != address(0)) {
      registry.register(proxy, logic, name, version, logicCodeHash);
      // return control of the proxy
      registry.changeRegisteredAdmin(proxy, _msgSender());
    }
    emit ContractDeployed(registryAddr, proxy, name, version, logicCodeHash);
  }

  function upgradeContract(
    IContractRegistry registry,
    TransparentUpgradeableProxy proxy,
    bytes memory bytecode,
    bytes memory data,
    bytes32 salt,
    bytes2 version
  ) external {
    address registryAddr = address(registry);
    address proxyAddr = address(proxy);
    // calculate sha3 hash of the bytecode
    bytes32 logicCodeHash = keccak256(bytecode);
    // check if salt is empty and generate a random salt
    if (salt == bytes32(0)) {
      salt = keccak256(abi.encodePacked(bytecode, block.timestamp));
    }
    // deploy new logic/implementation contract
    address logic = Create2.deploy(0, salt, bytecode);
    // upgrade the new logic/implementation contract
    if (keccak256(data) != keccak256(new bytes(0))) {
      upgradeAndCall(proxy, logic, data);
    } else {
      upgrade(proxy, logic);
    }

    // the owner is the msg.sender. May or may not be ownable
    try Ownable(proxyAddr).transferOwnership(_msgSender()) {} catch {}

    if (registryAddr != address(0)) {
      IContractRegistry(registry).update(proxyAddr, logic, bytes32(0), version, logicCodeHash);
      // return control of the proxy
      IContractRegistry(registry).changeRegisteredAdmin(proxyAddr, _msgSender());
    }
    emit ContractUpgraded(registryAddr, proxyAddr, version, logicCodeHash);
  }
}
