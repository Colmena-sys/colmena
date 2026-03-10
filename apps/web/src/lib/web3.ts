import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, metaMaskWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { avalanche, avalancheFuji, hardhat } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo-project-id";
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL;
const localRpcUrl = process.env.NEXT_PUBLIC_LOCAL_RPC_URL ?? "http://127.0.0.1:8545";
export const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? avalancheFuji.id);

// Configuracion estricta pero funcional:
// - Lista explicita de wallets en RainbowKit.
// - Descubrimiento multi-injected desactivado para reducir conflictos.
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recomendadas",
      wallets: [walletConnectWallet, metaMaskWallet, coinbaseWallet],
    },
  ],
  {
    appName: "Colmena Protocol",
    projectId,
  }
);

export const wagmiConfig = createConfig({
  chains: [hardhat, avalancheFuji, avalanche],
  connectors,
  transports: {
    [hardhat.id]: http(localRpcUrl),
    [avalancheFuji.id]: rpcUrl ? http(rpcUrl) : http(),
    [avalanche.id]: http(),
  },
  multiInjectedProviderDiscovery: false,
  ssr: true,
});
