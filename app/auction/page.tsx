"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, History, CalendarDays, Trophy, Sparkles, ArrowLeft, ChevronRight } from "lucide-react";

const TEAM_MAP = [
  { id: "MI", color: "bg-blue-600", text: "text-white" },
  { id: "CSK", color: "bg-yellow-400", text: "text-slate-900" },
  { id: "RCB", color: "bg-red-600", text: "text-white" },
  { id: "KKR", color: "bg-[#3a225d]", text: "text-white" },
  { id: "DC", color: "bg-[#0077B6]", text: "text-white" },
  { id: "PBKS", color: "bg-[#ED1B24]", text: "text-white" },
  { id: "RR", color: "bg-[#EA1A85]", text: "text-white" },
  { id: "SRH", color: "bg-[#F26522]", text: "text-white" },
  { id: "GT", color: "bg-[#1B2133]", text: "text-white" },
  { id: "LSG", color: "bg-[#A72056]", text: "text-white" },
];

type AuctionMode = "mock_2026" | "legends_upgraded" | "mega_auction";

// Real IPL 2025 retention state per team — used to seed mock_2026 rooms correctly
// Source: ipl_rules_and_config.json → teams_2026
export const MOCK_2026_TEAM_STATE: Record<string, {
  auction_purse_cr: number;
  squad_count: number;      // already retained
  overseas_count: number;   // already retained overseas
}> = {
  CSK:  { auction_purse_cr: 67.10, squad_count: 16, overseas_count: 3 },
  DC:   { auction_purse_cr: 24.05, squad_count: 11, overseas_count: 4 },
  GT:   { auction_purse_cr: 21.70, squad_count: 14, overseas_count: 5 },
  KKR:  { auction_purse_cr: 67.85, squad_count: 12, overseas_count: 8 },
  LSG:  { auction_purse_cr: 27.55, squad_count: 13, overseas_count: 5 },
  MI:   { auction_purse_cr: 14.35, squad_count: 14, overseas_count: 7 },
  PBKS: { auction_purse_cr: 3.35,  squad_count: 17, overseas_count: 7 },
  RR:   { auction_purse_cr: 12.50, squad_count: 17, overseas_count: 6 },
  RCB:  { auction_purse_cr: 15.00, squad_count: 16, overseas_count: 5 },
  SRH:  { auction_purse_cr: 15.00, squad_count: 16, overseas_count: 5 },
};

const AUCTION_MODES: {
  id: AuctionMode;
  title: string;
  badge?: { text: string; icon: string };
  description: string;
  stats: string;
  icon: "calendar" | "trophy" | "sparkles";
  accent: string;
  gradient: string;
  purse: number;        // display only (varies per team in mock_2026)
  playerCount: string;
  rules: string[];
}[] = [
  {
    id: "mock_2026",
    title: "IPL 2026 Mock Auction",
    badge: { text: "Official List", icon: "🔥" },
    description: "Simulate the real 2026 IPL Mega Auction. Teams start with their real retained squads and reduced purses, bidding only for the remaining un-retained pool.",
    stats: "~350 players • Real retentions • Per-team purse",
    icon: "calendar",
    accent: "border-amber-500/50 hover:border-amber-400",
    gradient: "from-amber-900/20 to-amber-800/5",
    purse: 67, // average, varies per team
    playerCount: "~350",
    rules: [
      "Each team starts with real retained players & reduced purse",
      "Only un-retained players enter the auction pool",
      "Max squad: 25 players | Max overseas: 8",
      "KKR (full squad) cannot bid",
    ],
  },
  {
    id: "legends_upgraded",
    title: "Legends Upgraded",
    badge: { text: "NEW", icon: "⭐" },
    description: "Bid on the greatest overseas legends in IPL history — Ponting, Symonds, de Villiers and more — in a marquee-style all-overseas format.",
    stats: "248 overseas legends • ₹125 Cr purse • Fresh squads",
    icon: "trophy",
    accent: "border-amber-600/50 hover:border-amber-500",
    gradient: "from-amber-800/20 to-yellow-900/5",
    purse: 125,
    playerCount: "248",
    rules: [
      "All teams start fresh — no retentions",
      "Only overseas players in the pool",
      "₹125 Cr starting purse per team",
      "Max squad: 25 players | Max overseas: 8",
    ],
  },
  {
    id: "mega_auction",
    title: "Mega Auction",
    badge: undefined,
    description: "The ultimate free-for-all. Every IPL player from 2008–2025 is available. Fresh squads, maximum chaos.",
    stats: "1100+ players • ₹120 Cr purse • No retentions",
    icon: "sparkles",
    accent: "border-slate-600/50 hover:border-slate-400",
    gradient: "from-slate-800/20 to-slate-900/5",
    purse: 120,
    playerCount: "1100+",
    rules: [
      "All teams start fresh — no retentions",
      "Full historical player database available",
      "₹120 Cr starting purse per team",
      "Max squad: 25 players | Max overseas: 8",
    ],
  },
];

