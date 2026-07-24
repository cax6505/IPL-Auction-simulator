"use client";

import { useAuction } from "@/components/auction/AuctionContext";
import { formatPriceCr, IPL_RULES } from "@/lib/auction-engine";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { 
  Trophy, Share2, Home, Loader2, Award, 
  PiggyBank, ShieldAlert, TrendingUp, Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { IPL_TEAMS, getTeam } from "@/lib/design-tokens";
import { TeamLogo } from "@/components/ui/TeamLogo";

export default function ResultsPage() {
  const { isAuctionComplete, claimedTeams, playerTeam, room, roomCode, loading } = useAuction();
  const router = useRouter();
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [shareText, setShareText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && room) {
      if (room.status === "waiting") {
        router.push(`/rooms/${roomCode}`);
      } else if (room.status === "active" || room.status === "paused" || room.status === "in_progress") {
        router.push(`/rooms/${roomCode}/auction`);
      }
    }
  }, [loading, room, roomCode, router]);

  useEffect(() => {
    if (!activeTeam && claimedTeams.length > 0) {
      setActiveTeam(playerTeam || claimedTeams[0]?.team_id);
    }
  }, [claimedTeams, playerTeam, activeTeam]);

  useEffect(() => {
    if (room?.id) {
      const fetchSales = async () => {
        const { data: sales } = await supabase
          .from("room_sold_players")
          .select("player_id, team_id, sold_price_cr, is_overseas")
          .eq("room_id", room.id)
          .neq("team_id", "UNSOLD");

        if (sales && sales.length > 0) {
          const playerIds = sales.map((s: any) => s.player_id);
          const { data: playerDetails } = await supabase
            .from("players")
            .select("id, name, role, is_overseas, base_price_cr")
            .in("id", playerIds);

          const merged = sales.map((sale: any) => {
            const detail = playerDetails?.find((p: any) => p.id === sale.player_id);
            return {
              ...sale,
              detail_name: detail?.name || "Unknown Star",
              detail_role: detail?.role || "N/A",
              detail_is_overseas: detail?.is_overseas || sale.is_overseas,
              base_price_cr: detail?.base_price_cr || 0.20
            };
          });
          setAllSales(merged);
        }
        setIsLoading(false);
      };
      fetchSales();
    }
  }, [room?.id]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-amber-400 animate-spin mb-4" />
        <p className="text-amber-400 font-mono font-bold tracking-widest text-xs uppercase">
          Compiling Broadcast Leaderboards...
        </p>
      </div>
    );
  }

  const totalPlayersSold = allSales.length;
  const totalSpent = allSales.reduce((sum, p) => sum + Number(p.sold_price_cr), 0);
  
  const recordBuys = [...allSales]
    .sort((a, b) => Number(b.sold_price_cr) - Number(a.sold_price_cr))
    .slice(0, 4);

  const activeSquad = allSales.filter(s => s.team_id === activeTeam).map(s => ({
    id: s.player_id,
    name: s.detail_name,
    role: s.detail_role,
    is_overseas: s.detail_is_overseas,
    sold_price_cr: s.sold_price_cr
  }));

  const activeTeamData = claimedTeams.find(t => t.team_id === activeTeam);
  const activeTeamObj = getTeam(activeTeam);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-xl">
          <Trophy className="h-8 w-8" />
        </div>
        <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight">
          AUCTION SUMMARY & SQUADS
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-2">
          Post-match broadcast overview: Final squad rosters, top marquee buys, and purse efficiency metrics.
        </p>

        <div className="flex items-center gap-3 justify-center mt-6">
          <Button
            onClick={() => {
              const summary = `🏆 DraftForge Auction Results!\n\n${totalPlayersSold} stars sold for ₹${totalSpent.toFixed(2)} Cr total.\nTop Buy: ${recordBuys[0]?.detail_name || 'N/A'} (₹${recordBuys[0]?.sold_price_cr || 0} Cr to ${recordBuys[0]?.team_id || 'N/A'})`;
              navigator.clipboard.writeText(summary);
              setShareText("Copied Summary!");
              setTimeout(() => setShareText(""), 2000);
            }}
            className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-mono font-bold text-xs uppercase"
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            {shareText || "Copy Summary Card"}
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="border-white/10 text-zinc-300 font-mono text-xs font-bold"
          >
            <Home className="h-4 w-4 mr-1.5" /> Back to Lobby
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 text-center">
          <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-1">
            Total Players Sold
          </span>
          <span className="font-mono font-black text-4xl text-white">{totalPlayersSold}</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 text-center">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
            Total Purse Exhausted
          </span>
          <span className="font-mono font-black text-4xl text-amber-400">₹{totalSpent.toFixed(2)} Cr</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 text-center">
          <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-1">
            Franchises Competed
          </span>
          <span className="font-mono font-black text-4xl text-cyan-400">{claimedTeams.length}</span>
        </div>
      </div>

      {/* Record Signings Reel */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 mb-12">
        <h2 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Top Marquee Signings
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recordBuys.map((buy, idx) => {
            const teamInfo = getTeam(buy.team_id);
            return (
              <div key={idx} className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 font-bold"># {idx + 1} HIGHEST BID</span>
                  <h4 className="font-display font-bold text-base text-white mt-0.5">{buy.detail_name}</h4>
                  <span className="text-[10px] font-mono text-zinc-400">{buy.detail_role}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                      backgroundColor: teamInfo?.color || "#1F2937",
                      color: teamInfo?.textOnColor || "#ffffff",
                    }}
                  >
                    {buy.team_id}
                  </span>
                  <span className="font-mono font-black text-sm text-amber-300">₹{Number(buy.sold_price_cr).toFixed(2)} Cr</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Franchise Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
        {claimedTeams.map((t) => {
          const isActive = activeTeam === t.team_id;
          return (
            <button
              key={t.team_id}
              onClick={() => setActiveTeam(t.team_id)}
              className={`px-3.5 py-2 rounded-xl font-medium text-xs transition-all shrink-0 flex items-center gap-2 border ${
                isActive
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md"
                  : "glass-panel text-zinc-400 border-white/10 hover:text-white"
              }`}
            >
              <TeamLogo teamId={t.team_id} size="sm" />
              <span>{t.user_name} ({t.team_id})</span>
            </button>
          );
        })}
      </div>

      {/* Active Squad Roster View */}
      {activeTeamData && activeTeamObj && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <TeamLogo teamId={activeTeamObj.id} size="lg" className="shadow-xl" />
              <div>
                <h3 className="font-display font-bold text-2xl text-white">
                  {activeTeamObj.name} Roster
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Managed by <span className="text-white font-bold">{activeTeamData.user_name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px]">SQUAD SIZE</span>
                <span className="font-bold text-white">{activeSquad.length}/25 Players</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">REMAINING PURSE</span>
                <span className="font-bold text-amber-300">₹{Number(activeTeamData.purse_remaining_cr || 0).toFixed(2)} Cr</span>
              </div>
            </div>
          </div>

          {/* Squad Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSquad.map((player) => (
              <div key={player.id} className="glass-panel p-3.5 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-white">{player.name}</h4>
                  <span className="text-[10px] font-mono text-zinc-400">{player.role}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-xs text-amber-400">
                    ₹{Number(player.sold_price_cr).toFixed(2)} Cr
                  </span>
                  {player.is_overseas && (
                    <Badge variant="overseas" className="block mt-0.5">OS</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

