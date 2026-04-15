export * from "./player";

export interface Room {
  id: string;
  room_code: string;
  status: "waiting" | "active" | "paused" | "completed";
  auction_mode: string | null;
  timer_duration: number;
  current_player_id: string | null;
  current_bid_cr: number;
  current_highest_bidder_id: string | null;
  timer_ends_at: string | null;
  max_players: number;
  created_at: string;
  updated_at: string;
}

export interface RoomFranchise {
  id: string;
  room_id: string;
  team_id: string;
  user_name: string;
  is_host: boolean;
  purse_remaining_cr: number;
  squad_count: number;
  overseas_count: number;
  joined_at: string;
}

export interface Bid {
  id: string;
  room_id: string;
  player_id: string;
  team_id: string;
  amount_cr: number;
  created_at: string;
}

export interface RoomSoldPlayer {
  id: string;
  room_id: string;
  player_id: string;
  team_id: string;
  sold_price_cr: number;
  is_overseas: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface LogMessage {
  id: string;
  text: string;
  type: "bid" | "join" | "sys";
}

export interface SoldFlashData {
  team: string;
  name: string;
  amount: number;
}
