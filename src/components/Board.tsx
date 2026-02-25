import { useGameStore } from '../store/gameStore';
import { getColorClass } from '../utils/blocks';
import { COLOR_MAP } from '../utils/game';

export function Board() {
  const board = useGameStore((state) => state.board);

  return (
    <div className="bg-black/30 rounded-2xl p-2 backdrop-blur-sm">
      <div className="grid grid-cols-10 gap-0.5">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                aspect-square rounded-sm transition-all duration-200
                ${cell === 0 
                  ? 'bg-white/5 hover:bg-white/10' 
                  : getColorClass(COLOR_MAP[cell] as any)
                }
                ${cell !== 0 ? 'shadow-lg' : ''}
              `}
            />
          ))
        )}
      </div>
    </div>
  );
}
