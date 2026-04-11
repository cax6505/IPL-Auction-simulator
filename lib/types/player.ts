// lib/types/player.ts

export type PlayerRole = "BAT" | "BOWL" | "AR" | "WK" | "batter" | "bowler" | "all-rounder" | "wicket-keeper";

/**
 * Team record exactly mapping to dataset and database schema.
 */
export interface TeamRecord {
  id: string; // e.g., 'CSK'
  name: string;
  short: string;
  home_ground: string | null;
  color: string | null;
  purse_2026_cr: number;
  retained_spend_2026_cr: number;
  auction_purse_remaining_2026_cr: number;
  titles: any[]; // JSON array
  created_at?: string;
  updated_at?: string;
}

/**
 * Raw Player data structure precisely reflecting ipl_players_2026.json objects.
 */
export interface RawPlayer {
  id: string;
  name: string;
  nationality: string;
  is_overseas: boolean;
  capped_status: "capped" | "uncapped";
  role: PlayerRole;
  batting_style: string | null;
  bowling_style: string | null;
  ipl_team_2026: string | null;
  ipl_team_2025: string | null;
  contract_type_2026: string | null;
  base_price_cr: number | null;
  sold_price_cr: number | null;
  auction_year: number | null;
  auction_set: string | null;
  retention_cost_cr: number | null;
  rtm_used: boolean;
  all_time_auctions: any[]; // JSON array
}

/**
 * Database record layout mirroring Supabase "players" table.
 */
export interface PlayerRecord extends RawPlayer {
  created_at?: string;
  updated_at?: string;
}
