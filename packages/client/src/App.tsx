import { useRoom } from './hooks/useRoom';
import Home from './pages/Home';
import Room from './pages/Room';

export default function App() {
  const { room, error, connected, clearError, join, lockScore, submitGuess, nextRound, endGame } =
    useRoom();

  if (!room) {
    return <Home onJoin={join} error={error} connected={connected} />;
  }

  return (
    <Room
      room={room}
      onLockScore={lockScore}
      onSubmitGuess={submitGuess}
      onNextRound={nextRound}
      onEndGame={endGame}
    />
  );
}
