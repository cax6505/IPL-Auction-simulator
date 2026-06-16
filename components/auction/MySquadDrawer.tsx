"use client";

import { useAuction } from "./AuctionContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, ShieldCheck, BadgeCent, Users, AlertTriangle, ShieldAlert } from "lucide-react";
import { TEAM_MAP, formatPriceCr, IPL_RULES } from "@/lib/auction-engine";

interface MySquadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MySquadDrawer({ isOpen, onClose }: MySquadDrawerProps) {
  const { room, playerTeam, claimedTeams, soldPlayerIds } = useAuction();
  const [squad, setSquad] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch squad details whenever a player is sold or team changes
  useEffect(() => {
    if (!playerTeam || !room?.id || !isOpen) return;

    const fetchSquad = async () => {
      setLoading(true);
      const { data: sales } = await supabase
        .from("room_sold_players")
        .select("player_id, sold_price_cr, is_overseas")
        .eq("room_id", room.id)
        .eq("team_id", playerTeam);

      if (sales && sales.length > 0) {
        const playerIds = sales.map(s => s.player_id);
        const { data: playerDetails } = await supabase
          .from("players")
          .select("id, name, role, is_overseas, nationality")
          .in("id", playerIds);

        const merged = sales.map(sale => {
          const detail = playerDetails?.find(p => p.id === sale.player_id);
          return {
            id: sale.player_id,
            name: detail?.name || "Unknown",
            role: detail?.role || "N/A",
            is_overseas: detail?.is_overseas || sale.is_overseas,
            nationality: detail?.nationality || "Indian",
            sold_price_cr: sale.sold_price_cr,
          };
        });
        setSquad(merged);
      } else {
        setSquad([]);
      }
      setLoading(false);
    };

    fetchSquad();
  }, [playerTeam, room?.id, soldPlayerIds, isOpen]);

  if (!playerTeam) return null;

  const teamMeta = TEAM_MAP.find(t => t.id === playerTeam);
  const teamRecord = claimedTeams.find(c => c.team_id === playerTeam);
  const purseRemaining = Number(teamRecord?.purse_remaining_cr || 120.0);
  const totalPlayers = squad.length;
  const overseasCount = squad.filter(p => p.is_overseas).length;

  // Group squad by roles
  const BAT = squad.filter(p => ['BATSMAN', 'BAT'].includes(String(p.role).toUpperCase()));
  const WK = squad.filter(p => ['WICKET KEEPER', 'WK', 'BAT/WK'].includes(String(p.role).toUpperCase()));
  const AR = squad.filter(p => ['ALL-ROUNDER', 'AR'].includes(String(p.role).toUpperCase()));
  const BOWL = squad.filter(p => ['BOWLER', 'BOWL'].includes(String(p.role).toUpperCase()));
  
