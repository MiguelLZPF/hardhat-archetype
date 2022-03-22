/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  ExampleOwnerv2,
  ExampleOwnerv2Interface,
} from "../ExampleOwnerv2";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnerSet",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "changeOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "newFunction",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50600080546201000033810262010000600160b01b0319909216919091178083556040519190046001600160a01b031691907f342827c97908e5e2f71151c08502a66d44b6f758e3ac2f1de95f02eb95f0a735908290a3610288806100766000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80631b28d63e146100515780638129fc1c14610064578063893d20e81461006e578063a6f9dae114610098575b600080fd5b6040514281526020015b60405180910390f35b61006c6100ab565b005b6000546201000090046001600160a01b03166040516001600160a01b03909116815260200161005b565b61006c6100a6366004610222565b610163565b600054610100900460ff16806100c4575060005460ff16155b61012c5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084015b60405180910390fd5b600054610100900460ff1615801561014e576000805461ffff19166101011790555b8015610160576000805461ff00191690555b50565b6000546201000090046001600160a01b031633146101b95760405162461bcd60e51b815260206004820152601360248201527221b0b63632b91034b9903737ba1037bbb732b960691b6044820152606401610123565b600080546040516001600160a01b03808516936201000090930416917f342827c97908e5e2f71151c08502a66d44b6f758e3ac2f1de95f02eb95f0a73591a3600080546001600160a01b03909216620100000262010000600160b01b0319909216919091179055565b60006020828403121561023457600080fd5b81356001600160a01b038116811461024b57600080fd5b939250505056fea26469706673582212204034c3250b5040d4ce8a05052b61a45c382d49a0f582cf6aec63b294d24f950564736f6c634300080a0033";

type ExampleOwnerv2ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ExampleOwnerv2ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ExampleOwnerv2__factory extends ContractFactory {
  constructor(...args: ExampleOwnerv2ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ExampleOwnerv2> {
    return super.deploy(overrides || {}) as Promise<ExampleOwnerv2>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ExampleOwnerv2 {
    return super.attach(address) as ExampleOwnerv2;
  }
  connect(signer: Signer): ExampleOwnerv2__factory {
    return super.connect(signer) as ExampleOwnerv2__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ExampleOwnerv2Interface {
    return new utils.Interface(_abi) as ExampleOwnerv2Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ExampleOwnerv2 {
    return new Contract(address, _abi, signerOrProvider) as ExampleOwnerv2;
  }
}