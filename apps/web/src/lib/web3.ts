import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo-project-id";
const rpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL;

export const wagmiConfig = getDefaultConfig({
  appName: "Colmena Protocol",
  projectId,
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: rpcUrl ? http(rpcUrl) : http(),
  },
  ssr: true,
});
