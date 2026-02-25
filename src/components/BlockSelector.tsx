import { useGameStore } from '../store/gameStore';
import { Block } from './Block';

export function BlockSelector() {
  const currentBlocks = useGameStore((state) => state.currentBlocks);
  const isGameOver = useGameStore((state) => state.isGameOver);

  return (
    <div className="bg-black/20 rounded-2xl p-4">
      <div className="text-center text-white/50 text-xs uppercase tracking-wider mb-4">
        待选方块
      </div>
      <div className="flex justify-center gap-4 flex-wrap">
        {currentBlocks.map((block) => (
          <Block 
            key={block.id} 
            block={block} 
            disabled={isGameOver}
          />
        ))}
      </div>
    </div>
  );
}
