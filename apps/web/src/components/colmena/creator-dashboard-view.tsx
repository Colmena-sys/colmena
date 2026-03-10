"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { milestonesByProject, projects } from "@/lib/colmena-data";
import { formatEthLike, formatInteger, shortAddress } from "@/lib/format";
import { ONCHAIN } from "@/lib/onchain-config";
import {
  useCampaignActions,
  useFactoryActions,
  useFujiGuard,
  useMilestonesOnchain,
  useNetworkPulse,
} from "@/hooks/use-colmena-onchain";
import { useCampaignContextStore } from "@/store/campaign-context";

export function CreatorDashboardView() {
  const router = useRouter();
  const pulse = useNetworkPulse();
  const factory = useFactoryActions();
  const activeCampaignAddress = useCampaignContextStore((state) => state.activeCampaignAddress);
  const setActiveCampaignAddress = useCampaignContextStore((state) => state.setActiveCampaignAddress);
  const selectedCampaignAddress = factory.createdCampaignAddress ?? activeCampaignAddress ?? ONCHAIN.campaignAddress;
  const campaign = useMilestonesOnchain(selectedCampaignAddress);
  const actions = useCampaignActions(selectedCampaignAddress);
  const chain = useFujiGuard();
  const project = projects[0];
  const milestones = milestonesByProject[project.id] ?? [];
  const nextMilestoneId = Number(campaign.nextMilestoneToRelease ?? BigInt(0));
  const [metadataURI, setMetadataURI] = useState("ipfs://colmena-campaign-metadata");
  const [milestoneInput, setMilestoneInput] = useState("1,1,1");
  const [createError, setCreateError] = useState("");
  const hasAutoNavigated = useRef(false);

  useEffect(() => {
    if (!factory.createdCampaignAddress) return;
    setActiveCampaignAddress(factory.createdCampaignAddress);
    if (hasAutoNavigated.current) return;
    hasAutoNavigated.current = true;
    router.push(`/projects/${project.id}?campaign=${factory.createdCampaignAddress}`);
  }, [factory.createdCampaignAddress, setActiveCampaignAddress, router, project.id]);

  const createCampaign = () => {
    setCreateError("");
    if (!chain.isFuji) {
      setCreateError("Debes estar conectado a Avalanche Fuji para crear campaña.");
      return;
    }
    const values = milestoneInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!values.length) {
      setCreateError("Define al menos un milestone amount.");
      return;
    }
    if (values.some((value) => Number(value) <= 0 || Number.isNaN(Number(value)))) {
      setCreateError("Todos los montos deben ser números positivos (AVAX).");
      return;
    }
    if (!metadataURI.startsWith("ipfs://")) {
      setCreateError("metadataURI debe iniciar con ipfs://");
      return;
    }
    factory.createCampaign(values, metadataURI);
  };

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-8 text-[#111]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-black/50">DASHBOARD CREADOR</p>
            <h1 className="text-3xl font-black">{project.title}</h1>
          </div>
          <Link
            href={
              selectedCampaignAddress
                ? `/projects/${project.id}?campaign=${selectedCampaignAddress}`
                : `/projects/${project.id}`
            }
            className="rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-bold"
          >
            Ver proyecto publico
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Bloque">#{pulse.blockNumber ? formatInteger(pulse.blockNumber) : "—"}</Card>
          <Card title="Wallet">{shortAddress(pulse.address)}</Card>
          <Card title="Balance">{formatEthLike(pulse.nativeBalance)} {pulse.nativeSymbol ?? "AVAX"}</Card>
          <Card title="Campana">{selectedCampaignAddress ? shortAddress(selectedCampaignAddress) : "Sin direccion .env"}</Card>
        </div>
        {!chain.isFuji && (
          <div className="mt-4 rounded-lg border-2 border-black bg-yellow-50 p-4 shadow-[3px_3px_0_#111]">
            <p className="text-xs font-semibold text-black/70">Red detectada: {pulse.chainId ?? "desconocida"}</p>
            <button
              onClick={chain.switchToFuji}
              disabled={chain.isSwitching}
              className="mt-2 rounded-md border-2 border-black bg-[#F5C842] px-3 py-1.5 text-xs font-extrabold"
            >
              {chain.isSwitching ? "Cambiando..." : "Switch a Avalanche Fuji"}
            </button>
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Card title="Gross donations">{formatEthLike(campaign.totalGrossDonations)} AVAX</Card>
          <Card title="Net contributions">{formatEthLike(campaign.totalNetContributions)} AVAX</Card>
          <Card title="Released">{formatEthLike(campaign.totalReleasedToCreator)} AVAX</Card>
          <Card title="Fee paid">{formatEthLike(campaign.totalFeePaid)} AVAX</Card>
        </div>

        <div className="mt-6 rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111]">
          <h2 className="mb-3 text-lg font-black uppercase">Estado de hitos (on-chain)</h2>
          <p className="mb-4 text-sm text-black/65">
            Creador: {shortAddress(campaign.creator)} · Total hitos contrato:{" "}
            {campaign.milestoneCount ? campaign.milestoneCount.toString() : "—"} · Siguiente hito:{" "}
            {campaign.nextMilestoneToRelease ? campaign.nextMilestoneToRelease.toString() : "—"}
          </p>
          <div className="space-y-3">
            {(campaign.milestones.length
              ? campaign.milestones.map((item) => ({
                  id: item.id + 1,
                  title: `Milestone ${item.id + 1}`,
                  pct: 0,
                  amountLabel: `${formatEthLike(item.amount)} AVAX`,
                  asset: "AVAX" as const,
                  status: item.status,
                }))
              : milestones
            ).map((milestone) => (
              <div key={milestone.id} className="rounded-lg border border-black/15 bg-zinc-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold uppercase">
                    H{milestone.id} · {milestone.title}
                  </p>
                  <span className="text-xs font-semibold">{milestone.status.toUpperCase()}</span>
                </div>
                <p className="text-xs text-black/65">
                  {"amountLabel" in milestone
                    ? milestone.amountLabel
                    : `${milestone.pct}% · $${formatInteger(milestone.amount)} ${milestone.asset}`}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-black/15 bg-zinc-50 p-3">
            <p className="text-xs font-semibold text-black/70">
              Accion on-chain: liberar siguiente hito ({nextMilestoneId}) en `CampaignEscrow.releaseMilestone`.
            </p>
            <button
              onClick={() => actions.releaseMilestone(nextMilestoneId)}
              disabled={!actions.hasCampaignActions || actions.release.isPending}
              className="mt-2 rounded-md border-2 border-black bg-[#F5C842] px-4 py-2 text-xs font-extrabold"
            >
              {actions.release.isPending ? "Liberando..." : "Liberar hito on-chain"}
            </button>
            {actions.release.hash && (
              <p className="mt-1 text-[11px] text-black/60">TX release: {actions.release.hash.slice(0, 10)}...</p>
            )}
            {actions.release.error && <p className="mt-1 text-[11px] font-semibold text-red-600">{actions.release.error.message}</p>}
          </div>
        </div>

        <div className="mt-6 rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111]">
          <h2 className="mb-3 text-lg font-black uppercase">CreateCampaign (Factory wiring real)</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase">Metadata URI</label>
              <input
                value={metadataURI}
                onChange={(event) => setMetadataURI(event.target.value)}
                className="w-full rounded-md border-2 border-black px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase">Milestones (AVAX, coma)</label>
              <input
                value={milestoneInput}
                onChange={(event) => setMilestoneInput(event.target.value)}
                className="w-full rounded-md border-2 border-black px-3 py-2 text-sm"
                placeholder="1,1,1"
              />
            </div>
          </div>
          <button
            onClick={createCampaign}
            disabled={!factory.hasFactoryActions || factory.create.isPending}
            className="mt-3 rounded-md border-2 border-black bg-black px-4 py-2 text-xs font-extrabold text-white"
          >
            {factory.create.isPending ? "Creando campaña..." : "Crear campaña on-chain"}
          </button>
          {factory.create.hash && <p className="mt-1 text-[11px] text-black/60">TX create: {factory.create.hash.slice(0, 10)}...</p>}
          {factory.createdCampaignAddress && (
            <p className="mt-1 text-[11px] font-semibold text-green-700">
              Campaign creada: {factory.createdCampaignAddress}
            </p>
          )}
          {factory.create.error && <p className="mt-1 text-[11px] font-semibold text-red-600">{factory.create.error.message}</p>}
          {createError && <p className="mt-1 text-[11px] font-semibold text-red-600">{createError}</p>}
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
