"use client";

import { useState } from "react";
import { getTeam } from "@/lib/design-tokens";

interface TeamLogoProps {
  teamId: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const OFFICIAL_SVG_LOGOS: Record<string, string> = {
  CSK: "/logos/csk.svg",
  MI: "/logos/mi.svg",
  RCB: "/logos/rcb.svg",
  KKR: "/logos/kkr.svg",
  DC: "/logos/dc.svg",
  PBKS: "/logos/pbks.svg",
  RR: "/logos/rr.svg",
  SRH: "/logos/srh.svg",
  GT: "/logos/gt.svg",
  LSG: "/logos/lsg.svg",
};

const OFFICIAL_PNG_LOGOS: Record<string, string> = {
  CSK: "/logos/csk.png",
  MI: "/logos/mi.png",
  RCB: "/logos/rcb.png",
  KKR: "/logos/kkr.png",
  DC: "/logos/dc.png",
  PBKS: "/logos/pbks.png",
  RR: "/logos/rr.png",
  SRH: "/logos/srh.png",
  GT: "/logos/gt.png",
  LSG: "/logos/lsg.png",
};

const SIZE_MAP = {
  sm: "h-7 w-7",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

export function TeamLogo({ teamId, size = "md", className = "" }: TeamLogoProps) {
  const [errorCount, setErrorCount] = useState(0);
  const team = getTeam(teamId);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  const idUpper = teamId.toUpperCase();
  const primarySrc = OFFICIAL_SVG_LOGOS[idUpper] || `/logos/${teamId.toLowerCase()}.svg`;
  const fallbackSrc = OFFICIAL_PNG_LOGOS[idUpper] || `/logos/${teamId.toLowerCase()}.png`;

  const currentSrc = errorCount === 0 ? primarySrc : errorCount === 1 ? fallbackSrc : null;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeClass} ${className}`}>
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={`${team?.name || teamId} logo`}
          className="h-full w-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
          onError={() => setErrorCount((prev) => prev + 1)}
          loading="eager"
        />
      ) : (
        <div
          className="h-full w-full rounded-xl flex items-center justify-center font-display font-extrabold tracking-wider shadow-md"
          style={{
            backgroundColor: team?.color || "#1F2937",
            color: team?.textOnColor || "#ffffff",
          }}
        >
          {team?.short || teamId}
        </div>
      )}
    </div>
  );
}
