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

const IPL_TEAMS = [
  { id: "CSK", name: "Chennai Super Kings", short: "CSK", color: "#FFC107", bg: "bg-[#FFC107]", text: "text-slate-900", border: "border-[#FFC107]" },
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
  const [copied, setCopied] = useState(false);

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
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#060609] overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] h-[50rem] w-[50rem] rounded-full bg-amber-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-blue-500/[0.04] blur-[150px]" />
        <div className="absolute top-[20%] right-[20%] h-[30rem] w-[30rem] rounded-full bg-purple-500/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 mb-6">
            <Trophy className="h-4 w-4" />
            <span className="font-semibold">IPL Mega Auction Simulator 2026</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-4">
            Build Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500">
              Dream Team
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Create a room, invite friends, and compete in real-time IPL auctions.
            Scout players, manage your purse, outbid your opponents.
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-xl mx-auto">
          <div className="bg-[#0c0c10] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            {/* Step 1: Name */}
            <div className="p-6 border-b border-white/[0.06]">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black">1</span>
                Your Display Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full h-12 bg-[#111118] border border-white/[0.08] rounded-xl px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm font-medium"
              />
              <p className="text-[11px] text-slate-600 mt-1.5 text-right">{playerName.length}/20</p>
            </div>

            {/* Step 2: Team */}
            <div className="p-6 border-b border-white/[0.06]">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black">2</span>
                Choose Your Franchise
              </label>
              <div className="grid grid-cols-5 gap-2.5">
                {IPL_TEAMS.map((team) => {
                  const isSelected = selectedTeam === team.id;
                  return (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team.id)}
                      className={`relative flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl border-2 transition-all duration-200 group ${
                        isSelected
                          ? `${team.border} bg-white/[0.04] scale-[1.05] shadow-lg`
                          : "border-transparent bg-white/[0.02] hover:bg-white/[0.04] hover:scale-[1.03]"
                      }`}
                    >
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center font-black text-[11px] transition-all ${team.bg} ${team.text} ${
                          isSelected ? "shadow-lg" : "opacity-70 group-hover:opacity-100"
                        }`}
                      >
                        {team.short}
                      </div>
                      <span className={`text-[10px] font-semibold transition-colors ${isSelected ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}>
                        {team.short}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-black" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedTeamData && (
                <p className="text-xs text-slate-400 mt-3 text-center">
                  Selected: <span className="text-white font-semibold">{selectedTeamData.name}</span>
                </p>
              )}
            </div>

            {/* Step 3: Actions */}
            <div className="p-6 space-y-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black">3</span>
                Create or Join a Room
              </label>

              {/* Create Room */}
              <button
                onClick={handleCreateRoom}
                disabled={!isReady || isCreating}
                className={`w-full h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  isReady
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] hover:shadow-[0_0_50px_-10px_rgba(245,158,11,0.7)]"
                    : "bg-white/[0.04] text-slate-600 cursor-not-allowed"
                }`}
              >
                {isCreating ? (
                  <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Create Room
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-slate-600 font-medium">OR</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Join Room */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
                    setJoinError(null);
                  }}
                  placeholder="Enter 6-digit room code..."
                  maxLength={6}
                  className="flex-1 h-12 bg-[#111118] border border-white/[0.08] rounded-xl px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm font-mono tracking-[0.2em] uppercase"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!isReady || !roomCode.trim() || isJoining}
                  className={`h-12 px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                    isReady && roomCode.trim()
                      ? "bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.1]"
                      : "bg-white/[0.03] text-slate-700 cursor-not-allowed"
                  }`}
                >
                  {isJoining ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Join
                    </>
                  )}
                </button>
              </div>
              {joinError && (
                <p className="text-red-400 text-xs font-medium flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  ⚠️ {joinError}
                </p>
              )}

              {!isReady && (
                <p className="text-xs text-slate-600 text-center">
                  Enter your name and select a team to continue
                </p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              href="/browse"
              className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
            >
              <Globe2 className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              <div>
                <p className="text-sm font-semibold text-white">Browse Rooms</p>
                <p className="text-[11px] text-slate-500">Find open games</p>
              </div>
            </Link>
            <Link
              href="/how-to-play"
              className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
            >
              <BookOpen className="h-5 w-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              <div>
                <p className="text-sm font-semibold text-white">How to Play</p>
                <p className="text-[11px] text-slate-500">Learn the rules</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
