import { supabase } from "@/lib/supabase";
import { ClientDashboard } from "@/components/players/ClientDashboard";

export const revalidate = 0; // Dynamic route for now to prevent build caching issues with DB

export default async function PlayersPage() {
  // Fetch from Supabase natively! No API endpoints required!
  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .order("name");

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-xl flex items-start gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h2 className="text-lg font-bold mb-1 text-red-500">Database Connection Error</h2>
            <p className="text-sm font-mono opacity-80">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface-0 overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-400 mb-4 font-bold tracking-widest uppercase">
            Database
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Player <span className="text-amber-500">Registry</span>
          </h1>
          <p className="text-base text-zinc-400 max-w-2xl font-medium">
            Browse the comprehensive registry of all players available in the Mega Auction. Filter by role, search targets, and build your strategy.
          </p>
        </div>

        <ClientDashboard initialPlayers={players || []} />
      </div>
    </div>
  );
}
