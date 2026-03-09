"use client";

import { useMemo } from "react";
import { parseAbi } from "viem";
import { useAccount, useBalance, useBlockNumber, useReadContract, useReadContracts } from "wagmi";
import { ONCHAIN } from "@/lib/onchain-config";

const factoryAbi = parseAbi([
  "function campaignCount() view returns (uint256)",
  "function platformFeeBps() view returns (uint256)",
]);

const escrowAbi = parseAbi([
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

export function useInvestorClaimable() {
  const { address } = useAccount();
  const enabled = Boolean(ONCHAIN.revenueSharingAddress && ONCHAIN.campaignAddress && address);

  const claimable = useReadContract({
    abi: revenueAbi,
    address: ONCHAIN.revenueSharingAddress,
    functionName: "claimable",
    args: enabled ? [ONCHAIN.campaignAddress!, address!] : undefined,
    query: { enabled },
  });

  return {
    hasRevenue: Boolean(ONCHAIN.revenueSharingAddress),
    claimable: claimable.data,
  };
}
