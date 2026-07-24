"use client";

import { useAuction } from "./AuctionContext";
import { formatPriceCr } from "@/lib/auction-engine";
import { getTeam } from "@/lib/design-tokens";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function TeamsScoreboard() {
  const { claimedTeams, onlineUsers, room } = useAuction();

  if (!claimedTeams || claimedTeams.length === 0) return null;

  const highestBidder = room?.current_highest_bidder_id;

  return (
    <div className="w-full overflow-x-auto no-scrollbar shrink-0">
      <div className="flex gap-3 pb-2 min-w-max">
        {claimedTeams.map((team: any) => {
          const teamObj = getTeam(team.team_id);
          const isOnline = onlineUsers.some((u) => u.team === team.team_id);
          const isHighest = highestBidder === team.team_id;

          return (
            <div
              key={team.id}
              className={`glass-panel p-3 rounded-xl border flex items-center gap-3 min-w-[170px] transition-all ${
                isHighest
                  ? "border-amber-400/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Franchise Logo */}
              <TeamLogo teamId={team.team_id} size="sm" />

              {/* Purse & Roster fill info */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-white truncate max-w-[85px]">
                    {team.user_name}
                  </span>
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      isOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono font-black text-amber-300">
                    {formatPriceCr(Number(team.purse_remaining_cr || 0))}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {team.squad_count || 0}/25 ({team.overseas_count || 0} OS)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

