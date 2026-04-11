"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Flame, Rocket, Coffee, Zap, History } from "lucide-react";

const TEAM_MAP = [
  { id: "MI", color: "bg-blue-600", text: "text-white" },
  { id: "CSK", color: "bg-yellow-400", text: "text-slate-900" },
  { id: "RCB", color: "bg-red-600", text: "text-white" },
  { id: "KKR", color: "bg-[#3a225d]", text: "text-white" },
  { id: "DC", color: "bg-[#0077B6]", text: "text-white" },
  { id: "PBKS", color: "bg-[#ED1B24]", text: "text-white" },
  { id: "RR", color: "bg-[#EA1A85]", text: "text-white" },
  { id: "SRH", color: "bg-[#F26522]", text: "text-white" },
  { id: "GT", color: "bg-[#1B2133]", text: "text-white" },
  { id: "LSG", color: "bg-[#A72056]", text: "text-white" },
];

export default function CreateAuctionDashboard() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [userName, setUserName] = useState("Player");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [gameType, setGameType] = useState<"cricket" | "football">("cricket");

  const handleCreateRoom = async () => {
    if (!selectedTeam) {
      alert("Please choose a team to control first!");
      return;
    }

    setIsCreating(true);

    try {
      // 1. Create the room in Supabase
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert([{ status: "waiting" }])
        .select()
        .single();

      if (roomError) throw roomError;

      // 2. Insert Host as the franchise owner
      await supabase.from("room_franchises").insert([{
        room_id: room.id,
        team_id: selectedTeam,
        user_name: userName,
        is_host: true
      }]);

      // 3. Mark in session that I specifically am controlling this team locally
      sessionStorage.setItem(`auction_${room.id}_team`, selectedTeam);

      // 4. Redirect to the new lobby
      router.push(`/auction/${room.id}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Please check your database connection.");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center py-10 px-4 md:px-8 font-sans">
      
      {/* PROMO BANNERS */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 bg-amber-900/20 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-500 font-semibold">
            <Flame className="h-5 w-5" /> 2026 Official List • 350 players
          </div>
          <span className="bg-amber-600/20 text-amber-500 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-amber-500/10">New</span>
        </div>
        <div className="flex-1 bg-purple-900/20 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-purple-400 font-semibold">
            <Rocket className="h-5 w-5" /> Play IPL Simulation Game!
          </div>
          <span className="bg-green-500/20 text-green-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">Live</span>
        </div>
      </div>
      
      <div className="w-full max-w-4xl bg-green-900/20 border border-green-500/20 rounded-xl p-4 flex items-center justify-between mb-10">
        <div className="flex items-center gap-3 text-green-500 font-semibold">
          <Coffee className="h-5 w-5" /> Enjoyed it? Buy us a coffee!
        </div>
        <button className="bg-green-600 hover:bg-green-500 transition-colors text-white text-xs font-bold px-4 py-2 rounded">
          Support
        </button>
      </div>

      {/* DASHBOARD CARD */}
      <Card className="w-full max-w-4xl bg-[#111111] border-[#222] shadow-2xl rounded-2xl overflow-hidden">
        
        {/* TOP TABS */}
        <div className="flex border-b border-[#222]">
           <button className="flex-1 py-4 flex items-center justify-center gap-2 text-amber-400 font-bold border-b-2 border-amber-400 bg-amber-400/5">
              <Zap className="h-4 w-4" /> New Game
           </button>
           <button className="flex-1 py-4 flex items-center justify-center gap-2 text-slate-500 font-medium hover:text-slate-300 transition-colors">
              <History className="h-4 w-4" /> Recent (6)
           </button>
        </div>

        <CardContent className="p-6 md:p-10 flex flex-col gap-8">
           
  

           {/* NAME INPUT */}
           <div className="flex flex-col gap-2">
             <label className="text-slate-400 font-medium text-sm">Your Name</label>
             <Input 
               value={userName}
               onChange={(e) => setUserName(e.target.value)}
               className="bg-[#181818] border-[#333] h-14 text-lg text-white px-4 rounded-xl focus-visible:ring-amber-500/50 focus-visible:border-amber-500"
               placeholder="Enter your name..."
             />
           </div>

           {/* TEAM SELECTOR */}
           <div className="flex flex-col gap-3">
             <label className="text-slate-400 font-medium text-sm">Choose Your Team</label>
             <div className="flex flex-wrap gap-4 mt-2">
               {TEAM_MAP.map((team) => (
                 <button
                   key={team.id}
                   onClick={() => setSelectedTeam(team.id)}
                   className={`h-16 w-16 rounded-full font-black text-sm flex items-center justify-center transition-all ${team.color} ${team.text} ${
                     selectedTeam === team.id 
                       ? 'ring-4 ring-white ring-offset-4 ring-offset-[#111111] scale-110' 
                       : 'hover:scale-105 hover:shadow-xl opacity-90'
                   }`}
                   title={team.id}
                 >
                   {team.id}
                 </button>
               ))}
             </div>
           </div>

           {/* SUBMIT BUTTON */}
           <Button 
             onClick={handleCreateRoom} 
             disabled={isCreating || !selectedTeam}
             className="w-full h-16 text-xl bg-orange-500 hover:bg-orange-400 text-white font-extrabold rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(249,115,22,0.4)] mt-4 disabled:opacity-50 disabled:shadow-none"
           >
             {isCreating ? (
               <Loader2 className="mr-2 h-6 w-6 animate-spin" />
             ) : (
               <><Zap className="mr-2 h-6 w-6" /> Create Room</>
             )}
           </Button>

        </CardContent>
      </Card>
    </div>
  );
}
