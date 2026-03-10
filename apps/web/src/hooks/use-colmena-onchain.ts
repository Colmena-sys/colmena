"use client";

import { useMemo } from "react";
import { decodeEventLog, parseAbi, parseEther } from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useBlockNumber,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { ONCHAIN } from "@/lib/onchain-config";

const factoryAbi = parseAbi([
  "function campaignCount() view returns (uint256)",
  "function platformFeeBps() view returns (uint256)",
  "function createCampaign(uint256[] milestoneAmounts, string metadataURI) returns (address)",
  "event CampaignCreated(address indexed campaign, address indexed creator, uint256 indexed campaignId, string metadataURI)",
]);

const escrowAbi = parseAbi([
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
]);

const revenueAbi = parseAbi(["function claimable(address campaign, address backer) view returns (uint256)"]);
const escrowWriteAbi = parseAbi([
  "function donate() payable",
  "function claimRevenue() returns (uint256)",
  "function releaseMilestone(uint256 milestoneId)",
]);
const verifierAbi = parseAbi([
  "function isMilestoneApproved(address campaign, uint256 milestoneId) view returns (bool)",
  "function milestoneEvidence(address campaign, uint256 milestoneId) view returns (string)",
  "function approveMilestone(address campaign, uint256 milestoneId, string evidenceURI)",
  "function revokeMilestone(address campaign, uint256 milestoneId)",
]);

export type OnchainMilestone = {
  id: number;
  amount?: bigint;
  released?: boolean;
  approved?: boolean;
  evidence?: string;
  status: "released" | "active" | "pending";
};

export function useNetworkPulse() {
  const { address, chainId, isConnected } = useAccount();
  const block = useBlockNumber({ query: { refetchInterval: 6000 } });
  const balance = useBalance({ address, query: { enabled: Boolean(address), refetchInterval: 9000 } });

  return {
    address,
    chainId,
    isConnected,
    blockNumber: block.data,
    nativeBalance: balance.data?.value,
    nativeSymbol: balance.data?.symbol,
  };
}

export function useFujiGuard() {
  const chainId = useChainId();
  const switcher = useSwitchChain();
  const isFuji = chainId === avalancheFuji.id;

  return {
    chainId,
    isFuji,
    switchToFuji: () => switcher.switchChain({ chainId: avalancheFuji.id }),
    isSwitching: switcher.isPending,
    switchError: switcher.error,
  };
}

export function useFactoryReads() {
  const enabled = Boolean(ONCHAIN.factoryAddress);
  const count = useReadContract({
    abi: factoryAbi,
    address: ONCHAIN.factoryAddress,
    functionName: "campaignCount",
    query: { enabled },
  });
  const fee = useReadContract({
    abi: factoryAbi,
    address: ONCHAIN.factoryAddress,
    functionName: "platformFeeBps",
    query: { enabled },
  });

  return {
    hasFactory: enabled,
    campaignCount: count.data,
    platformFeeBps: fee.data,
  };
}

export function useCampaignReads(campaignAddress?: `0x${string}`) {
  const address = campaignAddress ?? ONCHAIN.campaignAddress;
  const enabled = Boolean(address);

  const reads = useReadContracts({
    contracts: [
      { abi: escrowAbi, address: address as `0x${string}`, functionName: "creator" },
      { abi: escrowAbi, address: address as `0x${string}`, functionName: "feeBps" },
      { abi: escrowAbi, address: address as `0x${string}`, functionName: "donationsPaused" },
      { abi: escrowAbi, address: address as `0x${string}`, functionName: "milestoneCount" },
      { abi: escrowAbi, address: address as `0x${string}`, functionName: "totalGrossDonations" },
      { abi: escrowAbi, address: address as `0x${string}`, functionName: "totalNetContributions" },
      { abi: escrowAbi, address: address as `0x${string}`, functionName: "totalReleasedToCreator" },
      { abi: escrowAbi, address: address as `0x${string}`, functionName: "totalFeePaid" },
      { abi: escrowAbi, address: address as `0x${string}`, functionName: "totalBackers" },
      { abi: escrowAbi, address: address as `0x${string}`, functionName: "nextMilestoneToRelease" },
    ],
    query: { enabled },
  });

  const parsed = useMemo(() => {
    const [creator, feeBps, donationsPaused, milestoneCount, totalGross, totalNet, totalReleased, totalFee, totalBackers, nextMilestone] =
      reads.data ?? [];
    return {
      creator: creator?.result as `0x${string}` | undefined,
      feeBps: feeBps?.result as bigint | undefined,
      donationsPaused: donationsPaused?.result as boolean | undefined,
      milestoneCount: milestoneCount?.result as bigint | undefined,
      totalGrossDonations: totalGross?.result as bigint | undefined,
      totalNetContributions: totalNet?.result as bigint | undefined,
      totalReleasedToCreator: totalReleased?.result as bigint | undefined,
      totalFeePaid: totalFee?.result as bigint | undefined,
      totalBackers: totalBackers?.result as bigint | undefined,
      nextMilestoneToRelease: nextMilestone?.result as bigint | undefined,
    };
  }, [reads.data]);

  return { hasCampaign: enabled, ...parsed };
}

