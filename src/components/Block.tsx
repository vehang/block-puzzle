import type { Block as BlockType } from '../types/game';
import { getColorClass } from '../utils/blocks';
import { useGameStore } from '../store/gameStore';

interface BlockProps {
  block: BlockType;
  disabled?: boolean;
}

export function Block({ block, disabled }: BlockProps) {
  const selectBlock = useGameStore((state) => state.selectBlock);
  const selectedBlock = useGameStore((state) => state.selectedBlock);
  const board = useGameStore((state) => state.board);

  const isSelected = selectedBlock?.id === block.id;
  
  // Check if this block can be placed anywhere
  const canBePlaced = (() => {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const { shape } = block;
        let canPlace = true;
        for (let i = 0; i < shape.length && canPlace; i++) {
          for (let j = 0; j < shape[i].length && canPlace; j++) {
            if (shape[i][j] === 1) {
              const newRow = row + i;
              const newCol = col + j;
              if (newRow >= 10 || newCol >= 10 || board[newRow][newCol] !== 0) {
                canPlace = false;
              }
            }
          }
        }
        if (canPlace) return true;
      }
    }
    return false;
  })();

  const handleClick = () => {
    if (disabled || !canBePlaced) return;
    selectBlock(isSelected ? null : block);
  };

  const gridCols = block.shape[0].length;
  const gridRows = block.shape.length;

  return (
    <div
      onClick={handleClick}
      className={`
        p-2 rounded-xl transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'bg-white/20 scale-110 ring-2 ring-white/50' 
          : 'bg-white/5 hover:bg-white/10'
        }
        ${!canBePlaced ? 'opacity-30 cursor-not-allowed' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div 
        className="grid gap-0.5"
        style={{ 
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
        }}
      >
        {block.shape.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className={`
                w-4 h-4 rounded-sm transition-all
                ${cell === 1 
                  ? getColorClass(block.color) + ' shadow-md' 
                  : 'bg-transparent'
                }
              `}
            />
          ))
        )}
      </div>
    </div>
  );
}
