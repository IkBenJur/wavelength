import { useRoom } from './hooks/useRoom';
import Home from './pages/Home';
import Room from './pages/Room';

export default function App() {
  const { room, error, connected, hoverGuess, clearError, join, lockScore, submitGuess, sendHover, nextRound, endGame, leaveGame } =
    useRoom();

  if (!room) {
    return <Home onJoin={join} error={error} connected={connected} />;
  }

  return (
    <Room
      room={room}
      hoverGuess={hoverGuess}
      onLockScore={lockScore}
      onSubmitGuess={submitGuess}
      onSendHover={sendHover}
      onNextRound={nextRound}
      onEndGame={endGame}
      onLeaveGame={leaveGame}
    />
  );
}
