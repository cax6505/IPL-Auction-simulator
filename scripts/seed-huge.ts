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
  console.log("Starting MASSIVE Dataset Seeder...");

  const datasetPath = path.resolve(process.cwd(), "Ipl players dataset/3100_players.json");
  if (!fs.existsSync(datasetPath)) {
    console.error(`Dataset not found at ${datasetPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(datasetPath, "utf8");
  const players = JSON.parse(rawData);

  console.log(`Loaded dataset: ${players.length} historical players found.`);

  // Clear existing players to prevent strange mapping issues if they want a pure huge auction
  // Actually, upsert will naturally overwrite. Since the IDs change (e.g. P0606-2008), 
  // It won't overwrite the original 2026 ones (they were just P0606). It will just inject 3193 MORE.
  
  console.log("\nUpserting Players in ultra-batches of 500...");
  const BATCH_SIZE = 500;
  let playersInserted = 0;

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const chunk = players.slice(i, i + BATCH_SIZE);
    
    const { error: playerError } = await supabase.from("players").upsert(chunk);

    if (playerError) {
      console.error(`❌ Error in batch ${i / BATCH_SIZE + 1}:`, playerError.message);
    } else {
      playersInserted += chunk.length;
      console.log(`✅ Batch ${i / BATCH_SIZE + 1} completed (${playersInserted}/${players.length} total)`);
    }
  }

  console.log("\n🎉 Database fully seeded successfully! You now have a massive auction pool.");
}

main().catch(console.error);
