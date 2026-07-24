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
  showUnsoldFlash: { name: string } | null;
  showSquadsModal: string | null;
  squadsMap: Record<string, any[]>;
  isAuctionComplete: boolean;
  isBidding: boolean;
  soldPlayerIds: Set<string>;

  // Actions
  setShowSoldFlash: (val: any) => void;
  setShowSquadsModal: (val: string | null) => void;
  handleClaim: (teamId: string) => Promise<void>;
  handleStartAuction: () => Promise<void>;
  handlePause: (pause: boolean) => Promise<void>;
  handleEndAuction: () => Promise<void>;
  handleBid: (customAmountCr?: number) => Promise<void>;
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
  const roomCode = params.code as string;

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
  const [showUnsoldFlash, setShowUnsoldFlash] = useState<{ name: string } | null>(null);
  const [showSquadsModal, setShowSquadsModal] = useState<string | null>(null);
  const [squadsMap, setSquadsMap] = useState<Record<string, any[]>>({});
  const [isAuctionComplete, setIsAuctionComplete] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [soldPlayerIds, setSoldPlayerIds] = useState<Set<string>>(new Set());

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
    
    // Check if auto-spectate is requested in URL query params
    const searchParams = new URLSearchParams(window.location.search);
    const autoSpectate = searchParams.get("spectate") === "true";

    if (autoSpectate) {
      setIsSpectator(true);
      const name = storedName || `Spectator-${Math.random().toString(36).slice(2, 6)}`;
      setPlayerName(name);
      setJoinName(name);
      if (!storedName) {
        sessionStorage.setItem("playerName", name);
      }
    } else {
      setPlayerName(storedName);
      setJoinName(storedName);
      const team = storedTeam || sessionStorage.getItem(`auction_${roomCode}_team`);
      setPlayerTeam(team);
      playerTeamRef.current = team;
    }
  }, [roomCode]);

  // Init + Realtime
  useEffect(() => {
    // Allow spectators (no team) to initialize if they have a name or are flagged
    if (!playerName && !isSpectator) return;

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

      // Load sold players for this room
      const { data: soldData } = await supabase
        .from("room_sold_players")
        .select("player_id")
        .eq("room_id", roomData.id);
      if (soldData) {
        setSoldPlayerIds(new Set(soldData.map((s: any) => s.player_id)));
      }

      // Mega Auction: fetch all players
      let playerQuery = supabase
        .from("players")
        .select("id, name, base_price_cr, role, is_overseas, nationality, contract_type_2026, auction_set")
        .order("base_price_cr", { ascending: false })
        .order("id", { ascending: true });

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
          // Merge incoming changes into existing state to prevent losing fields
          // that may not be included in the Realtime payload
          setRoom((prev: any) => (prev && p.new ? { ...prev, ...p.new } : p.new));
          roomRef.current = roomRef.current && p.new ? { ...roomRef.current, ...p.new } : p.new;
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
          // Track sold player IDs for upcoming queue
          setSoldPlayerIds(prev => {
            const next = new Set(prev);
            next.add(sale.player_id);
            return next;
          });
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

  // Advance Auction — Server-side via /api/rooms/[code]/advance
  // Any connected peer can trigger this, not just the host.
  // The DB RPC is idempotent (duplicate calls are harmless).
  const advanceAuction = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom?.room_code) return;

    const currentPid = currentRoom.current_player_id;

    try {
      const res = await fetch(`/api/rooms/${currentRoom.room_code}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedPlayerId: currentPid }),
      });
      const data = await res.json();

      if (data?.ok && data?.action === "completed") {
        setIsAuctionComplete(true);
        addLog("🏁 Auction Complete!", "sys");
      }
    } catch (err) {
      console.error("Failed to advance auction:", err);
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
      
      // Safety check: if timerEnd is NaN or invalid, skip timer
      if (isNaN(timerEnd) || timerEnd <= 0) {
        setTimeLeft(null);
        return;
      }

      const tick = () => {
        // Re-check room status in case it changed during the interval
        const currentRoom = roomRef.current;
        if (currentRoom?.status !== "active") {
          clearInterval(interval);
          setTimeLeft(null);
          return;
        }

        const remaining = Math.max(0, timerEnd - Date.now());
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          if (!soldFiredRef.current) {
            soldFiredRef.current = true;
            const finalBid = Number(currentRoom?.current_bid_cr) || 0;
            const winnerId = currentRoom?.current_highest_bidder_id;

            if (finalBid > 0 && winnerId) {
              const cp = currentPlayer;
              setShowSoldFlash({ team: winnerId, name: cp?.name || "", amount: finalBid });
              setTimeout(() => setShowSoldFlash(null), 3000);
              addLog(`✅ SOLD to ${winnerId} for ${formatPriceCr(finalBid)}`, "sys");
            } else {
              const cp = currentPlayer;
              setShowUnsoldFlash({ name: cp?.name || "Unknown" });
              setTimeout(() => setShowUnsoldFlash(null), 2500);
              addLog("❌ UNSOLD", "sys");
            }
            // Staggered advance to avoid client-side RPC collisions:
            // Host attempts immediately (after 2s sold display delay), peers wait an extra 2.5s (4.5s total).
            const isMeHost = claimedTeamsRef.current.find(c => c.team_id === playerTeamRef.current)?.is_host === true;
            const delay = isMeHost ? 2000 : 4500;
            advanceTimeoutRef.current = setTimeout(() => {
              // Final safety check: only advance if still active
              if (roomRef.current?.status === "active" || roomRef.current?.status === "paused") {
                advanceAuction();
              }
            }, delay);
          }
        }
      };

      tick();
      interval = setInterval(tick, 100);
    } else {
      setTimeLeft(null);
    }

    return () => {
      clearInterval(interval);
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    };
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
    // Store a default name for spectators so they can initialize
    if (!playerName) {
      const spectatorName = `Spectator-${Math.random().toString(36).slice(2, 6)}`;
      setPlayerName(spectatorName);
      sessionStorage.setItem("playerName", spectatorName);
    }
  };

  const handleStartAuction = async () => {
    const currentRoom = roomRef.current;
    const players = allPlayersRef.current;
    if (!currentRoom || players.length === 0) return;

    // Fetch sold players to avoid starting with a sold player
    const { data: soldPlayers } = await supabase
      .from("room_sold_players")
      .select("player_id")
      .eq("room_id", currentRoom.id);
    const soldIds = new Set(soldPlayers?.map(s => s.player_id) || []);

    const firstUnsold = players.find(p => !soldIds.has(p.id));
    if (!firstUnsold) {
      alert("All players have already been sold!");
      return;
    }

    const td = currentRoom.timer_duration || 10;
    const newTimer = new Date(Date.now() + td * 1000).toISOString();
    await supabase.from("rooms").update({
      status: "active",
      current_player_id: firstUnsold.id,
      timer_ends_at: newTimer,
    }).eq("id", currentRoom.id);
  };

  const handlePause = async (pause: boolean) => {
    const currentRoom = roomRef.current;
    if (!currentRoom?.id) return;
    // Only the host can pause/resume the auction
    const meHost = claimedTeamsRef.current.find(c => c.team_id === playerTeamRef.current)?.is_host === true;
    if (!meHost) return;
    try {
      if (pause) {
        // Clear any pending advance timeout immediately to prevent race conditions
        if (advanceTimeoutRef.current) {
          clearTimeout(advanceTimeoutRef.current);
          advanceTimeoutRef.current = null;
        }
        soldFiredRef.current = true; // Prevent timer expiry from firing during pause transition
        const { error } = await supabase.from("rooms").update({ status: "paused", timer_ends_at: null }).eq("id", currentRoom.id);
        if (error) {
          console.error("Failed to pause auction:", error);
          soldFiredRef.current = false; // Reset on failure
          return;
        }
        addLog("⏸ Auction paused", "sys");
      } else {
        const td = currentRoom.timer_duration || roomRef.current?.timer_duration || 10;
        const newTimer = new Date(Date.now() + td * 1000).toISOString();
        soldFiredRef.current = false; // Reset for fresh timer
        const { error } = await supabase.from("rooms").update({ status: "active", timer_ends_at: newTimer }).eq("id", currentRoom.id);
        if (error) {
          console.error("Failed to resume auction:", error);
          return;
        }
        addLog("▶ Auction resumed", "sys");
      }
    } catch (err) {
      console.error("handlePause error:", err);
    }
  };

  const handleEndAuction = async () => {
    // Only the host can end the auction
    const meHost = claimedTeamsRef.current.find(c => c.team_id === playerTeamRef.current)?.is_host === true;
    if (!meHost) return;
    if (window.confirm("End auction? This cannot be undone.")) {
      try {
        const { error } = await supabase.from("rooms").update({ status: "completed" }).eq("id", roomRef.current?.id);
        if (error) {
          console.error("Failed to end auction:", error);
        }
      } catch (err) {
        console.error("handleEndAuction error:", err);
      }
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

  const handleBid = async (customAmountCr?: number) => {
    if (!room || room.status !== "active" || !currentPlayer || isHighest || isBidding || !playerTeam) return;
    
    const bidAmount = customAmountCr !== undefined 
      ? Number(customAmountCr)
      : (currentBid === 0 ? safeBasePrice : nextCalculated);

    // Validate that the custom bid is at least the next minimum calculated bid
    const minRequired = currentBid === 0 ? safeBasePrice : nextCalculated;
    if (bidAmount < minRequired) {
      alert(`Minimum bid required is ${formatPriceCr(minRequired)}`);
      return;
    }

    // Check financial affordability
    if (!canAffordBid(myPurse, bidAmount, mySquadSize)) {
      alert(`Insufficient funds or squad completion reserve violated for ${formatPriceCr(bidAmount)}`);
      return;
    }

    // Check roster validity (only if not already highest bidder to avoid double check)
    const isOverseasVal = currentPlayer?.is_overseas || currentPlayer?.nationality?.toLowerCase() !== 'indian';
    const isRosterValidCheck = mySquadSize < IPL_RULES.MAX_SQUAD_SIZE && !(isOverseasVal && myOverseas >= IPL_RULES.MAX_OVERSEAS);
    if (!isRosterValidCheck) {
      alert("Squad limits exceeded!");
      return;
    }

    setIsBidding(true);
    try {
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
    showUnsoldFlash, showSquadsModal, squadsMap, isAuctionComplete, isBidding, soldPlayerIds,
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
