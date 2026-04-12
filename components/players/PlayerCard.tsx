"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane } from "lucide-react";
import type { PlayerRecord } from "@/lib/types/player";

export function PlayerCard({ player }: { player: PlayerRecord }) {
  // Format price if available
  const priceDisplay = player.sold_price_cr 
    ? `₹${player.sold_price_cr} Cr` 
    : player.base_price_cr 
      ? `₹${player.base_price_cr} Cr` 
      : "TBD";

  // Determine role styling based on exact matches used in ClientDashboard
  const roleStyles: Record<string, { bg: string, border: string, text: string }> = {
    BAT: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
    BOWL: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
    AR: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
    WK: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
  };

  const roleUpper = player.role.toUpperCase();
  // Safe fallback to 'BOWL' or whatever if unknown string enters
  const rStyle = roleStyles[roleUpper] || { bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-400" };

  // Simple initials generator
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name[0] || "?").toUpperCase();
  };

  return (
    <Card className="hover:glass-card-hover group border-l-4 border-l-transparent transition-all h-full p-4 gap-0" style={{ borderLeftColor: rStyle.text.replace('text-', '') }}>
      <div className="flex items-start justify-between gap-4 w-full mb-4">
        {/* Compact Horizontal Identity */}
        <div className="flex items-center gap-3.5">
           <div className={`shrink-0 h-12 w-12 rounded-[10px] flex items-center justify-center font-black text-lg ${rStyle.bg} ${rStyle.border} border shadow-inner`}>
             <span className={rStyle.text}>{getInitials(player.name)}</span>
           </div>
           <div className="flex flex-col">
              <h3 className="font-bold text-white text-base tracking-tight leading-tight group-hover:text-white transition-colors line-clamp-1">
                {player.name}
              </h3>
              <span className="text-[11px] font-medium text-zinc-500">{player.nationality}</span>
           </div>
        </div>

        {/* Badges Right */}
        <div className="flex flex-col items-end gap-1.5 align-top">
          <Badge className={`${rStyle.bg} ${rStyle.text} ${rStyle.border} shadow-none`}>
            {player.role}
          </Badge>
          {player.is_overseas && (
            <Badge variant="outline" className="border-orange-500/20 bg-orange-500/10 text-orange-400 flex items-center gap-1 shadow-none">
              <Plane className="h-2.5 w-2.5" /> OS
            </Badge>
          )}
        </div>
      </div>
      
      {/* Data Row */}
      <div className="grid grid-cols-2 gap-2 mt-auto mb-4 bg-black/20 p-2.5 rounded-lg border border-white/[0.03]">
        <div className="flex flex-col">
           <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Status</span>
           <span className="text-xs font-semibold text-zinc-300 capitalize">{player.capped_status}</span>
        </div>
        <div className="flex flex-col">
           <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Set</span>
           <span className="text-xs font-semibold text-zinc-300 truncate">{player.auction_set || '—'}</span>
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">
            {player.contract_type_2026 === 'RETAINED' ? 'Retained Value' : 'Base Price'}
          </span>
          <span className={`text-sm font-black font-mono ${player.contract_type_2026 === 'RETAINED' ? 'text-zinc-300' : 'text-amber-500'}`}>
            {priceDisplay}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">
            2025 Team
          </span>
          <span className="text-xs font-bold text-zinc-400">
            {player.ipl_team_2025 || 'Unassigned'}
          </span>
        </div>
      </div>
    </Card>
  );
}
