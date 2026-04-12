"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculateNextBid, canAffordBid, formatPriceCr, IPL_RULES, TEAM_MAP } from "@/lib/auction-engine";

interface AuctionContextType {
  roomCode: string;
  loading: boolean;
  room: any;
  playerTeam: string | null;
  playerName: string;
  isSpectator: boolean;
  claimedTeams: any[];
  onlineUsers: any[];
  allPlayers: any[];
  currentPlayer: any;
  logs: any[];
  chatMessages: { id: string; sender: string; text: string; timestamp: number }[];
  timeLeft: number | null;
  showSoldFlash: { team: string; name: string; amount: number } | null;
  showSquadsModal: string | null;
  squadsMap: Record<string, any[]>;
  isAuctionComplete: boolean;
  isBidding: boolean;

  // Actions
  setShowSoldFlash: (val: any) => void;
  setShowSquadsModal: (val: string | null) => void;
  handleClaim: (teamId: string) => Promise<void>;
  handleStartAuction: () => Promise<void>;
  handlePause: (pause: boolean) => Promise<void>;
  handleEndAuction: () => Promise<void>;
  handleBid: () => Promise<void>;
  loadSquad: (teamId: string) => Promise<void>;
  addLog: (text: string, type: "bid" | "join" | "sys") => void;
  sendChatMessage: (text: string) => void;
  advanceAuction: () => Promise<void>;
  setPlayerName: (val: string) => void;
  setPlayerTeam: (val: string | null) => void;
  setJoinName: (val: string) => void;
  handleSpectate: () => void;
  joinName: string;

  // Derived
  currentBid: number;
  isHighest: boolean;
  safeBasePrice: number;
  nextCalculated: number;
  myRecord: any;
  myPurse: number;
  mySquadSize: number;
  myOverseas: number;
  isFinanciallyValid: boolean;
  isRosterValid: boolean;
  canLegallyBid: boolean;
  isHost: boolean;
  timerProgress: number;
  isOverseasPlayer: boolean;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export function AuctionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const roomCode = params.roomCode as string;

  // State
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  const [playerTeam, setPlayerTeam] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [isSpectator, setIsSpectator] = useState(false);
  const [claimedTeams, setClaimedTeams] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [logs, setLogs] = useState<{ id: string; text: string; type: "bid" | "join" | "sys" }[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; text: string; timestamp: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSoldFlash, setShowSoldFlash] = useState<{ team: string; name: string; amount: number } | null>(null);
  const [showSquadsModal, setShowSquadsModal] = useState<string | null>(null);
  const [squadsMap, setSquadsMap] = useState<Record<string, any[]>>({});
  const [isAuctionComplete, setIsAuctionComplete] = useState(false);
  const [isBidding, setIsBidding] = useState(false);

  // Refs
  const soldFiredRef = useRef(false);
  const allPlayersRef = useRef<any[]>([]);
  const claimedTeamsRef = useRef<any[]>([]);
  const playerTeamRef = useRef<string | null>(null);
  const roomRef = useRef<any>(null);
  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeChannelRef = useRef<any>(null);

  // Sync refs
  useEffect(() => { allPlayersRef.current = allPlayers; }, [allPlayers]);
  useEffect(() => { claimedTeamsRef.current = claimedTeams; }, [claimedTeams]);
  useEffect(() => { playerTeamRef.current = playerTeam; }, [playerTeam]);
  useEffect(() => { roomRef.current = room; }, [room]);

  const addLog = useCallback((text: string, type: "bid" | "join" | "sys") => {
    setLogs(prev => [...prev, { id: crypto.randomUUID(), text, type }]);
  }, []);

  const sendChatMessage = useCallback((text: string) => {
    if (!activeChannelRef.current || !playerName) return;
    const msg = { id: crypto.randomUUID(), sender: playerName, text, timestamp: Date.now() };
    activeChannelRef.current.send({
      type: "broadcast",
      event: "chat_message",
      payload: msg
    });
    setChatMessages(prev => [...prev, msg]);
  }, [playerName]);

  // Hydrate Identity
  useEffect(() => {
    const storedName = sessionStorage.getItem("playerName") || "";
    const storedTeam = sessionStorage.getItem("playerTeam");
    setPlayerName(storedName);
    setJoinName(storedName);
    const team = storedTeam || sessionStorage.getItem(`auction_${roomCode}_team`);
    setPlayerTeam(team);
    playerTeamRef.current = team;
  }, [roomCode]);

