import { useState, useEffect, useRef, useCallback } from 'react';

export interface Prompt {
  negative: string;
  positive: string;
}

export interface Player {
  id: string;
  name: string;
}

export type Phase = 'waiting' | 'scoring' | 'guessing' | 'reveal' | 'gameover';

export interface RoomState {
  id: string;
  players: (Player | null)[];
  scores: [number, number];
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

export interface UseRoomReturn {
  room: RoomState | null;
  error: string | null;
  connected: boolean;
  join: (roomId: string, playerName: string) => void;
  lockScore: () => void;
  submitGuess: (guess: number) => void;
  nextRound: () => void;
  endGame: () => void;
  clearError: () => void;
}

export function useRoom(): UseRoomReturn {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);
      if (type === 'ROOM_STATE') setRoom(payload as RoomState);
      if (type === 'ERROR') setError((payload as { message: string }).message);
    };

    return () => ws.close();
  }, []);

  const send = useCallback((type: string, payload?: unknown) => {
    wsRef.current?.send(JSON.stringify({ type, payload }));
  }, []);

  return {
    room,
    error,
    connected,
    clearError: () => setError(null),
    join: (roomId, playerName) => send('JOIN_ROOM', { roomId, playerName }),
    lockScore: () => send('LOCK_SCORE'),
    submitGuess: (guess) => send('SUBMIT_GUESS', { guess }),
    nextRound: () => send('NEXT_ROUND'),
    endGame: () => send('END_GAME'),
  };
}
