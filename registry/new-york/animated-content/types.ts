export type AnimatedContentDirection = 'vertical' | 'horizontal';

export type AnimatedContentWipe =
  | 'none'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'center';

export type AnimatedContentStaggerFrom =
  | 'start'
  | 'end'
  | 'center'
  | 'edges'
  | 'random';

export type AnimatedContentTrigger = 'scroll' | 'mount';

export type AnimatedContentEaseFn = (t: number) => number;

export interface AnimatedContentProps {
  /** Scroll container that drives the animation, as a selector or an element. Defaults to the page. */
  container?: string | HTMLElement | null;
  /** How far the content travels into place, in px. */
  distance?: number;
  /** Axis the content travels along. */
  direction?: AnimatedContentDirection;
  /** Comes in from the other side: from above or from the left. */
  reverse?: boolean;
  /** Length of the animation, in seconds. */
  duration?: number;
  /** GSAP-style ease, such as 'expo.out', 'back.out(1.6)' or 'elastic.out(1, 0.5)'. */
  ease?: string;
  /** Opacity the content starts from. */
  initialOpacity?: number;
  /** Fades the content in. Off keeps it fully opaque while it moves. */
  animateOpacity?: boolean;
  /** Scale the content starts from. */
  scale?: number;
  /** Blur the content starts from, in px. */
  blur?: number;
  /** Rotation the content starts from, in degrees. */
  rotate?: number;
  /** Tips the content back in 3D, in degrees, so it flips up into place. */
  tilt?: number;
  /** Reveals the content behind a soft moving edge. */
  wipe?: AnimatedContentWipe;
  /** How far into the viewport the top of the content must be before it animates, 0 to 1. */
  threshold?: number;
  /** Wait before the animation starts, in seconds. */
  delay?: number;
  /** Animates each direct child in turn, this many seconds apart. */
  stagger?: number;
  /** Which child goes first when staggering. */
  staggerFrom?: AnimatedContentStaggerFrom;
  /** Animate when the content scrolls into view, or right away. */
  trigger?: AnimatedContentTrigger;
  /** Plays once. Off replays on every scroll in and reverses on scroll out. */
  once?: boolean;
  /** Ties the animation to the scroll position. A number smooths it, in seconds. */
  scrub?: boolean | number;
  /** Hides the content again this many seconds after it appears. 0 keeps it shown. */
  disappearAfter?: number;
  /** Length of the hide animation, in seconds. */
  disappearDuration?: number;
  /** GSAP-style ease of the hide animation. */
  disappearEase?: string;
  /** Extra classes for the wrapper. */
  class?: string;
}

export type AnimatedContentState = {
  offset: number;
  scale: number;
  opacity: number;
  blur: number;
  rotate: number;
  tilt: number;
  wipe: number;
};

export interface AnimatedContentPhase {
  from: AnimatedContentState;
  to: AnimatedContentState;
  /** Per-target start offsets, in seconds. */
  starts: number[];
  duration: number;
  ease: AnimatedContentEaseFn;
  total: number;
}