  const groups = [
    { title: "Batsmen", data: BAT, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/10" },
    { title: "Wicket Keepers", data: WK, color: "text-purple-400", bg: "bg-purple-500/5", border: "border-purple-500/10" },
    { title: "All Rounders", data: AR, color: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/10" },
    { title: "Bowlers", data: BOWL, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/10" }
  ];

  // Warnings
  const showOverseasWarning = overseasCount >= IPL_RULES.MAX_OVERSEAS;
  const showSquadWarning = totalPlayers >= IPL_RULES.MAX_SQUAD_SIZE;
  
  // Calculate minimum reserve to build a valid squad:
  // Need at least 18 players. Remaining slots to reach 18 is (18 - totalPlayers).
  // Assuming a minimum reserve of 0.20 Cr per required slot.
  const slotsNeededForMin = Math.max(0, IPL_RULES.MIN_SQUAD_SIZE - totalPlayers);
  const minRequiredReserve = slotsNeededForMin * 0.20;
  const showLowPurseWarning = purseRemaining < minRequiredReserve && totalPlayers < IPL_RULES.MIN_SQUAD_SIZE;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-out drawer panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[420px] max-w-full bg-[#09090b]/98 border-l border-white/[0.08] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-spring ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/[0.04] bg-black/20 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm border border-black/25 shadow-inner ${teamMeta?.color || "bg-zinc-700"} text-white`}>
              {playerTeam}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight leading-none">{teamRecord?.user_name || "My Squad"}</h3>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mt-1">{teamMeta?.name}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          {/* Quick Stats Panel */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black/40 border border-white/[0.03] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <BadgeCent className="h-4 w-4 text-amber-500 mb-1" />
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Purse Left</span>
              <span className="text-sm font-mono font-black text-amber-400">{formatPriceCr(purseRemaining)}</span>
            </div>
            
            <div className="bg-black/40 border border-white/[0.03] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <Users className="h-4 w-4 text-blue-500 mb-1" />
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Squad Count</span>
              <span className={`text-sm font-mono font-black ${showSquadWarning ? 'text-red-400' : 'text-zinc-300'}`}>
                {totalPlayers}<span className="text-[10px] text-zinc-600">/25</span>
              </span>
            </div>
            
            <div className="bg-black/40 border border-white/[0.03] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <ShieldCheck className="h-4 w-4 text-purple-500 mb-1" />
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Overseas</span>
              <span className={`text-sm font-mono font-black ${showOverseasWarning ? 'text-red-400' : 'text-zinc-300'}`}>
                {overseasCount}<span className="text-[10px] text-zinc-600">/8</span>
              </span>
            </div>
          </div>

          {/* Warnings Banner Area */}
          {(showSquadWarning || showOverseasWarning || showLowPurseWarning) && (
            <div className="space-y-2">
              {showSquadWarning && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs font-semibold">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Maximum squad size of 25 players reached. You cannot bid on any more players.</span>
                </div>
              )}
              {showOverseasWarning && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs font-semibold">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Maximum overseas limit of 8 reached. You can only bid on Indian players.</span>
                </div>
              )}
              {showLowPurseWarning && (
                <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-3 text-xs font-semibold animate-pulse">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Purse is critical! You need to reserve at least {formatPriceCr(minRequiredReserve)} for the remaining {slotsNeededForMin} slots to build a valid 18-player roster.</span>
                </div>
              )}
            </div>
          )}

          {/* Player Groups */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500 uppercase tracking-widest text-xs font-mono">
              <span className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
              Loading Squad...
            </div>
          ) : totalPlayers === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/[0.04] rounded-2xl bg-white/[0.01]">
              <ShieldCheck className="h-10 w-10 text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-bold text-sm">Your war room is empty</p>
              <p className="text-zinc-600 text-xs mt-1">Win bids to compile your team roster.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.filter(g => g.data.length > 0).map(group => (
                <div key={group.title} className={`border border-white/[0.03] rounded-2xl bg-black/20 p-4`}>
                  <h4 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center justify-between ${group.color}`}>
                    <span>{group.title}</span>
                    <span className="bg-white/[0.04] border border-white/[0.06] text-white px-2 py-0.5 rounded-md text-[10px] font-mono">{group.data.length}</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {group.data.sort((a,b) => b.sold_price_cr - a.sold_price_cr).map((player: any) => (
                      <div 
                        key={player.id} 
                        className="flex items-center justify-between bg-zinc-950/60 border border-white/[0.03] rounded-xl px-3.5 py-2.5 hover:bg-zinc-900/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">{player.name}</span>
                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{player.nationality}</span>
                          </div>
                          {player.is_overseas && (
                            <span className="text-[8px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded font-black border border-orange-500/20 shrink-0 uppercase tracking-widest">OS</span>
                          )}
                        </div>
                        <span className="text-sm font-mono font-black text-amber-400 shrink-0">{formatPriceCr(Number(player.sold_price_cr))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-white/[0.04] bg-black/40 shrink-0">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Roster completeness</span>
            <span className="font-mono text-zinc-300">{totalPlayers >= 18 ? "✅ Valid (18+)" : `❌ Invalid (${18 - totalPlayers} more needed)`}</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${totalPlayers >= 18 ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (totalPlayers / 18) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
