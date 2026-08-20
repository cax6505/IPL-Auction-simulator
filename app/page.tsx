"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  Check,
  Shield,
  ArrowRight,
  Sliders,
  ChevronRight,
  Coins,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FranchiseCard } from "@/components/ui/FranchiseCard";
import { LiveBidTicker } from "@/components/ui/LiveBidTicker";
import { IPL_TEAMS, getTeam, staggerContainer, staggerItem } from "@/lib/design-tokens";

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Settings
  const [timerDuration, setTimerDuration] = useState(10);
  const [startingPurse, setStartingPurse] = useState(120);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const savedName = sessionStorage.getItem("playerName");
    const savedTeam = sessionStorage.getItem("playerTeam");
    if (savedName) setPlayerName(savedName);
    if (savedTeam) setSelectedTeam(savedTeam);

    const searchParams = new URLSearchParams(window.location.search);
    const urlCode = searchParams.get("code");
    if (urlCode) {
      setRoomCode(urlCode.toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (playerName) {
      sessionStorage.setItem("playerName", playerName);
      window.dispatchEvent(new Event("playerIdentityChanged"));
    }
  }, [playerName]);

  useEffect(() => {
    if (selectedTeam) {
      sessionStorage.setItem("playerTeam", selectedTeam);
      window.dispatchEvent(new Event("playerIdentityChanged"));
    }
  }, [selectedTeam]);

  const isReady = playerName.trim().length > 0 && selectedTeam !== null;
  const activeTeamObj = getTeam(selectedTeam);

  const handleCreateRoom = async () => {
    if (!isReady) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: playerName.trim(),
          playerTeam: selectedTeam,
          auctionMode: "mega_auction",
          timerDuration,
          startingPurse,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");

      if (selectedTeam) {
        sessionStorage.setItem(`auction_${data.roomCode}_team`, selectedTeam);
        sessionStorage.setItem("playerTeam", selectedTeam);
      }
      if (playerName.trim()) {
        sessionStorage.setItem("playerName", playerName.trim());
      }
      window.dispatchEvent(new Event("playerIdentityChanged"));

      router.push(`/rooms/${data.roomCode}`);
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
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: playerName.trim(),
          playerTeam: selectedTeam,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || "Failed to join room");
        setIsJoining(false);
        return;
      }
      // Pre-store identity with room-specific key so the lobby can restore it
      if (selectedTeam) {
        sessionStorage.setItem(`auction_${code}_team`, selectedTeam);
        sessionStorage.setItem("playerTeam", selectedTeam);
      }
      if (playerName.trim()) {
        sessionStorage.setItem("playerName", playerName.trim());
      }
      window.dispatchEvent(new Event("playerIdentityChanged"));
      router.push(`/rooms/${code}`);
    } catch (err: any) {
      setJoinError(err.message || "Network error");
      setIsJoining(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Subtle Ambient Background Light */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-[130px] opacity-20 transition-all duration-500"
        style={{
          background: activeTeamObj
            ? `radial-gradient(circle, ${activeTeamObj.color} 0%, transparent 70%)`
            : "radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)",
        }}
      />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full relative z-10">
        {/* Main Hero & Console Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
          {/* Left Side Copy */}
          <motion.div
            className="lg:col-span-6 flex flex-col justify-center space-y-6 pt-2"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-white/10 w-fit">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold text-zinc-300">
                IPL Auction Simulator
              </span>
            </motion.div>

            <motion.h1 variants={staggerItem} className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Build Your IPL Squad <br />
              <span
                className="transition-colors duration-300"
                style={{
                  color: activeTeamObj ? activeTeamObj.color : "#DC2626",
                }}
              >
                in Real Time
              </span>
            </motion.h1>

            <motion.p variants={staggerItem} className="text-base text-zinc-400 font-normal max-w-xl leading-relaxed">
              A real-time multiplayer auction simulator. Select your IPL franchise, manage your ₹120 Cr budget, and bid against rival managers.
            </motion.p>

            {/* Stats Row */}
            <motion.div variants={staggerItem} className="grid grid-cols-3 gap-4 pt-2">
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">656+</div>
                <div className="text-xs font-medium text-zinc-400 mt-0.5">Players</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <div className="text-xl sm:text-2xl font-bold font-mono text-red-400">₹120 Cr</div>
                <div className="text-xs font-medium text-zinc-400 mt-0.5">Purse</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">Real-Time</div>
                <div className="text-xs font-medium text-zinc-400 mt-0.5">Live Sync</div>
              </div>
            </motion.div>

            {/* Live Mock Bid Ticker */}
            <motion.div variants={staggerItem} className="pt-2">
              <LiveBidTicker />
            </motion.div>
          </motion.div>

          {/* Right Side Creation Console */}
          <motion.div
            className="lg:col-span-6 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center font-display font-bold text-white shadow-md transition-colors"
                  style={{
                    backgroundColor: activeTeamObj ? activeTeamObj.color : "#DC2626",
                    color: activeTeamObj ? activeTeamObj.textOnColor : "#ffffff",
                  }}
                >
                  {activeTeamObj ? activeTeamObj.short : <Trophy className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Create or Join a Room
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {activeTeamObj ? activeTeamObj.name : "Pick your franchise to get started"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                {isReady ? "Ready" : "Setup Required"}
              </span>
            </div>

            {/* Name Field */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-400" />
                1. Your Name
              </label>
              <Input
                type="text"
                placeholder="Enter your display name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-black/40 border-white/15 text-white placeholder:text-zinc-500 h-11 rounded-xl text-sm font-sans focus:border-amber-400"
              />
            </div>

            {/* Franchise Field */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-400" />
                  2. Select Franchise
                </label>
                {selectedTeam && (
                  <span className="text-xs font-semibold text-emerald-400">
                    Selected: {selectedTeam}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {IPL_TEAMS.map((team) => (
                  <FranchiseCard
                    key={team.id}
                    id={team.id}
                    name={team.name}
                    short={team.short}
                    color={team.color}
                    secondaryColor={team.secondaryColor}
                    textOnColor={team.textOnColor}
                    isSelected={selectedTeam === team.id}
                    onSelect={(id) => setSelectedTeam(id)}
                  />
                ))}
              </div>
            </div>

            {/* Settings Accordion */}
            <div className="space-y-3 mb-6 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs font-semibold text-zinc-400 hover:text-zinc-200"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  3. Room Settings (Optional)
                </span>
                <ChevronRight className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`} />
              </button>

              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"
                >
                  <div className="glass-panel p-3.5 rounded-xl border border-white/10">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-2">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      Timer: {timerDuration}s
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={5}
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(Number(e.target.value))}
                      className="w-full accent-amber-400 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="glass-panel p-3.5 rounded-xl border border-white/10">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-2">
                      <Coins className="h-3.5 w-3.5 text-emerald-400" />
                      Starting Purse: ₹{startingPurse} Cr
                    </label>
                    <input
                      type="range"
                      min={80}
                      max={150}
                      step={10}
                      value={startingPurse}
                      onChange={(e) => setStartingPurse(Number(e.target.value))}
                      className="w-full accent-emerald-400 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Form Actions */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <Button
                onClick={handleCreateRoom}
                disabled={!isReady || isCreating}
                className="w-full h-12 rounded-xl text-sm font-semibold tracking-wide bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  "Creating Room..."
                ) : (
                  <>
                    Create Auction Room <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="relative flex items-center my-3">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-xs font-medium text-zinc-500">
                  Or join with room code
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="6-character room code"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setJoinError(null);
                  }}
                  maxLength={6}
                  className="bg-black/40 border-white/15 text-white placeholder:text-zinc-500 h-11 rounded-xl text-center font-mono font-bold tracking-widest uppercase text-sm"
                />
                <Button
                  onClick={handleJoinRoom}
                  disabled={!isReady || !roomCode.trim() || isJoining}
                  variant="outline"
                  className="h-11 px-5 rounded-xl font-semibold text-xs border-white/20 hover:bg-white/10 text-white disabled:opacity-40"
                >
                  {isJoining ? "Joining..." : "Join"}
                </Button>
              </div>

              {joinError && (
                <p className="text-xs text-red-400 text-center font-medium">{joinError}</p>
              )}
            </div>
          </motion.div>
        </section>

        {/* Feature Highlights */}
        <section className="pt-12 border-t border-white/10">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="font-display text-2xl font-bold text-white">
              Key Features
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Built for smooth multiplayer auctions with official squad rules and purse limits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white mb-1.5">Real-Time Bidding</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Bid against rival managers in real time with instant synchronization across all connected screens.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 text-xs text-amber-400 flex items-center gap-1.5 font-medium">
                <Check className="h-3.5 w-3.5" /> Instant Sync
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white mb-1.5">Official Squad Rules</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Enforces 18–25 player squads, up to 8 overseas slots, and remaining purse management.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 text-xs text-red-400 flex items-center gap-1.5 font-medium">
                <Check className="h-3.5 w-3.5" /> Automatic Roster Checks
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                  <Trophy className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white mb-1.5">Post-Auction Summary</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Review final team rosters, highest bids, and share summary cards after the auction ends.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 text-xs text-cyan-400 flex items-center gap-1.5 font-medium">
                <Check className="h-3.5 w-3.5" /> Shareable Results
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
