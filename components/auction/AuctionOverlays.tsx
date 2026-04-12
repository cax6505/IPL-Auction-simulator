"use client";

import { useAuction } from "./AuctionContext";
import { Button } from "@/components/ui/button";
import { Square, Users, Flame, Zap, Shield, Loader2 } from "lucide-react";
import { TEAM_MAP, formatPriceCr, IPL_RULES } from "@/lib/auction-engine";
import { useState } from "react";

export function AuctionOverlays() {
  const { 
    showSoldFlash, showSquadsModal, setShowSquadsModal, 
    isAuctionComplete, claimedTeams, squadsMap, loadSquad, myRecord, isHost 
  } = useAuction();

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-tr ${teamMeta?.color.replace('bg-', 'from-') || 'from-white'} to-black animate-pulse pointer-events-none`} />
      <div className="relative z-10 flex flex-col items-center max-w-3xl text-center">
        <h1 className="text-7xl sm:text-9xl font-black text-white italic tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.7)]">
          SOLD!
        </h1>
        <div className="mt-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className={`h-32 w-32 rounded-3xl flex justify-center items-center font-black text-4xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/20 ${teamMeta?.color || "bg-slate-700"} ${teamMeta?.textDark ? "text-slate-900" : "text-white"}`}>
            {showSoldFlash.team}
          </div>
          <div className="flex flex-col items-center md:items-start text-white">
            <span className="text-4xl sm:text-5xl font-black tracking-tight">
              {formatPriceCr(showSoldFlash.amount)}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-amber-500 uppercase tracking-widest mt-2">
              To {teamData?.user_name || showSoldFlash.team}
            </span>
            <span className="text-base text-slate-300 font-medium mt-1">
              {showSoldFlash.name}
            </span>
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
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#050505]/95 backdrop-blur-3xl animate-in fade-in duration-200">
      <div className="flex justify-between items-center p-6 border-b border-white/[0.04] bg-white/[0.02] shrink-0">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <Users className="h-6 w-6 text-amber-500" /> Franchise Dashboards
        </h2>
        <Button onClick={() => setShowSquadsModal(null)} variant="ghost" className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full">
          <Square className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-72 border-r border-white/[0.04] overflow-y-auto p-4 space-y-2 shrink-0 bg-black/20">
          {claimedTeams.map(t => {
            const meta = TEAM_MAP.find(m => m.id === t.team_id);
            return (
              <button
                key={t.id}
                onClick={() => loadSquad(t.team_id)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-4 transition-all ${
                  showSquadsModal === t.team_id 
                    ? "bg-amber-500/10 border border-amber-500/30" 
                    : "bg-white/[0.02] hover:bg-white/[0.06] border border-transparent"
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex justify-center items-center font-black text-sm shadow-inner ${meta?.color || "bg-slate-700"} ${meta?.textDark ? "text-slate-900" : "text-white"}`}>
                  {t.team_id}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm tracking-tight">{t.user_name}</span>
                  <span className="text-amber-500 text-xs font-medium mt-0.5">{formatPriceCr(Number(t.purse_remaining_cr || 0))} Cr</span>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Main View */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#0A0A0A]">
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-white/[0.04]">
            <div className={`h-16 w-16 rounded-2xl flex justify-center items-center font-black text-2xl border border-white/10 shadow-lg ${activeTeamMeta?.color || "bg-slate-700"} ${activeTeamMeta?.textDark ? "text-slate-900" : "text-white"}`}>
              {showSquadsModal}
            </div>
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight">{activeTeamData?.user_name}'s <span className="text-slate-400 font-medium">Squad</span></h3>
              <p className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-widest">{squadsMap[showSquadsModal]?.length || 0} players secured</p>
            </div>
          </div>
          
          {!squadsMap[showSquadsModal] ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
              <p className="text-sm text-white font-medium uppercase tracking-widest">Compiling Database...</p>
            </div>
          ) : squadsMap[showSquadsModal].length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/[0.04] rounded-3xl bg-white/[0.01]">
              <p className="text-slate-500 font-medium text-sm text-center">No transactions recorded for this franchise yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {squadsMap[showSquadsModal].map(p => (
                <div key={p.id} className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{p.name}</span>
                    <div className="flex gap-2 mt-1.5">
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.04]">{p.role}</span>
                      {p.is_overseas && <span className="text-[9px] text-orange-400 uppercase font-bold tracking-widest bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">OS</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">PURCHASE PRICE</span>
                    <span className="text-amber-500 font-black text-lg">{formatPriceCr(Number(p.sold_price_cr))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultsScreen() {
  const { isAuctionComplete, claimedTeams, squadsMap, playerTeam } = useAuction();
  const [activeTeam, setActiveTeam] = useState<string | null>(playerTeam || claimedTeams[0]?.team_id || null);

  if (!isAuctionComplete) return null;

  const flatSquads = Object.entries(squadsMap).flatMap(([teamId, squad]) => 
    squad.map((p: any) => ({ 
      name: p.name as string, 
      price: Number(p.sold_price_cr), 
      team: teamId 
    }))
  );

  const totalPlayersSold = flatSquads.length;
  const totalSpent = flatSquads.reduce((sum, p) => sum + p.price, 0);
  const mostExpensive = flatSquads.length > 0 
    ? flatSquads.reduce((max, p) => p.price > max.price ? p : max, flatSquads[0])
    : null;

  const activeSquad = activeTeam ? squadsMap[activeTeam] || [] : [];
  const activeTeamData = claimedTeams.find(t => t.team_id === activeTeam);
  const activeTeamMeta = TEAM_MAP.find(t => t.id === activeTeam);
  const teamMostExpensive = activeSquad.length > 0
    ? activeSquad.reduce((max, p) => Number(p.sold_price_cr) > Number(max.sold_price_cr) ? p : max, activeSquad[0])
    : null;
  const incompleteSquad = (activeTeamData?.squad_count || 0) < IPL_RULES.MIN_SQUAD_SIZE;

  // Render logic from original ResultsScreen
  return (
    <div className="fixed inset-0 z-[110] bg-[#0A0A0A] overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Flame className="h-16 w-16 text-amber-500 mx-auto mb-6 animate-bounce drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
          <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4 tracking-tighter">
            DRAFT COMPLETE
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-2xl mx-auto">
            The war room is now closed. Review the final franchise rosters and auction statistics below.
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center shadow-lg">
            <p className="text-4xl font-black text-white">{totalPlayersSold}</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-2 font-bold">Total Players Sold</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center shadow-lg">
            <p className="text-4xl font-black text-amber-400">{formatPriceCr(totalSpent)}</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-2 font-bold">Total Capital Spent</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center shadow-lg">
            <p className="text-2xl font-black text-white truncate px-2">{mostExpensive?.name || "—"}</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-2 font-bold flex flex-col gap-1 items-center">
              Most Expensive Sign <span className="text-amber-500">{mostExpensive ? `(${formatPriceCr(mostExpensive.price)})` : ""}</span>
            </p>
          </div>
        </div>

        {/* Team Selection Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {claimedTeams.map(t => {
            const meta = TEAM_MAP.find(m => m.id === t.team_id);
            const isActive = activeTeam === t.team_id;
            return (
              <button
                key={t.team_id}
                onClick={() => setActiveTeam(t.team_id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  isActive
                    ? `${meta?.color || "bg-slate-700"} ${meta?.textDark ? "text-slate-900" : "text-white"} ring-2 ring-white/20`
                    : "bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] border border-white/[0.04]"
                }`}
              >
                {t.team_id}
                <span className={`text-[10px] uppercase tracking-widest ${isActive ? "opacity-70" : "text-slate-600"}`}>
                  {t.user_name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Team Breakdown */}
        {activeTeam && activeTeamData && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl">
            {/* Team Header */}
            <div className="p-6 md:p-8 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-black/40 to-transparent">
              <div className="flex items-center gap-5">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${activeTeamMeta?.color || "bg-slate-700"} ${activeTeamMeta?.textDark ? "text-slate-900" : "text-white"}`}>
                  {activeTeam}
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {activeTeamData.user_name}'s {activeTeamMeta?.name || activeTeam}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs tracking-wide text-slate-400 mt-2 font-medium">
                    <span className="bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                      Spent: <span className="text-white font-bold">{formatPriceCr(120 - (Number(activeTeamData.purse_remaining_cr) || 0))}</span>
                    </span>
                    <span className="bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                      Remaining: <span className="text-amber-500 font-bold">{formatPriceCr(Number(activeTeamData.purse_remaining_cr) || 0)}</span>
                    </span>
                    <span className="bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                      Overseas: <span className="text-blue-400 font-bold">{activeTeamData.overseas_count || 0}/8</span>
                    </span>
                  </div>
                </div>
              </div>

              {teamMostExpensive && (
                <div className="text-left md:text-right bg-white/[0.02] p-4 rounded-xl border border-white/[0.04]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">⭐ Blockbuster Sign</p>
                  <p className="text-base font-bold text-white">{teamMostExpensive.name}</p>
                  <p className="text-sm text-amber-500 font-black">{formatPriceCr(Number(teamMostExpensive.sold_price_cr))}</p>
                </div>
              )}
            </div>

            {incompleteSquad && (
              <div className="px-6 md:px-8 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                <Shield className="h-4 w-4" />
                Incomplete squad requirements: only {activeTeamData.squad_count || 0} players drafted (minimum 18 required)
              </div>
            )}

            {/* Squad List Grid */}
            <div className="p-6 md:p-8">
              {activeSquad.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-12 italic font-medium">No players purchased by this franchise.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...activeSquad]
                    .sort((a, b) => Number(b.sold_price_cr) - Number(a.sold_price_cr))
                    .map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-black/40 border border-white/[0.04] p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
                        <div>
                          <span className="text-sm font-bold text-white">{p.name}</span>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{p.role}</span>
                            {p.is_overseas && <span className="text-[9px] text-orange-400/80 font-bold uppercase">OS</span>}
                          </div>
                        </div>
                        <span className="text-amber-500 font-black text-sm">{formatPriceCr(Number(p.sold_price_cr))}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
