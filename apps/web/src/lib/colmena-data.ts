export type Category = "TODOS" | "ENERGIA" | "AGRI-TECH" | "EDUCACION" | "FINTECH" | "SALUD" | "AGUA";

export type Project = {
  id: string;
  category: Exclude<Category, "TODOS">;
  title: string;
  location: string;
  raised: number;
  goal: number;
  backers: number;
  daysLeft: number;
  summary: string;
  creator: string;
  contract: string;
  tokenSymbol: string;
};

export type MilestoneStatus = "released" | "active" | "pending";

export type Milestone = {
  id: number;
  title: string;
  pct: number;
  amount: number;
  asset: "USDC" | "AVAX";
  status: MilestoneStatus;
  date: string;
  hash: string | null;
  votes: number;
  required: number;
};

export const categories: Category[] = ["TODOS", "ENERGIA", "AGRI-TECH", "EDUCACION", "FINTECH", "SALUD", "AGUA"];

export const projects: Project[] = [
  {
    id: "1",
    category: "ENERGIA",
    title: "SolarHogar LATAM",
    location: "Bogota, CO",
    raised: 18400,
    goal: 25000,
    backers: 143,
    daysLeft: 12,
    summary: "Paneles solares para 150 hogares rurales con hitos auditables.",
    creator: "Valentina Torres",
    contract: "0xA3f2...9c4E",
    tokenSymbol: "SLR",
  },
  {
    id: "2",
    category: "AGRI-TECH",
    title: "AgroDAO Bolivia",
    location: "Santa Cruz, BO",
    raised: 31000,
    goal: 40000,
    backers: 211,
    daysLeft: 5,
    summary: "Cooperativa agricola tokenizada con revenue sharing.",
    creator: "Sergio Rojas",
    contract: "0xB7d1...5a1F",
    tokenSymbol: "AGR",
  },
  {
    id: "3",
    category: "EDUCACION",
    title: "Aula Digital MX",
    location: "Oaxaca, MX",
    raised: 9200,
    goal: 15000,
    backers: 87,
    daysLeft: 22,
    summary: "Tablets y conectividad para 500 ninos en zonas marginadas.",
    creator: "Marta Leon",
    contract: "0xD5c3...7d2B",
    tokenSymbol: "EDU",
  },
  {
    id: "4",
    category: "FINTECH",
    title: "MicroPrestamo AR",
    location: "Buenos Aires, AR",
    raised: 44200,
    goal: 50000,
    backers: 318,
    daysLeft: 8,
    summary: "Microcreditos con scoring reputacional y custodia en escrow.",
    creator: "Nicolas Pereyra",
    contract: "0xC2f0...8b3A",
    tokenSymbol: "MPR",
  },
];

export const milestonesByProject: Record<string, Milestone[]> = {
  "1": [
    {
      id: 1,
      title: "Adquisicion de Equipos",
      pct: 30,
      amount: 7500,
      asset: "USDC",
      status: "released",
      date: "Feb 2025",
      hash: "0x7f3a...d92b",
      votes: 143,
      required: 100,
    },
    {
      id: 2,
      title: "Instalacion Lote 1 (50 hogares)",
      pct: 30,
      amount: 7500,
      asset: "USDC",
      status: "released",
      date: "Mar 2025",
      hash: "0x2c1e...4a88",
      votes: 128,
      required: 100,
    },
    {
      id: 3,
      title: "Instalacion Lote 2 (100 hogares)",
      pct: 25,
      amount: 6250,
      asset: "USDC",
      status: "active",
      date: "Abr 2025",
      hash: null,
      votes: 47,
      required: 72,
    },
    {
      id: 4,
      title: "Operacion y mantenimiento",
      pct: 15,
      amount: 3750,
      asset: "USDC",
      status: "pending",
      date: "Jun 2025",
      hash: null,
      votes: 0,
      required: 72,
    },
  ],
};

export function getProjectById(id: string) {
  return projects.find((project) => project.id === id);
}
