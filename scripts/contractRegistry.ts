import { Provider } from "@ethersproject/abstract-provider";
import { expect } from "chai";
import { Contract } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { ContractRegistry__factory, IContractRegistry } from "../typechain-types";
import { ContractRecordStructOutput } from "../typechain-types/ContractRegistry";
import { ADDR_ZERO, ghre } from "./utils";

export interface IExpectedRecord {
  found?: boolean;
  proxy?: string; // use as ID too
  logic?: string;
  admin?: string;
  name?: string; // must be unique OPT DEF: 0x00...00
  version?: string;
  logicCodeHash?: string; // OPT def: 0x00...00
  rat?: number; // Registered AT
  uat?: number; // Updated AT
}

/**
 * Helper test function to check record of a VP
 * @param contractRegistry VPRegistry SC address
 * @param recordContract VP hash that identifies the VP
 * @param expected expected parameters to compare with
 * @param provider (optional) provider to use
 */
export const checkRecord = async (
  contractRegistry: string | IContractRegistry,
  recordContract: string,
  expected: IExpectedRecord,
  provider?: Provider
) => {
  // if no provider as parameter, use the hardhat one
  provider = provider ? provider : ghre.ethers.provider;
  // if is an address create contract
  contractRegistry =
    typeof contractRegistry == "string"
      ? (new Contract(
          contractRegistry,
          ContractRegistry__factory.abi,
          provider
        ) as IContractRegistry)
      : contractRegistry;

  // Get record by name or proxy address
  let result: [boolean, ContractRecordStructOutput] & {
    found: boolean;
    record: ContractRecordStructOutput;
  };
  if (isAddress(recordContract)) {
    result = await contractRegistry.getRecord(recordContract);
  } else {
    result = await contractRegistry.getRecordByName(recordContract, ADDR_ZERO);
  }

  expected.found ? expect(result.found).to.equal(expected.found) : undefined;
  expect(result.record.proxy.length).to.equal(20 * 2 + 2);
  expected.proxy ? expect(result.record.proxy).to.equal(expected.proxy) : undefined;
  expect(result.record.logic.length).to.equal(20 * 2 + 2);
  expected.logic ? expect(result.record.logic).to.equal(expected.logic) : undefined;
  expect(result.record.admin.length).to.equal(20 * 2 + 2);
  expected.admin ? expect(result.record.admin).to.equal(expected.admin) : undefined;
  expect(result.record.name.length).to.equal(32 * 2 + 2);
  expected.name ? expect(result.record.name).to.equal(expected.name) : undefined;
  expect(result.record.version.length).to.equal(2 * 2 + 2);
  expected.version ? expect(result.record.version).to.equal(expected.version) : undefined;
  expect(result.record.logicCodeHash.length).to.equal(32 * 2 + 2);
  expected.logicCodeHash
    ? expect(result.record.logicCodeHash).to.equal(expected.logicCodeHash)
    : undefined;
  expected.rat ? expect(result.record.rat).to.equal(expected.rat) : undefined;
  expected.uat ? expect(result.record.uat).to.equal(expected.uat) : undefined;
};

export const versionHexStringToDot = async (versionHexString: string) => {
  return `${versionHexString.substring(2, 4)}.${versionHexString.substring(4, 6)}`;
};

export const versionDotToHexString = async (versionDot: string) => {
  return `0x${versionDot.substring(0, 2)}${versionDot.substring(3, 5)}`;
};
