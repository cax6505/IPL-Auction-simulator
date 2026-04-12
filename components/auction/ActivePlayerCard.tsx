"use client";

import { useAuction } from "./AuctionContext";
import { formatPriceCr } from "@/lib/auction-engine";
import { Badge } from "@/components/ui/badge";
import { Plane } from "lucide-react";

export function ActivePlayerCard() {
  const { room, currentPlayer, timerProgress, timeLeft, currentBid, safeBasePrice, isOverseasPlayer } = useAuction();

  if (!currentPlayer) return null;

  const isPaused = room?.status === "paused";
  const timerCritical = timeLeft !== null && timeLeft <= 5000;
  const isSold = timeLeft !== null && timeLeft <= 0 && currentBid > 0;
  
  // Timer color
  let timerIndicatorCSS = "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]";
  if (isPaused) {
    timerIndicatorCSS = "bg-zinc-500 shadow-[0_0_15px_rgba(113,113,122,0.5)]";
  } else if (timerCritical) {
    timerIndicatorCSS = "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]";
  }

  // Active ring based on state
  let containerRing = "border-white/[0.06]";
  if (isPaused) containerRing = "border-zinc-500/30 opacity-70";
  else if (timerCritical) containerRing = "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]";
  else if (room?.status === "active") containerRing = "border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.05)]";

  return (
    <div className={`glass-card rounded-[20px] overflow-hidden relative transition-all duration-300 ease-spring ${containerRing}`}>
      {/* Progress Bar Top Line */}
      <div 
        className={`absolute top-0 left-0 h-2 transition-all duration-[100ms] ease-linear z-50 ${timerIndicatorCSS}`}
        style={{ width: isPaused ? "100%" : `${timerProgress}%` }}
      />
      
      {/* Inner Gradient based on timer criticalness */}
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-t pointer-events-none transition-colors duration-500 ${
        timerCritical ? "from-red-500/50" : "from-amber-500/30"
      } to-transparent`} />
      
      <div className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
        
        {/* Left: Player Identity */}
        <div className="flex flex-col w-full md:w-auto flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className="text-zinc-300 bg-white/[0.03]">
              {currentPlayer.role}
            </Badge>
            <Badge variant={isOverseasPlayer ? "outline" : "blue"} className={isOverseasPlayer ? "border-orange-500/20 text-orange-400" : ""}>
              {isOverseasPlayer ? "OVERSEAS" : "INDIAN"}
            </Badge>
            {currentPlayer.auction_set && (
              <div className="bg-black/30 border border-white/5 rounded px-2 py-0.5 text-[9px] font-mono text-zinc-500 font-bold tracking-widest uppercase">
                SET {currentPlayer.auction_set}
              </div>
            )}
            {isOverseasPlayer && (
              <div className="flex items-center justify-center gap-1 bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500/20 ml-auto md:ml-0 uppercase tracking-widest">
                <Plane className="h-3 w-3" /> OS
              </div>
            )}
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-2 drop-shadow-sm">
            {currentPlayer.name}
          </h2>
          <p className="text-sm text-zinc-400 font-medium">{currentPlayer.nationality}</p>
        </div>

        {/* Right: Bidding Details */}
        <div className="flex flex-col gap-4 items-start md:items-end w-full md:w-auto border-t border-white/[0.04] md:border-0 pt-6 md:pt-0 shrink-0">
          
          {/* Countdown Clock */}
          {timeLeft !== null && room?.status === "active" && !isSold && (
            <div className={`flex items-center justify-center bg-black/60 border border-white/[0.06] px-4 py-2 rounded-[10px] shadow-inner ${timerCritical ? 'animate-pulse border-red-500/30' : ''}`}>
              <span className={`text-xl font-black font-mono tracking-tighter flex items-center gap-1 ${
                timerCritical ? "text-red-500" : "text-white"
              }`}>
                {Math.ceil(timeLeft / 1000)}<span className="text-xs text-zinc-500 font-sans tracking-widest">SEC</span>
              </span>
            </div>
          )}

          {/* Bid Value */}
          <div className="flex flex-col text-left md:text-right w-full">
            <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase mb-1 flex items-center justify-start md:justify-end gap-2">
              <span className="h-[1px] w-4 bg-zinc-700 hidden md:inline-block" />
              {currentBid === 0 ? "BASE PRICE" : "CURRENT HIGHEST BID"}
            </span>
            <span className={`text-4xl sm:text-5xl lg:text-[64px] font-black font-mono tabular-nums leading-none tracking-tighter ${
              isSold ? "text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse" : 
              currentBid > 0 ? "text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "text-white"
            }`}>
              {formatPriceCr(currentBid === 0 ? safeBasePrice : currentBid)}
            </span>
            
            {/* Bidder Tag */}
            <div className="h-6 mt-2 flex justify-start md:justify-end">
              {currentBid > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.05] rounded pl-1.5 pr-2 py-0.5">
                   <span className="text-[10px] text-zinc-500 font-medium">Bidding:</span>
                   <span className="text-xs font-bold text-white tracking-wide">{room.current_highest_bidder_id}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
