"use client";

import { useAuction } from "@/components/auction/AuctionContext";
import { TEAM_MAP, formatPriceCr, IPL_RULES } from "@/lib/auction-engine";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { 
  Trophy, Flame, Users, Share2, Home, Loader2, Award, 
  PiggyBank, ShieldAlert, Sparkles, TrendingUp, HelpCircle 
} from "lucide-react";
import { useRouter } from "next/navigation";

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

  // Set default active tab
  useEffect(() => {
    if (!activeTeam && claimedTeams.length > 0) {
      setActiveTeam(playerTeam || claimedTeams[0]?.team_id);
    }
  }, [claimedTeams, playerTeam, activeTeam]);

  // Fetch sales and compile highlights
  useEffect(() => {
    if (room?.id) {
      const fetchSales = async () => {
        const { data: sales } = await supabase
          .from("room_sold_players")
          .select("player_id, team_id, sold_price_cr, is_overseas")
          .eq("room_id", room.id);

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
              detail_name: detail?.name || "Unknown",
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
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-6" />
        <p className="text-amber-500 font-bold tracking-widest uppercase text-sm animate-pulse">Compiling Results...</p>
      </div>
    );
  }

  const totalPlayersSold = allSales.length;
  const totalSpent = allSales.reduce((sum, p) => sum + Number(p.sold_price_cr), 0);
  
  // Highlighting: Record buys
  const recordBuys = [...allSales]
    .sort((a, b) => Number(b.sold_price_cr) - Number(a.sold_price_cr))
    .slice(0, 3);

  // Highlighting: Bargain buys (sold at exactly base price, sorted by price ascending)
  const bargains = allSales
    .filter(p => Number(p.sold_price_cr) === Number(p.base_price_cr))
    .sort((a, b) => Number(a.sold_price_cr) - Number(b.sold_price_cr))
    .slice(0, 3);

  const activeSquad = allSales.filter(s => s.team_id === activeTeam).map(s => ({
    id: s.player_id,
    name: s.detail_name,
    role: s.detail_role,
    is_overseas: s.detail_is_overseas,
    sold_price_cr: s.sold_price_cr
  }));

  const activeTeamData = claimedTeams.find(t => t.team_id === activeTeam);
  const activeTeamMeta = TEAM_MAP.find(t => t.id === activeTeam);
  const incompleteSquad = (activeTeamData?.squad_count || 0) < IPL_RULES.MIN_SQUAD_SIZE;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans pb-16 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-amber-500/10 via-black to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center shadow-inner shadow-amber-500/20 mb-5">
            <Trophy className="h-8 w-8 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-3">
            AUCTION <span className="gradient-text-amber text-glow-amber pb-1">RESULTS</span>
          </h1>
          <p className="text-zinc-400 text-base font-medium max-w-2xl mx-auto leading-relaxed">
            The bidding war is complete! Review all highlight signings, record-breaking payouts, and compile final rosters.
          </p>

          <div className="flex items-center gap-3 justify-center mt-6">
            <Button
              variant="primary"
              className="shimmer-btn font-bold text-xs uppercase tracking-wider h-11"
              onClick={() => {
                const summary = `🏏 IPL Auction Pro Simulator Results!\n\n📊 ${totalPlayersSold} players sold for ${formatPriceCr(totalSpent)} total\n🏆 Record buy: ${recordBuys[0]?.detail_name || "N/A"} for ${recordBuys[0] ? formatPriceCr(Number(recordBuys[0].sold_price_cr)) : "N/A"} (${recordBuys[0]?.team_id})\n\nClaimed Franchises:\n${claimedTeams.map(t => `• ${t.team_id}: ${t.squad_count || 0} players, ${formatPriceCr(Number(t.purse_remaining_cr || 0))} remaining`).join("\n")}\n\nJoin simulations at: ${typeof window !== "undefined" ? window.location.origin : ""}`;
                navigator.clipboard.writeText(summary);
                setShareText("Copied Summary!");
                setTimeout(() => setShareText(""), 2000);
              }}
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              {shareText || "Copy Results Link"}
            </Button>
            <Button
              variant="outline"
              className="h-11 font-bold text-xs uppercase tracking-wider"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4 mr-1.5" />
              Back to Home
            </Button>
          </div>
        </div>

        {/* Highlight Stats Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="glass-card rounded-[20px] p-6 text-center border border-white/[0.04] relative overflow-hidden bg-black/40">
            <p className="text-4xl font-mono font-black text-white mb-1">{totalPlayersSold}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Players Sold</p>
          </div>
          <div className="glass-card rounded-[20px] p-6 text-center border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent relative overflow-hidden">
            <p className="text-4xl font-mono font-black text-amber-500 mb-1">{formatPriceCr(totalSpent)}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Purse Exhausted</p>
          </div>
          <div className="glass-card rounded-[20px] p-6 text-center border border-white/[0.04] relative overflow-hidden bg-black/40">
            <p className="text-4xl font-mono font-black text-blue-400 mb-1">
              {claimedTeams.length}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Competing Franchises</p>
          </div>
        </div>

        {/* Highlights Reel (Record buys & Bargain buys) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          
          {/* Record buys */}
          <div className="glass-card rounded-2xl border border-white/[0.04] p-6 bg-black/20">
            <h3 className="text-xs text-amber-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Top Record Signings
            </h3>
            <div className="space-y-3">
              {recordBuys.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No recordings available</p>
              ) : (
                recordBuys.map((buy, idx) => {
                  const teamMeta = TEAM_MAP.find(t => t.id === buy.team_id);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/[0.03] hover:bg-zinc-900/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-7 w-7 rounded-md flex items-center justify-center font-black text-[9px] shrink-0 ${teamMeta?.color} text-white`}>
                          {buy.team_id}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{buy.detail_name}</p>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{buy.detail_role}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black text-amber-400">{formatPriceCr(Number(buy.sold_price_cr))}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bargain signings */}
          <div className="glass-card rounded-2xl border border-white/[0.04] p-6 bg-black/20">
            <h3 className="text-xs text-green-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <PiggyBank className="h-4 w-4" /> Bargain Signings (Base Price buys)
            </h3>
            <div className="space-y-3">
              {bargains.length === 0 ? (
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.03] text-center">
                  <p className="text-xs text-zinc-600 font-medium">All players sold above base price!</p>
                </div>
              ) : (
                bargains.map((buy, idx) => {
                  const teamMeta = TEAM_MAP.find(t => t.id === buy.team_id);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/[0.03] hover:bg-zinc-900/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-7 w-7 rounded-md flex items-center justify-center font-black text-[9px] shrink-0 ${teamMeta?.color} text-white`}>
                          {buy.team_id}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{buy.detail_name}</p>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{buy.detail_role}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black text-green-400">{formatPriceCr(Number(buy.sold_price_cr))}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Team Selection Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
          {claimedTeams.map(t => {
            const meta = TEAM_MAP.find(m => m.id === t.team_id);
            const isActive = activeTeam === t.team_id;
            return (
              <button
                key={t.team_id}
                onClick={() => setActiveTeam(t.team_id)}
                className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 border uppercase tracking-wider cursor-pointer ${
                  isActive
                    ? `${meta?.color || "bg-zinc-700"} ${meta?.textDark ? "text-zinc-900" : "text-white"} border-transparent shadow-lg scale-105`
                    : "glass-card text-zinc-400 hover:text-zinc-200 border-white/[0.04]"
                }`}
              >
                {t.team_id}
                <span className={`text-[9px] font-bold ${isActive ? "opacity-75" : "text-zinc-600"}`}>
                  ({t.user_name})
                </span>
              </button>
            );
          })}
        </div>

        {/* Roster Breakdown */}
        {activeTeam && activeTeamData && (
          <div className="glass-card rounded-[24px] overflow-hidden shadow-2xl animate-fade-up border border-white/[0.08]" style={{ animationDelay: "0.4s" }}>
            
            {/* Header info */}
            <div className="p-8 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-white/[0.01] to-transparent">
              <div className="flex items-center gap-5">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl border border-white/10 shadow-xl ${activeTeamMeta?.color || "bg-zinc-700"} ${activeTeamMeta?.textDark ? "text-zinc-900" : "text-white"}`}>
                  {activeTeam}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {activeTeamData.user_name}'s <span className="text-zinc-500">{activeTeamMeta?.name || activeTeam}</span>
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge variant="outline" className="bg-black/40 border-white/10 text-zinc-300">
                      {activeSquad.length}/25 Secured
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400">
                      {activeTeamData.overseas_count || 0}/8 Overseas
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-white/[0.04] p-4 rounded-xl flex items-center gap-6">
                <div>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Total Spent</p>
                  <p className="text-base font-black font-mono text-zinc-300">{formatPriceCr(120 - (Number(activeTeamData.purse_remaining_cr) || 0))}</p>
                </div>
                <div className="h-6 w-px bg-white/[0.06]" />
                <div>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Purse Left</p>
                  <p className="text-base font-black font-mono text-amber-500">{formatPriceCr(Number(activeTeamData.purse_remaining_cr) || 0)}</p>
                </div>
              </div>
            </div>

            {incompleteSquad && (
              <div className="px-8 py-3 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 animate-pulse" />
                <span>Roster constraint violated: squad size is {activeTeamData.squad_count || 0} players (minimum 18 players required).</span>
              </div>
            )}

            {/* Role groups */}
            <div className="p-8 bg-black/20">
              {activeSquad.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <p className="text-zinc-500 text-sm italic font-medium">No players secured by this team.</p>
                </div>
              ) : (() => {
                const BAT = activeSquad.filter(p => ['BATSMAN', 'BAT'].includes(String(p.role).toUpperCase()));
                const WK = activeSquad.filter(p => ['WICKET KEEPER', 'WK', 'BAT/WK'].includes(String(p.role).toUpperCase()));
                const AR = activeSquad.filter(p => ['ALL-ROUNDER', 'AR'].includes(String(p.role).toUpperCase()));
                const BOWL = activeSquad.filter(p => ['BOWLER', 'BOWL'].includes(String(p.role).toUpperCase()));
                
                const mappedIds = [...BAT, ...WK, ...AR, ...BOWL].map(p => p.id);
                const OTHER = activeSquad.filter(p => !mappedIds.includes(p.id));

                const groups = [
                  { title: "BATSMEN", data: BAT, color: "text-blue-400" },
                  { title: "WICKET-KEEPERS", data: WK, color: "text-purple-400" },
                  { title: "ALL-ROUNDERS", data: AR, color: "text-green-400" },
                  { title: "BOWLERS", data: BOWL, color: "text-red-400" },
                  ...(OTHER.length > 0 ? [{ title: "OTHER", data: OTHER, color: "text-zinc-400" }] : [])
                ];

                return (
                  <div className="space-y-6">
                    {groups.filter(g => g.data.length > 0).map(group => (
                      <div key={group.title}>
                        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${group.color}`}>
                          {group.title} <span className="bg-white/5 border border-white/10 text-white px-2 py-0.5 rounded text-[9px]">{group.data.length}</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {group.data.sort((a,b) => b.sold_price_cr - a.sold_price_cr).map(player => (
                            <div key={player.id} className="flex items-center justify-between bg-black/40 border border-white/[0.04] p-3.5 rounded-xl hover:bg-white/[0.03] transition-colors relative overflow-hidden">
                              <div className="min-w-0 pr-4">
                                <p className="text-sm font-bold text-white truncate leading-tight">{player.name}</p>
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mt-1">{player.role}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {player.is_overseas && (
                                  <span className="text-[8px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded font-black border border-orange-500/20 shrink-0 uppercase tracking-widest">OS</span>
                                )}
                                <span className="text-xs font-mono font-black text-amber-500">{formatPriceCr(Number(player.sold_price_cr))}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
