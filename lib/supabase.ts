// lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase configuration — validated with build-time safety.
 * We avoid throwing at the top level during 'next build' to prevent 
 * deployment failures while allowing runtime errors if keys are missing.
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Check if we are in a build/pre-rendering phase
  const isBuild = process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV;
  
  if (!url || !anonKey) {
    if (isBuild || process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(
        "ℹ️ [Supabase] Missing environment variables during build phase. This is expected if they are not provided for pre-rendering."
      );
    } else if (typeof window !== "undefined") {
      console.error("❌ [Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY.");
    }
  }

  return { 
    url: url || "https://placeholder-to-avoid-crash.supabase.co", 
    anonKey: anonKey || "placeholder-key" 
  };
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
