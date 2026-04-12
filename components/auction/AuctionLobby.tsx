"use client";

import { useAuction } from "./AuctionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Users, AlertCircle } from "lucide-react";
import { TEAM_MAP } from "@/lib/auction-engine";

export function AuctionLobby() {
  const { room, roomCode, joinName, setJoinName, playerTeam, claimedTeams, handleClaim } = useAuction();
  
  if (room?.status !== "waiting" || (playerTeam && room?.status === "waiting")) {
    return null; // Shown as full page in waiting if no team selected
  }

  const roomUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = () => {
    navigator.clipboard.writeText(roomUrl);
    alert("Invite link copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mt-6 animate-fade-up">
      {/* Invite Card */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none group-hover:from-amber-500/10 transition-colors duration-500" />
        <h2 className="text-sm text-amber-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
          <Share2 className="h-4 w-4" /> Share Invite
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input 
              readOnly 
              value={roomUrl} 
              className="w-full bg-black/60 border-white/5 h-12 text-[13px] text-zinc-400 font-mono pr-28 select-all" 
            />
            <Button 
               onClick={handleShare} 
               variant="secondary" 
               className="absolute right-1 top-1 h-10 w-24 border-white/5"
            >
              Copy Link
            </Button>
          </div>
          <div className="hidden sm:flex h-12 w-32 bg-black/60 border border-white/5 rounded-lg items-center justify-center font-mono font-black tracking-[0.2em] text-amber-400 text-lg shadow-inner">
            {roomCode?.toUpperCase()}
          </div>
        </div>
      </div>

      {!playerTeam && (
        <div className="glass-card border border-white/[0.08] rounded-[24px] p-8 shadow-2xl relative overflow-hidden shadow-black/50">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          
          <div className="mb-8 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <Users className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Join the Draft</h2>
            <p className="text-sm font-medium text-zinc-400">Select an available franchise to lock your seat in the war room.</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Manager Alias</label>
              <Input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name..."
                className="bg-black/60 border-white/10 h-12 text-base font-semibold"
                maxLength={20}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3 block">
                 <label className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Available Franchises</label>
                 <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded font-mono text-zinc-400">
                   {10 - claimedTeams.length} Open
                 </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {TEAM_MAP.map(t => {
                  const isClaimed = claimedTeams.some(c => c.team_id === t.id);
                  return (
                    <button
                      key={t.id}
                      disabled={isClaimed}
                      onClick={() => handleClaim(t.id)}
                      className={`relative aspect-square rounded-[14px] font-black text-sm flex flex-col items-center justify-center transition-all duration-300 ease-spring ${
                        isClaimed 
                          ? "bg-white/[0.02] text-zinc-600 border border-white/[0.03] cursor-not-allowed grayscale" 
                          : `${t.color} text-white hover:scale-105 hover:shadow-lg shadow-inner z-10 group overflow-hidden`
                      }`}
                      style={{ boxShadow: !isClaimed ? `inset 0 2px 4px rgba(255,255,255,0.2)` : undefined }}
                    >
                      <span className={`transform transition-transform duration-300 ${!isClaimed && 'group-hover:scale-110 relative z-10'}`}>
                        {t.id}
                      </span>
                      {isClaimed && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[14px] backdrop-blur-[1px]">
                          <span className="text-[10px]">❌</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {!joinName.trim() && (
               <div className="flex items-center gap-2 text-xs font-semibold text-amber-500/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                 <AlertCircle className="h-4 w-4" /> 
                 Enter a manager alias above before selecting a team.
               </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
