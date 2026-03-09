"use client";

import { formatEthLike, formatInteger, shortAddress } from "@/lib/format";
import { ONCHAIN } from "@/lib/onchain-config";
import { useCampaignReads, useFactoryReads, useNetworkPulse } from "@/hooks/use-colmena-onchain";

export function AdminView() {
  const pulse = useNetworkPulse();
  const factory = useFactoryReads();
  const campaign = useCampaignReads();

  const alerts: string[] = [];
  if (campaign.donationsPaused) alerts.push("Donaciones en pausa");
  if ((campaign.totalBackers ?? BigInt(0)) === BigInt(0)) alerts.push("Campana sin backers");
  if (
    (campaign.nextMilestoneToRelease ?? BigInt(0)) >= (campaign.milestoneCount ?? BigInt(1)) &&
    campaign.milestoneCount
  ) {
    alerts.push("Todos los hitos procesados");
  }

  return (
    <main className="min-h-screen bg-[#111] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-white/40">ADMIN</p>
          <h1 className="text-3xl font-black">Resumen global del protocolo</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card title="Block">{pulse.blockNumber ? formatInteger(pulse.blockNumber) : "—"}</Card>
          <Card title="Factory">{shortAddress(ONCHAIN.factoryAddress)}</Card>
          <Card title="Campaign">{shortAddress(ONCHAIN.campaignAddress)}</Card>
          <Card title="Campaigns">{factory.campaignCount ? factory.campaignCount.toString() : "—"}</Card>
          <Card title="Fee">{factory.platformFeeBps ? `${factory.platformFeeBps.toString()} bps` : "—"}</Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Card title="Gross">{formatEthLike(campaign.totalGrossDonations)} AVAX</Card>
          <Card title="Net">{formatEthLike(campaign.totalNetContributions)} AVAX</Card>
          <Card title="Released">{formatEthLike(campaign.totalReleasedToCreator)} AVAX</Card>
          <Card title="Treasury fee">{formatEthLike(campaign.totalFeePaid)} AVAX</Card>
        </div>

        <div className="mt-6 rounded-xl border border-white/20 bg-white/5 p-5">
          <h2 className="text-lg font-black uppercase">Alertas operativas</h2>
          {alerts.length === 0 ? (
            <p className="mt-2 text-sm text-green-300">Sin alertas criticas detectadas.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-yellow-300">
              {alerts.map((alert) => (
                <li key={alert}>- {alert}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-white/55">
            Estado donaciones: {campaign.donationsPaused ? "PAUSADAS" : "ACTIVAS"} · Creador: {shortAddress(campaign.creator)}
          </p>
        </div>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/25 bg-white/10 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">{title}</p>
      <p className="mt-2 font-mono text-sm font-bold text-[#F5C842]">{children}</p>
    </div>
  );
}
