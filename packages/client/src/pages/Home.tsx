import { useState, FormEvent } from 'react';

function randomRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

interface Props {
  onJoin: (roomId: string, playerName: string) => void;
  error: string | null;
  connected: boolean;
}

export default function Home({ onJoin, error, connected }: Props) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;
    onJoin(roomId.trim().toUpperCase(), name.trim());
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black text-white tracking-tight mb-2">
            Wave<span className="text-violet-400">length</span>
          </h1>
          <p className="text-slate-400 text-lg">Get on the same wavelength</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full bg-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Room code</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={10}
              className="w-full bg-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono uppercase tracking-widest"
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-slate-500">Share this code with your partner to play together.</p>
              <button
                type="button"
                onClick={() => setRoomId(randomRoomId())}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors shrink-0 ml-3"
              >
                Generate random
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={!connected || !name.trim() || !roomId.trim()}
            className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
          >
            {connected ? 'Join Room' : 'Connecting…'}
          </button>
        </form>
      </div>
    </div>
  );
}
