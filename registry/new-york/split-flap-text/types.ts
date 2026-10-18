export type SplitFlapAlign = 'left' | 'center' | 'right';

export type SplitFlapOrder = 'left' | 'right' | 'center' | 'random';

export type SplitFlapTileStyle = 'board' | 'minimal';

export type SplitFlapCharset =
  | 'alpha'
  | 'alphanumeric'
  | 'numeric'
  | (string & {});

export interface SplitFlapTextProps {
  /** Phrases to cycle through like a departure board. */
  words?: string[];
  /** Optional single phrase. Takes precedence over `words`; changing it flips the board. */
  text?: string;
  /** Duration, in seconds, of each individual flap turn. */
  flipDuration?: number;
  /** Delay, in seconds, between each tile starting its cascade. */
  stagger?: number;
  /** Hold time, in milliseconds, before cycling to the next phrase. */
  cycleDelay?: number;
  /** Characters used for the intermediate flip glyphs. */
  charset?: SplitFlapCharset;
  /** Number of intermediate glyphs each changed tile flips through. */
  flipsPerChar?: number;
  /** Base color of each mechanical tile. */
  tileColor?: string;
  /** Glyph color. `currentColor` follows the surrounding text. */
  textColor?: string;
  /** Corner radius for each tile. Numbers are pixels. */
  tileRadius?: number | string;
  /** Space between adjacent tiles. Numbers are pixels. */
  gap?: number | string;
  /** Tile type size. Numbers are pixels. */
  fontSize?: number | string;
  /** Whether the phrase list repeats after the final phrase. */
  loop?: boolean;
  /** Fixed tile count used to keep the board width stable. */
  padTo?: number;
  /** Where phrases shorter than the board sit on it. */
  align?: SplitFlapAlign;
  /** Start blank and flip to the first phrase on mount. */
  intro?: boolean;
  /** Strength (0–1) of the light sheen that sweeps down each falling flap. */
  glare?: number;
  /** How physical the board feels, from 0 (flat) to 1. */
  depth?: number;
  /** Where the cascade starts. */
  order?: SplitFlapOrder;
  /** Mechanical tiles, or bare characters split by a hinge line. */
  tileStyle?: SplitFlapTileStyle;
  class?: string;
}

export interface SplitFlapTile {
  current: string;
  next: string;
  flipping: boolean;
  tick: number;
}

export interface SplitFlapPlan {
  index: number;
  from: string;
  target: string;
  sequence: string[];
  start: number;
  step: number;
  done: boolean;
}

export interface SplitFlapTileUpdate {
  index: number;
  current: string;
  next: string;
  done: boolean;
}

export interface SplitFlapTiming {
  flipMs: number;
  staggerMs: number;
  holdMs: number;
  flips: number;
  glyphs: string;
  order: SplitFlapOrder;
}
