import { useGameStore } from '../store/gameStore';

interface GameOverProps {
  isOpen: boolean;
}

export function GameOver({ isOpen }: GameOverProps) {
  const score = useGameStore((state) => state.score);
  const highScore = useGameStore((state) => state.highScore);
  const restartGame = useGameStore((state) => state.restartGame);

  if (!isOpen) return null;

  const isNewHighScore = score >= highScore && score > 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-center max-w-sm w-full mx-4 transform animate-bounce-in">
        <div className="text-6xl mb-4">🎮</div>
        <h2 className="text-white text-2xl font-bold mb-6">游戏结束</h2>
        
        <div className="mb-6">
          <div className="text-white/60 text-sm mb-1">本次得分</div>
          <div className="text-white text-4xl font-bold">
            {score.toLocaleString()}
          </div>
        </div>

        {isNewHighScore && (
          <div className="text-yellow-400 text-lg mb-4 animate-pulse">
            🎉 新纪录！
          </div>
        )}

        <div className="text-yellow-400 text-sm mb-6">
          🏆 最高记录: {highScore.toLocaleString()}
        </div>

        <button
          onClick={restartGame}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
        >
          🔄 再来一局
        </button>

        <button
          className="w-full py-3 mt-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
          onClick={() => {
            // Share functionality placeholder
            alert('分享功能开发中...');
          }}
        >
          📤 分享成绩
        </button>
      </div>
    </div>
  );
}
