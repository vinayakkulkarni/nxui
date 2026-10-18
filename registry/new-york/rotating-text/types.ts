import type { Transition, VariantType } from 'motion-v';

export type RotatingTextEffect = 'slide' | 'flip' | 'blur' | 'scale' | 'drop';

export type RotatingTextDirection = 'up' | 'down';

export type RotatingTextStaggerFrom =
  | 'first'
  | 'last'
  | 'center'
  | 'random'
  | number;

/** `characters`, `words`, `lines`, or any separator string. */
export type RotatingTextSplitBy = 'characters' | 'words' | 'lines' | string;

export interface RotatingTextPreset {
  initial: VariantType;
  animate: VariantType;
  exit: VariantType;
  transition: Transition;
  /** Separate timing for leaving letters; the enter transition is used when absent. */
  exitTransition?: Transition;
}

export interface RotatingTextElement {
  characters: string[];
  needsSpace: boolean;
}

export interface RotatingTextProps {
  texts: string[];
  effect?: RotatingTextEffect;
  direction?: RotatingTextDirection;
  /** Puts the text on a colored block that resizes to fit each word. */
  highlight?: boolean;
  highlightColor?: string;
  /** Custom enter state; overrides the effect preset. */
  initial?: VariantType;
  /** Custom rest state; overrides the effect preset. */
  animate?: VariantType;
  /** Custom leave state; overrides the effect preset. */
  exit?: VariantType;
  /** Custom per-letter transition; overrides the effect preset. */
  transition?: Transition;
  animatePresenceMode?: 'wait' | 'sync' | 'popLayout';
  animatePresenceInitial?: boolean;
  /** ms between texts. */
  rotationInterval?: number;
  /** Seconds between letters. */
  staggerDuration?: number;
  staggerFrom?: RotatingTextStaggerFrom;
  loop?: boolean;
  auto?: boolean;
  pauseOnHover?: boolean;
  /** Blur in px during the swap; the blur effect defaults to 10. */
  blur?: number;
  splitBy?: RotatingTextSplitBy;
  /** Classes for each word wrapper. */
  splitLevelClass?: string;
  /** Classes for each letter. */
  elementLevelClass?: string;
  class?: string;
}

export interface RotatingTextExpose {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}
