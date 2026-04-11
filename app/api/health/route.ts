// app/api/health/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  supabase: "connected" | "unreachable";
  error?: string;
}

/**
 * GET /api/health
 *
 * Returns the health status of the application including
 * a basic Supabase connectivity check.
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  try {
    // Lightweight Supabase connectivity check — query the auth endpoint
    const { error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          timestamp: new Date().toISOString(),
          supabase: "unreachable",
          error: error.message,
        } satisfies HealthResponse,
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      supabase: "connected",
    } satisfies HealthResponse);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        supabase: "unreachable",
        error: message,
      } satisfies HealthResponse,
      { status: 500 }
    );
  }
}
