import type { Block, Position, ClearResult } from '../types/game';

// 检查是否可以放置方块
export function canPlace(
  board: number[][],
  block: Block,
  pos: Position
): boolean {
  const { shape } = block;
  const { row, col } = pos;

  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j] === 1) {
        const newRow = row + i;
        const newCol = col + j;

        // 越界检查
        if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10) {
          return false;
        }

        // 占用检查
        if (board[newRow][newCol] !== 0) {
          return false;
        }
      }
    }
  }

  return true;
}

// 放置方块到棋盘
export function placeBlock(
  board: number[][],
  block: Block,
  pos: Position,
  colorIndex: number
): number[][] {
  const newBoard = board.map(row => [...row]);
  const { shape } = block;
  const { row: startRow, col: startCol } = pos;

  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j] === 1) {
        newBoard[startRow + i][startCol + j] = colorIndex;
      }
    }
  }

  return newBoard;
}

// 检查消除
export function checkClear(board: number[][]): ClearResult {
  const rows: number[] = [];
  const cols: number[] = [];

  // 检查行
  for (let i = 0; i < 10; i++) {
    if (board[i].every(cell => cell !== 0)) {
      rows.push(i);
    }
  }

  // 检查列
  for (let j = 0; j < 10; j++) {
    if (board.every(row => row[j] !== 0)) {
      cols.push(j);
    }
  }

  // 计算分数
  const clearedCount = rows.length + cols.length;
  const score = clearedCount * 10;

  return { rows, cols, score };
}

// 执行消除
export function performClear(
  board: number[][],
  rows: number[],
  cols: number[]
): number[][] {
  const newBoard = board.map(row => [...row]);

  // 清除行
  for (const row of rows) {
    for (let j = 0; j < 10; j++) {
      newBoard[row][j] = 0;
    }
  }

  // 清除列
  for (const col of cols) {
    for (let i = 0; i < 10; i++) {
      newBoard[i][col] = 0;
    }
  }

  return newBoard;
}

// 检查游戏是否结束
export function isGameOver(board: number[][], blocks: Block[]): boolean {
  for (const block of blocks) {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (canPlace(board, block, { row, col })) {
          return false; // 还有地方可以放
        }
      }
    }
  }
  return true; // 没有任何地方可以放
}

// 创建空棋盘
export function createEmptyBoard(): number[][] {
  return Array(10).fill(null).map(() => Array(10).fill(0));
}

// 颜色索引映射
export const COLOR_MAP: Record<number, string> = {
  0: '',
  1: 'cyan',
  2: 'purple',
  3: 'orange',
  4: 'green',
  5: 'pink',
  6: 'yellow',
};

export const COLOR_INDEX_MAP: Record<string, number> = {
  cyan: 1,
  purple: 2,
  orange: 3,
  green: 4,
  pink: 5,
  yellow: 6,
};
