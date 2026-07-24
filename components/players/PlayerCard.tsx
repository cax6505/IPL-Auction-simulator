"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import type { PlayerRecord } from "@/lib/types/player";

export function PlayerCard({ player }: { player: PlayerRecord }) {
  const [isShortlisted, setIsShortlisted] = useState(false);

  useEffect(() => {
    const shortlist = JSON.parse(localStorage.getItem("ipl_shortlist") || "[]");
    setIsShortlisted(shortlist.includes(player.id));
  }, [player.id]);

  const toggleShortlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shortlist = JSON.parse(localStorage.getItem("ipl_shortlist") || "[]");
    let updated: string[];
    if (shortlist.includes(player.id)) {
      updated = shortlist.filter((id: string) => id !== player.id);
    } else {
      updated = [...shortlist, player.id];
    }
    localStorage.setItem("ipl_shortlist", JSON.stringify(updated));
    setIsShortlisted(!isShortlisted);
    window.dispatchEvent(new Event("shortlist-change"));
  };

  const isMarquee = (player.base_price_cr && player.base_price_cr >= 2.0) || player.contract_type_2026 === "RETAINED" || player.auction_set?.includes("M1") || player.auction_set?.includes("M2");
  const isHighValue = (player.base_price_cr && player.base_price_cr >= 1.5) || (player.sold_price_cr && player.sold_price_cr >= 10.0);

  const priceDisplay = player.sold_price_cr 
    ? `₹${player.sold_price_cr} Cr` 
    : player.base_price_cr 
      ? `₹${player.base_price_cr} Cr` 
      : "₹0.20 Cr";

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name[0] || "?").toUpperCase();
  };

  const getRoleVariant = (role: string) => {
    const r = role.toUpperCase();
    if (r === "BAT") return "bat";
    if (r === "BOWL") return "bowl";
    if (r === "AR") return "ar";
    if (r === "WK") return "wk";
    return "secondary";
  };

  return (
    <Card
      className={`glass-panel p-4 rounded-2xl relative transition-all duration-300 flex flex-col justify-between h-full group overflow-hidden ${
        isMarquee
          ? "border-amber-500/30 bg-slate-900/80 shadow-md"
          : "border-white/10 bg-slate-900/40 hover:border-white/20"
      } ${isShortlisted ? "ring-2 ring-red-500/50" : ""}`}
    >
      {/* Top Identity Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center font-display font-bold text-xs border ${
              isMarquee
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-white/5 text-zinc-300 border-white/10"
            }`}
          >
            {getInitials(player.name)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-bold text-sm text-white truncate max-w-[140px] group-hover:text-amber-300 transition-colors">
                {player.name}
              </h3>
              {isMarquee && <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
            </div>
            <span className="text-xs text-zinc-400 block mt-0.5">{player.nationality}</span>
          </div>
        </div>

        {/* Shortlist Star */}
        <button
          onClick={toggleShortlist}
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
            isShortlisted
              ? "bg-red-500/20 text-red-400 border border-red-500/40"
              : "bg-white/5 text-zinc-500 hover:text-zinc-200 border border-white/10"
          }`}
          title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
        >
          <Star className={`h-3.5 w-3.5 ${isShortlisted ? "fill-red-400" : ""}`} />
        </button>
      </div>

      {/* Badges Row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <Badge variant={getRoleVariant(player.role) as any}>{player.role}</Badge>
        {player.is_overseas && <Badge variant="overseas">Overseas</Badge>}
        {isMarquee && <Badge variant="marquee">Marquee</Badge>}
      </div>

      {/* Valuation & Team Info */}
      <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-zinc-400 block font-medium">
            {player.contract_type_2026 === "RETAINED" ? "Retained Price" : "Base Price"}
          </span>
          <span
            className={`font-mono font-bold text-sm ${
              isHighValue ? "text-amber-300" : "text-white"
            }`}
          >
            {priceDisplay}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-zinc-400 block font-medium">
            2025 Team
          </span>
          <span className="text-xs text-zinc-300 font-medium">
            {player.ipl_team_2025 || "Unassigned"}
          </span>
        </div>
      </div>
    </Card>
  );
}
