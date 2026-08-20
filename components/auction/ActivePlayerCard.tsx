"use client";

import { useAuction } from "./AuctionContext";
import { formatPriceCr } from "@/lib/auction-engine";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Plane, Star, Sparkles, Gavel, Shield, Timer, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IPL_TEAMS, getTeam, getBidEscalationColor } from "@/lib/design-tokens";

export function ActivePlayerCard() {
  const { room, currentPlayer, timeLeft, currentBid, safeBasePrice, isOverseasPlayer } = useAuction();
  const [isShortlisted, setIsShortlisted] = useState(false);
  const prevBidRef = useRef(0);
  const [bidFlash, setBidFlash] = useState(false);

  useEffect(() => {
    if (currentPlayer?.id) {
      const shortlist = JSON.parse(localStorage.getItem("ipl_shortlist") || "[]");
      setIsShortlisted(shortlist.includes(currentPlayer.id));
    }
  }, [currentPlayer?.id]);

  useEffect(() => {
    if (currentBid > 0 && currentBid !== prevBidRef.current) {
      prevBidRef.current = currentBid;
      setBidFlash(true);
      const t = setTimeout(() => setBidFlash(false), 500);
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
  const timerDuration = room?.timer_duration || 10;
  const secondsLeft = timeLeft !== null ? Math.max(0, Math.ceil(timeLeft / 1000)) : null;
  const timerCritical = timeLeft !== null && timeLeft <= 4000;
  const timerWarning = timeLeft !== null && timeLeft <= 7000 && timeLeft > 4000;
  const isMarquee = (currentPlayer.base_price_cr && currentPlayer.base_price_cr >= 2.0) || currentPlayer.contract_type_2026 === "RETAINED";
  
  const currentVal = currentBid === 0 ? safeBasePrice : currentBid;
  const escalation = getBidEscalationColor(currentVal);
  const bidderTeam = getTeam(room?.current_highest_bidder_id);

  const progressRatio = timeLeft !== null ? Math.max(0, Math.min(1, timeLeft / (timerDuration * 1000))) : 0;

  return (
    <div
      className={`glass-panel rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300 ${
        timerCritical
          ? "border-red-500/60 shadow-[0_0_50px_rgba(220,38,38,0.25)]"
          : isMarquee
            ? "border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.15)]"
            : "border-white/10"
      }`}
    >
      {/* Visual Timer Progress Bar along Top Edge */}
      {room?.status === "active" && timeLeft !== null && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/40 overflow-hidden z-20">
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              timerCritical
                ? "bg-red-500 shadow-[0_0_12px_#ef4444]"
                : timerWarning
                ? "bg-amber-400"
                : "bg-emerald-400 shadow-[0_0_10px_#10b981]"
            }`}
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
      )}

      {/* Bid flash effect */}
      {bidFlash && (
        <motion.div
          className="absolute inset-0 bg-amber-500/15 pointer-events-none z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Top Status Bar: Badges, Timer & Shortlist */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-zinc-300 font-mono">
            {currentPlayer.role}
          </Badge>
          {isOverseasPlayer ? <Badge variant="overseas">OVERSEAS</Badge> : <Badge variant="blue">INDIAN</Badge>}
          {isMarquee && <Badge variant="marquee">MARQUEE STAR</Badge>}
          {currentPlayer.auction_set && (
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-2 py-0.5 rounded bg-black/40 border border-white/5">
              SET {currentPlayer.auction_set}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Prominent Visible Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all shadow-md ${
              isPaused
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : timerCritical
                ? "bg-red-500/25 border-red-500/60 text-red-300 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                : timerWarning
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
            }`}
          >
            <Clock className={`h-4 w-4 ${timerCritical ? "animate-spin text-red-400" : isPaused ? "text-amber-400" : "text-emerald-400"}`} />
            <span className="tracking-wider">
              {isPaused ? (
                "PAUSED"
              ) : secondsLeft !== null ? (
                `0${secondsLeft}s`.slice(-3)
              ) : (
                "WAITING"
              )}
            </span>
          </div>

          <button
            onClick={toggleShortlist}
            className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
              isShortlisted
                ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-md"
                : "bg-white/5 text-zinc-500 hover:text-white border border-white/10"
            }`}
            title={isShortlisted ? "Saved in shortlist" : "Add to shortlist"}
          >
            <Star className={`h-4 w-4 ${isShortlisted ? "fill-red-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Player Core & Compact Price Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Player Identity */}
        <div className="flex items-center gap-5 flex-1">
          <PlayerAvatar
            playerId={currentPlayer.id}
            playerName={currentPlayer.name}
            size="2xl"
            marquee={!!isMarquee}
          />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
                {currentPlayer.nationality}
              </span>
              {currentPlayer.ipl_team_2025 && (
                <span className="text-xs font-mono text-zinc-500">
                  · Ex-{currentPlayer.ipl_team_2025}
                </span>
              )}
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-none mb-2">
              {currentPlayer.name}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans">
              Base Price: <span className="font-mono font-bold text-zinc-200">₹{safeBasePrice.toFixed(2)} Cr</span>
            </p>
          </div>
        </div>

        {/* Right: Compact, Sleek Price Display */}
        <div className="flex flex-col items-start md:items-end justify-center bg-black/40 px-4 py-3 rounded-2xl border border-white/10 shrink-0">
          <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-0.5">
            <Gavel className="h-3.5 w-3.5 text-amber-400" />
            {currentBid === 0 ? "Base Price" : "Current Bid"}
          </span>

          <motion.div
            key={currentVal}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className={`font-mono font-bold text-2xl sm:text-3xl tabular-nums ${escalation.text} tracking-tight`}
          >
            {formatPriceCr(currentVal)}
          </motion.div>

          {/* Highest Bidder Franchise Tag */}
          <div className="mt-2 flex items-center gap-2">
            {bidderTeam ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold shadow-md"
                style={{
                  backgroundColor: bidderTeam.color,
                  color: bidderTeam.textOnColor,
                }}
              >
                <span>HIGH BIDDER:</span>
                <span>{bidderTeam.name} ({bidderTeam.short})</span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-zinc-500 italic">No bids placed yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

