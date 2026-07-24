import { supabase } from "@/lib/supabase";
import { ClientDashboard } from "@/components/players/ClientDashboard";

export const revalidate = 0;

export default async function PlayersPage() {
  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .order("name");

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-xl flex items-start gap-4">
          <div>
            <h2 className="text-base font-bold mb-1 text-red-400">Database Error</h2>
            <p className="text-xs font-mono opacity-80">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface-0 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-display">
            Player <span className="text-amber-400">Database</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl font-normal">
            Browse all 656 IPL players in the auction pool. Search by player name or filter by role.
          </p>
        </div>

        <ClientDashboard initialPlayers={players || []} />
      </div>
    </div>
  );
}
