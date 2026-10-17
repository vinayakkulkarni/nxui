import type { BlockPaletteKind, BlockPaletteKindStyle } from './types';

export const BLOCK_KINDS: Record<BlockPaletteKind, BlockPaletteKindStyle> = {
  group: {
    icon: 'lucide:square-dashed',
    tone: 'text-muted-foreground',
  },
  chart: {
    icon: 'lucide:chart-no-axes-column',
    tone: 'text-green-600 dark:text-green-400',
  },
  slice: {
    icon: 'lucide:box',
    tone: 'text-blue-600 dark:text-blue-400',
  },
  parameter: {
    icon: 'lucide:cuboid',
    tone: 'text-yellow-600 dark:text-yellow-400',
  },
  markdown: {
    icon: 'simple-icons:markdown',
    tone: 'text-pink-500 dark:text-pink-300',
  },
};

/** Bar heights (px) and emphasis for the mini chart preview. */
export const CHART_BARS: readonly { height: number; bright: boolean }[] = [
  { height: 6, bright: false },
  { height: 12, bright: true },
  { height: 9, bright: false },
  { height: 15, bright: true },
  { height: 11, bright: true },
  { height: 20, bright: true },
  { height: 14, bright: true },
];
