"use client";

import { useQuery } from "@tanstack/react-query";
import { BrowserProvider, Contract, JsonRpcProvider, type ContractRunner, type Signer } from "ethers";
import { isAddress, parseAbi } from "viem";

export type Address = `0x${string}`;

type DeploymentFile = {
  network: string;
  chainId?: number;
  deployedAt?: string;
  contracts: Record<string, string>;
};

const contractsPath = process.env.NEXT_PUBLIC_CONTRACTS_PATH ?? "/deployments/contracts.json";

export type ContractName =
  | "ColmenaFactory"
  | "CampaignEscrow"
  | "RevenueSharing"
  | "MilestoneVerifier"
  | "ColmenaDAO"
  | "TreasuryVault"
  | "BackerNFT"
  | "ImpactNFT"
  | "ColmenaToken";

export const FACTORY_ABI = parseAbi([
  "function campaignCount() view returns (uint256)",
  "function platformFeeBps() view returns (uint256)",
  "function createCampaign(uint256[] milestoneAmounts, string metadataURI) returns (address)",
  "event CampaignCreated(address indexed campaign, address indexed creator, uint256 indexed campaignId, string metadataURI)",
]);

export const ESCROW_ABI = parseAbi([
  "function milestones(uint256) view returns (uint256 amount, bool released)",
  "function creator() view returns (address)",
  "function feeBps() view returns (uint256)",
  "function donationsPaused() view returns (bool)",
  "function milestoneCount() view returns (uint256)",
  "function totalGrossDonations() view returns (uint256)",
  "function totalNetContributions() view returns (uint256)",
  "function totalReleasedToCreator() view returns (uint256)",
  "function totalFeePaid() view returns (uint256)",
  "function totalBackers() view returns (uint256)",
  "function nextMilestoneToRelease() view returns (uint256)",
  "function donate() payable",
  "function claimRevenue() returns (uint256)",
  "function releaseMilestone(uint256 milestoneId)",
]);

export const REVENUE_SHARING_ABI = parseAbi(["function claimable(address campaign, address backer) view returns (uint256)"]);

export const VERIFIER_ABI = parseAbi([
  "function isMilestoneApproved(address campaign, uint256 milestoneId) view returns (bool)",
  "function milestoneEvidence(address campaign, uint256 milestoneId) view returns (string)",
  "function approveMilestone(address campaign, uint256 milestoneId, string evidenceURI)",
  "function revokeMilestone(address campaign, uint256 milestoneId)",
]);

function maybeAddress(value: string | undefined): Address | undefined {
  if (!value) return undefined;
  return isAddress(value) ? (value as Address) : undefined;
}

function parseDeploymentAddress(value: string | undefined): Address | undefined {
  if (!value) return undefined;
  return isAddress(value) ? (value as Address) : undefined;
}

