import { Wallet, Signer } from "ethers";
import { isAddress, keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { ENV } from "../configuration";
import { INetworkDeployment, IRegularDeployment } from "../models/Deploy";
import {
  ContractRegistry,
  ContractRegistry__factory,
  ContractDeployer__factory,
  IContractDeployer__factory,
  IContractRegistry__factory,
} from "../typechain-types";
import { VERSION_HEX_STRING_ZERO } from "./contractRegistry";
import { getActualNetDeployment, getContractTimestamp, saveDeployment } from "./deploy";
import { GAS_OPT, ADDR_ZERO, ghre } from "./utils";

/**
 *
 * @param deployer Signer or wallet to use to initialize the onChain deployments contracts
 * @param onlyDeployer (optional) [false] Flag to check if deploy a new registry or use other deployed
 * @param defaultContractRegistry (optional) [ENV.DEPLOY.contractRegistry.address] Use a onChain registry already deployed
 * @returns
 */
export const initOnChainDeployments = async (
  deployer: Wallet,
  onlyDeployer: boolean = false,
  defaultContractRegistry?: string
) => {
  // make sure to have an address for the Registry. Param | deployments.jsom | ENV config
  defaultContractRegistry = defaultContractRegistry
    ? defaultContractRegistry
    : await getRegistry(true);
  let registryDeployment: IRegularDeployment | undefined;
  let deployerDeployment: IRegularDeployment | undefined;
  //* Contract Registry
  let contractRegistry: ContractRegistry | undefined;
  if (!onlyDeployer) {
    contractRegistry = await (
      await new ContractRegistry__factory(deployer).deploy(GAS_OPT)
    ).deployed();
    await contractRegistry.initialize(
      ADDR_ZERO,
      new Uint8Array(32),
      VERSION_HEX_STRING_ZERO,
      keccak256(ContractRegistry__factory.bytecode),
      GAS_OPT
    );
    registryDeployment = {
      address: contractRegistry.address,
      byteCodeHash: keccak256(ContractRegistry__factory.bytecode),
      contractName: "ContractRegistry",
      deployTimestamp: await getContractTimestamp(contractRegistry),
      deployTxHash: contractRegistry.deployTransaction.hash,
    };
  }
  //* Contract Deployer
  const contractDeployer = await (
    await new ContractDeployer__factory(deployer).deploy(GAS_OPT)
  ).deployed();
  await contractDeployer.initialize(
    contractRegistry ? contractRegistry.address : defaultContractRegistry,
    GAS_OPT
  );
  deployerDeployment = {
    address: contractDeployer.address,
    byteCodeHash: keccak256(ContractDeployer__factory.bytecode),
    contractName: "ContractDeployer",
    deployTimestamp: await getContractTimestamp(contractDeployer),
    deployTxHash: contractDeployer.deployTransaction.hash,
  };
  //* save on storage deployments file
  console.log("Saving registry and deployer in deployments.json file...");
  await saveDeployment(undefined, undefined, registryDeployment, deployerDeployment);
  console.log("Saved successfully in deployments.json file!");
  return {
    contractRegistry: contractRegistry ? contractRegistry.address : defaultContractRegistry,
    contractDeployer: contractDeployer.address,
  };
};

//* REGISTRY

//* DEPLOYER

/**
 * Performs an upgradeable deployment and registers a contract record in the contract registry
 * @param contractName name of the contract to be deployed
 * @param deployer signer used to sign deploy transaction
 * @param args arguments to use in the initializer
 * @param contractRegistryAddr (optional) [ENV.DEPLOY.contractRegistry.address || defaultInDeployer] Address to the contract registry to be used
 * @param contractDeployerAddr (optional) [ENV.DEPLOY.contractDeployer.address] Address to the contract deployer to be used
 */
export const deployWithDeployer = async (
  contractName: string,
  deployer: Signer,
  args: unknown[],
  contractRegistryAddr: string,
  contractDeployerAddr: string
) => {
  const ethers = ghre.ethers;
  const provider = ethers.provider;
  // make sure to have an address for the Registry and Deployer. Param | deployments.jsom | ENV config
  contractRegistryAddr = contractRegistryAddr ? contractRegistryAddr : await getRegistry(true);
  contractDeployerAddr = contractDeployerAddr ? contractDeployerAddr : await getDeployer(true);
  const factory = ethers.getContractFactory(contractName);
  const contractDeployer = IContractDeployer__factory.connect(contractDeployerAddr, deployer);

  // -- encode function params for TUP
  let initData: string;
  if (args.length > 0) {
    initData = (await factory).interface.encodeFunctionData("initialize", [...args]);
  } else {
    initData = (await factory).interface._encodeParams([], []);
  }
  contractDeployer.deployContract(
    contractRegistryAddr,
    await provider.getCode(contractName),
    initData,
    new Uint8Array(),
    toUtf8Bytes(contractName),
    new Uint8Array(2),
    GAS_OPT
  );
};

/**
 * Performs an upgrade to an upgradeable deployment and updates the contract record in the contract registry
 * @param contractName name of the contract to be upgraded
 * @param deployer signer used to sign upgrade transaction
 * @param args arguments to use in the initializer
 * @param contractRegistryAddr (optional) [ENV.DEPLOY.contractRegistry.address || defaultInDeployer] Address to the contract registry to be used
 * @param contractDeployerAddr (optional) [ENV.DEPLOY.contractDeployer.address] Address to the contract deployer to be used
 */
export const upgradeWithDeployer = async (
  contractName: string,
  deployer: Wallet,
  args: unknown[],
  contractRegistryAddr?: string,
  contractDeployerAddr?: string
) => {
  const ethers = ghre.ethers;
  const provider = ethers.provider;
  // get contract factory for the contract to be upgraded
  const factory = ethers.getContractFactory(contractName);
  // make sure to have an address for the Registry and Deployer. Param | deployments.jsom | ENV config
  contractRegistryAddr = contractRegistryAddr ? contractRegistryAddr : await getRegistry(true);
  contractDeployerAddr = contractDeployerAddr ? contractDeployerAddr : await getDeployer(true);
  // create contract Registry and Deployer instances
  const contractRegistry = IContractRegistry__factory.connect(contractRegistryAddr, deployer);
  const contractDeployer = IContractDeployer__factory.connect(contractDeployerAddr, deployer);
  // get contract record before upgrade
  const getResponse = await contractRegistry.getRecordByName(contractName, deployer.address);
  if (!getResponse.found) {
    throw new Error("Cannot find contract record " + contractName + " in " + contractRegistryAddr);
  }
  // -- encode function params for TUP
  let initData: string;
  if (args.length > 0) {
    initData = (await factory).interface.encodeFunctionData("initialize", [...args]);
  } else {
    initData = (await factory).interface._encodeParams([], []);
  }
  // actual ON Chain upgrade
  contractDeployer.upgradeContract(
    contractRegistryAddr,
    getResponse.record.proxy,
    await provider.getCode(contractName),
    initData,
    new Uint8Array(),
    new Uint8Array(2),
    GAS_OPT
  );
};

//* Utils
/**
 * @param required (optional) [false] Check if a valid address return value is required or not
 * @returns The address of the ContractRegistry defined in the deployments file
 * or in the ENV/config variable
 */
const getRegistry = async (required = false) => {
  // get the actual network deployment
  const netDeployRes = await getActualNetDeployment(ghre);
  // if no deployment or not get network, leave undefined
  const netDeployment = netDeployRes.netDeployment ? netDeployRes.netDeployment : undefined;
  // if network deployment and contractRegistry deployed, use this address else the config one
  const registry =
    netDeployment && netDeployment.smartContracts.contractRegistry
      ? netDeployment.smartContracts.contractRegistry.address
      : ENV.DEPLOY.contractRegistry.address;
  if (required && !isAddress(registry)) {
    throw new Error("Contract Registry address not found and it's needed");
  }
  return registry;
};

/**
 * @param required (optional) [false] Check if a valid address return value is required or not
 * @returns The address of the ContractDeployer defined in the deployments file
 * or in the ENV/config variable
 */
const getDeployer = async (required = false) => {
  // get the actual network deployment
  const netDeployRes = await getActualNetDeployment(ghre);
  // if no deployment or not get network, leave undefined
  const netDeployment = netDeployRes.netDeployment ? netDeployRes.netDeployment : undefined;
  // if network deployment and contractDeployer deployed, use this address else the config one
  const deployer =
    netDeployment && netDeployment.smartContracts.contractDeployer
      ? netDeployment.smartContracts.contractDeployer.address
      : ENV.DEPLOY.contractDeployer.address;
  if (required && !isAddress(deployer)) {
    throw new Error("Contract Deployer address not found and it's needed");
  }
  return deployer;
};
