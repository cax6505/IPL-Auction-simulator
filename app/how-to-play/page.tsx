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
    <div className="min-h-screen bg-[#060609]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 mb-4">
            <Trophy className="h-4 w-4" />
            <span className="font-semibold">How to Play</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Master the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Auction
            </span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Everything you need to know to dominate your next IPL auction session.
          </p>
        </div>

        {/* Quick Start */}
        <Section title="Quick Start Guide" icon={<Zap className="h-5 w-5 text-amber-500" />}>
          <div className="space-y-4">
            {[
              { step: 1, title: "Enter Your Name", desc: "Choose a display name (up to 20 characters) on the homepage." },
              { step: 2, title: "Pick Your Franchise", desc: "Select one of the 10 IPL teams as your identity." },
              { step: 3, title: "Create or Join a Room", desc: "Create a new room and share the 6-digit code, or join with an existing code." },
              { step: 4, title: "Choose Auction Mode", desc: "The host selects Mock 2026 or Mega Auction mode and adjusts the timer." },
              { step: 5, title: "Start Bidding", desc: "When the host starts, players appear one-by-one. Place bids before the timer runs out!" },
              { step: 6, title: "Build Your Squad", desc: "Win players to fill your squad (max 25) while managing your ₹120 Cr purse." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{item.title}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Auction Rules */}
        <Section title="Auction Rules" icon={<Clock className="h-5 w-5 text-blue-400" />}>
          <div className="space-y-4">
            <RuleCard title="Countdown Timer" desc="Each player goes up for auction with a countdown timer (default: 10 seconds). When someone bids, 5 seconds are added to the timer. The player is sold when the timer hits zero." />
            <RuleCard title="Bid Increments" desc="Bids follow official IPL increment rules:">
              <table className="w-full text-sm mt-3 border-collapse">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-4 border-b border-white/[0.06]">Current Bid</th>
                    <th className="py-2 border-b border-white/[0.06]">Increment</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr><td className="py-2 pr-4 border-b border-white/[0.04]">Below ₹50 Lakhs</td><td className="py-2 border-b border-white/[0.04]">₹5 Lakhs</td></tr>
                  <tr><td className="py-2 pr-4 border-b border-white/[0.04]">₹50L — ₹1 Crore</td><td className="py-2 border-b border-white/[0.04]">₹10 Lakhs</td></tr>
                  <tr><td className="py-2 pr-4 border-b border-white/[0.04]">₹1 Cr — ₹2 Crore</td><td className="py-2 border-b border-white/[0.04]">₹25 Lakhs</td></tr>
                  <tr><td className="py-2 pr-4">₹2 Crore+</td><td className="py-2">₹25 Lakhs</td></tr>
                </tbody>
              </table>
            </RuleCard>
            <RuleCard title="Budget Constraint" desc="You cannot bid if the next bid exceeds your remaining purse. The system automatically disables your bid button." />
          </div>
        </Section>

        {/* Squad Requirements */}
        <Section title="Squad Requirements" icon={<Users className="h-5 w-5 text-green-400" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard value="18" label="Min Players" desc="Minimum squad requirement" />
            <StatCard value="25" label="Max Players" desc="Maximum squad size" />
            <StatCard value="8" label="Max Overseas" desc="Foreign player limit" />
          </div>
          <p className="text-slate-400 text-sm mt-4">
            Teams with fewer than 18 players are flagged as incomplete at the end of the auction. You cannot bid if your squad already has 25 players or 8 overseas players (when bidding on an overseas player).
          </p>
        </Section>

        {/* Auction Modes */}
        <Section title="Auction Modes" icon={<Shield className="h-5 w-5 text-purple-400" />}>
          <div className="space-y-3">
            <ModeCard
              title="Mock 2026 Auction"
              badge="Real Data"
              color="amber"
              features={[
                "Teams start with real retained players and reduced purses",
                "Only un-retained players enter the auction pool (~350 players)",
                "Purse varies per team based on actual retention costs",
                "Most realistic simulation experience",
              ]}
            />
            <ModeCard
              title="Mega Auction"
              badge="Full Draft"
              color="blue"
              features={[
                "All teams start fresh — no retentions",
                "Full player database available (1100+ players)",
                "₹120 Cr starting purse for every team",
                "Maximum strategic freedom",
              ]}
            />
          </div>
        </Section>

        {/* Pro Tips */}
        <Section title="Pro Tips" icon={<Lightbulb className="h-5 w-5 text-yellow-400" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Budget Management", desc: "Don't blow 40% on one player. Spread your purse across key roles." },
              { title: "Target Value Players", desc: "Mid-tier all-rounders often go for less than star batters. Hunt value." },
              { title: "Timer Strategy", desc: "Wait for the last 3 seconds to bid — forces opponents into panic." },
              { title: "Squad Balance", desc: "Aim for 6-7 batters, 6-7 bowlers, 3-4 all-rounders, and 2 keepers." },
            ].map((tip) => (
              <div key={tip.title} className="bg-yellow-500/[0.04] border border-yellow-500/10 rounded-xl p-4">
                <h4 className="text-yellow-400 font-bold text-sm flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  {tip.title}
                </h4>
                <p className="text-slate-400 text-sm mt-1">{tip.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Common Mistakes */}
        <Section title="Common Mistakes to Avoid" icon={<AlertTriangle className="h-5 w-5 text-red-400" />}>
          <div className="space-y-2">
            {[
              "Overspending early — blowing your budget on the first few marquee players",
              "Ignoring bowlers — defence wins championships, don't stack only batters",
              "Forgetting the overseas limit — you can only have 8 overseas players total",
              "Emotional bidding — letting rivalry drive your bid past logical value",
              "Not reserving funds — always keep ~₹15 Cr for filling the remaining squad",
            ].map((mistake, i) => (
              <div key={i} className="flex items-start gap-3 bg-red-500/[0.04] border border-red-500/10 rounded-lg p-3">
                <span className="text-red-500 mt-0.5 text-sm">✕</span>
                <p className="text-slate-300 text-sm">{mistake}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-8">
            <Flame className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">Ready to Play?</h2>
            <p className="text-slate-400 mb-6">Create a room and invite your friends for an epic auction night.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded-xl transition-all shadow-[0_0_30px_-10px_rgba(245,158,11,0.5)]"
            >
              Create Room & Play
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Sub-components --

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="flex items-center gap-2 text-xl font-black text-white mb-5">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function RuleCard({ title, desc, children }: { title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
      <p className="text-slate-400 text-sm">{desc}</p>
      {children}
    </div>
  );
}

function StatCard({ value, label, desc }: { value: string; label: string; desc: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
      <p className="text-3xl font-black text-amber-500">{value}</p>
      <p className="text-white font-bold text-sm mt-1">{label}</p>
      <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
    </div>
  );
}

function ModeCard({ title, badge, color, features }: { title: string; badge: string; color: string; features: string[] }) {
  const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    amber: { bg: "bg-amber-500/[0.04]", border: "border-amber-500/20", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    blue: { bg: "bg-blue-500/[0.04]", border: "border-blue-500/20", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  };
  const c = colorClasses[color] || colorClasses.amber;

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-white font-bold">{title}</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>{badge}</span>
      </div>
      <ul className="space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className="text-slate-400 text-sm flex items-start gap-2">
            <span className={`${c.text} mt-0.5`}>•</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
