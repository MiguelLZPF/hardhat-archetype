import * as hre from "hardhat";
import { isAddress } from "@ethersproject/address";
import { Wallet } from "@ethersproject/wallet";
import { expect } from "chai";
import { step } from "mocha-steps";
import { ethers } from "hardhat";
import {
  ContractDeployer,
  ContractDeployer__factory,
  ContractRegistry,
  ContractRegistry__factory,
  ExampleBallot,
  ExampleOwner,
  ExampleOwnerV2__factory,
  ExampleOwner__factory,
  ExampleStorage,
  IContractRegistry,
} from "../typechain-types";
import { keccak256 } from "@ethersproject/keccak256";
import {
  delay,
  GAS_OPT,
  getTimeStamp,
  initHRE,
  stringToStringHexFixed,
} from "../scripts/utils";
import { INetwork } from "../models/Deploy";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ENV } from "../configuration";
import {
  IExpectedRecord,
  checkRecord,
  versionHexStringToDot,
  versionDotToHexString,
} from "../scripts/contractRegistry";
import { Contract } from "ethers";

// Generic Constants
let PROVIDER: JsonRpcProvider;
let NETWORK: INetwork;

// Specific Constants
// -- revert Messages
const REVERT_MESSAGES = {
  initializable: { initialized: "Initializable: contract is already initialized" },
  erc1967: { paramBytecode: "ERC1967: new implementation is not a contract" },
};

let CONTRACT_REGISTRY_NAME_HEXSTRING: string;
let CONTRACT_DEPLOYER_NAME_HEXSTRING: string;
let EXAMPLE_BALLOT_NAME_HEXSTRING: string;
let EXAMPLE_OWNER_NAME_HEXSTRING: string;
let EXAMPLE_STORAGE_NAME_HEXSTRING: string;
let ANOTHER_NAME_HEXSTRING: string;
const NAME_HEXSTRING_ZERO = new Uint8Array(32);
const VERSION_HEX_STRING_ZERO = new Uint8Array(2);

// Specific Variables
// -- Wallets
let admin: Wallet;
let users: Wallet[] = [];
// -- Contracts
let contractRegistry: ContractRegistry;
let contractDeployer: ContractDeployer;
let exampleBallot: ExampleBallot;
let exampleOwner: ExampleOwner;
let exampleStorage: ExampleStorage;
// -- utils
let lastRegisteredAt: number, lastUpdatedAt: number;
before("Initialize test environment and const/var", async () => {
  // set global HardhatRuntimeEnvironment to use the same provider in scripts
  ({ gProvider: PROVIDER, gCurrentNetwork: NETWORK } = await initHRE(hre));
  // Create random test wallets
  try {
    admin = Wallet.createRandom().connect(PROVIDER);
    for (let u = 0; u < ENV.KEYSTORE.test.userNumber; u++) {
      users[u] = Wallet.createRandom().connect(PROVIDER);
      console.log(`
        User N=${u}: 
          - Address: ${users[u].address},
          - Public Key: ${users[u].publicKey},
          - Private Key: ${users[u].privateKey}
      `);
    }
    // Contract names as hexadecimal string with fixed length
    CONTRACT_REGISTRY_NAME_HEXSTRING = await stringToStringHexFixed(
      ENV.CONTRACT.contractRegistry.name,
      32
    );
    CONTRACT_DEPLOYER_NAME_HEXSTRING = await stringToStringHexFixed(
      ENV.CONTRACT.contractDeployer.name,
      32
    );
    EXAMPLE_BALLOT_NAME_HEXSTRING = await stringToStringHexFixed(
      ENV.CONTRACT.exampleBallot.name,
      32
    );
    EXAMPLE_OWNER_NAME_HEXSTRING = await stringToStringHexFixed(
      ENV.CONTRACT.exampleOwner.name,
      32
    );
    EXAMPLE_STORAGE_NAME_HEXSTRING = await stringToStringHexFixed(
      ENV.CONTRACT.exampleStorage.name,
      32
    );
    ANOTHER_NAME_HEXSTRING = await stringToStringHexFixed(
      ENV.CONTRACT.exampleBallot.name + "_BAD!!!!",
      32
    );
  } catch (error) {
    throw new Error(`Error creating or reading wallets from keystore. ${error}`);
  }
});

