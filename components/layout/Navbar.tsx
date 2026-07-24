"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Globe2, BookOpen, Database, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
  const [identity, setIdentity] = useState<{ name: string; team: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const name = sessionStorage.getItem("playerName");
    const team = sessionStorage.getItem("playerTeam");
    if (name && team) setIdentity({ name, team });
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Track scroll for background intensity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const TEAM_COLORS: Record<string, string> = {
    CSK: "#FFC107", MI: "#004BA0", RCB: "#D4213D", KKR: "#3A225D",
    DC: "#0077B6", PBKS: "#ED1B24", RR: "#EA1A85", SRH: "#F26522",
    GT: "#1B2133", LSG: "#A72056",
  };

  const navLinks = [
    { href: "/rooms", label: "Rooms", icon: Globe2 },
    { href: "/guide", label: "How to Play", icon: BookOpen },
    { href: "/players", label: "Players", icon: Database },
  ];

  const teamColor = identity ? TEAM_COLORS[identity.team] : null;

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? "border-white/[0.08] bg-[#060918]/90 backdrop-blur-2xl shadow-xl shadow-black/20"
          : "border-white/[0.04] bg-[#060918]/60 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                Draft<span className="gradient-text-accent font-extrabold ml-0.5">Forge</span>
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
                        ? "text-white"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-indicator"
                        className="absolute inset-0 rounded-lg bg-white/[0.08] shadow-sm"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Identity */}
            {identity && teamColor && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div
                  className="h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-black text-white shadow-sm"
                  style={{ backgroundColor: teamColor, boxShadow: `0 0 10px ${teamColor}40` }}
                >
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
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden pb-4 pt-2 border-t border-white/[0.04]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
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
              {identity && teamColor && (
                <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2.5 px-3">
                  <div
                    className="h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-black text-white"
                    style={{ backgroundColor: teamColor }}
                  >
                    {identity.team}
                  </div>
                  <span className="text-xs font-medium text-zinc-400">{identity.name}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
