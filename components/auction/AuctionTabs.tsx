"use client";

import { useState, useEffect } from "react";
import { useAuction } from "./AuctionContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, CheckCircle2, MessageCircle, Send } from "lucide-react";
import { TEAM_MAP, formatPriceCr } from "@/lib/auction-engine";
import { Badge } from "@/components/ui/badge";

export function AuctionTabs() {
  const { logs, chatMessages, sendChatMessage, claimedTeams, onlineUsers, loadSquad } = useAuction();
  const [activeTab, setActiveTab] = useState("chat");
  const [chatInput, setChatInput] = useState("");

  // Helper to strip emojis for a cleaner feed
  const stripEmojis = (str: string) => str.replace(/[\u1000-\uFFFF]+/g, '').trim();

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  return (
    <div className="flex-1 glass-card rounded-[20px] flex flex-col overflow-hidden min-h-[300px] animate-fade-in shadow-2xl">
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
        {/* Header Tabs */}
        <div className="border-b border-white/[0.04] bg-black/40 shrink-0 overflow-x-auto no-scrollbar">
          <TabsList variant="underline" className="w-full h-14 min-w-max px-2">
            <TabsTrigger variant="underline" value="chat" className="px-4 shrink-0 h-full gap-2">
              <MessageCircle className="h-4 w-4" /> Room Chat
            </TabsTrigger>
            <TabsTrigger variant="underline" value="activity" className="px-4 shrink-0 h-full gap-2">
              <MessageSquare className="h-4 w-4" /> Activity Feed
            </TabsTrigger>
            <TabsTrigger variant="underline" value="squad" className="px-4 shrink-0 h-full gap-2 relative">
              <Users className="h-4 w-4" /> Franchises
              <div className={`absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] sm:hidden ${onlineUsers.length > 0 ? 'block' : 'hidden'}`} />
              <Badge variant="outline" className="ml-1 bg-black/50 text-[9px] shadow-inner border-white/10 hidden sm:inline-flex">
                {onlineUsers.length} Online
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#09090b]/50 p-4 min-h-0 flex flex-col">
          {activeTab === "chat" ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 no-scrollbar flex flex-col">
                 {chatMessages.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12 m-auto">
                      <MessageCircle className="h-8 w-8 mb-3 opacity-20" />
                      <p className="text-[11px] font-mono tracking-widest uppercase">No messages yet. Start strategizing!</p>
                   </div>
                 )}
                 <div className="mt-auto">
                   {chatMessages.map((msg, i) => (
                     <div key={msg.id} className="flex gap-2.5 animate-fade-in group mb-3">
                       <div className="h-7 w-7 rounded border border-white/5 bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-[10px] text-white shadow-inner uppercase">
                         {msg.sender.substring(0,2)}
                       </div>
                       <div className="flex flex-col min-w-0">
                         <div className="flex items-center gap-2 mb-0.5">
                           <span className="text-[11px] font-bold text-zinc-300">{msg.sender}</span>
                           <span className="text-[9px] text-zinc-600 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                         <p className="text-sm text-zinc-400 break-words leading-snug">{msg.text}</p>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
              <form onSubmit={handleSendChat} className="mt-auto shrink-0 relative">
                 <input 
                    type="text" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Send a message to the room..." 
                    className="w-full bg-black/60 border border-white/[0.06] rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:bg-black/80 transition-all shadow-inner"
                 />
                 <button type="submit" disabled={!chatInput.trim()} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 rounded-lg transition-colors">
                    <Send className="h-4 w-4" />
                 </button>
              </form>
            </div>
          ) : activeTab === "activity" ? (
            <div className="flex flex-col gap-2.5">
              {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mb-3" />
                  <p className="text-[11px] font-mono tracking-widest uppercase">System connected. Waiting for auction...</p>
                </div>
              )}
              {/* React rendering reversed list so latest is always at the top */}
              {[...logs].reverse().map((log: LogMessage) => (
                <div key={log.id} className="flex items-start gap-2 bg-transparent border-b border-border/5 px-2 py-1.5 hover:bg-white/[0.01] transition-colors rounded-none animate-fade-in">
                  <div className={`mt-0.5 shrink-0 flex items-center justify-center h-4 w-4 rounded-sm ${
                    log.type === "sys" ? "bg-amber-500/10 text-amber-500" :
                    log.type === "join" ? "bg-green-500/10 text-green-500" :
                    "bg-blue-500/10 text-blue-400"
                  }`}>
                    {log.type === "sys" && <span className="text-[8px]">•</span>}
                    {log.type === "join" && <span className="text-[8px]">+</span>}
                    {log.type === "bid" && <span className="text-[9px] font-black">₹</span>}
                  </div>
                  <span className={`text-xs leading-snug font-medium pt-[1px] ${
                    log.type === "sys" ? "text-amber-400" : 
                    log.type === "join" ? "text-green-400/80" : 
                    "text-zinc-400"
                  }`}>
                    {stripEmojis(log.text)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {claimedTeams.map((teamData: RoomFranchise) => {
                const isOnline = onlineUsers.some(u => u.team === teamData.team_id);
                const meta = TEAM_MAP.find(t => t.id === teamData.team_id);
                return (
                  <div 
                    key={teamData.id} 
                    onClick={() => loadSquad(teamData.team_id)}
                    className="glass-card hover:glass-card-hover cursor-pointer border border-white/[0.04] p-4 rounded-xl relative group overflow-hidden transition-all duration-300 ease-spring"
                  >
                    {/* Background glow tint */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none group-hover:from-white/[0.05] transition-colors" />
                    
                    {teamData.is_host && (
                      <span className="absolute top-3 right-3 text-[9px] uppercase tracking-[0.2em] bg-amber-500/20 text-amber-500 font-bold px-2 py-0.5 rounded shadow-sm border border-amber-500/20">
                        HOST
                      </span>
                    )}
                    
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className={`h-11 w-11 rounded-lg flex justify-center items-center font-black shadow-inner border border-black/20 ${meta?.color || "bg-zinc-700"} ${meta?.textDark ? "text-zinc-900" : "text-white"}`}>
                        {teamData.team_id}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white flex items-center gap-2 text-sm tracking-tight">
                          {teamData.user_name}
                          <div className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-white/10"}`} title={isOnline ? "Online" : "Offline"} />
                        </span>
                        <span className="text-xs text-amber-500 font-mono font-bold tracking-tight">
                          {formatPriceCr(Number(teamData.purse_remaining_cr || 0))}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg mt-auto border border-white/[0.02] shadow-inner mb-2">
                       <div className="flex flex-col items-center">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">Squad</span>
                          <span className="text-xs font-mono font-bold text-zinc-300">{teamData.squad_count || 0}<span className="text-zinc-600 text-[10px]">/25</span></span>
                       </div>
                       <div className="h-6 w-px bg-white/[0.06]" />
                       <div className="flex flex-col items-center">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">Overseas</span>
                          <span className="text-xs font-mono font-bold text-blue-400">{teamData.overseas_count || 0}<span className="text-zinc-600 text-[10px]">/8</span></span>
                       </div>
                    </div>

                    <div className="w-full text-center text-[10px] uppercase font-bold tracking-widest text-zinc-500 group-hover:text-amber-500 transition-colors">
                      View full roster →
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Tabs>

      {/* Footer Connection Status */}
      <div className="px-4 py-3 border-t border-white/[0.04] bg-black/40 shrink-0 flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-zinc-500 font-semibold shadow-inner">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Live Web Socket Connected
      </div>
    </div>
  );
}
