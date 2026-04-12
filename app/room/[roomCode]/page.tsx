"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculateNextBid, canAffordBid, formatPriceCr, IPL_RULES } from "@/lib/auction-engine";
import {
  Loader2, Copy, Check, Play, Pause, Square, Users, Send, Flame,
  Eye, Crown, Trophy, ChevronDown, ChevronUp, ArrowLeft, Settings,
  Zap, Shield,
} from "lucide-react";

/* ─── IPL Team Metadata ───────────────────────────────────────────────────── */
const TEAM_MAP = [
  { id: "MI", name: "Mumbai Indians", color: "bg-[#004BA0]", border: "border-[#004BA0]", hex: "#004BA0" },
  { id: "CSK", name: "Chennai Super Kings", color: "bg-[#FFC107]", border: "border-[#FFC107]", hex: "#FFC107", textDark: true },
  { id: "RCB", name: "Royal Challengers", color: "bg-[#D4213D]", border: "border-[#D4213D]", hex: "#D4213D" },
  { id: "KKR", name: "Kolkata Knight Riders", color: "bg-[#3A225D]", border: "border-[#3A225D]", hex: "#3A225D" },
  { id: "DC", name: "Delhi Capitals", color: "bg-[#0077B6]", border: "border-[#0077B6]", hex: "#0077B6" },
  { id: "PBKS", name: "Punjab Kings", color: "bg-[#ED1B24]", border: "border-[#ED1B24]", hex: "#ED1B24" },
  { id: "RR", name: "Rajasthan Royals", color: "bg-[#EA1A85]", border: "border-[#EA1A85]", hex: "#EA1A85" },
  { id: "SRH", name: "Sunrisers Hyderabad", color: "bg-[#F26522]", border: "border-[#F26522]", hex: "#F26522" },
  { id: "GT", name: "Gujarat Titans", color: "bg-[#1B2133]", border: "border-[#1B2133]", hex: "#1B2133" },
  { id: "LSG", name: "Lucknow Super Giants", color: "bg-[#A72056]", border: "border-[#A72056]", hex: "#A72056" },
];

const MOCK_2026_TEAM_STATE: Record<string, { auction_purse_cr: number; squad_count: number; overseas_count: number }> = {
  CSK: { auction_purse_cr: 67.10, squad_count: 16, overseas_count: 3 },
  DC: { auction_purse_cr: 24.05, squad_count: 11, overseas_count: 4 },
  GT: { auction_purse_cr: 21.70, squad_count: 14, overseas_count: 5 },
  KKR: { auction_purse_cr: 67.85, squad_count: 12, overseas_count: 8 },
  LSG: { auction_purse_cr: 27.55, squad_count: 13, overseas_count: 5 },
  MI: { auction_purse_cr: 14.35, squad_count: 14, overseas_count: 7 },
  PBKS: { auction_purse_cr: 3.35, squad_count: 17, overseas_count: 7 },
  RR: { auction_purse_cr: 12.50, squad_count: 17, overseas_count: 6 },
  RCB: { auction_purse_cr: 15.00, squad_count: 16, overseas_count: 5 },
  SRH: { auction_purse_cr: 15.00, squad_count: 16, overseas_count: 5 },
};