export default function CreateAuctionDashboard() {
  const router = useRouter();
  const [view, setView] = useState<"select_mode" | "configure" | "recent">("select_mode");
  const [selectedMode, setSelectedMode] = useState<AuctionMode | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [recentRooms, setRecentRooms] = useState<{ id: string; date: string; mode?: string }[]>([]);

  useEffect(() => {
    const hist = localStorage.getItem("ipl_recent_rooms");
    if (hist) setRecentRooms(JSON.parse(hist));
  }, []);

  const handleSelectMode = (mode: AuctionMode) => {
    setSelectedMode(mode);
    setView("configure");
  };

  const handleCreateRoom = async () => {
    if (!selectedTeam || !selectedMode) return;
    setIsCreating(true);
    try {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert([{ status: "waiting", auction_mode: selectedMode }])
        .select()
        .single();

      if (roomError) throw roomError;

      // ── Determine correct starting state per mode ─────────────────
      let purse = 120;
      let squadCount = 0;
      let overseasCount = 0;

      if (selectedMode === "mock_2026") {
        // Teams enter with real retention state — purse and squad already consumed
        const retState = MOCK_2026_TEAM_STATE[selectedTeam];
        if (retState) {
          purse = retState.auction_purse_cr;
          squadCount = retState.squad_count;
          overseasCount = retState.overseas_count;
        }
      } else if (selectedMode === "legends_upgraded") {
        purse = 125;
        squadCount = 0;
        overseasCount = 0;
      } else {
        // mega_auction — fresh start
        purse = 120;
        squadCount = 0;
        overseasCount = 0;
      }

      await supabase.from("room_franchises").insert([{
        room_id: room.id,
        team_id: selectedTeam,
        user_name: userName || "Host",
        is_host: true,
        purse_remaining_cr: purse,
        squad_count: squadCount,
        overseas_count: overseasCount,
      }]);

      sessionStorage.setItem(`auction_${room.id}_team`, selectedTeam);
      router.push(`/auction/${room.id}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Please check your database connection.");
      setIsCreating(false);
    }
  };

  const selectedModeConfig = AUCTION_MODES.find((m) => m.id === selectedMode);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center py-10 px-4 font-sans">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {view !== "select_mode" ? (
            <button
              onClick={() => setView("select_mode")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setView("select_mode")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view !== "recent" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"}`}
            >
              New Game
            </button>
            <button
              onClick={() => setView("recent")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${view === "recent" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"}`}
            >
              Recent ({recentRooms.length})
            </button>
          </div>
        </div>

        {/* MODE SELECTION */}
        {view === "select_mode" && (
          <div className="flex flex-col gap-3">
            <h2 className="text-slate-300 font-bold text-sm uppercase tracking-widest mb-2">Auction Mode</h2>
            {AUCTION_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleSelectMode(mode.id)}
                className={`w-full text-left flex items-center gap-5 p-5 rounded-2xl border bg-gradient-to-br ${mode.gradient} ${mode.accent} transition-all duration-200 group hover:scale-[1.01]`}
              >
                {/* Icon */}
                <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 ${
                  mode.id === "mock_2026" ? "bg-amber-900/60 border border-amber-700/50" :
                  mode.id === "legends_upgraded" ? "bg-amber-800/60 border border-amber-600/50" :
                  "bg-slate-800/80 border border-slate-600/50"
                }`}>
                  {mode.icon === "calendar" && <CalendarDays className="h-7 w-7 text-amber-400" />}
                  {mode.icon === "trophy" && <Trophy className="h-7 w-7 text-amber-400" />}
                  {mode.icon === "sparkles" && <Sparkles className="h-7 w-7 text-slate-300" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-base">{mode.title}</span>
                    {mode.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mode.badge.text === "NEW" ? "bg-amber-500/30 text-amber-400 border border-amber-500/40" : "bg-orange-900/60 text-orange-300 border border-orange-600/40"
                      }`}>
                        {mode.badge.icon} {mode.badge.text}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{mode.stats}</p>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
              </button>
            ))}

            {/* Join Section */}
            <div className="mt-4 pt-6 border-t border-[#222]">
              <p className="text-slate-500 text-xs tracking-widest uppercase font-medium mb-3">Or Join Existing Room</p>
              <div className="flex gap-2">
                <Input
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Paste Room ID..."
                  className="bg-[#161616] border-[#333] h-12 text-sm text-white px-4 rounded-xl flex-1"
                />
                <Button
                  onClick={() => router.push(`/auction/${joinRoomId.trim()}`)}
                  disabled={!joinRoomId.trim()}
                  className="h-12 px-6 bg-[#222] hover:bg-[#2a2a2a] text-white font-bold rounded-xl border border-[#333]"
                >
                  Join
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURE VIEW */}
        {view === "configure" && selectedModeConfig && (
          <div className="flex flex-col gap-6">
            {/* Mode Summary Banner */}
            <div className={`flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-br ${selectedModeConfig.gradient} ${selectedModeConfig.accent}`}>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                selectedMode === "mock_2026" ? "bg-amber-900/60 border border-amber-700/50" :
                selectedMode === "legends_upgraded" ? "bg-amber-800/60 border border-amber-600/50" :
                "bg-slate-800/80 border border-slate-600/50"
              }`}>
                {selectedModeConfig.icon === "calendar" && <CalendarDays className="h-6 w-6 text-amber-400" />}
                {selectedModeConfig.icon === "trophy" && <Trophy className="h-6 w-6 text-amber-400" />}
                {selectedModeConfig.icon === "sparkles" && <Sparkles className="h-6 w-6 text-slate-300" />}
              </div>
              <div>
                <p className="text-white font-bold">{selectedModeConfig.title}</p>
                <p className="text-slate-400 text-xs">{selectedModeConfig.stats}</p>
              </div>
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-400 font-medium text-sm">Your Name</label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-[#161616] border-[#333] h-13 text-white px-4 rounded-xl focus-visible:ring-amber-500/50 focus-visible:border-amber-500"
                placeholder="Enter your franchise name..."
              />
            </div>

            {/* Team Selector */}
            <div className="flex flex-col gap-3">
              <label className="text-slate-400 font-medium text-sm">Choose Your Team</label>
              <div className="grid grid-cols-5 gap-3">
                {TEAM_MAP.map((team) => {
                  // In mock_2026, warn about KKR having full squad
                  const retState = selectedMode === 'mock_2026' ? MOCK_2026_TEAM_STATE[team.id] : null;
                  const isFullSquad = retState && retState.squad_count >= 25;
                  return (
                    <button
                      key={team.id}
                      onClick={() => !isFullSquad && setSelectedTeam(team.id)}
                      disabled={!!isFullSquad}
                      title={isFullSquad ? `${team.id} has a full squad (${retState?.squad_count}/25)` : undefined}
                      className={`h-16 rounded-xl font-black text-sm flex flex-col items-center justify-center gap-0.5 transition-all ${team.color} ${team.text} ${
                        isFullSquad
                          ? 'opacity-30 cursor-not-allowed grayscale'
                          : selectedTeam === team.id
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-105'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span>{team.id}</span>
                      {selectedMode === 'mock_2026' && retState && (
                        <span className="text-[8px] opacity-70 font-normal">₹{retState.auction_purse_cr}Cr</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedMode === 'mock_2026' && (
                <p className="text-slate-500 text-xs">Teams show their available auction purse. KKR has a full squad and cannot participate.</p>
              )}
            </div>

            {/* Mode Stats — dynamic for mock_2026 selected team */}
            {selectedMode === 'mock_2026' && selectedTeam && MOCK_2026_TEAM_STATE[selectedTeam] ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Auction Purse", value: `₹${MOCK_2026_TEAM_STATE[selectedTeam].auction_purse_cr} Cr` },
                  { label: "Retained", value: `${MOCK_2026_TEAM_STATE[selectedTeam].squad_count} players` },
                  { label: "OS Used", value: `${MOCK_2026_TEAM_STATE[selectedTeam].overseas_count}/8` },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#141414] border border-amber-500/20 rounded-xl p-3 text-center">
                    <p className="text-amber-500 font-black text-base">{stat.value}</p>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Players", value: selectedModeConfig.playerCount },
                  { label: "Purse", value: `₹${selectedModeConfig.purse} Cr` },
                  { label: "Max Squad", value: "25" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#141414] border border-[#222] rounded-xl p-3 text-center">
                    <p className="text-amber-500 font-black text-lg">{stat.value}</p>
                    <p className="text-slate-500 text-xs uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* IPL Rules summary */}
            <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">📋 Mode Rules</p>
              <ul className="space-y-1.5">
                {selectedModeConfig.rules.map((rule, i) => (
                  <li key={i} className="text-slate-400 text-xs flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span> {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating || !selectedTeam}
              className="w-full h-14 text-lg bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] disabled:opacity-40"
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <><Zap className="mr-2 h-5 w-5" /> Create Room</>
              )}
            </Button>
          </div>
        )}

        {/* RECENT VIEW */}
        {view === "recent" && (
          <div className="flex flex-col gap-3">
            {recentRooms.length === 0 ? (
              <div className="flex items-center justify-center border-2 border-dashed border-[#222] rounded-2xl text-slate-500 text-sm py-16">
                No recent rooms found.
              </div>
            ) : (
              recentRooms.map((r, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push(`/auction/${r.id}`)}
                  className="flex justify-between items-center bg-[#141414] border border-[#222] p-4 rounded-xl hover:border-amber-500/40 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col">
                    <span className="text-amber-500 font-mono font-bold">{r.id.substring(0, 8).toUpperCase()}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Joined: {r.date}</span>
                  </div>
                  <Button variant="ghost" className="text-slate-400 group-hover:text-white group-hover:bg-amber-500/20 h-8 px-4 rounded-lg transition-colors text-sm">
                    Rejoin →
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
