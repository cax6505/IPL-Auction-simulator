import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("🚀 Starting Cleaned Database Seeding...");

  // 1. Read teams and players data
  const datasetPath = path.resolve(process.cwd(), "Ipl players dataset/cleaned_players.json");
  const curatedPath = path.resolve(process.cwd(), "Ipl players dataset/ipl_players_2026.json");

  if (!fs.existsSync(datasetPath)) {
    console.error(`Dataset not found at ${datasetPath}`);
    process.exit(1);
  }

  const rawCleaned = fs.readFileSync(datasetPath, "utf8");
  const players = JSON.parse(rawCleaned);

  let teams: any[] = [];
  if (fs.existsSync(curatedPath)) {
    const curatedData = JSON.parse(fs.readFileSync(curatedPath, "utf8"));
    teams = curatedData.teams || [];
  }

  console.log(`Loaded dataset: ${players.length} consolidated players.`);

  // 2. Safe Database Cleanup
  console.log("\n🧹 Cleaning database tables to prevent duplicates and constraint errors...");
  
  // Unbind active players in rooms
  const { error: err1 } = await supabase.from("rooms").update({ current_player_id: null, current_highest_bidder_id: null });
  if (err1) console.warn("Note: could not update rooms:", err1.message);

  // Clear bids
  const { error: err2 } = await supabase.from("bids").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (err2) console.warn("Note: could not delete bids:", err2.message);

  // Clear sold players
  const { error: err3 } = await supabase.from("room_sold_players").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (err3) console.warn("Note: could not delete room_sold_players:", err3.message);

  // Clear room franchises
  const { error: err4 } = await supabase.from("room_franchises").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (err4) console.warn("Note: could not delete room_franchises:", err4.message);

  // Clear active rooms
  const { error: err5 } = await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (err5) console.warn("Note: could not delete rooms:", err5.message);

  // Clear existing players
  const { error: err6 } = await supabase.from("players").delete().neq("id", "dummy-id");
  if (err6) console.error("Error clearing players table:", err6.message);
  else console.log("✅ Players table cleared successfully.");

  // 3. Seed Teams (required before players for FK reference)
  if (teams.length > 0) {
    console.log("\n🌱 Seeding Teams...");
    const { error: teamError } = await supabase.from("teams").upsert(teams);
    if (teamError) {
      console.error("❌ Failed to upsert teams:", teamError.message);
      process.exit(1);
    }
    console.log("✅ Teams successfully upserted!");
  }

  // 4. Batch Seed Consolidated Players
  console.log("\n🌱 Seeding Consolidated Players in batches of 100...");
  const BATCH_SIZE = 100;
  let playersInserted = 0;

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const chunk = players.slice(i, i + BATCH_SIZE);
    
    const sanitizedChunk = chunk.map((p: any) => ({
      id: p.id,
      name: p.name,
      nationality: p.nationality,
      is_overseas: p.is_overseas,
      capped_status: p.capped_status || "uncapped",
      role: p.role,
      batting_style: p.batting_style || null,
      bowling_style: p.bowling_style || null,
      ipl_team_2026: p.ipl_team_2026 || null,
      ipl_team_2025: p.ipl_team_2025 || null,
      contract_type_2026: p.contract_type_2026 || "AUCTION",
      base_price_cr: p.base_price_cr,
      sold_price_cr: p.sold_price_cr || null,
      auction_year: p.auction_year || 2026,
      auction_set: p.auction_set || null,
      retention_cost_cr: p.retention_cost_cr || null,
      rtm_used: p.rtm_used || false,
      all_time_auctions: p.all_time_auctions || [],
    }));

    const { error: playerError } = await supabase.from("players").upsert(sanitizedChunk);

    if (playerError) {
      console.error(`❌ Error in batch ${i / BATCH_SIZE + 1}:`, playerError.message);
    } else {
      playersInserted += chunk.length;
      console.log(`✅ Batch ${i / BATCH_SIZE + 1} completed (${playersInserted}/${players.length} total)`);
    }
  }

  console.log("\n🎉 Cleaned players database fully seeded successfully!");
}

main().catch(console.error);
