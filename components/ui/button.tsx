import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap outline-none select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 ease-spring duration-200 transition-all focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-white text-zinc-900 hover:bg-zinc-200 shadow-sm",
        primary: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.4)] border border-amber-400/20",
        outline:
          "border-white/[0.08] bg-transparent hover:bg-white/[0.04] text-zinc-100 hover:border-white/[0.15]",
        secondary:
          "bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700/80 border border-white/[0.04]",
        ghost:
          "hover:bg-white/[0.06] text-zinc-300 hover:text-white",
        destructive:
          "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 font-semibold focus-visible:ring-red-500/20 text-sm",
        link: "text-amber-500 underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-md px-2 text-xs",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold",
        lg: "h-12 gap-2 rounded-[12px] px-6 text-base",
        xl: "h-14 gap-2.5 rounded-[14px] px-8 text-lg font-bold",
        icon: "size-10",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
