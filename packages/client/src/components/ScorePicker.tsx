import { useState } from 'react';
import { Prompt } from '../hooks/useRoom';

interface Props {
  prompt: Prompt;
  assignedScore: number;
  onReady: () => void;
}

export default function ScorePicker({ prompt, assignedScore, onReady }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  function handleReady() {
    if (confirmed) return;
    setConfirmed(true);
    onReady();
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-slate-400 text-sm uppercase tracking-widest font-medium">Your turn to give a clue</p>
        <p className="text-slate-300 text-base leading-relaxed">
          Think of something that belongs at position <span className="text-violet-400 font-bold">{assignedScore}</span> on the scale, then tell your partner what it is.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <span className="text-red-400 font-semibold text-sm text-left flex-1">{prompt.negative}</span>
          <span className="text-slate-600 text-xs">↔</span>
          <span className="text-emerald-400 font-semibold text-sm text-right flex-1">{prompt.positive}</span>
        </div>

        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`aspect-square rounded-xl flex items-center justify-center font-black text-lg ${
                n === assignedScore
                  ? 'bg-violet-500 text-white scale-110 shadow-lg shadow-violet-500/40'
                  : 'bg-white/5 text-slate-600'
              }`}
            >
              {n}
            </div>
          ))}
        </div>

      </div>

      <button
        onClick={handleReady}
        disabled={confirmed}
        className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
      >
        {confirmed ? 'Waiting for partner to guess…' : "I've told them — let them guess"}
      </button>
    </div>
  );
}
