import { BookOpen } from "lucide-react";
import { GuideClientContent } from "./GuideClientContent";

export const metadata = {
  title: "How to Play | DraftForge",
  description: "Learn how to play DraftForge IPL Auction Simulator — rules, bidding, and squad guidelines.",
};

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen surface-0 text-zinc-300">
      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-400 mb-4 font-semibold">
            <BookOpen className="h-3.5 w-3.5" /> Guide
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight font-display">
            How to Play <span className="text-amber-400">DraftForge</span>
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm font-normal">
            Rules, bidding increments, and squad building guidelines for your auction room.
          </p>
        </div>

        {/* Guide Content */}
        <GuideClientContent />
      </div>
    </div>
  );
}
