"use client";

import { motion } from "framer-motion";
import { springTransition } from "@/lib/design-tokens";

interface SegmentedControlProps {
  label: string;
  options: { value: number; label: string }[];
  selected: number;
  onChange: (value: number) => void;
  /** Large display of the selected value */
  displayValue?: string;
}

export function SegmentedControl({
  label,
  options,
  selected,
  onChange,
  displayValue,
}: SegmentedControlProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
          {label}
        </label>
        {displayValue && (
          <motion.span
            key={displayValue}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-black font-display gradient-text-accent tracking-tight"
          >
            {displayValue}
          </motion.span>
        )}
      </div>
      <div className="relative flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
        {options.map((option) => {
          const isActive = selected === option.value;
          return (
            <button
              key={option.value}
              onClick={(e) => { e.stopPropagation(); onChange(option.value); }}
              className={`relative flex-1 z-10 py-3 rounded-xl text-sm font-black transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
              aria-label={`${label}: ${option.label}`}
            >
              {isActive && (
                <motion.div
                  layoutId={`segmented-${label}`}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600/20 to-amber-500/20 border border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.15)]"
                  transition={springTransition}
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
