import type { StyleValue } from 'vue';

export interface ScrollBasedVelocityMapping {
  /** Scroll velocity breakpoints in px/s. */
  input: number[];
  /** Movement multipliers matching each input breakpoint. */
  output: number[];
}

export interface ScrollBasedVelocityProps {
  /** One row per entry. Odd rows run in the opposite direction. */
  texts?: string[];
  /** Base speed in px/s. The sign is flipped for odd rows. */
  velocity?: number;
  /** Scroll container to track. Defaults to the window. */
  scrollContainer?: HTMLElement | null;
  /** Classes applied to each repeated text copy. */
  textClass?: string;
  /** Damping of the scroll-velocity spring. */
  damping?: number;
  /** Stiffness of the scroll-velocity spring. */
  stiffness?: number;
  /** Copies rendered per row for a seamless loop. */
  numCopies?: number;
  /** Maps scroll velocity to a movement multiplier. */
  velocityMapping?: ScrollBasedVelocityMapping;
  /** Extra classes on each row's clipping container. */
  parallaxClass?: string;
  /** Extra classes on each row's moving track. */
  scrollerClass?: string;
  /** Inline styles on each row's clipping container. */
  parallaxStyle?: StyleValue;
  /** Inline styles on each row's moving track. */
  scrollerStyle?: StyleValue;
  /** Shown between the repeated copies, like a dot or a slash. */
  separator?: string;
  /** Glide the rows to a stop while the pointer is over them. */
  pauseOnHover?: boolean;
  /** Softly fade the rows out at the left and right edges. */
  fadeEdges?: boolean;
  /** Lean into the motion at full speed, in degrees. */
  skewWithVelocity?: number;
  /** Stretch taller at full speed, as a fraction of the height. */
  scaleWithVelocity?: number;
  /** Draw every other row as outlined text. */
  outlineAlternate?: boolean;
  /** Extra space between copies in px. */
  gap?: number;
  /** Text size. Numbers are px. */
  fontSize?: number | string;
  /** Text weight. */
  fontWeight?: number | string;
  /** Text color. Inherits when left out. */
  color?: string;
  /** Grab a row to scrub it, then throw it with inertia. */
  draggable?: boolean;
  class?: string;
}

export interface ScrollBasedVelocityRowProps {
  text: string;
  baseVelocity: number;
  scrollContainer?: HTMLElement | null;
  textClass?: string;
  damping: number;
  stiffness: number;
  numCopies: number;
  velocityMapping: ScrollBasedVelocityMapping;
  parallaxClass?: string;
  scrollerClass?: string;
  parallaxStyle?: StyleValue;
  scrollerStyle?: StyleValue;
  separator: string;
  pauseOnHover: boolean;
  hovered: boolean;
  skewWithVelocity: number;
  scaleWithVelocity: number;
  outline: boolean;
  gap: number;
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
  draggable: boolean;
}
