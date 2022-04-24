const KEYSTORE = {
  root: "keystore",
  default: {
    password: "PaSs_W0Rd",
    batchSize: 2,
  },
  test: {
    userNumber: 5,
  },
};

const NETWORK = {
  default: {
    solVersion: "0.8.13",
    evm: "berlin",
    gasLimit: 80000000,
    gasPrice: 0,
  },
  hardhat: {
    chainId: 69,
    url: "http://127.0.0.1:8545",
  },
  ganache: {
    chainId: 1337,
    url: "http://127.0.0.1:8545",
  },
};

export const GAS_OPT = {
  max: {
    gasLimit: NETWORK.default.gasLimit,
    gasPrice: NETWORK.default.gasPrice,
  },
};

let DEPLOY = {
  deploymentsPath: "deployments.json",
  proxyAdmin: {
    name: "ProxyAdmin",
    address: "0x8aC971aBdF7F3465E4786aA2E0d3A07f40316c9D",
  },
  contractRegistry: {
    name: "ContractRegistry",
    address: "0x931F46A080A3460467a0f991C70bb5033e546c3b"
  },
  contractDeployer: {
    name: "ContractDeployer",
    address: "0xC4De944749c06B9CD4e15C3AdC7A0D55ab173E24"
  },
};

const CONTRACT = {
  exampleOwner: {
    name: "ExampleOwner",
  },
};

export const ENV = {
  KEYSTORE,
  NETWORK,
  DEPLOY,
  CONTRACT,
};
