import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRPC() {
  console.log("Checking if 'advance_auction' RPC is mounted...");
  
  // Call with a dummy room UUID. If the function doesn't exist, Supabase returns a 404/PGRST301 or message.
  const { data, error } = await supabase.rpc("advance_auction", {
    p_room_id: "00000000-0000-0000-0000-000000000000",
    p_expected_player_id: "dummy"
  });

  if (error) {
    if (error.message.includes("does not exist")) {
      console.log("❌ The function 'advance_auction' does NOT exist in the database schema.");
      console.log("Please run the migration script: scripts/12-transactional-advance.sql");
    } else {
      console.log("✅ The function 'advance_auction' exists (it returned a database error as expected: " + error.message + ")");
    }
  } else {
    console.log("✅ The function 'advance_auction' exists and returned:", data);
  }
}

checkRPC();
