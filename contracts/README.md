# Colmena Protocol Contracts

## Espanol

### Vision general

Este paquete contiene el backend on-chain de Colmena, reingenierizado para Hardhat 3 y organizado en una estructura modular robusta:

- `core`: creacion y registro de campanas (`ColmenaFactory`)
- `escrow`: custodia de donaciones, fee de plataforma y liberacion por hitos (`CampaignEscrow`)
- `verification`: aprobacion/revocacion de hitos por verificadores (`MilestoneVerifier`)
- `revenue`: reparto de revenue a backers por contribucion proporcional (`RevenueSharing`)
- `token`: token de gobernanza/utility (`ColmenaToken`)
- `nft`: NFTs de backer e impacto (`BackerNFT`, `ImpactNFT`)
- `treasury`: custodia de fees y grants (`TreasuryVault`)
- `governance`: ejecucion de acciones de gobernanza (`ColmenaDAO`)

La tarifa de plataforma queda en basis points y se inicializa en `150` (1.5%) en `scripts/deploy.js`.

---

### Arquitectura (alineada a tus diagramas)

- **Users**
  - Backers: donan, reciben participacion economica en revenue y pueden recibir `BackerNFT`
  - Creators: crean campanas, reciben fondos por hitos aprobados y depositan revenue
  - DAO members: gobiernan treasury, fees y upgrades mediante roles
- **Frontend**
  - dApp Next.js + wagmi + rainbowkit (integracion on-chain desde `apps/web`)
- **Protocol Layer**
  - `ColmenaFactory`, `CampaignEscrow`, `MilestoneVerifier`, `RevenueSharing`
- **Token Layer**
  - `ColmenaToken (COL)`, `BackerNFT`, `ImpactNFT`
- **Treasury**
  - recibe fee por donacion y puede emitir grants/retiros autorizados
- **Governance**
  - `ColmenaDAO` como ejecutor de acciones sobre contratos protocolarios

---

### Flujo de dinero

1. Backer dona a una campana (`CampaignEscrow.donate`)
2. El escrow separa fee (1.5%) y lo envia a `TreasuryVault`
3. El neto queda en escrow y se registra como contribucion en `RevenueSharing`
4. Cuando un hito es aprobado por `MilestoneVerifier`, creator o governance liberan fondos del hito
5. Creator deposita revenue futuro en `RevenueSharing` via `CampaignEscrow.depositRevenue`
6. Cada backer reclama su parte proporcional (`claimRevenue`)

---

### Analisis profundo de la solucion

#### Fortalezas tecnicas actuales

- Arquitectura por modulos, con responsabilidades separadas
- Endurecimiento con `AccessControl` y `ReentrancyGuard`
- Distribucion de revenue sin loops globales (modelo pull por usuario)
- Flujo de hitos secuencial y verificable (approve/revoke)
- Integracion de NFTs vinculada al flujo economico de campanas
- Despliegue automatizado del stack completo con grants de roles

#### Riesgos y puntos a reforzar (importante para produccion)

- **Gobernanza ejecutora**: `ColmenaDAO.execute` permite llamadas arbitrarias a quienes tengan `DAO_MEMBER_ROLE`. Recomendado: agregar timelock + reglas de quorum/votacion.
- **Privilegios de admin**: el deploy script concede `DEFAULT_ADMIN_ROLE` de NFTs al factory para poder delegar minter a nuevas campanas. Recomendado: pasar admin final a multisig DAO y revocar permisos de despliegue.
- **Ciclo de vida de campana**: faltan estados enriquecidos (cancelada, finalizada con sobrante, emergency withdraw controlado).
- **Cobertura de testing**: no hay suite formal de invariantes economicos y seguridad.
- **Observabilidad**: faltan indexadores/subgraph y paneles para trazabilidad de donaciones, hitos y claims.

#### Recomendaciones de siguiente fase

1. Incorporar `TimelockController` + gobernanza on-chain real (Governor).
2. Agregar tests de seguridad/economia:
   - reentrancy
   - rounding dust en revenue
   - no over-release por hitos
   - permisos por rol
3. Politica operativa de roles:
   - deployer temporal
   - transferencia a multisig
   - revocaciones obligatorias post-deploy
4. Integrar frontend web3 con ABIs y direcciones por red.

---

### Estructura de carpetas

```text
contracts/
  contracts/
    core/ColmenaFactory.sol
    escrow/CampaignEscrow.sol
    verification/MilestoneVerifier.sol
    revenue/RevenueSharing.sol
    token/ColmenaToken.sol
    nft/BackerNFT.sol
    nft/ImpactNFT.sol
    treasury/TreasuryVault.sol
    governance/ColmenaDAO.sol
  scripts/deploy.js
  hardhat.config.ts
```

---

### Requisitos

- Node.js 20+
- npm

Instalacion:

```bash
npm install
```

Variables de entorno (crear `contracts/.env`):

```bash
PRIVATE_KEY=tu_private_key
AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
```

---

### Comandos utiles

Compilar:

```bash
npx hardhat compile
```

Desplegar local:

```bash
npx hardhat run scripts/deploy.js
```

