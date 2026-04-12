"use client";

import { useAuction } from "./AuctionContext";
import { Button } from "@/components/ui/button";
import { Loader2, Gavel } from "lucide-react";
import { formatPriceCr, IPL_RULES } from "@/lib/auction-engine";

export function BidControls() {
  const { 
    room, currentPlayer, playerTeam, isBidding, isHighest, 
    timeLeft, canLegallyBid, nextCalculated, handleBid, 
    mySquadSize, myOverseas, isOverseasPlayer 
  } = useAuction();

  if (!currentPlayer || room?.status !== "active") return null;

  const isSoldOrUnsold = timeLeft !== null && timeLeft <= 0;

  return (
    <div className="flex justify-end mt-2">
      <div className="flex flex-col gap-2 relative group w-full md:w-auto min-w-[280px]">
        {isSoldOrUnsold ? (
          <div className="h-16 px-10 flex items-center justify-center text-2xl font-black rounded-[14px] bg-black/40 border border-white/[0.02] uppercase tracking-[0.2em] shadow-inner text-center">
            {Number(room?.current_bid_cr) > 0 ? (
              <span className="text-green-500 animate-fade-in flex items-center gap-2">
                <Gavel className="h-6 w-6" /> SOLD!
              </span>
            ) : (
              <span className="text-zinc-500 animate-fade-in">UNSOLD</span>
            )}
          </div>
        ) : (
          <>
            <Button
              onClick={handleBid}
              disabled={isHighest || !canLegallyBid || isBidding || !playerTeam}
              variant={isHighest || !canLegallyBid ? "secondary" : "primary"}
              className={`h-16 relative overflow-hidden transition-all text-xl font-black rounded-[14px] font-mono tracking-tight text-center justify-center
                ${isHighest ? "opacity-60 grayscale cursor-not-allowed" : ""}
                ${!canLegallyBid && !isHighest ? "bg-red-500/10 text-red-500/80 border-red-500/30 hover:bg-red-500/10 cursor-not-allowed shadow-none" : ""}
                ${canLegallyBid && !isHighest ? "shimmer-btn" : ""}
              `}
            >
              {isBidding ? <Loader2 className="h-6 w-6 animate-spin" /> : 
                !canLegallyBid && !isHighest ? "Limit Reached" :
                !playerTeam ? "Join to Bid" :
                <>
                  BID <span className="ml-1 tracking-tighter">{formatPriceCr(nextCalculated)}</span>
                </>
              }
            </Button>
            
            {/* Validation Tooltip */}
            {!canLegallyBid && !isHighest && playerTeam && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black backdrop-blur-md text-red-400 text-[10px] uppercase font-bold tracking-wider w-max px-3 py-2 rounded-lg border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-2xl flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px]">!</span>
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
