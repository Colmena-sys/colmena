import { createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo-project-id";
const rpcUrl = process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL;

// Configuracion estricta:
// - Solo WalletConnect (evita colisiones de providers injected).
// - Desactiva descubrimiento de injected providers (EIP-6963).
export const wagmiConfig = createConfig({
  chains: [avalancheFuji],
  connectors: [
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: "Colmena Protocol",
        description: "Crowdfunding descentralizado con escrow por hitos",
        url: "http://localhost:3000",
        icons: [],
      },
    }),
  ],
  transports: {
    [avalancheFuji.id]: rpcUrl ? http(rpcUrl) : http(),
  },
  multiInjectedProviderDiscovery: false,
  ssr: true,
});
