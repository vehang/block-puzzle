import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Block, Position, ClearingCell } from '../types/game';
import type { ScoreRecord } from '../types/leaderboard';
import { generateBlocks, generateRandomBlock } from '../utils/blocks';
import {
  createEmptyBoard,
  canPlace,
  placeBlock,
  checkClear,
  performClear,
  isGameOver,
  COLOR_INDEX_MAP,
} from '../utils/game';

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化日期
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

interface GameStore extends GameState {
  // 排行榜
  leaderboard: ScoreRecord[];
  
  // 消除动画相关
  clearingCells: ClearingCell[];
  setClearingCells: (cells: ClearingCell[]) => void;
  
  // Actions
  selectBlock: (block: Block | null) => void;
  placeSelectedBlock: (pos: Position) => { success: boolean; clearedCells?: { row: number; col: number }[] };
  restartGame: () => void;
  addScoreToLeaderboard: (score: number) => void;
  
  // Getters
  canPlaceBlock: (block: Block, pos: Position) => boolean;
  isBlockPlaceable: (block: Block) => boolean;
}

const MAX_LEADERBOARD_RECORDS = 10;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      board: createEmptyBoard(),
      currentBlocks: generateBlocks(),
      score: 0,
      highScore: 0,
      isGameOver: false,
      selectedBlock: null,
      clearingCells: [],
      leaderboard: [],

      // Set clearing cells for animation
      setClearingCells: (cells) => {
        set({ clearingCells: cells });
      },

      // Add score to leaderboard
      addScoreToLeaderboard: (score) => {
        const { leaderboard } = get();
        if (score === 0) return; // 不记录0分
        
        const newRecord: ScoreRecord = {
          id: generateId(),
          score,
          date: formatDate(new Date()),
          rank: 0, // Will be calculated below
        };
        
        // Add new record and sort by score (descending)
        let newLeaderboard = [...leaderboard, newRecord]
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_LEADERBOARD_RECORDS)
          .map((record, index) => ({
            ...record,
            rank: index + 1,
          }));
        
        set({ leaderboard: newLeaderboard });
      },

      // Select a block
      selectBlock: (block) => {
        set({ selectedBlock: block });
      },

      // Place selected block
      placeSelectedBlock: (pos) => {
        const state = get();
        const { board, selectedBlock, currentBlocks, score, highScore } = state;

        if (!selectedBlock) return { success: false };

        // Check if can place
        if (!canPlace(board, selectedBlock, pos)) return { success: false };

        // Place block
        const colorIndex = COLOR_INDEX_MAP[selectedBlock.color];
        let newBoard = placeBlock(board, selectedBlock, pos, colorIndex);

        // Remove placed block from current blocks and immediately add a new one
        const newBlocks = currentBlocks
          .filter(b => b.id !== selectedBlock.id)
          .concat(generateRandomBlock());

        // Check for clears
        const clearResult = checkClear(newBoard);
        let newScore = score + clearResult.score;

        // Collect cleared cells with color information (BEFORE clearing!)
        const clearedCells: ClearingCell[] = [];
        
        // Add cells from cleared rows
        for (const row of clearResult.rows) {
          for (let col = 0; col < 10; col++) {
            const colorIndex = newBoard[row][col];
            if (colorIndex !== 0) {
              clearedCells.push({ row, col, colorIndex });
            }
          }
        }
        
        // Add cells from cleared columns
        for (const col of clearResult.cols) {
          for (let row = 0; row < 10; row++) {
            // Avoid duplicates if both row and column are cleared
            if (!clearResult.rows.includes(row)) {
              const colorIndex = newBoard[row][col];
              if (colorIndex !== 0) {
                clearedCells.push({ row, col, colorIndex });
              }
            }
          }
        }

        // Perform clears
        if (clearResult.rows.length > 0 || clearResult.cols.length > 0) {
          newBoard = performClear(newBoard, clearResult.rows, clearResult.cols);
        }

        // Check game over
        const gameOver = isGameOver(newBoard, newBlocks);

        // Update high score
        const newHighScore = Math.max(highScore, newScore);

        set({
          board: newBoard,
          currentBlocks: newBlocks,
          score: newScore,
          highScore: newHighScore,
          isGameOver: gameOver,
          selectedBlock: null,
          clearingCells: clearedCells,
        });

        // If game over, add score to leaderboard
        if (gameOver && newScore > 0) {
          setTimeout(() => {
            get().addScoreToLeaderboard(newScore);
          }, 500);
        }

        return { success: true, clearedCells };
      },

      // Restart game
      restartGame: () => {
        set({
          board: createEmptyBoard(),
          currentBlocks: generateBlocks(),
          score: 0,
          isGameOver: false,
          selectedBlock: null,
          clearingCells: [],
        });
      },

      // Check if block can be placed at position
      canPlaceBlock: (block, pos) => {
        return canPlace(get().board, block, pos);
      },

      // Check if block is placeable anywhere
      isBlockPlaceable: (block) => {
        const board = get().board;
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
            if (canPlace(board, block, { row, col })) {
              return true;
            }
          }
        }
        return false;
      },
    }),
    {
      name: 'block-puzzle-storage',
      partialize: (state) => ({
        highScore: state.highScore,
        leaderboard: state.leaderboard,
      }),
    }
  )
);
