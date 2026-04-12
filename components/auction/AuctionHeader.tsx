"use client";

import { useAuction } from "./AuctionContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Activity, Settings2, X, Check } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function AuctionHeader() {
  const { room, roomCode, isHost, isAuctionComplete, handleStartAuction, handlePause, handleEndAuction } = useAuction();
  const [showSettings, setShowSettings] = useState(false);
  const [timerVal, setTimerVal] = useState(room?.timer_duration || 10);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    if (!room?.id) return;
    setIsSaving(true);
    await supabase.from("rooms").update({ timer_duration: timerVal }).eq("id", room.id);
    setIsSaving(false);
    setShowSettings(false);
  };

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
        {isHost && (
          <>
            <button 
              onClick={() => setShowSettings(true)}
              className="h-8 w-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors mr-2"
              title="Room Settings"
            >
              <Settings2 className="h-4 w-4" />
            </button>

            {/* Settings Modal */}
            {showSettings && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                <div className="glass-card max-w-sm w-full p-6 text-left relative shadow-2xl rounded-[20px] animate-scale-in border border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                       <Settings2 className="h-5 w-5 text-amber-500" /> Room Configuration
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 block">Bid Timer Duration (Seconds)</label>
                      <div className="flex gap-2">
                         {[5, 10, 15, 20].map(val => (
                           <button
                             key={val}
                             onClick={() => setTimerVal(val)}
                             className={`flex-1 py-3 px-2 rounded-xl border text-sm font-black transition-all ${
                               timerVal === val 
                                 ? "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-amber-500" 
                                 : "bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200"
                             }`}
                           >
                             {val}s
                           </button>
                         ))}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2 leading-tight">Controls exactly how long bidders have to respond before the system auto-sells the active player.</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Button onClick={handleSaveSettings} disabled={isSaving || timerVal === room?.timer_duration} variant="primary" className="w-full h-12 font-bold text-sm tracking-wide hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                      {isSaving ? "Saving..." : <span className="flex items-center gap-2"><Check className="h-4 w-4" /> APPLY SETTINGS</span>}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {isHost && room?.status === "waiting" && !isAuctionComplete && (
          <Button onClick={handleStartAuction} variant="primary" size="sm" className="shimmer-btn hidden sm:flex">
            <Play className="h-4 w-4 mr-1.5" /> Start Auction
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
