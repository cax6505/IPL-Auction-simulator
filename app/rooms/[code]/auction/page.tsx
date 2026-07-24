"use client";

import { useAuction } from "@/components/auction/AuctionContext";
import { TeamsScoreboard } from "@/components/auction/TeamsScoreboard";
import { ActivePlayerCard } from "@/components/auction/ActivePlayerCard";
import { BidControls } from "@/components/auction/BidControls";
import { AuctionTabs } from "@/components/auction/AuctionTabs";
import { AuctionHeader } from "@/components/auction/AuctionHeader";
import { AuctionOverlays } from "@/components/auction/AuctionOverlays";
import { UpcomingQueue } from "@/components/auction/UpcomingQueue";
import MySquadDrawer from "@/components/auction/MySquadDrawer";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuctionRoomPage() {
  const { loading, room, roomCode, playerTeam } = useAuction();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && room) {
      if (room.status === "waiting") {
        router.push(`/rooms/${roomCode}`);
      } else if (room.status === "completed") {
        router.push(`/rooms/${roomCode}/results`);
      }
    }
  }, [loading, room, roomCode, router]);

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-6" />
        <p className="text-amber-500 font-bold tracking-widest uppercase text-sm animate-pulse">Entering War Room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans flex flex-col">
      {/* Top Header Controls */}
      <AuctionHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 pb-16">
        {/* Top Area: Live Bidding and Scoreboards */}
        <div className="w-full flex flex-col gap-6">
          {/* Claimed Teams Stats Strip */}
          <TeamsScoreboard />

          {/* Active Bidding Card */}
          <ActivePlayerCard />

          {/* Up Next Queue */}
          <UpcomingQueue />

          {/* Controls Bar & Floating Roster Trigger */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {playerTeam && (
                <Button 
                  onClick={() => setDrawerOpen(true)}
                  variant="outline" 
                  className="w-full sm:w-auto border-white/10 hover:bg-white/5 hover:border-white/20 h-11 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider rounded-xl"
                >
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  My Squad Details
                </Button>
              )}
            </div>
            <BidControls />
          </div>
        </div>

        {/* Bottom Section: Room Chat, Activity Feed, Franchises, & Roster */}
        <div className="w-full mt-4">
          <AuctionTabs />
        </div>
      </main>

      {/* Global Overlays (Confetti, SOLD, UNSOLD, Squads Modal) */}
      <AuctionOverlays />

      {/* Slide-out My Squad Drawer */}
      {playerTeam && (
        <MySquadDrawer 
          isOpen={drawerOpen} 
          onClose={() => setDrawerOpen(false)} 
        />
      )}
    </div>
  );
}
