"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Share2, Pause, Play, Square, MessageSquare, Send, Flame, Users } from "lucide-react";
import { calculateNextBid, canAffordBid, IPL_RULES } from "@/lib/auction-engine";

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

const TIMER_DURATION_MS = 10000;

export default function LiveRoomCompact() {
  const router = useRouter();
  const { roomId } = useParams();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);

  const [claimedTeams, setClaimedTeams] = useState<any[]>([]);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [allPlayersForHost, setAllPlayersForHost] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState("activity");
  const [logs, setLogs] = useState<{ id: string; text: string; type: 'bid' | 'join' | 'sys' }[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [showSoldFlash, setShowSoldFlash] = useState<{ team: string; name: string; amount: number } | null>(null);
  const [showSquadsModal, setShowSquadsModal] = useState<string | null>(null);
  const [squadsMap, setSquadsMap] = useState<Record<string, any[]>>({});
  const [isAuctionComplete, setIsAuctionComplete] = useState(false);
  const [isBidding, setIsBidding] = useState(false); // BUG FIX: bidding lock

  // Stable refs — never stale in timer callback
  const soldFiredRef = useRef(false);
  const allPlayersRef = useRef<any[]>([]);
  const claimedTeamsRef = useRef<any[]>([]);
  const myTeamIdRef = useRef<string | null>(null);
  const roomRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // Keep refs in sync
  useEffect(() => { allPlayersRef.current = allPlayersForHost; }, [allPlayersForHost]);
  useEffect(() => { claimedTeamsRef.current = claimedTeams; }, [claimedTeams]);
  useEffect(() => { myTeamIdRef.current = myTeamId; }, [myTeamId]);
  useEffect(() => { roomRef.current = room; }, [room]);

  const addLog = useCallback((text: string, type: 'bid' | 'join' | 'sys') => {
    setLogs(prev => [...prev, { id: crypto.randomUUID(), text, type }]);
  }, []);

  // ── INIT ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchInit = async () => {
      const storedTeam = sessionStorage.getItem(`auction_${roomId}_team`);
      if (storedTeam) {
        setMyTeamId(storedTeam);
        myTeamIdRef.current = storedTeam;
      }

      // Track in recents
      const loadedHist = localStorage.getItem("ipl_recent_rooms");
      let historyRooms = loadedHist ? JSON.parse(loadedHist) : [];
      historyRooms = historyRooms.filter((h: any) => h.id !== roomId);
      historyRooms.unshift({ id: roomId, date: new Date().toLocaleDateString() });
      localStorage.setItem("ipl_recent_rooms", JSON.stringify(historyRooms.slice(0, 6)));

      const [rData, tData, fData, bData] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", roomId).single(),
        supabase.from("teams").select("*"),
        supabase.from("room_franchises").select("*").eq("room_id", roomId).order("joined_at", { ascending: true }),
        supabase.from("bids").select("*").eq("room_id", roomId).order("created_at", { ascending: true })
      ]);

      if (rData.data) {
        setRoom(rData.data);
        roomRef.current = rData.data;
      }

      // Mode-aware player fetch
      const mode = rData.data?.auction_mode || 'mega_auction';
      let playerQuery = supabase.from("players").select("id, name, base_price_cr, role, is_overseas, nationality, contract_type_2026");
      if (mode === 'mock_2026') {
        // Core IPL Rule: only un-retained players go to auction.
        // Exclude RETAINED/TRADED players — they are already with their teams.
        playerQuery = playerQuery
          .or('contract_type_2026.is.null,contract_type_2026.eq.AUCTION')
          .order('base_price_cr', { ascending: false })
          .limit(350);
      } else if (mode === 'legends_upgraded') {
        playerQuery = playerQuery.eq('is_overseas', true).order('base_price_cr', { ascending: false }).limit(248);
      } else {
        // mega_auction — all players
        playerQuery = playerQuery.order('base_price_cr', { ascending: false });
      }
      const { data: pData } = await playerQuery;
      if (pData) {
        setAllPlayersForHost(pData);
        allPlayersRef.current = pData;
      }

      if (fData.data) {
        setClaimedTeams(fData.data);
        claimedTeamsRef.current = fData.data;
        const joinLogs = fData.data.map((f: any) => ({
          id: crypto.randomUUID(),
          text: `${f.user_name} joined and claimed ${f.team_id}`,
          type: 'join' as const
        }));
        const bidLogs = (bData.data || []).map((b: any) => ({
          id: crypto.randomUUID(),
          text: `${b.team_id} bid ₹${Number(b.amount_cr).toFixed(2)} Cr`,
          type: 'bid' as const
        }));
        setLogs([...joinLogs, ...bidLogs]);
      }

      setLoading(false);
    };

    fetchInit();

    // ── REALTIME CHANNEL ───────────────────────────────────────────────────
    const channel = supabase.channel(`room_${roomId}`);
    channelRef.current = channel;

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (p) => {
        setRoom(p.new);
        roomRef.current = p.new;
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_franchises', filter: `room_id=eq.${roomId}` }, (p) => {
        setClaimedTeams(prev => {
          const exists = prev.some(t => t.team_id === p.new.team_id);
          const updated = exists ? prev : [...prev, p.new];
          claimedTeamsRef.current = updated;
          return updated;
        });
        addLog(`${p.new.user_name} claimed ${p.new.team_id}`, 'join');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'room_franchises', filter: `room_id=eq.${roomId}` }, (p) => {
        // Real-time purse update for all clients
        setClaimedTeams(prev => {
          const updated = prev.map(t => t.team_id === p.new.team_id ? { ...t, ...p.new } : t);
          claimedTeamsRef.current = updated;
          return updated;
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: `room_id=eq.${roomId}` }, (p) => {
        addLog(`${p.new.team_id} bid ₹${Number(p.new.amount_cr).toFixed(2)} Cr`, 'bid');
      })
      // BUG FIX: Listen for sold player inserts to invalidate squad cache
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_sold_players', filter: `room_id=eq.${roomId}` }, (p) => {
        const sale = p.new as any;
        // Invalidate cached squad for the buying team so it reloads fresh
        setSquadsMap(prev => {
          const updated = { ...prev };
          delete updated[sale.team_id];
          return updated;
        });
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const active: any[] = Object.values(state).map((arr: any) => arr[0]);
        setOnlineUsers(active);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const cachedTeam = sessionStorage.getItem(`auction_${roomId}_team`);
          await channel.track({
            online_at: new Date().toISOString(),
            team: cachedTeam || 'Spectator'
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // ── PLAYER SYNC ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (room?.current_player_id) {
      soldFiredRef.current = false;
      supabase.from("players").select("*").eq("id", room.current_player_id).single()
        .then(({ data }) => {
          setCurrentPlayer(data);
          addLog(`🔥 Now bidding: ${data?.name}`, 'sys');
        });
    } else {
      setCurrentPlayer(null);
    }
  }, [room?.current_player_id]); // ONLY depends on player change, not bid changes

  // ── AUTO-ADVANCE (Host side) ─────────────────────────────────────────────────
  const advanceAuction = useCallback(async () => {
    const currentRoom = roomRef.current;
    const players = allPlayersRef.current;
    const teams = claimedTeamsRef.current;
    const myId = myTeamIdRef.current;

    const myRec = teams.find(c => c.team_id === myId);
    const imHost = myRec?.is_host === true;
    if (!imHost) return; // Only host advances auction

    const finalBid = Number(currentRoom?.current_bid_cr) || 0;
    const winnerId = currentRoom?.current_highest_bidder_id;
    const currentPid = currentRoom?.current_player_id;

    // Phase 1: Award player to winning team
    if (finalBid > 0 && winnerId) {
      const winnerRecord = teams.find(c => c.team_id === winnerId);
      if (winnerRecord) {
        // BUG FIX: Check PLAYER's overseas status, not the team's
        const currentPlayerData = players.find((p: any) => p.id === currentPid);
        const isOs = currentPlayerData?.is_overseas === true;

        const newPurse = Number(((Number(winnerRecord.purse_remaining_cr) || 125.0) - finalBid).toFixed(2));
        const newSquadSize = (winnerRecord.squad_count || 0) + 1;
        const newOverseasCount = (winnerRecord.overseas_count || 0) + (isOs ? 1 : 0);

        // Update franchise stats
        await supabase.from("room_franchises").update({
          purse_remaining_cr: newPurse,
          squad_count: newSquadSize,
          overseas_count: newOverseasCount
        }).eq('room_id', roomId).eq('team_id', winnerId);

        // BUG FIX: Write to room_sold_players (room-scoped) instead of global players table
        await supabase.from("room_sold_players").upsert([{
          room_id: roomId,
          player_id: currentPid,
          team_id: winnerId,
          sold_price_cr: finalBid,
          is_overseas: isOs,
        }], { onConflict: 'room_id,player_id' });
      }
    }

    // Phase 2: Advance to next player
    const currentIndex = players.findIndex(p => p.id === currentPid);
    if (currentIndex >= 0 && currentIndex < players.length - 1) {
      const nextPlayer = players[currentIndex + 1];
      const newTimer = new Date(Date.now() + TIMER_DURATION_MS).toISOString();
      await supabase.from("rooms").update({
        current_player_id: nextPlayer.id,
        current_bid_cr: 0,
        current_highest_bidder_id: null,
        status: 'active',
        timer_ends_at: newTimer
      }).eq('id', roomId);
    } else {
      setIsAuctionComplete(true);
      await supabase.from("rooms").update({ status: 'completed' }).eq('id', roomId);
      addLog('🏁 Auction Complete!', 'sys');
    }
  }, [roomId, addLog]);

  // ── TIMER CLOCK ─────────────────────────────────────────────────────────────
  // CRITICAL FIX: dependencies are ONLY room.status and timer_ends_at
  // We read other values via REFS to avoid stale closure AND avoid re-running on every bid
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (room?.status === 'active' && room?.timer_ends_at) {
      const timerEnd = new Date(room.timer_ends_at).getTime();

      const tick = () => {
        const remaining = Math.max(0, timerEnd - Date.now());
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);

          if (!soldFiredRef.current) {
            soldFiredRef.current = true;

            const currentRoom = roomRef.current;
            const finalBid = Number(currentRoom?.current_bid_cr) || 0;
            const winnerId = currentRoom?.current_highest_bidder_id;

            if (finalBid > 0 && winnerId) {
              const playerName = currentRoom?._playerName || '';
              setShowSoldFlash({ team: winnerId, name: playerName, amount: finalBid });
              setTimeout(() => setShowSoldFlash(null), 3000);
              addLog(`SOLD! ${winnerId} for ₹${finalBid.toFixed(2)} Cr`, 'sys');
            } else {
              addLog('UNSOLD.', 'sys');
            }

            // 2-second wait then advance (host only — checked inside advanceAuction)
            setTimeout(advanceAuction, 2000);
          }
        }
      };

      tick();
      interval = setInterval(tick, 100);
    } else {
      setTimeLeft(null);
    }

    return () => clearInterval(interval);
  }, [room?.status, room?.timer_ends_at]); // ONLY these two — no bid deps

  // ── HANDLERS ────────────────────────────────────────────────────────────────
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert("Room URL copied!");
    }
  };

  const handleClaim = async (tid: string) => {
    if (!joinName.trim()) { alert("Please enter a username."); return; }

    setMyTeamId(tid);
    myTeamIdRef.current = tid;
    sessionStorage.setItem(`auction_${roomId}_team`, tid);

    // BUG FIX: reuse existing channel instead of creating new one
    if (channelRef.current) {
      await channelRef.current.track({ online_at: new Date().toISOString(), team: tid });
    }

    await supabase.from("room_franchises").insert([{ room_id: roomId, team_id: tid, user_name: joinName }]);
  };

  const handleBid = async () => {
    if (!room || !currentPlayer || !myTeamId || isBidding) return;
    if (timeLeft !== null && timeLeft <= 0) return;

    setIsBidding(true); // BUG FIX: prevent double-tap
    try {
      const currentBidVal = Number(room.current_bid_cr) || 0;
      const nextBid = currentBidVal === 0
        ? Number(currentPlayer.base_price_cr)
        : calculateNextBid(currentBidVal, currentPlayer.base_price_cr);

      const { data: success, error } = await supabase.rpc('execute_bid', {
        p_room_id: roomId,
        p_player_id: currentPlayer.id,
        p_team_id: myTeamId,
        p_bid_amount: nextBid
      });

      if (error) addLog(`⚠️ Bid error: ${error.message}`, 'sys');
      else if (!success) addLog(`⚠️ Bid blocked (someone else bid first)`, 'sys');
    } finally {
      setIsBidding(false);
    }
  };

  const handlePause = async (isPausing: boolean) => {
    if (isPausing) {
      await supabase.from("rooms").update({ status: 'paused' }).eq('id', roomId);
    } else {
      const newTimer = new Date(Date.now() + TIMER_DURATION_MS).toISOString();
      await supabase.from("rooms").update({ status: 'active', timer_ends_at: newTimer }).eq('id', roomId);
    }
  };

  const handleEndAuction = async () => {
    if (!confirm("End the auction for all players?")) return;
    setIsAuctionComplete(true);
    await supabase.from("rooms").update({ status: 'completed' }).eq('id', roomId);
  };

  const hostControlPlayer = async (pid: string) => {
    const newTimer = new Date(Date.now() + TIMER_DURATION_MS).toISOString();
    await supabase.from("rooms").update({
      current_player_id: pid,
      current_bid_cr: 0,
      current_highest_bidder_id: null,
      status: 'active',
      timer_ends_at: newTimer
    }).eq('id', roomId);
  };

  const handleStartAuction = () => {
    if (allPlayersForHost.length > 0) hostControlPlayer(allPlayersForHost[0].id);
  };

  const loadSquad = async (teamId: string) => {
    setShowSquadsModal(teamId);
    if (!squadsMap[teamId]) {
      // BUG FIX: Query room_sold_players (room-scoped) joined with players
      // instead of the global players table which leaks data across rooms
      const { data: sales } = await supabase
        .from('room_sold_players')
        .select('player_id, team_id, sold_price_cr, is_overseas')
        .eq('room_id', roomId)
        .eq('team_id', teamId);

      if (sales && sales.length > 0) {
        // Fetch full player details for each sold player
        const playerIds = sales.map(s => s.player_id);
        const { data: playerDetails } = await supabase
          .from('players')
          .select('id, name, role, is_overseas')
          .in('id', playerIds);

        const merged = sales.map(sale => {
          const detail = playerDetails?.find(p => p.id === sale.player_id);
          return {
            id: sale.player_id,
            name: detail?.name || 'Unknown',
            role: detail?.role || 'N/A',
            is_overseas: detail?.is_overseas || sale.is_overseas,
            sold_price_cr: sale.sold_price_cr,
          };
        });
        setSquadsMap(prev => ({ ...prev, [teamId]: merged }));
      } else {
        setSquadsMap(prev => ({ ...prev, [teamId]: [] }));
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-amber-500 h-8 w-8" />
    </div>
  );

  // ── DERIVED VALUES ──────────────────────────────────────────────────────────
  const currentBid = Number(room?.current_bid_cr) || 0; // BUG FIX: always numeric
  const isHighest = room?.current_highest_bidder_id === myTeamId;
  const safeBasePrice = Number(currentPlayer?.base_price_cr) || 2.0;
  const nextCalculated = currentPlayer
    ? (currentBid === 0 ? safeBasePrice : calculateNextBid(currentBid, safeBasePrice))
    : 0;

  const myRecord = claimedTeams.find(c => c.team_id === myTeamId);
  const myPurse = Number(myRecord?.purse_remaining_cr) || 125.0;
  const mySquadSize = myRecord?.squad_count || 0;
  const myOverseas = myRecord?.overseas_count || 0;
  const isFinanciallyValid = canAffordBid(myPurse, nextCalculated, mySquadSize);
  const isRosterValid = mySquadSize < IPL_RULES.MAX_SQUAD_SIZE &&
    !(currentPlayer?.is_overseas && myOverseas >= IPL_RULES.MAX_OVERSEAS);
  const canLegallyBid = isFinanciallyValid && isRosterValid;
  const isHost = myRecord?.is_host === true;
  const timerProgress = timeLeft !== null ? Math.min(100, (timeLeft / TIMER_DURATION_MS) * 100) : 0;
  // BUG FIX: correct nationality check
  const isOverseasPlayer = currentPlayer?.is_overseas === true || currentPlayer?.nationality === 'Overseas';
  const roomUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      <div className={`min-h-screen bg-[#0E0E0E] text-slate-300 font-sans flex flex-col ${showSoldFlash ? 'blur-sm grayscale scale-95 transition-all duration-700' : 'transition-all duration-300'}`}>

        {/* HEADER */}
        <header className="h-14 border-b border-[#222] bg-[#111] flex items-center justify-between px-4 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium text-sm">Room: <span className="text-amber-500 font-bold tracking-wider">{String(roomId).substring(0, 8).toUpperCase()}</span></span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              room?.status === 'active' ? 'bg-green-500/20 text-green-400' :
              room?.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
              room?.status === 'completed' ? 'bg-slate-500/20 text-slate-400' :
              'bg-slate-700/40 text-slate-500'
            }`}>
              {room?.status || 'waiting'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isHost && room?.status === 'waiting' && !isAuctionComplete && (
              <Button onClick={handleStartAuction} size="sm" className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4">
                <Play className="h-4 w-4 mr-1" /> Start Auction
              </Button>
            )}
            {isHost && room?.status === 'active' && (
              <Button onClick={() => handlePause(true)} size="sm" variant="outline" className="h-8 border-[#333] text-amber-500 hover:bg-[#222]">
                <Pause className="h-4 w-4" />
              </Button>
            )}
            {isHost && room?.status === 'paused' && (
              <Button onClick={() => handlePause(false)} size="sm" className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4">
                <Play className="h-4 w-4 mr-1" /> Resume
              </Button>
            )}
            {isHost && (room?.status === 'active' || room?.status === 'paused') && (
              <Button onClick={handleEndAuction} size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white">
                <Square className="h-3 w-3 mr-1" /> End
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-4">

          {/* WAITING LOBBY */}
          {(room?.status === 'waiting' || !currentPlayer) ? (
            <div className="flex flex-col gap-4">
              <div className="bg-[#141414] border border-[#222] rounded-xl p-4">
                <p className="text-xs text-amber-500 flex items-center font-bold uppercase tracking-wider mb-2">
                  <Share2 className="h-3 w-3 mr-2" /> Invite Friends
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={roomUrl} className="bg-[#0A0A0A] border-[#333] h-10 text-xs" />
                  <Button onClick={handleShare} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-10 px-6">Share</Button>
                </div>
              </div>

              {!myTeamId && (
                <div className="bg-[#141414] border border-amber-500/20 rounded-xl p-4 flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-2">Join Game</p>
                    <Input
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                      placeholder="Enter your username..."
                      className="bg-[#0A0A0A] border-[#333] h-10 text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Select Your Franchise</p>
                    <div className="flex flex-wrap gap-3">
                      {TEAM_MAP.map(t => {
                        const isClaimed = claimedTeams.some(c => c.team_id === t.id);
                        return (
                          <button
                            key={t.id}
                            disabled={isClaimed}
                            onClick={() => handleClaim(t.id)}
                            className={`h-12 w-12 rounded-full font-black text-xs flex items-center justify-center border-2 border-transparent transition-transform hover:scale-110 ${isClaimed ? 'bg-[#222] text-[#555] cursor-not-allowed' : `${t.color} text-white`}`}
                          >
                            {t.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (

            /* ACTIVE PLAYER CARD */
            <div className={`bg-gradient-to-r from-slate-900 to-[#111] border rounded-xl overflow-hidden shadow-2xl relative transition-all ${room?.status === 'paused' ? 'border-amber-500/50 opacity-80' : 'border-[#333]'}`}>

              {/* Timer Progress Bar */}
              <div
                className={`h-1.5 transition-all duration-100 ease-linear ${room?.status === 'paused' ? 'bg-amber-500' : timerProgress < 30 ? 'bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.8)]' : 'bg-amber-500'}`}
                style={{ width: room?.status === 'paused' ? '100%' : `${timerProgress}%` }}
              />

              <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Player Info */}
                <div className="flex items-center gap-5 w-full sm:w-auto">
                  <div className="h-20 w-20 bg-[#1A1A1A] rounded-2xl border border-white/10 flex items-center justify-center font-bold text-white relative flex-shrink-0 shadow-lg overflow-hidden">
                    <img
                      src={currentPlayer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentPlayer.name)}&background=111&color=fff&size=128&bold=true`}
                      className="h-full w-full object-cover"
                      alt={currentPlayer.name}
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded uppercase tracking-wider font-bold border border-blue-500/30">
                        {currentPlayer.role}
                      </span>
                      {/* BUG FIX: correct overseas check */}
                      <span className={`text-[11px] px-2.5 py-0.5 rounded uppercase font-medium ${isOverseasPlayer ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-white/50'}`}>
                        {isOverseasPlayer ? 'OS' : 'IND'}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black text-white whitespace-nowrap tracking-tight">{currentPlayer.name}</h2>
                  </div>
                </div>

                {/* Bid Section */}
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex gap-6 items-center">
                    {timeLeft !== null && (
                      <div className="flex flex-col items-center justify-center bg-[#222] border border-[#333] p-2 rounded-lg min-w-[70px]">
                        <span className={`text-2xl font-bold font-mono ${timeLeft <= 5000 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
                          {Math.ceil(timeLeft / 1000)}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">SEC</span>
                      </div>
                    )}

                    <div className="flex flex-col text-right justify-center">
                      <span className="text-[11px] text-slate-500 font-bold tracking-[0.2em]">{currentBid === 0 ? "BASE" : "BID"}</span>
                      <span className={`text-4xl font-black tabular-nums tracking-tighter ${timeLeft !== null && timeLeft <= 0 ? 'text-green-500 animate-pulse' : 'text-white'}`}>
                        {(currentBid === 0 ? safeBasePrice : currentBid).toFixed(2)} <span className="text-xl text-slate-400">Cr</span>
                      </span>
                      <span className="text-[11px] text-amber-500 tracking-wider h-4">
                        {currentBid > 0 ? `held by ${room.current_highest_bidder_id}` : ' '}
                      </span>
                    </div>
                  </div>

                  {timeLeft !== null && timeLeft <= 0 ? (
                    <div className="h-16 px-10 flex items-center justify-center text-2xl font-black rounded-xl bg-slate-900 border-2 border-[#333] text-green-500 tracking-widest shadow-inner">
                      {currentBid > 0 ? "SOLD!" : "UNSOLD"}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 relative group">
                      <Button
                        onClick={handleBid}
                        disabled={isHighest || (timeLeft !== null && timeLeft <= 0) || !canLegallyBid || isBidding || !myTeamId}
                        className={`h-16 px-8 relative overflow-hidden transition-all text-xl font-black rounded-xl tabular-nums
                          ${isHighest
                            ? 'bg-[#181818] text-slate-500 border border-[#333] cursor-not-allowed text-sm'
                            : !canLegallyBid
                              ? 'bg-red-950/40 text-red-500/50 border border-red-900/30 cursor-not-allowed text-sm'
                              : isBidding
                                ? 'bg-blue-800 text-white/50 cursor-wait'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] border border-blue-400'
                          }`}
                      >
                        {isBidding ? <Loader2 className="h-5 w-5 animate-spin" /> :
                          isHighest ? "Highest Bidder" :
                          !canLegallyBid ? "Limit Reached" :
                          !myTeamId ? "Join to Bid" :
                          `BID ₹ ${(nextCalculated || 0).toFixed(2)} Cr`}
                      </Button>
                      {!canLegallyBid && !isHighest && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-red-400 text-[10px] w-max px-3 py-1.5 rounded-lg border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          {mySquadSize >= IPL_RULES.MAX_SQUAD_SIZE ? `Squad Full (${IPL_RULES.MAX_SQUAD_SIZE})`
                            : currentPlayer?.is_overseas && myOverseas >= IPL_RULES.MAX_OVERSEAS ? `Overseas Limit (${IPL_RULES.MAX_OVERSEAS})`
                              : `Insufficient funds`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM TABS */}
          <div className="flex-1 bg-[#141414] border border-[#222] rounded-xl flex flex-col overflow-hidden shadow-xl">
            <div className="flex border-b border-[#222] bg-[#111] shrink-0">
              <button onClick={() => setActiveTab('activity')} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'activity' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-slate-400'}`}>
                <MessageSquare className="h-4 w-4" /> Activity
              </button>
              <button onClick={() => setActiveTab('squad')} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'squad' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-slate-400'}`}>
                <Users className="h-4 w-4" /> Members ({onlineUsers.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0A0A0A] min-h-0">
              {activeTab === 'activity' ? (
                <>
                  {logs.length === 0 && (
                    <div className="text-center text-slate-600 text-xs mt-10 p-4 border border-dashed border-[#222] rounded-xl">
                      No activity yet. Auction is waiting to begin.
                    </div>
                  )}
                  {[...logs].reverse().map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 bg-[#161616] border border-[#222] p-2 px-3 rounded-lg animate-in slide-in-from-bottom-2 fade-in">
                      {log.type === 'sys' && <span className="text-amber-500 text-xs w-4">⚡</span>}
                      {log.type === 'join' && <span className="text-green-500 text-xs w-4">✦</span>}
                      {log.type === 'bid' && <span className="text-blue-500 text-xs w-4">₹</span>}
                      <span className={`text-xs font-medium ${log.type === 'sys' ? 'text-amber-400 font-bold' : log.type === 'join' ? 'text-green-400' : log.type === 'bid' ? 'text-blue-400' : 'text-slate-300'}`}>
                        {log.text}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {claimedTeams.map((teamData: any) => {
                    const isOnline = onlineUsers.some(u => u.team === teamData.team_id);
                    return (
                      <div
                        key={teamData.id}
                        onClick={() => loadSquad(teamData.team_id)}
                        className="flex flex-col bg-[#111] hover:bg-[#1A1A1A] transition-colors cursor-pointer border border-[#222] p-4 rounded-xl relative hover:border-[#444] group"
                      >
                        {teamData.is_host && <span className="absolute top-3 right-3 text-[9px] uppercase tracking-widest bg-amber-500/20 text-amber-500 font-bold px-2 py-0.5 rounded">HOST</span>}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`h-10 w-10 rounded-full flex justify-center items-center font-black ${TEAM_MAP.find(t => t.id === teamData.team_id)?.color || 'bg-slate-700'} text-white`}>
                            {teamData.team_id}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white flex items-center gap-2">
                              {teamData.user_name}
                              <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-[#333]'}`} />
                            </span>
                            <span className="text-xs text-slate-500">₹{Number(teamData.purse_remaining_cr || 0).toFixed(2)} Cr remaining</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 mt-1">
                          <span>{teamData.squad_count || 0} players</span>
                          <span className="text-blue-400/60">{teamData.overseas_count || 0} overseas</span>
                          <span className="text-amber-400/60 group-hover:text-amber-400 transition-colors">View squad →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#222] bg-[#111] shrink-0">
              <div className="relative">
                <Input readOnly placeholder="Real-time log stream connected..." className="bg-[#1A1A1A] border-[#333] pr-10 text-sm text-slate-500 focus-visible:ring-0 cursor-default" />
                <Send className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SOLD FLASH */}
      {showSoldFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-tr ${TEAM_MAP.find(t => t.id === showSoldFlash.team)?.color.replace('bg-', 'from-') || 'from-white'} to-black animate-pulse`} />
          <div className="relative z-10 flex flex-col items-center max-w-3xl text-center">
            <h1 className="text-8xl md:text-9xl font-black text-white italic tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]">SOLD!</h1>
            <div className="mt-8 flex flex-col md:flex-row items-center gap-6">
              <div className={`h-32 w-32 rounded-3xl flex justify-center items-center font-black text-4xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/20 ${TEAM_MAP.find(t => t.id === showSoldFlash.team)?.color} text-white`}>
                {showSoldFlash.team}
              </div>
              <div className="flex flex-col items-center md:items-start text-white">
                <span className="text-3xl md:text-5xl font-black tracking-tight">
                  ₹ {showSoldFlash.amount.toFixed(2)} <span className="text-slate-400 text-2xl font-bold">Cr</span>
                </span>
                <span className="text-xl md:text-2xl font-bold text-amber-500 uppercase tracking-widest mt-1">
                  To {claimedTeams.find(c => c.team_id === showSoldFlash.team)?.user_name || showSoldFlash.team}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SQUAD MODAL */}
      {showSquadsModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-3xl animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
            <h2 className="text-2xl font-black text-white italic flex items-center gap-3"><Users className="h-6 w-6 text-amber-500" /> Franchise Dashboard</h2>
            <Button onClick={() => setShowSquadsModal(null)} variant="ghost" className="h-10 w-10 p-0 text-white hover:bg-white/10 rounded-full">
              <Square className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-64 border-r border-white/10 overflow-y-auto bg-black/20 p-4 space-y-2 shrink-0">
              {claimedTeams.map(t => (
                <button
                  key={t.id}
                  onClick={() => loadSquad(t.team_id)}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${showSquadsModal === t.team_id ? 'bg-amber-500/20 border border-amber-500/50' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className={`h-8 w-8 rounded-md flex justify-center items-center font-bold text-xs ${TEAM_MAP.find(m => m.id === t.team_id)?.color} text-white`}>{t.team_id}</div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">{t.user_name}</span>
                    <span className="text-slate-400 text-xs">₹{Number(t.purse_remaining_cr || 0).toFixed(2)} Cr</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-[#0a0a0a]">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                <div className={`h-16 w-16 rounded-2xl flex justify-center items-center font-black text-2xl border-2 border-white/10 ${TEAM_MAP.find(m => m.id === showSquadsModal)?.color} text-white`}>
                  {showSquadsModal}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{claimedTeams.find(t => t.team_id === showSquadsModal)?.user_name}'s Squad</h3>
                  <p className="text-slate-400">{squadsMap[showSquadsModal]?.length || 0} players bought</p>
                </div>
              </div>
              {!squadsMap[showSquadsModal] ? (
                <div className="flex items-center justify-center py-20 opacity-50">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-3" />
                  <p className="text-white">Loading...</p>
                </div>
              ) : squadsMap[showSquadsModal].length === 0 ? (
                <div className="flex items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-slate-400 italic">No players purchased yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {squadsMap[showSquadsModal].map(p => (
                    <div key={p.id} className="bg-[#111] border border-[#222] p-4 rounded-xl flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{p.name}</span>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 uppercase bg-white/5 px-2 py-0.5 rounded">{p.role}</span>
                          {p.is_overseas && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">OS</span>}
                        </div>
                      </div>
                      <span className="text-amber-500 font-black text-lg">₹{Number(p.sold_price_cr).toFixed(2)} Cr</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUCTION COMPLETE */}
      {isAuctionComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-black to-slate-900 animate-in fade-in duration-1000">
          <div className="max-w-2xl text-center flex flex-col items-center">
            <Flame className="h-24 w-24 text-amber-500 mb-6 animate-bounce" />
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 mb-4">AUCTION COMPLETE</h1>
            <p className="text-slate-300 text-xl font-medium mb-10">All players in the database have been auctioned off.</p>
            <Button
              onClick={() => loadSquad(myTeamId || claimedTeams[0]?.team_id)}
              size="lg"
              className="h-14 px-10 text-lg bg-amber-500 hover:bg-amber-600 text-black font-black rounded-full"
            >
              VIEW ROSTERS
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
