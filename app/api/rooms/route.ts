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
    const { playerName, playerTeam, auctionMode, timerDuration, startingPurse } = body;

    if (!playerName || !playerTeam) {
      return NextResponse.json(
        { error: "playerName and playerTeam are required" },
        { status: 400 }
      );
    }

    // Validate & clamp optional parameters
    const mode = "mega_auction";
    const timer = Math.min(Math.max(Number(timerDuration) || 10, 5), 30);
    const purse = [80, 100, 120, 125].includes(Number(startingPurse)) ? Number(startingPurse) : 120;

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

    // Create room with custom settings
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert([{
        status: "waiting",
        room_code: roomCode,
        auction_mode: mode,
        timer_duration: timer,
      }])
      .select()
      .single();

    if (roomError) {
      console.error("Room creation error:", roomError);
      return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }

    // Add creator as host with custom purse
    const { error: franchiseError } = await supabase
      .from("room_franchises")
      .insert([{
        room_id: room.id,
        team_id: playerTeam,
        user_name: playerName,
        is_host: true,
        purse_remaining_cr: purse,
        squad_count: 0,
        overseas_count: 0,
      }]);

    if (franchiseError) {
      console.error("Franchise insert error:", franchiseError);
      // Clean up orphaned room if franchise creation failed
      await supabase.from("rooms").delete().eq("id", room.id);
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
 * GET /api/rooms — List active, non-empty public rooms created in the last 24 hours
 */
export async function GET() {
  try {
    let rooms: any[] | null = null;
    let error: any = null;

    // Only query rooms created within the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const queryRes = await supabase
      .from("rooms")
      .select("id, room_code, status, auction_mode, timer_duration, max_players, created_at, is_private")
      .in("status", ["waiting", "active"])
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    rooms = queryRes.data;
    error = queryRes.error;

    if (error && error.message.includes("is_private")) {
      // Fallback if the is_private column does not exist yet
      const fallback = await supabase
        .from("rooms")
        .select("id, room_code, status, auction_mode, timer_duration, max_players, created_at")
        .in("status", ["waiting", "active"])
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: false })
        .limit(50);
      rooms = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }

    // Filter out private rooms in memory if column was selected
    let filteredRooms = rooms || [];
    if (filteredRooms.length > 0 && "is_private" in filteredRooms[0]) {
      filteredRooms = filteredRooms.filter((r: any) => !r.is_private);
    }

    // Augment with player counts and creator names
    const roomsWithDetails = await Promise.all(
      filteredRooms.map(async (room: any) => {
        const { count } = await supabase
          .from("room_franchises")
          .select("*", { count: "exact", head: true })
          .eq("room_id", room.id);

        const { data: hostData } = await supabase
          .from("room_franchises")
          .select("user_name")
          .eq("room_id", room.id)
          .eq("is_host", true)
          .maybeSingle();

        return {
          ...room,
          playerCount: count || 0,
          creatorName: hostData?.user_name || "Unknown Manager"
        };
      })
    );

    // ONLY return valid rooms that actually have at least 1 claimed franchise!
    // This eliminates ghost / abandoned / un-created rooms.
    const activeValidRooms = roomsWithDetails.filter((r: any) => r.playerCount > 0);

    // Clean up empty ghost rooms (0 players) older than 30 mins in the background
    const emptyRoomIds = roomsWithDetails.filter((r: any) => r.playerCount === 0).map((r: any) => r.id);
    if (emptyRoomIds.length > 0) {
      supabase.from("rooms").delete().in("id", emptyRoomIds).then(() => {}, () => {});
    }

    return NextResponse.json({ rooms: activeValidRooms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
