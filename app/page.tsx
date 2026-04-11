import Link from "next/link";
import { ArrowRight, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden bg-slate-950">
      {/* Abstract Background Elements */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="h-[30rem] w-[30rem] translate-x-1/3 translate-y-1/3 rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-400">
          <Trophy className="h-4 w-4" />
          <span>Mega Auction 2026 Simulator</span>
        </div>
        
        <h1 className="select-balance mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
          Build Your Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Dream Team</span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
          Experience the thrill of the IPL mega auction. Scout the player database, manage your franchise purse, and outbid your opponents in real-time.
        </p>
        
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link 
            href="/auction"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-slate-950 font-bold bg-amber-500 hover:bg-amber-600 transition-all shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] h-14 px-8 text-lg"
          >
            Start Auction <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          
          <Link 
            href="/players"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-white font-medium border border-slate-700 bg-slate-900/50 hover:bg-slate-800 backdrop-blur-sm transition-all h-14 px-8 text-lg"
          >
            <Users className="h-5 w-5 mr-2" /> Scout Players
          </Link>
        </div>
      </div>
    </div>
  );
}
