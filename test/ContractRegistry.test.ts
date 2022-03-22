import * as hre from "hardhat";
import { isAddress } from "@ethersproject/address";
import { Wallet } from "@ethersproject/wallet";
import { expect } from "chai";
import { step } from "mocha-steps";
import { ethers } from "hardhat";
import {
  ContractRegistry,
  ContractRegistry__factory,
  ExampleBallot,
  ExampleBallot__factory,
  ExampleOwner,
  ExampleOwner__factory,
  ExampleStorage,
  ExampleStorage__factory,
  IContractRegistry,
  ProxyAdmin,
  ProxyAdmin__factory,
  TransparentUpgradeableProxy__factory as TUP__factory,
} from "../typechain-types";
import { keccak256 } from "@ethersproject/keccak256";
import { randomBytes } from "crypto";
import {
  ADDR_ZERO,
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
import { Contract, ContractReceipt } from "ethers";

// Generic Constants
let PROVIDER: JsonRpcProvider;
let NETWORK: INetwork;

// Specific Constants
// -- revert Messages
const REVERT_MESSAGES = {
  initializable: { initialized: "Initializable: contract is already initialized" },
  register: {
    paramLogic: "Logic address is nedded",
    paramName: "Name must be unique or null",
    alreadyRegistered: "Contract already registered",
  },
  update: {
    notUpgradeable: "Contract not upgradeable",
    notRegistered: "Contract not registered",
    paramLogic: "Logic already updated",
    paramLogicCodeHash: "Logic hash already updated",
    versionLower: "New version must be higher",
    notAdmin: "You are not the admin",
  },
  changeAdmin: {
    paramAdmin: "New admin address needed",
    sameAdmin: "New admin address equals sender",
    notRegistered: "Contract not registered",
  },
};

let CONTRACT_REGISTRY_NAME_HEXSTRING: string;
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
let exampleBallot: ExampleBallot;
let exampleOwner: ExampleOwner;
let exampleStorage: ExampleStorage;
// -- upgrade
let proxyAdmin: ProxyAdmin;
// -- utils
let lastReceipt: ContractReceipt;
let lastRegisteredAt: number, lastUpdatedAt: number;
before("Initialize test environment and const/var", async () => {
  // set global HardhatRuntimeEnvironment to use the same provider in scripts
  ({ gProvider: PROVIDER, gCurrentNetwork: NETWORK } = await initHRE(hre));
  // Create random test wallets
  try {
    admin = Wallet.createRandom().connect(PROVIDER);
    for (let u = 0; u < ENV.KEYSTORE.test.userNumber; u++) {
      users[u] = Wallet.createRandom().connect(PROVIDER);
    }
    // Contract names as hexadecimal string with fixed length
    CONTRACT_REGISTRY_NAME_HEXSTRING = await stringToStringHexFixed(
      ENV.CONTRACT.contractRegistry.name,
      32
    );
    EXAMPLE_BALLOT_NAME_HEXSTRING = await stringToStringHexFixed(
      ENV.CONTRACT.exampleBallot.name,
      32
    );
    EXAMPLE_OWNER_NAME_HEXSTRING = await stringToStringHexFixed(ENV.CONTRACT.exampleOwner.name, 32);
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

describe("Contract Registry - Deploy and Initialization", async function () {
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
  });

  step("Should initialize contract", async () => {
    lastReceipt = await (
      await contractRegistry.initialize(
        ethers.constants.AddressZero,
        new Uint8Array(32),
        new Uint8Array(2),
        keccak256(ContractRegistry__factory.bytecode),
        GAS_OPT
      )
    ).wait();
    expect(lastReceipt).not.to.be.undefined;
    // update block timestamp
    lastRegisteredAt = lastUpdatedAt = await getTimeStamp(lastReceipt.blockHash);
  });

  step("Should check if ContractRegistry is registered", async () => {
    console.log(keccak256(contractRegistry.deployTransaction.data));
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

  it("Should FAIL initializing same contract again", async () => {
    await expect(
      contractRegistry.initialize(
        ethers.constants.AddressZero,
        new Uint8Array(32),
        new Uint8Array(2),
        keccak256(ContractRegistry__factory.bytecode),
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.initializable.initialized);
  });

  after("Wait for events", async () => {
    await delay(5000); // 2 sec
  });
});

describe("Contract Registry - Regular deployment use case", async () => {
  before("Init variables", async () => {
    // set default signer for this flow
    contractRegistry = contractRegistry.connect(users[0]);
  });
  before("Deploy example ballot contract", async () => {
    exampleBallot = await (
      await new ExampleBallot__factory(admin).deploy(
        [
          await stringToStringHexFixed("one", 32),
          await stringToStringHexFixed("two", 32),
          await stringToStringHexFixed("three", 32),
        ],
        GAS_OPT
      )
    ).deployed();
    expect(isAddress(exampleBallot.address)).to.be.true;
    console.log("Example Ballot deployed at: ", exampleBallot.address);
  });
  before("Deploy example owner contract", async () => {
    exampleOwner = await (await new ExampleOwner__factory(admin).deploy(GAS_OPT)).deployed();
    expect(isAddress(exampleOwner.address)).to.be.true;
    console.log("Example Owner deployed at: ", exampleOwner.address);
  });
  before("Deploy example storage contract", async () => {
    exampleStorage = await (await new ExampleStorage__factory(admin).deploy(GAS_OPT)).deployed();
    expect(isAddress(exampleStorage.address)).to.be.true;
    console.log("Example Storage deployed at: ", exampleStorage.address);
  });
  // REGISTER
  it("Should FAIL to register without logic address", async () => {
    await expect(
      contractRegistry.register(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero, //! <--
        CONTRACT_REGISTRY_NAME_HEXSTRING,
        VERSION_HEX_STRING_ZERO,
        keccak256(randomBytes(10)),
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.register.paramLogic);
  });
  it("Should FAIL to register without name", async () => {
    await expect(
      contractRegistry.register(
        ethers.constants.AddressZero,
        exampleStorage.address,
        await stringToStringHexFixed("", 32), //! <--
        VERSION_HEX_STRING_ZERO,
        keccak256(randomBytes(10)),
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.register.paramName);
  });
  it("Should FAIL to register with USED address", async () => {
    await expect(
      contractRegistry.register(
        ethers.constants.AddressZero,
        contractRegistry.address, //! <--
        ANOTHER_NAME_HEXSTRING, // another name is needed to trigger this revert
        VERSION_HEX_STRING_ZERO,
        keccak256(randomBytes(10)),
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.register.alreadyRegistered);
  });
  step("Should register Example Storage contract", async () => {
    const receipt = await (
      await contractRegistry.register(
        ethers.constants.AddressZero,
        exampleStorage.address,
        EXAMPLE_STORAGE_NAME_HEXSTRING,
        VERSION_HEX_STRING_ZERO,
        keccak256(ExampleStorage__factory.bytecode),
        GAS_OPT
      )
    ).wait();
    expect(receipt).not.to.be.undefined;
    // update block timestamp
    lastRegisteredAt = lastUpdatedAt = await getTimeStamp(receipt.blockHash);
  });
  // GET RECORD
  step("Should check if Example Storage is registered", async () => {
    // use contract object to use user0.address in call
    await checkRecord(contractRegistry as unknown as IContractRegistry, exampleStorage.address, {
      found: true,
      proxy: exampleStorage.address,
      logic: exampleStorage.address,
      admin: users[0].address,
      name: EXAMPLE_STORAGE_NAME_HEXSTRING,
      version: await versionDotToHexString("00.00"),
      logicCodeHash: keccak256(ExampleStorage__factory.bytecode),
      rat: lastRegisteredAt,
      uat: lastUpdatedAt,
    } as IExpectedRecord);
  });
  it("Should FAIL to register with USED name", async () => {
    await expect(
      contractRegistry.register(
        ethers.constants.AddressZero,
        exampleStorage.address,
        EXAMPLE_STORAGE_NAME_HEXSTRING, //! <--
        VERSION_HEX_STRING_ZERO,
        keccak256(randomBytes(10)),
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.register.paramName);
  });
  // UPDATE
  it("Should FAIL to update regular deployment", async () => {
    await expect(
      contractRegistry.update(
        exampleStorage.address, // Not used
        exampleStorage.address, // Not used
        EXAMPLE_STORAGE_NAME_HEXSTRING, // Not used
        await versionDotToHexString("00.00"), // Not used
        keccak256(CONTRACT_REGISTRY_NAME_HEXSTRING), // Not used
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.update.notUpgradeable);
  });
  // CHANGE REGISTERED ADMIN
  it("Should FAIL to change admin witout new admin address", async () => {
    await expect(
      contractRegistry.changeRegisteredAdmin(
        exampleStorage.address, // Not used
        ADDR_ZERO, //! <--
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.changeAdmin.paramAdmin);
  });
  it("Should FAIL to change admin to same admin", async () => {
    await expect(
      contractRegistry.changeRegisteredAdmin(
        exampleStorage.address,
        users[0].address, //! <--
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.changeAdmin.sameAdmin);
  });
  it("Should FAIL to change admin of unregistered contract", async () => {
    await expect(
      contractRegistry.changeRegisteredAdmin(
        users[0].address, //! <--
        users[1].address, // Not used
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.changeAdmin.notRegistered);
  });
  it("Should change admin of example contract", async () => {
    const receipt = await (
      await contractRegistry.changeRegisteredAdmin(
        exampleStorage.address,
        users[1].address,
        GAS_OPT
      )
    ).wait();
    expect(receipt).not.to.be.undefined;
  });
  // REGULAR LIST
  step("Should register Example Ballot contract", async () => {
    const receipt = await (
      await contractRegistry.register(
        ethers.constants.AddressZero,
        exampleBallot.address,
        EXAMPLE_BALLOT_NAME_HEXSTRING,
        VERSION_HEX_STRING_ZERO,
        keccak256(ExampleBallot__factory.bytecode),
        GAS_OPT
      )
    ).wait();
    expect(receipt).not.to.be.undefined;
    // update block timestamp
    lastRegisteredAt = lastUpdatedAt = await getTimeStamp(receipt.blockHash);
  });
  step("Should register Example Owner contract", async () => {
    const receipt = await (
      await contractRegistry.register(
        ethers.constants.AddressZero,
        exampleOwner.address,
        EXAMPLE_OWNER_NAME_HEXSTRING,
        VERSION_HEX_STRING_ZERO,
        keccak256(ExampleOwner__factory.bytecode),
        GAS_OPT
      )
    ).wait();
    expect(receipt).not.to.be.undefined;
    // update block timestamp
    lastRegisteredAt = lastUpdatedAt = await getTimeStamp(receipt.blockHash);
  });
  // GET LIST
  step("Should get system contracts", async () => {
    const namesByAdmin = await contractRegistry.connect(admin).getMyRecords();
    const namesBySystem = await contractRegistry.getSystemRecords();
    expect(namesByAdmin.length).to.equal(1).to.equal(namesBySystem.length);
    expect(namesByAdmin[0]).to.equal(CONTRACT_REGISTRY_NAME_HEXSTRING).to.equal(namesBySystem[0]);
  });
  step("Should get user 0 contracts", async () => {
    const names = await contractRegistry.getMyRecords();
    expect(names.length).to.equal(2);
    expect(names[0]).to.equal(EXAMPLE_BALLOT_NAME_HEXSTRING);
    expect(names[1]).to.equal(EXAMPLE_OWNER_NAME_HEXSTRING);
  });
  step("Should get user 1 contracts", async () => {
    const names = await contractRegistry.connect(users[1]).getMyRecords();
    expect(names.length).to.equal(1);
    expect(names[0]).to.equal(EXAMPLE_STORAGE_NAME_HEXSTRING);
  });
  after("Wait for events", async () => {
    await delay(5000); // 2 sec
  });
});

describe("Contract Registry - Upgradeable deployment use case", async () => {
  before("Init variables", async () => {
    // set default signer for this flow
    contractRegistry = contractRegistry.connect(users[2]);
  });

  before("Deploy example storage contract", async () => {
    proxyAdmin = await (await new ProxyAdmin__factory(users[2]).deploy(GAS_OPT)).deployed();
    const factory = await ethers.getContractFactory(ENV.CONTRACT.exampleStorage.name, users[2]);
    const logic = await (await factory.deploy(GAS_OPT)).deployed();
    const initData = factory.interface._encodeParams([], []);
    //* TUP - Transparent Upgradeable Proxy
    const tuProxy = await (
      await new TUP__factory(users[2]).deploy(logic.address, proxyAdmin.address, initData, GAS_OPT)
    ).deployed();
    exampleStorage = new Contract(
      tuProxy.address,
      ExampleStorage__factory.abi,
      users[2]
    ) as ExampleStorage;
    expect(isAddress(exampleStorage.address)).to.be.true;
    console.log("Example Storage deployed at: ", exampleStorage.address);
  });
  // REGISTER
  step("Should register Example Storage upgradeable contract", async () => {
    const receipt = await (
      await contractRegistry.register(
        exampleStorage.address,
        await proxyAdmin.getProxyImplementation(exampleStorage.address),
        EXAMPLE_STORAGE_NAME_HEXSTRING,
        VERSION_HEX_STRING_ZERO,
        keccak256(ExampleStorage__factory.bytecode),
        GAS_OPT
      )
    ).wait();
    expect(receipt).not.to.be.undefined;
    // update block timestamp
    lastRegisteredAt = lastUpdatedAt = await getTimeStamp(receipt.blockHash);
  });
  // GET RECORD
  step("Should check if Example Storage is registered", async () => {
    // use contract object to use user0.address in call
    await checkRecord(contractRegistry as unknown as IContractRegistry, exampleStorage.address, {
      found: true,
      proxy: exampleStorage.address,
      logic: await proxyAdmin.getProxyImplementation(exampleStorage.address),
      admin: users[2].address,
      name: EXAMPLE_STORAGE_NAME_HEXSTRING,
      version: await versionDotToHexString("00.00"),
      logicCodeHash: keccak256(ExampleStorage__factory.bytecode),
      rat: lastRegisteredAt,
      uat: lastUpdatedAt,
    } as IExpectedRecord);
  });
  // UPDATE
  it("Should FAIL to update unregistered deployment", async () => {
    await expect(
      contractRegistry.update(
        await proxyAdmin.getProxyImplementation(exampleStorage.address), //! <--
        ADDR_ZERO,
        NAME_HEXSTRING_ZERO,
        await versionDotToHexString("01.00"),
        keccak256(ExampleStorage__factory.bytecode), // Not used
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.update.notRegistered);
  });
  it("Should FAIL to update with same logic address", async () => {
    await expect(
      contractRegistry.update(
        exampleStorage.address,
        await proxyAdmin.getProxyImplementation(exampleStorage.address), //! <--
        NAME_HEXSTRING_ZERO, // Not used
        await versionDotToHexString("01.00"), // Not used
        keccak256(ExampleStorage__factory.bytecode), // Not used
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.update.paramLogic);
  });
  it("Should FAIL to update with same logic code hash", async () => {
    // deploy a new logic/implementation contract
    const factory = await ethers.getContractFactory(ENV.CONTRACT.exampleStorage.name, users[2]);
    const logic = await (await factory.deploy(GAS_OPT)).deployed();
    // change logic reference in proxyAdmin
    await proxyAdmin.upgrade(exampleStorage.address, logic.address, GAS_OPT);
    await expect(
      contractRegistry.update(
        exampleStorage.address,
        await proxyAdmin.getProxyImplementation(exampleStorage.address),
        NAME_HEXSTRING_ZERO, // Not used
        await versionDotToHexString("01.00"), // Not used
        keccak256(ExampleStorage__factory.bytecode), //! <--
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.update.paramLogicCodeHash);
  });
  it("Should FAIL to update with same version", async () => {
    await expect(
      contractRegistry.update(
        exampleStorage.address,
        await proxyAdmin.getProxyImplementation(exampleStorage.address),
        NAME_HEXSTRING_ZERO, // Not used
        await versionDotToHexString("00.00"),
        keccak256(ExampleStorage__factory.bytecode + "012345"), // Not used
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.update.versionLower);
  });
  it("Should FAIL to update from other 'admin'", async () => {
    await expect(
      contractRegistry.connect(users[0]).update(
        //! <--
        exampleStorage.address,
        await proxyAdmin.getProxyImplementation(exampleStorage.address),
        NAME_HEXSTRING_ZERO,
        await versionDotToHexString("01.00"),
        keccak256(ExampleStorage__factory.bytecode + "012345"),
        GAS_OPT
      )
    ).to.be.revertedWith(REVERT_MESSAGES.update.notAdmin);
  });
  step("Should update Example Storage upgradeable contract", async () => {
    const receipt = await (
      await contractRegistry.update(
        exampleStorage.address,
        await proxyAdmin.getProxyImplementation(exampleStorage.address),
        NAME_HEXSTRING_ZERO,
        await versionDotToHexString("01.00"),
        keccak256(ExampleStorage__factory.bytecode + "012345"),
        GAS_OPT
      )
    ).wait();
    expect(receipt).not.to.be.undefined;
    // update block timestamp
    lastUpdatedAt = await getTimeStamp(receipt.blockHash);
  });
  // GET RECORD
  step("Should check if Example Storage is updated", async () => {
    // use contract object to use user0.address in call
    await checkRecord(contractRegistry as unknown as IContractRegistry, exampleStorage.address, {
      found: true,
      proxy: exampleStorage.address,
      logic: await proxyAdmin.getProxyImplementation(exampleStorage.address),
      admin: users[2].address,
      name: EXAMPLE_STORAGE_NAME_HEXSTRING,
      version: await versionDotToHexString("01.00"),
      logicCodeHash: keccak256(ExampleStorage__factory.bytecode + "012345"),
      rat: lastRegisteredAt,
      uat: lastUpdatedAt,
    } as IExpectedRecord);
  });
  after("Wait for events", async () => {
    await delay(5000); // 2 sec
  });
});
