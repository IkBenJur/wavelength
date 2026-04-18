interface Props {
  roomId: string;
  onLeave: () => void;
}

export default function WaitingScreen({ roomId, onLeave }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <div className="w-16 h-16 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
      <div className="text-center">
        <p className="text-slate-300 text-lg mb-4">Waiting for your partner to join…</p>
        <p className="text-slate-500 text-sm mb-2">Share this room code:</p>
        <div className="inline-block bg-white/10 border border-white/20 rounded-2xl px-8 py-4">
          <span className="text-4xl font-black text-white tracking-widest font-mono">{roomId}</span>
        </div>
      </div>
      <button
        onClick={onLeave}
        className="text-slate-400 hover:text-white text-sm transition-colors"
      >
        ← Back to Home
      </button>
    </div>
  );
}
