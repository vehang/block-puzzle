import { useGameStore } from '../store/gameStore';
import { BlockSelector } from './BlockSelector';
import { ScoreBoard, CurrentScore } from './ScoreBoard';
import { GameOver } from './GameOver';
import { Leaderboard } from './Leaderboard';
import { useState, useRef, useEffect } from 'react';
import { getColorClass } from '../utils/blocks';

// 碎片接口
interface Fragment {
  id: string;
  x: number;
  y: number;
  color: string;
  brightness: number;
  angle: number;
  distance: number;
  rotation: number;
  delay: number;
  shape: 'square' | 'circle' | 'triangle';  // 形状类型
  size: number;  // 大小
}

// 颜色配置
const COLOR_VALUES: Record<number, string> = {
  1: '#06b6d4', // cyan
  2: '#a855f7', // purple
  3: '#f97316', // orange
  4: '#22c55e', // green
  5: '#ec4899', // pink
  6: '#eab308', // yellow
};

// 碎片亮度配置 (9个碎片的深浅变化)
const FRAGMENT_BRIGHTNESS = [0.8, 1.0, 1.2, 1.0, 1.2, 0.8, 1.2, 0.8, 1.0];

// 生成碎片
function generateFragments(
  row: number,
  col: number,
  cellValue: number,
  cellSize: number
): Fragment[] {
  const baseColor = COLOR_VALUES[cellValue];
  if (!baseColor) return [];
  
  const baseX = col * cellSize + cellSize / 2;
  const baseY = row * cellSize + cellSize / 2;
  
  // 9个碎片，混合方块、圆点和三角形
  const shapes: Array<'square' | 'circle' | 'triangle'> = [
    'square', 'circle', 'square',
    'circle', 'triangle', 'circle',
    'square', 'circle', 'square'
  ];
  
  // 16个方向
  const angles = [
    200, 240, 280, 320,   // 上排4个
    180, 0,               // 中排2个
    160, 100, 80, 20      // 下排4个
  ];
  
  return Array.from({ length: 9 }, (_, i) => ({
    id: `${row}-${col}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    x: baseX + (i % 3 - 1) * (cellSize / 6),
    y: baseY + (Math.floor(i / 3) - 1) * (cellSize / 6),
    color: baseColor,
    brightness: FRAGMENT_BRIGHTNESS[i],
    angle: angles[i] + (Math.random() - 0.5) * 20,
    distance: 25 + Math.random() * 35,
    rotation: 90 + Math.random() * 450,
    delay: Math.random() * 30,
    shape: shapes[i],
    size: 4 + Math.random() * 4,  // 4-8px
  }));
}

// 使用 Web Audio API 生成音效
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playDropSound() {
  playTone(800, 0.1, 'square');
}

function playClearSound() {
  playTone(523, 0.15, 'sine');
  setTimeout(() => playTone(659, 0.15, 'sine'), 100);
}

function playComboSound() {
  playTone(523, 0.1, 'sine');
  setTimeout(() => playTone(659, 0.1, 'sine'), 80);
  setTimeout(() => playTone(784, 0.15, 'sine'), 160);
}

function playGameOverSound() {
  playTone(200, 0.3, 'sawtooth');
}

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  
  const boardRef = useRef<HTMLDivElement>(null);
  
  // 触摸相关
  const touchStartPos = useRef<{x: number, y: number, row: number, col: number} | null>(null);
  
  // 关键：防止重复触发的锁
  const isProcessingRef = useRef(false);
  // 记录上次播放音效的时间
  const lastSoundTimeRef = useRef(0);

  // 播放音效（使用 Web Audio API）
  const playSound = (type: 'drop' | 'clear' | 'combo' | 'gameOver') => {
    if (!soundEnabled) return;  // 所有音效都受开关控制
    
    // 100ms 内不重复播放
    const now = Date.now();
    if (now - lastSoundTimeRef.current < 100) {
      return;
    }
    lastSoundTimeRef.current = now;
    
    try {
      switch (type) {
        case 'drop': playDropSound(); break;
        case 'clear': playClearSound(); break;
        case 'combo': playComboSound(); break;
        case 'gameOver': playGameOverSound(); break;
      }
    } catch (e) {
      console.error('[音效] 播放失败:', e);
    }
  };

  // 切换音效
  const toggleSound = () => setSoundEnabled(prev => !prev);

  // 消除动画 + 碎片生成
  useEffect(() => {
    if (clearingCells.length > 0) {
      setAnimatingCells(new Set(clearingCells.map(c => `${c.row}-${c.col}`)));
      
      // 生成碎片 - 使用 clearingCells 中的颜色信息
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const cellSize = (rect.width - 16) / 10;
        
        const newFragments: Fragment[] = [];
        clearingCells.forEach(cell => {
          // 使用 cell.colorIndex 而不是从 board 读取
          const cellValue = cell.colorIndex;
          if (cellValue !== 0) {
            newFragments.push(...generateFragments(cell.row, cell.col, cellValue, cellSize));
          }
        });
        setFragments(newFragments);
      }
      
      // 清理
      const timer = setTimeout(() => {
        setAnimatingCells(new Set());
        setFragments([]);
      }, 800);
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
    if (isProcessingRef.current) return false;
    if (!selectedBlock) return false;
    
    const firstCell = getFirstBlockCell(selectedBlock.shape);
    const adjustedPos = { row: row - firstCell.row, col: col - firstCell.col };
    
    // 锁定
    isProcessingRef.current = true;
    
    const result = placeSelectedBlock(adjustedPos);
    
    if (result.success) {
      const clearedCount = result.clearedCells?.length || 0;
      
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
      }, 300);
      return true;
    }
    
    // 放置失败，立即解锁
    isProcessingRef.current = false;
    return false;
  };

  // PC 点击
  const handleClick = (row: number, col: number) => {
    tryPlaceBlock(row, col);
  };

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!selectedBlock || !boardRef.current) return;
    
    const touch = e.touches[0];
    const rect = boardRef.current.getBoundingClientRect();
    const cellSize = rect.width / 10;
    const col = Math.floor((touch.clientX - rect.left) / cellSize);
    const row = Math.floor((touch.clientY - rect.top) / cellSize);
    
    // 记录起始位置
    touchStartPos.current = { x: touch.clientX, y: touch.clientY, row, col };
    setHoverPos({ row, col });
  };

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
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

  // 触摸结束
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!selectedBlock || !hoverPos) return;
    
    // 判断是点击还是滑动
    const isTap = touchStartPos.current && 
      Math.abs((e.changedTouches[0].clientX) - touchStartPos.current.x) < 10 &&
      Math.abs((e.changedTouches[0].clientY) - touchStartPos.current.y) < 10;
    
    if (isTap) {
      // 点击：方块左上角对齐点击位置
      const { row, col } = hoverPos;
      tryPlaceBlock(row, col);
    } else {
      // 滑动：使用当前位置放置
      tryPlaceBlock(hoverPos.row, hoverPos.col);
    }
    
    setHoverPos(null);
    touchStartPos.current = null;
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
        <ScoreBoard 
          onSoundToggle={toggleSound} 
          soundEnabled={soundEnabled}
          onLeaderboardOpen={() => setShowLeaderboard(true)}
        />
        <CurrentScore />
        
        <div className="relative mb-4">
          <div ref={boardRef} 
            className="bg-black/30 rounded-2xl p-2 backdrop-blur-sm relative overflow-hidden"
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchMove={(e) => { e.preventDefault(); handleTouchMove(e); }} 
            onTouchEnd={handleTouchEnd}>
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
                      ${animating ? 'cell-clearing' : ''}`}
                  />
                );
              }))}
            </div>
            
            {/* 碎片容器 */}
            {fragments.length > 0 && (
              <div className="fragments-container">
                {fragments.map(fragment => (
                  <div
                    key={fragment.id}
                    className={`fragment fragment-${fragment.shape}`}
                    style={{
                      '--frag-x': `${fragment.x}px`,
                      '--frag-y': `${fragment.y}px`,
                      '--frag-color': fragment.color,
                      '--frag-brightness': fragment.brightness,
                      '--frag-angle': `${fragment.angle}deg`,
                      '--frag-distance': `${fragment.distance}px`,
                      '--frag-rotation': `${fragment.rotation}deg`,
                      '--frag-delay': `${fragment.delay}ms`,
                      '--frag-size': `${fragment.size}px`,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <BlockSelector />

        <button onClick={() => restartGame()}
          className="w-full mt-3 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-95 shadow-lg">
          重新开始
        </button>

        <div className="mt-3 h-6 text-center text-white/60 text-sm">{getHintText()}</div>
      </div>

      <GameOver isOpen={isGameOver} />
      <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
}
