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

  // 计算方块的实际尺寸
  const cols = block.shape[0].length;
  const rows = block.shape.length;
  
  // 每个格子的基础大小
  const baseCellSize = 16;
  
  // 计算方块需要的总尺寸
  const blockWidth = cols * baseCellSize;
  const blockHeight = rows * baseCellSize;
  
  // 容器最大尺寸
  const maxSize = 70;
  
  // 只有当方块超过最大尺寸时才缩放
  const needScale = blockWidth > maxSize || blockHeight > maxSize;
  const scale = needScale ? maxSize / Math.max(blockWidth, blockHeight) : 1;
  
  // 实际显示的格子大小
  const cellSize = Math.floor(baseCellSize * scale);
  
  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center justify-center
        w-20 h-20 rounded-xl transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'bg-white/20 scale-110 ring-2 ring-white/50 shadow-lg' 
          : 'bg-white/5 hover:bg-white/10'
        }
        ${!canBePlaced ? 'opacity-30 cursor-not-allowed' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div 
        className="grid gap-px"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        }}
      >
        {block.shape.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className={`
                rounded-sm transition-all
                ${cell === 1 
                  ? getColorClass(block.color) + ' block-3d' 
                  : 'bg-transparent'
                }
              `}
              style={{
                width: cellSize,
                height: cellSize,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
