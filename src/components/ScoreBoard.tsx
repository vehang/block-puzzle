import { useGameStore } from '../store/gameStore';

interface ScoreBoardProps {
  onSoundToggle?: () => void;
  soundEnabled?: boolean;
  onLeaderboardOpen?: () => void;
}

export function ScoreBoard({ onSoundToggle, soundEnabled, onLeaderboardOpen }: ScoreBoardProps) {
  const highScore = useGameStore((state) => state.highScore);

  return (
    <div className="flex justify-between items-center mb-3 px-1">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎮</span>
        <span className="text-white font-bold text-lg">Block Puzzle</span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onLeaderboardOpen}
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium text-yellow-400 flex items-center gap-1 transition-all"
          title="排行榜"
        >
          🏆 {highScore.toLocaleString()}
        </button>
        <button 
          onClick={onSoundToggle}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-lg flex items-center justify-center transition-all"
          title={soundEnabled ? '关闭音效' : '开启音效'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
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
