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
  console.log("Starting Cleaned Dataset Seeder...");

  const datasetPath = path.resolve(process.cwd(), "Ipl players dataset/cleaned_players.json");
  if (!fs.existsSync(datasetPath)) {
    console.error(`Dataset not found at ${datasetPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(datasetPath, "utf8");
  const players = JSON.parse(rawData);

  console.log(`Loaded dataset: ${players.length} cleaned players found.`);

  console.log("\nUpserting Players in batches of 100...");
  const BATCH_SIZE = 100;
  let playersInserted = 0;

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const chunk = players.slice(i, i + BATCH_SIZE);
    
    // Ensure data fields match the players table columns
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
