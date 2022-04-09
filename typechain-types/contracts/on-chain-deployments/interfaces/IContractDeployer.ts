/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
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
} from "../../../common";

export interface IContractDeployerInterface extends utils.Interface {
  functions: {
    "deployContract(address,bytes,bytes,bytes32,bytes32,bytes2)": FunctionFragment;
    "initialize(address)": FunctionFragment;
    "upgradeContract(address,address,bytes,bytes,bytes32,bytes2)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic: "deployContract" | "initialize" | "upgradeContract"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "deployContract",
    values: [string, BytesLike, BytesLike, BytesLike, BytesLike, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "initialize", values: [string]): string;
  encodeFunctionData(
    functionFragment: "upgradeContract",
    values: [string, string, BytesLike, BytesLike, BytesLike, BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "deployContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "upgradeContract",
    data: BytesLike
  ): Result;

  events: {
    "ContractDeployed(address,address,bytes32,bytes2,bytes32)": EventFragment;
    "ContractUpgraded(address,address,bytes2,bytes32)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "ContractDeployed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ContractUpgraded"): EventFragment;
}

export interface ContractDeployedEventObject {
  registry: string;
  proxy: string;
  name: string;
  version: string;
  logicCodeHash: string;
}
export type ContractDeployedEvent = TypedEvent<
  [string, string, string, string, string],
  ContractDeployedEventObject
>;

export type ContractDeployedEventFilter =
  TypedEventFilter<ContractDeployedEvent>;

export interface ContractUpgradedEventObject {
  registry: string;
  proxy: string;
  version: string;
  logicCodeHash: string;
}
export type ContractUpgradedEvent = TypedEvent<
  [string, string, string, string],
  ContractUpgradedEventObject
>;

export type ContractUpgradedEventFilter =
  TypedEventFilter<ContractUpgradedEvent>;

export interface IContractDeployer extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IContractDeployerInterface;

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
    deployContract(
      registry: string,
      bytecode: BytesLike,
      data: BytesLike,
      salt: BytesLike,
      name: BytesLike,
      version: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    initialize(
      registry: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    upgradeContract(
      registry: string,
      proxy: string,
      bytecode: BytesLike,
      data: BytesLike,
      salt: BytesLike,
      version: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  deployContract(
    registry: string,
    bytecode: BytesLike,
    data: BytesLike,
    salt: BytesLike,
    name: BytesLike,
    version: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  initialize(
    registry: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  upgradeContract(
    registry: string,
    proxy: string,
    bytecode: BytesLike,
    data: BytesLike,
    salt: BytesLike,
    version: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    deployContract(
      registry: string,
      bytecode: BytesLike,
      data: BytesLike,
      salt: BytesLike,
      name: BytesLike,
      version: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    initialize(registry: string, overrides?: CallOverrides): Promise<void>;

    upgradeContract(
      registry: string,
      proxy: string,
      bytecode: BytesLike,
      data: BytesLike,
      salt: BytesLike,
      version: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "ContractDeployed(address,address,bytes32,bytes2,bytes32)"(
      registry?: null,
      proxy?: string | null,
      name?: null,
      version?: BytesLike | null,
      logicCodeHash?: null
    ): ContractDeployedEventFilter;
    ContractDeployed(
      registry?: null,
      proxy?: string | null,
      name?: null,
      version?: BytesLike | null,
      logicCodeHash?: null
    ): ContractDeployedEventFilter;

    "ContractUpgraded(address,address,bytes2,bytes32)"(
      registry?: string | null,
      proxy?: string | null,
      version?: BytesLike | null,
      logicCodeHash?: null
    ): ContractUpgradedEventFilter;
    ContractUpgraded(
      registry?: string | null,
      proxy?: string | null,
      version?: BytesLike | null,
      logicCodeHash?: null
    ): ContractUpgradedEventFilter;
  };

  estimateGas: {
    deployContract(
      registry: string,
      bytecode: BytesLike,
      data: BytesLike,
      salt: BytesLike,
      name: BytesLike,
      version: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    initialize(
      registry: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    upgradeContract(
      registry: string,
      proxy: string,
      bytecode: BytesLike,
      data: BytesLike,
      salt: BytesLike,
      version: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    deployContract(
      registry: string,
      bytecode: BytesLike,
      data: BytesLike,
      salt: BytesLike,
      name: BytesLike,
      version: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    initialize(
      registry: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    upgradeContract(
      registry: string,
      proxy: string,
      bytecode: BytesLike,
      data: BytesLike,
      salt: BytesLike,
      version: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}