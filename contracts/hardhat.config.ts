import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

const hasFujiConfig = Boolean(process.env.AVALANCHE_RPC && process.env.PRIVATE_KEY);

export default defineConfig({
  plugins: [hardhatEthers],
  solidity: "0.8.28",
  networks: hasFujiConfig
    ? {
        fuji: {
          type: "http",
          url: process.env.AVALANCHE_RPC!,
          accounts: [process.env.PRIVATE_KEY!],
        },
      }
    : {},
});