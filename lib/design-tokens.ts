// ─── DraftForge — Design Tokens ───
// Central source of truth for colors, gradients, animation variants, and team data.

// ── Accent Gradient (Crimson → Gold) ──
export const ACCENT = {
  from: "#DC2626",
  to: "#F59E0B",
  gradient: "linear-gradient(135deg, #DC2626, #F59E0B)",
  tailwind: "from-red-600 to-amber-500",
  tailwindHover: "hover:from-red-500 hover:to-amber-400",
} as const;

// ── Surface Colors (Deep Navy Spectrum) ──
export const SURFACES = {
  base: "#060918",      // Deepest background
  raised: "#0B0F22",    // Cards, panels
  elevated: "#111631",  // Hover states, modals
  overlay: "#181D3A",   // Elevated overlays
  border: "rgba(255, 255, 255, 0.06)",
  borderHover: "rgba(255, 255, 255, 0.12)",
} as const;

// ── IPL Team Identity ──
export const IPL_TEAMS = [
  { id: "CSK", name: "Chennai Super Kings", short: "CSK", color: "#FFC107", textOnColor: "#1a1a00" },
  { id: "MI", name: "Mumbai Indians", short: "MI", color: "#004BA0", textOnColor: "#ffffff" },
  { id: "RCB", name: "Royal Challengers Bengaluru", short: "RCB", color: "#D4213D", textOnColor: "#ffffff" },
  { id: "KKR", name: "Kolkata Knight Riders", short: "KKR", color: "#3A225D", textOnColor: "#ffffff" },
  { id: "DC", name: "Delhi Capitals", short: "DC", color: "#0077B6", textOnColor: "#ffffff" },
  { id: "PBKS", name: "Punjab Kings", short: "PBKS", color: "#ED1B24", textOnColor: "#ffffff" },
  { id: "RR", name: "Rajasthan Royals", short: "RR", color: "#EA1A85", textOnColor: "#ffffff" },
  { id: "SRH", name: "Sunrisers Hyderabad", short: "SRH", color: "#F26522", textOnColor: "#ffffff" },
  { id: "GT", name: "Gujarat Titans", short: "GT", color: "#1B2133", textOnColor: "#ffffff" },
  { id: "LSG", name: "Lucknow Super Giants", short: "LSG", color: "#A72056", textOnColor: "#ffffff" },
] as const;

export type TeamId = typeof IPL_TEAMS[number]["id"];

// ── Framer Motion Variants ──
export const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 24,
};

export const springBouncy = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
};

export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

// ── Scroll-triggered reveal ──
export const scrollReveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any },
};

// ── Button micro-interactions ──
export const buttonTap = {
  whileTap: { scale: 0.97 },
  whileHover: { scale: 1.02 },
  transition: springTransition,
};

// ── Step slide animation ──
export const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};
