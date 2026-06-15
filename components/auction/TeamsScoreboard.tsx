"use client";

import { useAuction } from "./AuctionContext";
import { TEAM_MAP, formatPriceCr } from "@/lib/auction-engine";

export function TeamsScoreboard() {
  const { claimedTeams, onlineUsers, room } = useAuction();

  if (!claimedTeams || claimedTeams.length === 0) return null;

  const highestBidder = room?.current_highest_bidder_id;

  return (
    <div className="w-full overflow-x-auto no-scrollbar shrink-0 animate-fade-in">
      <div className="flex gap-2 min-w-max px-1 py-1">
        {claimedTeams.map((team: any) => {
          const meta = TEAM_MAP.find(t => t.id === team.team_id);
          const isOnline = onlineUsers.some(u => u.team === team.team_id);
          const isHighest = highestBidder === team.team_id;

          return (
            <div
              key={team.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300 ease-spring min-w-[160px] ${
                isHighest
                  ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                  : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"
              }`}
            >
              {/* Team Badge */}
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 shadow-inner border border-black/20 ${meta?.color || "bg-zinc-700"} ${meta?.textDark ? "text-zinc-900" : "text-white"}`}>
                {team.team_id}
              </div>

              {/* Info */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[80px]">
                    {team.user_name}
                  </span>
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${isOnline ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" : "bg-white/10"}`} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-mono font-bold ${isHighest ? "text-amber-400" : "text-zinc-500"}`}>
                    {formatPriceCr(Number(team.purse_remaining_cr || 0))}
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono">
                    {team.squad_count || 0}/25
                  </span>
                  <span className="text-[9px] text-blue-500/60 font-mono">
                    {team.overseas_count || 0}os
                  </span>
                </div>
              </div>

              {/* Leading indicator */}
              {isHighest && (
                <div className="ml-auto shrink-0">
                  <div className="h-5 w-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-pulse">
                    <span className="text-[8px] font-black text-amber-400">⬆</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
