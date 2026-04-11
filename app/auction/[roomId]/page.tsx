"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Share2, Pause, Play, Square, MessageSquare, Menu, Send, Flame, Users } from "lucide-react";
import { calculateNextBid, IPL_RULES } from "@/lib/auction-engine";

const TEAM_MAP = [
  { id: "MI", color: "bg-blue-600", border: 'border-blue-500' },
  { id: "CSK", color: "bg-yellow-500", border: 'border-yellow-400' },
  { id: "RCB", color: "bg-red-600", border: 'border-red-500' },
  { id: "KKR", color: "bg-[#3a225d]", border: 'border-purple-500' },
  { id: "DC", color: "bg-[#0077B6]", border: 'border-blue-400' },
  { id: "PBKS", color: "bg-[#ED1B24]", border: 'border-red-400' },
  { id: "RR", color: "bg-[#EA1A85]", border: 'border-pink-500' },
  { id: "SRH", color: "bg-[#F26522]", border: 'border-orange-500' },
  { id: "GT", color: "bg-[#1B2133]", border: 'border-slate-500' },
  { id: "LSG", color: "bg-[#A72056]", border: 'border-fuchsia-600' },
];

export default function LiveRoomCompact() {
  const { roomId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  
  // States
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [claimedTeams, setClaimedTeams] = useState<any[]>([]);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [allPlayersForHost, setAllPlayersForHost] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState("activity");
  const [logs, setLogs] = useState<{id: string, text: string, type: 'bid'|'join'|'sys'}[]>([]);

  // Init Data Sync
  useEffect(() => {
    const fetchInit = async () => {
      const storedTeam = sessionStorage.getItem(`auction_${roomId}_team`);
      if (storedTeam) setMyTeamId(storedTeam);

      const [rData, tData, fData, pData] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", roomId).single(),
        supabase.from("teams").select("*"),
        supabase.from("room_franchises").select("*").eq("room_id", roomId),
        supabase.from("players").select("id, name, base_price_cr, role")
      ]);

      if (rData.data) setRoom(rData.data);
      if (tData.data) setAllTeams(tData.data);
      if (fData.data) setClaimedTeams(fData.data);
      if (pData.data) setAllPlayersForHost(pData.data);
      
      setLoading(false);
    };
    fetchInit();

    const channel = supabase.channel(`room_${roomId}`);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (p) => setRoom(p.new))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_franchises', filter: `room_id=eq.${roomId}` }, (p) => {
        setClaimedTeams(prev => [...prev, p.new]);
        setLogs(prev => [...prev, { id: crypto.randomUUID(), text: `${p.new.user_name} claimed ${p.new.team_id}`, type: 'join' }]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: `room_id=eq.${roomId}` }, (p) => {
        setLogs(prev => [...prev, { id: crypto.randomUUID(), text: `${p.new.team_id} bid ₹${p.new.amount_cr} Cr`, type: 'bid' }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // Player Sync
  useEffect(() => {
    if (room?.current_player_id) {
       supabase.from("players").select("*").eq("id", room.current_player_id).single()
         .then(({ data }) => setCurrentPlayer(data));
       if (room.current_bid_cr === 0) {
         setLogs(prev => [...prev, { id: crypto.randomUUID(), text: `Auction started for player.`, type: 'sys' }]);
       }
    } else {
       setCurrentPlayer(null);
    }
  }, [room?.current_player_id, room?.current_bid_cr]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Room URL Copied to clipboard!");
  };

  const handleClaim = async (tid: string) => {
    setMyTeamId(tid);
    sessionStorage.setItem(`auction_${roomId}_team`, tid);
    await supabase.from("room_franchises").insert([{ room_id: roomId, team_id: tid, user_name: "Player" }]);
  };

  const handleBid = async () => {
    if (!room || !currentPlayer || !myTeamId) return;
    const currentBid = room.current_bid_cr || 0;
    const nextBid = currentBid === 0 ? currentPlayer.base_price_cr : calculateNextBid(currentBid, currentPlayer.base_price_cr);
    
    await supabase.from("bids").insert([{ room_id: roomId, player_id: currentPlayer.id, team_id: myTeamId, amount_cr: nextBid }]);
    await supabase.from("rooms").update({ current_bid_cr: nextBid, current_highest_bidder_id: myTeamId }).eq('id', roomId);
  };

  const hostControlPlayer = async (pid: string) => {
    await supabase.from("rooms").update({ current_player_id: pid, current_bid_cr: 0, current_highest_bidder_id: null, status: 'active' }).eq('id', roomId);
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-amber-500 h-8 w-8"/></div>;

  const currentBid = room?.current_bid_cr || 0;
  const isHighest = room?.current_highest_bidder_id === myTeamId;
  const nextCalculated = currentPlayer ? (currentBid === 0 ? currentPlayer.base_price_cr : calculateNextBid(currentBid, currentPlayer.base_price_cr)) : 0;

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-slate-300 font-sans flex flex-col">
       
       {/* TOP HEADER (Compact) */}
       <header className="h-14 border-b border-[#222] bg-[#111] flex items-center justify-between px-4">
         <div className="flex items-center gap-4">
            <span className="text-slate-400 font-medium text-sm">Room: <span className="text-amber-500 font-bold tracking-wider">{String(roomId).substring(0, 8).toUpperCase()}</span></span>
         </div>
         <div className="flex items-center gap-2">
            
            {/* Host Controls Inline Dropdown */}
            {myTeamId && (
              <select 
                className="bg-[#222] border border-[#333] text-xs h-8 px-2 rounded hidden sm:block text-slate-300"
                onChange={(e) => hostControlPlayer(e.target.value)}
                value={room?.current_player_id || ""}
              >
                <option value="" disabled>Host: Next Player...</option>
                {allPlayersForHost.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}

            <Button size="sm" variant="outline" className="h-8 border-[#333] text-amber-500 hover:bg-[#222]"><Pause className="h-4 w-4" /></Button>
            <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white"><Square className="h-3 w-3 mr-1" /> End</Button>
         </div>
       </header>

       <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-4">
          
          {/* DYNAMIC TOP BLOCK */}
          {room?.status === 'waiting' || !currentPlayer ? (
            
            <div className="flex flex-col gap-4">
              {/* Share Block */}
              <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
                 <p className="text-xs text-amber-500 flex items-center font-bold uppercase tracking-wider mb-2"><Share2 className="h-3 w-3 mr-2"/> Invite Friends</p>
                 <div className="flex gap-2">
                    <Input readOnly value={window.location.href} className="bg-[#0A0A0A] border-[#333] h-10 text-xs" />
                    <Button onClick={handleShare} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-10 px-6">Share</Button>
                 </div>
              </div>

              {/* Compact Team Selector (Only show if haven't picked) */}
              {!myTeamId && (
                <div className="bg-[#141414] border border-amber-500/20 rounded-xl p-4">
                  <p className="text-xs text-amber-500 flex items-center font-bold uppercase tracking-wider mb-4">Select Your Team</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {TEAM_MAP.map(t => {
                      const isClaimed = claimedTeams.some(c => c.team_id === t.id);
                      return (
                        <button key={t.id} disabled={isClaimed} onClick={() => handleClaim(t.id)} 
                          className={`h-12 w-12 rounded-full font-black text-xs flex items-center justify-center border-2 border-[#111] transition-transform hover:scale-110 ${isClaimed ? 'bg-[#222] text-[#555] cursor-not-allowed' : `${t.color} text-white`}`}>
                          {t.id}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

          ) : (

            /* HORIZONTAL BIDDING CONSOLE */
            <div className="bg-gradient-to-r from-slate-900 to-[#111] border border-[#333] rounded-xl overflow-hidden shadow-2xl relative">
              <div className="h-1 bg-red-600 w-full" /> {/* Fake Timer Bar */}
              <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                
                {/* Player Profile */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-[#222] rounded-full border-2 border-white/10 flex items-center justify-center font-bold text-white relative overflow-hidden">
                    <img src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentPlayer.name)}&backgroundColor=111&textColor=cbd5e1`} 
                         className="absolute inset-0 object-cover opacity-80" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 rounded-full uppercase tracking-wider font-bold">{currentPlayer.role}</span>
                      <span className="text-[10px] bg-white/10 text-white/50 px-2 rounded-full uppercase">{currentPlayer.nationality === 'India' ? 'IND' : 'OS'}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{currentPlayer.name}</h2>
                  </div>
                </div>
                
                {/* Bid Tracker */}
                <div className="flex items-center gap-6 text-right">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-bold tracking-widest">{currentBid === 0 ? "BASE PRICE" : "CURRENT BID"}</span>
                    <span className="text-2xl font-black text-white">{currentBid === 0 ? currentPlayer.base_price_cr : currentBid} Cr</span>
                    {currentBid > 0 && <span className="text-[10px] text-amber-500 tracking-wider">held by {room.current_highest_bidder_id}</span>}
                  </div>

                  <Button 
                    onClick={handleBid} 
                    disabled={isHighest || !myTeamId}
                    className={`h-16 px-8 text-xl font-black rounded-xl transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                      !myTeamId 
                        ? 'bg-[#333] text-[#666] border-[#222]' 
                        : isHighest 
                          ? 'bg-blue-600 border-blue-800 text-white cursor-not-allowed' 
                          : 'bg-[#00A859] hover:bg-[#00964D] border-[#00703C] text-white shadow-[0_0_20px_-5px_rgba(0,168,89,0.5)]'
                    }`}
                  >
                    {!myTeamId ? 'PICK TEAM TO BID' : isHighest ? 'HOLDING BID' : `BID ${nextCalculated} Cr`}
                  </Button>
                </div>

              </div>
            </div>

          )}

          {/* LOWER SECTION: ACTIVITY FEED TABS */}
          <div className="flex-1 bg-[#141414] border border-[#222] rounded-xl flex flex-col mt-2 overflow-hidden shadow-xl">
             
             {/* Tabs */}
             <div className="flex border-b border-[#222] bg-[#111]">
               <button onClick={()=>setActiveTab('activity')} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'activity' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-slate-400'}`}><MessageSquare className="h-4 w-4"/> Activity</button>
               <button onClick={()=>setActiveTab('squad')} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'squad' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-slate-400'}`}><Users className="h-4 w-4"/> Squad</button>
             </div>

             {/* Auto-scrolling Feed */}
             <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 bg-[#0E0E0E]">
                {logs.length === 0 && <div className="text-center text-slate-600 text-xs mt-10 p-4 border border-dashed border-[#222] rounded-xl">No recent activity. Auction is waiting to begin.</div>}
                
                {logs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 bg-[#161616] border border-[#222] p-2 px-3 rounded-lg animate-in slide-in-from-bottom-2 fade-in">
                    {log.type === 'sys' ? <Flame className="h-4 w-4 text-amber-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    <span className={`text-sm ${log.type === 'bid' ? 'text-amber-300 font-bold' : log.type === 'sys' ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>{log.text}</span>
                  </div>
                ))}
             </div>

             {/* Fake input box at bottom */}
             <div className="p-3 border-t border-[#222] bg-[#111]">
                <div className="relative">
                  <Input readOnly placeholder="Real-time log stream connected..." className="bg-[#1A1A1A] border-[#333] pr-10 text-sm text-slate-500 focus-visible:ring-0 cursor-default" />
                  <Send className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
                </div>
             </div>

          </div>

       </div>
    </div>
  );
}