  // Init + Realtime
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
      const existingChannel = supabase.getChannels().find((c: any) => c.topic === `realtime:${channelName}`);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      activeChannel = supabase.channel(channelName);

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
        .on("broadcast", { event: "chat_message" }, (payload: any) => {
          setChatMessages(prev => {
             const newMsg = payload.payload;
             if (prev.some(m => m.id === newMsg.id)) return prev;
             return [...prev, newMsg];
          });
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
        
      activeChannelRef.current = activeChannel;
    };

    fetchInit();

    return () => {
      isMounted = false;
      if (activeChannel) {
        activeChannel.untrack();
        supabase.removeChannel(activeChannel);
      }
      activeChannelRef.current = null;
    };
  }, [playerName, playerTeam, roomCode, router, addLog, isSpectator]);

  // Player Sync
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

  // Advance Auction (Host)
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

        await supabase.from("room_sold_players").upsert([{
          room_id: currentRoom.id,
          player_id: currentPid,
          team_id: winnerId,
          sold_price_cr: finalBid,
          is_overseas: isOs,
        }], { onConflict: 'room_id,player_id' });
      }
    }

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

  // Timer
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

  // Actions
  const handleClaim = async (teamId: string) => {
    if (!joinName) return alert("Enter a name first!");
    const currentRoom = roomRef.current;
    if (!currentRoom) return;

    if (claimedTeams.length >= (currentRoom.max_players || 10)) {
      alert("Room is full!");
      return;
    }

    const { error } = await supabase.from("room_franchises").insert([{
      room_id: currentRoom.id,
      team_id: teamId,
      user_name: joinName,
      is_host: claimedTeams.length === 0,
      purse_remaining_cr: 120.0,
      squad_count: 0,
      overseas_count: 0
    }]);

    if (!error) {
      sessionStorage.setItem("playerName", joinName);
      sessionStorage.setItem("playerTeam", teamId);
      sessionStorage.setItem(`auction_${currentRoom.room_code}_team`, teamId);
      setPlayerName(joinName);
      setPlayerTeam(teamId);
      setIsSpectator(false);
    }
  };

  const handleSpectate = () => {
    setIsSpectator(true);
  };

  const handleStartAuction = async () => {
    const currentRoom = roomRef.current;
    const players = allPlayersRef.current;
    if (!currentRoom || players.length === 0) return;

    const td = currentRoom.timer_duration || 10;
    const newTimer = new Date(Date.now() + td * 1000).toISOString();
    await supabase.from("rooms").update({
      status: "active",
      current_player_id: players[0].id,
      timer_ends_at: newTimer,
    }).eq("id", currentRoom.id);
  };

  const handlePause = async (pause: boolean) => {
    const currentRoom = roomRef.current;
    if (!currentRoom) return;
    if (pause) {
      await supabase.from("rooms").update({ status: "paused", timer_ends_at: null }).eq("id", currentRoom.id);
      addLog("⏸ Auction paused", "sys");
    } else {
      const td = currentRoom.timer_duration || 10;
      const newTimer = new Date(Date.now() + td * 1000).toISOString();
      await supabase.from("rooms").update({ status: "active", timer_ends_at: newTimer }).eq("id", currentRoom.id);
      addLog("▶ Auction resumed", "sys");
    }
  };

  const handleEndAuction = async () => {
    if (window.confirm("End auction? This cannot be undone.")) {
      await supabase.from("rooms").update({ status: "completed" }).eq("id", roomRef.current?.id);
    }
  };

  const currentBid = Number(room?.current_bid_cr) || 0;
  const isHighest = room?.current_highest_bidder_id === playerTeam;
  const safeBasePrice = Number(currentPlayer?.base_price_cr) || 2.0;
  const nextCalculated = currentPlayer ? (currentBid === 0 ? safeBasePrice : calculateNextBid(currentBid, safeBasePrice)) : 0;
  
  const myRecord = claimedTeams.find(c => c.team_id === playerTeam);
  const myPurse = Number(myRecord?.purse_remaining_cr) || 120.0;
  const mySquadSize = myRecord?.squad_count || 0;
  const myOverseas = myRecord?.overseas_count || 0;
  
  const isFinanciallyValid = canAffordBid(myPurse, nextCalculated, mySquadSize);
  const isOverseasPlayer = currentPlayer?.is_overseas || currentPlayer?.nationality?.toLowerCase() !== 'indian';
  const isRosterValid = mySquadSize < IPL_RULES.MAX_SQUAD_SIZE && !(isOverseasPlayer && myOverseas >= IPL_RULES.MAX_OVERSEAS);
  const canLegallyBid = isFinanciallyValid && isRosterValid;
  const isHost = myRecord?.is_host === true;
  const timerProgress = timeLeft !== null && room?.timer_duration ? Math.min(100, (timeLeft / (room.timer_duration * 1000)) * 100) : 0;

  const handleBid = async () => {
    if (!room || !currentPlayer || isHighest || !canLegallyBid || isBidding || !playerTeam) return;
    setIsBidding(true);
    try {
      const bidAmount = currentBid === 0 ? safeBasePrice : nextCalculated;
      const { data, error } = await supabase.rpc("execute_bid", {
        p_room_id: room.id,
        p_player_id: currentPlayer.id,
        p_team_id: playerTeam,
        p_bid_amount: bidAmount
      });
      if (error || !data) {
        console.error("Bid denied:", error);
      }
    } finally {
      setIsBidding(false);
    }
  };

  const loadSquad = async (teamId: string) => {
    setShowSquadsModal(teamId);
    if (!squadsMap[teamId] && room?.id) {
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

  const value: AuctionContextType = {
    roomCode, loading, room, playerTeam, playerName, isSpectator, claimedTeams,
    onlineUsers, allPlayers, currentPlayer, logs, chatMessages, timeLeft, showSoldFlash,
    setShowSquadsModal, squadsMap, isAuctionComplete, isBidding,
    setShowSoldFlash, setShowSquadsModal, handleClaim, handleStartAuction,
    handlePause, handleEndAuction, handleBid, loadSquad, addLog, sendChatMessage, advanceAuction, handleSpectate,
    setPlayerName, setJoinName, setPlayerTeam, joinName,
    currentBid, isHighest, safeBasePrice, nextCalculated, myRecord, myPurse,
    mySquadSize, myOverseas, isFinanciallyValid, isRosterValid, canLegallyBid,
    isHost, timerProgress, isOverseasPlayer
  };

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>;
}

export function useAuction() {
  const context = useContext(AuctionContext);
  if (context === undefined) {
    throw new Error("useAuction must be used within an AuctionProvider");
  }
  return context;
}
