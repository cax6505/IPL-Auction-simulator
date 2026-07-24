"use client";

import { useAuction } from "./AuctionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Share2,
  Users,
  AlertCircle,
  Play,
  Shield,
  Clock,
  BadgeCent,
  UserCheck,
  Copy,
  Check,
  Globe2,
  Info,
} from "lucide-react";
import { TEAM_MAP } from "@/lib/auction-engine";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TeamLogo } from "@/components/ui/TeamLogo";

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
    onlineUsers,
  } = useAuction();

  const [copied, setCopied] = useState(false);

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
      alert("Failed to update setting: " + error.message);
    }
  };

  const spectatorCount = onlineUsers.filter(
    (u) => u.spectator || u.team === "Spectator"
  ).length;

  const startingPurse =
    claimedTeams.length > 0
      ? Math.max(...claimedTeams.map((t) => Number(t.purse_remaining_cr || 120)))
      : 120;

  // Main Joined / Spectating View
  if (playerTeam || isSpectator) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto animate-fade-up">
        {/* Left Column: Room Settings & Joined Teams */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Room Settings Panel */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-white">
                    Room Settings
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {isHost ? "Configured by room host" : "Set by room creator"}
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                {claimedTeams.length}/10 Joined
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-400 block">Auction Mode</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">Mega Auction</span>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <BadgeCent className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-400 block">Starting Purse</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">₹{startingPurse} Cr</span>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="w-full">
                  <span className="text-xs font-semibold text-zinc-400 block">Bid Timer</span>
                  {isHost ? (
                    <select
                      value={room?.timer_duration || 10}
                      onChange={(e) => updateRoomSetting("timer_duration", Number(e.target.value))}
                      className="bg-black/40 border border-white/15 text-xs font-semibold text-white rounded-lg px-2.5 py-1.5 mt-1 w-full focus:border-amber-400 cursor-pointer"
                    >
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="15">15 seconds</option>
                      <option value="20">20 seconds</option>
                      <option value="30">30 seconds</option>
                    </select>
                  ) : (
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {room?.timer_duration || 10} seconds
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility Toggle */}
            {isHost && (
              <div className="mt-4 glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe2 className="h-4 w-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Room Visibility</span>
                    <span className="text-xs text-zinc-400">Public rooms appear in the lobby directory</span>
                  </div>
                </div>
                <select
                  value={room?.is_private ? "private" : "public"}
                  onChange={(e) => updateRoomSetting("is_private", e.target.value === "private")}
                  className="bg-black/40 border border-white/15 text-xs font-semibold text-white rounded-lg px-3 py-1.5 focus:border-amber-400 cursor-pointer"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            )}
          </div>

          {/* Franchises List */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">
                    Franchise Claims
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Claimed seats and connected managers
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                {claimedTeams.length} / 10 Joined
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {TEAM_MAP.map((t) => {
                const claim = claimedTeams.find((c) => c.team_id === t.id);
                const isUserOnline = claim && onlineUsers.some((u) => u.team === t.id);

                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      claim
                        ? "glass-panel border-white/15 bg-white/[0.03]"
                        : "glass-panel border-dashed border-white/10 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <TeamLogo teamId={t.id} size="md" />

                      <div className="min-w-0">
                        {claim ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">
                              {claim.user_name}
                            </span>
                            {claim.is_host && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold shrink-0">
                                Host
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-amber-400">
                            Open Seat
                          </span>
                        )}

                        <span className="text-xs text-zinc-400 block mt-0.5 truncate">
                          {claim
                            ? `Purse: ₹${claim.purse_remaining_cr} Cr • ${t.id}`
                            : t.name}
                        </span>
                      </div>
                    </div>

                    {claim ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            isUserOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                          }`}
                        />
                        <span className="text-xs font-medium text-zinc-400">
                          {isUserOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-zinc-500">
                        Open
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar Controls */}
        <div className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0">
          {/* Invite Code Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Invite Code
            </h3>

            <div className="flex flex-col gap-3">
              <div className="bg-black/50 border border-white/15 rounded-2xl p-4 text-center font-mono font-black tracking-widest text-amber-400 text-3xl shadow-inner select-all">
                {roomCode?.toUpperCase()}
              </div>

              <Button
                onClick={handleShare}
                className="w-full h-11 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy Link
                  </>
                )}
              </Button>
            </div>

            {spectatorCount > 0 && (
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Spectators</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-amber-400" /> {spectatorCount}
                </span>
              </div>
            )}
          </div>

          {/* Host Controls / Waiting Status */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
              <UserCheck className="h-6 w-6" />
            </div>

            {isHost ? (
              <>
                <h4 className="font-display font-bold text-base text-white mb-1">
                  Host Controls
                </h4>
                <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                  Start the auction once at least 2 managers have joined.
                </p>

                <Button
                  onClick={handleStartAuction}
                  disabled={claimedTeams.length < 2}
                  className="w-full h-12 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-semibold text-xs uppercase tracking-wide rounded-xl shadow-lg disabled:opacity-40"
                >
                  <Play className="h-4 w-4 mr-2" /> Start Auction
                </Button>

                {claimedTeams.length < 2 && (
                  <p className="text-xs text-amber-400 font-medium mt-3">
                    Requires at least 2 claimed franchises to start.
                  </p>
                )}
              </>
            ) : (
              <>
                <h4 className="font-display font-bold text-base text-white mb-1">
                  Waiting for Host
                </h4>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  The host will start the auction once all managers are ready.
                </p>
                <div className="glass-panel p-3 rounded-xl border border-white/10 text-xs font-semibold text-amber-400 flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  Waiting on host manager...
                </div>
              </>
            )}
          </div>

          {/* Auction Rules Summary Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-cyan-400" /> Auction Rules
            </h3>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Squad size: 18 – 25 players</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Overseas limit: Up to 8 players</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Timer: Resets +5s on new bids</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-Join View
  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto animate-fade-up">
      {/* Invite Code Bar */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10">
        <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Share2 className="h-4 w-4" /> Room Invite
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              readOnly
              value={roomUrl}
              className="w-full bg-black/40 border-white/15 h-11 text-xs text-zinc-300 font-mono pr-28 select-all rounded-xl"
            />
            <Button
              onClick={handleShare}
              className="absolute right-1 top-1 h-9 px-3 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-lg"
            >
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
          <div className="h-11 px-4 bg-black/40 border border-white/15 rounded-xl flex items-center justify-center font-mono font-bold tracking-widest text-amber-400 text-base">
            {roomCode?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Claim Seat Card */}
      <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
            <Users className="h-6 w-6" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-1">
            Join Auction
          </h2>
          <p className="text-xs text-zinc-400">
            Enter your name and select a franchise.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-2 block">
              Your Name
            </label>
            <Input
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Enter your name..."
              className="bg-black/40 border-white/15 h-11 text-sm font-sans text-white placeholder:text-zinc-500 rounded-xl"
              maxLength={20}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-zinc-300">
                Select Franchise
              </label>
              <span className="text-xs font-semibold text-amber-400">
                {10 - claimedTeams.length} Open Seats
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2.5">
              {TEAM_MAP.map((t) => {
                const isClaimed = claimedTeams.some((c) => c.team_id === t.id);
                return (
                  <button
                    key={t.id}
                    disabled={isClaimed}
                    onClick={() => handleClaim(t.id)}
                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all p-2 ${
                      isClaimed
                        ? "glass-panel opacity-30 cursor-not-allowed border-white/5"
                        : "glass-panel border-white/15 hover:border-amber-400/50 hover:scale-105"
                    }`}
                  >
                    <TeamLogo teamId={t.id} size="md" />
                    <span className="text-xs font-bold text-white mt-1">
                      {t.id}
                    </span>
                    {isClaimed && (
                      <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center text-xs font-bold text-red-400">
                        Claimed
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {!joinName.trim() && claimedTeams.length < (room?.max_players || 10) && (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Enter your name before selecting a franchise.
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Button
              onClick={handleSpectate}
              variant="outline"
              className="w-full h-11 border-white/15 text-zinc-300 hover:text-white font-semibold text-xs rounded-xl"
            >
              Spectate Room
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
