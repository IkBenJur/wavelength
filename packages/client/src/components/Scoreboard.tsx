interface Props {
  score: number;
  maxPossible: number;
  round: number;
}

export default function Scoreboard({ score, maxPossible, round }: Props) {
  const pct = maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0;

  return (
    <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-6">
      <div className="text-slate-500 text-sm font-medium">Round {round}</div>

      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-300 font-semibold">{score} pts</span>
          <span className="text-slate-500">{maxPossible} possible</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="text-2xl font-black text-white tabular-nums">{pct}%</div>
    </div>
  );
}
