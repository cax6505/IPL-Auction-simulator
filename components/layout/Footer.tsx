"use client";

import Link from "next/link";
import { Activity, Share2 } from "lucide-react";
import { motion } from "framer-motion";

export function Footer() {
  const shareWebsite = () => {
    if (typeof window !== "undefined") {
      const text = "Check out DraftForge — the ultimate multiplayer cricket auction simulator! Draft players in real-time with friends: ";
      const url = window.location.origin;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + url)}`, "_blank");
    }
  };

  return (
    <footer className="w-full bg-[#040710] border-t border-transparent mt-auto relative overflow-hidden">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Logo / Tagline */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <Activity className="h-5 w-5 text-red-500" />
              <span className="font-black tracking-tight text-white text-base font-display uppercase">
                DRAFT<span className="gradient-text-accent">FORGE</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              A real-time multiplayer cricket manager draft room simulator. Experience the tactical intensity of the IPL Mega Auction.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Navigation</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link href="/" className="text-zinc-500 hover:text-red-400 transition-colors duration-200">Home</Link>
              <Link href="/rooms" className="text-zinc-500 hover:text-red-400 transition-colors duration-200">Browse Rooms</Link>
              <Link href="/players" className="text-zinc-500 hover:text-red-400 transition-colors duration-200">Scout Database</Link>
              <Link href="/guide" className="text-zinc-500 hover:text-red-400 transition-colors duration-200">How To Play</Link>
            </div>
          </div>

          {/* Share / Social */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Spread the word</h4>
            <p className="text-xs text-zinc-500 leading-normal font-medium">
              Challenge your friends to a bidding war in your custom war room.
            </p>
            <motion.button
              onClick={shareWebsite}
              className="mt-1 self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-xs font-bold transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Share2 className="h-3.5 w-3.5" /> Share on WhatsApp
            </motion.button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-zinc-600 font-mono">
            &copy; {new Date().getFullYear()} DraftForge. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600">
            <span>Powered by Next.js & Supabase</span>
            <span className="h-3 w-px bg-white/10" />
            <span className="text-red-500/60">Disclaimer: Unofficial Simulator</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