Desplegar en Fuji:

```bash
npx hardhat run --network fuji scripts/deploy.js
```

---

### Notas operativas

- El fee se expresa en basis points (`150 = 1.5%`).
- `ColmenaFactory` registra cada campana en `RevenueSharing`.
- El escrow de cada campana recibe permisos de minteo NFT desde factory.
- Para produccion, usar multisig + runbook de rotacion/revocacion de roles.

---

## English

### Overview

This package is the Colmena on-chain backend, reengineered for Hardhat 3 with a robust modular layout:

- `core`: campaign creation and registry (`ColmenaFactory`)
- `escrow`: donation custody, platform fee handling, milestone-based release (`CampaignEscrow`)
- `verification`: verifier-driven milestone approval/revocation (`MilestoneVerifier`)
- `revenue`: proportional backer revenue sharing (`RevenueSharing`)
- `token`: governance/utility token (`ColmenaToken`)
- `nft`: backer and impact NFTs (`BackerNFT`, `ImpactNFT`)
- `treasury`: platform fee vault and grants (`TreasuryVault`)
- `governance`: governance execution layer (`ColmenaDAO`)

Platform fee is configured in basis points and initialized at `150` (1.5%) in `scripts/deploy.js`.

---

### Architecture (aligned with your diagrams)

- **Users**
  - Backers: donate, participate in revenue, may receive `BackerNFT`
  - Creators: create campaigns, receive milestone payouts, deposit revenue
  - DAO members: control treasury, fees, and upgrades through roles
- **Frontend**
  - Next.js + wagmi + rainbowkit dApp
- **Protocol Layer**
  - `ColmenaFactory`, `CampaignEscrow`, `MilestoneVerifier`, `RevenueSharing`
- **Token Layer**
  - `ColmenaToken (COL)`, `BackerNFT`, `ImpactNFT`
- **Treasury**
  - receives donation fees and can issue authorized withdrawals/grants
- **Governance**
  - `ColmenaDAO` acts as protocol action executor

---

### Money flow

1. Backer donates to a campaign (`CampaignEscrow.donate`)
2. Escrow splits and sends platform fee (1.5%) to `TreasuryVault`
3. Net donation stays in escrow and is recorded in `RevenueSharing`
4. Once a milestone is approved in `MilestoneVerifier`, creator/governance releases milestone funds
5. Creator deposits future revenue into `RevenueSharing` via `CampaignEscrow.depositRevenue`
6. Each backer claims their proportional revenue (`claimRevenue`)

---

### Deep solution analysis

#### Current technical strengths

- Modular architecture with clear bounded responsibilities
- Security hardening through `AccessControl` and `ReentrancyGuard`
- Revenue distribution avoids global loops (pull-based claims)
- Sequential and verifiable milestone release process
- NFT layer tied to campaign economics
- End-to-end deployment script with role bootstrapping

#### Risks and production hardening opportunities

- **Governance execution power**: `ColmenaDAO.execute` enables arbitrary calls for `DAO_MEMBER_ROLE`. Recommended: add timelock + voting/quorum logic.
- **Admin privilege surface**: deploy grants NFT `DEFAULT_ADMIN_ROLE` to factory so it can delegate minter permissions per campaign. Recommended: transfer final admin to DAO multisig and revoke deployer privileges.
- **Campaign lifecycle depth**: richer states are still needed (cancelled, completed with residual handling, controlled emergency paths).
- **Testing coverage**: no formal invariant/economic/security test suite yet.
- **Observability**: indexer/subgraph/dashboard layer still needed for production monitoring.

#### Recommended next phase

1. Add `TimelockController` and full on-chain governance.
2. Add security and economic test coverage:
   - reentrancy
   - rounding dust behavior
   - milestone payout invariants
   - role/permission boundaries
3. Establish role operations policy:
   - temporary deployer authority
   - multisig handoff
   - mandatory revocations after deployment
4. Integrate frontend web3 layer with network-aware addresses and ABIs.

---

### Project structure

```text
contracts/
  contracts/
    core/ColmenaFactory.sol
    escrow/CampaignEscrow.sol
    verification/MilestoneVerifier.sol
    revenue/RevenueSharing.sol
    token/ColmenaToken.sol
    nft/BackerNFT.sol
    nft/ImpactNFT.sol
    treasury/TreasuryVault.sol
    governance/ColmenaDAO.sol
  scripts/deploy.js
  hardhat.config.ts
```

---

### Requirements

- Node.js 20+
- npm

Install:

```bash
npm install
```

Environment variables (create `contracts/.env`):

```bash
PRIVATE_KEY=your_private_key
AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
```

---

### Useful commands

Compile:

```bash
npx hardhat compile
```

Deploy locally:

```bash
npx hardhat run scripts/deploy.js
```

Deploy to Fuji:

```bash
npx hardhat run --network fuji scripts/deploy.js
```

---

### Operational notes

- Fee is expressed in basis points (`150 = 1.5%`).
- `ColmenaFactory` registers each campaign into `RevenueSharing`.
- Factory grants campaign escrows NFT minting rights.
- For production, use multisig governance and a strict role-revocation runbook.
