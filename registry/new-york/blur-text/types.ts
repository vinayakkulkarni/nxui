import type { Easing } from 'motion-v';

export type BlurTextEffect = 'blur' | 'zoom' | 'tilt' | 'focus' | 'drift';

export type BlurTextAnimateBy = 'words' | 'letters';

export type BlurTextDirection = 'top' | 'bottom' | 'left' | 'right';

export type BlurTextStaggerFrom = 'start' | 'center' | 'end' | 'random';

export type BlurTextTrigger = 'view' | 'load' | 'hover' | 'click';

export type BlurTextPhase = 'from' | 'in' | 'rest' | 'out';

/** One keyframe: motion values such as `filter`, `opacity`, `x`, `y`, `scale`. */
export type BlurTextSnapshot = Record<string, string | number>;

export type BlurTextKeyframes = Record<string, (string | number | undefined)[]>;

export type BlurTextEasing = Easing | Easing[];

export interface BlurTextFx {
  from: BlurTextSnapshot;
  steps: BlurTextSnapshot[];
  exit: BlurTextSnapshot;
  times: number[];
  fade: Easing;
  /** Spring bounce for movement keys; `null` tweens every key with `fade`. */
  bounce: number | null;
  settle: number;
  origin?: { originX: number; originY: number };
  exitEase: Easing;
}

export interface BlurTextPiece {
  word: number;
  content: string;
  key: string;
}

export interface BlurTextProps {
  /** The text content to animate. */
  text?: string;
  /** Delay between each word or letter, in ms. */
  delay?: number;
  /** Whether each word or each letter comes into focus on its own. */
  animateBy?: BlurTextAnimateBy;
  /** Side the words or letters move in from. */
  direction?: BlurTextDirection;
  /** Intersection threshold for the view trigger. */
  threshold?: number;
  /** Root margin for the intersection observer. */
  rootMargin?: string;
  /** Custom starting keyframe. Replaces effect, blur, distance and direction. */
  animationFrom?: BlurTextSnapshot;
  /** Custom keyframes to animate through after animationFrom. */
  animationTo?: BlurTextSnapshot[];
  /** Easing applied to every step. Each effect uses its own curves when unset. */
  easing?: BlurTextEasing;
  /** The time taken for each step of the animation, in seconds. */
  stepDuration?: number;
  /** How blurred each piece starts, in px. */
  blur?: number;
  /** How far each piece travels into place, in px. */
  distance?: number;
  /** How each piece comes in. */
  effect?: BlurTextEffect;
  /** Where the stagger starts. */
  staggerFrom?: BlurTextStaggerFrom;
  /** When the text comes in. */
  trigger?: BlurTextTrigger;
  /** Keep replaying: hold, blur back out and come in again. */
  loop?: boolean;
  /** How long the text stays sharp before blurring out again when looping, in seconds. */
  loopDelay?: number;
  /** Color of the text. */
  color?: string;
  /** Color each piece starts in before it settles on the text color. */
  fromColor?: string;
  /** Hovering a word keeps it sharp while the others soften and dim. */
  focusOnHover?: boolean;
  /** Classes merged onto the paragraph. */
  class?: string;
}
