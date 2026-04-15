// app/api/rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I,O,0,1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * POST /api/rooms — Create a new room with a unique 6-char code
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerName, playerTeam, auctionMode } = body;

    if (!playerName || !playerTeam) {
      return NextResponse.json(
        { error: "playerName and playerTeam are required" },
        { status: 400 }
      );
    }

    // Generate unique room code (retry if collision)
    let roomCode = generateRoomCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("rooms")
        .select("id")
        .eq("room_code", roomCode)
        .single();
      if (!existing) break;
      roomCode = generateRoomCode();
      attempts++;
    }

    // Create room
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert([{
        status: "waiting",
        room_code: roomCode,
        auction_mode: auctionMode || null,
        timer_duration: 10,
      }])
      .select()
      .single();

    if (roomError) {
      console.error("Room creation error:", roomError);
      return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }

    // Add creator as host
    const { error: franchiseError } = await supabase
      .from("room_franchises")
      .insert([{
        room_id: room.id,
        team_id: playerTeam,
        user_name: playerName,
        is_host: true,
        purse_remaining_cr: 120.0,
        squad_count: 0,
        overseas_count: 0,
      }]);

    if (franchiseError) {
      console.error("Franchise insert error:", franchiseError);
      return NextResponse.json({ error: "Failed to join room as host" }, { status: 500 });
    }

    return NextResponse.json({
      roomCode: room.room_code,
      roomId: room.id,
    });
  } catch (err: any) {
    console.error("POST /api/rooms error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/rooms — List all public rooms
 */
export async function GET() {
  try {
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("id, room_code, status, auction_mode, timer_duration, max_players, created_at")
      .in("status", ["waiting", "active"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }

    // Augment with player counts
    const roomsWithCounts = await Promise.all(
      (rooms || []).map(async (room) => {
        const { count } = await supabase
          .from("room_franchises")
          .select("*", { count: "exact", head: true })
          .eq("room_id", room.id);
        return { ...room, playerCount: count || 0 };
      })
    );

    return NextResponse.json({ rooms: roomsWithCounts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
