import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // We can query pg_proc using rpc if there's a generic query one, but normally we can't query system tables via standard postgrest unless they are exposed.
  // Let's try to query pg_catalog or pg_proc via postgrest just in case:
  const { data, error } = await supabase.from("pg_proc" as any).select("proname");
  if (error) {
    console.log("Could not query pg_proc directly:", error.message);
  } else {
    console.log("pg_proc data:", data);
  }
}

main().catch(console.error);
