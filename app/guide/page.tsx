import Link from "next/link";
import {
  Trophy,
  ArrowRight,
  Clock,
  Users,
  Lightbulb,
  BadgeCheck,
  Zap,
  Flame,
  BookOpen,
} from "lucide-react";
import { GuideClientContent } from "./GuideClientContent";

export const metadata = {
  title: "How to Play | DraftForge",
  description: "Learn how to play DraftForge Auction Simulator — rules, bidding strategy, squad building guide.",
};

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen surface-0 text-zinc-300">
      <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-[600px] bg-red-500/[0.04] blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-400 mb-6 font-bold tracking-widest uppercase">
            <BookOpen className="h-3.5 w-3.5" /> Handbook
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tighter font-display uppercase">
            Master the{" "}
            <span className="gradient-text-accent">
              Auction
            </span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg mt-2 font-medium leading-relaxed">
            Everything you need to know to establish your franchise and dominate your next auction session.
          </p>
        </div>

        {/* Client-side animated content */}
        <GuideClientContent />
      </div>
    </div>
  );
}
