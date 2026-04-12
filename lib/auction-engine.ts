// lib/auction-engine.ts

export const IPL_RULES = {
  STARTING_PURSE_CR: 120.0,
  MAX_SQUAD_SIZE: 25,
  MIN_SQUAD_SIZE: 18,
  MAX_OVERSEAS: 8,
};

export const TEAM_MAP = [
  { id: "MI", name: "Mumbai Indians", color: "bg-blue-600", border: "border-blue-500" },
  { id: "CSK", name: "Chennai Super Kings", color: "bg-yellow-500", border: "border-yellow-400", textDark: true },
  { id: "RCB", name: "Royal Challengers Bengaluru", color: "bg-red-600", border: "border-red-500" },
  { id: "KKR", name: "Kolkata Knight Riders", color: "bg-[#3a225d]", border: "border-purple-500" },
  { id: "DC", name: "Delhi Capitals", color: "bg-[#0077B6]", border: "border-blue-400" },
  { id: "PBKS", name: "Punjab Kings", color: "bg-[#ED1B24]", border: "border-red-400" },
  { id: "RR", name: "Rajasthan Royals", color: "bg-[#EA1A85]", border: "border-pink-500" },
  { id: "SRH", name: "Sunrisers Hyderabad", color: "bg-[#F26522]", border: "border-orange-500" },
  { id: "GT", name: "Gujarat Titans", color: "bg-[#1B2133]", border: "border-slate-500" },
  { id: "LSG", name: "Lucknow Super Giants", color: "bg-[#A72056]", border: "border-fuchsia-600" },
];

/**
 * Calculates the next minimum required bid based on official IPL Mega Auction increment rules.
 *
 * Official IPL Auction Increment Table:
 *   Current bid < ₹50 Lakhs (0.50 Cr)    → Increment = ₹5 Lakhs  (0.05 Cr)
 *   ₹50 Lakhs ≤ bid < ₹1 Crore           → Increment = ₹10 Lakhs (0.10 Cr)
 *   ₹1 Crore ≤ bid < ₹2 Crore            → Increment = ₹25 Lakhs (0.25 Cr)
 *   bid ≥ ₹2 Crore                        → Increment = ₹25 Lakhs (0.25 Cr)
 */
export function calculateNextBid(currentBidCr: number | string, basePriceCr: number | string): number {
  const current = Number(currentBidCr) || 0;
  const base = Number(basePriceCr) || 0.20;

  if (current === 0) return base;

  let increment: number;

  if (current < 0.50) {
    increment = 0.05; // ₹5 Lakhs
  } else if (current < 1.00) {
    increment = 0.10; // ₹10 Lakhs
  } else {
    increment = 0.25; // ₹25 Lakhs (same for 1-2 Cr and 2+ Cr)
  }

  return Number((current + increment).toFixed(2));
}

/**
 * Formats a Crore value into a human-readable display
 * e.g. 0.20 → "₹20L", 1.50 → "₹1.50 Cr", 2.00 → "₹2 Cr"
 */
export function formatPriceCr(valueCr: number): string {
  if (valueCr < 1.0) {
    const lakhs = Math.round(valueCr * 100);
    return `₹${lakhs}L`;
  }
  if (valueCr % 1 === 0) {
    return `₹${valueCr} Cr`;
  }
  return `₹${valueCr.toFixed(2)} Cr`;
}

/**
 * Validates if a user (controlling a franchise) can mathematically execute a bid.
 */
export function canAffordBid(purseRemainingCr: number, requiredBidCr: number, currentSquadSize: number): boolean {
  // Check strict purse boundary
  if (purseRemainingCr < requiredBidCr) return false;

  // Calculate minimum required to complete the rest of the squad
  // Assuming minimum base price of remaining players is roughly 0.20 Cr
  const remainingSlots = IPL_RULES.MAX_SQUAD_SIZE - currentSquadSize;
  if (remainingSlots <= 1) return purseRemainingCr >= requiredBidCr;

  const minimumRemainingReserve = (remainingSlots - 1) * 0.20;

  if (purseRemainingCr - requiredBidCr < minimumRemainingReserve) {
    return false; // They would bankrupt themselves and fail squad reqs
  }

  return true;
}
