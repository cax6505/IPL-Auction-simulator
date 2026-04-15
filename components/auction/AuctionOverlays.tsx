"use client";

import { useAuction } from "./AuctionContext";
import { Square, Flame, Shield, X, Trophy, Users, Loader2 } from "lucide-react";
import { TEAM_MAP, formatPriceCr, IPL_RULES } from "@/lib/auction-engine";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

export function AuctionOverlays() {
  return (
    <>
      <SoldFlash />
      <SquadDashboard />
      <ResultsScreen />
    </>
  );
}

function SoldFlash() {
  const { showSoldFlash, claimedTeams } = useAuction();

  if (!showSoldFlash) return null;

  const teamMeta = TEAM_MAP.find(t => t.id === showSoldFlash.team);
  const teamData = claimedTeams.find(c => c.team_id === showSoldFlash.team);

  // Fallbacks for color classes
  const cleanBgColor = teamMeta?.color.replace('bg-', '') || "zinc-800";
  // Creating a distinct inline style mapping for dynamic pulse since tailwind from- dynamic classes fail without safelist
  const pulseStyle = {
    background: `radial-gradient(circle at center, var(--color-${cleanBgColor}, #f59e0b) 0%, transparent 70%)`
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="absolute inset-0 opacity-20 animate-pulse pointer-events-none" 
        style={pulseStyle}
      />
      <div className="relative z-10 flex flex-col items-center max-w-4xl text-center animate-sold">
        <h1 className="text-7xl sm:text-9xl font-black text-white italic tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.8)] px-8">
          SOLD<span className="text-amber-500">!</span>
        </h1>
        
        <div className="mt-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-black/40 backdrop-blur border border-white/10 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.05] to-transparent pointer-events-none" />
          
          <div className={`h-36 w-36 rounded-[24px] flex justify-center items-center font-black text-5xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-2 border-white/20 ${teamMeta?.color || "bg-zinc-700"} ${teamMeta?.textDark ? "text-zinc-900" : "text-white"} z-10`}>
            {showSoldFlash.team}
          </div>
          
          <div className="flex flex-col items-center md:items-start text-white z-10">
            <span className="text-[14px] uppercase tracking-[0.3em] font-bold text-zinc-400 mb-2">Final Winning Bid</span>
            <span className="text-5xl sm:text-[80px] leading-none font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 drop-shadow-md">
              {formatPriceCr(showSoldFlash.amount)}
            </span>
            <div className="mt-4 flex flex-col gap-1 items-center md:items-start">
              <span className="text-2xl font-black text-amber-500 tracking-tight flex items-center gap-2">
                <span className="text-zinc-500 text-lg">TO</span> {teamData?.user_name || showSoldFlash.team}
              </span>
              <span className="text-lg text-zinc-300 font-bold border-t border-white/10 pt-2 mt-2 inline-block px-4 md:px-0">
                {showSoldFlash.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SquadDashboard() {
  const { showSquadsModal, setShowSquadsModal, claimedTeams, squadsMap, loadSquad } = useAuction();

  if (!showSquadsModal) return null;

  const activeTeamMeta = TEAM_MAP.find(m => m.id === showSquadsModal);
  const activeTeamData = claimedTeams.find(t => t.team_id === showSquadsModal);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#09090b]/95 backdrop-blur-[40px] animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.06] bg-black/40 shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-3 tracking-tight">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
             <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          Franchise Dashboards
        </h2>
        <button 
          onClick={() => setShowSquadsModal(null)} 
          className="h-10 w-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <div className="w-full md:w-72 border-r border-white/[0.04] overflow-y-auto p-4 space-y-2 shrink-0 bg-transparent no-scrollbar">
          {claimedTeams.map(t => {
            const meta = TEAM_MAP.find(m => m.id === t.team_id);
            const isActive = showSquadsModal === t.team_id;
            return (
              <button
                key={t.id}
                onClick={() => loadSquad(t.team_id)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-300 ease-spring ${
                  isActive
                    ? "bg-amber-500/10 border border-amber-500/30 shadow-sm" 
                    : "bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.02]"
                }`}
              >
                <div className={`h-10 w-10 shrink-0 rounded-lg flex justify-center items-center font-black text-xs shadow-inner ${meta?.color || "bg-zinc-700"} ${meta?.textDark ? "text-zinc-900" : "text-white"}`}>
                  {t.team_id}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`font-bold text-sm tracking-tight truncate ${isActive ? "text-white" : "text-zinc-300"}`}>
                    {t.user_name}
                  </span>
                  <span className={`text-[11px] font-mono font-bold mt-0.5 ${isActive ? "text-amber-500" : "text-zinc-500"}`}>
                    {formatPriceCr(Number(t.purse_remaining_cr || 0))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Main View */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-transparent relative">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 border-b border-white/[0.04] pb-6">
            <div className="flex items-center gap-5">
              <div className={`h-16 w-16 shrink-0 rounded-[14px] flex justify-center items-center font-black text-2xl border border-white/10 shadow-xl ${activeTeamMeta?.color || "bg-zinc-700"} ${activeTeamMeta?.textDark ? "text-zinc-900" : "text-white"}`}>
                {showSquadsModal}
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">{activeTeamData?.user_name}'s <span className="text-zinc-500">Roster</span></h3>
                <div className="flex items-center gap-3 mt-2">
                   <Badge variant="outline" className="bg-white/[0.02]">
                      {squadsMap[showSquadsModal]?.length || 0} / 25 Secured
                   </Badge>
                   <Badge variant="outline" className="bg-white/[0.02] text-blue-400 border-blue-500/20">
                      {activeTeamData?.overseas_count || 0} / 8 OS
                   </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-start sm:items-end bg-black/40 px-4 py-2 rounded-xl border border-white/5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Remaining Purse</span>
              <span className="text-2xl font-black font-mono text-amber-500">{formatPriceCr(Number(activeTeamData?.purse_remaining_cr || 0))}</span>
            </div>
          </div>
          
          {!squadsMap[showSquadsModal] ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-80">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
              <p className="text-xs text-white font-bold uppercase tracking-[0.2em]">Compiling Database...</p>
            </div>
          ) : squadsMap[showSquadsModal].length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/[0.06] rounded-[24px] bg-white/[0.01]">
              <div className="h-12 w-12 rounded-full bg-white/[0.02] flex items-center justify-center mb-4 border border-white/[0.05]">
                <Square className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-zinc-400 font-bold text-sm text-center">Roster is empty.</p>
              <p className="text-zinc-600 text-xs mt-1">No transactions recorded for this franchise yet.</p>
            </div>
          ) : (() => {
            const squad = squadsMap[showSquadsModal];
            
            const BAT = squad.filter(p => ['BATSMAN', 'BAT'].includes(p.role.toUpperCase()));
            const WK = squad.filter(p => ['WICKET KEEPER', 'WK', 'BAT/WK'].includes(p.role.toUpperCase()));
            const AR = squad.filter(p => ['ALL-ROUNDER', 'AR'].includes(p.role.toUpperCase()));
            const BOWL = squad.filter(p => ['BOWLER', 'BOWL'].includes(p.role.toUpperCase()));
            
            const mappedIds = [...BAT, ...WK, ...AR, ...BOWL].map(p => p.id);
            const OTHER = squad.filter(p => !mappedIds.includes(p.id));

            const groups = [
               { title: "BATSMEN", data: BAT },
               { title: "WICKET-KEEPERS", data: WK },
               { title: "ALL-ROUNDERS", data: AR },
               { title: "BOWLERS", data: BOWL },
               ...(OTHER.length > 0 ? [{ title: "OTHER", data: OTHER }] : [])
            ];

            let delayIndex = 0;

            return (
              <div className="flex flex-col gap-8 pb-10">
                {groups.filter(g => g.data.length > 0).map(group => (
                  <div key={group.title} className="animate-fade-up">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-white/[0.05] pb-2">
                       {group.title}
                       <span className="bg-white/[0.05] px-1.5 py-0.5 rounded text-white">{group.data.length}</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.data.map((p) => {
                        const currentDelay = delayIndex++;
                        return (
                          <div key={p.id} className="glass-card hover:glass-card-hover p-4 rounded-xl flex items-center justify-between transition-all animate-scale-in border border-white/[0.03]" style={{ animationDelay: `${Math.min(currentDelay * 0.03, 0.4)}s` }}>
                            <div className="flex flex-col min-w-0">
                              <span className="text-white font-bold text-sm tracking-tight truncate">{p.name}</span>
                              <div className="flex gap-2 mt-1.5">
                                <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest bg-black/50 px-2 py-0.5 rounded-md border border-white/[0.04]">{p.role}</span>
                                {p.is_overseas && <span className="text-[9px] text-orange-400 uppercase font-bold tracking-widest bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">OS</span>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0 pl-4">
                              <span className="text-amber-500 font-black font-mono text-sm">{formatPriceCr(Number(p.sold_price_cr))}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function ResultsScreen() {
  const { isAuctionComplete, claimedTeams, playerTeam, room } = useAuction();
  const [activeTeam, setActiveTeam] = useState<string | null>(playerTeam || claimedTeams[0]?.team_id || null);
  const [allSales, setAllSales] = useState<RoomSoldPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuctionComplete && room?.id) {
       const fetchSales = async () => {
          const { data: sales } = await supabase.from('room_sold_players')
              .select('player_id, team_id, sold_price_cr, is_overseas')
              .eq('room_id', room.id);
              
          if (sales && sales.length > 0) {
             const playerIds = sales.map((s: RoomSoldPlayer) => s.player_id);
             const { data: playerDetails } = await supabase
               .from('players')
               .select('id, name, role, is_overseas')
               .in('id', playerIds);
               
             const merged = sales.map((sale: RoomSoldPlayer) => {
               const detail = playerDetails?.find((p: PlayerRecord) => p.id === sale.player_id);
               return {
                 ...sale,
                 detail_name: detail?.name || 'Unknown',
                 detail_role: detail?.role || 'N/A',
                 detail_is_overseas: detail?.is_overseas || sale.is_overseas
               };
             });
             setAllSales(merged);
          }
          setIsLoading(false);
       };
       fetchSales();
    }
  }, [isAuctionComplete, room?.id]);

  if (!isAuctionComplete) return null;
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[110] bg-[#09090b] flex flex-col items-center justify-center animate-fade-in">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-4" />
        <h2 className="text-xl font-bold font-mono tracking-widest text-zinc-400 uppercase">Compiling Results...</h2>
      </div>
    );
  }

  const totalPlayersSold = allSales.length;
  const totalSpent = allSales.reduce((sum, p) => sum + Number(p.sold_price_cr), 0);
  const mostExpensive = allSales.length > 0 
    ? allSales.reduce((max, p) => Number(p.sold_price_cr) > Number(max.sold_price_cr) ? p : max, allSales[0])
    : null;

  const activeSquad = allSales.filter(s => s.team_id === activeTeam).map(s => ({
      id: s.player_id,
      name: s.detail_name,
      role: s.detail_role,
      is_overseas: s.detail_is_overseas,
      sold_price_cr: s.sold_price_cr
  }));

  const activeTeamData = claimedTeams.find(t => t.team_id === activeTeam);
  const activeTeamMeta = TEAM_MAP.find(t => t.id === activeTeam);
  const teamMostExpensive = activeSquad.length > 0
    ? activeSquad.reduce((max, p) => Number(p.sold_price_cr) > Number(max.sold_price_cr) ? p : max, activeSquad[0])
    : null;
  const incompleteSquad = (activeTeamData?.squad_count || 0) < IPL_RULES.MIN_SQUAD_SIZE;

  return (
    <div className="fixed inset-0 z-[110] bg-[#09090b] overflow-y-auto no-scrollbar animate-fade-in">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-amber-500/10 via-black to-transparent pointer-events-none" />
      
      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 animate-slide-down">
          <div className="inline-flex h-20 w-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center shadow-inner shadow-amber-500/20 mb-6">
             <Flame className="h-10 w-10 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 mb-4 tracking-tighter">
            AUCTION <span className="text-transparent bg-clip-text gradient-text-amber pb-2">COMPLETE</span>
          </h1>
          <p className="text-zinc-400 text-lg font-medium max-w-2xl mx-auto tracking-tight">
            The room is officially closed. Review the final franchise rosters and macro auction statistics below.
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card rounded-[20px] p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Users className="w-24 h-24" /></div>
            <p className="text-5xl font-black font-mono text-white mb-2 relative z-10">{totalPlayersSold}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Players Sold</p>
          </div>
          <div className="glass-card rounded-[20px] p-8 text-center shadow-2xl bg-gradient-to-br from-amber-500/5 to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500">₹</div>
            <p className="text-5xl font-black font-mono text-amber-500 mb-2 relative z-10">{formatPriceCr(totalSpent)}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Capital Spent</p>
          </div>
          <div className="glass-card rounded-[20px] p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Trophy className="w-24 h-24" /></div>
            <p className="text-2xl font-black text-white truncate px-2 mb-2 relative z-10 block line-clamp-1 h-12 leading-12">{mostExpensive?.detail_name || "—"}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex flex-col gap-1 items-center">
              Record Sign <span className="text-amber-500 font-mono text-xs shadow-inner bg-black/40 px-2 py-0.5 rounded">{mostExpensive ? `${formatPriceCr(Number(mostExpensive.sold_price_cr))}` : ""}</span>
            </p>
          </div>
        </div>

        {/* Team Selection Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
          {claimedTeams.map(t => {
            const meta = TEAM_MAP.find(m => m.id === t.team_id);
            const isActive = activeTeam === t.team_id;
            return (
              <button
                key={t.team_id}
                onClick={() => setActiveTeam(t.team_id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-300 ease-spring shadow-sm border ${
                  isActive
                    ? `${meta?.color || "bg-zinc-700"} ${meta?.textDark ? "text-zinc-900" : "text-white"} border-transparent shadow-lg scale-105`
                    : "glass-card text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t.team_id}
                <span className={`text-[10px] uppercase tracking-widest ${isActive ? "opacity-70" : "text-zinc-600"}`}>
                  {t.user_name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Team Breakdown */}
        {activeTeam && activeTeamData && (
          <div className="glass-card rounded-[24px] overflow-hidden shadow-2xl animate-fade-up border border-white/[0.08]" style={{ animationDelay: '0.3s' }}>
            {/* Team Header */}
            <div className="p-8 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-white/[0.02] to-transparent relative overflow-hidden">
              <div className="absolute -left-10 w-24 h-[200px] -skew-x-12 opacity-5 pointer-events-none" style={{ backgroundColor: activeTeamMeta?.color.replace('bg-', '') || 'white' }} />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className={`h-20 w-20 rounded-[16px] flex items-center justify-center font-black text-3xl shadow-inner border border-black/20 ${activeTeamMeta?.color || "bg-zinc-700"} ${activeTeamMeta?.textDark ? "text-zinc-900" : "text-white"}`}>
                  {activeTeam}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight">
                    {activeTeamData.user_name}'s <span className="opacity-80">{activeTeamMeta?.name || activeTeam}</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs tracking-wide text-zinc-400 mt-3 font-medium">
                    <span className="bg-black/40 px-3 py-1.5 rounded-md border border-white/[0.04]">
                      Spent: <span className="text-white font-mono font-bold ml-1">{formatPriceCr(120 - (Number(activeTeamData.purse_remaining_cr) || 0))}</span>
                    </span>
                    <span className="bg-amber-500/10 px-3 py-1.5 rounded-md border border-amber-500/20 text-amber-500/80">
                      Left: <span className="text-amber-500 font-mono font-bold ml-1">{formatPriceCr(Number(activeTeamData.purse_remaining_cr) || 0)}</span>
                    </span>
                    <span className="bg-blue-500/10 px-3 py-1.5 rounded-md border border-blue-500/20 text-blue-400/80">
                      OS: <span className="text-blue-400 font-mono font-bold ml-1">{activeTeamData.overseas_count || 0}/8</span>
                    </span>
                  </div>
                </div>
              </div>

              {teamMostExpensive && (
                <div className="text-left md:text-right bg-black/40 p-5 rounded-[16px] border border-white/[0.04] relative z-10 min-w-[200px]">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Blockbuster Sign</p>
                  <p className="text-base font-bold text-white mb-1">{teamMostExpensive.name}</p>
                  <p className="text-sm text-amber-500 font-mono font-black">{formatPriceCr(Number(teamMostExpensive.sold_price_cr))}</p>
                </div>
              )}
            </div>

            {incompleteSquad && (
              <div className="px-8 py-3 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                <Shield className="h-4 w-4" />
                Incomplete squad requirements: only {activeTeamData.squad_count || 0} players purchased (minimum 18 required)
              </div>
            )}

            {/* Squad List Grid */}
            <div className="p-8 bg-black/20">
              {activeSquad.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                   <div className="h-10 w-10 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-3">
                      <Square className="w-4 h-4 text-zinc-600" />
                   </div>
                   <p className="text-zinc-500 text-sm italic font-medium">No players purchased by this franchise.</p>
                </div>
              ) : (() => {
                const BAT = activeSquad.filter(p => ['BATSMAN', 'BAT'].includes(String(p.role).toUpperCase()));
                const WK = activeSquad.filter(p => ['WICKET KEEPER', 'WK', 'BAT/WK'].includes(String(p.role).toUpperCase()));
                const AR = activeSquad.filter(p => ['ALL-ROUNDER', 'AR'].includes(String(p.role).toUpperCase()));
                const BOWL = activeSquad.filter(p => ['BOWLER', 'BOWL'].includes(String(p.role).toUpperCase()));
                
                const mappedIds = [...BAT, ...WK, ...AR, ...BOWL].map(p => p.id);
                const OTHER = activeSquad.filter(p => !mappedIds.includes(p.id));
    
                const groups = [
                   { title: "BATSMEN", data: BAT },
                   { title: "WICKET-KEEPERS", data: WK },
                   { title: "ALL-ROUNDERS", data: AR },
                   { title: "BOWLERS", data: BOWL },
                   ...(OTHER.length > 0 ? [{ title: "OTHER", data: OTHER }] : [])
                ];

                return (
                  <div className="flex flex-col gap-6">
                    {groups.filter(g => g.data.length > 0).map(group => (
                      <div key={group.title}>
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                           {group.title} <span className="text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">{group.data.length}</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[...group.data]
                            .sort((a, b) => Number(b.sold_price_cr) - Number(a.sold_price_cr))
                            .map((p) => (
                              <div key={p.id} className="flex items-center justify-between bg-black/40 border border-white/[0.04] p-4 rounded-[12px] hover:bg-white/[0.03] transition-colors relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div>
                                  <span className="text-sm font-bold text-white flex items-center gap-2 truncate">
                                    {p.name}
                                  </span>
                                  <div className="flex gap-2 mt-1.5">
                                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">{p.role}</span>
                                    {p.is_overseas && <span className="text-[9px] text-orange-400/80 font-bold uppercase tracking-widest">OS</span>}
                                  </div>
                                </div>
                                <span className="text-amber-500 font-black font-mono text-sm shrink-0">{formatPriceCr(Number(p.sold_price_cr))}</span>
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
