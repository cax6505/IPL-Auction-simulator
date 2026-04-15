"use client";

import { useState, useMemo } from "react";
import { useAuction } from "./AuctionContext";
import { formatPriceCr } from "@/lib/auction-engine";
import { X, Clock, CheckCircle2, XCircle, Crown, ListFilter } from "lucide-react";

type Tab = "upcoming" | "sold" | "unsold" | "leaderboard";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  BAT: { bg: "bg-green-500/20", text: "text-green-400" },
  BOWL: { bg: "bg-red-500/20", text: "text-red-400" },
  AR: { bg: "bg-purple-500/20", text: "text-purple-400" },
  WK: { bg: "bg-orange-500/20", text: "text-orange-400" },
};

export function AuctionStatsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl bg-zinc-800/90 backdrop-blur-sm border border-white/[0.08] shadow-2xl shadow-black/50 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700/90 hover:border-white/[0.15] hover:scale-105 transition-all duration-300 group"
        title="Auction Stats"
      >
        <ListFilter className="h-5 w-5 group-hover:text-amber-400 transition-colors" />
      </button>

      {/* Modal */}
      {isOpen && <AuctionStatsModal onClose={() => setIsOpen(false)} />}
    </>
  );
}

function AuctionStatsModal({ onClose }: { onClose: () => void }) {
  const { allPlayers, currentPlayer, room } = useAuction();
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  // Categorize players
  const { upcoming, sold, unsold } = useMemo(() => {
    const currentIdx = allPlayers.findIndex((p) => p.id === currentPlayer?.id);

    // Players after the current one are "upcoming"
    const upcomingPlayers = currentIdx >= 0
      ? allPlayers.slice(currentIdx + 1)
      : allPlayers;

    // For sold/unsold, we'd need room_sold_players data, but we can approximate:
    // Players before current index that had bids = sold, those without = unsold
    // Since we don't track this in allPlayers, we'll show upcoming for now
    // and sold/unsold as empty until the auction progresses
    return {
      upcoming: upcomingPlayers,
      sold: [] as typeof allPlayers,
      unsold: [] as typeof allPlayers,
    };
  }, [allPlayers, currentPlayer]);

  // Group upcoming players by auction_set
  const groupedUpcoming = useMemo(() => {
    const groups: Record<string, typeof allPlayers> = {};
    upcoming.forEach((p) => {
      const set = p.auction_set || "General Pool";
      if (!groups[set]) groups[set] = [];
      groups[set].push(p);
    });
    return groups;
  }, [upcoming]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "upcoming", label: "Upcoming", icon: <Clock className="h-3.5 w-3.5" />, count: upcoming.length },
    { id: "sold", label: "Sold", icon: <CheckCircle2 className="h-3.5 w-3.5" />, count: sold.length },
    { id: "unsold", label: "Unsold", icon: <XCircle className="h-3.5 w-3.5" />, count: unsold.length },
    { id: "leaderboard", label: "Leaderboard", icon: <Crown className="h-3.5 w-3.5" />, count: 0 },
  ];

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#0e0e11] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <h2 className="text-lg font-black text-white tracking-tight">Auction Stats</h2>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-white/[0.04] shrink-0 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white/[0.08] text-white border border-white/[0.1]"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isActive ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.04] text-zinc-600"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {activeTab === "upcoming" && (
            <UpcomingTab groups={groupedUpcoming} totalCount={upcoming.length} />
          )}
          {activeTab === "sold" && (
            <EmptyState icon={<CheckCircle2 className="h-8 w-8 text-zinc-600" />} message="Sold players will appear here as the auction progresses." />
          )}
          {activeTab === "unsold" && (
            <EmptyState icon={<XCircle className="h-8 w-8 text-zinc-600" />} message="Unsold players will appear here as the auction progresses." />
          )}
          {activeTab === "leaderboard" && (
            <EmptyState icon={<Crown className="h-8 w-8 text-zinc-600" />} message="Leaderboard will populate after players are sold." />
          )}
        </div>
      </div>
    </div>
  );
}

function UpcomingTab({
  groups,
  totalCount,
}: {
  groups: Record<string, Partial<RoomSoldPlayer & { name: string; role: string }>[]>;
  totalCount: number;
}) {
  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 text-xs text-amber-400/80 font-medium">
        Upcoming player will be chosen randomly from each set during the auction.
      </div>

      {Object.entries(groups).map(([setName, players]) => (
        <div key={setName}>
          {/* Set Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg tracking-wide">
              {setName}
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">
              {players.length} players
            </span>
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {players.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayerRow({ player }: { player: Partial<RoomSoldPlayer & { name: string; role: string }> }) {
  const roleStyle = ROLE_COLORS[player.role] || { bg: "bg-zinc-500/20", text: "text-zinc-400" };
  const roleLabel = player.role === "AR" ? "All-Rounder" : player.role === "WK" ? "Wicket-Keeper" : player.role === "BAT" ? "Batsman" : player.role === "BOWL" ? "Bowler" : player.role;

  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-bold text-white truncate">{player.name}</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${roleStyle.bg} ${roleStyle.text}`}>
            {roleLabel}
          </span>
          {player.is_overseas && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 flex items-center gap-0.5">
              🌍 OS
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0 pl-3">
        <span className="text-sm font-black text-amber-400 font-mono">
          {formatPriceCr(Number(player.base_price_cr) || 0.2)}
        </span>
        <span className="text-[10px] text-zinc-600 font-medium">Base</span>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-zinc-500 text-sm font-medium max-w-xs">{message}</p>
    </div>
  );
}
