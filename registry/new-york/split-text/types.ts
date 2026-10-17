export type SplitTextEffect =
  | 'rise'
  | 'fade'
  | 'blur'
  | 'flip'
  | 'pop'
  | 'skew'
  | 'wave';

export type SplitTextTrigger = 'view' | 'load' | 'hover' | 'click';

export type SplitTextHoverEffect = 'none' | 'lift' | 'wave';

export type SplitTextStaggerFrom =
  | 'start'
  | 'center'
  | 'end'
  | 'edges'
  | 'random';

/** `'chars'`, `'words'`, `'lines'`, or a combination like `'words, chars'`. */
export type SplitTextSplitType = string;

export type SplitTextTag =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span';

export type SplitTextEaseFn = (t: number) => number;

/**
 * Animatable values for each piece. `x`/`y` are px, rotations and skews
 * are degrees, `blur` is px.
 */
export interface SplitTextVars {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  skewX?: number;
  skewY?: number;
  blur?: number;
}

export interface SplitTextProps {
  text: string;
  tag?: SplitTextTag;
  /** Delay between pieces, in ms. */
  delay?: number;
  /** Duration of each piece, in seconds. */
  duration?: number;
  /** GSAP-style ease name (`'power3.out'`, `'back.out(2)'`, …) or a function. */
  ease?: string | SplitTextEaseFn;
  splitType?: SplitTextSplitType;
  /** Custom start values, replacing the effect. */
  from?: SplitTextVars;
  /** Custom end values, replacing the effect. */
  to?: SplitTextVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end';
  staggerFrom?: SplitTextStaggerFrom;
  mask?: boolean;
  effect?: SplitTextEffect;
  trigger?: SplitTextTrigger;
  loop?: boolean;
  /** Pause between loops, in seconds. */
  loopDelay?: number;
  hoverEffect?: SplitTextHoverEffect;
  color?: string;
  accentColor?: string;
  class?: string;
}

export interface SplitTextLook {
  from: SplitTextVars;
  to: SplitTextVars;
  ease: SplitTextEaseFn;
  /** CSS perspective (px) applied while the piece animates. */
  perspective?: number;
  origin?: string;
}

export interface SplitTextWord {
  key: string;
  text: string;
  chars: string[];
}

export type SplitTextPresetName = 'rise' | 'flip' | 'blur' | 'wave';

/** Look settings the demo presets switch between. */
export interface SplitTextPresetValues {
  effect: SplitTextEffect;
  splitType: SplitTextSplitType;
  ease: string;
  delay: number;
  duration: number;
  staggerFrom: SplitTextStaggerFrom;
  trigger: SplitTextTrigger;
  hoverEffect: SplitTextHoverEffect;
  loop: boolean;
  loopDelay: number;
  mask: boolean;
  color: string;
  accentColor: string;
}
