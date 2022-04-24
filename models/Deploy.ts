import { ENV } from "../configuration";

export interface INetwork {
  chainId: number;
  name: string;
  url: string;
}

export const networks = new Map<number | undefined, INetwork>([
  [
    undefined,
    { chainId: ENV.NETWORK.hardhat.chainId, name: "hardhat", url: ENV.NETWORK.hardhat.url },
  ], // Default hardhat
  [0, { chainId: ENV.NETWORK.hardhat.chainId, name: "hardhat", url: ENV.NETWORK.hardhat.url }], // Default hardhat
  [
    ENV.NETWORK.hardhat.chainId,
    { chainId: ENV.NETWORK.hardhat.chainId, name: "hardhat", url: ENV.NETWORK.hardhat.url },
  ],
  [
    ENV.NETWORK.ganache.chainId,
    { chainId: ENV.NETWORK.hardhat.chainId, name: "ganache", url: ENV.NETWORK.ganache.url },
  ],
]);

export interface IRegularDeployment {
  address: string;
  contractName?: string;
  deployTxHash?: string;
  deployTimestamp?: Date | number | string;
  byteCodeHash?: string;
}

export interface IUpgradeDeployment {
  admin: string;
  proxy: string; // or storage
  logic: string; // or implementation
  contractName?: string;
  proxyTxHash?: string;
  logicTxHash?: string;
  deployTimestamp?: Date | number | string;
  upgradeTimestamp?: Date | number | string;
  byteCodeHash?: string;
}

export interface INetworkDeployment {
  network: {
    name: string;
    chainId: number | string;
  };
  smartContracts: {
    contractRegistry?: IRegularDeployment | IUpgradeDeployment;
    contractDeployer?: IRegularDeployment | IUpgradeDeployment;
    proxyAdmins?: IRegularDeployment[];
    contracts: (IUpgradeDeployment | IRegularDeployment)[];
  };
}