const MODE_LABELS: Record<string, string> = {
  mock_2026: "Mock 2026 Auction",
  mega_auction: "Mega Auction",
  legends_upgraded: "Legends Upgraded",
};

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function RoomPage() {
  const router = useRouter();
  const { roomCode } = useParams<{ roomCode: string }>();

  // Identity
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerTeam, setPlayerTeam] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);

  // Room state
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  const [claimedTeams, setClaimedTeams] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [auctionMode, setAuctionMode] = useState<string | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerDuration = room?.timer_duration ? room.timer_duration * 1000 : 10000;

  // UI
  const [logs, setLogs] = useState<{ id: string; text: string; type: "bid" | "join" | "sys" }[]>([]);
  const [showSoldFlash, setShowSoldFlash] = useState<{ team: string; name: string; amount: number } | null>(null);
  const [isAuctionComplete, setIsAuctionComplete] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [squadsMap, setSquadsMap] = useState<Record<string, any[]>>({});
  const [showMySquad, setShowMySquad] = useState(false);

  // Host settings
  const [settingsMode, setSettingsMode] = useState<string>("mega_auction");
  const [settingsTimer, setSettingsTimer] = useState(10);

  // Stable refs
  const soldFiredRef = useRef(false);
  const allPlayersRef = useRef<any[]>([]);
  const claimedTeamsRef = useRef<any[]>([]);
  const playerTeamRef = useRef<string | null>(null);
  const roomRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { allPlayersRef.current = allPlayers; }, [allPlayers]);
  useEffect(() => { claimedTeamsRef.current = claimedTeams; }, [claimedTeams]);
  useEffect(() => { playerTeamRef.current = playerTeam; }, [playerTeam]);
  useEffect(() => { roomRef.current = room; }, [room]);

  const addLog = useCallback((text: string, type: "bid" | "join" | "sys") => {
    setLogs(prev => [...prev.slice(-100), { id: crypto.randomUUID(), text, type }]);
  }, []);

  /* ─── Session Guard ─────────────────────────────────────────────────── */
  useEffect(() => {
    const name = sessionStorage.getItem("playerName");
    const team = sessionStorage.getItem("playerTeam");
    if (!name || !team) {
      router.push("/");
      return;
    }
    setPlayerName(name);
    setPlayerTeam(team);
    playerTeamRef.current = team;
  }, [router]);

  /* ─── Init ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!playerName || !playerTeam) return;

    let isMounted = true;
    let activeChannel: any = null;

    const fetchInit = async () => {
      // Find room by code
      const { data: roomData, error: roomErr } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_code", roomCode?.toUpperCase())
        .single();

      if (roomErr || !roomData) {
        alert("Room not found");
        router.push("/");
        return;
      }

      setRoom(roomData);
      roomRef.current = roomData;
      setAuctionMode(roomData.auction_mode);
      setSettingsMode(roomData.auction_mode || "mega_auction");
      setSettingsTimer(roomData.timer_duration || 10);

      if (roomData.status === "completed") setIsAuctionComplete(true);

      // Get franchises
      const { data: franchises } = await supabase
        .from("room_franchises")
        .select("*")
        .eq("room_id", roomData.id)
        .order("joined_at", { ascending: true });

      if (franchises) {
        setClaimedTeams(franchises);
        claimedTeamsRef.current = franchises;

        // Check if user is already in this room
        const myEntry = franchises.find((f: any) => f.team_id === playerTeam);
        if (!myEntry && roomData.status !== "waiting") {
          setIsSpectator(true);
        }

        const joinLogs = franchises.map((f: any) => ({
          id: crypto.randomUUID(),
          text: `${f.user_name} joined as ${f.team_id}`,
          type: "join" as const,
        }));
        setLogs(joinLogs);
      }

      // Load bids history
      const { data: bids } = await supabase
        .from("bids")
        .select("*")
        .eq("room_id", roomData.id)
        .order("created_at", { ascending: true });

      if (bids) {
        const bidLogs = bids.map((b: any) => ({
          id: crypto.randomUUID(),
          text: `${b.team_id} bid ${formatPriceCr(Number(b.amount_cr))}`,
          type: "bid" as const,
        }));
        setLogs(prev => [...prev, ...bidLogs]);
      }

      // Mode-aware player fetch
      const mode = roomData.auction_mode || "mega_auction";
      let playerQuery = supabase
        .from("players")
        .select("id, name, base_price_cr, role, is_overseas, nationality, contract_type_2026, auction_set");

      if (mode === "mock_2026") {
        playerQuery = playerQuery
          .or("contract_type_2026.is.null,contract_type_2026.eq.AUCTION")
          .order("base_price_cr", { ascending: false })
          .limit(350);
      } else if (mode === "legends_upgraded") {
        playerQuery = playerQuery.eq("is_overseas", true).order("base_price_cr", { ascending: false }).limit(248);
      } else {
        playerQuery = playerQuery.order("base_price_cr", { ascending: false });
      }

      const { data: players } = await playerQuery;
      if (players) {
        setAllPlayers(players);
        allPlayersRef.current = players;
      }

      setLoading(false);

      if (!isMounted) return;

      // ── Realtime channel ─────────────────────────────────────
      const channelName = `room_${roomData.id}`;
      // Cleanup any pre-existing channel collision if React Strict Mode double-mounted
      const existingChannel = supabase.getChannels().find((c: any) => c.topic === `realtime:${channelName}`);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      activeChannel = supabase.channel(channelName);
      channelRef.current = activeChannel;

      activeChannel
        .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomData.id}` }, (p: any) => {
          setRoom(p.new);
          roomRef.current = p.new;
          if ((p.new as any).status === "completed") setIsAuctionComplete(true);
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_franchises", filter: `room_id=eq.${roomData.id}` }, (p: any) => {
          setClaimedTeams(prev => {
            const exists = prev.some(t => t.team_id === (p.new as any).team_id);
            const updated = exists ? prev : [...prev, p.new];
            claimedTeamsRef.current = updated;
            return updated;
          });
          addLog(`${(p.new as any).user_name} joined as ${(p.new as any).team_id}`, "join");
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "room_franchises", filter: `room_id=eq.${roomData.id}` }, (p: any) => {
          setClaimedTeams(prev => {
            const updated = prev.map(t => t.team_id === (p.new as any).team_id ? { ...t, ...p.new } : t);
            claimedTeamsRef.current = updated;
            return updated;
          });
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "bids", filter: `room_id=eq.${roomData.id}` }, (p: any) => {
          addLog(`${(p.new as any).team_id} bid ${formatPriceCr(Number((p.new as any).amount_cr))}`, "bid");
        })
        // BUG FIX: Listen for sold player inserts to invalidate squad cache for all clients
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_sold_players", filter: `room_id=eq.${roomData.id}` }, (p: any) => {
          const sale = p.new as any;
          setSquadsMap(prev => {
            const updated = { ...prev };
            delete updated[sale.team_id];
            return updated;
          });
        })
        .on("presence", { event: "sync" }, () => {
          const state = activeChannel.presenceState();
          const active: any[] = Object.values(state).map((arr: any) => arr[0]);
          setOnlineUsers(active);
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED" && isMounted) {
            await activeChannel.track({
              online_at: new Date().toISOString(),
              team: playerTeam || "Spectator",
              name: playerName,
              spectator: isSpectator,
            });
          }
        });
    };

    fetchInit();

    return () => {
      isMounted = false;
      if (activeChannel) {
        activeChannel.untrack();
        supabase.removeChannel(activeChannel);
      }
    };
  }, [playerName, playerTeam, roomCode, router, addLog, isSpectator]);

  /* ─── Player Sync ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (room?.current_player_id) {
      soldFiredRef.current = false;
      supabase.from("players").select("*").eq("id", room.current_player_id).single()
        .then(({ data }) => {
          setCurrentPlayer(data);
          addLog(`🔥 Now bidding: ${data?.name}`, "sys");
        });
    } else {
      setCurrentPlayer(null);
    }
  }, [room?.current_player_id, addLog]);

  /* ─── Auto-Advance (Host) ──────────────────────────────────────────── */
  const advanceAuction = useCallback(async () => {
    const currentRoom = roomRef.current;
    const players = allPlayersRef.current;
    const teams = claimedTeamsRef.current;
    const myId = playerTeamRef.current;

    const myRec = teams.find(c => c.team_id === myId);
    if (!myRec?.is_host) return;

    const finalBid = Number(currentRoom?.current_bid_cr) || 0;
    const winnerId = currentRoom?.current_highest_bidder_id;
    const currentPid = currentRoom?.current_player_id;

    // Phase 1: award player — write to room_sold_players (room-scoped)
    if (finalBid > 0 && winnerId) {
      const winnerRecord = teams.find(c => c.team_id === winnerId);
      if (winnerRecord) {
        const currentPlayerData = players.find((p: any) => p.id === currentPid);
        const isOs = currentPlayerData?.is_overseas === true;
        const newPurse = Number(((Number(winnerRecord.purse_remaining_cr) || 120.0) - finalBid).toFixed(2));
        const newSquadSize = (winnerRecord.squad_count || 0) + 1;
        const newOverseasCount = (winnerRecord.overseas_count || 0) + (isOs ? 1 : 0);

        await supabase.from("room_franchises").update({
          purse_remaining_cr: newPurse,
          squad_count: newSquadSize,
          overseas_count: newOverseasCount,
        }).eq("room_id", currentRoom.id).eq("team_id", winnerId);

        // BUG FIX: Write to room_sold_players instead of global players table
        await supabase.from("room_sold_players").upsert([{
          room_id: currentRoom.id,
          player_id: currentPid,
          team_id: winnerId,
          sold_price_cr: finalBid,
          is_overseas: isOs,
        }], { onConflict: 'room_id,player_id' });
      }
    }

    // Phase 2: next player
    const currentIndex = players.findIndex((p: any) => p.id === currentPid);
    if (currentIndex >= 0 && currentIndex < players.length - 1) {
      const nextPlayer = players[currentIndex + 1];
      const td = currentRoom?.timer_duration || 10;
      const newTimer = new Date(Date.now() + td * 1000).toISOString();
      await supabase.from("rooms").update({
        current_player_id: nextPlayer.id,
        current_bid_cr: 0,
        current_highest_bidder_id: null,
        status: "active",
        timer_ends_at: newTimer,
      }).eq("id", currentRoom.id);
    } else {
      setIsAuctionComplete(true);
      await supabase.from("rooms").update({ status: "completed" }).eq("id", currentRoom.id);
      addLog("🏁 Auction Complete!", "sys");
    }
  }, [addLog]);

  /* ─── Timer ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (room?.status === "active" && room?.timer_ends_at) {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
      soldFiredRef.current = false;

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
              const cp = currentPlayer;
              setShowSoldFlash({ team: winnerId, name: cp?.name || "", amount: finalBid });
              setTimeout(() => setShowSoldFlash(null), 3000);
              addLog(`✅ SOLD to ${winnerId} for ${formatPriceCr(finalBid)}`, "sys");
            } else {
              addLog("❌ UNSOLD", "sys");
            }
            advanceTimeoutRef.current = setTimeout(advanceAuction, 2000);
          }
        }
      };

      tick();
      interval = setInterval(tick, 100);
    } else {
      setTimeLeft(null);
    }

    return () => clearInterval(interval);
  }, [room?.status, room?.timer_ends_at, advanceAuction, addLog, currentPlayer]);

  /* ─── Handlers ──────────────────────────────────────────────────────── */
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode?.toUpperCase() || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBid = async () => {
    if (!room || !currentPlayer || !playerTeam || isBidding || isSpectator) return;
    if (timeLeft !== null && timeLeft <= 0) return;

    setIsBidding(true);
    try {
      const currentBidVal = Number(room.current_bid_cr) || 0;
      const nextBid = currentBidVal === 0
        ? Number(currentPlayer.base_price_cr)
        : calculateNextBid(currentBidVal, currentPlayer.base_price_cr);

      const { data: success, error } = await supabase.rpc("execute_bid", {
        p_room_id: room.id,
        p_player_id: currentPlayer.id,
        p_team_id: playerTeam,
        p_bid_amount: nextBid,
      });

      if (error) addLog(`⚠️ Bid error: ${error.message}`, "sys");
      else if (!success) addLog("⚠️ Bid blocked", "sys");
    } finally {
      setIsBidding(false);
    }
  };

  const handleStartAuction = async () => {
    if (allPlayers.length === 0) return;

    // Save host settings
    await supabase.from("rooms").update({
      auction_mode: settingsMode,
      timer_duration: settingsTimer,
    }).eq("id", room.id);

    // Start with first player
    const td = settingsTimer;
    const newTimer = new Date(Date.now() + td * 1000).toISOString();
    await supabase.from("rooms").update({
      current_player_id: allPlayers[0].id,
      current_bid_cr: 0,
      current_highest_bidder_id: null,
      status: "active",
      timer_ends_at: newTimer,
    }).eq("id", room.id);
  };

  const handlePause = async (isPausing: boolean) => {
    if (isPausing) {
      await supabase.from("rooms").update({ status: "paused" }).eq("id", room.id);
    } else {
      const td = room?.timer_duration || 10;
      const newTimer = new Date(Date.now() + td * 1000).toISOString();
      await supabase.from("rooms").update({ status: "active", timer_ends_at: newTimer }).eq("id", room.id);
    }
  };

  const handleEndAuction = async () => {
    if (!confirm("End the auction for all players?")) return;
    setIsAuctionComplete(true);
    await supabase.from("rooms").update({ status: "completed" }).eq("id", room.id);
  };

  const loadSquad = async (teamId: string) => {
    if (!squadsMap[teamId] && room?.id) {
      // BUG FIX: Query room_sold_players (room-scoped) instead of global players table
      const { data: sales } = await supabase
        .from('room_sold_players')
        .select('player_id, team_id, sold_price_cr, is_overseas')
        .eq('room_id', room.id)
        .eq('team_id', teamId);

      if (sales && sales.length > 0) {
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

  /* ─── Loading ───────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060609] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500 h-8 w-8" />
      </div>
    );
  }

  /* ─── Derived Values ────────────────────────────────────────────────── */
  const currentBid = Number(room?.current_bid_cr) || 0;
  const isHighest = room?.current_highest_bidder_id === playerTeam;
  const safeBasePrice = Number(currentPlayer?.base_price_cr) || 0.20;
  const nextCalculated = currentPlayer
    ? (currentBid === 0 ? safeBasePrice : calculateNextBid(currentBid, safeBasePrice))
    : 0;

  const myRecord = claimedTeams.find(c => c.team_id === playerTeam);
  const myPurse = Number(myRecord?.purse_remaining_cr) || 120.0;
  const mySquadSize = myRecord?.squad_count || 0;
  const myOverseas = myRecord?.overseas_count || 0;
  const isFinanciallyValid = canAffordBid(myPurse, nextCalculated, mySquadSize);
  const isOverseasPlayer = currentPlayer?.is_overseas === true;
  const isRosterValid = mySquadSize < IPL_RULES.MAX_SQUAD_SIZE && !(isOverseasPlayer && myOverseas >= IPL_RULES.MAX_OVERSEAS);
  const canLegallyBid = isFinanciallyValid && isRosterValid && !isSpectator;
  const isHost = myRecord?.is_host === true;
  const timerProgress = timeLeft !== null ? Math.min(100, (timeLeft / timerDuration) * 100) : 0;

  // Progress indicator
  const currentIndex = currentPlayer ? allPlayers.findIndex(p => p.id === currentPlayer.id) : -1;
  const currentSet = currentPlayer?.auction_set || "General";
  const playersInSet = allPlayers.filter(p => p.auction_set === currentPlayer?.auction_set);
  const setIndex = playersInSet.findIndex(p => p.id === currentPlayer?.id);
  const overallProgress = allPlayers.length > 0 ? ((currentIndex + 1) / allPlayers.length) * 100 : 0;

  const spectatorCount = onlineUsers.filter(u => u.spectator).length;
  const isWaiting = room?.status === "waiting" || !currentPlayer;

  /* ─── RENDER ────────────────────────────────────────────────────────── */
  return (
    <>
      <div className={`min-h-[calc(100vh-3.5rem)] bg-[#060609] text-slate-300 font-sans flex flex-col transition-all duration-300 ${showSoldFlash ? "blur-sm grayscale scale-[0.97]" : ""}`}>

        {/* ── HEADER BAR ──────────────────────────────────────────────── */}
        <header className="h-12 border-b border-white/[0.06] bg-[#0a0a0e] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Room Code */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
            >
              <span className="text-amber-400 font-mono font-black text-sm tracking-[0.2em]">{roomCode?.toUpperCase()}</span>
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-amber-400/60" />}
            </button>

            {/* Status */}
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              room?.status === "active" ? "bg-green-500/20 text-green-400" :
              room?.status === "paused" ? "bg-amber-500/20 text-amber-400" :
              room?.status === "completed" ? "bg-slate-500/20 text-slate-400" :
              "bg-slate-700/40 text-slate-500"
            }`}>
              {room?.status || "waiting"}
            </span>

            {/* Player & spectator counts */}
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Users className="h-3 w-3" /> {claimedTeams.length}/10
            </span>
            {spectatorCount > 0 && (
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <Eye className="h-3 w-3" /> {spectatorCount} watching
              </span>
            )}

            {isSpectator && (
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Eye className="h-3 w-3 inline mr-1" />Spectating
              </span>
            )}
          </div>

          {/* Host Controls */}
          <div className="flex items-center gap-2">
            {isHost && room?.status === "waiting" && !isAuctionComplete && (
              <button
                onClick={handleStartAuction}
                disabled={claimedTeams.length < 2}
                className={`h-8 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  claimedTeams.length >= 2
                    ? "bg-amber-500 text-black hover:bg-amber-400"
                    : "bg-white/[0.04] text-slate-600 cursor-not-allowed"
                }`}
              >
                <Play className="h-3.5 w-3.5" /> Start Auction
              </button>
            )}
            {isHost && room?.status === "active" && (
              <button onClick={() => handlePause(true)} className="h-8 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-amber-400 hover:bg-white/[0.1] transition-all">
                <Pause className="h-3.5 w-3.5" />
              </button>
            )}
            {isHost && room?.status === "paused" && (
              <button onClick={() => handlePause(false)} className="h-8 px-4 rounded-lg bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition-all">
                <Play className="h-3.5 w-3.5" /> Resume
              </button>
            )}
            {isHost && (room?.status === "active" || room?.status === "paused") && (
              <button onClick={handleEndAuction} className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1">
                <Square className="h-3 w-3" /> End
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">

            {/* WAITING LOBBY */}
            {isWaiting ? (
              <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
                {/* Room Info */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Room Code</p>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <span className="text-4xl font-black text-amber-400 tracking-[0.3em] font-mono">{roomCode?.toUpperCase()}</span>
                    <button onClick={handleCopyCode} className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-all">
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
                    </button>
                  </div>
                  <p className="text-sm text-slate-500">Share this code with friends to invite them</p>
                </div>

                {/* Players List */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" /> Players
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">{claimedTeams.length}/10</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {claimedTeams.map(t => {
                      const teamMeta = TEAM_MAP.find(m => m.id === t.team_id);
                      const isOnline = onlineUsers.some(u => u.team === t.team_id);
                      return (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${teamMeta?.color || "bg-slate-700"} ${teamMeta?.textDark ? "text-slate-900" : "text-white"}`}>
                            {t.team_id}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white flex items-center gap-2">
                              {t.user_name}
                              {t.is_host && <Crown className="h-3 w-3 text-amber-500" />}
                            </p>
                            <p className="text-xs text-slate-500">{teamMeta?.name || t.team_id}</p>
                          </div>
                          <div className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" : "bg-slate-700"}`} />
                        </div>
                      );
                    })}
                    {claimedTeams.length === 0 && (
                      <div className="px-4 py-8 text-center text-slate-600 text-sm">
                        Waiting for players to join...
                      </div>
                    )}
                  </div>
                </div>

                {/* Host Settings */}
                {isHost && (
                  <div className="bg-white/[0.02] border border-amber-500/20 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                      <Settings className="h-4 w-4 text-amber-500" /> Host Settings
                    </h3>
                    <div className="space-y-4">
                      {/* Auction Mode */}
                      <div>
                        <label className="text-xs text-slate-400 font-medium">Auction Mode</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {["mock_2026", "mega_auction"].map(mode => (
                            <button
                              key={mode}
                              onClick={() => setSettingsMode(mode)}
                              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                settingsMode === mode
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                  : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:border-white/[0.1]"
                              }`}
                            >
                              {mode === "mock_2026" ? "🔥 Mock 2026" : "⚡ Mega Auction"}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Timer */}
                      <div>
                        <label className="text-xs text-slate-400 font-medium">Timer Duration: <span className="text-amber-400 font-bold">{settingsTimer}s</span></label>
                        <input
                          type="range"
                          min={5}
                          max={30}
                          value={settingsTimer}
                          onChange={e => setSettingsTimer(Number(e.target.value))}
                          className="w-full mt-2 accent-amber-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                          <span>5s</span><span>30s</span>
                        </div>
                      </div>
                    </div>
                    {claimedTeams.length < 2 && (
                      <p className="text-xs text-slate-500 mt-4 text-center bg-white/[0.02] rounded-lg p-2">
                        Need at least 2 players to start
                      </p>
                    )}
                  </div>
                )}

                {/* Non-host waiting */}
                {!isHost && !isSpectator && (
                  <div className="text-center py-6 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Waiting for host to start the auction...</p>
                  </div>
                )}
              </div>
            ) : (
              /* ── ACTIVE AUCTION ─────────────────────────────────────── */
              <>
                {/* Progress Indicator */}
                {currentPlayer && (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Set</span>
                      <span className="text-xs text-white font-semibold truncate max-w-[200px]">{currentSet}</span>
                      {playersInSet.length > 0 && (
                        <span className="text-[10px] text-slate-600">{setIndex + 1} of {playersInSet.length}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">Player {currentIndex + 1} of {allPlayers.length}</span>
                      <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Player Card */}
                {currentPlayer && (
                  <div className={`bg-[#0c0c10] border rounded-xl overflow-hidden shadow-2xl relative transition-all ${
                    room?.status === "paused" ? "border-amber-500/50 opacity-80" : "border-white/[0.06]"
                  }`}>
                    {/* Timer Bar */}
                    <div
                      className={`h-1 transition-all duration-100 ease-linear ${
                        room?.status === "paused" ? "bg-amber-500" : timerProgress < 30 ? "bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.8)]" : "bg-amber-500"
                      }`}
                      style={{ width: room?.status === "paused" ? "100%" : `${timerProgress}%` }}
                    />

                    <div className="p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                      {/* Player Info */}
                      <div className="flex items-center gap-5 w-full sm:w-auto">
                        <div className="h-20 w-20 bg-[#111118] rounded-2xl border border-white/[0.08] flex items-center justify-center font-bold text-white shadow-lg overflow-hidden flex-shrink-0">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentPlayer.name)}&background=111118&color=fff&size=128&bold=true`}
                            className="h-full w-full object-cover"
                            alt={currentPlayer.name}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold border border-blue-500/30">
                              {currentPlayer.role}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                              isOverseasPlayer ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-white/[0.04] text-slate-500"
                            }`}>
                              {isOverseasPlayer ? "OVERSEAS" : "INDIAN"}
                            </span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{currentPlayer.name}</h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Base: {formatPriceCr(safeBasePrice)}
                            {currentPlayer.auction_set && ` • ${currentPlayer.auction_set}`}
                          </p>
                        </div>
                      </div>

                      {/* Bid Section */}
                      <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Timer */}
                        {timeLeft !== null && (
                          <div className="flex flex-col items-center justify-center bg-[#111118] border border-white/[0.08] p-2.5 rounded-xl min-w-[65px]">
                            <span className={`text-2xl font-black font-mono ${timeLeft <= 3000 ? "text-red-500 animate-pulse" : "text-white"}`}>
                              {Math.ceil(timeLeft / 1000)}
                            </span>
                            <span className="text-[8px] text-slate-600 uppercase tracking-widest font-bold">SEC</span>
                          </div>
                        )}

                        {/* Current Bid */}
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-slate-600 font-bold tracking-[0.2em]">{currentBid === 0 ? "BASE" : "CURRENT BID"}</span>
                          <span className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tighter transition-all ${
                            timeLeft !== null && timeLeft <= 0 ? "text-green-500" : "text-white"
                          }`}>
                            {formatPriceCr(currentBid === 0 ? safeBasePrice : currentBid)}
                          </span>
                          <span className="text-[11px] text-amber-500/80 tracking-wider h-4">
                            {currentBid > 0 ? `by ${room.current_highest_bidder_id}` : ""}
                          </span>
                        </div>

                        {/* Bid Button */}
                        {timeLeft !== null && timeLeft <= 0 ? (
                          <div className="h-14 px-6 flex items-center justify-center text-xl font-black rounded-xl bg-[#111118] border border-white/[0.08] text-green-500 tracking-widest">
                            {currentBid > 0 ? "SOLD!" : "UNSOLD"}
                          </div>
                        ) : isSpectator ? (
                          <div className="h-14 px-6 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold gap-2">
                            <Eye className="h-4 w-4" /> Spectating
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              onClick={handleBid}
                              disabled={isHighest || (timeLeft !== null && timeLeft <= 0) || !canLegallyBid || isBidding}
                              className={`h-14 px-6 relative overflow-hidden transition-all text-lg font-black rounded-xl tabular-nums ${
                                isHighest
                                  ? "bg-[#111118] text-slate-600 border border-white/[0.06] cursor-not-allowed text-sm"
                                  : !canLegallyBid
                                    ? "bg-red-950/40 text-red-500/50 border border-red-900/30 cursor-not-allowed text-sm"
                                    : isBidding
                                      ? "bg-blue-800 text-white/50 cursor-wait"
                                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] border border-blue-400"
                              }`}
                            >
                              {isBidding ? <Loader2 className="h-5 w-5 animate-spin" /> :
                                isHighest ? "Highest Bidder" :
                                !canLegallyBid ? "Limit Reached" :
                                `BID ${formatPriceCr(nextCalculated)}`}
                            </button>
                            {!canLegallyBid && !isHighest && (
                              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black text-red-400 text-[10px] w-max px-3 py-1.5 rounded-lg border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {mySquadSize >= IPL_RULES.MAX_SQUAD_SIZE ? `Squad Full (${IPL_RULES.MAX_SQUAD_SIZE})`
                                  : isOverseasPlayer && myOverseas >= IPL_RULES.MAX_OVERSEAS ? `Overseas Limit (${IPL_RULES.MAX_OVERSEAS})`
                                  : "Insufficient funds"}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Feed */}
                <div className="flex-1 bg-[#0c0c10] border border-white/[0.06] rounded-xl flex flex-col overflow-hidden min-h-0">
                  <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2 shrink-0">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activity Feed</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0 max-h-60">
                    {[...logs].reverse().slice(0, 50).map(log => (
                      <div key={log.id} className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.03] p-2 px-3 rounded-lg">
                        {log.type === "sys" && <span className="text-amber-500 text-xs">⚡</span>}
                        {log.type === "join" && <span className="text-green-500 text-xs">✦</span>}
                        {log.type === "bid" && <span className="text-blue-500 text-xs">₹</span>}
                        <span className={`text-xs font-medium ${
                          log.type === "sys" ? "text-amber-400 font-bold" : log.type === "join" ? "text-green-400/80" : "text-blue-400/80"
                        }`}>
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── SIDEBAR: Teams Panel ──────────────────────────────────── */}
          {!isWaiting && (
            <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-[#0a0a0e] flex flex-col overflow-hidden">
              {/* My Stats */}
              {myRecord && !isSpectator && (
                <div className="p-3 border-b border-white/[0.06] bg-amber-500/[0.03]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">My Franchise</span>
                    <button
                      onClick={() => setShowMySquad(!showMySquad)}
                      className="text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors font-medium"
                    >
                      {showMySquad ? "Hide" : "View"} Squad
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-lg font-black text-white">{formatPriceCr(myPurse)}</p>
                      <p className="text-[9px] text-slate-500 uppercase">Purse</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-white">{mySquadSize}</p>
                      <p className="text-[9px] text-slate-500 uppercase">Players</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-white">{myOverseas}/8</p>
                      <p className="text-[9px] text-slate-500 uppercase">Overseas</p>
                    </div>
                  </div>
                </div>
              )}

              {/* My Squad Panel */}
              {showMySquad && playerTeam && (
                <div className="p-3 border-b border-white/[0.06] bg-[#08080c] max-h-60 overflow-y-auto">
                  <MySquadPanel teamId={playerTeam} squadsMap={squadsMap} onLoad={() => loadSquad(playerTeam)} />
                </div>
              )}

              {/* All Teams */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">All Teams</h3>
                {claimedTeams
                  .sort((a, b) => (Number(b.purse_remaining_cr) || 0) - (Number(a.purse_remaining_cr) || 0))
                  .map(t => {
                    const teamMeta = TEAM_MAP.find(m => m.id === t.team_id);
                    const isMe = t.team_id === playerTeam;
                    const isOnline = onlineUsers.some(u => u.team === t.team_id);
                    const isExpanded = expandedTeam === t.team_id;

                    return (
                      <div key={t.id}>
                        <button
                          onClick={() => {
                            setExpandedTeam(isExpanded ? null : t.team_id);
                            if (!isExpanded) loadSquad(t.team_id);
                          }}
                          className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-all text-left ${
                            isMe ? "bg-amber-500/[0.06] border border-amber-500/20" : "bg-white/[0.02] border border-transparent hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className={`h-7 w-7 rounded-md flex items-center justify-center font-bold text-[9px] ${teamMeta?.color || "bg-slate-700"} ${teamMeta?.textDark ? "text-slate-900" : "text-white"}`}>
                            {t.team_id}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white truncate">{t.user_name}</span>
                              {t.is_host && <Crown className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />}
                              <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isOnline ? "bg-green-500" : "bg-slate-700"}`} />
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span>{formatPriceCr(Number(t.purse_remaining_cr) || 0)}</span>
                              <span>•</span>
                              <span>{t.squad_count || 0} players</span>
                              <span>•</span>
                              <span>{t.overseas_count || 0} OS</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-3 w-3 text-slate-600 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 text-slate-600 flex-shrink-0" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-1 ml-9 space-y-1 pb-2">
                            {!squadsMap[t.team_id] ? (
                              <p className="text-[10px] text-slate-600">Loading...</p>
                            ) : squadsMap[t.team_id].length === 0 ? (
                              <p className="text-[10px] text-slate-600 italic">No players purchased yet</p>
                            ) : (
                              squadsMap[t.team_id].map(p => (
                                <div key={p.id} className="flex justify-between items-center text-[11px]">
                                  <span className="text-slate-400 truncate">{p.name} <span className="text-slate-600">({p.role})</span></span>
                                  <span className="text-amber-500/80 font-bold">{formatPriceCr(Number(p.sold_price_cr))}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SOLD FLASH ──────────────────────────────────────────────── */}
      {showSoldFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative z-10 flex flex-col items-center max-w-3xl text-center">
            <h1 className="text-7xl sm:text-9xl font-black text-white italic tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]">SOLD!</h1>
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-5">
              <div className={`h-24 w-24 sm:h-28 sm:w-28 rounded-2xl flex justify-center items-center font-black text-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-2 border-white/20 ${TEAM_MAP.find(t => t.id === showSoldFlash.team)?.color || "bg-slate-700"} text-white`}>
                {showSoldFlash.team}
              </div>
              <div className="flex flex-col items-center sm:items-start text-white">
                <span className="text-lg text-slate-400 font-medium">{showSoldFlash.name}</span>
                <span className="text-4xl sm:text-5xl font-black tracking-tight mt-1">
                  {formatPriceCr(showSoldFlash.amount)}
                </span>
                <span className="text-base text-amber-500 uppercase tracking-widest mt-1 font-bold">
                  to {claimedTeams.find(c => c.team_id === showSoldFlash.team)?.user_name || showSoldFlash.team}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AUCTION COMPLETE ──────────────────────────────────────────── */}
      {isAuctionComplete && (
        <div className="fixed inset-0 z-50 bg-[#060609] overflow-y-auto">
          <ResultsScreen
            claimedTeams={claimedTeams}
            squadsMap={squadsMap}
            onLoadSquad={loadSquad}
            onPlayAgain={async () => {
              setIsAuctionComplete(false);
              if (isHost) {
                await supabase.from("rooms").update({
                  status: "waiting",
                  current_player_id: null,
                  current_bid_cr: 0,
                  current_highest_bidder_id: null,
                  timer_ends_at: null,
                }).eq("id", room.id);
              }
            }}
            isHost={isHost}
          />
        </div>
      )}
    </>
  );
}

/* ─── My Squad Sub-component ──────────────────────────────────────────── */
function MySquadPanel({ teamId, squadsMap, onLoad }: { teamId: string; squadsMap: Record<string, any[]>; onLoad: () => void }) {
  useEffect(() => { onLoad(); }, [onLoad]);

  const squad = squadsMap[teamId];
  if (!squad) return <p className="text-[10px] text-slate-600">Loading...</p>;
  if (squad.length === 0) return <p className="text-[10px] text-slate-600 italic">No players bought yet</p>;

  const grouped: Record<string, any[]> = {};
  squad.forEach(p => {
    const role = String(p.role || "Other").toUpperCase();
    const group = role.startsWith("BAT") ? "Batters" : role.startsWith("BOWL") ? "Bowlers" : role === "AR" ? "All-rounders" : role === "WK" ? "WK-Batters" : "Other";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(p);
  });

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([group, players]) => (
        <div key={group}>
          <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{group} ({players.length})</h4>
          {players.map(p => (
            <div key={p.id} className="flex justify-between items-center text-[11px] py-0.5">
              <span className="text-slate-300 truncate">
                {p.name}
                {p.is_overseas && <span className="text-orange-400/60 ml-1">🌍</span>}
              </span>
              <span className="text-amber-500/90 font-bold">{formatPriceCr(Number(p.sold_price_cr))}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Results Screen ──────────────────────────────────────────────────── */
function ResultsScreen({
  claimedTeams,
  squadsMap,
  onLoadSquad,
  onPlayAgain,
  isHost,
}: {
  claimedTeams: any[];
  squadsMap: Record<string, any[]>;
  onLoadSquad: (teamId: string) => void;
  onPlayAgain: () => void;
  isHost: boolean;
}) {
  const [activeTeam, setActiveTeam] = useState<string | null>(claimedTeams[0]?.team_id || null);

  useEffect(() => {
    claimedTeams.forEach(t => onLoadSquad(t.team_id));
  }, [claimedTeams, onLoadSquad]);

  // Compute summary
  let totalPlayersSold = 0, totalSpent = 0;
  let mostExpensive: { name: string; price: number; team: string } | null = null;

  Object.entries(squadsMap).forEach(([teamId, players]) => {
    totalPlayersSold += players.length;
    players.forEach(p => {
      const price = Number(p.sold_price_cr) || 0;
      totalSpent += price;
      if (!mostExpensive || price > mostExpensive.price) {
        mostExpensive = { name: p.name, price, team: teamId };
      }
    });
  });

  const activeSquad = activeTeam ? squadsMap[activeTeam] || [] : [];
  const activeTeamData = claimedTeams.find(t => t.team_id === activeTeam);
  const activeTeamMeta = TEAM_MAP.find(t => t.id === activeTeam);
  const teamMostExpensive = activeSquad.length > 0
    ? activeSquad.reduce((max, p) => Number(p.sold_price_cr) > Number(max.sold_price_cr) ? p : max, activeSquad[0])
    : null;
  const incompleteSquad = (activeTeamData?.squad_count || 0) < IPL_RULES.MIN_SQUAD_SIZE;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Flame className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-bounce" />
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
          AUCTION COMPLETE
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{totalPlayersSold}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Players Sold</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-amber-400">{formatPriceCr(totalSpent)}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Total Spent</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-lg font-black text-white truncate">{mostExpensive?.name || "—"}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
            Most Expensive {mostExpensive ? `(${formatPriceCr(mostExpensive.price)})` : ""}
          </p>
        </div>
      </div>

      {/* Team Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {claimedTeams.map(t => {
          const meta = TEAM_MAP.find(m => m.id === t.team_id);
          const isActive = activeTeam === t.team_id;
          return (
            <button
              key={t.team_id}
              onClick={() => setActiveTeam(t.team_id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? `${meta?.color || "bg-slate-700"} ${meta?.textDark ? "text-slate-900" : "text-white"} shadow-lg`
                  : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] border border-white/[0.06]"
              }`}
            >
              {t.team_id}
              <span className={`text-[10px] ${isActive ? "opacity-70" : "text-slate-600"}`}>{t.user_name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Team Squad */}
      {activeTeam && activeTeamData && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Team Header */}
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg ${activeTeamMeta?.color || "bg-slate-700"} ${activeTeamMeta?.textDark ? "text-slate-900" : "text-white"}`}>
                {activeTeam}
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{activeTeamData.user_name}'s {activeTeamMeta?.name || activeTeam}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Spent: {formatPriceCr(120 - (Number(activeTeamData.purse_remaining_cr) || 0))}</span>
                  <span>•</span>
                  <span>Remaining: {formatPriceCr(Number(activeTeamData.purse_remaining_cr) || 0)}</span>
                  <span>•</span>
                  <span>Overseas: {activeTeamData.overseas_count || 0}/8</span>
                </div>
              </div>
            </div>
            {teamMostExpensive && (
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">⭐ Most Expensive</p>
                <p className="text-sm font-bold text-white">{teamMostExpensive.name}</p>
                <p className="text-xs text-amber-400 font-bold">{formatPriceCr(Number(teamMostExpensive.sold_price_cr))}</p>
              </div>
            )}
          </div>

          {incompleteSquad && (
            <div className="px-5 py-2.5 bg-red-500/[0.06] border-b border-red-500/10 text-red-400 text-xs font-medium flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              Incomplete squad: only {activeTeamData.squad_count || 0} players (minimum 18 required)
            </div>
          )}

          {/* Squad List */}
          <div className="p-5">
            {activeSquad.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-8 italic">No players purchased</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[...activeSquad]
                  .sort((a, b) => Number(b.sold_price_cr) - Number(a.sold_price_cr))
                  .map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg">
                      <div>
                        <span className="text-sm font-semibold text-white">{p.name}</span>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 uppercase">{p.role}</span>
                          {p.is_overseas && <span className="text-[10px] text-orange-400/70">OS</span>}
                        </div>
                      </div>
                      <span className="text-amber-500 font-black text-sm">{formatPriceCr(Number(p.sold_price_cr))}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Play Again */}
      {isHost && (
        <div className="mt-8 text-center">
          <button
            onClick={onPlayAgain}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded-xl transition-all shadow-[0_0_30px_-10px_rgba(245,158,11,0.5)]"
          >
            <Zap className="h-4 w-4" />
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
