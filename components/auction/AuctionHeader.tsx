"use client";

import { useAuction } from "./AuctionContext";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Activity } from "lucide-react";

export function AuctionHeader() {
  const { room, roomCode, isHost, isAuctionComplete, handleStartAuction, handlePause, handleEndAuction } = useAuction();

  return (
    <header className="h-[72px] border-b border-white/[0.04] bg-[#09090b] flex items-center justify-between px-6 z-10 shrink-0 sticky top-0">
      <div className="flex items-center gap-5">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-amber-500" />
          <span className="hidden sm:inline">ROOM</span>
        </h1>
        
        <div className="h-5 w-px bg-white/10" />
        
        <div className="flex items-center gap-3">
          <div 
            className="flex bg-black/40 border border-white/[0.06] rounded-md px-3 py-1 shadow-inner items-center gap-2 cursor-pointer hover:bg-black/60 hover:border-amber-500/30 transition-colors group"
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard.writeText(window.location.href);
                alert("Invite link copied to clipboard!");
              }
            }}
            title="Click to copy invite link"
          >
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest group-hover:text-amber-500/80 transition-colors">Code</span>
            <span className="font-mono font-bold text-amber-400 tracking-wider text-sm">{roomCode?.toUpperCase()}</span>
          </div>

          <Badge 
            variant={
              room?.status === "active" ? "success" : 
              room?.status === "paused" ? "default" : 
              room?.status === "completed" ? "secondary" : 
              "outline"
            }
            dot={room?.status === "active"}
            dotColor="bg-green-400"
            className="hidden sm:flex px-2.5 py-1"
          >
            {room?.status || "Connecting"}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isHost && room?.status === "waiting" && !isAuctionComplete && (
          <Button onClick={handleStartAuction} variant="primary" size="sm" className="shimmer-btn">
            <Play className="h-4 w-4 mr-1.5" /> Start Draft
          </Button>
        )}
        {isHost && room?.status === "active" && (
           <Button onClick={() => handlePause(true)} size="sm" variant="outline" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-colors bg-amber-500/5">
            <Pause className="h-4 w-4 mr-1.5" /> Pause 
          </Button>
        )}
        {isHost && room?.status === "paused" && !isAuctionComplete && (
          <Button onClick={() => handlePause(false)} size="sm" variant="primary">
            <Play className="h-4 w-4 mr-1.5" /> Resume
          </Button>
        )}
        {isHost && (room?.status === "active" || room?.status === "paused") && !isAuctionComplete && (
          <Button onClick={handleEndAuction} size="sm" variant="destructive">
            <Square className="h-3.5 w-3.5 mr-1" /> End Room
          </Button>
        )}
      </div>
    </header>
  );
}
