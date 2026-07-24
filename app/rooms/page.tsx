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
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

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
    const channel = supabase
      .channel("browse-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, fetchRooms)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRooms]);

  const openRooms = rooms.filter((r) => r.status === "waiting");
  const liveRooms = rooms.filter((r) => r.status === "active" || r.status === "in_progress");

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-2">
            <Radio className="h-3.5 w-3.5 animate-pulse text-amber-400" />
            Lobby Discovery Center
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            LIVE AUCTION ROOMS
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Join an open war room or spectate active bidding wars in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => { setLoading(true); fetchRooms(); }}
            className="border-white/10 text-zinc-300 font-mono text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh
          </Button>
          <Link href="/">
            <Button className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider">
              <Plus className="h-4 w-4 mr-1.5" /> Launch Room
            </Button>
          </Link>
        </div>
      </div>

      {/* Room Lists */}
      {loading && rooms.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="glass-panel h-28 rounded-2xl border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center border-dashed border-white/10 max-w-xl mx-auto">
          <Globe2 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl text-white mb-2">No active rooms found</h2>
          <p className="text-xs text-zinc-500 font-mono mb-6">
            Create your private war room and invite rival managers using your 6-character room code.
          </p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider">
              Create Room Now
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Waiting Lobbies */}
          {openRooms.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                Waiting For Managers ({openRooms.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openRooms.map((room) => (
                  <div
                    key={room.id}
                    className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center justify-between hover:border-emerald-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-xl text-white tracking-widest">
                          {room.room_code}
                        </span>
                        <Badge variant="success">OPEN</Badge>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans">
                        Host: <span className="text-zinc-200 font-bold">{room.creatorName || "Manager"}</span>
                      </p>
                      <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                        {room.playerCount}/10 Franchises Joined · Created {timeAgo(room.created_at)}
                      </span>
                    </div>

                    <Link href={`/?code=${room.room_code}`}>
                      <Button className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-mono text-xs font-bold">
                        <LogIn className="h-3.5 w-3.5 mr-1.5" /> Join Room
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Bidding Rooms */}
          {liveRooms.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-red-400" />
                Live Bidding Wars ({liveRooms.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveRooms.map((room) => (
                  <div
                    key={room.id}
                    className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center justify-between hover:border-red-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-xl text-white tracking-widest">
                          {room.room_code}
                        </span>
                        <Badge variant="marquee">LIVE DRAFT</Badge>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans">
                        Host: <span className="text-zinc-200 font-bold">{room.creatorName || "Manager"}</span>
                      </p>
                      <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                        {room.playerCount}/10 Franchises Bidding · Started {timeAgo(room.created_at)}
                      </span>
                    </div>

                    <Link href={`/rooms/${room.room_code}?spectate=true`}>
                      <Button variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 font-mono text-xs font-bold">
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> Spectate
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

