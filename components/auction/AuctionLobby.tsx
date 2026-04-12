"use client";

import { useAuction } from "./AuctionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2 } from "lucide-react";
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
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mt-10">
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent pointer-events-none" />
        <h2 className="text-sm text-amber-500 font-bold uppercase tracking-widest mb-4 flex items-center">
          <Share2 className="h-4 w-4 mr-2" /> Invite Players
        </h2>
        <div className="flex gap-2">
          <Input 
            readOnly 
            value={roomCode?.toUpperCase()} 
            className="w-24 bg-black/40 border-white/10 h-12 text-center font-mono font-bold tracking-widest text-amber-400 focus-visible:ring-1 focus-visible:ring-amber-500/50" 
          />
          <Input 
            readOnly 
            value={roomUrl} 
            className="flex-1 bg-black/40 border-white/10 h-12 text-xs text-slate-400 focus-visible:ring-1 focus-visible:ring-amber-500/50" 
          />
          <Button onClick={handleShare} className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 px-6">
            Copy
          </Button>
        </div>
      </div>

      {!playerTeam && (
        <div className="bg-gradient-to-b from-[#161616] to-[#0A0A0A] border border-white/[0.06] rounded-3xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Join the Draft</h2>
            <p className="text-sm text-slate-400">Enter your name and select an available franchise to enter the war room.</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 block">Manager Name</label>
              <Input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your alias..."
                className="bg-black/50 border-white/10 h-14 text-lg text-white font-medium placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500/50"
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 block">Select Franchise</label>
              <div className="grid grid-cols-5 gap-3">
                {TEAM_MAP.map(t => {
                  const isClaimed = claimedTeams.some(c => c.team_id === t.id);
                  return (
                    <button
                      key={t.id}
                      disabled={isClaimed}
                      onClick={() => handleClaim(t.id)}
                      className={`aspect-square rounded-2xl font-black text-sm flex flex-col items-center justify-center transition-all ${
                        isClaimed 
                          ? "bg-white/[0.02] text-white/20 border border-white/[0.05] cursor-not-allowed opacity-50 grayscale" 
                          : `${t.color} text-white border-2 border-transparent hover:scale-105 hover:shadow-xl hover:shadow-${t.color.split('-')[1] || 'white'}-500/20 group`
                      }`}
                    >
                      <span className={`transform transition-transform ${!isClaimed && 'group-hover:scale-110'}`}>{t.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
