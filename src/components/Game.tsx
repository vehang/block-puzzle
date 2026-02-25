import { useGameStore } from '../store/gameStore';
import { BlockSelector } from './BlockSelector';
import { ScoreBoard, CurrentScore } from './ScoreBoard';
import { GameOver } from './GameOver';
import { useState, useRef, useEffect, useCallback } from 'react';
import { getColorClass } from '../utils/blocks';

// 音效 URLs
const SOUNDS = {
  bgm: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
  drop: 'https://cdn.freesound.org/previews/531/531947_5765482-lq.mp3',
  clear: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3',
  combo: 'https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3',
  gameOver: 'https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3',
};

// 找到方块的第一个砖块位置
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
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());
  
  // Audio refs
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const dropSoundRef = useRef<HTMLAudioElement | null>(null);
  const clearSoundRef = useRef<HTMLAudioElement | null>(null);
  const comboSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Board ref
  const boardRef = useRef<HTMLDivElement>(null);

  // Initialize audio elements
  useEffect(() => {
    bgmRef.current = new Audio(SOUNDS.bgm);
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.3;
    
    dropSoundRef.current = new Audio(SOUNDS.drop);
    dropSoundRef.current.volume = 0.7;
    dropSoundRef.current.preload = 'auto';
    
    clearSoundRef.current = new Audio(SOUNDS.clear);
    clearSoundRef.current.volume = 0.6;
    clearSoundRef.current.preload = 'auto';
    
    comboSoundRef.current = new Audio(SOUNDS.combo);
    comboSoundRef.current.volume = 0.6;
    comboSoundRef.current.preload = 'auto';
    
    gameOverSoundRef.current = new Audio(SOUNDS.gameOver);
    gameOverSoundRef.current.volume = 0.7;
    gameOverSoundRef.current.preload = 'auto';
    
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
    };
  }, []);

  // Play sound effects - 受 soundEnabled 控制
  const playSound = useCallback((type: 'drop' | 'clear' | 'combo' | 'gameOver') => {
    // 所有音效都受开关控制（除了游戏结束）
    if (!soundEnabled && type !== 'gameOver') {
      return;
    }
    
    const soundMap = {
      drop: dropSoundRef.current,
      clear: clearSoundRef.current,
      combo: comboSoundRef.current,
      gameOver: gameOverSoundRef.current,
    };
    
    const audio = soundMap[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      if (newValue && bgmRef.current) {
        bgmRef.current.play().catch(() => {});
      } else if (!newValue && bgmRef.current) {
        bgmRef.current.pause();
      }
      return newValue;
    });
  }, []);

  // Handle clearing animation
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

  // Game over sound
  useEffect(() => {
    if (isGameOver) {
      playSound('gameOver');
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
    }
  }, [isGameOver, playSound]);

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (!selectedBlock) return;
    
    const firstCell = getFirstBlockCell(selectedBlock.shape);
    const adjustedPos = {
      row: row - firstCell.row,
      col: col - firstCell.col,
    };
    
    const currentScore = useGameStore.getState().score;
    const result = placeSelectedBlock(adjustedPos);
    
    if (result.success) {
      // 检查是否有消除（分数是否增加）
      const newScore = useGameStore.getState().score;
      if (newScore > currentScore) {
        // 有消除，播放消除音效
        const scoreDiff = newScore - currentScore;
        if (scoreDiff >= 30) {
          playSound('combo');
        } else {
          playSound('clear');
        }
      } else {
        // 无消除，播放放置音效
        playSound('drop');
      }
    }
  };

  // Handle cell hover
  const handleCellHover = (row: number, col: number) => {
    if (selectedBlock) {
      setHoverPos({ row, col });
    }
  };

  // Handle touch move
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

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!selectedBlock || !hoverPos) return;
    
    const firstCell = getFirstBlockCell(selectedBlock.shape);
    const adjustedPos = {
      row: hoverPos.row - firstCell.row,
      col: hoverPos.col - firstCell.col,
    };
    
    const currentScore = useGameStore.getState().score;
    const result = placeSelectedBlock(adjustedPos);
    
    if (result.success) {
      const newScore = useGameStore.getState().score;
      if (newScore > currentScore) {
        const scoreDiff = newScore - currentScore;
        if (scoreDiff >= 30) {
          playSound('combo');
        } else {
          playSound('clear');
        }
      } else {
        playSound('drop');
      }
    }
    setHoverPos(null);
  }, [selectedBlock, hoverPos, placeSelectedBlock, playSound]);

  // Check preview
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
                      onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
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
          onClick={() => {
            restartGame();
            if (soundEnabled && bgmRef.current) {
              bgmRef.current.play().catch(() => {});
            }
          }}
          className="w-full mt-3 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          🔄 重新开始
        </button>

        <div className="mt-3 h-6 flex items-center justify-center">
          <span className="text-white/60 text-sm">
            {getHintText()}
          </span>
        </div>
      </div>

      <GameOver isOpen={isGameOver} />
    </div>
  );
}
