"use client";

import { useState } from "react";
import { useAuction } from "./AuctionContext";
import { Input } from "@/components/ui/input";
import { MessageSquare, Users, Send } from "lucide-react";
import { TEAM_MAP, formatPriceCr } from "@/lib/auction-engine";

export function AuctionTabs() {
  const { logs, claimedTeams, onlineUsers, loadSquad } = useAuction();
  const [activeTab, setActiveTab] = useState<"activity" | "squad">("activity");

  return (
    <div className="flex-1 bg-[#0A0A0A] border border-white/[0.04] rounded-2xl flex flex-col overflow-hidden shadow-2xl min-h-[300px]">
      <div className="flex border-b border-white/[0.04] bg-white/[0.02] shrink-0">
        <button 
          onClick={() => setActiveTab("activity")} 
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-2 transition-all ${
            activeTab === "activity" ? "text-amber-500 border-b-2 border-amber-500 bg-amber-500/5" : "text-slate-500 hover:text-slate-400 hover:bg-white/[0.02]"
          }`}
        >
          <MessageSquare className="h-4 w-4" /> Activity Log
        </button>
        <button 
          onClick={() => setActiveTab("squad")} 
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-2 transition-all ${
            activeTab === "squad" ? "text-amber-500 border-b-2 border-amber-500 bg-amber-500/5" : "text-slate-500 hover:text-slate-400 hover:bg-white/[0.02]"
          }`}
        >
          <Users className="h-4 w-4" /> Franchises ({onlineUsers.length} Online)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#050505] min-h-0">
        {activeTab === "activity" ? (
          <>
            {logs.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs italic p-4">
                System connected. Waiting for drafting to begin...
              </div>
            )}
            {[...logs].reverse().map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] p-2.5 px-4 rounded-xl animate-in slide-in-from-bottom-2 fade-in">
                {log.type === "sys" && <span className="text-amber-500 text-sm w-5 text-center">⚡</span>}
                {log.type === "join" && <span className="text-green-500 text-sm w-5 text-center">✦</span>}
                {log.type === "bid" && <span className="text-blue-500 text-sm w-5 text-center font-bold">₹</span>}
                <span className={`text-xs font-medium ${
                  log.type === "sys" ? "text-amber-400 font-bold" : 
                  log.type === "join" ? "text-green-400" : 
                  log.type === "bid" ? "text-slate-200" : "text-slate-400"
                }`}>
                  {log.text}
                </span>
              </div>
            ))}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {claimedTeams.map((teamData: any) => {
              const isOnline = onlineUsers.some(u => u.team === teamData.team_id);
              const meta = TEAM_MAP.find(t => t.id === teamData.team_id);
              return (
                <div 
                  key={teamData.id} 
                  onClick={() => loadSquad(teamData.team_id)}
                  className="flex flex-col bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer border border-white/[0.04] p-4 rounded-2xl relative hover:border-white/10 group overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 bg-gradient-to-br ${meta?.color} to-transparent rounded-bl-full pointer-events-none`} />
                  {teamData.is_host && <span className="absolute top-3 right-3 text-[8px] uppercase tracking-widest bg-amber-500/20 text-amber-500 font-bold px-2 py-1 rounded">HOST</span>}
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-xl flex justify-center items-center font-black shadow-inner ${meta?.color || "bg-slate-700"} ${meta?.textDark ? "text-slate-900" : "text-white"}`}>
                      {teamData.team_id}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white flex items-center gap-2 text-sm">
                        {teamData.user_name}
                        <div className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-white/10"}`} title={isOnline ? "Online" : "Offline"} />
                      </span>
                      <span className="text-xs text-amber-500 font-medium">{formatPriceCr(Number(teamData.purse_remaining_cr || 0))} Cr</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 bg-black/20 p-2 rounded-lg mt-auto">
                    <span>{teamData.squad_count || 0}/25 PLR</span>
                    <span className="text-blue-400/80">{teamData.overseas_count || 0}/8 OS</span>
                    <span className="text-amber-500/80 group-hover:text-amber-400 transition-colors">Squad →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/[0.04] bg-white/[0.02] shrink-0">
        <div className="relative">
          <Input 
            readOnly 
            placeholder="Live event stream connected..." 
            className="bg-black/50 border-white/5 pr-10 text-xs font-medium text-slate-500 focus-visible:ring-0 cursor-default" 
          />
          <Send className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/10" />
        </div>
      </div>
    </div>
  );
}
