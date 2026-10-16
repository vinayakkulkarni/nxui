export type TextLoopShape = 'wave' | 'circle' | 'infinity' | 'arch' | 'line';

export type TextLoopDirection = 'forward' | 'reverse';

export interface TextLoopProps {
  /** The phrase repeated along the curve. */
  text?: string;
  /** Built-in curve the text flows along. */
  shape?: TextLoopShape;
  /** Custom SVG path data in a 1200x520 viewBox. Overrides `shape`. */
  path?: string;
  /** Travel speed along the path, in viewBox units per second. */
  speed?: number;
  /** Direction the text scrolls around the curve. */
  direction?: TextLoopDirection;
  /** Glyph placed between each repetition. */
  separator?: string;
  /** Amplitude of the wave, or the radius of the closed shapes. */
  curviness?: number;
  /** Rotates the whole loop, in degrees. */
  tilt?: number;
  /** Font size of the looping text, in px. */
  fontSize?: number;
  /** Font weight of the looping text. */
  fontWeight?: number;
  /** Extra tracking between letters, in px. */
  letterSpacing?: number;
  /** Renders the phrase in uppercase. */
  uppercase?: boolean;
  /** Text fill. Defaults to white on the ribbon, `currentColor` without it. */
  color?: string;
  /** Draws a solid band behind the text. */
  ribbon?: boolean;
  /** Color of the band behind the text. */
  ribbonColor?: string;
  /** Thickness of the band behind the text. */
  ribbonWidth?: number;
  /** Fades the loop toward the left and right edges (0–1). */
  edgeFade?: number;
  /** Eases the loop to a stop while hovered. */
  pauseOnHover?: boolean;
  /** Adds a second band crossing the first and running the other way. */
  cross?: boolean;
  /** Color of the crossing band (or its text without a ribbon). */
  crossColor?: string;
  /** Angle between the two bands, in degrees. */
  crossAngle?: number;
  /** Drag to scrub, throw to fling. Spins on a circle. */
  draggable?: boolean;
  /** How strongly page scrolling pushes the loop. 0 turns it off. */
  scrollBoost?: number;
  /** Draws letters as outlines instead of solid fills. */
  outline?: boolean;
  /** Stroke width of the outlined letters. */
  outlineWidth?: number;
  /** Additional classes on the root element. */
  class?: string;
}

export interface TextLoopFadeStop {
  offset: number;
  opacity: number;
}

export interface TextLoopMetrics {
  length: number;
  reps: number;
  crossLength: number;
  crossReps: number;
}

export interface TextLoopPaint {
  fill: string;
  'fill-opacity'?: number;
  stroke?: string;
  'stroke-opacity'?: number;
  'stroke-width'?: number;
  'stroke-linejoin'?: 'round';
}

/** A tiny time-based tween replacing `gsap.to(hover, { scale })`. */
export interface TextLoopScaleTween {
  from: number;
  to: number;
  start: number;
  duration: number;
  ease: (t: number) => number;
}
