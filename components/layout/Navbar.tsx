import Link from "next/link";
import { User, Trophy, Users, Shield } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            <Link href="/" className="text-xl font-bold tracking-tight text-white hover:text-amber-400 transition-colors">
              IPL AUCTION<span className="text-amber-400"> PRO</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-6">
              <Link href="/players" className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition">
                <User className="h-4 w-4" /> Players
              </Link>
              <Link href="/teams" className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition">
                <Shield className="h-4 w-4" /> Squads
              </Link>
              <Link href="/auction" className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition">
                <Users className="h-4 w-4" /> Live Room
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
