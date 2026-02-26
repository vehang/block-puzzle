import { useGameStore } from '../store/gameStore';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
  const leaderboard = useGameStore((state) => state.leaderboard);

  if (!isOpen) return null;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-white/80';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            🏆 排行榜
          </h2>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {leaderboard.length === 0 ? (
            <div className="text-center text-white/50 py-8">
              暂无记录<br/>
              <span className="text-sm">开始游戏创造你的第一个记录吧！</span>
            </div>
          ) : (
            leaderboard.map((record) => (
              <div 
                key={record.id}
                className={`flex items-center justify-between px-4 py-2 rounded-lg ${
                  record.rank <= 3 
                    ? 'bg-white/10' 
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8">{getRankIcon(record.rank)}</span>
                  <span className={`font-bold ${getRankClass(record.rank)}`}>
                    {record.score.toLocaleString()}
                  </span>
                </div>
                <span className="text-white/50 text-sm">
                  {record.date}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-95"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
