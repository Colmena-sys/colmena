"use client";

import Link from "next/link";
import { projects } from "@/lib/colmena-data";
import { formatEthLike, formatInteger, shortAddress } from "@/lib/format";
import {
  useCampaignActions,
  useCampaignReads,
  useFujiGuard,
  useInvestorClaimable,
  useNetworkPulse,
} from "@/hooks/use-colmena-onchain";
import { ONCHAIN } from "@/lib/onchain-config";
import { useCampaignContextStore } from "@/store/campaign-context";

export function InvestorDashboardView() {
  const activeCampaignAddress = useCampaignContextStore((state) => state.activeCampaignAddress);
  const campaignAddress = activeCampaignAddress ?? ONCHAIN.campaignAddress;
  const pulse = useNetworkPulse();
  const campaign = useCampaignReads(campaignAddress);
  const revenue = useInvestorClaimable(campaignAddress);
  const actions = useCampaignActions(campaignAddress);
  const chain = useFujiGuard();

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-8 text-[#111]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-black/50">DASHBOARD INVERSOR</p>
          <h1 className="text-3xl font-black">Portafolio y dividendos</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Wallet">{shortAddress(pulse.address)}</Card>
          <Card title="Balance">{formatEthLike(pulse.nativeBalance)} {pulse.nativeSymbol ?? "AVAX"}</Card>
          <Card title="Claimable real">
            {revenue.hasRevenue ? `${formatEthLike(revenue.claimable)} AVAX` : "Define NEXT_PUBLIC_REVENUE_SHARING_ADDRESS"}
          </Card>
          <Card title="Backers">{campaign.totalBackers ? campaign.totalBackers.toString() : "—"}</Card>
        </div>
        <div className="mt-4 rounded-lg border-2 border-black bg-white p-4 shadow-[3px_3px_0_#111]">
          <p className="text-xs font-bold uppercase tracking-wider text-black/60">Accion on-chain</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => actions.claimRevenue()}
              disabled={!actions.hasCampaignActions || actions.claim.isPending}
              className="rounded-md border-2 border-black bg-[#F5C842] px-3 py-1.5 text-xs font-extrabold"
            >
              {actions.claim.isPending ? "Reclamando..." : "Claim Revenue"}
            </button>
            {!chain.isFuji && (
              <button
                onClick={chain.switchToFuji}
                disabled={chain.isSwitching}
                className="rounded-md border-2 border-black bg-[#F5C842] px-3 py-1.5 text-xs font-extrabold"
              >
                {chain.isSwitching ? "Cambiando..." : "Switch a Fuji"}
              </button>
            )}
            {actions.claim.hash && <span className="text-[11px] text-black/60">TX: {actions.claim.hash.slice(0, 10)}...</span>}
          </div>
          {actions.claim.error && <p className="mt-1 text-[11px] font-semibold text-red-600">{actions.claim.error.message}</p>}
          {chain.switchError && <p className="mt-1 text-[11px] font-semibold text-red-600">{chain.switchError.message}</p>}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {projects.slice(0, 4).map((project) => (
            <article key={project.id} className="rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111]">
              <p className="text-xs font-bold text-black/60">{project.category}</p>
              <h2 className="mt-1 text-xl font-black">{project.title}</h2>
              <p className="text-sm text-black/65">{project.location}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full border border-black/25 bg-black/10">
                <div className="h-full bg-[#F5C842]" style={{ width: `${Math.round((project.raised / project.goal) * 100)}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold">
                ${formatInteger(project.raised)} / ${formatInteger(project.goal)}
              </p>
              <div className="mt-4 flex justify-between">
                <span className="text-xs text-black/60">{project.backers} inversores</span>
                <Link href={`/projects/${project.id}`} className="rounded-md border-2 border-black bg-black px-3 py-1.5 text-xs font-bold text-white">
                  Ver detalle
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-2 border-black bg-white p-4 shadow-[3px_3px_0_#111]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-black/60">{title}</p>
      <p className="mt-2 font-mono text-sm font-bold text-[#D4841A]">{children}</p>
    </div>
  );
}
