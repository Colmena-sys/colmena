"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import type { Milestone, Project } from "@/lib/colmena-data";
import { formatInteger } from "@/lib/format";

type Props = {
  project: Project;
  milestones: Milestone[];
};

type Tab = "hitos" | "updates" | "onchain";

function statusStyles(status: Milestone["status"]) {
  if (status === "released") return "border-green-500 bg-green-50 text-green-800";
  if (status === "active") return "border-yellow-500 bg-yellow-50 text-yellow-800";
  return "border-zinc-300 bg-zinc-100 text-zinc-600";
}

export function ProjectView({ project, milestones }: Props) {
  const [tab, setTab] = useState<Tab>("hitos");
  const [asset, setAsset] = useState<"USDC" | "AVAX">("USDC");
  const [amount, setAmount] = useState("");
  const [txState, setTxState] = useState<"idle" | "confirming" | "success">("idle");

  const progress = Math.min(100, Math.round((project.raised / project.goal) * 100));

  const doDonate = () => {
    if (!amount) return;
    setTxState("confirming");
    window.setTimeout(() => setTxState("success"), 1200);
  };

  return (
    <main className="min-h-screen bg-zinc-100 text-[#111111]">
      <section className="border-b-2 border-black bg-[#F5C842]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-3 inline-flex rounded-full border border-black bg-black px-3 py-1 text-[10px] font-bold tracking-widest text-white">
            {project.category} · FUJI
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">{project.title}</h1>
          <p className="mt-2 text-sm font-semibold text-black/70">{project.location}</p>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-black/80">{project.summary}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="flex rounded-lg border-2 border-black bg-white p-1">
            {(["hitos", "updates", "onchain"] as const).map((current) => (
              <button
                key={current}
                onClick={() => setTab(current)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-extrabold uppercase tracking-wide ${
                  tab === current ? "bg-[#F5C842]" : "text-black/65"
                }`}
              >
                {current}
              </button>
            ))}
          </div>

          {tab === "hitos" && (
            <div className="overflow-hidden rounded-xl border-2 border-black bg-white shadow-[4px_4px_0_#111]">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="border-b border-zinc-200 p-4 last:border-b-0">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black uppercase">
                      H{milestone.id} · {milestone.title}
                    </h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyles(milestone.status)}`}>
                      {milestone.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-black/70">
                    {milestone.pct}% · ${formatInteger(milestone.amount)} {milestone.asset} · {milestone.date}
                  </p>
                  {milestone.status === "active" && (
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-[11px] font-semibold">
                        <span>Quorum</span>
                        <span>
                          {milestone.votes}/{milestone.required}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full border border-black/25 bg-black/10">
                        <div
                          className="h-full bg-[#F5C842]"
                          style={{ width: `${Math.min(100, Math.round((milestone.votes / milestone.required) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "updates" && (
            <div className="rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111]">
              <p className="text-sm font-bold">Hito 2 completado. Evidencia IPFS anclada en Avalanche Fuji.</p>
              <p className="mt-2 text-sm text-black/70">50 hogares electrificados en Boyaca con trazabilidad on-chain.</p>
            </div>
          )}

          {tab === "onchain" && (
            <div className="rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111]">
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Contrato:</strong> {project.contract}
                </p>
                <p>
                  <strong>Red:</strong> Avalanche Fuji (43113)
                </p>
                <p>
                  <strong>Token:</strong> {project.tokenSymbol}
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-xl border-2 border-black bg-white shadow-[4px_4px_0_#111]">
          <div className="border-b-2 border-black bg-[#F5C842] p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wider">Capital en escrow</p>
            <p className="mt-1 font-mono text-3xl font-bold text-[#D4841A]">
              ${formatInteger(project.raised)} <span className="text-sm text-black/60">USDC</span>
            </p>
            <p className="text-xs text-black/70">
              de ${formatInteger(project.goal)} · {project.backers} inversores
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full border border-black/30 bg-black/10">
              <div className="h-full bg-green-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="space-y-3 p-4">
            <ConnectButton showBalance={false} />
            {txState === "success" ? (
              <div className="rounded-md border-2 border-green-500 bg-green-50 p-3 text-sm font-semibold text-green-800">
                Inversion confirmada en Fuji.
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase">Activo</label>
                  <select
                    className="w-full rounded-md border-2 border-black px-3 py-2 text-sm"
                    value={asset}
                    onChange={(event) => setAsset(event.target.value as "USDC" | "AVAX")}
                  >
                    <option value="USDC">USDC</option>
                    <option value="AVAX">AVAX</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase">Monto</label>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-md border-2 border-black px-3 py-2 text-sm"
                    placeholder="0.00"
                    type="number"
                  />
                </div>
                <button
                  onClick={doDonate}
                  className="w-full rounded-md border-2 border-black bg-[#E84142] px-4 py-2 text-sm font-extrabold text-white"
                >
                  {txState === "confirming" ? "Confirmando..." : `Donar ${amount || "..."} ${asset}`}
                </button>
              </>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