export function useMilestonesOnchain(campaignAddress?: `0x${string}`) {
  const campaign = useCampaignReads(campaignAddress);
  const address = campaignAddress ?? ONCHAIN.campaignAddress;
  const count = Number(campaign.milestoneCount ?? BigInt(0));
  const next = Number(campaign.nextMilestoneToRelease ?? BigInt(0));
  const milestoneIds = Array.from({ length: Math.max(0, count) }, (_, idx) => idx);

  const contracts = [
    ...milestoneIds.map((id) => ({
      abi: escrowAbi,
      address: address as `0x${string}`,
      functionName: "milestones" as const,
      args: [BigInt(id)] as const,
    })),
    ...(ONCHAIN.verifierAddress && address
      ? milestoneIds.flatMap((id) => [
          {
            abi: verifierAbi,
            address: ONCHAIN.verifierAddress,
            functionName: "isMilestoneApproved" as const,
            args: [address, BigInt(id)] as const,
          },
          {
            abi: verifierAbi,
            address: ONCHAIN.verifierAddress,
            functionName: "milestoneEvidence" as const,
            args: [address, BigInt(id)] as const,
          },
        ])
      : []),
  ];

  const reads = useReadContracts({
    contracts,
    query: {
      enabled: Boolean(address) && count > 0,
    },
  });

  const milestones = useMemo<OnchainMilestone[]>(() => {
    if (!reads.data?.length || count === 0) return [];

    const results = reads.data;
    const base = milestoneIds.map((id, index) => {
      const row = results[index]?.result as readonly [bigint, boolean] | undefined;
      const amount = row?.[0];
      const released = row?.[1];
      const status: OnchainMilestone["status"] = released ? "released" : id === next ? "active" : "pending";
      return { id, amount, released, status };
    });

    if (!(ONCHAIN.verifierAddress && address)) return base;

    const offset = milestoneIds.length;
    return base.map((item) => {
      const i = item.id * 2;
      const approved = results[offset + i]?.result as boolean | undefined;
      const evidence = results[offset + i + 1]?.result as string | undefined;
      return { ...item, approved, evidence };
    });
  }, [reads.data, count, milestoneIds, next, address]);

  return { ...campaign, milestones };
}

export function useInvestorClaimable(campaignAddress?: `0x${string}`) {
  const { address } = useAccount();
  const activeCampaign = campaignAddress ?? ONCHAIN.campaignAddress;
  const enabled = Boolean(ONCHAIN.revenueSharingAddress && activeCampaign && address);

  const claimable = useReadContract({
    abi: revenueAbi,
    address: ONCHAIN.revenueSharingAddress,
    functionName: "claimable",
    args: enabled ? [activeCampaign!, address!] : undefined,
    query: { enabled },
  });

  return {
    hasRevenue: Boolean(ONCHAIN.revenueSharingAddress),
    claimable: claimable.data,
  };
}

