"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { springBouncy } from "@/lib/design-tokens";
import { TeamLogo } from "./TeamLogo";

interface FranchiseCardProps {
  id: string;
  name: string;
  short: string;
  color: string;
  secondaryColor?: string;
  textOnColor: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function FranchiseCard({
  id,
  name,
  short,
  color,
  textOnColor,
  isSelected,
  onSelect,
}: FranchiseCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(id)}
      className={`relative aspect-square w-full flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 group overflow-hidden focus:outline-none ${
        isSelected
          ? "glass-panel ring-2 z-10 scale-[1.03]"
          : "glass-panel bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.18] hover:bg-white/[0.04]"
      }`}
      style={{
        boxShadow: isSelected
          ? `0 0 25px ${color}40, 0 0 50px ${color}15`
          : undefined,
        borderColor: isSelected ? color : undefined,
      }}
      whileHover={{ y: -3, scale: isSelected ? 1.04 : 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={springBouncy}
      aria-label={`Select franchise ${name}`}
      aria-pressed={isSelected}
    >
      {/* Ambient background wash on select */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${color}20, transparent 80%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Selected Checkmark Badge */}
      {isSelected && (
        <motion.div
          className="absolute top-2 right-2 z-20"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={springBouncy}
        >
          <div
            className="h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-md border border-black/40"
            style={{ backgroundColor: color }}
          >
            <Check className="h-3 w-3 font-bold" style={{ color: textOnColor }} />
          </div>
        </motion.div>
      )}

      {/* Official Team Logo */}
      <div className="flex-1 flex items-center justify-center py-1">
        <TeamLogo teamId={id} size="lg" />
      </div>

      {/* Short Code Only (CSK, MI, etc.) */}
      <span
        className={`text-xs font-bold tracking-wider transition-colors ${
          isSelected ? "text-white text-glow-white" : "text-zinc-300 group-hover:text-white"
        }`}
      >
        {short}
      </span>
    </motion.button>
  );
}
