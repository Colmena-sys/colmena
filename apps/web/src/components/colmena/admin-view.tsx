"use client";

import { formatEthLike, formatInteger, shortAddress } from "@/lib/format";
import { useContractsConfig } from "@/lib/contracts";
import {
  useCampaignReads,
  useFactoryReads,
  useFujiGuard,
  useNetworkPulse,
  useVerifierActions,
} from "@/hooks/use-colmena-onchain";
import { useCampaignContextStore } from "@/store/campaign-context";

export function AdminView() {
  const { contracts } = useContractsConfig();
  const activeCampaignAddress = useCampaignContextStore((state) => state.activeCampaignAddress);
  const campaignAddress = activeCampaignAddress ?? contracts.CampaignEscrow;
  const pulse = useNetworkPulse();
  const factory = useFactoryReads();
  const campaign = useCampaignReads(campaignAddress);
  const verifier = useVerifierActions();
  const chain = useFujiGuard();

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
          <Card title="Factory">{shortAddress(contracts.ColmenaFactory)}</Card>
          <Card title="Campaign">{shortAddress(campaignAddress)}</Card>
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
          <div className="mt-4 rounded-lg border border-white/20 bg-black/20 p-3">
            <p className="text-xs text-white/70">
              Accion verificador: aprobar hito actual en `MilestoneVerifier.approveMilestone`.
            </p>
            <button
              onClick={() =>
                campaignAddress &&
                verifier.approveMilestone(
                  campaignAddress,
                  Number(campaign.nextMilestoneToRelease ?? BigInt(0)),
                  "ipfs://colmena-evidence-placeholder"
                )
              }
              disabled={!verifier.hasVerifier || !campaignAddress || verifier.approve.isPending}
              className="mt-2 rounded border border-[#F5C842] bg-[#F5C842] px-3 py-1.5 text-xs font-extrabold text-black"
            >
              {verifier.approve.isPending ? "Aprobando..." : "Aprobar hito on-chain"}
            </button>
            <button
              onClick={() =>
                campaignAddress &&
                verifier.revokeMilestone(campaignAddress, Number(campaign.nextMilestoneToRelease ?? BigInt(0)))
              }
              disabled={!verifier.hasVerifier || !campaignAddress || verifier.revoke.isPending}
              className="ml-2 mt-2 rounded border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-white"
            >
              {verifier.revoke.isPending ? "Revocando..." : "Revocar hito"}
            </button>
            {!chain.isFuji && (
              <button
                onClick={chain.switchToFuji}
                disabled={chain.isSwitching}
                className="ml-2 mt-2 rounded border border-[#F5C842] bg-[#F5C842] px-3 py-1.5 text-xs font-extrabold text-black"
              >
                {chain.isSwitching ? "Cambiando..." : "Switch a Fuji"}
              </button>
            )}
            {verifier.approve.hash && (
              <p className="mt-1 text-[11px] text-white/60">TX approve: {verifier.approve.hash.slice(0, 10)}...</p>
            )}
            {verifier.approve.error && (
              <p className="mt-1 text-[11px] font-semibold text-red-300">{verifier.approve.error.message}</p>
            )}
            {verifier.revoke.error && <p className="mt-1 text-[11px] font-semibold text-red-300">{verifier.revoke.error.message}</p>}
            {chain.switchError && <p className="mt-1 text-[11px] font-semibold text-red-300">{chain.switchError.message}</p>}
          </div>
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
