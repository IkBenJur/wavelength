# Wavelength — Web App Project Plan

## Concept

A two-player game where one player scores a prompt and the other guesses the score.

**Flow:**
1. Two players join a shared room via a link/code
2. Player A receives a prompt (e.g. "very attractive in a person")
3. Player A picks a score 1–10 and tells Player B verbally (in real life)
4. Player B guesses the number Player A picked
5. Points awarded based on how close the guess is (exact = full points, further = fewer)
6. Roles swap; new prompt; repeat until players quit

---

## Scoring

| Distance from actual | Points |
|---|---|
| 0 (exact) | 10 |
| 1 off | 8 |
| 2 off | 5 |
| 3 off | 2 |
| 4+ off | 0 |

(Tweak values as desired.)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Monorepo | npm workspaces (or pnpm workspaces) |
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + `ws` WebSocket server + Express (serve static + REST) |
| Prompts | JSON file on the backend (`prompts.json`) |
| Rooms | In-memory `Map` on the server (no DB) |
| Container | Single Dockerfile, multi-stage build |

---

## Monorepo Structure

```
wavelength/
├── package.json             # workspace root
├── Dockerfile
├── docker-compose.yml
├── packages/
│   ├── client/              # React + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx       # enter/create room
│   │   │   │   └── Room.tsx       # game screen
│   │   │   ├── components/
│   │   │   │   ├── ScorePicker.tsx
│   │   │   │   ├── GuessPicker.tsx
│   │   │   │   ├── Scoreboard.tsx
│   │   │   │   └── WaitingScreen.tsx
│   │   │   └── hooks/
│   │   │       └── useRoom.ts     # WebSocket hook
│   │   └── vite.config.ts
│   └── server/              # Node.js WS + Express
│       ├── src/
│       │   ├── index.ts           # entry: HTTP + WS
│       │   ├── rooms.ts           # in-memory room state
│       │   ├── game.ts            # game logic, scoring
│       │   └── prompts.ts         # load prompts.json
│       └── data/
│           └── prompts.json
```

---

## WebSocket Message Protocol

All messages are JSON `{ type, payload }`.

### Client → Server

| type | payload | description |
|---|---|---|
| `JOIN_ROOM` | `{ roomId, playerName }` | join or create room |
| `LOCK_SCORE` | `{ score: number }` | scorer locks in 1–10 |
| `SUBMIT_GUESS` | `{ guess: number }` | guesser submits guess |
| `NEXT_ROUND` | — | both players ready for next round |
| `LEAVE_ROOM` | — | player leaves |

### Server → Client

| type | payload | description |
|---|---|---|
| `ROOM_STATE` | full room snapshot | sent on join and after every state change |
| `ERROR` | `{ message }` | e.g. room full |

---

## Room State Shape (server-side)

```ts
interface Room {
  id: string;
  players: [Player, Player | null];
  scores: [number, number];           // cumulative
  round: number;
  phase: 'waiting' | 'scoring' | 'guessing' | 'reveal' | 'gameover';
  scorerIndex: 0 | 1;                 // who is scoring this round
  currentPrompt: string;
  lockedScore: number | null;
  lastGuess: number | null;
  lastPoints: number | null;
}
```

---

## Game State Machine

```
waiting (1 player)
  → scoring   (2nd player joins → pick prompt, assign scorer)
      → guessing  (scorer locks score)
          → reveal    (guesser submits guess → compute points)
              → scoring   (NEXT_ROUND from both → swap roles, new prompt)
              → gameover  (either player triggers end)
```

---

## Prompts File (`prompts.json`)

Each prompt is a bipolar scale: `negative` anchors the 1 end, `positive` anchors the 10 end. The UI displays both sides so players understand the full spectrum.

```json
[
  { "negative": "Not attractive in a person",      "positive": "Very attractive in a person" },
  { "negative": "A terrible first date idea",      "positive": "A great first date idea" },
  { "negative": "A major red flag",                "positive": "A total green flag" },
  { "negative": "Not worth spending money on",     "positive": "Absolutely worth spending money on" },
  { "negative": "A reason to go to bed early",     "positive": "A reason to stay up all night" },
  { "negative": "A quality you hate in a friend",  "positive": "A quality you love in a best friend" },
  { "negative": "A very unappealing hobby",        "positive": "A very attractive hobby" },
  { "negative": "The worst thing to say on a date","positive": "The best thing to say on a date" }
]
```

The scorer sees both poles and picks 1–10 to express where their answer falls on the spectrum. Add as many pairs as desired. Server picks randomly, no repeats within a session.

---

## Dockerfile (multi-stage)

```
Stage 1 — build
  FROM node:20-alpine AS build
  COPY monorepo, install deps, build client (vite build), build server (tsc)

Stage 2 — runtime
  FROM node:20-alpine
  COPY server dist + client dist
  Server serves client/dist as static files
  EXPOSE 3000
  CMD ["node", "dist/index.js"]
```

---

## Environment Variables

| Var | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP + WS port |
| `CLIENT_ORIGIN` | `*` | CORS origin (prod: set to actual domain) |

---

## Key Implementation Notes

- The WS server and HTTP server share the same port; Express serves the Vite build at `/` and the WS server upgrades `/ws`.
- Room IDs are short random strings (e.g. `nanoid(6)`); displayed as a code players share verbally or via copy-link.
- Rooms are garbage-collected after both players disconnect (or after a timeout, e.g. 30 min idle).
- No auth, no persistence — refresh = rejoin.
- Tailwind configured in `client/` only; PostCSS + autoprefixer included.

---

## Out of Scope (for now)

- Spectators
- More than 2 players
- Persistent leaderboards
- Custom prompt submission by players
