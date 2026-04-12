import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-[8px] border border-white/[0.08] bg-black/40 px-3 py-2 text-sm text-zinc-100 shadow-inner backdrop-blur-sm transition-colors duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-amber-500/50 focus-visible:ring-1 focus-visible:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50 hover:border-white/[0.12] focus-visible:bg-black/60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
