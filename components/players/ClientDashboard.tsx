"use client";

import { useState } from "react";
import { PlayerCard } from "./PlayerCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserX } from "lucide-react";
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

        <Tabs defaultValue="ALL" onValueChange={setActiveTab} className="w-full lg:w-auto overflow-x-auto no-scrollbar">
          <TabsList className="h-12 w-full lg:w-auto p-1 bg-black/60 rounded-[10px]">
             <TabsTrigger value="ALL" className="h-full rounded-md data-[state=active]:bg-zinc-800 text-xs px-4">ALL PLAYERS</TabsTrigger>
             <TabsTrigger value="BAT" className="h-full rounded-md data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-xs px-4">BAT</TabsTrigger>
             <TabsTrigger value="BOWL" className="h-full rounded-md data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-xs px-4">BOWL</TabsTrigger>
             <TabsTrigger value="AR" className="h-full rounded-md data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-xs px-4">ALL-ROUNDER</TabsTrigger>
             <TabsTrigger value="WK" className="h-full rounded-md data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-xs px-4">WICKET KEEPER</TabsTrigger>
          </TabsList>
        </Tabs>
        
      </div>

      {/* Results Meta */}
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
        Showing <span className="text-zinc-200">{filteredPlayers.length}</span> players
      </div>

      {/* Players Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          {filteredPlayers.map((player, index) => (
            <div key={player.id} className="animate-scale-in" style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}>
               <PlayerCard player={player} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center glass-card rounded-2xl border-dashed">
          <div className="h-16 w-16 bg-white/[0.03] rounded-full flex items-center justify-center mb-4">
             <UserX className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">No players found</h3>
          <p className="text-zinc-500 mt-2 text-sm font-medium">
            No matches for "{searchQuery}" in the {activeTab === 'ALL' ? 'database' : activeTab + ' category'}.
          </p>
        </div>
      )}
    </div>
  );
}
