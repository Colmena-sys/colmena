import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

const localRpcUrl = process.env.LOCAL_RPC_URL ?? "http://127.0.0.1:8545";
const testnetRpcUrl = process.env.AVALANCHE_TESTNET_RPC ?? process.env.AVALANCHE_RPC;
const mainnetRpcUrl = process.env.AVALANCHE_MAINNET_RPC;
const deployerAccounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

export default defineConfig({
  plugins: [hardhatEthers],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    local: {
      type: "http",
      url: localRpcUrl,
      accounts: deployerAccounts,
    },
    ...(testnetRpcUrl
      ? {
          testnet: {
            type: "http" as const,
            url: testnetRpcUrl,
            accounts: deployerAccounts,
          },
          fuji: {
            type: "http" as const,
            url: testnetRpcUrl,
            accounts: deployerAccounts,
          },
        }
      : {}),
    ...(mainnetRpcUrl
      ? {
          mainnet: {
            type: "http" as const,
            url: mainnetRpcUrl,
            accounts: deployerAccounts,
          },
        }
      : {}),
  },
});