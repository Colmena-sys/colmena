"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type Role = "backer" | "creator";
type Step = 0 | 1 | 2 | 3;

export function OnboardingView() {
  const [step, setStep] = useState<Step>(0);
  const [role, setRole] = useState<Role>("backer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const canContinue = (currentStep: Step) => {
    if (currentStep === 2) return Boolean(name && email);
    return true;
  };

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <section className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[340px_1fr]">
        <aside className="border-b-2 border-black bg-[#F5C842] p-8 lg:min-h-[calc(100vh-4rem)] lg:border-r-2 lg:border-b-0">
          <div className="mb-6 text-5xl">🐝</div>
          <h1 className="text-4xl leading-[0.9] font-black uppercase">
            El capital
            <br />
            con reglas
          </h1>
          <p className="mt-4 text-sm leading-6 text-black/75">
            Flujo inicial para inversores y creadores en Avalanche Fuji con wallet connect y perfil.
          </p>
          <ul className="mt-5 space-y-2 text-xs font-semibold">
            <li>🔺 Avalanche Fuji · Chain 43113</li>
            <li>🔒 Escrow por hitos verificables</li>
            <li>⚡ Integracion inicial con wagmi/rainbowkit</li>
          </ul>
        </aside>

        <div className="p-6 md:p-10">
          <div className="mx-auto max-w-xl">
            <div className="mb-8 flex items-center gap-2">
              {[0, 1, 2, 3].map((current) => (
                <div key={current} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-extrabold ${
                      step >= current ? "border-black bg-[#F5C842]" : "border-zinc-300 bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {current + 1}
                  </div>
                  {current < 3 && <div className={`h-1 flex-1 ${step > current ? "bg-[#F5C842]" : "bg-zinc-200"}`} />}
                </div>
              ))}
            </div>

            {step === 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-black uppercase">Quien eres</h2>
                <div className="grid gap-3">
                  <button
                    onClick={() => setRole("backer")}
                    className={`rounded-lg border-2 p-4 text-left ${
                      role === "backer" ? "border-black bg-[#F5C842]" : "border-zinc-300"
                    }`}
                  >
                    <p className="text-sm font-extrabold uppercase">Inversor / Donante</p>
                    <p className="text-sm text-black/70">Apoyas proyectos y recibes distribucion en tokens.</p>
                  </button>
                  <button
                    onClick={() => setRole("creator")}
                    className={`rounded-lg border-2 p-4 text-left ${
                      role === "creator" ? "border-black bg-[#F5C842]" : "border-zinc-300"
                    }`}
                  >
                    <p className="text-sm font-extrabold uppercase">Creador de proyecto</p>
                    <p className="text-sm text-black/70">Publicas campanas y gestionas hitos on-chain.</p>
                  </button>
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-black uppercase">Conecta tu wallet</h2>
                <p className="text-sm text-black/70">
                  Integracion inicial con RainbowKit para flujo real de wallet en Fuji.
                </p>
                <div className="rounded-lg border-2 border-black bg-zinc-50 p-4">
                  <ConnectButton showBalance={false} />
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-black uppercase">Completa tu perfil</h2>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase">Nombre</label>
                  <input
                    className="w-full rounded-md border-2 border-black px-3 py-2"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase">Email</label>
                  <input
                    className="w-full rounded-md border-2 border-black px-3 py-2"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu@email.com"
                    type="email"
                  />
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="rounded-lg border-2 border-green-500 bg-green-50 p-5">
                <h2 className="text-2xl font-black uppercase text-green-800">Cuenta lista</h2>
                <p className="mt-2 text-sm text-green-900">
                  Perfil: {role === "creator" ? "Creador" : "Inversor"} · {name || "Sin nombre"}.
                </p>
              </section>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep((prev) => (prev > 0 ? ((prev - 1) as Step) : prev))}
                className="rounded-md border-2 border-black px-4 py-2 text-sm font-extrabold"
              >
                Anterior
              </button>
              {step < 3 ? (
                <button
                  onClick={() => {
                    if (canContinue(step)) setStep((prev) => (prev < 3 ? ((prev + 1) as Step) : prev));
                  }}
                  className="rounded-md border-2 border-black bg-black px-4 py-2 text-sm font-extrabold text-white"
                >
                  Siguiente
                </button>
              ) : (
                <span className="text-sm font-bold text-black/60">Onboarding completado</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