describe("Contract Deployer - Deploy and Initialization", async function () {
  before("Init variables", async () => {
    lastRegisteredAt = await getTimeStamp();
    lastUpdatedAt = await getTimeStamp();
  });

  step("Should deploy contract registry", async () => {
    contractRegistry = await (
      await new ContractRegistry__factory(admin).deploy(GAS_OPT)
    ).deployed();
    expect(isAddress(contractRegistry.address)).to.be.true;
    console.log("Contract Registry deployed at: ", contractRegistry.address);
  });

  step("Should deploy contract deployer", async () => {
    contractDeployer = await (
      await new ContractDeployer__factory(admin).deploy(GAS_OPT)
    ).deployed();
    expect(isAddress(contractDeployer.address)).to.be.true;
    console.log("Contract Deployer deployed at: ", contractDeployer.address);
  });

  it("Should subscribe contract EVENTS", async () => {
    // Contract Registered
    contractRegistry.on(
      contractRegistry.filters.Registered(),
      async (proxy, name, version, logicCodeHash, event) => {
        const nameString = Buffer.from(name.substring(2), "hex").toString("utf-8");
        const versionStr = await versionHexStringToDot(version);
        const blockTime = (await event.getBlock()).timestamp;
        console.log(
          `New Contract Registered: { Proxy: ${proxy}, Name: ${nameString}, Version: ${versionStr}, Logic code hash: ${logicCodeHash}} at Block ${
            event.blockNumber
          } (${event.blockHash}) timestamp: ${new Date(
            blockTime * 1000
          ).toISOString()} (${blockTime})`
        );
      }
    );
    // Contract Updated
    contractRegistry.on(
      contractRegistry.filters.Updated(),
      async (proxy, name, version, logicCodeHash, event) => {
        const nameString = Buffer.from(name.substring(2), "hex").toString("utf-8");
        const versionStr = await versionHexStringToDot(version);
        const blockTime = (await event.getBlock()).timestamp;
        console.log(
          `New Contract Updated: { Proxy: ${proxy}, Name: ${nameString}, Version: ${versionStr}, Logic code hash: ${logicCodeHash}} at Block ${
            event.blockNumber
          } (${event.blockHash}) timestamp: ${new Date(
            blockTime * 1000
          ).toISOString()} (${blockTime})`
        );
      }
    );
    // Admin Changed
    contractRegistry.on(
      contractRegistry.filters.AdminChanged(),
      async (oldAdmin, newAdmin, name, event) => {
        const nameString = Buffer.from(name.substring(2), "hex").toString("utf-8");
        const blockTime = (await event.getBlock()).timestamp;
        console.log(
          `New Admin Changed: { Old Admin: ${oldAdmin}, New Admin: ${newAdmin}, Record Name: ${nameString}} at Block ${
            event.blockNumber
          } (${event.blockHash}) timestamp: ${new Date(
            blockTime * 1000
          ).toISOString()} (${blockTime})`
        );
      }
    );
    // DEPLOYER
    // Contract Deployed
    contractDeployer.on(
      contractDeployer.filters.ContractDeployed(),
      async (registry, proxy, name, version, logicCodeHash, event) => {
        const nameString = Buffer.from(name.substring(2), "hex").toString("utf-8");
        const versionStr = await versionHexStringToDot(version);
        const blockTime = (await event.getBlock()).timestamp;
        console.log(
          `New Contract Deployed: { Registry: ${registry}, Proxy: ${proxy}, Name: ${nameString}, Version: ${versionStr}, Logic code hash: ${logicCodeHash}} at Block ${
            event.blockNumber
          } (${event.blockHash}) timestamp: ${new Date(
            blockTime * 1000
          ).toISOString()} (${blockTime})`
        );
      }
    );
    // Contract Upgraded
    contractDeployer.on(
      contractDeployer.filters.ContractUpgraded(),
      async (registry, proxy, version, logicCodeHash, event) => {
        const versionStr = await versionHexStringToDot(version);
        const blockTime = (await event.getBlock()).timestamp;
        console.log(
          `New Contract Upgraded: { Registry: ${registry}, Proxy: ${proxy}, Version: ${versionStr}, Logic code hash: ${logicCodeHash}} at Block ${
            event.blockNumber
          } (${event.blockHash}) timestamp: ${new Date(
            blockTime * 1000
          ).toISOString()} (${blockTime})`
        );
      }
    );
    // Catched Errors
    /* const errorMap = new Map<number, string>([
      [0, "Error"],
      [1, "Panic"],
      [2, "Other"],
    ]);
    contractDeployer.on(
      contractDeployer.filters.CatchedError(),
      async (method, type, message, lowLevelData, errorCode, event) => {
        const decodedData = defaultAbiCoder.decode(["string"], lowLevelData);
        const blockTime = (await event.getBlock()).timestamp;
        console.log(
          `Cathced Error: { SC Method: ${method}, Type error: ${errorMap.get(
            type
          )}, Message: ${message}, LowLevelData: ${decodedData}, ErrorCode: ${errorCode}} at Block ${
            event.blockNumber
          } (${event.blockHash}) timestamp: ${new Date(
            blockTime * 1000
          ).toISOString()} (${blockTime})`
        );
      }
    ); */
  });

  step("Should initialize registry contract", async () => {
    const receipt = await (
      await contractRegistry.initialize(
        ethers.constants.AddressZero,
        new Uint8Array(32),
        new Uint8Array(2),
        keccak256(ContractRegistry__factory.bytecode),
        GAS_OPT
      )
    ).wait();
    expect(receipt).not.to.be.undefined;
    // update block timestamp
    lastRegisteredAt = lastUpdatedAt = await getTimeStamp(receipt.blockHash);
  });
  // No need to initialize Contract Deployer, it is not upgradeable

  step("Should check if ContractRegistry is registered", async () => {
    await checkRecord(contractRegistry.address, contractRegistry.address, {
      found: true,
      proxy: contractRegistry.address,
      logic: contractRegistry.address,
      admin: admin.address,
      name: CONTRACT_REGISTRY_NAME_HEXSTRING,
      version: await versionDotToHexString("00.00"),
      logicCodeHash: keccak256(ContractRegistry__factory.bytecode),
      rat: lastRegisteredAt,
      uat: lastUpdatedAt,
    } as IExpectedRecord);
  });

  step("Should register Contract Deployer in registry contract", async () => {
    const receipt = await (
      await contractRegistry.register(
        ethers.constants.AddressZero,
        contractDeployer.address,
        CONTRACT_DEPLOYER_NAME_HEXSTRING,
        VERSION_HEX_STRING_ZERO,
        keccak256(ContractDeployer__factory.bytecode),
        GAS_OPT
      )
    ).wait();
    expect(receipt).not.to.be.undefined;
    // update block timestamp
    lastRegisteredAt = lastUpdatedAt = await getTimeStamp(receipt.blockHash);
  });
  step("Should check if Contract Deployer is registered", async () => {
    // use contract object to use user0.address in call
    await checkRecord(contractRegistry as unknown as IContractRegistry, contractDeployer.address, {
      found: true,
      proxy: contractDeployer.address,
      logic: contractDeployer.address,
      admin: admin.address,
      name: CONTRACT_DEPLOYER_NAME_HEXSTRING,
      version: await versionDotToHexString("00.00"),
      logicCodeHash: keccak256(ContractDeployer__factory.bytecode),
      rat: lastRegisteredAt,
      uat: lastUpdatedAt,
    } as IExpectedRecord);
  });

  after("Wait for events", async () => {
    await delay(5000); // 2 sec
  });
});

