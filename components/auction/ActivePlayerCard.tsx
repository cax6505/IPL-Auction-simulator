"use client";

import { useAuction } from "./AuctionContext";
import { formatPriceCr, TEAM_MAP } from "@/lib/auction-engine";
import { Badge } from "@/components/ui/badge";
import { Plane, Star, Swords } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function ActivePlayerCard() {
  const { room, currentPlayer, timerProgress, timeLeft, currentBid, safeBasePrice, isOverseasPlayer, logs } = useAuction();
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [bidHistory, setBidHistory] = useState<{ team: string; amount: number }[]>([]);
  const prevBidRef = useRef(0);
  const [bidFlash, setBidFlash] = useState(false);

  // Track shortlist from localStorage
  useEffect(() => {
    if (currentPlayer?.id) {
      const shortlist = JSON.parse(localStorage.getItem("ipl_shortlist") || "[]");
      setIsShortlisted(shortlist.includes(currentPlayer.id));
    }
  }, [currentPlayer?.id]);

  // Track bid history for duel HUD
  useEffect(() => {
    if (!currentPlayer) {
      setBidHistory([]);
      return;
    }
    // Extract bid logs for current player from activity feed
    const recentBids = logs
      .filter(l => l.type === "bid")
      .map(l => {
        const match = l.text.match(/^(\w+) bid (.+)$/);
        if (match) {
          return { team: match[1], amount: parseFloat(match[2].replace(/[₹CrL\s]/g, '')) };
        }
        return null;
      })
      .filter(Boolean) as { team: string; amount: number }[];
    
    setBidHistory(recentBids.slice(-10)); // Keep last 10 bids
  }, [logs, currentPlayer]);

  // Flash animation on new bid
  useEffect(() => {
    if (currentBid > 0 && currentBid !== prevBidRef.current) {
      prevBidRef.current = currentBid;
      setBidFlash(true);
      const t = setTimeout(() => setBidFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [currentBid]);

  const toggleShortlist = () => {
    if (!currentPlayer?.id) return;
    const shortlist = JSON.parse(localStorage.getItem("ipl_shortlist") || "[]");
    let updated: string[];
    if (shortlist.includes(currentPlayer.id)) {
      updated = shortlist.filter((id: string) => id !== currentPlayer.id);
    } else {
      updated = [...shortlist, currentPlayer.id];
    }
    localStorage.setItem("ipl_shortlist", JSON.stringify(updated));
    setIsShortlisted(!isShortlisted);
  };

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

  // Duel HUD: extract the last two distinct bidders
  const lastBidders: { team: string; amount: number }[] = [];
  for (let i = bidHistory.length - 1; i >= 0 && lastBidders.length < 2; i--) {
    const bid = bidHistory[i];
    if (!lastBidders.find(b => b.team === bid.team)) {
      lastBidders.unshift(bid);
    }
  }
  const showDuel = lastBidders.length === 2 && currentBid > 0 && room?.status === "active";

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

      {/* Bid flash overlay */}
      {bidFlash && (
        <div className="absolute inset-0 bg-amber-500/5 animate-fade-in pointer-events-none z-40" />
      )}
      
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
            {/* Shortlist Star */}
            <button
              onClick={toggleShortlist}
              className={`ml-auto md:ml-2 h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 ease-spring ${
                isShortlisted
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 scale-110 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "bg-white/[0.03] border border-white/[0.06] text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20"
              }`}
              title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
            >
              <Star className={`h-4 w-4 ${isShortlisted ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-2 drop-shadow-sm">
            {currentPlayer.name}
          </h2>
          <p className="text-sm text-zinc-400 font-medium">{currentPlayer.nationality}</p>
        </div>

        {/* Right: Bidding Details */}
        <div className="flex flex-col gap-4 items-start md:items-end w-full md:w-auto border-t border-white/[0.04] md:border-0 pt-6 md:pt-0 shrink-0">
          
          {/* Bid War Duel HUD */}
          {showDuel && (
            <div className="w-full flex items-center gap-3 bg-black/50 border border-white/[0.06] rounded-[14px] p-3 mb-2 animate-scale-in">
              {/* Team A (previous bidder) */}
              {(() => {
                const teamA = lastBidders[0];
                const metaA = TEAM_MAP.find(t => t.id === teamA.team);
                return (
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-black text-xs shadow-inner ${metaA?.color || 'bg-zinc-700'} text-white`}>
                      {teamA.team}
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-400">{formatPriceCr(teamA.amount)}</span>
                  </div>
                );
              })()}
              
              {/* VS indicator */}
              <div className="flex flex-col items-center shrink-0">
                <Swords className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">VS</span>
              </div>
              
              {/* Team B (current highest bidder) */}
              {(() => {
                const teamB = lastBidders[1];
                const metaB = TEAM_MAP.find(t => t.id === teamB.team);
                return (
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-xs font-mono font-bold text-amber-400">{formatPriceCr(teamB.amount)}</span>
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-black text-xs shadow-inner ring-2 ring-amber-500/50 ${metaB?.color || 'bg-zinc-700'} text-white`}>
                      {teamB.team}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Countdown Clock - Circular SVG */}
          {timeLeft !== null && room?.status === "active" && !isSold && (() => {
            const seconds = Math.ceil(timeLeft / 1000);
            const duration = room?.timer_duration || 10;
            const progress = (timeLeft / (duration * 1000)); // 0.0 to 1.0
            const radius = 28;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);

            // Determine stroke color
            let strokeColor = "#22c55e"; // Green
            let ringGlow = "shadow-[0_0_15px_rgba(34,197,94,0.3)]";
            if (timeLeft <= 3000) {
              strokeColor = "#ef4444"; // Red
              ringGlow = "shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse";
            } else if (timeLeft <= 6000) {
              strokeColor = "#f59e0b"; // Amber
              ringGlow = "shadow-[0_0_15px_rgba(245,158,11,0.3)]";
            }

            return (
              <div className={`relative h-20 w-20 flex items-center justify-center rounded-full bg-black/60 border border-white/[0.06] ${ringGlow} mb-2`}>
                {/* SVG Ring */}
                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 64 64">
                  {/* Background track circle */}
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="4"
                  />
                  {/* Foreground progress circle */}
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="transparent"
                    stroke={strokeColor}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-100 ease-linear"
                  />
                </svg>
                {/* Text Centered */}
                <span className="text-2xl font-black font-mono tracking-tighter text-white z-10 flex flex-col items-center leading-none">
                  {seconds}
                  <span className="text-[7px] text-zinc-500 font-sans tracking-widest mt-0.5">SEC</span>
                </span>
              </div>
            );
          })()}

          {/* Bid Value */}
          <div className="flex flex-col text-left md:text-right w-full">
            <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase mb-1 flex items-center justify-start md:justify-end gap-2">
              <span className="h-[1px] w-4 bg-zinc-700 hidden md:inline-block" />
              {currentBid === 0 ? "BASE PRICE" : "CURRENT HIGHEST BID"}
            </span>
            <span className={`text-4xl sm:text-5xl lg:text-[64px] font-black font-mono tabular-nums leading-none tracking-tighter transition-all duration-300 ${
              bidFlash ? "scale-105" : "scale-100"
            } ${
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
