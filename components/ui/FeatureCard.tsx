"use client";

import { motion } from "framer-motion";
import { scrollReveal } from "@/lib/design-tokens";
import { type LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentColor: string;  // e.g. "blue", "red", "amber", "purple"
  index?: number;
}

const ACCENT_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/20",   text: "text-blue-400",   glow: "rgba(59,130,246,0.15)" },
  red:    { bg: "bg-red-500/10",    border: "border-red-500/20",    text: "text-red-400",    glow: "rgba(239,68,68,0.15)" },
  amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/20",  text: "text-amber-400",  glow: "rgba(245,158,11,0.15)" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", glow: "rgba(168,85,247,0.15)" },
  green:  { bg: "bg-green-500/10",  border: "border-green-500/20",  text: "text-green-400",  glow: "rgba(34,197,94,0.15)" },
};

export function FeatureCard({ icon: Icon, title, description, accentColor, index = 0 }: FeatureCardProps) {
  const accent = ACCENT_MAP[accentColor] || ACCENT_MAP.blue;

  return (
    <motion.div
      {...scrollReveal}
      transition={{ ...scrollReveal.transition, delay: index * 0.1 }}
      className="glass-card rounded-2xl p-6 relative overflow-hidden group border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {/* Gradient wash on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 30% 20%, ${accent.glow}, transparent 60%)` }}
      />

      {/* Icon */}
      <div className={`relative z-10 h-12 w-12 rounded-xl ${accent.bg} ${accent.border} border flex items-center justify-center ${accent.text} mb-5 shadow-inner`}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <h3 className="relative z-10 text-base font-bold text-white mb-2 tracking-tight font-display uppercase">{title}</h3>
      <p className="relative z-10 text-xs text-zinc-400 leading-relaxed font-medium">
        {description}
      </p>
    </motion.div>
  );
}
