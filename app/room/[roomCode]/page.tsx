"use client";

import { AuctionProvider, useAuction } from "@/components/auction/AuctionContext";
import { AuctionHeader } from "@/components/auction/AuctionHeader";
import { AuctionLobby } from "@/components/auction/AuctionLobby";
import { ActivePlayerCard } from "@/components/auction/ActivePlayerCard";
import { BidControls } from "@/components/auction/BidControls";
import { AuctionTabs } from "@/components/auction/AuctionTabs";
import { AuctionOverlays } from "@/components/auction/AuctionOverlays";
import { AuctionStatsButton } from "@/components/auction/AuctionStats";
import { Loader2 } from "lucide-react";

function AuctionRoomInner() {
  const { loading, room } = useAuction();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-6" />
        <p className="text-amber-500 font-bold tracking-widest uppercase text-sm animate-pulse">Initializing War Room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans flex flex-col">
      <AuctionHeader />
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {room?.status === "waiting" ? (
          <AuctionLobby />
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
            <ActivePlayerCard />
            <BidControls />
          </div>
        )}
        <AuctionTabs />
      </main>

      <AuctionOverlays />
      <AuctionStatsButton />
    </div>
  );
}

export default function RoomPage() {
  return (
    <AuctionProvider>
      <AuctionRoomInner />
    </AuctionProvider>
  );
}
