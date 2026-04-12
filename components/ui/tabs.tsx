"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: "default" | "underline" }
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      variant === "default" 
        ? "inline-flex h-11 items-center justify-center rounded-lg bg-black/40 border border-white/[0.06] p-1 text-zinc-400"
        : "flex h-12 items-center justify-start border-b border-white/[0.04] bg-transparent text-zinc-400 px-2",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Tab>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tab> & { variant?: "default" | "underline" }
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.Tab
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 disabled:pointer-events-none disabled:opacity-50",
      variant === "default"
        ? "rounded-md data-[panel-active]:bg-zinc-800 data-[panel-active]:text-white data-[panel-active]:shadow-sm"
        : "border-b-2 border-transparent px-4 py-3 pb-2.5 data-[panel-active]:border-amber-500 data-[panel-active]:text-amber-400 hover:text-zinc-200 uppercase tracking-wider text-[11px]",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Panel>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Panel
    ref={ref}
    className={cn(
      "mt-2 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
