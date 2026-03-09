"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Landing" },
  { href: "/creator", label: "Creator" },
  { href: "/investor", label: "Investor" },
  { href: "/explorer", label: "Explorer" },
  { href: "/admin", label: "Admin" },
  { href: "/onboarding", label: "Onboarding" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-black bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-black bg-[#F5C842] font-black">
            C
          </span>
          <span className="text-sm font-black tracking-wider">COLMENA</span>
          <span className="rounded-full border border-[#E84142] bg-[#FFF0F0] px-2 py-0.5 text-[10px] font-bold text-[#E84142]">
            FUJI
          </span>
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md border-2 px-3 py-1.5 text-xs font-extrabold tracking-wide ${
                  active ? "border-black bg-[#F5C842]" : "border-black/70 bg-white hover:border-black"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <ConnectButton chainStatus="icon" showBalance={false} />
      </nav>
    </header>
  );
}
