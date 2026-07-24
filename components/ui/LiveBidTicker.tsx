"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel } from "lucide-react";
import { IPL_TEAMS, getBidEscalationColor } from "@/lib/design-tokens";
import { TeamLogo } from "./TeamLogo";

const MOCK_BIDS = [
  { player: "Heinrich Klaasen", role: "WK-BAT", team: "SRH", bid: 23.0, status: "RTM" },
  { player: "Rishabh Pant", role: "WK-BAT", team: "LSG", bid: 27.0, status: "Top Bid" },
  { player: "Shreyas Iyer", role: "BAT", team: "PBKS", bid: 26.75, status: "Captain" },
  { player: "Jos Buttler", role: "WK-BAT", team: "GT", bid: 15.75, status: "Marquee" },
  { player: "Trent Boult", role: "BOWL", team: "MI", bid: 12.5, status: "Pace" },
  { player: "Mitchell Starc", role: "BOWL", team: "DC", bid: 11.75, status: "Overseas" },
];

export function LiveBidTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % MOCK_BIDS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const current = MOCK_BIDS[index];
  const teamInfo = IPL_TEAMS.find((t) => t.id === current.team) || IPL_TEAMS[0];
  const escalation = getBidEscalationColor(current.bid);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400">
            Live Bidding Preview
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Gavel className="h-3.5 w-3.5 text-amber-400" />
          <span>Real-Time Demo</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          {/* Player info */}
          <div className="flex items-center gap-3">
            <TeamLogo teamId={current.team} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-white">{current.player}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                  {current.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Highest bidder: <span className="font-semibold text-zinc-200">{teamInfo.name}</span>
              </p>
            </div>
          </div>

          {/* Bid amount */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {current.status}
            </span>
            <div className={`px-3.5 py-1.5 rounded-xl border font-mono font-bold text-lg tabular-nums ${escalation.bg} ${escalation.text} ${escalation.border}`}>
              ₹{current.bid.toFixed(2)} Cr
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

