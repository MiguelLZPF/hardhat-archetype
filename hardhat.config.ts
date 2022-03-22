import { ENV } from "./configuration";
import * as fs from "async-file";
import { HardhatUserConfig, subtask, task, types } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { generateWallet, generateWalletBatch } from "./scripts/wallets";
import { Wallet } from "@ethersproject/wallet";
import { deploy, deployUpgradeable, upgrade } from "./scripts/deploy";
import { setGHRE } from "./scripts/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";

//! TASKS
//* Hardware Wallets
// https://hardhat.org/guides/create-task.html
task("generate-wallets", "Generates hardware persistent wallets")
  .addPositionalParam("type", "Type of generation [single, batch]", "single", types.string)
  .addParam(
    "relativePath",
    "Path relative to PATH_KEYSTORE_ROOT to store the wallets",
    undefined,
    types.string
  )
  .addOptionalParam("password", "Wallet password", undefined, types.string)
  .addOptionalParam("entropy", "Wallet entropy", undefined, types.string)
  .addOptionalParam(
    "privateKey",
    "Private key to generate wallet from. Hexadecimal String format expected",
    undefined,
    types.string
  )
  .addOptionalParam("mnemonic", "Mnemonic phrase to generate wallet from", undefined, types.string)
  .addOptionalParam(
    "batchSize",
    "Number of user wallets to be generated in batch",
    undefined,
    types.int
  )
  .setAction(async (taskArgs) => {
    console.log(taskArgs);
    if (taskArgs.type.toLowerCase() == "batch") {
      await generateWalletBatch(
        taskArgs.relativePath!,
        taskArgs.password,
        taskArgs.batchSize,
        taskArgs.entropy ? Buffer.from(taskArgs.entropy) : undefined
      );
    } else {
      await generateWallet(
        taskArgs.relativePath!,
        taskArgs.password,
        taskArgs.entropy ? Buffer.from(taskArgs.entropy) : undefined,
        taskArgs.privateKey,
        taskArgs.mnemonic
      );
    }
  });

task("get-wallet-info", "Recover all information from an encrypted wallet")
  .addPositionalParam("path", "Full path where the encrypted wallet is located")
  .addOptionalPositionalParam("password", "Password to decrypt the wallet")
  .addFlag("showPrivate", "set to true if you want to show the private key and mnemonic phrase")
  .setAction(async ({ path, password, showPrivate }) => {
    password = password ? password : ENV.KEYSTORE.default.password;
    const wallet = Wallet.fromEncryptedJsonSync(await fs.readFile(path), password);
    let privateKey = wallet.privateKey;
    let mnemonic = wallet.mnemonic.phrase;
    if (showPrivate != true) {
      privateKey = "***********";
      mnemonic = "***********";
    }
    console.log(`
    Wallet information:
      - Address: ${wallet.address},
      - Public Key: ${wallet.publicKey},
      - Private Key: ${privateKey},
      - Mnemonic: ${mnemonic}
    `);
  });

task("get-mnemonic", "Recover mnemonic phrase from an encrypted wallet")
  .addPositionalParam("path", "Full path where the encrypted wallet is located")
  .addPositionalParam("password", "Password to decrypt the wallet")
  .setAction(async ({ path, password }) => {
    const wallet = Wallet.fromEncryptedJsonSync(await fs.readFile(path), password);
    console.log(wallet.mnemonic);
  });

task("deploy", "Deploy smart contracts on '--network'")
  .addFlag("upgradeable", "Deploy as upgradeable")
  .addPositionalParam(
    "contractName",
    "Name of the contract to deploy",
    "Example_Storage",
    types.string
  )
  .addParam(
    "relativePath",
    "Path relative to KEYSTORE_ROOT to store the wallets",
    undefined,
    types.string
  )
  .addParam("password", "Password to decrypt the wallet")
  .addOptionalParam(
    "proxyAdmin",
    "Address of a deloyed Proxy Admin. Only if --upgradeable deployment",
    undefined,
    types.string
  )
  .addOptionalParam(
    "args",
    "Contract initialize function's arguments if any",
    undefined,
    types.json
  )
  .setAction(
    async (
      { upgradeable, contractName, relativePath, password, proxyAdmin, args },
      hre: HardhatRuntimeEnvironment
    ) => {
      args = args ? args : [];
      const signer = Wallet.fromEncryptedJsonSync(
        await fs.readFile(ENV.KEYSTORE.root.concat(relativePath)),
        password
      ).connect(hre.ethers.provider);
      setGHRE(hre);
      if (upgradeable) {
        await deployUpgradeable(contractName, signer, args, proxyAdmin);
      } else {
        await deploy(contractName, signer, args);
      }
    }
  );

