import { isAddress } from "viem";

function maybeAddress(value: string | undefined): `0x${string}` | undefined {
  if (!value) return undefined;
  return isAddress(value) ? (value as `0x${string}`) : undefined;
}

export const ONCHAIN = {
  factoryAddress: maybeAddress(process.env.NEXT_PUBLIC_FACTORY_ADDRESS),
  campaignAddress: maybeAddress(process.env.NEXT_PUBLIC_CAMPAIGN_ADDRESS),
  revenueSharingAddress: maybeAddress(process.env.NEXT_PUBLIC_REVENUE_SHARING_ADDRESS),
};
