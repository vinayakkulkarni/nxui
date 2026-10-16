export type ClickSparkShape = 'line' | 'streak' | 'dot' | 'star';
export type ClickSparkEasing =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring';
export type ClickSparkLayer = 'front' | 'back';

export interface ClickSparkProps {
  /** Spark color. Pass a list to mix colors through each burst. */
  sparkColor?: string | string[];
  /** Length of each spark in px. */
  sparkSize?: number;
  /** How far the sparks travel from the click in px. */
  sparkRadius?: number;
  /** Number of sparks in each burst (1–64). */
  sparkCount?: number;
  /** Thickness of each spark in px. */
  sparkWidth?: number;
  /** Burst length in ms. */
  duration?: number;
  easing?: ClickSparkEasing;
  /** Multiplies how far the sparks travel. */
  extraScale?: number;
  shape?: ClickSparkShape;
  /** Varies angle, length and speed of each spark, 0–1. */
  randomness?: number;
  /** Pulls sparks down as they fly, 0–2. */
  gravity?: number;
  /** Angle the sparks fan across in degrees. 360 is a full circle. */
  spread?: number;
  /** Where a partial spread points in degrees. 0 is up, 90 is right. */
  direction?: number;
  /** Soft light around each spark, 0–1. */
  glow?: number;
  /** Thin ring expanding from the click. */
  ring?: boolean;
  /** Draw over the content, or behind it so bursts spill around buttons. */
  layer?: ClickSparkLayer;
  /** Stops new bursts. */
  disabled?: boolean;
  class?: string;
}

export interface ClickSparkExposed {
  /** Fire a burst from code. x/y in px from the top-left; centers without them. */
  spark: (x?: number, y?: number) => void;
}

export type ClickSparkEase = (t: number) => number;

export interface ClickSparkSettings {
  colors: string[];
  size: number;
  radius: number;
  count: number;
  width: number;
  duration: number;
  ease: ClickSparkEase;
  spring: boolean;
  shape: ClickSparkShape;
  randomness: number;
  gravity: number;
  spread: number;
  direction: number;
  glow: number;
  ring: boolean;
  disabled: boolean;
}

export interface Spark {
  angle: number;
  reach: number;
  scale: number;
  life: number;
  spin: number;
  color: string;
  clear: string;
  glow: number;
}

export interface ClickSparkBurst {
  x: number;
  y: number;
  start: number;
  sparks: Spark[];
  settings: ClickSparkSettings;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  ratio: number;
  left: number;
  top: number;
}
