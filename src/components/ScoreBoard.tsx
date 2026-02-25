import { useGameStore } from '../store/gameStore';

interface ScoreBoardProps {
  onSoundToggle?: () => void;
  soundEnabled?: boolean;
}

export function ScoreBoard({ onSoundToggle, soundEnabled }: ScoreBoardProps) {
  const highScore = useGameStore((state) => state.highScore);

  return (
    <div className="flex justify-between items-center mb-3 px-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎮</span>
        <span className="text-white font-bold text-lg">Block Puzzle</span>
      </div>
      <div className="text-yellow-400 text-sm">
        🏆 {highScore.toLocaleString()}
      </div>
      <button 
        onClick={onSoundToggle}
        className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
    </div>
  );
}

export function CurrentScore() {
  const score = useGameStore((state) => state.score);

  return (
    <div className="text-center mb-3">
      <div className="text-white/60 text-sm mb-1">当前得分</div>
      <div className="text-white text-3xl font-bold">
        {score.toLocaleString()}
      </div>
    </div>
  );
}
