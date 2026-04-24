import { useState, useEffect, useRef, useCallback } from 'react';

export interface Prompt {
  negative: string;
  positive: string;
}

export interface Player {
  id: string;
  name: string;
  connected: boolean;
}

export type Phase = 'waiting' | 'scoring' | 'guessing' | 'reveal' | 'gameover';

export interface RoomState {
  id: string;
  players: (Player | null)[];
  score: number;
  maxPossible: number;
  round: number;
  phase: Phase;
  scorerIndex: 0 | 1;
  currentPrompt: Prompt | null;
  lockedScore: number | null;
  lastGuess: number | null;
  lastPoints: number | null;
  nextRoundReady: number[];
  myPlayerIndex: 0 | 1;
}

interface Session {
  roomId: string;
  playerName: string;
  sessionToken: string;
}

const SESSION_KEY = 'wavelength_session';

function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

export interface UseRoomReturn {
  room: RoomState | null;
  error: string | null;
  connected: boolean;
  hoverGuess: number | null;
  join: (roomId: string, playerName: string) => void;
  lockScore: () => void;
  submitGuess: (guess: number) => void;
  sendHover: (hover: number | null) => void;
  nextRound: () => void;
  endGame: () => void;
  leaveGame: () => void;
  clearError: () => void;
}

export function useRoom(): UseRoomReturn {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [hoverGuess, setHoverGuess] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<Session | null>(getSession());

  const send = useCallback((type: string, payload?: unknown) => {
    wsRef.current?.send(JSON.stringify({ type, payload }));
  }, []);

  useEffect(() => {
    let attempts = 0;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        attempts = 0;
        setConnected(true);
        // Auto-rejoin if a session is stored
        const session = sessionRef.current;
        if (session) {
          ws.send(JSON.stringify({
            type: 'JOIN_ROOM',
            payload: { roomId: session.roomId, playerName: session.playerName, sessionToken: session.sessionToken },
          }));
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Retry for up to 180 s (90 × 2 s) — after that the server room is gone
        if (sessionRef.current && attempts++ < 90) {
          setTimeout(connect, 2000);
        } else {
          clearSession();
          sessionRef.current = null;
          setRoom(null);
        }
      };

      ws.onmessage = (event) => {
        const { type, payload } = JSON.parse(event.data);
        if (type === 'ROOM_STATE') { setRoom(payload as RoomState); setHoverGuess(null); }
        if (type === 'HOVER_UPDATE') setHoverGuess((payload as { hover: number | null }).hover);
        if (type === 'ERROR') setError((payload as { message: string }).message);
      };
    }

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const join = useCallback((roomId: string, playerName: string) => {
    // Reuse existing token for this room/name combo, or generate a fresh one
    const existing = sessionRef.current;
    const sessionToken =
      existing?.roomId === roomId && existing?.playerName === playerName
        ? existing.sessionToken
        : generateToken();

    const session = { roomId, playerName, sessionToken };
    sessionRef.current = session;
    saveSession(session);

    send('JOIN_ROOM', { roomId, playerName, sessionToken });
  }, [send]);

  const endGameAndClear = useCallback(() => {
    clearSession();
    sessionRef.current = null;
    send('END_GAME');
  }, [send]);

  const leaveGame = useCallback(() => {
    clearSession();
    sessionRef.current = null;
    send('LEAVE_ROOM');
    setRoom(null);
  }, [send]);

  return {
    room,
    error,
    connected,
    hoverGuess,
    clearError: () => setError(null),
    join,
    lockScore: () => send('LOCK_SCORE'),
    submitGuess: (guess) => send('SUBMIT_GUESS', { guess }),
    sendHover: (hover) => send('HOVER_GUESS', { hover }),
    nextRound: () => send('NEXT_ROUND'),
    endGame: endGameAndClear,
    leaveGame,
  };
}
