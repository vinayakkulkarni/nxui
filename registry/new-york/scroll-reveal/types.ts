export type ScrollRevealSplit = 'words' | 'chars' | 'lines';
export type ScrollRevealEffect = 'fade' | 'rise' | 'flip' | 'scale';
export type ScrollRevealMode = 'scrub' | 'enter';

export interface ScrollRevealProps {
  /** Text to reveal. Leave it out to reveal the default slot as one piece. */
  text?: string;
  /** Element that scrolls. `undefined` uses the window; `null` waits for the element. */
  scrollContainer?: HTMLElement | null;
  /** Start each piece out of focus. */
  enableBlur?: boolean;
  /** Opacity of the pieces before they are revealed. */
  baseOpacity?: number;
  /** Tilt of the whole block before it levels out, in degrees. */
  baseRotation?: number;
  /** Starting blur in px. */
  blurStrength?: number;
  /** How far below its place each piece starts, in px. */
  baseOffset?: number;
  /** Spacing between pieces. In enter mode it is in seconds. */
  stagger?: number;
  /** Seconds the reveal takes to catch up with the scroll. */
  smoothing?: number;
  /** What each step of the reveal is. */
  splitBy?: ScrollRevealSplit;
  /** How each piece appears. */
  effect?: ScrollRevealEffect;
  /** Scrub with the scroll, or play once on entering view. */
  mode?: ScrollRevealMode;
  /** Seconds each piece takes to appear in enter mode. */
  duration?: number;
  /** Accent each piece lights up to while it is revealed. Empty for none. */
  highlightColor?: string;
  /** Extra classes on the text. */
  textClass?: string;
  /** Where the block finishes leveling out in scrub mode (ScrollTrigger syntax). */
  rotationEnd?: string;
  /** Where every piece is fully revealed in scrub mode (ScrollTrigger syntax). */
  wordAnimationEnd?: string;
  class?: string;
}

export type ScrollRevealToken =
  | { kind: 'space'; value: string }
  | { kind: 'word'; value: string; chars: string[] };
