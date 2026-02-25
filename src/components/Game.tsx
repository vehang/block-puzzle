import { useGameStore } from '../store/gameStore';
import { BlockSelector } from './BlockSelector';
import { ScoreBoard, CurrentScore } from './ScoreBoard';
import { GameOver } from './GameOver';
import { useState, useRef, useEffect } from 'react';
import { getColorClass } from '../utils/blocks';

// 音效
const SOUNDS = {
  drop: 'https://cdn.freesound.org/previews/531/531947_5765482-lq.mp3',
  clear: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3',
  combo: 'https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3',
  gameOver: 'https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3',
};

// 预加载音频
const audioCache: Record<string, HTMLAudioElement> = {};
Object.entries(SOUNDS).forEach(([key, url]) => {
  audioCache[key] = new Audio(url);
  audioCache[key].preload = 'auto';
});

function getFirstBlockCell(shape: number[][]): { row: number; col: number } {
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j] === 1) return { row: i, col: j };
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());
  
  const boardRef = useRef<HTMLDivElement>(null);
  
  // 关键：防止重复触发的锁
  const isProcessingRef = useRef(false);
  // 记录上次播放音效的时间
  const lastSoundTimeRef = useRef(0);

  // 播放音效（简单直接）
  const playSound = (type: 'drop' | 'clear' | 'combo' | 'gameOver') => {
    if (!soundEnabled && type !== 'gameOver') return;
    
    // 300ms 内不重复播放
    const now = Date.now();
    if (now - lastSoundTimeRef.current < 300) {
      console.log('[音效] 防抖跳过:', type);
      return;
    }
    lastSoundTimeRef.current = now;
    
    console.log('[音效] 播放:', type, '时间:', now);
    
    const audio = audioCache[type];
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  };

  // 切换音效
  const toggleSound = () => setSoundEnabled(prev => !prev);

  // 消除动画
  useEffect(() => {
    if (clearingCells.length > 0) {
      setAnimatingCells(new Set(clearingCells.map(c => `${c.row}-${c.col}`)));
      const timer = setTimeout(() => setAnimatingCells(new Set()), 400);
      return () => clearTimeout(timer);
    }
  }, [clearingCells]);

  // 游戏结束
  useEffect(() => {
    if (isGameOver) playSound('gameOver');
  }, [isGameOver]);

  // 核心：放置方块并播放音效
  const tryPlaceBlock = (row: number, col: number): boolean => {
    // 防止重复触发
    if (isProcessingRef.current) {
      console.log('[放置] 锁定中，跳过');
      return false;
    }
    if (!selectedBlock) return false;
    
    const firstCell = getFirstBlockCell(selectedBlock.shape);
    const adjustedPos = { row: row - firstCell.row, col: col - firstCell.col };
    
    // 锁定
    isProcessingRef.current = true;
    console.log('[放置] 开始，位置:', adjustedPos);
    
    const result = placeSelectedBlock(adjustedPos);
    
    if (result.success) {
      const clearedCount = result.clearedCells?.length || 0;
      console.log('[放置] 成功，消除数量:', clearedCount);
      
      if (clearedCount > 0) {
        // 有消除：播放消除音效
        playSound(clearedCount >= 20 ? 'combo' : 'clear');
      } else {
        // 无消除：播放放置音效
        playSound('drop');
      }
      
      // 延迟解锁，防止快速重复
      setTimeout(() => { 
        isProcessingRef.current = false; 
        console.log('[放置] 解锁');
      }, 300);
      return true;
    }
    
    // 放置失败，立即解锁
    isProcessingRef.current = false;
    console.log('[放置] 失败');
    return false;
  };

  // PC 点击
  const handleClick = (row: number, col: number) => {
    tryPlaceBlock(row, col);
  };

  // 移动端触摸
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!selectedBlock || !boardRef.current) return;
    const touch = e.touches[0];
    const rect = boardRef.current.getBoundingClientRect();
    const cellSize = rect.width / 10;
    const col = Math.floor((touch.clientX - rect.left) / cellSize);
    const row = Math.floor((touch.clientY - rect.top) / cellSize);
    if (row >= 0 && row < 10 && col >= 0 && col < 10) {
      setHoverPos({ row, col });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault(); // 阻止后续的 click 事件
    if (hoverPos) {
      tryPlaceBlock(hoverPos.row, hoverPos.col);
      setHoverPos(null);
    }
  };

  // 预览逻辑
  const shouldShowPreview = (r: number, c: number): boolean => {
    if (!selectedBlock || !hoverPos) return false;
    const { shape } = selectedBlock;
    const fc = getFirstBlockCell(shape);
    const rr = r - hoverPos.row + fc.row;
    const rc = c - hoverPos.col + fc.col;
    if (rr < 0 || rr >= shape.length || rc < 0 || rc >= shape[0].length) return false;
    return shape[rr][rc] === 1;
  };

  const isPreviewValid = (): boolean => {
    if (!selectedBlock || !hoverPos) return false;
    const fc = getFirstBlockCell(selectedBlock.shape);
    return canPlaceBlock(selectedBlock, { row: hoverPos.row - fc.row, col: hoverPos.col - fc.col });
  };

  const getCellColor = (cell: number): string => ({
    1: 'bg-gradient-to-br from-block-cyan to-cyan-600',
    2: 'bg-gradient-to-br from-block-purple to-purple-700',
    3: 'bg-gradient-to-br from-block-orange to-orange-600',
    4: 'bg-gradient-to-br from-block-green to-green-600',
    5: 'bg-gradient-to-br from-block-pink to-pink-600',
    6: 'bg-gradient-to-br from-block-yellow to-yellow-600',
  }[cell] || '');

  const getPreviewColor = () => selectedBlock ? getColorClass(selectedBlock.color) : '';

  const getHintText = () => {
    if (isGameOver) return '';
    if (selectedBlock) return 'ontouchstart' in window ? '拖动到目标位置后松开放置' : '点击游戏区域放置方块';
    return '请先选择一个方块';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
      <div className="bg-white/5 rounded-3xl p-4 shadow-2xl backdrop-blur-lg max-w-md w-full">
        <ScoreBoard onSoundToggle={toggleSound} soundEnabled={soundEnabled} />
        <CurrentScore />
        
        <div className="relative mb-4">
          <div ref={boardRef} className="bg-black/30 rounded-2xl p-2 backdrop-blur-sm"
            onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <div className="grid grid-cols-10 gap-0.5">
              {board.map((row, ri) => row.map((cell, ci) => {
                const preview = shouldShowPreview(ri, ci);
                const valid = isPreviewValid();
                const animating = animatingCells.has(`${ri}-${ci}`);
                return (
                  <div key={`${ri}-${ci}`}
                    onClick={() => handleClick(ri, ci)}
                    onMouseEnter={() => selectedBlock && setHoverPos({ row: ri, col: ci })}
                    onMouseLeave={() => setHoverPos(null)}
                    className={`aspect-square rounded-sm transition-all duration-150 cursor-pointer
                      ${cell === 0 ? 'bg-white/5 hover:bg-white/10' : ''}
                      ${preview && valid ? getPreviewColor() + ' opacity-60 ring-2 ring-green-400 shadow-lg' : ''}
                      ${preview && !valid ? 'bg-red-500/60 ring-2 ring-red-400' : ''}
                      ${!preview && cell !== 0 ? getCellColor(cell) + ' block-3d' : ''}
                      ${animating ? 'clearing' : ''}`}
                  />
                );
              }))}
            </div>
          </div>
        </div>

        <BlockSelector />

        <button onClick={() => restartGame()}
          className="w-full mt-3 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105">
          🔄 重新开始
        </button>

        <div className="mt-3 h-6 text-center text-white/60 text-sm">{getHintText()}</div>
      </div>

      <GameOver isOpen={isGameOver} />
    </div>
  );
}
