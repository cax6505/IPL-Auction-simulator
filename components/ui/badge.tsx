import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
        secondary:
          "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
        destructive:
          "border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/25",
        outline: "border-white/15 text-zinc-400 bg-white/[0.02]",
        success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
        blue: "border-cyan-500/30 bg-cyan-500/15 text-cyan-400",
        marquee: "border-amber-400/50 bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
        bat: "border-blue-500/30 bg-blue-500/15 text-blue-400",
        bowl: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
        ar: "border-purple-500/30 bg-purple-500/15 text-purple-400",
        wk: "border-orange-500/30 bg-orange-500/15 text-orange-400",
        overseas: "border-cyan-400/40 bg-cyan-500/20 text-cyan-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

function Badge({ className, variant, dot, dotColor = "bg-current", children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className={cn("mr-1.5 flex h-1.5 w-1.5 rounded-full animate-pulse", dotColor)} />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

