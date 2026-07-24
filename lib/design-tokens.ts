// ─── DraftForge — Broadcast Design Tokens ───
// Central source of truth for design system colors, gradients, motion variants, and team identities.

// ── Accent & Escalation Palettes ──
export const ACCENT = {
  from: "#DC2626",
  to: "#F59E0B",
  gradient: "linear-gradient(135deg, #DC2626 0%, #F59E0B 100%)",
  emeraldGradient: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  cyanGradient: "linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)",
  tailwind: "from-red-600 to-amber-500",
  tailwindHover: "hover:from-red-500 hover:to-amber-400",
} as const;

// ── Surface Colors (Deep Pitch Broadcast Dark Spectrum) ──
export const SURFACES = {
  base: "#030712",      // Base stadium pitch background
  raised: "#0B0F19",    // Cards, main panels
  elevated: "#111827",  // Modals, active states
  overlay: "#1F2937",   // Dropdowns, floating overlays
  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "rgba(255, 255, 255, 0.18)",
} as const;

// ── Bid Escalation Ladder Color Helper ──
export function getBidEscalationColor(amountCr: number): { text: string; bg: string; border: string; glow: string } {
  if (amountCr >= 15) {
    return {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      glow: "shadow-[0_0_25px_rgba(245,158,11,0.35)]",
    };
  }
  if (amountCr >= 8) {
    return {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      glow: "shadow-[0_0_20px_rgba(220,38,38,0.3)]",
    };
  }
  if (amountCr >= 4) {
    return {
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      glow: "shadow-[0_0_15px_rgba(6,182,212,0.25)]",
    };
  }
  return {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "shadow-none",
  };
}

// ── IPL Team Identities (Rich dynamic theme palette) ──
export const IPL_TEAMS = [
  { id: "CSK", name: "Chennai Super Kings", short: "CSK", color: "#FFC107", secondaryColor: "#F59E0B", textOnColor: "#1a1a00", ringColor: "rgba(255, 193, 7, 0.5)", glow: "rgba(255, 193, 7, 0.3)" },
  { id: "MI", name: "Mumbai Indians", short: "MI", color: "#004BA0", secondaryColor: "#0077B6", textOnColor: "#ffffff", ringColor: "rgba(0, 75, 160, 0.5)", glow: "rgba(0, 75, 160, 0.3)" },
  { id: "RCB", name: "Royal Challengers Bengaluru", short: "RCB", color: "#D4213D", secondaryColor: "#FFC107", textOnColor: "#ffffff", ringColor: "rgba(212, 33, 61, 0.5)", glow: "rgba(212, 33, 61, 0.3)" },
  { id: "KKR", name: "Kolkata Knight Riders", short: "KKR", color: "#3A225D", secondaryColor: "#D4AF37", textOnColor: "#ffffff", ringColor: "rgba(58, 34, 93, 0.5)", glow: "rgba(58, 34, 93, 0.3)" },
  { id: "DC", name: "Delhi Capitals", short: "DC", color: "#0077B6", secondaryColor: "#EF233C", textOnColor: "#ffffff", ringColor: "rgba(0, 119, 182, 0.5)", glow: "rgba(0, 119, 182, 0.3)" },
  { id: "PBKS", name: "Punjab Kings", short: "PBKS", color: "#ED1B24", secondaryColor: "#E2E2E2", textOnColor: "#ffffff", ringColor: "rgba(237, 27, 36, 0.5)", glow: "rgba(237, 27, 36, 0.3)" },
  { id: "RR", name: "Rajasthan Royals", short: "RR", color: "#EA1A85", secondaryColor: "#2563EB", textOnColor: "#ffffff", ringColor: "rgba(234, 26, 133, 0.5)", glow: "rgba(234, 26, 133, 0.3)" },
  { id: "SRH", name: "Sunrisers Hyderabad", short: "SRH", color: "#F26522", secondaryColor: "#111111", textOnColor: "#ffffff", ringColor: "rgba(242, 101, 34, 0.5)", glow: "rgba(242, 101, 34, 0.3)" },
  { id: "GT", name: "Gujarat Titans", short: "GT", color: "#1B2133", secondaryColor: "#00B4D8", textOnColor: "#ffffff", ringColor: "rgba(0, 180, 216, 0.5)", glow: "rgba(0, 180, 216, 0.3)" },
  { id: "LSG", name: "Lucknow Super Giants", short: "LSG", color: "#A72056", secondaryColor: "#00B4D8", textOnColor: "#ffffff", ringColor: "rgba(167, 32, 86, 0.5)", glow: "rgba(167, 32, 86, 0.3)" },
] as const;

export type TeamId = typeof IPL_TEAMS[number]["id"];

export function getTeam(teamId?: string | null) {
  if (!teamId) return null;
  return IPL_TEAMS.find((t) => t.id === teamId) || null;
}

// ── Framer Motion Variants (GPU-friendly: transform & opacity only) ──
export const springTransition = {
  type: "spring" as const,
  stiffness: 350,
  damping: 26,
};

export const springBouncy = {
  type: "spring" as const,
  stiffness: 420,
  damping: 18,
};

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
};

export const scrollReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as any },
};

export const buttonTap = {
  whileTap: { scale: 0.97 },
  whileHover: { scale: 1.02 },
  transition: springTransition,
};

export const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -120 : 120,
    opacity: 0,
  }),
};
