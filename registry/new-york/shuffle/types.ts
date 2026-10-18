export type ShuffleEffect = 'slide' | 'flip' | 'blur';

export type ShuffleDirection = 'left' | 'right' | 'up' | 'down';

export type ShuffleAnimationMode = 'evenodd' | 'sequence' | 'center' | 'random';

export type ShuffleTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';

export type ShuffleEaseFn = (t: number) => number;

export type ShuffleEase = string | ShuffleEaseFn;

export interface ShuffleProps {
  /** The text content to shuffle. */
  text: string;
  /** How each letter cycles: a sliding reel, a 3D card flip, or a spin in place with motion blur. */
  effect?: ShuffleEffect;
  /** Direction letters travel. Flip turns around the matching axis. */
  shuffleDirection?: ShuffleDirection;
  /** Duration (s) of each letter's shuffle. */
  duration?: number;
  /** Longest random delay (s) before a letter starts, when animationMode is 'random'. */
  maxDelay?: number;
  /** GSAP-style ease name ('power3.out', 'back.out(2)', 'expo.out') or an easing function. */
  ease?: ShuffleEase;
  /** Portion of the element that must be visible before the shuffle starts. */
  threshold?: number;
  /** IntersectionObserver root margin applied to the viewport (px, %). */
  rootMargin?: string;
  /** HTML tag rendered for the text container. */
  tag?: ShuffleTag;
  /** Text alignment applied via inline style. */
  textAlign?: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end';
  /** How many interim glyphs each letter passes through before it lands. */
  shuffleTimes?: number;
  /** Order the letters start in. */
  animationMode?: ShuffleAnimationMode;
  /** Repeat the shuffle indefinitely. */
  loop?: boolean;
  /** Delay (s) between loop repeats. */
  loopDelay?: number;
  /** Delay (s) between letters starting, in every mode except 'random'. */
  stagger?: number;
  /** Characters used for interim glyphs; empty repeats the letter itself. */
  scrambleCharset?: string;
  /** Color each letter starts in, fading to its final color as it lands. */
  colorFrom?: string;
  /** Color each letter fades to as it lands, and keeps afterwards. */
  colorTo?: string;
  /** Auto-run only the first time the text scrolls into view. */
  triggerOnce?: boolean;
  /** Show the text right away, without shuffling, when the user prefers reduced motion. */
  respectReducedMotion?: boolean;
  /** Replay the shuffle on hover after it completes. */
  triggerOnHover?: boolean;
  /** With hover replay on, only letters within this distance (px) of the cursor reshuffle. 0 replays everything. */
  hoverRadius?: number;
  /** Smear the sliding reel along its direction while it moves fast. Slide effect only. */
  motionBlur?: boolean;
  /** Text color. Follows the surrounding text color when unset. */
  color?: string;
  /** Color of the interim glyphs while letters are in flight. */
  accentColor?: string;
  class?: string;
}

export interface ShuffleEngineOptions {
  text: string;
  effect: ShuffleEffect;
  shuffleDirection: ShuffleDirection;
  duration: number;
  maxDelay: number;
  ease: ShuffleEaseFn;
  shuffleTimes: number;
  animationMode: ShuffleAnimationMode;
  loop: boolean;
  loopDelay: number;
  stagger: number;
  scrambleCharset: string;
  colorFrom: string;
  colorTo: string;
  triggerOnHover: boolean;
  hoverRadius: number;
  motionBlur: boolean;
  accentColor: string;
  onComplete: () => void;
}

export interface ShuffleEngine {
  /** Splits the text, plays the shuffle and arms hover replay. */
  start: () => void;
  /** Kills every tween and listener and restores the plain text. */
  destroy: () => void;
}

export interface ShuffleTween {
  offset: number;
  duration: number;
  ease: ShuffleEaseFn;
  update: (progress: number) => void;
  onStart?: () => void;
  onComplete?: () => void;
  started: boolean;
  done: boolean;
}

export interface ShuffleTimelineOptions {
  repeat?: boolean;
  repeatDelay?: number;
  delay?: number;
  onRepeat?: () => void;
  onComplete?: () => void;
}
