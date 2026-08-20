"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Globe2, BookOpen, Users, Menu, X } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IPL_TEAMS } from "@/lib/design-tokens";
import { TeamLogo } from "@/components/ui/TeamLogo";

const NavbarInner = React.memo(function NavbarInner() {
  const pathname = usePathname();
  const [identity, setIdentity] = useState<{ name: string; team: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const syncIdentity = () => {
    const name = sessionStorage.getItem("playerName");
    const team = sessionStorage.getItem("playerTeam");
    if (name && team) {
      setIdentity({ name, team });
    } else {
      setIdentity(null);
    }
  };

  useEffect(() => {
    syncIdentity();
    window.addEventListener("playerIdentityChanged", syncIdentity);
    window.addEventListener("storage", syncIdentity);
    return () => {
      window.removeEventListener("playerIdentityChanged", syncIdentity);
      window.removeEventListener("storage", syncIdentity);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 15);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const navLinks = [
    { href: "/rooms", label: "Rooms", icon: Globe2 },
    { href: "/players", label: "Players", icon: Users },
    { href: "/guide", label: "Guide", icon: BookOpen },
  ];

  const userTeam = identity ? IPL_TEAMS.find((t) => t.id === identity.team) : null;

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#030712]/90 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-[#030712]/60 backdrop-blur-md border-b border-white/5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight text-white">
                Draft<span className="text-amber-400">Forge</span>
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
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "text-white bg-white/10 border border-white/10"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                    }`}
                  >
                    <link.icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-zinc-500"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Identity Franchise Chip */}
            {userTeam && identity && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-panel border border-white/10">
                <TeamLogo teamId={userTeam.id} size="sm" />
                <span className="text-xs font-medium text-zinc-200">
                  {identity.name}
                </span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl glass-panel text-zinc-400 hover:text-white"
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden pb-4 pt-2 border-t border-white/10"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {userTeam && identity && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2.5 px-4">
                  <div
                    className="h-6 w-6 rounded-lg flex items-center justify-center font-display text-[10px] font-bold"
                    style={{
                      backgroundColor: userTeam.color,
                      color: userTeam.textOnColor,
                    }}
                  >
                    {userTeam.short}
                  </div>
                  <span className="text-xs font-medium text-zinc-200">
                    {identity.name} ({userTeam.name})
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
});

export function Navbar() {
  return <NavbarInner />;
}
