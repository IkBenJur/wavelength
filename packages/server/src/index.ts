import express from 'express';
import http from 'http';
import path from 'path';
import WebSocket, { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';
import {
  joinRoom,
  leaveRoom,
  lockScore,
  submitGuess,
  readyForNextRound,
  endGame,
  serializeRoom,
  Room,
} from './rooms';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

interface ClientInfo {
  playerId: string;
  playerIndex: 0 | 1;
  roomId: string;
}

const clients = new Map<WebSocket, ClientInfo>();

function send(ws: WebSocket, type: string, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

function broadcast(roomId: string, type: string, room: Room): void {
  for (const [ws, info] of clients) {
    if (info.roomId === roomId) {
      send(ws, type, serializeRoom(room, info.playerIndex));
    }
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    let msg: { type: string; payload?: any };
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    const { type, payload } = msg;

    if (type === 'JOIN_ROOM') {
      const roomId = (payload?.roomId ?? '').trim().toUpperCase();
      const playerName = (payload?.playerName ?? '').trim();

      if (!roomId || !playerName) {
        send(ws, 'ERROR', { message: 'Room code and name are required' });
        return;
      }

      const playerId = nanoid(8);
      const result = joinRoom(roomId, { id: playerId, name: playerName });

      if ('error' in result) {
        send(ws, 'ERROR', { message: result.error });
        return;
      }

      clients.set(ws, { playerId, playerIndex: result.playerIndex, roomId });
      broadcast(roomId, 'ROOM_STATE', result.room);
      return;
    }

    const info = clients.get(ws);
    if (!info) {
      send(ws, 'ERROR', { message: 'Join a room first' });
      return;
    }

    const { playerId, roomId } = info;

    if (type === 'LOCK_SCORE') {
      const result = lockScore(roomId, playerId);
      if ('error' in result) { send(ws, 'ERROR', { message: result.error }); return; }
      broadcast(roomId, 'ROOM_STATE', result);
      return;
    }

    if (type === 'SUBMIT_GUESS') {
      const result = submitGuess(roomId, playerId, payload?.guess);
      if ('error' in result) { send(ws, 'ERROR', { message: result.error }); return; }
      broadcast(roomId, 'ROOM_STATE', result);
      return;
    }

    if (type === 'NEXT_ROUND') {
      const result = readyForNextRound(roomId, playerId);
      if ('error' in result) { send(ws, 'ERROR', { message: result.error }); return; }
      broadcast(roomId, 'ROOM_STATE', result);
      return;
    }

    if (type === 'END_GAME') {
      const result = endGame(roomId);
      if (result) broadcast(roomId, 'ROOM_STATE', result);
      return;
    }

    if (type === 'LEAVE_ROOM') {
      const result = leaveRoom(roomId, playerId);
      clients.delete(ws);
      if (result) broadcast(roomId, 'ROOM_STATE', result);
      return;
    }
  });

  ws.on('close', () => {
    const info = clients.get(ws);
    if (!info) return;
    const result = leaveRoom(info.roomId, info.playerId);
    clients.delete(ws);
    if (result) broadcast(info.roomId, 'ROOM_STATE', result);
  });
});

const clientDist = path.join(__dirname, '..', 'public');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Wavelength server listening on port ${PORT}`);
});
