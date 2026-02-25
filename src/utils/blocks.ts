import type { Block, BlockColor } from '../types/game';

// 方块颜色
const COLORS: BlockColor[] = ['cyan', 'purple', 'orange', 'green', 'pink', 'yellow'];

// 所有方块形状
const BLOCK_SHAPES: number[][][] = [
  // 单格
  [[1]],
  
  // 双格横向
  [[1, 1]],
  // 双格纵向
  [[1], [1]],
  
  // 三格横向
  [[1, 1, 1]],
  // 三格纵向
  [[1], [1], [1]],
  // 三格L形
  [[1, 0], [1, 1]],
  [[1, 1], [0, 1]],
  [[1, 1], [1, 0]],
  [[0, 1], [1, 1]],
  
  // 四格横向
  [[1, 1, 1, 1]],
  // 四格纵向
  [[1], [1], [1], [1]],
  // 四格正方形
  [[1, 1], [1, 1]],
  // 四格T形
  [[1, 1, 1], [0, 1, 0]],
  [[0, 1], [1, 1], [0, 1]],
  // 四格L形
  [[1, 0], [1, 0], [1, 1]],
  [[1, 1, 1], [1, 0, 0]],
  
  // 五格
  [[1, 1, 1, 1, 1]],
  [[1], [1], [1], [1], [1]],
  [[1, 1, 1], [0, 1, 0], [0, 1, 0]],
  [[1, 0], [1, 0], [1, 0], [1, 1]],
];

// 生成随机ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// 生成随机方块
export function generateRandomBlock(): Block {
  const shapeIndex = Math.floor(Math.random() * BLOCK_SHAPES.length);
  const colorIndex = Math.floor(Math.random() * COLORS.length);
  
  return {
    id: generateId(),
    shape: BLOCK_SHAPES[shapeIndex],
    color: COLORS[colorIndex],
  };
}

// 生成3个随机方块
export function generateBlocks(): Block[] {
  return [
    generateRandomBlock(),
    generateRandomBlock(),
    generateRandomBlock(),
  ];
}

// 获取颜色类名
export function getColorClass(color: BlockColor): string {
  const colorMap: Record<BlockColor, string> = {
    cyan: 'bg-gradient-to-br from-block-cyan to-cyan-600',
    purple: 'bg-gradient-to-br from-block-purple to-purple-700',
    orange: 'bg-gradient-to-br from-block-orange to-orange-600',
    green: 'bg-gradient-to-br from-block-green to-green-600',
    pink: 'bg-gradient-to-br from-block-pink to-pink-600',
    yellow: 'bg-gradient-to-br from-block-yellow to-yellow-600',
  };
  return colorMap[color];
}
