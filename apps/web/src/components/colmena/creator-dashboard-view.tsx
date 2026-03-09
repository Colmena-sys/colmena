"use client";

import Link from "next/link";
import { milestonesByProject, projects } from "@/lib/colmena-data";
import { formatEthLike, formatInteger, shortAddress } from "@/lib/format";
import { ONCHAIN } from "@/lib/onchain-config";
import { useCampaignReads, useNetworkPulse } from "@/hooks/use-colmena-onchain";

export function CreatorDashboardView() {
  const pulse = useNetworkPulse();
  const campaign = useCampaignReads();
  const project = projects[0];
  const milestones = milestonesByProject[project.id] ?? [];

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-8 text-[#111]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-black/50">DASHBOARD CREADOR</p>
            <h1 className="text-3xl font-black">{project.title}</h1>
          </div>
          <Link href={`/projects/${project.id}`} className="rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-bold">
            Ver proyecto publico
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Bloque">#{pulse.blockNumber ? formatInteger(pulse.blockNumber) : "—"}</Card>
          <Card title="Wallet">{shortAddress(pulse.address)}</Card>
          <Card title="Balance">{formatEthLike(pulse.nativeBalance)} {pulse.nativeSymbol ?? "AVAX"}</Card>
          <Card title="Campana">{ONCHAIN.campaignAddress ? "On-chain conectada" : "Sin direccion .env"}</Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Card title="Gross donations">{formatEthLike(campaign.totalGrossDonations)} AVAX</Card>
          <Card title="Net contributions">{formatEthLike(campaign.totalNetContributions)} AVAX</Card>
          <Card title="Released">{formatEthLike(campaign.totalReleasedToCreator)} AVAX</Card>
          <Card title="Fee paid">{formatEthLike(campaign.totalFeePaid)} AVAX</Card>
        </div>

        <div className="mt-6 rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111]">
          <h2 className="mb-3 text-lg font-black uppercase">Estado de hitos (mixto: mock + on-chain)</h2>
          <p className="mb-4 text-sm text-black/65">
            Creador: {shortAddress(campaign.creator)} · Total hitos contrato:{" "}
            {campaign.milestoneCount ? campaign.milestoneCount.toString() : "—"} · Siguiente hito:{" "}
            {campaign.nextMilestoneToRelease ? campaign.nextMilestoneToRelease.toString() : "—"}
          </p>
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="rounded-lg border border-black/15 bg-zinc-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold uppercase">
                    H{milestone.id} · {milestone.title}
                  </p>
                  <span className="text-xs font-semibold">{milestone.status.toUpperCase()}</span>
                </div>
                <p className="text-xs text-black/65">
                  {milestone.pct}% · ${formatInteger(milestone.amount)} {milestone.asset}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-2 border-black bg-white p-4 shadow-[3px_3px_0_#111]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-black/60">{title}</p>
      <p className="mt-2 font-mono text-base font-bold text-[#D4841A]">{children}</p>
    </div>
  );
}
