import Link from "next/link";
import {
  Trophy,
  ArrowRight,
  Clock,
  Users,
  DollarSign,
  Shield,
  Target,
  AlertTriangle,
  Lightbulb,
  BadgeCheck,
  Zap,
  Flame,
} from "lucide-react";

export const metadata = {
  title: "How to Play | IPL Auction Pro",
  description: "Learn how to play the IPL Auction Simulator — rules, bidding strategy, squad building guide.",
};

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen surface-0 text-zinc-300">
      <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-[600px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-400 mb-6 font-bold tracking-widest uppercase">
            <BookOpenIcon className="h-3.5 w-3.5" /> Handbook
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tight">
            Master the{" "}
            <span className="gradient-text-amber">
              Auction
            </span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg mt-2 font-medium leading-relaxed">
            Everything you need to know to establish your franchise and dominate your next IPL auction session.
          </p>
        </div>

        {/* Quick Start */}
        <Section title="Quick Start Guide" icon={<Zap className="h-6 w-6 text-amber-500" />} delay="0.1s">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { step: 1, title: "Enter Your Alias", desc: "Choose a display name on the homepage." },
              { step: 2, title: "Pick Your Franchise", desc: "Select one of the 10 real IPL teams." },
              { step: 3, title: "Create or Join", desc: "Share your 6-digit access code with friends." },
              { step: 4, title: "Set Config", desc: "Host selects mode (Mock 2026/Mega) & timer length." },
              { step: 5, title: "Start Bidding", desc: "Place bids before the countdown reaches zero." },
              { step: 6, title: "Build Squad", desc: "Win players to fill your 25 max roster under ₹120 Cr." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start glass-card rounded-[14px] p-5 transition-transform hover:-translate-y-1 duration-300">
                <div className="flex-shrink-0 h-10 w-10 rounded-[10px] bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-base border border-amber-500/20 shadow-inner">
                  {item.step}
                </div>
                <div className="flex flex-col justify-center h-full">
                  <h3 className="text-white font-bold text-sm tracking-tight">{item.title}</h3>
                  <p className="text-zinc-400 text-xs mt-1 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Auction Rules */}
        <Section title="Auction Rules" icon={<Clock className="h-6 w-6 text-blue-400" />} delay="0.2s">
          <div className="space-y-4">
            <RuleCard title="Countdown Timer" desc="Each player goes up for auction with a countdown timer (default 10s). When someone bids, 5s are dynamically added. Player is sold when timer hits zero." glow="blue" />
            <RuleCard title="Bid Increments" desc="Bids follow official IPL Mega Auction increment rules automatically via our engine:" glow="blue">
              <div className="overflow-hidden rounded-xl border border-white/[0.05] mt-4">
                <table className="w-full text-sm border-collapse bg-black/20">
                  <thead>
                    <tr className="text-left text-zinc-500 bg-black/40 text-xs uppercase tracking-wider font-bold">
                      <th className="py-3 px-4 border-b border-white/[0.05]">Current Bid Status</th>
                      <th className="py-3 px-4 border-b border-white/[0.05]">Engine Increment</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300 font-medium">
                    <tr className="hover:bg-white/[0.02] transition-colors"><td className="py-3 px-4 border-b border-white/[0.02]">Below ₹50 Lakhs</td><td className="py-3 px-4 border-b border-white/[0.02] font-mono text-amber-500/80">₹5 Lakhs</td></tr>
                    <tr className="hover:bg-white/[0.02] transition-colors"><td className="py-3 px-4 border-b border-white/[0.02]">₹50L — ₹1 Crore</td><td className="py-3 px-4 border-b border-white/[0.02] font-mono text-amber-500/80">₹10 Lakhs</td></tr>
                    <tr className="hover:bg-white/[0.02] transition-colors"><td className="py-3 px-4 border-b border-white/[0.02]">₹1 Crore — ₹2 Crore</td><td className="py-3 px-4 border-b border-white/[0.02] font-mono text-amber-500/80">₹25 Lakhs</td></tr>
                    <tr className="hover:bg-white/[0.02] transition-colors"><td className="py-3 px-4 text-amber-500/80">₹2 Crore+</td><td className="py-3 px-4 font-mono text-amber-500/80">₹25 Lakhs</td></tr>
                  </tbody>
                </table>
              </div>
            </RuleCard>
            <RuleCard title="Financial Fair Play Constraints" desc="The bidding engine is ruthless. You cannot bid if the next calculated amount exceeds your remaining purse or leaves you mathematically unable to complete your 18-player roster." glow="blue" />
          </div>
        </Section>

        {/* Squad Requirements */}
        <Section title="Squad Reqs" icon={<Users className="h-6 w-6 text-green-400" />} delay="0.3s">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard value="18" label="Min Players" desc="Mandatory roster floor" />
            <StatCard value="25" label="Max Players" desc="Hard salary cap limit" />
            <StatCard value="8" label="Max Overseas" desc="Strict visa restriction" />
          </div>
          <div className="mt-5 glass-card p-4 rounded-xl text-zinc-400 text-sm font-medium border-l-2 border-l-green-500">
            Teams with fewer than 18 players are flagged as incomplete. The engine prevents bidding on overseas players if you've already secured 8.
          </div>
        </Section>

        {/* Pro Tips */}
        <Section title="Pro Strategy" icon={<Lightbulb className="h-6 w-6 text-amber-400" />} delay="0.4s">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Capital Efficiency", desc: "Don't blow 40% on one marquee player early. Spread your purse across essential roles." },
              { title: "Hunt The Mid-Tier", desc: "Reliable Indian all-rounders in set 4 often go for significantly less than set 1 batters." },
              { title: "Psychological Bidding", desc: "Wait for the last 3 seconds of the timer to bid — forces opponents into panic decisions." },
              { title: "Roster Composition", desc: "Ideal meta: 6-7 batters, 6-7 bowlers, 3-4 all-rounders, and 2 designated keepers." },
            ].map((tip) => (
              <div key={tip.title} className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-5 hover:border-amber-500/40 transition-colors">
                <h4 className="text-amber-400 font-bold text-sm tracking-tight flex items-center gap-2 mb-2">
                  <BadgeCheck className="h-4 w-4" />
                  {tip.title}
                </h4>
                <p className="text-zinc-400 text-sm font-medium">{tip.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <div className="mt-20 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="relative glass-card rounded-[24px] p-10 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            <Flame className="relative h-12 w-12 text-amber-500 mx-auto mb-5 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]" />
            <h2 className="relative text-3xl font-black text-white mb-3 tracking-tight">Enter the War Room</h2>
            <p className="relative text-zinc-400 mb-8 max-w-md mx-auto font-medium">Create a private space and invite your rival managers for an epic drafting session.</p>
            
            <Link
              href="/"
              className="relative inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold px-8 py-4 rounded-[12px] transition-all shadow-[0_8px_32px_-10px_rgba(245,158,11,0.5)] hover:shadow-[0_12px_40px_-10px_rgba(245,158,11,0.6)] shimmer-btn"
            >
              Start Your Auction
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Sub-components --

function Section({ title, icon, children, delay = "0s" }: { title: string; icon: React.ReactNode; children: React.ReactNode; delay?: string }) {
  return (
    <section className="mb-14 animate-fade-up" style={{ animationDelay: delay }}>
      <h2 className="flex items-center gap-3 text-2xl font-black text-white mb-6 tracking-tight">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function RuleCard({ title, desc, children, glow = "amber" }: { title: string; desc: string; children?: React.ReactNode; glow?: "amber" | "blue" | "green" }) {
  return (
    <div className={`glass-card p-6 rounded-xl hover:glass-card-hover transition-all duration-300`}>
      <h3 className="text-white font-bold text-base mb-1 tracking-tight">{title}</h3>
      <p className="text-zinc-400 text-sm font-medium">{desc}</p>
      {children}
    </div>
  );
}

function StatCard({ value, label, desc }: { value: string; label: string; desc: string }) {
  return (
    <div className="glass-card hover:glass-card-hover rounded-xl p-6 text-center transition-all duration-300">
      <p className="text-4xl font-black font-mono text-amber-500 tracking-tighter drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">{value}</p>
      <p className="text-white font-bold text-sm tracking-tight mt-2">{label}</p>
      <p className="text-zinc-500 text-[11px] font-medium mt-1 uppercase tracking-wider">{desc}</p>
    </div>
  );
}

// Simple icon missing from lucide import
function BookOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
