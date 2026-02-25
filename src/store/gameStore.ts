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
  // Actions
  selectBlock: (block: Block | null) => void;
  placeSelectedBlock: (pos: Position) => boolean;
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

      // Select a block
      selectBlock: (block) => {
        set({ selectedBlock: block });
      },

      // Place selected block
      placeSelectedBlock: (pos) => {
        const state = get();
        const { board, selectedBlock, currentBlocks, score, highScore } = state;

        if (!selectedBlock) return false;

        // Check if can place
        if (!canPlace(board, selectedBlock, pos)) return false;

        // Place block
        const colorIndex = COLOR_INDEX_MAP[selectedBlock.color];
        let newBoard = placeBlock(board, selectedBlock, pos, colorIndex);

        // Remove placed block from current blocks and immediately add a new one
        const newBlocks = currentBlocks
          .filter(b => b.id !== selectedBlock.id)
          .concat(generateRandomBlock()); // 立即补充一个新方块

        // Check for clears
        const clearResult = checkClear(newBoard);
        let newScore = score + clearResult.score;

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
        });

        return true;
      },

      // Restart game
      restartGame: () => {
        set({
          board: createEmptyBoard(),
          currentBlocks: generateBlocks(),
          score: 0,
          isGameOver: false,
          selectedBlock: null,
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
