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
      <div className="container mx-auto p-8">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 rounded-xl">
          <h2 className="text-2xl font-bold mb-2">Database Error</h2>
          <p>Failed to fetch players: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Player <span className="text-amber-400">Database</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Browse the centralized database of all players available in the Mega Auction. Filter by roles, search for specific names, and review base prices and IPL statistics.
          </p>
        </div>

        <ClientDashboard initialPlayers={players || []} />
      </div>
    </div>
  );
}
