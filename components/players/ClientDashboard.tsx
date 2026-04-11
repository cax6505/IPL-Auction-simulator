"use client";

import { useState } from "react";
import { PlayerCard } from "./PlayerCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User } from "lucide-react";
import type { PlayerRecord } from "@/lib/types/player";

export function ClientDashboard({ initialPlayers }: { initialPlayers: PlayerRecord[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  const filteredPlayers = initialPlayers.filter((player) => {
    // Search filter
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab filter
    let matchesTab = true;
    if (activeTab !== "ALL") {
      matchesTab = player.role.toUpperCase() === activeTab;
    }

    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Controls Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        
        <div className="relative w-full md:w-96 text-slate-400">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input 
            placeholder="Search players by name..." 
            className="pl-10 bg-black/40 border-slate-800 text-slate-100 placeholder:text-slate-500 h-11 focus-visible:ring-amber-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="ALL" onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-5 bg-black/40 border border-slate-800 h-11">
            <TabsTrigger value="ALL" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">All</TabsTrigger>
            <TabsTrigger value="BAT" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">BAT</TabsTrigger>
            <TabsTrigger value="BOWL" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">BOWL</TabsTrigger>
            <TabsTrigger value="AR" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">AR</TabsTrigger>
            <TabsTrigger value="WK" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">WK</TabsTrigger>
          </TabsList>
        </Tabs>
        
      </div>

      {/* Results Meta */}
      <div className="text-sm text-slate-400 font-medium">
        Showing <span className="text-white">{filteredPlayers.length}</span> players
      </div>

      {/* Players Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 text-center bg-slate-900/30 rounded-2xl border border-white/5 border-dashed">
          <User className="h-16 w-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-300">No players found</h3>
          <p className="text-slate-500 mt-2 max-w-sm">
            We couldn't find any players matching "{searchQuery}" in the {activeTab === 'ALL' ? 'database' : activeTab + ' category'}.
          </p>
        </div>
      )}
    </div>
  );
}
