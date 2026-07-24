"use client";

import { useAuction } from "./AuctionContext";
import { Button } from "@/components/ui/button";
import { Loader2, Gavel, ArrowUpRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { formatPriceCr, IPL_RULES, calculateNextBid, canAffordBid } from "@/lib/auction-engine";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getBidEscalationColor } from "@/lib/design-tokens";

export function BidControls() {
  const {
    room, currentPlayer, playerTeam, isBidding, isHighest,
    timeLeft, nextCalculated, handleBid,
    mySquadSize, myOverseas, isOverseasPlayer, isSpectator, myPurse, currentBid, safeBasePrice
  } = useAuction();

  const [customBidStr, setCustomBidStr] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    setCustomBidStr("");
    setCustomError(null);
  }, [currentPlayer?.id, currentBid]);

  if (!currentPlayer || room?.status !== "active") return null;

  const isSoldOrUnsold = timeLeft !== null && timeLeft <= 0;

  const bid1 = currentBid === 0 ? safeBasePrice : nextCalculated;
  const bid2 = calculateNextBid(bid1, safeBasePrice);
  const bid3 = calculateNextBid(bid2, safeBasePrice);

  const handleCustomBidChange = (val: string) => {
    setCustomBidStr(val);
    const amount = parseFloat(val);
    if (isNaN(amount) || amount <= 0) {
      setCustomError(null);
      return;
    }
    if (amount < bid1) {
      setCustomError(`Minimum bid is ₹${bid1.toFixed(2)} Cr`);
      return;
    }
    if (!canAffordBid(myPurse, amount, mySquadSize)) {
      setCustomError("Exceeds remaining purse ceiling");
      return;
    }
    setCustomError(null);
  };

  const handlePlaceCustomBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customBidStr);
    if (isNaN(amount) || amount < bid1 || customError) return;
    await handleBid(amount);
    setCustomBidStr("");
  };

  if (isSpectator || !playerTeam) {
    return (
      <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center text-xs font-mono font-bold text-zinc-400">
        👁️ SPECTATING LIVE WAR ROOM
      </div>
    );
  }

  const isOverseasLimit = isOverseasPlayer && myOverseas >= IPL_RULES.MAX_OVERSEAS;
  const isSquadLimit = mySquadSize >= IPL_RULES.MAX_SQUAD_SIZE;
  const isRosterValid = !isSquadLimit && !isOverseasLimit;

  return (
    <div className="w-full flex flex-col gap-3">
      {isSoldOrUnsold ? (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 text-center font-display font-black text-2xl uppercase tracking-widest text-emerald-400">
          {currentBid > 0 ? "AUCTION COMPLETED — SOLD!" : "UNSOLD"}
        </div>
      ) : (
        <>
          {!isRosterValid && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl p-3 text-xs font-mono font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{isSquadLimit ? "Squad roster full (25/25)" : "Overseas limit reached (8/8)"}</span>
            </div>
          )}

          {isHighest && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-xs font-mono font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                YOU HOLD HIGHEST BID AT ₹{currentBid.toFixed(2)} Cr
              </span>
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest">LEADING</span>
            </div>
          )}

          {isRosterValid && !isHighest && (
            <div className="space-y-3">
              {/* Quick Bid Increment Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { amount: bid1, label: "Min Bid" },
                  { amount: bid2, label: "+1 Step" },
                  { amount: bid3, label: "+2 Steps" },
                ].map((option, idx) => {
                  const affordable = canAffordBid(myPurse, option.amount, mySquadSize);
                  const esc = getBidEscalationColor(option.amount);
                  return (
                    <Button
                      key={idx}
                      onClick={() => handleBid(option.amount)}
                      disabled={!affordable || isBidding}
                      className={`h-16 flex flex-col items-center justify-center rounded-xl font-mono transition-all ${
                        affordable && idx === 0
                          ? "bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-lg shadow-red-500/25"
                          : "glass-panel border-white/10 hover:border-amber-400/40 text-white"
                      } ${!affordable ? "opacity-30 cursor-not-allowed" : ""}`}
                    >
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                        {option.label}
                      </span>
                      <span className="text-sm font-black tabular-nums">{formatPriceCr(option.amount)}</span>
                    </Button>
                  );
                })}
              </div>

              {/* Custom Bid Input */}
              <form onSubmit={handlePlaceCustomBid} className="flex gap-2">
                <input
                  type="number"
                  step="0.05"
                  min={bid1}
                  value={customBidStr}
                  onChange={(e) => handleCustomBidChange(e.target.value)}
                  placeholder={`Custom Bid (Min ₹${bid1.toFixed(2)} Cr)`}
                  disabled={isBidding}
                  className="flex-1 h-12 bg-black/40 border border-white/15 rounded-xl px-4 text-sm font-mono text-white placeholder:text-zinc-600 focus:border-amber-400"
                />
                <Button
                  type="submit"
                  disabled={!customBidStr || !!customError || isBidding}
                  className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-black font-mono font-bold text-xs uppercase"
                >
                  {isBidding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Custom Bid"}
                </Button>
              </form>

              {customError && (
                <p className="text-xs font-mono font-bold text-red-400 px-1">{customError}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

