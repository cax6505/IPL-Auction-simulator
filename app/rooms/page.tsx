"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Globe2,
  Users,
  Eye,
  LogIn,
  Plus,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/ui/AnimatedPage";
import { supabase } from "@/lib/supabase";
import { staggerItem, springTransition } from "@/lib/design-tokens";

interface RoomData {
  id: string;
  room_code: string;
  status: string;
  auction_mode: string | null;
  timer_duration: number;
  created_at: string;
  playerCount: number;
  creatorName?: string;
}

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

    // Subscribe to public rooms changes in real time
    const channel = supabase
      .channel("browse-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          fetchRooms();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_franchises" },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchRooms();
      setLastRefresh(Date.now());
    }, 15000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchRooms]);

  const openRooms = rooms.filter((r) => r.status === "waiting");
  const liveRooms = rooms.filter((r) => r.status === "active" || r.status === "in_progress");

  const handleJoin = (code: string, spectate: boolean = false) => {
    if (spectate) {
      router.push(`/rooms/${code}?spectate=true`);
    } else {
      router.push(`/?code=${code}`);
    }
  };

  return (
    <div className="min-h-screen surface-0 text-zinc-300">
      <AnimatedPage className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-[600px] bg-blue-500/[0.06] blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 mb-4 font-bold tracking-widest uppercase">
              <Globe2 className="h-3.5 w-3.5" /> Discovery
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter font-display uppercase">
              Browse <span className="gradient-text-accent">Rooms</span>
            </h1>
            <p className="text-zinc-400 text-base mt-2 font-medium">Find an open drafted game or spectate a live auction.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => { setLoading(true); fetchRooms(); }}
              className="text-zinc-400"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin text-red-400" : ""}`} />
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
          <div className="space-y-8">
            <div className="border-b border-white/[0.05] pb-4 mb-6">
              <div className="h-6 w-48 bg-white/[0.04] rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
            </div>
          </div>
        ) : rooms.length === 0 ? (
          /* Empty State */
          <motion.div
            className="glass-card flex flex-col items-center justify-center py-28 px-6 rounded-2xl border-dashed border-white/[0.08] text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="h-20 w-20 bg-white/[0.02] rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/[0.05]">
              <Globe2 className="h-10 w-10 text-zinc-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-display uppercase">No active rooms right now</h2>
            <p className="text-zinc-500 text-sm mb-8 max-w-md font-medium">
              Be the first to create a room! Share your 6-digit access code with friends to start an auction.
            </p>
            <Link href="/">
              <Button variant="primary" size="lg" className="shimmer-btn">
                <Plus className="h-5 w-5 mr-2" />
                Create a Room
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* Open Rooms */}
            {openRooms.length > 0 && (
              <section>
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
                  {openRooms.map((room, i) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <RoomCard room={room} onAction={() => handleJoin(room.room_code, false)} isLive={false} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Live Auctions */}
            {liveRooms.length > 0 && (
              <section>
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-white">
                    <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                      <Trophy className="h-4 w-4 text-red-400" />
                    </div>
                    Live Auctions
                  </h2>
                  <Badge variant="outline">{liveRooms.length} Active</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveRooms.map((room, i) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <RoomCard room={room} onAction={() => handleJoin(room.room_code, true)} isLive={true} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="flex justify-center mt-12 mb-8">
          <div className="inline-flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-widest text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500/50 animate-pulse" />
            Auto-syncing data
          </div>
        </div>
      </AnimatedPage>
    </div>
  );
}

function RoomCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-l-4 border-l-transparent animate-pulse bg-white/[0.02] border-white/[0.04]">
      <div className="flex flex-col gap-2.5 flex-1">
        <div className="flex items-center gap-3">
          <div className="h-6 w-20 bg-white/[0.04] rounded" />
          <div className="h-5 w-12 bg-white/[0.04] rounded-full" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 w-16 bg-white/[0.04] rounded" />
          <div className="h-4 w-24 bg-white/[0.04] rounded" />
          <div className="h-4 w-16 bg-white/[0.04] rounded" />
        </div>
      </div>
      <div className="h-10 w-full sm:w-28 bg-white/[0.04] rounded-lg shrink-0" />
    </div>
  );
}

function RoomCard({
  room,
  onAction,
  isLive,
}: {
  room: RoomData;
  onAction: () => void;
  isLive: boolean;
}) {
  return (
    <motion.div
      className="glass-card hover:glass-card-hover rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all group border-l-4 border-l-transparent hover:border-l-red-500"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-black tracking-wider text-white group-hover:gradient-text-accent transition-colors">{room.room_code}</span>
          {isLive ? (
            <Badge dot dotColor="bg-red-400" className="bg-red-500/10 text-red-400 border border-red-500/20 animate-glow">
              LIVE
            </Badge>
          ) : (
            <Badge variant="success" dot dotColor="bg-green-400">
              OPEN
            </Badge>
          )}
        </div>

        <p className="text-xs text-zinc-500 font-medium">
          Creator: <span className="text-zinc-300 font-bold">{room.creatorName || "Unknown Manager"}</span>
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-400">
          <span className="flex items-center gap-1.5 bg-white/[0.03] px-2 py-1 rounded">
            <Users className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-zinc-200 font-bold">{room.playerCount}</span>/10
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 bg-zinc-600 rounded-full" />
            Mega Auction
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 bg-zinc-600 rounded-full" />
            {timeAgo(room.created_at)}
          </span>
        </div>
      </div>

      <motion.div whileTap={{ scale: 0.95 }} transition={springTransition}>
        <Button
          onClick={onAction}
          variant={isLive ? "outline" : "default"}
          className={!isLive ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 shadow-none w-full sm:w-auto" : "w-full sm:w-auto"}
        >
          {isLive ? <Eye className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
          {isLive ? "Spectate" : "Join Room"}
        </Button>
      </motion.div>
    </motion.div>
  );
}
