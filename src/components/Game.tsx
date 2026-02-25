import { useGameStore } from '../store/gameStore';
import { BlockSelector } from './BlockSelector';
import { ScoreBoard, CurrentScore } from './ScoreBoard';
import { GameOver } from './GameOver';
import { useState } from 'react';

export function Game() {
  const selectedBlock = useGameStore((state) => state.selectedBlock);
  const placeSelectedBlock = useGameStore((state) => state.placeSelectedBlock);
  const restartGame = useGameStore((state) => state.restartGame);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const canPlaceBlock = useGameStore((state) => state.canPlaceBlock);
  const board = useGameStore((state) => state.board);
  
  const [hoverPos, setHoverPos] = useState<{row: number, col: number} | null>(null);

  // Handle cell click for placing block
  const handleCellClick = (row: number, col: number) => {
    if (!selectedBlock) return;
    
    const placed = placeSelectedBlock({ row, col });
    if (!placed) {
      // Could add error feedback here
    }
  };

  // Handle cell hover
  const handleCellHover = (row: number, col: number) => {
    if (selectedBlock) {
      setHoverPos({ row, col });
    }
  };

  // Check if a cell should show preview
  const shouldShowPreview = (rowIndex: number, colIndex: number): boolean => {
    if (!selectedBlock || !hoverPos) return false;
    
    const { shape } = selectedBlock;
    const relRow = rowIndex - hoverPos.row;
    const relCol = colIndex - hoverPos.col;
    
    if (relRow < 0 || relRow >= shape.length) return false;
    if (relCol < 0 || relCol >= shape[0].length) return false;
    
    return shape[relRow][relCol] === 1;
  };

  // Check if preview position is valid
  const isPreviewValid = (): boolean => {
    if (!selectedBlock || !hoverPos) return false;
    return canPlaceBlock(selectedBlock, hoverPos);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
      <div className="bg-white/5 rounded-3xl p-4 shadow-2xl backdrop-blur-lg max-w-md w-full">
        <ScoreBoard />
        <CurrentScore />
        
        {/* Game Board with click handling */}
        <div className="relative mb-6">
          <div className="bg-black/30 rounded-2xl p-2 backdrop-blur-sm">
            <div className="grid grid-cols-10 gap-0.5">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const showPreview = shouldShowPreview(rowIndex, colIndex);
                  const previewValid = isPreviewValid();
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
                      onMouseLeave={() => setHoverPos(null)}
                      className={`
                        aspect-square rounded-sm transition-all duration-200 cursor-pointer
                        ${cell === 0 
                          ? 'bg-white/5 hover:bg-white/10' 
                          : ''
                        }
                        ${showPreview && previewValid
                          ? 'bg-green-500/50 ring-1 ring-green-400'
                          : showPreview && !previewValid
                          ? 'bg-red-500/50 ring-1 ring-red-400'
                          : cell !== 0
                          ? getCellColorClass(cell)
                          : ''
                        }
                        ${cell !== 0 ? 'shadow-lg' : ''}
                      `}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <BlockSelector />

        <button
          onClick={restartGame}
          className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          🔄 重新开始
        </button>

        {/* Selected block indicator */}
        {selectedBlock && (
          <div className="mt-4 text-center text-white/60 text-sm">
            点击游戏区域放置方块
          </div>
        )}
      </div>

      <GameOver isOpen={isGameOver} />
    </div>
  );
}

// Helper function to get cell color class
function getCellColorClass(cell: number): string {
  const colors: Record<number, string> = {
    1: 'bg-gradient-to-br from-block-cyan to-cyan-600',
    2: 'bg-gradient-to-br from-block-purple to-purple-700',
    3: 'bg-gradient-to-br from-block-orange to-orange-600',
    4: 'bg-gradient-to-br from-block-green to-green-600',
    5: 'bg-gradient-to-br from-block-pink to-pink-600',
    6: 'bg-gradient-to-br from-block-yellow to-yellow-600',
  };
  return colors[cell] || '';
}
