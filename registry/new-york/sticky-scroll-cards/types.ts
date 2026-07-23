import type { MotionValue } from 'motion-v';

export interface StickyScrollCardItem {
  title: string;
  src: string;
}

export interface StickyScrollCardsProps {
  cards?: StickyScrollCardItem[];
  hint?: string;
  class?: string;
}

export interface StickyScrollCardProps {
  i: number;
  title: string;
  src: string;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}
