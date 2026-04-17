import { Player } from '../hooks/useRoom';

interface Props {
  players: (Player | null)[];
  scores: [number, number];
  myIndex: 0 | 1;
  round: number;
}

export default function Scoreboard({ players, scores, myIndex, round }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="text-slate-500 text-sm font-medium">Round {round}</div>
      <div className="flex gap-4">
        {([0, 1] as const).map((i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              i === myIndex ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-white/5 border border-white/10'
            }`}
          >
            <span className="text-sm font-medium text-slate-300">
              {players[i]?.name ?? '…'}
              {i === myIndex && <span className="text-violet-400 ml-1">(you)</span>}
            </span>
            <span className="text-xl font-black text-white">{scores[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
