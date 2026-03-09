"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categories, type Category, projects } from "@/lib/colmena-data";
import { formatInteger } from "@/lib/format";

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-black/15 bg-white px-4 py-3 text-center shadow-[2px_2px_0_#111]">
      <p className="font-mono text-lg font-bold text-[#D4841A]">{value}</p>
      <p className="mt-1 text-[11px] font-semibold tracking-wide text-black/65">{label}</p>
    </div>
  );
}

export function LandingView() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("TODOS");

  const filteredProjects = useMemo(() => {
    if (selectedCategory === "TODOS") return projects;
    return projects.filter((project) => project.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <main className="min-h-screen bg-[#FFF8E1] text-[#111111]">
      <section className="border-b-2 border-black bg-[#F5C842]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="mb-5 inline-flex rounded-full border-2 border-black bg-black px-4 py-1 text-xs font-bold tracking-wider text-white">
            AVALANCHE FUJI · CHAIN 43113
          </p>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            EL CAPITAL SIN FRICCION
            <br />
            PARA IMPACTO EN LATAM
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-black/75">
            Crowdfunding descentralizado con escrow por hitos. Los fondos se liberan solo cuando la evidencia es
            validada on-chain.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#projects"
              className="rounded-md border-2 border-black bg-black px-5 py-3 text-sm font-extrabold tracking-wide text-white shadow-[4px_4px_0_#111] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              Explorar Proyectos
            </a>
            <Link
              href="/onboarding"
              className="rounded-md border-2 border-black bg-white px-5 py-3 text-sm font-extrabold tracking-wide shadow-[4px_4px_0_#111] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              Empezar onboarding
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric value="Fuji" label="Red" />
            <Metric value="$284K" label="En escrow" />
            <Metric value="~2s" label="Finalidad" />
            <Metric value="47" label="Proyectos activos" />
          </div>
        </div>
      </section>

      <section id="projects" className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-black/60">CATALOGO WEB3</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Proyectos con escrow verificable</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = category === selectedCategory;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-bold tracking-wide transition ${
                    isActive
                      ? "border-black bg-[#F5C842] text-black"
                      : "border-black/60 bg-white text-black/75 hover:border-black hover:text-black"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {filteredProjects.map((project) => {
            const progress = Math.min(100, Math.round((project.raised / project.goal) * 100));
            return (
              <article key={project.id} className="rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111]">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-black/30 bg-[#FFF0F0] px-2 py-1 text-[11px] font-bold text-[#E84142]">
                    {project.category}
                  </span>
                  <span className="text-xs font-semibold text-black/60">{project.daysLeft} dias restantes</span>
                </div>
                <h3 className="mt-3 text-xl font-black tracking-tight">{project.title}</h3>
                <p className="mt-1 text-sm font-semibold text-[#D4841A]">{project.location}</p>
                <p className="mt-3 text-sm leading-6 text-black/70">{project.summary}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full border border-black/30 bg-black/10">
                  <div className="h-full rounded-full bg-[#F5C842]" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                  <span>
                    ${formatInteger(project.raised)} / ${formatInteger(project.goal)}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-black/60">{project.backers} inversores</span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="rounded-md border-2 border-black bg-black px-3 py-2 text-xs font-extrabold tracking-wide text-white"
                  >
                    Ver detalle
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
