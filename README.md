# Colmena

Plataforma de crowdfunding on-chain con contratos Solidity (Hardhat) y frontend Next.js (Vercel-ready).

## Contract Deployment

- Contratos en `contracts/contracts`.
- Script principal de despliegue: `contracts/scripts/deploy.ts`.
- Comando recomendado desde la raiz:
  - `npm run deploy` (usa red `hardhat`)
- Comandos por red:
  - `npm run deploy:local`
  - `npm run deploy:testnet`
  - `npm run deploy:mainnet`
- El despliegue exporta direcciones en:
  - `contracts/deployments/contracts.json`
  - `deployments/contracts.json`
  - `apps/web/public/deployments/contracts.json`

## Frontend Integration

- Frontend en `apps/web`.
- Config de contratos en `apps/web/src/lib/contracts.ts`.
- El frontend carga direcciones desde:
  - `/deployments/contracts.json` (public path)
  - con override opcional via variables `NEXT_PUBLIC_*`.
- Config Web3/Wagmi/RainbowKit en `apps/web/src/lib/web3.ts`.

## Environment Variables

### Frontend (`apps/web/.env.local`)

Basado en `apps/web/.env.example`:

- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_CONTRACTS_PATH` (default: `/deployments/contracts.json`)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

Opcionales:

- `NEXT_PUBLIC_LOCAL_RPC_URL`
- `NEXT_PUBLIC_FACTORY_ADDRESS`
- `NEXT_PUBLIC_CAMPAIGN_ADDRESS`
- `NEXT_PUBLIC_REVENUE_SHARING_ADDRESS`
- `NEXT_PUBLIC_VERIFIER_ADDRESS`
- `NEXT_PUBLIC_DAO_ADDRESS`
- `NEXT_PUBLIC_TREASURY_ADDRESS`
- `NEXT_PUBLIC_BACKER_NFT_ADDRESS`
- `NEXT_PUBLIC_IMPACT_NFT_ADDRESS`
- `NEXT_PUBLIC_TOKEN_ADDRESS`

### Contracts (`contracts/.env`)

- `PRIVATE_KEY`
- `AVALANCHE_TESTNET_RPC` (o `AVALANCHE_RPC`)
- `AVALANCHE_MAINNET_RPC`
- `LOCAL_RPC_URL` (opcional)
- `PLATFORM_FEE_BPS` (opcional, default `150`)

## Local Development

Desde la raiz del repo:

- `npm run dev` -> levanta frontend Next.js
- `npm run build` -> build de produccion del frontend
- `npm run deploy` -> despliega stack de contratos en red `hardhat`

Checks utiles:

- `npm run typecheck:frontend`
- `npm run typecheck:contracts`
- `npm run test:integration`
