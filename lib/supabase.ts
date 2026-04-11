// lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase configuration — validated at module load time.
 * Throws immediately if env variables are missing so we fail fast
 * instead of getting cryptic runtime errors later.
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL. Check your .env.local file."
    );
  }

  if (!anonKey) {
    throw new Error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local file."
    );
  }

  return { url, anonKey };
}

const config = getSupabaseConfig();

export const supabase: SupabaseClient = createClient(
  config.url,
  config.anonKey,
  {
    auth: {
      persistSession: false,
    },
  }
);
