// lib/auction-engine.ts

export const IPL_RULES = {
  STARTING_PURSE_CR: 120.0,
  MAX_SQUAD_SIZE: 25,
  MAX_OVERSEAS: 8,
};

/**
 * Calculates the next minimum required bid based on IPL standard increment rules.
 * 
 * Rules:
 * Base Price < 1.00 Cr -> Increments of 0.10 Cr or 0.20 Cr
 * 1.00 Cr to 2.00 Cr -> Increments of 0.25 Cr
 * > 2.00 Cr -> Increments of 0.50 Cr
 */
export function calculateNextBid(currentBidCr: number, basePriceCr: number): number {
  if (currentBidCr === 0) return basePriceCr;
  
  if (currentBidCr < 1.00) {
    return Number((currentBidCr + 0.10).toFixed(2));
  } else if (currentBidCr >= 1.00 && currentBidCr < 2.00) {
    return Number((currentBidCr + 0.25).toFixed(2));
  } else {
    return Number((currentBidCr + 0.50).toFixed(2));
  }
}

/**
 * Validates if a user (controlling a franchise) can mathematically execute a bid.
 */
export function canAffordBid(purseRemainingCr: number, requiredBidCr: number, currentSquadSize: number): boolean {
  // Check strict purse boundary
  if (purseRemainingCr < requiredBidCr) return false;
  
  // Calculate minimum required to complete the rest of the squad
  // Assuming minimum base price of remaining players is roughly 0.20 Cr
  // (In the mega auction, standard minimum for uncapped is 0.30 Cr)
  const remainingSlots = IPL_RULES.MAX_SQUAD_SIZE - currentSquadSize;
  const minimumRemainingReserve = (remainingSlots - 1) * 0.30; 
  
  if (purseRemainingCr - requiredBidCr < minimumRemainingReserve) {
    return false; // They would bankrupt themselves and fail squad reqs
  }

  return true;
}
