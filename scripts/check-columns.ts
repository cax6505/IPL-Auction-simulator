import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
  const { data, error } = await supabase.from("rooms").select("*").limit(1);
  if (error) {
    console.error("Error fetching rooms:", error);
  } else {
    console.log("Rooms row keys:", data.length > 0 ? Object.keys(data[0]) : "No rooms exist yet");
  }
}

main().catch(console.error);
