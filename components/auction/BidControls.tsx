"use client";

import { useAuction } from "./AuctionContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatPriceCr, IPL_RULES } from "@/lib/auction-engine";

export function BidControls() {
  const { 
    room, currentPlayer, playerTeam, isBidding, isHighest, 
    timeLeft, canLegallyBid, nextCalculated, handleBid, 
    mySquadSize, myOverseas, isOverseasPlayer 
  } = useAuction();

  if (!currentPlayer || room?.status !== "active") return null;

  return (
    <div className="flex justify-end mt-4">
      <div className="flex flex-col gap-2 relative group md:w-auto w-full">
        {timeLeft !== null && timeLeft <= 0 ? (
          <div className="h-16 px-10 flex items-center justify-center text-xl sm:text-2xl font-black rounded-xl bg-slate-900 border-2 border-slate-800 text-green-500 tracking-widest shadow-inner w-full md:w-auto">
            {Number(room?.current_bid_cr) > 0 ? "SOLD!" : "UNSOLD"}
          </div>
        ) : (
          <>
            <Button
              onClick={handleBid}
              disabled={isHighest || (timeLeft !== null && timeLeft <= 0) || !canLegallyBid || isBidding || !playerTeam}
              className={`h-16 px-8 relative overflow-hidden transition-all text-xl font-black rounded-xl tabular-nums w-full md:w-auto
                ${isHighest
                  ? "bg-white/[0.04] text-white/50 border border-white/[0.06] cursor-not-allowed text-sm hover:bg-white/[0.04]"
                  : !canLegallyBid
                    ? "bg-red-500/10 text-red-500/80 border border-red-500/20 cursor-not-allowed text-sm hover:bg-red-500/10"
                    : isBidding
                      ? "bg-blue-600/80 text-white cursor-wait"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] border border-blue-400"
                }`}
            >
              {isBidding ? <Loader2 className="h-6 w-6 animate-spin" /> : 
                isHighest ? "Highest Bidder" :
                !canLegallyBid ? "Limit Reached" :
                !playerTeam ? "Join to Bid" :
                `BID ${formatPriceCr(nextCalculated)}`}
            </Button>
            
            {/* Validation Tooltip */}
            {!canLegallyBid && !isHighest && playerTeam && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm text-red-400 text-[10px] uppercase font-bold tracking-wider w-max px-3 py-2 rounded-lg border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl">
                {mySquadSize >= IPL_RULES.MAX_SQUAD_SIZE ? `Squad Full (${IPL_RULES.MAX_SQUAD_SIZE} max)`
                  : isOverseasPlayer && myOverseas >= IPL_RULES.MAX_OVERSEAS ? `Overseas Limit (${IPL_RULES.MAX_OVERSEAS} max)`
                    : `Insufficient funds`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
