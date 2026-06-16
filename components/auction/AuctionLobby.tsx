"use client";

import { useAuction } from "./AuctionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Users, AlertCircle, Play, Shield, Clock, BadgeCent, CheckCircle2, UserCheck, Copy, Check, Globe2 } from "lucide-react";
import { TEAM_MAP, formatPriceCr } from "@/lib/auction-engine";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const MODE_LABELS: Record<string, string> = {
  mega_auction: "Mega Auction (Full Squad Reset)",
  mock_2026: "IPL 2026 Mock Draft (Pre-retentions)",
  legends_upgraded: "Retired Legends & Upgraded Pool",
};

export function AuctionLobby() {
  const { 
    room, 
    roomCode, 
    joinName, 
    setJoinName, 
    playerTeam, 
    claimedTeams, 
    handleClaim, 
    isSpectator, 
    handleSpectate, 
    isHost, 
    handleStartAuction,
    onlineUsers 
  } = useAuction();

  const [copied, setCopied] = useState(false);

  // If room status is not waiting, we shouldn't show the lobby at all
  if (room?.status !== "waiting") return null;

  const roomUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateRoomSetting = async (field: string, value: any) => {
    if (!room?.id) return;
    const updateData: Record<string, any> = { [field]: value };
    const { error } = await supabase
      .from("rooms")
      .update(updateData)
      .eq("id", room.id);
    if (error) {
      if (field === "is_private" && error.message.includes("is_private")) {
        console.warn("is_private column missing in DB, ignoring visibility toggle");
      } else {
        alert("Failed to update setting: " + error.message);
      }
    }
  };

  // Calculate stats
  const spectatorCount = onlineUsers.filter(u => u.spectator || u.team === "Spectator").length;
  
  // Find highest starting purse among franchises to represent starting purse config
  const startingPurse = claimedTeams.length > 0 
    ? Math.max(...claimedTeams.map(t => Number(t.purse_remaining_cr || 120)))
    : 120;

  // Render Waiting/Lobby Screen when user is already inside (joined with team or spectating)
  if (playerTeam || isSpectator) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl mx-auto mt-2 animate-fade-up">
        {/* Main Lobby Column */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Room Configuration Settings */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden border border-white/[0.04]">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.02] to-transparent pointer-events-none" />
            <h3 className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" /> Draft Room Settings {isHost && <span className="text-[10px] text-amber-400 font-bold lowercase tracking-normal">(Host Panel)</span>}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-black/30 border border-white/[0.03] rounded-xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Draft Mode</p>
                  {isHost ? (
                    <select
                      value={room?.auction_mode || "mega_auction"}
                      onChange={(e) => updateRoomSetting("auction_mode", e.target.value)}
                      className="bg-zinc-900 border border-white/[0.1] text-xs font-bold text-white rounded px-2 py-1 mt-1 w-full focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="mega_auction">Mega Auction (Full)</option>
                      <option value="mock_2026">IPL 2026 Mock</option>
                      <option value="legends_upgraded">Legends Pool</option>
                    </select>
                  ) : (
                    <p className="text-xs font-bold text-white mt-1.5 truncate">{MODE_LABELS[room?.auction_mode || "mega_auction"]}</p>
                  )}
                </div>
              </div>

              <div className="bg-black/30 border border-white/[0.03] rounded-xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                  <BadgeCent className="h-5 w-5" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Starting Purse</p>
                  <p className="text-xs font-bold text-white mt-1.5">{startingPurse} Cr</p>
                </div>
              </div>

              <div className="bg-black/30 border border-white/[0.03] rounded-xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Bid Timer</p>
                  {isHost ? (
                    <select
                      value={room?.timer_duration || 10}
                      onChange={(e) => updateRoomSetting("timer_duration", Number(e.target.value))}
                      className="bg-zinc-900 border border-white/[0.1] text-xs font-bold text-white rounded px-2 py-1 mt-1 w-full focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="15">15 seconds</option>
                      <option value="20">20 seconds</option>
                      <option value="30">30 seconds</option>
                    </select>
                  ) : (
                    <p className="text-xs font-bold text-white mt-1.5">{room?.timer_duration || 10} seconds</p>
                  )}
                </div>
              </div>
            </div>

            {/* Room Visibility Toggle for Host */}
            {isHost && (
              <div className="mt-4 bg-black/20 border border-white/[0.02] rounded-xl p-4 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Globe2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Lobby Visibility</h4>
                    <p className="text-[10px] text-zinc-500">Public lobbies appear on the browse page</p>
                  </div>
                </div>
                <select
                  value={room?.is_private ? "private" : "public"}
                  onChange={(e) => updateRoomSetting("is_private", e.target.value === "private")}
                  className="bg-zinc-900 border border-white/[0.1] text-xs font-bold text-white rounded px-2 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="public">🌍 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
            )}
          </div>

          {/* Joined Teams Grid */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-500" /> Joined Franchises
              </h3>
              <span className="text-[10px] font-mono font-bold bg-white/[0.03] border border-white/[0.06] text-zinc-400 px-2.5 py-1 rounded-full">
                {claimedTeams.length}/10 Teams Claimed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEAM_MAP.map((t) => {
                const claim = claimedTeams.find((c) => c.team_id === t.id);
                const isUserOnline = claim && onlineUsers.some((u) => u.team === t.id);

                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                      claim
                        ? "bg-black/30 border-white/[0.05]"
                        : "bg-white/[0.01] border-dashed border-white/[0.05] opacity-60 animate-pulse"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Logo badge: Circle */}
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-inner border border-black/20 ${t.color} ${t.textDark ? "text-zinc-900" : "text-white"}`}>
                        {t.id}
                      </div>
                      
                      <div className="min-w-0">
                        {claim ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">{claim.user_name}</span>
                            {claim.is_host && (
                              <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-widest shrink-0">
                                Host
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-amber-500/60 uppercase tracking-wider">
                            Waiting for player...
                          </span>
                        )}
                        {claim ? (
                          <span className="text-[10px] text-zinc-400 block leading-tight font-medium mt-0.5">
                            Purse: {claim.purse_remaining_cr} Cr • {t.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 block leading-tight font-medium mt-0.5">{t.name}</span>
                        )}
                      </div>
                    </div>

                    {claim ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`h-2 w-2 rounded-full ${isUserOnline ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-zinc-700"}`} />
                        <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase">
                          {isUserOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black tracking-wider text-zinc-700 uppercase">Claimable</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0">
          {/* Invite Code card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden border border-white/[0.04] bg-gradient-to-b from-[#0e0e11] to-[#0a0a0c]">
            <h3 className="text-xs text-amber-500 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4 animate-pulse" /> Lobby Invite
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 text-center font-mono font-black tracking-[0.25em] text-amber-400 text-2xl shadow-inner select-all">
                {roomCode?.toUpperCase()}
              </div>
              <Button
                onClick={handleShare}
                variant="secondary"
                className="w-full h-11 border-white/5 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" /> COPIED!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> COPY INVITE LINK
                  </>
                )}
              </Button>
            </div>
            
            {spectatorCount > 0 && (
              <div className="mt-4 border-t border-white/[0.04] pt-3 flex items-center justify-between text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <span>Spectators</span>
                <span className="text-zinc-300 font-mono flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-500" /> {spectatorCount}
                </span>
              </div>
            )}
          </div>

          {/* Action / Launch Card */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.04] flex flex-col items-center justify-center text-center bg-black/40">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-4 animate-bounce">
              <UserCheck className="h-5 w-5 text-amber-500" />
            </div>

            {isHost ? (
              <>
                <h4 className="text-base font-bold text-white mb-2">You are the Draft Host</h4>
                <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                  As the creator, you can launch the auction rooms once players have joined their respective war tables.
                </p>
                <Button
                  onClick={handleStartAuction}
                  disabled={claimedTeams.length < 2}
                  variant={claimedTeams.length >= 2 ? "primary" : "secondary"}
                  className={`w-full h-12 font-black tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                    claimedTeams.length >= 2 
                      ? "shimmer-btn shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] cursor-pointer"
                      : "opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500"
                  }`}
                >
                  <Play className="h-4 w-4 fill-black" /> START AUCTION
                </Button>
                {claimedTeams.length < 2 && (
                  <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider mt-2.5 animate-pulse">
                    ⚠️ Minimum 2 claims required to start
                  </p>
                )}
              </>
            ) : (
              <>
                <h4 className="text-base font-bold text-white mb-2">Lobby Locked</h4>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  Waiting for the host manager to launch the auction room dashboard. Feel free to chat with competitors.
                </p>
                <div className="flex items-center gap-2.5 text-zinc-400 bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3 w-full justify-center">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/90">WAITING ON HOST MANAGER</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Franchise Claim Form (Standard View when first entering code, before claimedTeam is set)
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mt-6 animate-fade-up">
      {/* Invite Card */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden group border border-white/[0.04]">
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
               className="absolute right-1 top-1 h-10 w-28 border-white/5 font-bold text-xs uppercase"
            >
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
          <div className="hidden sm:flex h-12 w-32 bg-black/60 border border-white/5 rounded-lg items-center justify-center font-mono font-black tracking-[0.2em] text-amber-400 text-lg shadow-inner">
            {roomCode?.toUpperCase()}
          </div>
        </div>
      </div>

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
          
          {!joinName.trim() && claimedTeams.length < (room?.max_players || 10) && (
             <div className="flex items-center gap-2 text-xs font-semibold text-amber-500/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
               <AlertCircle className="h-4 w-4" /> 
               Enter a manager alias above before selecting a team.
             </div>
          )}
          
          <div className="mt-4 border-t border-white/[0.05] pt-6 flex flex-col gap-3">
             {claimedTeams.length >= (room?.max_players || 10) ? (
               <div className="text-center">
                 <p className="text-sm font-bold text-amber-500 mb-3 bg-amber-500/10 py-2 border border-amber-500/20 rounded-lg">All franchises have been claimed!</p>
               </div>
             ) : (
               <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-widest">or</p>
             )}
             <Button onClick={handleSpectate} variant="ghost" className="w-full text-zinc-400 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-colors h-12 font-bold tracking-widest">
                {claimedTeams.length >= (room?.max_players || 10) ? "PROCEED TO SPECTATE" : "JUST SPECTATE"}
             </Button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
