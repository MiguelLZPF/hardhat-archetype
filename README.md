# 1. Standard Contract Registry project - SCR

Before run anything, make sure you run `npm install`.

This project aims to provide an easy to use On-Blockchain Standard Contract Registry that can be used to manage multiple groups of smart contracts and it's addresses. The main contract is the ContractRegistry, where the actual registry is stored. This contract is supported by an optional ContractDeployer, that makes it easier the deployment and upgrade of upgradeable contracts, all On-Chain using Create2.

The structure follows a Hardhat project environment using ethers, waffle and chai. It also use typescript and generates smart contract types using typechain. The --network parameter refers to the network to be used defined in the [hardhat config file](./hardhat.config.ts).

- [1. Blockchain Services Smart Contracts project](#1-blockchain-services-smart-contracts-project)
  - [1.1. Environmental variables / constants](#11-environmental-variables--constants)
  - [1.2. Manage Hardware Wallets](#12-manage-hardware-wallets)
    - [1.2.1. Relevant Constants](#121-relevant-constants)
    - [1.2.2. Generate one Random Wallet](#122-generate-one-random-wallet)
    - [1.2.3. Generate Batch Wallets](#123-generate-batch-wallets)
    - [1.2.4. Generate Wallet from mnemonic phrase](#124-generate-wallet-from-mnemonic-phrase)
    - [1.2.5. Get Wallet mnemonic phrase](#125-get-wallet-mnemonic-phrase)
    - [1.2.6. Get Wallet Information](#126-get-wallet-information)
  - [1.3. Deploy Smart contracts](#13-deploy-smart-contracts)
    - [1.3.1. Relevant Constants](#131-relevant-constants)
    - [1.3.2. Regular Deployment](#132-regular-deployment)
    - [1.3.3. Upgradeable deployment](#133-upgradeable-deployment)
    - [1.3.4. Upgrade deployed Smart Contract](#134-upgrade-deployed-smart-contract)
  - [1.4. Unit Test](#14-unit-test)
    - [1.4.1. Run Certification test](#141-run-certification-test)

## 1.1. Configuration file constants

Environmental variables and constants are defined in the configuration.ts file. Simple and easy to use due to it aims to a development local envionment.

## 1.2. Manage Hardware Wallets

Automatize the management of hardware wallets using Hardhat tasks and scripts.

### 1.2.1. Relevant Constants

- KEYSTORE_ROOT: defines the main keystore path to store the hardware wallets
- DEF_WALLET_PASS: default password to be used to encrypt the hardware wallets
- DEF_WALLET_BATCH_SIZE: default number of wallets to generate if not specified and useing the batch mode

### 1.2.2. Generate one Random Wallet

Use hardhat task to generate random hardware wallet:

```bash
npx hardhat generate-wallets single --relative-path "/new-wallet/another_path/name.json"

Generating Wallet...
WARN: No password specified, using default password
New Wallet created and stored with address: 0xf85FaB8ca3aE307980E1B1e8BF1258B1aED9EDB9 as keystore/new-wallet/another_path/name.json
```

### 1.2.3. Generate Batch Wallets

Use hardhat task to generate multiple hardware wallets at once:

```bash
npx hardhat generate-wallets batch --relative-path /new-wallets/example --password myPassword --entropy whatever --batch-size 5

Generating Wallets...
New Wallet created and stored with address: 0x620f3A7da61156B3629b3dffC59e680b1FbD55C7 as keystore/new-wallets/example00.json
New Wallet created and stored with address: 0x3F99425f19DADd37433099Fc2104dCcd59699464 as keystore/new-wallets/example01.json
New Wallet created and stored with address: 0xE5B3836211Ac74ceB63F1Dbf5FeB9bb55822e413 as keystore/new-wallets/example02.json
New Wallet created and stored with address: 0x79fe0Eb3E352E68F2CDc6D81E6109b5Fb355C24f as keystore/new-wallets/example03.json
New Wallet created and stored with address: 0x46866650c2DAFb25Aabad5c965efCD6602A89Db5 as keystore/new-wallets/example04.json
```

### 1.2.4. Generate Wallet from mnemonic phrase

Use hardhat task to generate hardware wallet from mnemonic phrase:

```bash
npx hardhat generate-wallets single --relative-path "/other.json" --mnemonic "public shaft female city humor annual beauty razor club mix trip blossom"

Generating Wallet...
WARN: No password specified, using default password
New Wallet created and stored with address: 0x3e69BB8Fa07D831334E679cCEbBaB36DC42C4834 as keystore/other.json
```

### 1.2.5. Get Wallet mnemonic phrase

Recover mnemonic phrase from an encrypted wallet:

```bash
npx hardhat get-mnemonic keystore/example.json

{
  phrase: 'public shaft female city humor annual beauty razor club mix trip blossom',
  path: "m/44'/60'/0'/0/0",
  locale: 'en'
}
```

### 1.2.6. Get Wallet Information

Recover relevant iformation from an encrypted wallet:

```bash
npx hardhat get-wallet-info keystore/example.json

    Wallet information:
      - Address: 0x47dfA49b8E6d0DF593340856F3A6a2216b77D477,
      - Public Key: 0x0477cdbd8a79163f27211c64ec6f23476a3b86b224ff011ed42cd98f40bf59fb1d05d56339099957b398d6b801079b9c88ac6501d434e95099b4c3c1501e02d80b,
      - Private Key: ***********,
      - Mnemonic: ***********
```

## 1.3. Deploy Smart contracts

The deployment of smart contracts is managed using Hardhat Tasks. It can be deployed as regular deployments or following the Transparent Proxy upgradeable pattern. The relevant information is recorded in the deployments.json file at the root of project. It is recommended that this file is copied to other location to be able to access them or remember the addresses.

### 1.3.1. Relevant Constants

- PATH_DEPLOYMENTS: defines the deployments.json file path
- PROXY_ADMIN_NAME: if for some reason you want to change the proxy admin SC name
- PROXY_ADMIN_ADDRESS: this is important. Defines the default already deployed ProxyAdmin to use in upgradeable deployments

### 1.3.2. Regular Deployment

```bash
npx hardhat deploy ContractName --relative-path "/admin.json" --password "PaSs_W0Rd" --network ganache

    Regular contract deployed:
      - Address: 0x01b2026B2027040aC93E0C40Cd28A7262Ffa5040
      - Arguments:
```

### 1.3.3. Upgradeable deployment

```bash
npx hardhat deploy ContractName --upgradeable --relative-path "/example.json" --password "PaSs_W0Rd" --args '[["0x47dfA49b8E6d0DF593340856F3A6a2216b77D477"]]' --network ganache

WARN: no proxy admin provided, deploying new Proxy Admin

    Upgradeable contract deployed:
      - Proxy Admin: 0xc50933547aEf3a0EA766897f8D7D8F7243e342b4,
      - Proxy: 0x00Be6D2b46b5Ea72F3e9a3Afec1429C63EB47F21,
      - Logic: 0x01B3E77F9f4b7FA8E125eEC5b2f8c3EB14cA3b27
      - Arguments: 0x47dfA49b8E6d0DF593340856F3A6a2216b77D477
```

### 1.3.4. Upgrade deployed Smart Contract

```bash
npx hardhat upgrade ContractName --relative-path "/example.json" --password "PaSs_W0Rd" --proxy "0x00Be6D2b46b5Ea72F3e9a3Afec1429C63EB47F21" --network ganache

    Contract upgraded:
      - Proxy Admin: 0xc50933547aEf3a0EA766897f8D7D8F7243e342b4,
      - Proxy: 0x00Be6D2b46b5Ea72F3e9a3Afec1429C63EB47F21,
      - Previous Logic: 0x01B3E77F9f4b7FA8E125eEC5b2f8c3EB14cA3b27
      - New Logic: 0x5E0f18F0f36e4FB17CDe93f3f7faaf9073356e25
      - Arguments:
```

## 1.4. Unit Test

There is one unit test for each Smart Contract located in "test/{ContractName}.test.ts". It's tested the deployment, initialization and behavior. By default it does not store wallets.

### 1.4.1. Run ContractRegistry test

`npx hardhat test test/ContractRegistry.test.ts --network hardhat`

### 1.4.1. Run ContractDeployer test

`npx hardhat test test/ContractDeployer.test.ts --network hardhat`
## 1.5. Results

### 1.5.1. Compilation

![image](https://user-images.githubusercontent.com/10762009/159353267-ec5dfb51-9f68-45ce-b7fe-0f0e79beab39.png)

### 1.5.2. Tests (gas)

![image](https://user-images.githubusercontent.com/10762009/159353636-41e6fedb-c967-474a-a448-eee4daff048a.png)
