// app/api/rooms/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/rooms/[code] — Check if a room exists by code
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data: room, error } = await supabase
    .from("rooms")
    .select("id, room_code, status, auction_mode, timer_duration, max_players, created_at")
    .eq("room_code", code.toUpperCase())
    .single();

  if (error || !room) {
    return NextResponse.json(
      { error: "Room not found — check the code and try again." },
      { status: 404 }
    );
  }

  // Get player count
  const { count } = await supabase
    .from("room_franchises")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);

  return NextResponse.json({
    ...room,
    playerCount: count || 0,
  });
}
