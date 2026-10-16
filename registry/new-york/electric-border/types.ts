export type ElectricBorderTheme = 'dark' | 'light';

export type ElectricBorderRgb = [number, number, number];

export interface ElectricBorderProps {
  /** Color of the current. The strands burn whiter at their core. */
  color?: string;
  /** Color of the glow around the strands. Defaults to `color`. */
  glowColor?: string;
  /** How fast the current crackles and moves. */
  speed?: number;
  /** How jagged the strands are, from 0 to 2. */
  chaos?: number;
  /** How far the strands wander from the edge, from 0 to 2. */
  spread?: number;
  /** Thickness of the strands, in px. */
  thickness?: number;
  /** Number of strands running along the edge, from 1 to 6. */
  strands?: number;
  /** Strength of the glow around the border. */
  glow?: number;
  /** Overall brightness of the current. */
  intensity?: number;
  /** How often sparks leap off the border. 0 turns them off. */
  arcs?: number;
  /** How much the current flickers, from 0 to 1. */
  flicker?: number;
  /** Corner radius of the border, in px. Match it to your content. */
  borderRadius?: number;
  /** Moves the border outward from the content edge, in px. Negative values move it inward. */
  offset?: number;
  /** Powers the border on or off. Turning it on sends the current racing around the edge again. */
  active?: boolean;
  /** The current races around the edge from the top when the border mounts. */
  intro?: boolean;
  /** The current surges near the cursor and clicks send a jolt around the edge. */
  interactive?: boolean;
  /** Size of the area around the cursor where the current surges, in px. */
  cursorRadius?: number;
  /** Glowing light for dark pages, or crisp ink with a white core for light ones. */
  theme?: ElectricBorderTheme;
  class?: string;
}

export interface ElectricBorderPath {
  hx: number;
  hy: number;
  r: number;
  vr: number;
  ax: number;
  ay: number;
  quarter: number;
  perimeter: number;
}

export interface ElectricBorderPoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
}

export interface ElectricBorderSpark {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  bow: number;
  seed: number;
  born: number;
  life: number;
}

export interface ElectricBorderPulse {
  s: number;
  born: number;
}
