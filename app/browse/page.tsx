"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe2,
  Users,
  Clock,
  Eye,
  LogIn,
  Loader2,
  Plus,
  RefreshCw,
  Trophy,
} from "lucide-react";

interface RoomData {
  id: string;
  room_code: string;
  status: string;
  auction_mode: string | null;
  timer_duration: number;
  created_at: string;
  playerCount: number;
}

const MODE_LABELS: Record<string, string> = {
  mock_2026: "Mock 2026",
  mega_auction: "Mega Auction",
  legends_upgraded: "Legends",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BrowseRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      if (data.rooms) setRooms(data.rooms);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(() => {
      fetchRooms();
      setLastRefresh(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const openRooms = rooms.filter((r) => r.status === "waiting");
  const liveRooms = rooms.filter((r) => r.status === "active" || r.status === "in_progress");

  const handleJoin = (code: string) => {
    const name = sessionStorage.getItem("playerName");
    const team = sessionStorage.getItem("playerTeam");
    if (!name || !team) {
      router.push("/");
      return;
    }
    router.push(`/room/${code}`);
  };

  return (
    <div className="min-h-screen bg-[#060609]">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Globe2 className="h-7 w-7 text-blue-400" />
              Browse Rooms
            </h1>
            <p className="text-slate-500 text-sm mt-1">Find an open game or watch a live auction</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setLoading(true); fetchRooms(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Room
            </Link>
          </div>
        </div>

        {loading && rooms.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : rooms.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 px-6 border-2 border-dashed border-white/[0.08] rounded-2xl">
            <Globe2 className="h-16 w-16 text-slate-700 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No active rooms right now</h2>
            <p className="text-slate-500 text-sm mb-6 text-center max-w-md">
              Be the first to create a room! Share your room code with friends and start an auction.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-amber-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create a Room
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Open Rooms */}
            {openRooms.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  <Users className="h-4 w-4 text-green-400" />
                  Open Rooms ({openRooms.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {openRooms.map((room) => (
                    <RoomCard key={room.id} room={room} onAction={() => handleJoin(room.room_code)} actionLabel="Join" actionIcon={<LogIn className="h-3.5 w-3.5" />} />
                  ))}
                </div>
              </div>
            )}

            {/* Live Auctions */}
            {liveRooms.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Live Auctions ({liveRooms.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {liveRooms.map((room) => (
                    <RoomCard key={room.id} room={room} onAction={() => handleJoin(room.room_code)} actionLabel="Watch" actionIcon={<Eye className="h-3.5 w-3.5" />} isLive />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auto-refresh indicator */}
        <p className="text-center text-[11px] text-slate-700 mt-8">
          Auto-refreshing every 5 seconds
        </p>
      </div>
    </div>
  );
}

function RoomCard({
  room,
  onAction,
  actionLabel,
  actionIcon,
  isLive,
}: {
  room: RoomData;
  onAction: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  isLive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-mono font-black text-base tracking-wider">{room.room_code}</span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {room.playerCount}/10
          </span>
          {room.auction_mode && (
            <span>{MODE_LABELS[room.auction_mode] || room.auction_mode}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(room.created_at)}
          </span>
        </div>
      </div>
      <button
        onClick={onAction}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
          isLive
            ? "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] border border-white/[0.08]"
            : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
        }`}
      >
        {actionIcon}
        {actionLabel}
      </button>
    </div>
  );
}
