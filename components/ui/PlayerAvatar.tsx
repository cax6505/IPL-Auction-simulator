"use client";

import React from "react";

interface PlayerAvatarProps {
  playerId: string;
  playerName: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  marquee?: boolean;
}

const SIZE_MAP: Record<string, { container: string; text: string }> = {
  xs: { container: "h-8 w-8", text: "text-[10px]" },
  sm: { container: "h-10 w-10", text: "text-xs" },
  md: { container: "h-12 w-12", text: "text-sm" },
  lg: { container: "h-16 w-16", text: "text-base" },
  xl: { container: "h-20 w-20", text: "text-lg" },
  "2xl": { container: "h-24 w-24", text: "text-xl" },
};

/**
 * Generates a consistent hue from a player ID for deterministic color assignment.
 */
function getPlayerHue(playerId: string): number {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const PlayerAvatar = React.memo(function PlayerAvatar({
  playerId,
  playerName,
  size = "md",
  marquee = false,
}: PlayerAvatarProps) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const hue = getPlayerHue(playerId);
  const initials = getInitials(playerName);

  return (
    <div
      className={`${sizeConfig.container} rounded-xl flex items-center justify-center font-display font-bold shrink-0 select-none ${
        marquee
          ? "ring-2 ring-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
          : "border border-white/10"
      }`}
      style={{
        backgroundColor: `hsl(${hue}, 40%, 25%)`,
        color: `hsl(${hue}, 60%, 75%)`,
      }}
      title={playerName}
    >
      <span className={sizeConfig.text}>{initials}</span>
    </div>
  );
});
