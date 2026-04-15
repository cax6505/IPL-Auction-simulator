import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { TeamRecord, RawPlayer } from "../lib/types/player";

// Load environment variables locally
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Starting Dataset Seeder...");

  // 1. Read the JSON file
  const datasetPath = path.resolve(process.cwd(), "Ipl players dataset/ipl_players_2026.json");
  if (!fs.existsSync(datasetPath)) {
    console.error(`Dataset not found at ${datasetPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(datasetPath, "utf8");
  const dataset = JSON.parse(rawData);

  const teams: TeamRecord[] = dataset.teams;
  const players: RawPlayer[] = dataset.players;

  console.log(`Loaded dataset: ${teams.length} teams, ${players.length} players found.`);

  // 2. Upsert Teams First (Foreign Key requirement)
  console.log("\nUpserting Teams...");
  const { error: teamError } = await supabase.from("teams").upsert(teams);
  if (teamError) {
    console.error("Failed to upsert teams:", teamError.message);
    process.exit(1);
  }
  console.log("✅ Teams successfully upserted!");

  // 3. Upsert Players in Chunks (Prevent API payload limits)
  console.log("\nUpserting Players in batches of 100...");
  const BATCH_SIZE = 100;
  let playersInserted = 0;

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const chunk = players.slice(i, i + BATCH_SIZE);
    
    // Ensure `ipl_team_2026` or `2025` is purely null instead of empty string or unreferenced items
    // Legend players have no team assignment
    const sanitizedChunk = chunk.map((p) => ({
      ...p,
      ipl_team_2026: p.ipl_team_2026 || null,
      ipl_team_2025: p.ipl_team_2025 || null,
      is_legend: p.is_legend ?? false,
    }));

    const { error: playerError } = await supabase.from("players").upsert(sanitizedChunk);

    if (playerError) {
      console.error(`❌ Error in batch ${i / BATCH_SIZE + 1}:`, playerError.message);
    } else {
      playersInserted += chunk.length;
      console.log(`✅ Batch ${i / BATCH_SIZE + 1} completed (${playersInserted}/${players.length} total)`);
    }
  }

  console.log("\n🎉 Database fully seeded successfully!");
}

main().catch(console.error);
