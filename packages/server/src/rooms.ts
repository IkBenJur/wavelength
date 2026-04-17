import { Prompt, getRandomPrompt } from './prompts';
import { computePoints } from './game';

export interface Player {
  id: string;
  name: string;
  sessionToken: string;
  connected: boolean;
  disconnectedAt: number | null;
}

export interface SerializedPlayer {
  id: string;
  name: string;
  connected: boolean;
}

export type Phase = 'waiting' | 'scoring' | 'guessing' | 'reveal' | 'gameover';

export interface Room {
  id: string;
  players: [Player | null, Player | null];
  score: number;
  maxPossible: number;
  round: number;
  phase: Phase;
  scorerIndex: 0 | 1;
  currentPrompt: Prompt | null;
  lockedScore: number | null;
  lastGuess: number | null;
  lastPoints: number | null;
  usedPromptIndices: Set<number>;
  nextRoundReady: Set<string>;
  lastActivity: number;
}

export interface SerializedRoom {
  id: string;
  players: (SerializedPlayer | null)[];
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

const rooms = new Map<string, Room>();

function createRoom(id: string): Room {
  return {
    id,
    players: [null, null],
    score: 0,
    maxPossible: 0,
    round: 0,
    phase: 'waiting',
    scorerIndex: 0,
    currentPrompt: null,
    lockedScore: null,
    lastGuess: null,
    lastPoints: null,
    usedPromptIndices: new Set(),
    nextRoundReady: new Set(),
    lastActivity: Date.now(),
  };
}

function getOrCreate(roomId: string): Room {
  if (!rooms.has(roomId)) rooms.set(roomId, createRoom(roomId));
  return rooms.get(roomId)!;
}

function startNewRound(room: Room): void {
  const { prompt, index } = getRandomPrompt(room.usedPromptIndices);
  room.usedPromptIndices.add(index);
  room.currentPrompt = prompt;
  room.lockedScore = Math.floor(Math.random() * 10) + 1;
  room.lastGuess = null;
  room.lastPoints = null;
  room.phase = 'scoring';
  room.round += 1;
  room.nextRoundReady.clear();
  room.lastActivity = Date.now();
}

export function tryReconnect(
  roomId: string,
  sessionToken: string
): { room: Room; playerId: string; playerIndex: 0 | 1 } | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const idx = room.players.findIndex((p) => p?.sessionToken === sessionToken);
  if (idx === -1) return null;

  const player = room.players[idx]!;
  player.connected = true;
  player.disconnectedAt = null;
  room.lastActivity = Date.now();

  return { room, playerId: player.id, playerIndex: idx as 0 | 1 };
}

export function joinRoom(
  roomId: string,
  player: Player
): { room: Room; playerIndex: 0 | 1 } | { error: string } {
  const room = getOrCreate(roomId);

  const slotIndex = room.players.findIndex((p) => p === null);
  if (slotIndex === -1) return { error: 'Room is full' };

  room.players[slotIndex as 0 | 1] = player;
  room.lastActivity = Date.now();

  if (room.players[0] !== null && room.players[1] !== null && room.phase === 'waiting') {
    startNewRound(room);
  }

  return { room, playerIndex: slotIndex as 0 | 1 };
}

export function disconnectPlayer(roomId: string, playerId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const idx = room.players.findIndex((p) => p?.id === playerId);
  if (idx === -1) return room;

  const player = room.players[idx]!;
  player.connected = false;
  player.disconnectedAt = Date.now();
  room.lastActivity = Date.now();

  return room;
}

export function removeDisconnectedPlayer(roomId: string, playerId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const idx = room.players.findIndex((p) => p?.id === playerId);
  if (idx === -1) return null;

  const player = room.players[idx]!;
  if (player.connected) return null; // reconnected in time — do nothing

  room.players[idx as 0 | 1] = null;
  if (room.phase !== 'gameover') room.phase = 'waiting';

  if (room.players[0] === null && room.players[1] === null) {
    rooms.delete(roomId);
    return null;
  }

  return room;
}

export function leaveRoom(roomId: string, playerId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const idx = room.players.findIndex((p) => p?.id === playerId);
  if (idx !== -1) {
    room.players[idx as 0 | 1] = null;
    if (room.phase !== 'gameover') room.phase = 'waiting';
  }

  if (room.players[0] === null && room.players[1] === null) {
    rooms.delete(roomId);
    return null;
  }

  return room;
}

export function lockScore(
  roomId: string,
  playerId: string
): Room | { error: string } {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  if (room.phase !== 'scoring') return { error: 'Not in scoring phase' };
  if (room.players[room.scorerIndex]?.id !== playerId) return { error: 'Not your turn to score' };

  room.phase = 'guessing';
  room.lastActivity = Date.now();
  return room;
}

export function submitGuess(
  roomId: string,
  playerId: string,
  guess: number
): Room | { error: string } {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  if (room.phase !== 'guessing') return { error: 'Not in guessing phase' };
  const guesserIndex: 0 | 1 = room.scorerIndex === 0 ? 1 : 0;
  if (room.players[guesserIndex]?.id !== playerId) return { error: 'Not your turn to guess' };
  if (guess < 1 || guess > 10) return { error: 'Guess must be 1–10' };

  const points = computePoints(room.lockedScore!, guess);
  room.lastGuess = guess;
  room.lastPoints = points;
  room.score += points;
  room.maxPossible += 10;
  room.phase = 'reveal';
  room.lastActivity = Date.now();
  return room;
}

export function readyForNextRound(
  roomId: string,
  playerId: string
): Room | { error: string } {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  if (room.phase !== 'reveal') return { error: 'Not in reveal phase' };

  room.nextRoundReady.add(playerId);
  room.lastActivity = Date.now();

  const activePlayers = room.players.filter(Boolean);
  if (room.nextRoundReady.size >= activePlayers.length) {
    room.scorerIndex = room.scorerIndex === 0 ? 1 : 0;
    startNewRound(room);
  }

  return room;
}

export function endGame(roomId: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.phase = 'gameover';
  room.lastActivity = Date.now();
  return room;
}

export function serializeRoom(room: Room, myPlayerIndex: 0 | 1): SerializedRoom {
  const nextRoundReady = [...room.nextRoundReady]
    .map((id) => room.players.findIndex((p) => p?.id === id))
    .filter((idx) => idx !== -1);

  return {
    id: room.id,
    players: room.players.map((p) =>
      p ? { id: p.id, name: p.name, connected: p.connected } : null
    ),
    score: room.score,
    maxPossible: room.maxPossible,
    round: room.round,
    phase: room.phase,
    scorerIndex: room.scorerIndex,
    currentPrompt: room.currentPrompt,
    lockedScore:
      myPlayerIndex === room.scorerIndex || room.phase === 'reveal' || room.phase === 'gameover'
        ? room.lockedScore
        : null,
    lastGuess: room.lastGuess,
    lastPoints: room.lastPoints,
    nextRoundReady,
    myPlayerIndex,
  };
}

// GC idle rooms after 30 min
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, room] of rooms) {
    if (room.lastActivity < cutoff) rooms.delete(id);
  }
}, 5 * 60 * 1000);
