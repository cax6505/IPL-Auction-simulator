"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  Check,
  Sparkles,
  Zap,
  LogIn,
  BookOpen,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { FranchiseCard } from "@/components/ui/FranchiseCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { IPL_TEAMS, fadeUp, staggerContainer, staggerItem, springTransition, slideVariants } from "@/lib/design-tokens";

const STEP_LABELS = ["Name", "Franchise", "Config", "Play"];

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  // Room customization
  const [timerDuration, setTimerDuration] = useState(10);
  const [startingPurse, setStartingPurse] = useState(120);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Restore identity from sessionStorage & check URL parameters
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

  // Persist identity to sessionStorage
  useEffect(() => {
    if (playerName) sessionStorage.setItem("playerName", playerName);
  }, [playerName]);

  useEffect(() => {
    if (selectedTeam) sessionStorage.setItem("playerTeam", selectedTeam);
  }, [selectedTeam]);

  const isReady = playerName.trim().length > 0 && selectedTeam !== null;

  // Derive current step for indicator
  const currentStep = !playerName.trim() ? 0 : !selectedTeam ? 1 : !showAdvanced && isReady ? 3 : 2;

  const handleCreateRoom = async () => {
    if (!isReady) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName.trim(), playerTeam: selectedTeam, auctionMode: "mega_auction", timerDuration, startingPurse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");
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
      router.push(`/rooms/${code}`);
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
        <div className="absolute top-[-20%] left-[-10%] h-[50rem] w-[50rem] rounded-full bg-red-600/[0.04] blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-amber-500/[0.03] blur-[120px] animate-float" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[30%] right-[20%] h-[25rem] w-[25rem] rounded-full bg-blue-600/[0.02] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-[13px] text-red-400 mb-6 font-semibold shadow-inner shadow-red-500/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Sparkles className="h-4 w-4" />
            DraftForge — Auction Simulator 2026
          </motion.div>
          <motion.h1
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-6 font-display uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Build Your{" "}
            <span className="gradient-text-accent text-glow-accent">
              Dream XI
            </span>
          </motion.h1>
          <motion.p
            className="text-zinc-400 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            Create a room, invite friends, and compete in real-time cricket auctions.
            Scout players, manage your purse, and outbid opponents.
          </motion.p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <StepIndicator steps={STEP_LABELS} currentStep={currentStep} />
        </motion.div>

        {/* Main Interface Card */}
        <motion.div
          className="max-w-xl mx-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="glass-card rounded-[20px] overflow-hidden bg-noise">

            {/* Step 1: Name */}
            <div className="relative z-10 p-6 sm:p-8 border-b border-white/[0.04]">
              <label className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-[0.15em] mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-red-600/20 to-amber-500/20 text-red-400 text-[11px] font-black border border-red-500/30">1</span>
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
            <div className="relative z-10 p-6 sm:p-8 border-b border-white/[0.04] bg-white/[0.01]">
              <label className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-[0.15em] mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-red-600/20 to-amber-500/20 text-red-400 text-[11px] font-black border border-red-500/30">2</span>
                Choose Your Franchise
              </label>
              <motion.div
                className="grid grid-cols-3 sm:grid-cols-5 gap-3"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {IPL_TEAMS.map((team) => (
                  <motion.div key={team.id} variants={staggerItem}>
                    <FranchiseCard
                      id={team.id}
                      name={team.name}
                      short={team.short}
                      color={team.color}
                      textOnColor={team.textOnColor}
                      isSelected={selectedTeam === team.id}
                      onSelect={setSelectedTeam}
                    />
                  </motion.div>
                ))}
              </motion.div>
              <div className="h-5 mt-3 text-center">
                <AnimatePresence mode="wait">
                  {selectedTeamData && (
                    <motion.p
                      key={selectedTeamData.id}
                      className="text-xs text-zinc-400"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                    >
                      Drafting for <span className="text-white font-bold">{selectedTeamData.name}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Step 3: Room Settings */}
            <div className="relative z-10 p-6 sm:p-8 border-b border-white/[0.04] bg-white/[0.01]">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full group"
              >
                <label className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-[0.15em] cursor-pointer">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-red-600/20 to-amber-500/20 text-red-400 text-[11px] font-black border border-red-500/30">3</span>
                  Room Configuration
                </label>
                <motion.span
                  className="text-zinc-500 text-xs"
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  ▼
                </motion.span>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-6 pt-5">
                      {/* Timer Duration */}
                      <SegmentedControl
                        label="Bid Timer"
                        options={[
                          { value: 5, label: "5s" },
                          { value: 10, label: "10s" },
                          { value: 15, label: "15s" },
                          { value: 20, label: "20s" },
                          { value: 30, label: "30s" },
                        ]}
                        selected={timerDuration}
                        onChange={setTimerDuration}
                        displayValue={`${timerDuration}s`}
                      />

                      {/* Starting Purse */}
                      <SegmentedControl
                        label="Starting Purse"
                        options={[
                          { value: 80, label: "₹80 Cr" },
                          { value: 100, label: "₹100 Cr" },
                          { value: 120, label: "₹120 Cr" },
                          { value: 125, label: "₹125 Cr" },
                        ]}
                        selected={startingPurse}
                        onChange={setStartingPurse}
                        displayValue={`₹${startingPurse} Cr`}
                      />

                      {/* Mega Auction badge */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-gradient-subtle border border-red-500/15">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-red-600 to-amber-500 flex items-center justify-center text-white">
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Mega Auction Mode</p>
                          <p className="text-[10px] text-zinc-500 font-medium">Full squad reset — all players in the pool</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Summary pills when collapsed */}
              <AnimatePresence>
                {!showAdvanced && (
                  <motion.div
                    className="flex flex-wrap gap-2 mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-[10px] bg-white/[0.04] px-2.5 py-1 rounded-md font-mono text-zinc-400 border border-white/[0.06]">
                      ⏱ {timerDuration}s
                    </span>
                    <span className="text-[10px] bg-white/[0.04] px-2.5 py-1 rounded-md font-mono text-zinc-400 border border-white/[0.06]">
                      💰 ₹{startingPurse} Cr
                    </span>
                    <span className="text-[10px] bg-accent-gradient-subtle px-2.5 py-1 rounded-md font-mono text-red-400 border border-red-500/15">
                      🏏 Mega Auction
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 4: Actions */}
            <div className="relative z-10 p-6 sm:p-8 space-y-6">
              <label className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-red-600/20 to-amber-500/20 text-red-400 text-[11px] font-black border border-red-500/30">4</span>
                Enter the War Room
              </label>

              {/* Create Room */}
              <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} transition={springTransition}>
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
              </motion.div>

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
                  className="flex-1 h-14 text-center text-lg font-mono tracking-[0.3em] uppercase"
                />
                <motion.div whileTap={{ scale: 0.97 }} transition={springTransition}>
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
                </motion.div>
              </div>

              {/* Messages */}
              <div className="min-h-[24px]">
                <AnimatePresence mode="wait">
                  {joinError && (
                    <motion.p
                      key="error"
                      className="text-red-400 text-xs font-semibold flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[8px] px-3 py-2"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      <span className="h-4 w-4 flex items-center justify-center rounded-full bg-red-500/20 text-red-400">!</span> {joinError}
                    </motion.p>
                  )}
                  {!isReady && !joinError && (
                    <motion.p
                      key="hint"
                      className="text-xs text-zinc-500 text-center font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Complete steps 1 and 2 to unlock room actions
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <motion.div
            className="mt-6 grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Link
              href="/rooms"
              className="flex items-center gap-4 p-4 glass-card hover:glass-card-hover rounded-[14px] transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                <Globe2 className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">Browse Rooms</span>
                <span className="text-[11px] text-zinc-500 font-medium">Find public games</span>
              </div>
            </Link>
            <Link
              href="/guide"
              className="flex items-center gap-4 p-4 glass-card hover:glass-card-hover rounded-[14px] transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                <BookOpen className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">How to Play</span>
                <span className="text-[11px] text-zinc-500 font-medium">Rules & Strategy</span>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Zap}
            title="Real-Time Bidding"
            description="Multiplayer synchronization powered by Supabase Realtime. Feel the adrenaline rush of live, sub-second bidding wars."
            accentColor="blue"
            index={0}
          />
          <FeatureCard
            icon={Trophy}
            title="Official IPL Tiers"
            description="Realistic auction dynamics with standard bid increments (20L to 10Cr+), budget constraints, and Right to Match (RTM) cards."
            accentColor="amber"
            index={1}
          />
          <FeatureCard
            icon={Users}
            title="Squad Composition"
            description="Build a balanced roster of 18-25 players including batters, bowlers, all-rounders, keepers, and max 8 overseas limit."
            accentColor="purple"
            index={2}
          />
        </div>

        {/* Footer (inline, removed from page — now in layout) */}
      </div>
    </div>
  );
}
