import { useState } from 'react';
import { Prompt } from '../hooks/useRoom';

interface Props {
  prompt: Prompt;
  scorerName: string;
  onGuess: (guess: number) => void;
  onHover: (hover: number | null) => void;
}

const numberColors = [
  'from-red-600 to-red-500',
  'from-red-500 to-orange-500',
  'from-orange-500 to-orange-400',
  'from-orange-400 to-yellow-400',
  'from-yellow-400 to-yellow-300',
  'from-yellow-300 to-lime-400',
  'from-lime-400 to-green-400',
  'from-green-400 to-green-500',
  'from-green-500 to-emerald-500',
  'from-emerald-500 to-emerald-400',
];

export default function GuessPicker({ prompt, scorerName, onGuess, onHover }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (selected === null || submitted) return;
    setSubmitted(true);
    onHover(null);
    onGuess(selected);
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-slate-400 text-sm uppercase tracking-widest font-medium">Your turn to guess</p>
        <p className="text-slate-300 text-base leading-relaxed">
          {scorerName} told you something — where did they place it on the scale?
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
            <button
              key={n}
              onClick={() => { if (!submitted) { setSelected(n); onHover(n); } }}
              onMouseEnter={() => { if (!submitted && selected === null) onHover(n); }}
              onMouseLeave={() => { if (!submitted && selected === null) onHover(null); }}
              disabled={submitted}
              className={`aspect-square rounded-xl font-black text-lg transition-all ${
                selected === n
                  ? `bg-gradient-to-br ${numberColors[n - 1]} text-white scale-110 shadow-lg`
                  : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'
              } disabled:cursor-not-allowed`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-xs text-slate-600 px-1">
          <span>1 = {prompt.negative}</span>
          <span>{prompt.positive} = 10</span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selected === null || submitted}
        className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
      >
        {submitted ? 'Submitted!' : selected ? `Submit ${selected}` : 'Select a number'}
      </button>
    </div>
  );
}
