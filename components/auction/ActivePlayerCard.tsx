"use client";

import { useAuction } from "./AuctionContext";
import { formatPriceCr } from "@/lib/auction-engine";

export function ActivePlayerCard() {
  const { room, currentPlayer, timerProgress, timeLeft, currentBid, safeBasePrice } = useAuction();

  if (!currentPlayer) return null;

  return (
    <div className={`bg-gradient-to-r from-[#161616] to-[#0A0A0A] border rounded-2xl overflow-hidden shadow-2xl relative transition-all ${
      room?.status === "paused" ? "border-amber-500/30 opacity-70" : "border-white/[0.06]"
    }`}>
      {/* Progress Bar */}
      <div 
        className={`h-1.5 transition-all duration-100 ease-linear ${
          room?.status === "paused" ? "bg-amber-500" : timerProgress < 30 ? "bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.8)]" : "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
        }`}
        style={{ width: room?.status === "paused" ? "100%" : `${timerProgress}%` }}
      />
      
      <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Player Identity */}
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="h-28 w-28 bg-black border border-white/10 rounded-2xl flex items-center justify-center relative shadow-inner overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
            <img 
              src={currentPlayer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentPlayer.name)}&background=111&color=fff&size=128&bold=true`}
              className="h-full w-full object-cover"
              alt={currentPlayer.name}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] bg-white/[0.04] text-white/70 px-2.5 py-1 rounded-md uppercase tracking-widest font-bold border border-white/[0.08]">
                {currentPlayer.role}
              </span>
              <span className={`text-[10px] px-2.5 py-1 rounded-md uppercase tracking-widest font-bold border ${
                currentPlayer.is_overseas || currentPlayer.nationality?.toLowerCase() !== 'indian' 
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20" 
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
              }`}>
                {currentPlayer.is_overseas || currentPlayer.nationality?.toLowerCase() !== 'indian' ? "OS" : "IND"}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{currentPlayer.name}</h2>
            {currentPlayer.auction_set && (
              <p className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-widest">Set: {currentPlayer.auction_set}</p>
            )}
          </div>
        </div>

        {/* Bidding Summary */}
        <div className="flex gap-8 items-center w-full md:w-auto justify-between md:justify-end border-t border-white/[0.04] md:border-0 pt-6 md:pt-0">
          {timeLeft !== null && room?.status === "active" && (
            <div className="flex flex-col items-center justify-center bg-black/40 border border-white/[0.08] p-3 rounded-xl min-w-[80px]">
              <span className={`text-3xl font-black font-mono tracking-tighter ${
                timeLeft <= 5000 ? "text-red-500 animate-pulse" : "text-white"
              }`}>
                {Math.ceil(timeLeft / 1000)}
              </span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">SEC</span>
            </div>
          )}

          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] mb-1">
              {currentBid === 0 ? "BASE PRICE" : "CURRENT BID"}
            </span>
            <span className={`text-5xl font-black tabular-nums tracking-tighter ${
              timeLeft !== null && timeLeft <= 0 ? "text-green-400 animate-pulse" : "text-amber-400"
            }`}>
              {formatPriceCr(currentBid === 0 ? safeBasePrice : currentBid)}
            </span>
            <span className="text-[11px] text-slate-400 tracking-wider h-4 mt-1 font-medium">
              {currentBid > 0 ? `held by ` : " "}
              <span className="text-white font-bold">{currentBid > 0 ? room.current_highest_bidder_id : ""}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
