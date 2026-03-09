"use client";

import Link from "next/link";
import { projects } from "@/lib/colmena-data";
import { formatEthLike, formatInteger, shortAddress } from "@/lib/format";
import { ONCHAIN } from "@/lib/onchain-config";
import { useCampaignReads, useFactoryReads, useNetworkPulse } from "@/hooks/use-colmena-onchain";

export function ExplorerView() {
  const pulse = useNetworkPulse();
  const factory = useFactoryReads();
  const campaign = useCampaignReads();

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-white/40">EXPLORADOR ON-CHAIN</p>
          <h1 className="text-4xl font-black">Transparencia radical</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Block">{pulse.blockNumber ? `#${formatInteger(pulse.blockNumber)}` : "—"}</Card>
          <Card title="Factory">{factory.hasFactory ? shortAddress(ONCHAIN.factoryAddress) : "No configurada"}</Card>
          <Card title="Campaigns">{factory.campaignCount ? factory.campaignCount.toString() : "—"}</Card>
          <Card title="Fee bps">{factory.platformFeeBps ? factory.platformFeeBps.toString() : "—"}</Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card title="Gross">{formatEthLike(campaign.totalGrossDonations)} AVAX</Card>
          <Card title="Released">{formatEthLike(campaign.totalReleasedToCreator)} AVAX</Card>
          <Card title="Backers">{campaign.totalBackers ? campaign.totalBackers.toString() : "—"}</Card>
        </div>

        <div className="mt-6 rounded-xl border border-white/20 bg-white/5 p-5">
          <p className="text-sm text-white/70">
            Factory activa: {factory.hasFactory ? shortAddress(ONCHAIN.factoryAddress) : "sin datos on-chain"}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project.id} className="rounded-xl border border-white/20 bg-white/5 p-4">
              <p className="text-xs font-bold text-white/60">{project.category}</p>
              <h2 className="mt-1 text-xl font-black">{project.title}</h2>
              <p className="text-sm text-white/65">{project.contract}</p>
              <div className="mt-3 flex justify-between">
                <span className="text-xs text-white/60">${formatInteger(project.raised)} recaudado</span>
                <Link href={`/projects/${project.id}`} className="rounded border border-white/40 px-2 py-1 text-xs font-bold">
                  Abrir
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
    <div className="rounded-lg border border-white/25 bg-white/10 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">{title}</p>
      <p className="mt-2 font-mono text-base font-bold text-[#F5C842]">{children}</p>
    </div>
  );
}
