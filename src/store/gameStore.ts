import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Block, Position } from '../types/game';
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

interface GameStore extends GameState {
  // 消除动画相关
  clearingCells: { row: number; col: number }[];
  setClearingCells: (cells: { row: number; col: number }[]) => void;
  
  // Actions
  selectBlock: (block: Block | null) => void;
  placeSelectedBlock: (pos: Position) => { success: boolean; clearedCells?: { row: number; col: number }[] };
  restartGame: () => void;
  
  // Getters
  canPlaceBlock: (block: Block, pos: Position) => boolean;
  isBlockPlaceable: (block: Block) => boolean;
}

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

      // Set clearing cells for animation
      setClearingCells: (cells) => {
        set({ clearingCells: cells });
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

        // Collect cleared cells for animation
        const clearedCells: { row: number; col: number }[] = [];
        
        // Add cells from cleared rows
        for (const row of clearResult.rows) {
          for (let col = 0; col < 10; col++) {
            clearedCells.push({ row, col });
          }
        }
        
        // Add cells from cleared columns
        for (const col of clearResult.cols) {
          for (let row = 0; row < 10; row++) {
            // Avoid duplicates if both row and column are cleared
            if (!clearResult.rows.includes(row)) {
              clearedCells.push({ row, col });
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
      }),
    }
  )
);
