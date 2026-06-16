"use client";

import { useAuction } from "./AuctionContext";
import { Button } from "@/components/ui/button";
import { Loader2, Gavel, ArrowRight, Keyboard } from "lucide-react";
import { formatPriceCr, IPL_RULES, calculateNextBid, canAffordBid } from "@/lib/auction-engine";
import { useState, useEffect } from "react";

export function BidControls() {
  const { 
    room, currentPlayer, playerTeam, isBidding, isHighest, 
    timeLeft, nextCalculated, handleBid, 
    mySquadSize, myOverseas, isOverseasPlayer, isSpectator, myPurse, currentBid, safeBasePrice
  } = useAuction();

  const [customBidStr, setCustomBidStr] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  if (!currentPlayer || room?.status !== "active") return null;

  const isSoldOrUnsold = timeLeft !== null && timeLeft <= 0;

  // Calculate next 3 consecutive bid options
  const bid1 = currentBid === 0 ? safeBasePrice : nextCalculated;
  const bid2 = calculateNextBid(bid1, safeBasePrice);
  const bid3 = calculateNextBid(bid2, safeBasePrice);

  // Validate custom bid input
  const handleCustomBidChange = (val: string) => {
    setCustomBidStr(val);
    const amount = parseFloat(val);
    if (isNaN(amount) || amount <= 0) {
      setCustomError(null);
      return;
    }

    if (amount < bid1) {
      setCustomError(`Min bid is ${formatPriceCr(bid1)}`);
      return;
    }

    if (!canAffordBid(myPurse, amount, mySquadSize)) {
      setCustomError("Cannot afford / reserve limit");
      return;
    }

    setCustomError(null);
  };

  // Reset custom input when current player or current bid changes
  useEffect(() => {
    setCustomBidStr("");
    setCustomError(null);
  }, [currentPlayer?.id, currentBid]);

  const handlePlaceCustomBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customBidStr);
    if (isNaN(amount) || amount < bid1 || customError) return;
    await handleBid(amount);
    setCustomBidStr("");
  };

  // If spectator or no claimed team, show spectating bar
  if (isSpectator || !playerTeam) {
    return (
      <div className="md:flex md:justify-end md:mt-2 fixed md:static bottom-0 inset-x-0 bg-[#0c0c0f]/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-white/[0.06] md:border-t-0 p-4 pb-6 md:p-0 z-40">
        <div className="flex items-center justify-center gap-2.5 w-full md:min-w-[320px] h-16 bg-zinc-900/50 border border-zinc-800/40 rounded-[14px] px-6 text-zinc-400 text-xs font-black uppercase tracking-widest shadow-inner">
          <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse" />
          👁️ SPECTATING AUCTION ROOM
        </div>
      </div>
    );
  }

  // Roster check
  const isOverseasLimit = isOverseasPlayer && myOverseas >= IPL_RULES.MAX_OVERSEAS;
  const isSquadLimit = mySquadSize >= IPL_RULES.MAX_SQUAD_SIZE;
  const isRosterValid = !isSquadLimit && !isOverseasLimit;

  return (
    <div className="md:flex md:flex-col md:items-end md:mt-2 fixed md:static bottom-0 inset-x-0 bg-[#0c0c0f]/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-white/[0.06] md:border-t-0 p-4 pb-6 md:p-0 z-40 transition-all duration-300">
      <div className="flex flex-col gap-3.5 w-full md:w-auto md:min-w-[420px]">
        {isSoldOrUnsold ? (
          <div className="h-16 px-10 flex items-center justify-center text-2xl font-black rounded-[14px] bg-black/40 border border-white/[0.02] uppercase tracking-[0.2em] shadow-inner text-center">
            {currentBid > 0 ? (
              <span className="text-green-500 animate-fade-in flex items-center gap-2">
                <Gavel className="h-6 w-6" /> SOLD!
              </span>
            ) : (
              <span className="text-zinc-500 animate-fade-in">UNSOLD</span>
            )}
          </div>
        ) : (
          <>
            {/* Header / Limit Warnings */}
            {!isRosterValid && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-2.5 text-[10px] font-bold uppercase tracking-wider text-center animate-pulse">
                ⚠️ {isSquadLimit ? "Squad full (25/25)" : "Overseas quota full (8/8)"} - Bidding locked
              </div>
            )}

            {isHighest && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg p-2.5 text-[10px] font-bold uppercase tracking-wider text-center">
                👍 You are the highest bidder ({formatPriceCr(currentBid)})
              </div>
            )}

            {/* Bidding buttons wrapper */}
            {isRosterValid && !isHighest && (
              <div className="flex flex-col gap-2.5">
                {/* 3 Bid Increments Row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { amount: bid1, label: "Bid Min" },
                    { amount: bid2, label: "+1 Up" },
                    { amount: bid3, label: "+2 Up" }
                  ].map((option, idx) => {
                    const affordable = canAffordBid(myPurse, option.amount, mySquadSize);
                    return (
                      <Button
                        key={idx}
                        onClick={() => handleBid(option.amount)}
                        disabled={!affordable || isBidding}
                        variant={affordable ? (idx === 0 ? "primary" : "outline") : "secondary"}
                        className={`h-16 flex flex-col justify-center items-center rounded-xl p-1 transition-all duration-300 font-mono ${
                          affordable && idx === 0 ? "shimmer-btn shadow-[0_0_15px_rgba(245,158,11,0.15)]" : ""
                        } ${!affordable ? "opacity-40 cursor-not-allowed border-zinc-800" : ""}`}
                      >
                        <span className="text-[9px] uppercase tracking-widest font-sans opacity-70 mb-0.5">{option.label}</span>
                        <span className="text-sm font-black tracking-tight">{formatPriceCr(option.amount)}</span>
                      </Button>
                    );
                  })}
                </div>

                {/* Custom Bid Form */}
                <form onSubmit={handlePlaceCustomBid} className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.05"
                      min={bid1}
                      value={customBidStr}
                      onChange={(e) => handleCustomBidChange(e.target.value)}
                      placeholder={`Custom Cr (min ${bid1})`}
                      disabled={isBidding}
                      className={`w-full h-11 bg-black/60 border rounded-xl pl-8 pr-12 text-sm text-white font-mono focus:outline-none focus:bg-black/90 transition-all ${
                        customError ? "border-red-500/50 focus:border-red-500" : "border-white/[0.08] focus:border-amber-500/50"
                      }`}
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Keyboard className="h-4 w-4" />
                    </div>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                      CR
                    </span>
                  </div>

                  <Button
                    type="submit"
                    disabled={!customBidStr || !!customError || isBidding}
                    variant="outline"
                    className="h-11 px-4 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/40 rounded-xl text-xs font-bold uppercase tracking-widest shrink-0"
                  >
                    {isBidding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bid Custom"}
                  </Button>
                </form>

                {/* Inline error for custom bid */}
                {customError && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider px-1 animate-slide-down">
                    ⚠️ {customError}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
