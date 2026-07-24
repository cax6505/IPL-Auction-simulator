"use client";

import { useAuction } from "./AuctionContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Activity, Settings2, X, Check, Eye, Radio, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

export function AuctionHeader() {
  const { room, roomCode, isHost, isAuctionComplete, handleStartAuction, handlePause, handleEndAuction, onlineUsers, timeLeft } = useAuction();
  const [showSettings, setShowSettings] = useState(false);
  const [timerVal, setTimerVal] = useState(room?.timer_duration || 10);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (room?.timer_duration) {
      setTimerVal(room.timer_duration);
    }
  }, [room?.timer_duration]);

  const spectatorCount = onlineUsers.filter((u) => u.spectator || u.team === "Spectator" || u.team === "Spectators").length;
  const secondsLeft = timeLeft !== null ? Math.max(0, Math.ceil(timeLeft / 1000)) : null;

  const handleSaveSettings = async () => {
    if (!room?.id) return;
    setIsSaving(true);
    await supabase.from("rooms").update({ timer_duration: timerVal }).eq("id", room.id);
    setIsSaving(false);
    setShowSettings(false);
  };

  const settingsModal = showSettings && typeof document !== "undefined" ? createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={() => setShowSettings(false)}>
      <div className="glass-panel max-w-sm w-full p-6 text-left relative shadow-2xl rounded-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-amber-400" /> Room Configuration
          </h3>
          <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
              Bid Timer Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((val) => (
                <button
                  key={val}
                  onClick={() => setTimerVal(val)}
                  className={`py-2.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                    timerVal === val
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {val}s
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving || timerVal === room?.timer_duration}
            className="w-full bg-gradient-to-r from-red-600 to-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider"
          >
            {isSaving ? "Saving..." : "Apply Settings"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <header className="h-16 border-b border-white/10 glass-panel flex items-center justify-between px-4 sm:px-6 z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="font-display font-black text-white text-base tracking-wider hidden sm:inline">
              AUCTION ARENA
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Room Code Trigger */}
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard.writeText(window.location.href);
                alert("Room invite URL copied to clipboard!");
              }
            }}
            className="flex items-center gap-2 bg-black/40 border border-white/10 hover:border-amber-400/40 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-amber-300 transition-all"
            title="Click to copy invite link"
          >
            <span className="text-zinc-500 text-[10px] uppercase">ROOM:</span>
            <span>{roomCode?.toUpperCase()}</span>
            <Copy className="h-3 w-3 text-zinc-500" />
          </button>

          <Badge variant={room?.status === "active" ? "marquee" : "secondary"}>
            {room?.status?.toUpperCase() || "CONNECTING"}
          </Badge>

          {/* Live Timer Clock in Header */}
          {room?.status === "active" && secondsLeft !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold animate-pulse">
              <span className="text-[10px] text-emerald-500 uppercase tracking-wider">TIMER:</span>
              <span>{secondsLeft}s</span>
            </div>
          )}

          {spectatorCount > 0 && (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <Eye className="h-3.5 w-3.5 text-zinc-400" />
              <span>{spectatorCount} Watching</span>
            </div>
          )}
        </div>

        {/* Host Controls */}
        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => setShowSettings(true)}
              className="h-9 w-9 rounded-xl glass-panel flex items-center justify-center text-zinc-400 hover:text-white"
              title="Settings"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          )}

          {isHost && room?.status === "waiting" && !isAuctionComplete && (
            <Button onClick={handleStartAuction} className="bg-emerald-500 hover:bg-emerald-600 text-black font-mono font-bold text-xs">
              <Play className="h-3.5 w-3.5 mr-1" /> Start Auction
            </Button>
          )}
          {isHost && room?.status === "active" && (
            <Button onClick={() => handlePause(true)} variant="outline" className="border-amber-500/40 text-amber-300 font-mono text-xs">
              <Pause className="h-3.5 w-3.5 mr-1" /> Pause
            </Button>
          )}
          {isHost && room?.status === "paused" && !isAuctionComplete && (
            <Button onClick={() => handlePause(false)} className="bg-emerald-500 hover:bg-emerald-600 text-black font-mono font-bold text-xs">
              <Play className="h-3.5 w-3.5 mr-1" /> Resume
            </Button>
          )}
          {isHost && (room?.status === "active" || room?.status === "paused") && !isAuctionComplete && (
            <Button onClick={handleEndAuction} variant="destructive" className="font-mono text-xs">
              <Square className="h-3.5 w-3.5 mr-1" /> End
            </Button>
          )}
        </div>
      </header>

      {settingsModal}
    </>
  );
}

