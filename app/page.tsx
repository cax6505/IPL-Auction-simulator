"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Users,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  LogIn,
  BookOpen,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const IPL_TEAMS = [
  { id: "CSK", name: "Chennai Super Kings", short: "CSK", color: "#FFC107", bg: "bg-[#FFC107]", text: "text-zinc-900", border: "border-[#FFC107]" },
  { id: "MI", name: "Mumbai Indians", short: "MI", color: "#004BA0", bg: "bg-[#004BA0]", text: "text-white", border: "border-[#004BA0]" },
  { id: "RCB", name: "Royal Challengers Bengaluru", short: "RCB", color: "#D4213D", bg: "bg-[#D4213D]", text: "text-white", border: "border-[#D4213D]" },
  { id: "KKR", name: "Kolkata Knight Riders", short: "KKR", color: "#3A225D", bg: "bg-[#3A225D]", text: "text-white", border: "border-[#3A225D]" },
  { id: "DC", name: "Delhi Capitals", short: "DC", color: "#0077B6", bg: "bg-[#0077B6]", text: "text-white", border: "border-[#0077B6]" },
  { id: "PBKS", name: "Punjab Kings", short: "PBKS", color: "#ED1B24", bg: "bg-[#ED1B24]", text: "text-white", border: "border-[#ED1B24]" },
  { id: "RR", name: "Rajasthan Royals", short: "RR", color: "#EA1A85", bg: "bg-[#EA1A85]", text: "text-white", border: "border-[#EA1A85]" },
  { id: "SRH", name: "Sunrisers Hyderabad", short: "SRH", color: "#F26522", bg: "bg-[#F26522]", text: "text-white", border: "border-[#F26522]" },
  { id: "GT", name: "Gujarat Titans", short: "GT", color: "#1B2133", bg: "bg-[#1B2133]", text: "text-white", border: "border-[#1B2133]" },
  { id: "LSG", name: "Lucknow Super Giants", short: "LSG", color: "#A72056", bg: "bg-[#A72056]", text: "text-white", border: "border-[#A72056]" },
];

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Restore identity from sessionStorage
  useEffect(() => {
    const savedName = sessionStorage.getItem("playerName");
    const savedTeam = sessionStorage.getItem("playerTeam");
    if (savedName) setPlayerName(savedName);
    if (savedTeam) setSelectedTeam(savedTeam);
  }, []);

  // Persist identity to sessionStorage
  useEffect(() => {
    if (playerName) sessionStorage.setItem("playerName", playerName);
  }, [playerName]);

  useEffect(() => {
    if (selectedTeam) sessionStorage.setItem("playerTeam", selectedTeam);
  }, [selectedTeam]);

  const isReady = playerName.trim().length > 0 && selectedTeam !== null;

  const handleCreateRoom = async () => {
    if (!isReady) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName.trim(), playerTeam: selectedTeam }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");
      router.push(`/room/${data.roomCode}`);
    } catch (err: any) {
      alert(err.message);
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!isReady || !roomCode.trim()) return;
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError("Room code must be 6 characters");
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/rooms/${code}`);
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || "Room not found");
        setIsJoining(false);
        return;
      }
      // Try to join
      const joinRes = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName.trim(), playerTeam: selectedTeam }),
      });
      const joinData = await joinRes.json();
      if (!joinRes.ok) {
        setJoinError(joinData.error || "Could not join room");
        setIsJoining(false);
        return;
      }
      router.push(`/room/${code}`);
    } catch (err: any) {
      setJoinError(err.message);
      setIsJoining(false);
    }
  };

  const selectedTeamData = IPL_TEAMS.find((t) => t.id === selectedTeam);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] surface-0 overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] h-[50rem] w-[50rem] rounded-full bg-amber-500/[0.03] blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-orange-600/[0.02] blur-[100px] animate-float" style={{ animationDuration: '12s' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-[13px] text-amber-400 mb-6 font-semibold shadow-inner shadow-amber-500/10">
            <Sparkles className="h-4 w-4" />
            IPL Mega Auction Simulator 2026
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-6">
            Build Your{" "}
            <span className="gradient-text-amber text-glow-amber">
              Dream Team
            </span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Create a room, invite friends, and compete in real-time IPL auctions. Scout players, manage your purse, and outbid opponents.
          </p>
        </div>

        {/* Main Interface Card */}
        <div className="max-w-xl mx-auto animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card rounded-[20px] overflow-hidden">
            
            {/* Step 1: Name */}
            <div className="p-6 sm:p-8 border-b border-white/[0.04]">
              <label className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-[0.15em] mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-black border border-amber-500/30">1</span>
                Your Display Name
              </label>
              <Input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                placeholder="Manager alias (e.g. MS Dhoni 07)..."
                maxLength={20}
                className="h-13 text-base"
              />
              <p className="text-[11px] text-zinc-500 mt-2 font-mono text-right">{playerName.length}/20</p>
            </div>

            {/* Step 2: Team */}
            <div className="p-6 sm:p-8 border-b border-white/[0.04] bg-white/[0.01]">
              <label className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-[0.15em] mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-black border border-amber-500/30">2</span>
                Choose Your Franchise
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {IPL_TEAMS.map((team) => {
                  const isSelected = selectedTeam === team.id;
                  return (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team.id)}
                      className={`relative flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-xl transition-all duration-300 ease-spring group overflow-hidden ${
                        isSelected
                          ? `bg-zinc-800 ring-2 ring-amber-500 shadow-xl scale-105 z-10`
                          : "bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.1] hover:scale-[1.02]"
                      }`}
                    >
                      {/* Subtly tinted background for selected item matching team color */}
                      {isSelected && (
                        <div className={`absolute inset-0 opacity-10 ${team.bg}`} />
                      )}
                      
                      <div
                        className={`relative z-10 h-10 w-10 rounded-[10px] flex items-center justify-center font-black text-xs transition-all duration-300 ${team.bg} ${team.text} ${
                          isSelected ? "shadow-lg shadow-black/50" : "opacity-80 group-hover:opacity-100 shadow-inner"
                        }`}
                      >
                        {team.short}
                      </div>
                      <span className={`relative z-10 text-[10px] font-bold tracking-wide transition-colors ${isSelected ? "text-amber-500" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                        {team.short}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 z-10">
                          <div className="h-3.5 w-3.5 rounded-full bg-amber-500 border border-black flex items-center justify-center">
                            <Check className="h-2 w-2 text-amber-950 font-bold" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="h-4 mt-3 text-center">
                {selectedTeamData && (
                  <p className="text-xs text-zinc-400 animate-slide-down">
                    Drafting for <span className="text-zinc-100 font-bold">{selectedTeamData.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Step 3: Actions */}
            <div className="p-6 sm:p-8 space-y-6">
              <label className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-black border border-amber-500/30">3</span>
                Enter the War Room
              </label>

              {/* Create Room */}
              <Button
                onClick={handleCreateRoom}
                disabled={!isReady || isCreating}
                variant={isReady ? "primary" : "secondary"}
                size="xl"
                className={`w-full ${isReady ? "shimmer-btn" : ""}`}
              >
                {isCreating ? (
                  <div className="h-5 w-5 border-2 border-currentColor border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Create New Room
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative flex items-center py-1">
                <div className="flex-1 border-t border-white/[0.06]"></div>
                <span className="shrink-0 px-4 text-xs font-medium text-zinc-500 uppercase tracking-widest">Or Join Existing</span>
                <div className="flex-1 border-t border-white/[0.06]"></div>
              </div>

              {/* Join Room */}
              <div className="flex gap-2.5">
                <Input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
                    setJoinError(null);
                  }}
                  disabled={!isReady}
                  placeholder="6-DIGIT CODE"
                  maxLength={6}
                  className="flex-1 h-14 text-center text-lg font-mono tracking-[0.3em] uppercase bg-black/60 focus-visible:bg-black/80"
                />
                <Button
                  onClick={handleJoinRoom}
                  disabled={!isReady || !roomCode.trim() || isJoining}
                  variant="outline"
                  className="h-14 w-[120px] font-bold tracking-wide"
                >
                  {isJoining ? (
                    <div className="h-5 w-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-1" />
                      Join
                    </>
                  )}
                </Button>
              </div>
              
              {/* Messages */}
              <div className="min-h-[24px]">
                {joinError && (
                  <p className="text-red-400 text-xs font-semibold flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[8px] px-3 py-2 animate-slide-down">
                    <span className="h-4 w-4 flex items-center justify-center rounded-full bg-red-500/20 text-red-400">!</span> {joinError}
                  </p>
                )}
                {!isReady && !joinError && (
                  <p className="text-xs text-zinc-500 text-center font-medium">
                    Complete steps 1 and 2 to unlock room actions
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Link
              href="/browse"
              className="flex items-center gap-4 p-4 glass-card hover:glass-card-hover rounded-[14px] transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Globe2 className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">Browse Rooms</span>
                <span className="text-[11px] text-zinc-500 font-medium">Find public games</span>
              </div>
            </Link>
            <Link
              href="/how-to-play"
              className="flex items-center gap-4 p-4 glass-card hover:glass-card-hover rounded-[14px] transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <BookOpen className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">How to Play</span>
                <span className="text-[11px] text-zinc-500 font-medium">Rules & Strategy</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
