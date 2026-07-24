"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { springBouncy } from "@/lib/design-tokens";

interface FranchiseCardProps {
  id: string;
  name: string;
  short: string;
  color: string;
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
      onClick={() => onSelect(id)}
      className={`relative flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-2xl transition-colors duration-200 group overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
        isSelected
          ? "ring-2 shadow-xl z-10"
          : "bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.12]"
      }`}
      style={{
        boxShadow: isSelected ? `0 0 30px ${color}33, 0 0 60px ${color}15` : undefined,
        borderColor: isSelected ? color : undefined,
      }}
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={springBouncy}
      aria-label={`Select ${name}`}
      aria-pressed={isSelected}
    >
      {/* Team color wash on selected */}
      {isSelected && (
        <motion.div
          className="absolute inset-0"
          style={{ backgroundColor: color, opacity: 0.1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)`,
        }}
      />

      {/* Team badge */}
      <motion.div
        className="relative z-10 h-12 w-12 rounded-xl flex items-center justify-center font-black text-sm shadow-lg"
        style={{
          backgroundColor: color,
          color: textOnColor,
          boxShadow: isSelected ? `0 4px 20px ${color}40` : `inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
        animate={isSelected ? { scale: [1, 1.1, 1.05] } : {}}
        transition={{ duration: 0.3 }}
      >
        {short}
      </motion.div>

      {/* Team name */}
      <span
        className={`relative z-10 text-[10px] font-bold tracking-wider transition-colors ${
          isSelected ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
        }`}
      >
        {short}
      </span>

      {/* Full team name on hover/selected */}
      <span
        className={`absolute bottom-1 z-10 text-[8px] font-semibold tracking-wide transition-all ${
          isSelected ? "opacity-70 text-zinc-300" : "opacity-0 group-hover:opacity-50 text-zinc-400"
        }`}
        style={{ maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {name}
      </span>

      {/* Selected checkmark */}
      {isSelected && (
        <motion.div
          className="absolute top-1.5 right-1.5 z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springBouncy}
        >
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center border-2 border-black/30"
            style={{ backgroundColor: color }}
          >
            <Check className="h-3 w-3 font-bold" style={{ color: textOnColor }} />
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}
