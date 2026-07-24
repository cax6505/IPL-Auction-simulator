"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PlayerCard } from "./PlayerCard";
import { Input } from "@/components/ui/input";
import { Search, UserX, Star, ChevronLeft, ChevronRight } from "lucide-react";
import type { PlayerRecord } from "@/lib/types/player";

const PAGE_SIZE = 24;

export function ClientDashboard({ initialPlayers }: { initialPlayers: PlayerRecord[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRole, setActiveRole] = useState("ALL");
  const [shortlistFilter, setShortlistFilter] = useState(false);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const loadShortlist = useCallback(() => {
    const stored = JSON.parse(localStorage.getItem("ipl_shortlist") || "[]");
    setShortlist(stored);
  }, []);

  useEffect(() => {
    loadShortlist();
    const handler = () => loadShortlist();
    window.addEventListener("shortlist-change", handler);
    return () => window.removeEventListener("shortlist-change", handler);
  }, [loadShortlist]);

  const roleCounts = useMemo(() => {
    const counts = { ALL: initialPlayers.length, BAT: 0, BOWL: 0, AR: 0, WK: 0, OVERSEAS: 0 };
    initialPlayers.forEach((p) => {
      const r = p.role.toUpperCase();
      if (r === "BAT") counts.BAT++;
      else if (r === "BOWL") counts.BOWL++;
      else if (r === "AR") counts.AR++;
      else if (r === "WK") counts.WK++;
      if (p.is_overseas) counts.OVERSEAS++;
    });
    return counts;
  }, [initialPlayers]);

  const filteredPlayers = useMemo(() => {
    return initialPlayers.filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesRole = true;
      if (activeRole === "OVERSEAS") {
        matchesRole = player.is_overseas;
      } else if (activeRole !== "ALL") {
        matchesRole = player.role.toUpperCase() === activeRole;
      }

      const matchesShortlist = !shortlistFilter || shortlist.includes(player.id);
      return matchesSearch && matchesRole && matchesShortlist;
    });
  }, [initialPlayers, searchQuery, activeRole, shortlistFilter, shortlist]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeRole, shortlistFilter]);

  const totalPages = Math.ceil(filteredPlayers.length / PAGE_SIZE) || 1;
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPlayers.slice(start, start + PAGE_SIZE);
  }, [filteredPlayers, currentPage]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search players..."
            className="pl-10 h-10 bg-black/40 border-white/15 text-white text-sm rounded-xl focus:border-amber-400 font-sans"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {[
            { id: "ALL", label: "All", count: roleCounts.ALL },
            { id: "BAT", label: "Batters", count: roleCounts.BAT },
            { id: "BOWL", label: "Bowlers", count: roleCounts.BOWL },
            { id: "AR", label: "All-Rounders", count: roleCounts.AR },
            { id: "WK", label: "Keepers", count: roleCounts.WK },
            { id: "OVERSEAS", label: "Overseas", count: roleCounts.OVERSEAS },
          ].map((tab) => {
            const isActive = activeRole === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveRole(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 border ${
                  isActive
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${isActive ? "bg-amber-500/30 text-amber-200" : "bg-black/30 text-zinc-500"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}

          {/* Shortlist Toggle Button */}
          <button
            onClick={() => setShortlistFilter(!shortlistFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 border ${
              shortlistFilter
                ? "bg-red-500/20 text-red-400 border-red-500/40"
                : "bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${shortlistFilter ? "fill-red-400 text-red-400" : ""}`} />
            <span>Shortlist ({shortlist.length})</span>
          </button>
        </div>
      </div>

      {/* Results Meta & Pagination Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-zinc-400 font-medium">
          Showing <span className="text-white font-semibold">{paginatedPlayers.length}</span> of <span className="text-white font-semibold">{filteredPlayers.length}</span> players
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 rounded-lg glass-panel flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-zinc-300 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 rounded-lg glass-panel flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Player Grid */}
      {paginatedPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-3xl text-center border-dashed border-white/10">
          <UserX className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-display font-bold text-base text-white">No players found</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Try adjusting your search or filter.
          </p>
        </div>
      )}
    </div>
  );
}