export function useCampaignActions(campaignAddress?: `0x${string}`) {
  const address = campaignAddress ?? ONCHAIN.campaignAddress;
  const donate = useWriteContract();
  const claim = useWriteContract();
  const release = useWriteContract();

  const donateReceipt = useWaitForTransactionReceipt({ hash: donate.data });
  const claimReceipt = useWaitForTransactionReceipt({ hash: claim.data });
  const releaseReceipt = useWaitForTransactionReceipt({ hash: release.data });

  const donateNative = (amount: string) => {
    if (!address) return;
    donate.writeContract({
      abi: escrowWriteAbi,
      address,
      functionName: "donate",
      value: parseEther(amount),
    });
  };

  const claimRevenue = () => {
    if (!address) return;
    claim.writeContract({
      abi: escrowWriteAbi,
      address,
      functionName: "claimRevenue",
    });
  };

  const releaseMilestone = (milestoneId: number) => {
    if (!address) return;
    release.writeContract({
      abi: escrowWriteAbi,
      address,
      functionName: "releaseMilestone",
      args: [BigInt(milestoneId)],
    });
  };

  return {
    hasCampaignActions: Boolean(address),
    donateNative,
    claimRevenue,
    releaseMilestone,
    donate: {
      hash: donate.data,
      isPending: donate.isPending || donateReceipt.isLoading,
      isSuccess: donateReceipt.isSuccess,
      error: donate.error ?? donateReceipt.error,
    },
    claim: {
      hash: claim.data,
      isPending: claim.isPending || claimReceipt.isLoading,
      isSuccess: claimReceipt.isSuccess,
      error: claim.error ?? claimReceipt.error,
    },
    release: {
      hash: release.data,
      isPending: release.isPending || releaseReceipt.isLoading,
      isSuccess: releaseReceipt.isSuccess,
      error: release.error ?? releaseReceipt.error,
    },
  };
}

export function useFactoryActions() {
  const create = useWriteContract();
  const createReceipt = useWaitForTransactionReceipt({ hash: create.data });

  const createCampaign = (milestoneAmountsNative: string[], metadataURI: string) => {
    if (!ONCHAIN.factoryAddress) return;
    const parsed = milestoneAmountsNative.map((value) => parseEther(value));
    create.writeContract({
      abi: factoryAbi,
      address: ONCHAIN.factoryAddress,
      functionName: "createCampaign",
      args: [parsed, metadataURI],
    });
  };

  const createdCampaignAddress = useMemo(() => {
    if (!createReceipt.data?.logs?.length) return undefined;

    for (const log of createReceipt.data.logs) {
      try {
        const decoded = decodeEventLog({
          abi: factoryAbi,
          data: log.data,
          topics: log.topics,
          eventName: "CampaignCreated",
        });
        if (decoded.eventName === "CampaignCreated") {
          return decoded.args.campaign as `0x${string}`;
        }
      } catch {
        // Ignore unrelated logs.
      }
    }
    return undefined;
  }, [createReceipt.data]);

  return {
    hasFactoryActions: Boolean(ONCHAIN.factoryAddress),
    createCampaign,
    createdCampaignAddress,
    create: {
      hash: create.data,
      isPending: create.isPending || createReceipt.isLoading,
      isSuccess: createReceipt.isSuccess,
      error: create.error ?? createReceipt.error,
    },
  };
}

export function useVerifierActions() {
  const approve = useWriteContract();
  const revoke = useWriteContract();

  const approveReceipt = useWaitForTransactionReceipt({ hash: approve.data });
  const revokeReceipt = useWaitForTransactionReceipt({ hash: revoke.data });

  const approveMilestone = (campaign: `0x${string}`, milestoneId: number, evidenceURI: string) => {
    if (!ONCHAIN.verifierAddress) return;
    approve.writeContract({
      abi: verifierAbi,
      address: ONCHAIN.verifierAddress,
      functionName: "approveMilestone",
      args: [campaign, BigInt(milestoneId), evidenceURI],
    });
  };

  const revokeMilestone = (campaign: `0x${string}`, milestoneId: number) => {
    if (!ONCHAIN.verifierAddress) return;
    revoke.writeContract({
      abi: verifierAbi,
      address: ONCHAIN.verifierAddress,
      functionName: "revokeMilestone",
      args: [campaign, BigInt(milestoneId)],
    });
  };

  return {
    hasVerifier: Boolean(ONCHAIN.verifierAddress),
    approveMilestone,
    revokeMilestone,
    approve: {
      hash: approve.data,
      isPending: approve.isPending || approveReceipt.isLoading,
      isSuccess: approveReceipt.isSuccess,
      error: approve.error ?? approveReceipt.error,
    },
    revoke: {
      hash: revoke.data,
      isPending: revoke.isPending || revokeReceipt.isLoading,
      isSuccess: revokeReceipt.isSuccess,
      error: revoke.error ?? revokeReceipt.error,
    },
  };
}
