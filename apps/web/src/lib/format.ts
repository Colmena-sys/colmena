import { formatEther } from "viem";

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatInteger(value: number | bigint) {
  return integerFormatter.format(value);
}

export function formatEthLike(value: bigint | undefined, maxDecimals = 4) {
  if (value === undefined) return "0";
  const amount = Number(formatEther(value));
  return amount.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

export function shortAddress(address?: string) {
  if (!address || address.length < 10) return "Sin conectar";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
