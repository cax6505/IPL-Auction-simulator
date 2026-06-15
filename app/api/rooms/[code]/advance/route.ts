// app/api/rooms/[code]/advance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/rooms/[code]/advance — Server-side auction advancement.
 * Any connected client can call this when the timer expires.
 * The database RPC handles idempotency (double-advance prevention).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const expectedPlayerId = body.expectedPlayerId || null;

    // Resolve room by code
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_code", code.toUpperCase())
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Call the transactional RPC
    const { data, error } = await supabase.rpc("advance_auction", {
      p_room_id: room.id,
      p_expected_player_id: expectedPlayerId,
    });

    if (error) {
      console.error("advance_auction RPC error:", error);
      return NextResponse.json(
        { error: "Failed to advance auction", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("POST /api/rooms/[code]/advance error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
