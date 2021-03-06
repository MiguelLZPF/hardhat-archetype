/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "../../common";

export type ContractRecordStruct = {
  proxy: string;
  logic: string;
  admin: string;
  name: BytesLike;
  version: BytesLike;
  index: BigNumberish;
  logicCodeHash: BytesLike;
  rat: BigNumberish;
  uat: BigNumberish;
};

export type ContractRecordStructOutput = [
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  BigNumber,
  BigNumber
] & {
  proxy: string;
  logic: string;
  admin: string;
  name: string;
  version: string;
  index: number;
  logicCodeHash: string;
  rat: BigNumber;
  uat: BigNumber;
};

export interface ContractRegistryInterface extends utils.Interface {
  functions: {
    "changeRegisteredAdmin(address,address)": FunctionFragment;
    "getMyRecords()": FunctionFragment;
    "getRecord(address)": FunctionFragment;
    "getRecordByName(bytes32,address)": FunctionFragment;
    "getSystemRecords()": FunctionFragment;
    "initialize(address,bytes32,bytes2,bytes32)": FunctionFragment;
    "owner()": FunctionFragment;
    "register(address,address,bytes32,bytes2,bytes32)": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "update(address,address,bytes32,bytes2,bytes32)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "changeRegisteredAdmin"
      | "getMyRecords"
      | "getRecord"
      | "getRecordByName"
      | "getSystemRecords"
      | "initialize"
      | "owner"
      | "register"
      | "renounceOwnership"
      | "transferOwnership"
      | "update"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "changeRegisteredAdmin",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "getMyRecords",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "getRecord", values: [string]): string;
  encodeFunctionData(
    functionFragment: "getRecordByName",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "getSystemRecords",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [string, BytesLike, BytesLike, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "register",
    values: [string, string, BytesLike, BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "update",
    values: [string, string, BytesLike, BytesLike, BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "changeRegisteredAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getMyRecords",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getRecord", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getRecordByName",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getSystemRecords",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "register", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "update", data: BytesLike): Result;

  events: {
    "AdminChanged(address,address,bytes32)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "Registered(address,bytes32,bytes2,bytes32)": EventFragment;
    "Updated(address,bytes32,bytes2,bytes32)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Registered"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Updated"): EventFragment;
}

export interface AdminChangedEventObject {
  oldAdmin: string;
  newAdmin: string;
  name: string;
}
export type AdminChangedEvent = TypedEvent<
  [string, string, string],
  AdminChangedEventObject
>;

export type AdminChangedEventFilter = TypedEventFilter<AdminChangedEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface RegisteredEventObject {
  proxy: string;
  name: string;
  version: string;
  logicCodeHash: string;
}
export type RegisteredEvent = TypedEvent<
  [string, string, string, string],
  RegisteredEventObject
>;

export type RegisteredEventFilter = TypedEventFilter<RegisteredEvent>;

export interface UpdatedEventObject {
  proxy: string;
  name: string;
  version: string;
  logicCodeHash: string;
}
export type UpdatedEvent = TypedEvent<
  [string, string, string, string],
  UpdatedEventObject
>;

export type UpdatedEventFilter = TypedEventFilter<UpdatedEvent>;

export interface ContractRegistry extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ContractRegistryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    changeRegisteredAdmin(
      proxy: string,
      newAdmin: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getMyRecords(
      overrides?: CallOverrides
    ): Promise<[string[]] & { contractNames: string[] }>;

    getRecord(
      proxy: string,
      overrides?: CallOverrides
    ): Promise<
      [boolean, ContractRecordStructOutput] & {
        found: boolean;
        record: ContractRecordStructOutput;
      }
    >;

    getRecordByName(
      name: BytesLike,
      admin: string,
      overrides?: CallOverrides
    ): Promise<
      [boolean, ContractRecordStructOutput] & {
        found: boolean;
        record: ContractRecordStructOutput;
      }
    >;

    getSystemRecords(
      overrides?: CallOverrides
    ): Promise<[string[]] & { contractNames: string[] }>;

    initialize(
      proxy: string,
      name: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    register(
      proxy: string,
      logic: string,
      name: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    update(
      proxy: string,
      logic: string,
      actualName: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  changeRegisteredAdmin(
    proxy: string,
    newAdmin: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getMyRecords(overrides?: CallOverrides): Promise<string[]>;

  getRecord(
    proxy: string,
    overrides?: CallOverrides
  ): Promise<
    [boolean, ContractRecordStructOutput] & {
      found: boolean;
      record: ContractRecordStructOutput;
    }
  >;

  getRecordByName(
    name: BytesLike,
    admin: string,
    overrides?: CallOverrides
  ): Promise<
    [boolean, ContractRecordStructOutput] & {
      found: boolean;
      record: ContractRecordStructOutput;
    }
  >;

  getSystemRecords(overrides?: CallOverrides): Promise<string[]>;

  initialize(
    proxy: string,
    name: BytesLike,
    version: BytesLike,
    logicCodeHash: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  owner(overrides?: CallOverrides): Promise<string>;

  register(
    proxy: string,
    logic: string,
    name: BytesLike,
    version: BytesLike,
    logicCodeHash: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  renounceOwnership(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  update(
    proxy: string,
    logic: string,
    actualName: BytesLike,
    version: BytesLike,
    logicCodeHash: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    changeRegisteredAdmin(
      proxy: string,
      newAdmin: string,
      overrides?: CallOverrides
    ): Promise<void>;

    getMyRecords(overrides?: CallOverrides): Promise<string[]>;

    getRecord(
      proxy: string,
      overrides?: CallOverrides
    ): Promise<
      [boolean, ContractRecordStructOutput] & {
        found: boolean;
        record: ContractRecordStructOutput;
      }
    >;

    getRecordByName(
      name: BytesLike,
      admin: string,
      overrides?: CallOverrides
    ): Promise<
      [boolean, ContractRecordStructOutput] & {
        found: boolean;
        record: ContractRecordStructOutput;
      }
    >;

    getSystemRecords(overrides?: CallOverrides): Promise<string[]>;

    initialize(
      proxy: string,
      name: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    owner(overrides?: CallOverrides): Promise<string>;

    register(
      proxy: string,
      logic: string,
      name: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    update(
      proxy: string,
      logic: string,
      actualName: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "AdminChanged(address,address,bytes32)"(
      oldAdmin?: string | null,
      newAdmin?: string | null,
      name?: null
    ): AdminChangedEventFilter;
    AdminChanged(
      oldAdmin?: string | null,
      newAdmin?: string | null,
      name?: null
    ): AdminChangedEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): OwnershipTransferredEventFilter;

    "Registered(address,bytes32,bytes2,bytes32)"(
      proxy?: string | null,
      name?: null,
      version?: BytesLike | null,
      logicCodeHash?: BytesLike | null
    ): RegisteredEventFilter;
    Registered(
      proxy?: string | null,
      name?: null,
      version?: BytesLike | null,
      logicCodeHash?: BytesLike | null
    ): RegisteredEventFilter;

    "Updated(address,bytes32,bytes2,bytes32)"(
      proxy?: string | null,
      name?: null,
      version?: BytesLike | null,
      logicCodeHash?: BytesLike | null
    ): UpdatedEventFilter;
    Updated(
      proxy?: string | null,
      name?: null,
      version?: BytesLike | null,
      logicCodeHash?: BytesLike | null
    ): UpdatedEventFilter;
  };

  estimateGas: {
    changeRegisteredAdmin(
      proxy: string,
      newAdmin: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getMyRecords(overrides?: CallOverrides): Promise<BigNumber>;

    getRecord(proxy: string, overrides?: CallOverrides): Promise<BigNumber>;

    getRecordByName(
      name: BytesLike,
      admin: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getSystemRecords(overrides?: CallOverrides): Promise<BigNumber>;

    initialize(
      proxy: string,
      name: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    register(
      proxy: string,
      logic: string,
      name: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    update(
      proxy: string,
      logic: string,
      actualName: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    changeRegisteredAdmin(
      proxy: string,
      newAdmin: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getMyRecords(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getRecord(
      proxy: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRecordByName(
      name: BytesLike,
      admin: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getSystemRecords(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    initialize(
      proxy: string,
      name: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    register(
      proxy: string,
      logic: string,
      name: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    update(
      proxy: string,
      logic: string,
      actualName: BytesLike,
      version: BytesLike,
      logicCodeHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
