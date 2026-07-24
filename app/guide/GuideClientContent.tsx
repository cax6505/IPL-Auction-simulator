"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Globe2,
  CheckCircle2,
  Lock,
  Lightbulb,
  Check,
} from "lucide-react";
import { getBidEscalationColor } from "@/lib/design-tokens";

const LADDER_STEPS = [
  { tier: "Tier 1", range: "Below ₹50 Lakhs", inc: "+ ₹5 Lakhs", desc: "Opening price tier for uncapped players" },
  { tier: "Tier 2", range: "₹50L — ₹1 Crore", inc: "+ ₹10 Lakhs", desc: "Mid-tier player escalation" },
  { tier: "Tier 3", range: "₹1 Crore — ₹2 Crore", inc: "+ ₹25 Lakhs", desc: "Capped player bidding phase" },
  { tier: "Tier 4", range: "₹2 Crore+", inc: "+ ₹25 Lakhs", desc: "High-value marquee player tier" },
];

export function GuideClientContent() {
  return (
    <>
      {/* Bid Increments Section */}
      <Section title="Bid Increments" icon={<TrendingUp className="h-5 w-5 text-amber-400" />}>
        <p className="text-sm text-zinc-400 mb-6">
          Bid increments increase automatically based on the current valuation of the player.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LADDER_STEPS.map((step) => (
            <div
              key={step.tier}
              className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between"
            >
              <span className="text-xs font-semibold text-zinc-400 mb-1">
                {step.tier}
              </span>
              <div className="font-display font-bold text-base text-white mb-2">
                {step.range}
              </div>
              <div className="font-mono font-bold text-sm text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 w-fit mb-3">
                {step.inc}
              </div>
              <p className="text-xs text-zinc-400 font-sans">{step.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Squad Rules Section */}
      <Section title="Squad Rules & Limits" icon={<Shield className="h-5 w-5 text-red-400" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                MIN SQUAD
              </span>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="font-mono font-bold text-3xl text-emerald-400 mb-1">18 Players</div>
            <p className="text-xs text-zinc-400 leading-relaxed mt-2">
              Every team must purchase a minimum of 18 players. The system reserves purse budget to ensure you can reach 18 players.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-red-500 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg">
                MAX SQUAD
              </span>
              <Lock className="h-5 w-5 text-red-400" />
            </div>
            <div className="font-mono font-bold text-3xl text-red-400 mb-1">25 Players</div>
            <p className="text-xs text-zinc-400 leading-relaxed mt-2">
              Teams cannot exceed 25 players. Once your roster reaches 25, bidding is automatically locked.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyan-400 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg">
                OVERSEAS LIMIT
              </span>
              <Globe2 className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="font-mono font-bold text-3xl text-cyan-400 mb-1">8 Max</div>
            <p className="text-xs text-zinc-400 leading-relaxed mt-2">
              A maximum of 8 international players can be bought per squad.
            </p>
          </div>
        </div>
      </Section>

      {/* Bidding Tips Section */}
      <Section title="Bidding Tips" icon={<Lightbulb className="h-5 w-5 text-amber-400" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: "Manage Your Budget",
              desc: "Avoid spending over 40% of your total purse on a single marquee player early on.",
            },
            {
              title: "Target All-Rounders",
              desc: "All-rounders give you flexibility when building your starting 11.",
            },
            {
              title: "Timer Strategy",
              desc: "Placing a bid resets the countdown timer by +5s, allowing more time for decisions.",
            },
            {
              title: "Balanced Roster",
              desc: "Aim for a balanced squad of 6-7 batters, 6-7 bowlers, 3 all-rounders, and 2 wicket-keepers.",
            },
          ].map((tip) => (
            <div
              key={tip.title}
              className="glass-panel p-5 rounded-2xl border border-white/10"
            >
              <h4 className="font-display font-bold text-sm text-amber-300 mb-1 flex items-center gap-2">
                <Check className="h-4 w-4" />
                {tip.title}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Action CTA */}
      <div className="mt-16 text-center">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 max-w-xl mx-auto">
          <h2 className="font-display font-bold text-2xl text-white mb-2">
            Ready to start an auction?
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
            Create a room and invite your friends to compete in a real-time IPL draft.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            Create Auction Room <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="flex items-center gap-2.5 text-xl font-bold text-white mb-4 font-display">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
