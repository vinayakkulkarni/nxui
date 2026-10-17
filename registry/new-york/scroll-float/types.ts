export type ScrollFloatEffect = 'float' | 'flip' | 'scatter' | 'blur' | 'wave';
export type ScrollFloatSplit = 'chars' | 'words';
export type ScrollFloatDirection = 'up' | 'down';
export type ScrollFloatOrder = 'start' | 'end' | 'center' | 'edges' | 'random';
export type ScrollFloatEaseFn = (t: number) => number;

export interface ScrollFloatProps {
  /** Text to animate. Leave it out to animate the default slot as one piece. */
  text?: string;
  /** Element that scrolls. `undefined` uses the window; `null` waits for the element. */
  scrollContainer?: HTMLElement | null;
  /** Extra classes on the text. */
  textClass?: string;
  /** How the pieces arrive. */
  effect?: ScrollFloatEffect;
  /** Animate each letter or each word. */
  splitBy?: ScrollFloatSplit;
  /** Come in from below (`up`) or from above (`down`). */
  direction?: ScrollFloatDirection;
  /** Which pieces go first. */
  order?: ScrollFloatOrder;
  /** Color the pieces start in before settling to the text color. */
  fromColor?: string;
  /** Length of each piece's animation, relative to the stagger. */
  animationDuration?: number;
  /** GSAP-style ease, such as 'back.inOut(2)' or 'elastic.out(1, 0.45)'. */
  ease?: string;
  /** Scroll position where the animation starts (ScrollTrigger syntax). */
  scrollStart?: string;
  /** Scroll position where the animation ends (ScrollTrigger syntax). */
  scrollEnd?: string;
  /** Delay between pieces, relative to the duration. */
  stagger?: number;
  /** How far the pieces travel, 120 being the default reach. */
  distance?: number;
  /** How tall the pieces are stretched while they float in. */
  stretch?: number;
  /** Seconds the animation takes to catch up with the scroll. */
  smoothing?: number;
  class?: string;
}

export type ScrollFloatToken =
  | { kind: 'space'; value: string }
  | { kind: 'word'; value: string; chars: string[] };
