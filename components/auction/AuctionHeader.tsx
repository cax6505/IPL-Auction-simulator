"use client";

import { useAuction } from "./AuctionContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square } from "lucide-react";

export function AuctionHeader() {
  const { room, roomCode, isHost, isAuctionComplete, handleStartAuction, handlePause, handleEndAuction } = useAuction();

  return (
    <header className="h-16 border-b border-white/[0.04] bg-[#0A0A0A] flex items-center justify-between px-6 z-10 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-tighter">
          AUCTION SIMULATOR
        </h1>
        <div className="h-4 w-px bg-white/10" />
        <span className="text-slate-400 font-medium text-xs hidden sm:inline-block">
          Room <span className="text-white font-bold">{roomCode?.toUpperCase()}</span>
        </span>
        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest ${
          room?.status === "active" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
          room?.status === "paused" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
          room?.status === "completed" ? "bg-slate-500/10 text-slate-400 border border-slate-500/20" :
          "bg-slate-800 text-slate-500"
        }`}>
          {room?.status || "Waiting"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isHost && room?.status === "waiting" && !isAuctionComplete && (
          <Button onClick={handleStartAuction} size="sm" className="h-9 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]">
            <Play className="h-4 w-4 mr-2" /> Start Draft
          </Button>
        )}
        {isHost && room?.status === "active" && (
           <Button onClick={() => handlePause(true)} size="sm" variant="outline" className="h-9 border-white/10 text-amber-500 hover:bg-white/5 disabled:opacity-50 transition-colors">
            <Pause className="h-4 w-4 mr-2" /> Pause 
          </Button>
        )}
        {isHost && room?.status === "paused" && !isAuctionComplete && (
          <Button onClick={() => handlePause(false)} size="sm" className="h-9 bg-amber-500 hover:bg-amber-600 text-black font-bold disabled:opacity-50">
            <Play className="h-4 w-4 mr-2" /> Resume
          </Button>
        )}
        {isHost && (room?.status === "active" || room?.status === "paused") && !isAuctionComplete && (
          <Button onClick={handleEndAuction} size="sm" variant="destructive" className="h-9 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20">
            <Square className="h-3 w-3 mr-2" /> End
          </Button>
        )}
      </div>
    </header>
  );
}
