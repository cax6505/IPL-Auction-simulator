"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Plane } from "lucide-react";
import type { PlayerRecord } from "@/lib/types/player";

export function PlayerCard({ player }: { player: PlayerRecord }) {
  // Format price if available
  const priceDisplay = player.sold_price_cr 
    ? `₹${player.sold_price_cr} Cr` 
    : player.base_price_cr 
      ? `₹${player.base_price_cr} Cr Base` 
      : "TBD";

  // Determine role color styling based on real playauctiongame.com inspiration
  const roleColorMap: Record<string, string> = {
    BAT: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    BOWL: "bg-red-500/10 text-red-500 border-red-500/20",
    AR: "bg-green-500/10 text-green-500 border-green-500/20",
    WK: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  const roleStyle = roleColorMap[player.role.toUpperCase()] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

  return (
    <Card className="group overflow-hidden bg-slate-900/40 backdrop-blur-md border-slate-800 transition-all hover:bg-slate-900/60 hover:border-slate-700 hover:shadow-[0_0_20px_-5px_rgba(251,191,36,0.15)] flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full bg-slate-950 flex items-end justify-center border-b border-white/5 overflow-hidden">
          {/* Aesthetic deterministic placeholder image based on Player Name */}
          <img 
            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=0f172a,1e293b,334155&textColor=cbd5e1&fontSize=40`}
            alt={player.name}
            className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500 z-0"
          />
          {/* Fade gradient from image to card body */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-900/90 to-transparent z-10" />
          
          <div className="absolute top-3 left-3 flex gap-2 z-20">
            <Badge variant="outline" className={`${roleStyle} backdrop-blur-md`}>
              {player.role.toUpperCase()}
            </Badge>
          </div>

          {player.is_overseas && (
            <div className="absolute top-3 right-3 text-white bg-slate-900/60 p-1.5 rounded-full backdrop-blur-md border border-white/10 z-20" title="Overseas Player">
              <Plane className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-5">
        <div className="flex flex-col h-full justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-1 group-hover:text-amber-400 transition-colors line-clamp-1">
              {player.name}
            </h3>
            <p className="text-sm font-medium text-slate-400 mb-4">{player.nationality}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col bg-black/20 p-2 rounded-md border border-white/5">
              <span className="text-slate-500 uppercase font-mono text-[10px]">Capped</span>
              <span className="text-slate-300 font-medium capitalize">{player.capped_status}</span>
            </div>
            <div className="flex flex-col bg-black/20 p-2 rounded-md border border-white/5">
              <span className="text-slate-500 uppercase font-mono text-[10px]">Set</span>
              <span className="text-slate-300 font-medium truncate">{player.auction_set || 'Unassigned'}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-5 pt-0 border-t border-white/5 bg-slate-950/20 mt-auto">
        <div className="flex w-full items-center justify-between pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-0.5">
              {player.contract_type_2026 === 'RETAINED' ? 'Retained Value' : 'Base Price'}
            </span>
            <span className="text-lg font-bold text-amber-400">
              {priceDisplay}
            </span>
          </div>

          <div className="flex flex-col text-right">
             <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-0.5">
               2025 Team
             </span>
             <span className="text-sm font-bold text-slate-300">
               {player.ipl_team_2025 || 'None'}
             </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
