import { useGameStore } from '../store/gameStore';
import { BlockSelector } from './BlockSelector';
import { ScoreBoard, CurrentScore } from './ScoreBoard';
import { GameOver } from './GameOver';
import { useState, useRef, useEffect, useCallback } from 'react';
import { getColorClass } from '../utils/blocks';

// 音效 URLs
const SOUNDS = {
  drop: 'https://cdn.freesound.org/previews/531/531947_5765482-lq.mp3',
  clear: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3',
  combo: 'https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3',
  gameOver: 'https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3',
};

function getFirstBlockCell(shape: number[][]): { row: number; col: number } {
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j] === 1) {
        return { row: i, col: j };
      }
    }
  }
  return { row: 0, col: 0 };
}

export function Game() {
  const selectedBlock = useGameStore((state) => state.selectedBlock);
  const placeSelectedBlock = useGameStore((state) => state.placeSelectedBlock);
  const restartGame = useGameStore((state) => state.restartGame);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const canPlaceBlock = useGameStore((state) => state.canPlaceBlock);
  const board = useGameStore((state) => state.board);
  const clearingCells = useGameStore((state) => state.clearingCells);
  
  const [hoverPos, setHoverPos] = useState<{row: number, col: number} | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true); // 默认开启
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());
  
  const boardRef = useRef<HTMLDivElement>(null);
  
  // 防止重复播放音效
  const lastSoundTime = useRef<number>(0);

  // 播放音效 - 简单直接
  const playSound = useCallback((type: 'drop' | 'clear' | 'combo' | 'gameOver') => {
    if (!soundEnabled && type !== 'gameOver') return;
    
    // 防止 100ms 内重复播放同类型音效
    const now = Date.now();
    if (now - lastSoundTime.current < 100) return;
    lastSoundTime.current = now;
    
    const audio = new Audio(SOUNDS[type]);
    audio.volume = type === 'drop' ? 0.7 : 0.6;
    audio.play().catch(() => {});
  }, [soundEnabled]);

  // 切换音效
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // 处理消除动画
  useEffect(() => {
    if (clearingCells.length > 0) {
      const cellSet = new Set(clearingCells.map(c => `${c.row}-${c.col}`));
      setAnimatingCells(cellSet);
      
      const timer = setTimeout(() => {
        setAnimatingCells(new Set());
      }, 400);
      
      return () => clearTimeout(timer);
    }
  }, [clearingCells]);

  // 游戏结束音效
  useEffect(() => {
    if (isGameOver) {
      playSound('gameOver');
    }
  }, [isGameOver, playSound]);

  // 放置方块并播放音效
  const placeBlockWithSound = useCallback((row: number, col: number) => {
    if (!selectedBlock) return;
    
    const firstCell = getFirstBlockCell(selectedBlock.shape);
    const adjustedPos = {
      row: row - firstCell.row,
      col: col - firstCell.col,
    };
    
    const result = placeSelectedBlock(adjustedPos);
    
    if (result.success) {
      // 判断是否有消除
      const hasClear = result.clearedCells && result.clearedCells.length > 0;
      
      if (hasClear) {
        // 有消除：播放消除音效
        if (result.clearedCells!.length >= 20) {
          playSound('combo');
        } else {
          playSound('clear');
        }
      } else {
        // 无消除：播放放置音效
        playSound('drop');
      }
    }
  }, [selectedBlock, placeSelectedBlock, playSound]);

  // 点击处理
  const handleCellClick = (row: number, col: number) => {
    placeBlockWithSound(row, col);
  };

  // 触摸处理
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!selectedBlock || !boardRef.current) return;
    
    const touch = e.touches[0];
    const rect = boardRef.current.getBoundingClientRect();
    const cellSize = rect.width / 10;
    
    const col = Math.floor((touch.clientX - rect.left) / cellSize);
    const row = Math.floor((touch.clientY - rect.top) / cellSize);
    
    if (row >= 0 && row < 10 && col >= 0 && col < 10) {
      setHoverPos({ row, col });
    }
  }, [selectedBlock]);

  const handleTouchEnd = useCallback(() => {
    if (!selectedBlock || !hoverPos) return;
    placeBlockWithSound(hoverPos.row, hoverPos.col);
    setHoverPos(null);
  }, [selectedBlock, hoverPos, placeBlockWithSound]);

  // 预览逻辑
  const shouldShowPreview = (rowIndex: number, colIndex: number): boolean => {
    if (!selectedBlock || !hoverPos) return false;
    
    const { shape } = selectedBlock;
    const firstCell = getFirstBlockCell(shape);
    const relRow = rowIndex - hoverPos.row + firstCell.row;
    const relCol = colIndex - hoverPos.col + firstCell.col;
    
    if (relRow < 0 || relRow >= shape.length) return false;
    if (relCol < 0 || relCol >= shape[0].length) return false;
    
    return shape[relRow][relCol] === 1;
  };

  const isPreviewValid = (): boolean => {
    if (!selectedBlock || !hoverPos) return false;
    
    const firstCell = getFirstBlockCell(selectedBlock.shape);
    const adjustedPos = {
      row: hoverPos.row - firstCell.row,
      col: hoverPos.col - firstCell.col,
    };
    
    return canPlaceBlock(selectedBlock, adjustedPos);
  };

  const getCellColorClass = (cell: number): string => {
    const colors: Record<number, string> = {
      1: 'bg-gradient-to-br from-block-cyan to-cyan-600',
      2: 'bg-gradient-to-br from-block-purple to-purple-700',
      3: 'bg-gradient-to-br from-block-orange to-orange-600',
      4: 'bg-gradient-to-br from-block-green to-green-600',
      5: 'bg-gradient-to-br from-block-pink to-pink-600',
      6: 'bg-gradient-to-br from-block-yellow to-yellow-600',
    };
    return colors[cell] || '';
  };

  const getPreviewColor = () => {
    if (!selectedBlock) return '';
    return getColorClass(selectedBlock.color);
  };

  const isCellAnimating = (row: number, col: number) => {
    return animatingCells.has(`${row}-${col}`);
  };

  const getHintText = () => {
    if (isGameOver) return '';
    if (selectedBlock) {
      return typeof window !== 'undefined' && 'ontouchstart' in window 
        ? '拖动到目标位置后松开放置'
        : '点击游戏区域放置方块';
    }
    return '请先选择一个方块';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
      <div className="bg-white/5 rounded-3xl p-4 shadow-2xl backdrop-blur-lg max-w-md w-full">
        <ScoreBoard onSoundToggle={toggleSound} soundEnabled={soundEnabled} />
        <CurrentScore />
        
        <div className="relative mb-4">
          <div 
            ref={boardRef}
            className="bg-black/30 rounded-2xl p-2 backdrop-blur-sm"
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="grid grid-cols-10 gap-0.5">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const showPreview = shouldShowPreview(rowIndex, colIndex);
                  const previewValid = isPreviewValid();
                  const animating = isCellAnimating(rowIndex, colIndex);
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      onMouseEnter={() => selectedBlock && setHoverPos({ row: rowIndex, col: colIndex })}
                      onMouseLeave={() => setHoverPos(null)}
                      className={`
                        aspect-square rounded-sm transition-all duration-150 cursor-pointer
                        ${cell === 0 ? 'bg-white/5 hover:bg-white/10' : ''}
                        ${showPreview && previewValid
                          ? getPreviewColor() + ' opacity-60 ring-2 ring-green-400 shadow-lg'
                          : showPreview && !previewValid
                          ? 'bg-red-500/60 ring-2 ring-red-400'
                          : cell !== 0
                          ? getCellColorClass(cell)
                          : ''
                        }
                        ${cell !== 0 ? 'block-3d' : ''}
                        ${animating ? 'clearing' : ''}
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
          onClick={() => restartGame()}
          className="w-full mt-3 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          🔄 重新开始
        </button>

        <div className="mt-3 h-6 flex items-center justify-center">
          <span className="text-white/60 text-sm">{getHintText()}</span>
        </div>
      </div>

      <GameOver isOpen={isGameOver} />
    </div>
  );
}