task("deploy", "Deploy smart contracts on '--network'")
  .addFlag("upgradeable", "Deploy as upgradeable")
  .addFlag("useDeployer", "Deploy as upgradeable using deployer and registry contracts")
  .addPositionalParam(
    "contractName",
    "Name of the contract to deploy",
    "Example_Storage",
    types.string
  )
  .addParam(
    "relativePath",
    "Path relative to KEYSTORE_ROOT to store the wallets",
    undefined,
    types.string
  )
  .addParam("password", "Password to decrypt the wallet")
  .addOptionalParam(
    "proxyAdmin",
    "Address of a deloyed Proxy Admin. Only if --upgradeable deployment",
    undefined,
    types.string
  )
  .addOptionalParam(
    "args",
    "Contract initialize function's arguments if any",
    undefined,
    types.json
  )
  .setAction(
    async (
      { upgradeable, useDeployer, contractName, relativePath, password, proxyAdmin, args },
      hre: HardhatRuntimeEnvironment
    ) => {
      args = args ? args : [];
      const signer = Wallet.fromEncryptedJsonSync(
        await fs.readFile(ENV.KEYSTORE.root.concat(relativePath)),
        password
      ).connect(hre.ethers.provider);
      setGHRE(hre);
      if (upgradeable) {
        if (useDeployer) {
          await deployUpgradeable(contractName, signer, args, proxyAdmin);
        } else {
          await deployUpgradeable(contractName, signer, args, proxyAdmin);
        }
      } else {
        await deploy(contractName, signer, args);
      }
    }
  );

task("upgrade", "Upgrade smart contracts on '--network'")
  .addPositionalParam(
    "contractName",
    "Name of the contract to deploy",
    "Example_Storage",
    types.string
  )
  .addParam(
    "relativePath",
    "Path relative to KEYSTORE_ROOT to store the wallets",
    undefined,
    types.string
  )
  .addParam("password", "Password to decrypt the wallet")
  .addOptionalParam("proxy", "Address of the TUP proxy", undefined, types.string)
  .addOptionalParam("proxyAdmin", "Address of a deloyed Proxy Admin", undefined, types.string)
  .addOptionalParam(
    "args",
    "Contract initialize function's arguments if any",
    undefined,
    types.json
  )
  .setAction(
    async (
      { contractName, relativePath, password, proxy, proxyAdmin, args },
      hre: HardhatRuntimeEnvironment
    ) => {
      args = args ? args : [];
      const signer = Wallet.fromEncryptedJsonSync(
        await fs.readFile(ENV.KEYSTORE.root.concat(relativePath)),
        password
      ).connect(hre.ethers.provider);
      setGHRE(hre);
      await upgrade(contractName, signer, args, proxy, proxyAdmin);
    }
  );

task("quick-test", "Random quick testing function")
  .addOptionalParam(
    "args",
    "Contract initialize function's arguments if any",
    undefined,
    types.json
  )
  .setAction(async ({ args }, hre: HardhatRuntimeEnvironment) => {
    // example: npx hardhat quick-test --args '[12, "hello"]'
    console.log("RAW Args: ", args, typeof args, args[0]);
    console.log(ENV.KEYSTORE.default.password);
  });

//! Config
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: {
    version: ENV.NETWORK.default.solVersion!,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: ENV.NETWORK.default.evm,
    },
  },
  networks: {
    hardhat: {
      chainId: ENV.NETWORK.hardhat.chainId,
      blockGasLimit: ENV.NETWORK.default.gasLimit,
      gasPrice: ENV.NETWORK.default.gasPrice,
      hardfork: ENV.NETWORK.default.evm,
    },
    ganache: {
      url: ENV.NETWORK.ganache.url,
      chainId: ENV.NETWORK.ganache.chainId,
      blockGasLimit: ENV.NETWORK.default.gasLimit,
      gasPrice: ENV.NETWORK.default.gasPrice,
      hardfork: ENV.NETWORK.default.evm,
    },
  },
  contractSizer: {
    runOnCompile: true,
  },
  gasReporter: {
    enabled: true,
    currency: "EUR",
  },
  typechain: {
    externalArtifacts: ["@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol"],
  },
};
export default config;