describe("Contract Deployer - Use case", async () => {
  before("Init variables", async () => {
    // set default signer for this flow
    contractRegistry = contractRegistry.connect(users[0]);
    // -- change contract deployer owner
    const receipt = await (
      await contractDeployer.transferOwnership(users[0].address, GAS_OPT)
    ).wait();
    expect(receipt).not.be.undefined;
    contractDeployer = contractDeployer.connect(users[0]);
  });
  //* DEPLOY
  it("Should FAIL to deploy without bytecode", async () => {
    await expect(
      contractDeployer.deployContract(
        contractRegistry.address,
        "0x0000000000000000000000", //! <--
        new Uint8Array(0),
        new Uint8Array(32),
        EXAMPLE_OWNER_NAME_HEXSTRING,
        VERSION_HEX_STRING_ZERO,
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.erc1967.paramBytecode);
  });
  step("Should deploy Example Owner contract", async () => {
    const receipt = await (
      await contractDeployer.deployContract(
        contractRegistry.address,
        ExampleOwner__factory.bytecode,
        new Uint8Array(0),
        new Uint8Array(32),
        EXAMPLE_OWNER_NAME_HEXSTRING,
        VERSION_HEX_STRING_ZERO,
        GAS_OPT
      )
    ).wait();
    expect(receipt).not.to.be.undefined;
    // update block timestamp
    lastRegisteredAt = lastUpdatedAt = await getTimeStamp(receipt.blockHash);
    // save contract instance
    exampleOwner = new Contract(
      (
        await contractRegistry.getRecordByName(EXAMPLE_OWNER_NAME_HEXSTRING, users[0].address)
      ).record.proxy,
      ExampleOwner__factory.abi,
      users[0]
    ) as ExampleOwner;
    //console.log(await contractRegistry.getRecordByName(EXAMPLE_OWNER_NAME_HEXSTRING, users[0].address));
  });
  step("Should check if Example Owner is registered", async () => {
    // use contract object to use user0.address in call
    await checkRecord(contractRegistry as unknown as IContractRegistry, exampleOwner.address, {
      found: true,
      proxy: exampleOwner.address,
      logic: await contractDeployer.callStatic.getProxyImplementation(exampleOwner.address),
      admin: users[0].address,
      name: EXAMPLE_OWNER_NAME_HEXSTRING,
      version: await versionDotToHexString("00.00"),
      logicCodeHash: keccak256(ExampleOwner__factory.bytecode),
      rat: lastRegisteredAt,
      uat: lastUpdatedAt,
    } as IExpectedRecord);
  });

  //* Upgrade
  step("Should upgrade Example Owner contract", async () => {
    let receipt = await (
      await contractRegistry.changeRegisteredAdmin(
        exampleOwner.address,
        contractDeployer.address,
        GAS_OPT
      )
    ).wait();
    //console.log(await contractRegistry.getRecordByName(EXAMPLE_OWNER_NAME_HEXSTRING, contractDeployer.address));
    receipt = await (
      await contractDeployer.upgradeContract(
        contractRegistry.address,
        exampleOwner.address,
        ExampleOwnerV2__factory.bytecode,
        new Uint8Array(0),
        new Uint8Array(32),
        await versionDotToHexString("01.00"),
        GAS_OPT
      )
    ).wait();
    expect(receipt).not.to.be.undefined;
    // update block timestamp
    lastUpdatedAt = await getTimeStamp(receipt.blockHash);
  });
  step("Should check if Example Owner is upgraded", async () => {
    // use contract object to use user0.address in call
    await checkRecord(contractRegistry as unknown as IContractRegistry, exampleOwner.address, {
      found: true,
      proxy: exampleOwner.address,
      logic: await contractDeployer.callStatic.getProxyImplementation(exampleOwner.address),
      admin: users[0].address,
      name: EXAMPLE_OWNER_NAME_HEXSTRING,
      version: await versionDotToHexString("01.00"),
      logicCodeHash: keccak256(ExampleOwnerV2__factory.bytecode),
      rat: lastRegisteredAt,
      uat: lastUpdatedAt,
    } as IExpectedRecord);
  });

  after("Wait for events", async () => {
    await delay(5000); // 2 sec
  });
});
