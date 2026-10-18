import type Matter from 'matter-js';

export type FallingTextTrigger = 'auto' | 'hover' | 'click' | 'scroll';
export type FallingTextVariant = 'text' | 'tiles';
export type FallingTextSplit = 'words' | 'letters';
export type FallingTextOrder = 'random' | 'sequence' | 'center' | 'together';
export type FallingTextTheme = 'dark' | 'light';

export interface FallingTextProps {
  /** The text that falls apart. */
  text?: string;
  /** Words starting with any of these strings get the accent color (or accent tile). */
  highlightWords?: string[];
  /** Extra class added to highlighted pieces. */
  highlightClass?: string;
  /** What starts the fall. `scroll` starts it when the text scrolls into view. */
  trigger?: FallingTextTrigger;
  /** Plain falling text, or words on tiles that stack like blocks. */
  variant?: FallingTextVariant;
  /** Whether whole words or single letters fall. */
  split?: FallingTextSplit;
  /** Strength of gravity. Negative values fall upward. */
  gravity?: number;
  /** How much pieces bounce when they land (0–1). */
  bounciness?: number;
  /** Spin and sideways push each piece gets as it drops (0–1). */
  scatter?: number;
  /** Delay between pieces dropping, in seconds. */
  stagger?: number;
  /** Which pieces drop first. Falling pieces knock loose the ones they land on. */
  order?: FallingTextOrder;
  /** Lets people pick up, drag and throw pieces. */
  draggable?: boolean;
  /** How tightly a dragged piece follows the pointer (0–1). */
  mouseConstraintStiffness?: number;
  /** How hard a quick swipe knocks fallen pieces around. 0 turns it off. */
  cursorPush?: number;
  /** Seconds after the pile settles (pointer away) before the text flies back. 0 keeps it fallen. */
  restoreDelay?: number;
  /** Font size of the text. */
  fontSize?: string;
  /** Color of highlighted words, or of their tiles in the tiles variant. */
  accentColor?: string;
  /** Color theme of the tiles. */
  theme?: FallingTextTheme;
  /** Background of the area the text falls into. */
  backgroundColor?: string;
  /** Outlines each piece to show its physics shape. */
  wireframes?: boolean;
  class?: string;
}

export interface FallingTextGroup {
  word: string;
  highlighted: boolean;
}

export interface FallingTextPiece {
  element: HTMLElement;
  body: Matter.Body;
  w: number;
  h: number;
  x0: number;
  y0: number;
  px: number;
  py: number;
  pa: number;
  dx: number;
  dy: number;
  da: number;
  at: number;
  released: boolean;
  knocked: boolean;
  pushed: number;
}

export interface FallingTextDrag {
  constraint: Matter.Constraint;
  id: number;
}

export type FallingTextPresetName =
  | 'classic'
  | 'tiles'
  | 'letters'
  | 'domino'
  | 'bouncy';

export interface FallingTextPresetValues {
  text: string;
  highlightWords: string[];
  variant: FallingTextVariant;
  split: FallingTextSplit;
  order: FallingTextOrder;
  gravity: number;
  bounciness: number;
  scatter: number;
  stagger: number;
  cursorPush: number;
  mouseConstraintStiffness: number;
  restoreDelay: number;
  /** Font size in rem. */
  size: number;
}
