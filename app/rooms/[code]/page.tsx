"use client";

import { useAuction } from "@/components/auction/AuctionContext";
import { AuctionLobby } from "@/components/auction/AuctionLobby";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoomLobbyPage() {
  const { loading, room, roomCode } = useAuction();
  const router = useRouter();

  useEffect(() => {
    if (!loading && room) {
      if (room.status === "active" || room.status === "in_progress") {
        router.push(`/room/${roomCode}/auction`);
      } else if (room.status === "completed") {
        router.push(`/room/${roomCode}/results`);
      }
    }
  }, [loading, room, roomCode, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-6" />
        <p className="text-amber-500 font-bold tracking-widest uppercase text-sm animate-pulse">Initializing Lobby...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans flex flex-col">
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 pb-28 md:pb-8">
        <AuctionLobby />
      </main>
    </div>
  );
}
