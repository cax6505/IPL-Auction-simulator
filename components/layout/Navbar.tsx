"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Trophy, Globe2, BookOpen, Database, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [identity, setIdentity] = useState<{ name: string; team: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const name = sessionStorage.getItem("playerName");
    const team = sessionStorage.getItem("playerTeam");
    if (name && team) setIdentity({ name, team });
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const TEAM_COLORS: Record<string, { bg: string; text: string }> = {
    CSK: { bg: "bg-[#FFC107]", text: "text-zinc-900" },
    MI: { bg: "bg-[#004BA0]", text: "text-white" },
    RCB: { bg: "bg-[#D4213D]", text: "text-white" },
    KKR: { bg: "bg-[#3A225D]", text: "text-white" },
    DC: { bg: "bg-[#0077B6]", text: "text-white" },
    PBKS: { bg: "bg-[#ED1B24]", text: "text-white" },
    RR: { bg: "bg-[#EA1A85]", text: "text-white" },
    SRH: { bg: "bg-[#F26522]", text: "text-white" },
    GT: { bg: "bg-[#1B2133]", text: "text-white" },
    LSG: { bg: "bg-[#A72056]", text: "text-white" },
  };

  const navLinks = [
    { href: "/browse", label: "Browse", icon: Globe2 },
    { href: "/how-to-play", label: "How to Play", icon: BookOpen },
    { href: "/players", label: "Players", icon: Database },
  ];

  const teamStyle = identity ? TEAM_COLORS[identity.team] : null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow bg-black">
                <Image src="/logo.png" alt="IPL Auction Logo" fill className="object-cover" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                IPL Auction<span className="gradient-text-amber font-extrabold ml-0.5">PRO</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ease-spring ${
                      isActive
                        ? "bg-white/[0.08] text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-amber-500/0 via-amber-500/70 to-amber-500/0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Identity */}
            {identity && teamStyle && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-black ${teamStyle.bg} ${teamStyle.text} shadow-sm`}>
                  {identity.team}
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  {identity.name}
                </span>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-white/[0.04] animate-slide-down">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/[0.06] text-white"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
            {identity && teamStyle && (
              <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2.5 px-3">
                <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-black ${teamStyle.bg} ${teamStyle.text}`}>
                  {identity.team}
                </div>
                <span className="text-xs font-medium text-zinc-400">{identity.name}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
