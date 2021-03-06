import { Provider } from "@ethersproject/abstract-provider";
import { Wallet, Signer } from "ethers";
import { isAddress, keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { ENV } from "../configuration";
import { IRegularDeployment } from "../models/Deploy";
import {
  ContractRegistry,
  ContractRegistry__factory,
  ContractDeployer__factory,
  IContractDeployer__factory,
  IContractRegistry__factory,
  IContractDeployer,
  IContractRegistry,
} from "../typechain-types";
import {
  ContractRecordStruct,
  ContractRecordStructOutput,
} from "../typechain-types/contracts/on-chain-deployments/interfaces/IContractRegistry";
import { getActualNetDeployment, getContractTimestamp, saveDeployment } from "./deploy";
import { GAS_OPT, ADDR_ZERO, ghre, stringToStringHexFixed } from "./utils";

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
  defaultContractRegistry = (await getRegistry(false, undefined, defaultContractRegistry)) as
    | string
    | undefined;
  // to register in JSON deployments file
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
  if (!contractRegistry && !defaultContractRegistry) {
    throw new Error("No ContractRegistry address nor deployed one");
  }
  //* Contract Deployer
  const contractDeployer = await (
    await new ContractDeployer__factory(deployer).deploy(GAS_OPT)
  ).deployed();
  await contractDeployer.initialize(
    contractRegistry ? contractRegistry.address! : defaultContractRegistry!,
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

/**
 * Registers a contract record in the contract registry
 * @param logic address of the implementation contract or only contract in regular deployments
 * @param proxy (optional) [ADDR_ZERO] address of the storage proxy contract
 * @param name strig to be used as the name of the contract as key for its admin
 * @param contractName name of the contract to be registered. Relative to this proyect's name domain
 * @param signer signer used to sign transaction
 * @param version (optional) [00.00] version of the contract record to be registered
 * @param contractRegistryAddr (optional) [ENV.DEPLOY.contractRegistry.address || defaultInDeployer] Address to the contract registry to be used
 */
export const registerContract = async (
  logic: string,
  name: string,
  contractName: string,
  signer: Signer,
  version = "00.00",
  proxy = ADDR_ZERO,
  contractRegistryAddr?: string
) => {
  const ethers = ghre.ethers;
  // make sure to have an address for the Registry and Deployer. Param | deployments.jsom | ENV config
  const contractRegistry = (await getRegistry(
    true,
    signer,
    contractRegistryAddr
  )) as IContractRegistry;
  // create and send the transaction
  const receipt = await (
    await contractRegistry.register(
      proxy,
      logic,
      await stringToStringHexFixed(name, 32),
      await versionDotToHexString(version),
      keccak256((await ethers.getContractFactory(contractName)).bytecode),
      GAS_OPT
    )
  ).wait();
  if (!receipt) {
    throw new Error("Register Transaction failed to execute, NO RECEIPT");
  }
  return await contractRegistry.getRecord(proxy == ADDR_ZERO ? logic : proxy);
};

/**
 * Updates a contract record in the contract registry
 * @param logic address of the implementation contract or only contract in regular deployments
 * @param proxy (optional) [ADDR_ZERO] address of the storage proxy contract
 * @param actualName (optional) [undefined] string to search by name of the contract as key for its admin
 * @param contractName name of the contract to be updated. Relative to this proyect's name domain
 * @param signer signer used to sign transaction
 * @param version version of the contract record to be updated
 * @param contractRegistryAddr (optional) [ENV.DEPLOY.contractRegistry.address || defaultInDeployer] Address to the contract registry to be used
 */
export const updateContract = async (
  logic: string,
  contractName: string,
  signer: Signer,
  version: string,
  proxy = ADDR_ZERO,
  actualName?: string,
  contractRegistryAddr?: string
) => {
  const ethers = ghre.ethers;
  // make sure to have an address for the Registry and Deployer. Param | deployments.jsom | ENV config
  const contractRegistry = (await getRegistry(
    true,
    signer,
    contractRegistryAddr
  )) as IContractRegistry;
  // create and send the transaction
  const receipt = await (
    await contractRegistry.update(
      proxy,
      logic,
      await stringToStringHexFixed(actualName ? actualName : "", 32),
      await versionDotToHexString(version),
      keccak256((await ethers.getContractFactory(contractName)).bytecode),
      GAS_OPT
    )
  ).wait();
  if (!receipt) {
    throw new Error("Update Transaction failed to execute, NO RECEIPT");
  }
  return await contractRegistry.getRecord(proxy == ADDR_ZERO ? logic : proxy);
};

/**
 * Gets the information of one contract record stored in a contract registry
 * @param proxyOrName proxy address (logic if not upgradeable) or name that was used to register it
 * @param admin address of the admin that registered the contract record
 * @param contractRegistryAddr (optional) [ENV.DEPLOY.contractRegistry.address || defaultInDeployer] Address to the contract registry to be used
 * @param signer (optional) [undefined] used if you want to use a signer
 * @returns [found, ContractRecord] whether the record was found ot not and the record itself
 */
export const getRecord = async (
  proxyOrName: string,
  admin: string,
  contractRegistryAddr?: string,
  signer?: Signer
) => {
  const contractRegistry = (await getRegistry(
    true,
    signer ? signer : ghre.ethers.provider,
    contractRegistryAddr
  )) as IContractRegistry;
  if (isAddress(proxyOrName)) {
    return contractRegistry.getRecord(proxyOrName);
  } else {
    return contractRegistry.getRecordByName(proxyOrName, admin ? admin : ADDR_ZERO);
  }
};

/**
 * Gets the information of all contract records stored in a contract registry by the system (owner of the contract registry)
 * @param systemAdmin address of the system admin that deployed the contract registry
 * @param contractRegistryAddr (optional) [ENV.DEPLOY.contractRegistry.address || defaultInDeployer] Address to the contract registry to be used
 * @returns list of [found, ContractRecord] whether the record was found ot not and the record itself
 */
export const getSystemRecords = async (systemAdmin: string, contractRegistryAddr?: string) => {
  const contractRegistry = (await getRegistry(
    true,
    ghre.ethers.provider,
    contractRegistryAddr
  )) as IContractRegistry;
  const recordList = await contractRegistry.getSystemRecords();
  let records: Promise<[boolean, ContractRecordStructOutput]>[] = [];
  for (let i = 0; i < recordList.length; i++) {
    records.push(contractRegistry.getRecordByName(recordList[i], systemAdmin));
  }
  return await Promise.all(records);
};

/**
 * Gets the information of all contract records stored in a contract registry by the from account
 * @param from the from address or signer to get the contracts from
 * @param contractRegistryAddr (optional) [ENV.DEPLOY.contractRegistry.address || defaultInDeployer] Address to the contract registry to be used
 * @returns list of [found, ContractRecord] whether the record was found ot not and the record itself
 */
export const getRecords = async (from: Signer | string, contractRegistryAddr?: string) => {
  // get contract registry
  const contractRegistry = (await getRegistry(
    true,
    typeof from == "string" ? ghre.ethers.provider : from,
    contractRegistryAddr
  )) as IContractRegistry;
  // get record list from registry as signer or address
  let recordList: string[];
  if (typeof from == "string") {
    recordList = await contractRegistry.getMyRecords({
      from: from,
    });
  } else {
    recordList = await contractRegistry.getMyRecords();
  }
  // get deatail of all records
  let records: Promise<[boolean, ContractRecordStructOutput]>[] = [];
  for (let i = 0; i < recordList.length; i++) {
    records.push(
      contractRegistry.getRecordByName(recordList[i], typeof from == "string" ? from : ADDR_ZERO)
    );
  }
  return await Promise.all(records);
};

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
  contractRegistryAddr?: string,
  contractDeployerAddr?: string
) => {
  const ethers = ghre.ethers;
  const provider = ethers.provider;
  // make sure to have an address for the Registry and Deployer. Param | deployments.jsom | ENV config
  contractRegistryAddr = (await getRegistry(true, undefined, contractRegistryAddr)) as string;
  const contractDeployer = (await getDeployer(
    true,
    deployer,
    contractDeployerAddr
  )) as IContractDeployer;
  const factory = ethers.getContractFactory(contractName);

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
 * @param signer signer used to sign upgrade transaction
 * @param args arguments to use in the initializer
 * @param contractRegistryAddr (optional) [ENV.DEPLOY.contractRegistry.address || defaultInDeployer] Address to the contract registry to be used
 * @param contractDeployerAddr (optional) [ENV.DEPLOY.contractDeployer.address] Address to the contract deployer to be used
 */
export const upgradeWithDeployer = async (
  contractName: string,
  signer: Wallet,
  args: unknown[],
  contractRegistryAddr?: string,
  contractDeployerAddr?: string
) => {
  const ethers = ghre.ethers;
  const provider = ethers.provider;
  // get contract factory for the contract to be upgraded
  const factory = ethers.getContractFactory(contractName);
  // make sure to have an address for the Registry and Deployer. Param | deployments.jsom | ENV config
  const contractRegistry = (await getRegistry(
    true,
    signer,
    contractRegistryAddr
  )) as IContractRegistry;
  const contractDeployer = (await getDeployer(
    true,
    signer,
    contractDeployerAddr
  )) as IContractDeployer;
  // get contract record before upgrade
  const getResponse = await contractRegistry.getRecordByName(contractName, signer.address);
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
    contractRegistry.address,
    getResponse.record.proxy,
    await provider.getCode(contractName),
    initData,
    new Uint8Array(),
    new Uint8Array(2),
    GAS_OPT
  );
};

//* Utils
export const VERSION_HEX_STRING_ZERO = new Uint8Array(2);

const versionHexStringToDot = async (versionHexString: string) => {
  return `${versionHexString.substring(2, 4)}.${versionHexString.substring(4, 6)}`;
};

const versionDotToHexString = async (versionDot: string) => {
  return `0x${versionDot.substring(0, 2)}${versionDot.substring(3, 5)}`;
};
/**
 * @param required (optional) [false] Check if a valid address return value is required or not
 * @returns The address of the ContractRegistry defined in the deployments file
 * or in the ENV/config variable
 */
const getRegistry = async (
  required = false,
  signerOrProvider?: Signer | Provider,
  address?: string
) => {
  if (!address || !isAddress(address)) {
    // get the actual network deployment
    const netDeployRes = await getActualNetDeployment(ghre);
    // if no deployment or not get network, leave undefined
    const netDeployment = netDeployRes.netDeployment ? netDeployRes.netDeployment : undefined;
    // if network deployment and contractRegistry deployed, use this address else the config one
    address =
      netDeployment && netDeployment.smartContracts.contractRegistry
        ? netDeployment.smartContracts.contractRegistry.address
        : ENV.DEPLOY.contractRegistry.address;
  }
  if (required && !isAddress(address)) {
    throw new Error("Contract Registry address not found and it's needed");
  }
  // create instance if signer
  if (signerOrProvider) {
    return IContractRegistry__factory.connect(address, signerOrProvider);
  } else {
    return address;
  }
};

/**
 * @param required (optional) [false] Check if a valid address return value is required or not
 * @returns The address of the ContractDeployer defined in the deployments file
 * or in the ENV/config variable
 */
const getDeployer = async (
  required = false,
  signerOrProvider?: Signer | Provider,
  address?: string
) => {
  if (!address || !isAddress(address)) {
    // get the actual network deployment
    const netDeployRes = await getActualNetDeployment(ghre);
    // if no deployment or not get network, leave undefined
    const netDeployment = netDeployRes.netDeployment ? netDeployRes.netDeployment : undefined;
    // if network deployment and contractDeployer deployed, use this address else the config one
    address =
      netDeployment && netDeployment.smartContracts.contractDeployer
        ? netDeployment.smartContracts.contractDeployer.address
        : ENV.DEPLOY.contractDeployer.address;
  }
  if (required && !isAddress(address)) {
    throw new Error("Contract Deployer address not found and it's needed");
  }
  // create instance if signer
  if (signerOrProvider) {
    return IContractDeployer__factory.connect(address, signerOrProvider);
  } else {
    return address;
  }
};
