// 方块定义
export interface Block {
  id: string;
  shape: number[][];  // 1表示有方块，0表示空
  color: BlockColor;
}

// 方块颜色
export type BlockColor = 'cyan' | 'purple' | 'orange' | 'green' | 'pink' | 'yellow';

// 位置
export interface Position {
  row: number;
  col: number;
}

// 游戏状态
export interface GameState {
  board: number[][];       // 10x10 棋盘，0=空，1-6=颜色索引
  currentBlocks: Block[];  // 当前3个方块
  score: number;           // 当前分数
  highScore: number;       // 最高分
  isGameOver: boolean;     // 游戏是否结束
  selectedBlock: Block | null; // 当前选中的方块
}

// 消除结果
export interface ClearResult {
  rows: number[];
  cols: number[];
  score: number;
}
