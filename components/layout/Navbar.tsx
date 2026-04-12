"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Globe2, BookOpen, Database, User } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [identity, setIdentity] = useState<{ name: string; team: string } | null>(null);

  useEffect(() => {
    const name = sessionStorage.getItem("playerName");
    const team = sessionStorage.getItem("playerTeam");
    if (name && team) setIdentity({ name, team });
  }, []);

  const TEAM_COLORS: Record<string, string> = {
    CSK: "bg-[#FFC107] text-slate-900",
    MI: "bg-[#004BA0] text-white",
    RCB: "bg-[#D4213D] text-white",
    KKR: "bg-[#3A225D] text-white",
    DC: "bg-[#0077B6] text-white",
    PBKS: "bg-[#ED1B24] text-white",
    RR: "bg-[#EA1A85] text-white",
    SRH: "bg-[#F26522] text-white",
    GT: "bg-[#1B2133] text-white",
    LSG: "bg-[#A72056] text-white",
  };

  const navLinks = [
    { href: "/browse", label: "Browse", icon: Globe2 },
    { href: "/how-to-play", label: "How to Play", icon: BookOpen },
    { href: "/players", label: "Players", icon: Database },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#060609]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-base font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                IPL AUCTION<span className="text-amber-500"> PRO</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Identity */}
          {identity && (
            <div className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-black ${TEAM_COLORS[identity.team] || "bg-slate-700 text-white"}`}>
                {identity.team}
              </div>
              <span className="text-xs font-medium text-slate-400 hidden sm:block">
                {identity.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
