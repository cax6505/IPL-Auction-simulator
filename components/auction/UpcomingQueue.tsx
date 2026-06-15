"use client";

import { useAuction } from "./AuctionContext";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  BAT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  BOWL: "bg-red-500/10 text-red-400 border-red-500/20",
  AR: "bg-green-500/10 text-green-400 border-green-500/20",
  WK: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function UpcomingQueue() {
  const { allPlayers, room, soldPlayerIds } = useAuction();

  if (!allPlayers || allPlayers.length === 0) return null;

  const currentId = room?.current_player_id;

  // Build upcoming queue: unsold players after the current player in allPlayers order
  const currentIndex = currentId ? allPlayers.findIndex((p: any) => p.id === currentId) : -1;
  
  const upcoming: any[] = [];
  if (currentIndex >= 0) {
    for (let i = currentIndex + 1; i < allPlayers.length && upcoming.length < 5; i++) {
      const p = allPlayers[i];
      if (!soldPlayerIds.has(p.id)) {
        upcoming.push(p);
      }
    }
  }

  if (upcoming.length === 0) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          Up Next
        </span>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {upcoming.map((player: any, index: number) => {
          const roleStyle = ROLE_COLORS[player.role?.toUpperCase()] || ROLE_COLORS.BAT;
          return (
            <div
              key={player.id}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] transition-all duration-300 min-w-[180px] shrink-0 ${
                index === 0 ? "border-amber-500/20 bg-amber-500/[0.03]" : ""
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Number */}
              <div className="h-6 w-6 rounded-md bg-black/40 border border-white/[0.06] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-mono font-bold text-zinc-400">
                  {index === 0 ? "→" : index + 1}
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-zinc-300 truncate leading-tight">
                  {player.name}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${roleStyle}`}>
                    {player.role}
                  </span>
                  {player.is_overseas && (
                    <span className="text-[9px] font-bold text-orange-400/80 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                      OS
                    </span>
                  )}
                </div>
              </div>

              {/* Base Price */}
              <span className="text-[11px] font-mono font-bold text-zinc-500 shrink-0">
                ₹{Number(player.base_price_cr || 0).toFixed(1)}Cr
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
