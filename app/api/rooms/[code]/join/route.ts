// app/api/rooms/[code]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/rooms/[code]/join — Join a room by code
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json();
  const { playerName, playerTeam } = body;

  if (!playerName || !playerTeam) {
    return NextResponse.json(
      { error: "playerName and playerTeam are required" },
      { status: 400 }
    );
  }

  // Find room
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, room_code, status, max_players")
    .eq("room_code", code.toUpperCase())
    .single();

  if (roomError || !room) {
    return NextResponse.json(
      { error: "Room not found — check the code and try again." },
      { status: 404 }
    );
  }

  // Check if auction already started — join as spectator
  const isSpectator = room.status === "active" || room.status === "in_progress";

  // Get player count
  const { count } = await supabase
    .from("room_franchises")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);

  const maxPlayers = room.max_players || 10;

  if (!isSpectator && (count || 0) >= maxPlayers) {
    return NextResponse.json(
      { error: `This room is full (${maxPlayers}/${maxPlayers} players).` },
      { status: 400 }
    );
  }

  // Check if team is already taken in this room
  const { data: existingTeam } = await supabase
    .from("room_franchises")
    .select("id")
    .eq("room_id", room.id)
    .eq("team_id", playerTeam)
    .single();

  if (existingTeam) {
    return NextResponse.json(
      { error: `${playerTeam} is already claimed in this room.` },
      { status: 400 }
    );
  }

  if (isSpectator) {
    // Spectators don't get added to room_franchises
    return NextResponse.json({
      roomId: room.id,
      roomCode: room.room_code,
      isSpectator: true,
    });
  }

  // Add to room
  const { error: insertError } = await supabase
    .from("room_franchises")
    .insert([{
      room_id: room.id,
      team_id: playerTeam,
      user_name: playerName,
      is_host: false,
      purse_remaining_cr: 120.0,
      squad_count: 0,
      overseas_count: 0,
    }]);

  if (insertError) {
    console.error("Join error:", insertError);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    roomId: room.id,
    roomCode: room.room_code,
    isSpectator: false,
  });
}
