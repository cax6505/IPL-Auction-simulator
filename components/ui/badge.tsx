import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/20",
        secondary:
          "border-transparent bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
        destructive:
          "border-transparent bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20",
        outline: "text-zinc-400 border-white/[0.1] bg-white/[0.02]",
        success: "border-transparent bg-green-500/10 text-green-400 border-green-500/20",
        blue: "border-transparent bg-blue-500/10 text-blue-400 border-blue-500/20",
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
