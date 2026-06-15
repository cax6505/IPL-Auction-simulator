"use client";

import { useState, useEffect, useCallback } from "react";
import { PlayerCard } from "./PlayerCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserX, Star, ChevronDown } from "lucide-react";
import type { PlayerRecord } from "@/lib/types/player";

const PAGE_SIZE = 50;

export function ClientDashboard({ initialPlayers }: { initialPlayers: PlayerRecord[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [shortlistFilter, setShortlistFilter] = useState(false);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, activeTab, shortlistFilter]);

  // Load shortlist from localStorage & listen for changes
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

  const filteredPlayers = initialPlayers.filter((player) => {
    // Search filter
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab filter
    let matchesTab = true;
    if (activeTab !== "ALL") {
      matchesTab = player.role.toUpperCase() === activeTab;
    }

    // Shortlist filter
    const matchesShortlist = !shortlistFilter || shortlist.includes(player.id);

    return matchesSearch && matchesTab && matchesShortlist;
  });

  const visiblePlayers = filteredPlayers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlayers.length;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Controls Section */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between glass-card p-4 rounded-2xl animate-slide-down">
        
        <div className="relative w-full lg:w-[400px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Search players by name..." 
            className="pl-10 h-12 bg-black/60 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Tabs defaultValue="ALL" onValueChange={setActiveTab} className="flex-1 lg:flex-auto overflow-x-auto no-scrollbar">
            <TabsList className="h-12 w-full lg:w-auto p-1 bg-black/60 rounded-[10px]">
               <TabsTrigger value="ALL" className="h-full rounded-md data-[state=active]:bg-zinc-800 text-xs px-4">ALL PLAYERS</TabsTrigger>
               <TabsTrigger value="BAT" className="h-full rounded-md data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-xs px-4">BAT</TabsTrigger>
               <TabsTrigger value="BOWL" className="h-full rounded-md data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-xs px-4">BOWL</TabsTrigger>
               <TabsTrigger value="AR" className="h-full rounded-md data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-xs px-4">ALL-ROUNDER</TabsTrigger>
               <TabsTrigger value="WK" className="h-full rounded-md data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-xs px-4">WICKET KEEPER</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Shortlist Toggle */}
          <button
            onClick={() => setShortlistFilter(!shortlistFilter)}
            className={`h-12 px-4 rounded-[10px] border flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-spring shrink-0 ${
              shortlistFilter
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "bg-black/60 border-white/[0.06] text-zinc-500 hover:text-amber-400 hover:border-amber-500/20"
            }`}
          >
            <Star className={`h-4 w-4 ${shortlistFilter ? 'fill-amber-400' : ''}`} />
            <span className="hidden sm:inline">Shortlist</span>
            {shortlist.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${shortlistFilter ? 'bg-amber-500/20 text-amber-400' : 'bg-white/[0.05] text-zinc-400'}`}>
                {shortlist.length}
              </span>
            )}
          </button>
        </div>
        
      </div>

      {/* Results Meta */}
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-3">
        Showing <span className="text-zinc-200">{visiblePlayers.length}</span> of <span className="text-zinc-200">{filteredPlayers.length}</span> players
        {shortlistFilter && (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px]">
            <Star className="h-3 w-3 fill-amber-400" /> Shortlisted only
          </span>
        )}
      </div>

      {/* Players Grid */}
      {filteredPlayers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visiblePlayers.map((player, index) => (
              <div key={player.id} className="animate-scale-in" style={{ animationDelay: `${Math.min(index * 0.02, 0.3)}s` }}>
                 <PlayerCard player={player} />
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex flex-col items-center gap-3 py-8">
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="group flex items-center gap-2 px-8 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-amber-500/30 text-sm font-bold text-zinc-400 hover:text-amber-400 transition-all duration-300 ease-spring"
              >
                <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                Show More ({filteredPlayers.length - visibleCount} remaining)
              </button>
              <div className="w-48 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500/40 rounded-full transition-all duration-500"
                  style={{ width: `${(visibleCount / filteredPlayers.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center glass-card rounded-2xl border-dashed">
          <div className="h-16 w-16 bg-white/[0.03] rounded-full flex items-center justify-center mb-4">
             {shortlistFilter ? <Star className="h-8 w-8 text-zinc-600" /> : <UserX className="h-8 w-8 text-zinc-600" />}
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {shortlistFilter ? "No shortlisted players" : "No players found"}
          </h3>
          <p className="text-zinc-500 mt-2 text-sm font-medium">
            {shortlistFilter 
              ? "Use the ★ button on player cards to build your shortlist."
              : `No matches for "${searchQuery}" in the ${activeTab === 'ALL' ? 'database' : activeTab + ' category'}.`
            }
          </p>
        </div>
      )}
    </div>
  );
}
