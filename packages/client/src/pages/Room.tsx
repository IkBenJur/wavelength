import { RoomState } from '../hooks/useRoom';
import Scoreboard from '../components/Scoreboard';
import WaitingScreen from '../components/WaitingScreen';
import ScorePicker from '../components/ScorePicker';
import GuessPicker from '../components/GuessPicker';

interface Props {
  room: RoomState;
  onLockScore: () => void;
  onSubmitGuess: (guess: number) => void;
  onNextRound: () => void;
  onEndGame: () => void;
}

const pointsLabel: Record<number, string> = {
  10: 'Perfect! 🎯',
  8: 'So close!',
  5: 'Not bad',
  2: 'A little off',
  0: 'Way off',
};

export default function Room({ room, onLockScore, onSubmitGuess, onNextRound, onEndGame }: Props) {
  const { phase, scorerIndex, myPlayerIndex, players, currentPrompt } = room;
  const isScorer = myPlayerIndex === scorerIndex;
  const guesserIndex: 0 | 1 = scorerIndex === 0 ? 1 : 0;
  const scorer = players[scorerIndex];
  const guesser = players[guesserIndex];
  const myReadyForNext = room.nextRoundReady.includes(myPlayerIndex);
  const partnerIndex: 0 | 1 = myPlayerIndex === 0 ? 1 : 0;
  const partnerDisconnected = players[partnerIndex] !== null && !players[partnerIndex]?.connected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Wave<span className="text-violet-400">length</span>
          </h1>
        </div>

        {phase !== 'waiting' && phase !== 'gameover' && (
          <Scoreboard
            score={room.score}
            maxPossible={room.maxPossible}
            round={room.round}
          />
        )}

        {partnerDisconnected && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm text-center">
            {players[partnerIndex]?.name} disconnected — waiting for them to reconnect…
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-2xl">
          {phase === 'waiting' && <WaitingScreen roomId={room.id} />}

          {phase === 'scoring' && currentPrompt && (
            isScorer ? (
              <ScorePicker prompt={currentPrompt} assignedScore={room.lockedScore!} onReady={onLockScore} />
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-slate-300">
                    <span className="text-violet-400 font-semibold">{scorer?.name}</span> is thinking of a clue…
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-red-400 font-semibold text-sm flex-1">{currentPrompt.negative}</span>
                    <span className="text-slate-600 text-xs">↔</span>
                    <span className="text-emerald-400 font-semibold text-sm flex-1 text-right">{currentPrompt.positive}</span>
                  </div>
                </div>
              </div>
            )
          )}

          {phase === 'guessing' && currentPrompt && (
            isScorer ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-slate-300">
                  <span className="text-violet-400 font-semibold">{guesser?.name}</span> is guessing…
                </p>
              </div>
            ) : (
              <GuessPicker
                prompt={currentPrompt}
                scorerName={scorer?.name ?? 'Your partner'}
                onGuess={onSubmitGuess}
              />
            )
          )}

          {phase === 'reveal' && currentPrompt && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm uppercase tracking-widest font-medium mb-4">Result</p>
                <p className="text-2xl font-black text-white mb-1">
                  {room.lastPoints !== null ? pointsLabel[room.lastPoints] ?? '' : ''}
                </p>
                <p className="text-violet-300 text-lg font-semibold">
                  +{room.lastPoints} point{room.lastPoints !== 1 ? 's' : ''} — {room.score} / {room.maxPossible} total
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center gap-4 text-sm">
                  <span className="text-red-400 font-medium flex-1">{currentPrompt.negative}</span>
                  <span className="text-slate-600 text-xs">↔</span>
                  <span className="text-emerald-400 font-medium flex-1 text-right">{currentPrompt.positive}</span>
                </div>

                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                    const isActual = n === room.lockedScore;
                    const isGuess = n === room.lastGuess;
                    return (
                      <div
                        key={n}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-black relative ${
                          isActual && isGuess
                            ? 'bg-emerald-500 text-white'
                            : isActual
                            ? 'bg-violet-500 text-white'
                            : isGuess
                            ? 'bg-orange-500 text-white'
                            : 'bg-white/5 text-slate-600'
                        }`}
                      >
                        {n}
                        {isActual && !isGuess && (
                          <span className="absolute -top-4 text-xs text-violet-400 font-bold">
                            {scorer?.name?.split(' ')[0]}
                          </span>
                        )}
                        {isGuess && !isActual && (
                          <span className="absolute -top-4 text-xs text-orange-400 font-bold">
                            {guesser?.name?.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-6 text-xs text-slate-500">
                  <span><span className="text-violet-400">■</span> {scorer?.name}'s score ({room.lockedScore})</span>
                  <span><span className="text-orange-400">■</span> {guesser?.name}'s guess ({room.lastGuess})</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onNextRound}
                  disabled={myReadyForNext}
                  className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors"
                >
                  {myReadyForNext ? 'Waiting for partner…' : 'Next Round'}
                </button>
                <button
                  onClick={onEndGame}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-medium transition-colors border border-white/10"
                >
                  End
                </button>
              </div>
            </div>
          )}

          {phase === 'gameover' && (
            <div className="text-center space-y-6 py-4">
              <p className="text-slate-400 text-sm uppercase tracking-widest font-medium">Game Over</p>
              <div className="space-y-2">
                <div className="text-6xl font-black text-white">
                  {room.score}
                  <span className="text-slate-500 text-3xl font-medium"> / {room.maxPossible}</span>
                </div>
                <p className="text-slate-400 text-sm">
                  {room.maxPossible > 0 ? Math.round((room.score / room.maxPossible) * 100) : 0}% accuracy over {room.round} round{room.round !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${room.maxPossible > 0 ? Math.round((room.score / room.maxPossible) * 100) : 0}%` }}
                />
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
