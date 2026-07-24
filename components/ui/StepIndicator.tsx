"use client";

import { motion } from "framer-motion";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={currentStep + 1}>
      {steps.map((label, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-initial">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5 relative">
              <motion.div
                className={`relative h-9 w-9 rounded-full flex items-center justify-center text-xs font-black transition-colors duration-300 ${
                  isActive
                    ? "text-white"
                    : isCompleted
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/[0.04] text-zinc-500 border border-white/[0.08]"
                }`}
                animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {isActive && (
                  <motion.div
                    layoutId="step-active-bg"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600 to-amber-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {isCompleted ? "✓" : index + 1}
                </span>
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                isActive ? "text-white" : isCompleted ? "text-emerald-400/70" : "text-zinc-600"
              }`}>
                {label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 mt-[-18px] relative overflow-hidden min-w-[24px]">
                <div className="absolute inset-0 bg-white/[0.06]" />
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-amber-500"
                  initial={{ width: "0%" }}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
