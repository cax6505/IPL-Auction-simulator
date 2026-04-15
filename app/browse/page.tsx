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
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  legends_upgraded: "Legends Upgraded",
  legends_auction: "Legends Auction",
};

const MODE_COLORS: Record<string, string> = {
  mock_2026: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  mega_auction: "text-zinc-300 bg-zinc-500/10 border-zinc-500/20",
  legends_upgraded: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  legends_auction: "text-purple-400 bg-purple-500/10 border-purple-500/20",
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
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const openRooms = rooms.filter((r) => r.status === "waiting");
  const liveRooms = rooms.filter((r) => r.status === "active");
  const completedRooms = rooms.filter((r) => r.status === "completed");

  const handleJoin = (code: string) => {
    const name = sessionStorage.getItem("playerName");
    const team = sessionStorage.getItem("playerTeam");
    if (!name || !team) {
      router.push("/");
      return;
    }
    router.push(`/room/${code}`);
  };

  const hasAnyRooms = openRooms.length > 0 || liveRooms.length > 0 || completedRooms.length > 0;

  return (
    <div className="min-h-screen surface-0 text-zinc-300">
      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-[600px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 mb-4 font-bold tracking-widest uppercase">
              <Globe2 className="h-3.5 w-3.5" /> Discovery
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Browse Rooms
            </h1>
            <p className="text-zinc-400 text-base mt-2 font-medium">Find an open lobby, spectate a live auction, or review completed games.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => { setLoading(true); fetchRooms(); }}
              className="text-zinc-400"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin text-amber-500" : ""}`} />
              Refresh
            </Button>
            <Link href="/">
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </Link>
          </div>
        </div>

        {loading && rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-4" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Scanning network...</span>
          </div>
        ) : !hasAnyRooms ? (
          /* Empty State */
          <div className="glass-card flex flex-col items-center justify-center py-28 px-6 rounded-2xl border-dashed border-white/[0.08] text-center animate-scale-in">
            <div className="h-20 w-20 bg-white/[0.02] rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/[0.05]">
              <Globe2 className="h-10 w-10 text-zinc-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No active rooms right now</h2>
            <p className="text-zinc-500 text-sm mb-8 max-w-md font-medium">
              Be the first to create a room! Share your 6-digit access code with friends to start an auction.
            </p>
            <Link href="/">
              <Button variant="primary" size="lg" className="shimmer-btn">
                <Plus className="h-5 w-5 mr-2" />
                Create a Room
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-12">

            {/* Open Lobbies */}
            {openRooms.length > 0 && (
              <section className="animate-fade-up">
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <Users className="h-4 w-4 text-green-400" />
                    </div>
                    Waiting in Lobby
                  </h2>
                  <Badge variant="outline">{openRooms.length} Open</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {openRooms.map((room) => (
                    <RoomCard key={room.id} room={room} onAction={() => handleJoin(room.room_code)} variant="open" />
                  ))}
                </div>
              </section>
            )}

            {/* Live Auctions */}
            {liveRooms.length > 0 && (
              <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Trophy className="h-4 w-4 text-amber-500" />
                    </div>
                    Live Auctions
                  </h2>
                  <Badge variant="outline">{liveRooms.length} Active</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveRooms.map((room) => (
                    <RoomCard key={room.id} room={room} onAction={() => handleJoin(room.room_code)} variant="live" />
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completedRooms.length > 0 && (
              <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
                    <div className="h-8 w-8 rounded-full bg-zinc-500/10 flex items-center justify-center border border-zinc-500/20">
                      <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                    </div>
                    Recently Completed
                  </h2>
                  <Badge variant="outline">{completedRooms.length} Ended</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedRooms.map((room) => (
                    <RoomCard key={room.id} room={room} onAction={() => handleJoin(room.room_code)} variant="completed" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="flex justify-center mt-12 mb-8">
          <div className="inline-flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-widest text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500/50 animate-pulse" />
            Auto-syncing every 5s
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomCard({
  room,
  onAction,
  variant,
}: {
  room: RoomData;
  onAction: () => void;
  variant: "open" | "live" | "completed";
}) {
  const modeColor = room.auction_mode ? MODE_COLORS[room.auction_mode] || "" : "";

  const statusConfig = {
    open: {
      badge: <Badge dot dotColor="bg-green-400" variant="success">OPEN</Badge>,
      buttonLabel: "Join Room",
      buttonIcon: <LogIn className="h-4 w-4 mr-2" />,
      buttonClass: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/20 shadow-none",
      borderAccent: "hover:border-l-green-500",
    },
    live: {
      badge: <Badge dot dotColor="bg-amber-400" className="bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-glow">LIVE</Badge>,
      buttonLabel: "Spectate",
      buttonIcon: <Eye className="h-4 w-4 mr-2" />,
      buttonClass: "",
      borderAccent: "hover:border-l-amber-500",
    },
    completed: {
      badge: <Badge variant="outline" className="text-zinc-500 border-zinc-700">ENDED</Badge>,
      buttonLabel: "View Results",
      buttonIcon: <Eye className="h-4 w-4 mr-2" />,
      buttonClass: "text-zinc-500 border-zinc-700 hover:text-zinc-300",
      borderAccent: "hover:border-l-zinc-500",
    },
  };

  const config = statusConfig[variant];

  return (
    <div className={`glass-card hover:glass-card-hover rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all group border-l-4 border-l-transparent ${config.borderAccent} ${variant === "completed" ? "opacity-60 hover:opacity-90" : ""}`}>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-black tracking-wider text-white group-hover:text-amber-400 transition-colors">{room.room_code}</span>
          {config.badge}
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-400">
          <span className="flex items-center gap-1.5 bg-white/[0.03] px-2 py-1 rounded">
            <Users className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-zinc-200 font-bold">{room.playerCount}</span>/10
          </span>
          {room.auction_mode && (
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold border ${modeColor}`}>
              {MODE_LABELS[room.auction_mode] || room.auction_mode}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-zinc-500">
            <Clock className="h-3 w-3" />
            {timeAgo(room.created_at)}
          </span>
        </div>
      </div>
      
      <Button
        onClick={onAction}
        variant={variant === "live" || variant === "completed" ? "outline" : "default"}
        className={`w-full sm:w-auto ${config.buttonClass}`}
      >
        {config.buttonIcon}
        {config.buttonLabel}
      </Button>
    </div>
  );
}