async function loadDeploymentFile(): Promise<DeploymentFile | null> {
  try {
    const response = await fetch(contractsPath, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as DeploymentFile;
    if (!payload || typeof payload !== "object" || typeof payload.contracts !== "object") return null;
    return payload;
  } catch {
    return null;
  }
}

const ENV_CONTRACTS: Record<ContractName, Address | undefined> = {
  ColmenaFactory: maybeAddress(process.env.NEXT_PUBLIC_FACTORY_ADDRESS),
  CampaignEscrow: maybeAddress(process.env.NEXT_PUBLIC_CAMPAIGN_ADDRESS),
  RevenueSharing: maybeAddress(process.env.NEXT_PUBLIC_REVENUE_SHARING_ADDRESS),
  MilestoneVerifier: maybeAddress(process.env.NEXT_PUBLIC_VERIFIER_ADDRESS),
  ColmenaDAO: maybeAddress(process.env.NEXT_PUBLIC_DAO_ADDRESS),
  TreasuryVault: maybeAddress(process.env.NEXT_PUBLIC_TREASURY_ADDRESS),
  BackerNFT: maybeAddress(process.env.NEXT_PUBLIC_BACKER_NFT_ADDRESS),
  ImpactNFT: maybeAddress(process.env.NEXT_PUBLIC_IMPACT_NFT_ADDRESS),
  ColmenaToken: maybeAddress(process.env.NEXT_PUBLIC_TOKEN_ADDRESS),
};

function buildContractsMap(deployment?: DeploymentFile | null): Record<ContractName, Address | undefined> {
  const fromFile: Record<ContractName, Address | undefined> = {
    ColmenaFactory: parseDeploymentAddress(deployment?.contracts.ColmenaFactory),
    CampaignEscrow: parseDeploymentAddress(deployment?.contracts.CampaignEscrow),
    RevenueSharing: parseDeploymentAddress(deployment?.contracts.RevenueSharing),
    MilestoneVerifier: parseDeploymentAddress(deployment?.contracts.MilestoneVerifier),
    ColmenaDAO: parseDeploymentAddress(deployment?.contracts.ColmenaDAO),
    TreasuryVault: parseDeploymentAddress(deployment?.contracts.TreasuryVault),
    BackerNFT: parseDeploymentAddress(deployment?.contracts.BackerNFT),
    ImpactNFT: parseDeploymentAddress(deployment?.contracts.ImpactNFT),
    ColmenaToken: parseDeploymentAddress(deployment?.contracts.ColmenaToken),
  };

  return {
    ColmenaFactory: ENV_CONTRACTS.ColmenaFactory ?? fromFile.ColmenaFactory,
    CampaignEscrow: ENV_CONTRACTS.CampaignEscrow ?? fromFile.CampaignEscrow,
    RevenueSharing: ENV_CONTRACTS.RevenueSharing ?? fromFile.RevenueSharing,
    MilestoneVerifier: ENV_CONTRACTS.MilestoneVerifier ?? fromFile.MilestoneVerifier,
    ColmenaDAO: ENV_CONTRACTS.ColmenaDAO ?? fromFile.ColmenaDAO,
    TreasuryVault: ENV_CONTRACTS.TreasuryVault ?? fromFile.TreasuryVault,
    BackerNFT: ENV_CONTRACTS.BackerNFT ?? fromFile.BackerNFT,
    ImpactNFT: ENV_CONTRACTS.ImpactNFT ?? fromFile.ImpactNFT,
    ColmenaToken: ENV_CONTRACTS.ColmenaToken ?? fromFile.ColmenaToken,
  };
}

export function useContractsConfig() {
  const deployment = useQuery({
    queryKey: ["contracts-deployment-file"],
    queryFn: loadDeploymentFile,
    staleTime: 60_000,
  });

  return {
    deployment: deployment.data ?? null,
    contracts: buildContractsMap(deployment.data),
    isLoading: deployment.isLoading,
  };
}

export const CONTRACT_ABI = {
  ColmenaFactory: FACTORY_ABI,
  CampaignEscrow: ESCROW_ABI,
  RevenueSharing: REVENUE_SHARING_ABI,
  MilestoneVerifier: VERIFIER_ABI,
} as const;

export function getContractAddress(name: ContractName, contracts: Record<ContractName, Address | undefined>): Address {
  const address = contracts[name];
  if (!address) {
    throw new Error(`Missing address for ${name}`);
  }
  return address;
}

export function createReadContract(name: keyof typeof CONTRACT_ABI, address: Address, rpcUrl: string) {
  const provider = new JsonRpcProvider(rpcUrl);
  return new Contract(address, CONTRACT_ABI[name], provider);
}

export async function createWalletContract(
  name: keyof typeof CONTRACT_ABI,
  address: Address,
  ethereumProvider: Eip1193ProviderLike,
  signer?: Signer
) {
  const browserProvider = new BrowserProvider(ethereumProvider);
  const runner: ContractRunner = signer ?? (await browserProvider.getSigner());
  return new Contract(address, CONTRACT_ABI[name], runner);
}

type Eip1193ProviderLike = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};
