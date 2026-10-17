export type MetaBallsVariant = 'solid' | 'outline' | 'contour';

export type MetaBallsMotion = 'orbit' | 'drift' | 'lava';

export interface MetaBallsProps {
  /** Color of the blobs. */
  color?: string;
  /** Color of the cursor blob. It blends into any blob it merges with. */
  cursorBallColor?: string;
  /** Speed of the motion. */
  speed?: number;
  /** The cursor blob follows the pointer and pushes the others aside. */
  enableMouseInteraction?: boolean;
  /** How quickly the cursor blob catches up with the pointer. Lower is smoother. */
  hoverSmoothness?: number;
  /** Size of the world shown in the view. Higher values zoom out. */
  animationSize?: number;
  /** Number of blobs, up to 50. */
  ballCount?: number;
  /** How far the blobs travel from the center. */
  clumpFactor?: number;
  /** Size of the cursor blob. */
  cursorBallSize?: number;
  /** Renders on a transparent background instead of black. */
  enableTransparency?: boolean;
  /** Filled blobs, a single outline, or an outline with contour rings. */
  variant?: MetaBallsVariant;
  /** Orbiting cluster, drifting across the area, or a lava lamp. */
  motion?: MetaBallsMotion;
  /** How far blobs reach toward each other before merging, 0 to 1. */
  gooeyness?: number;
  /** How strongly merged blobs cling together before snapping apart, 0 to 1. */
  stickiness?: number;
  /** How much blobs stretch in the direction they move, 0 to 1. */
  stretch?: number;
  /** How much blobs jiggle after stretching or being pushed, 0 to 1. */
  wobble?: number;
  /** Line width of the outline and contour variants, in px. */
  lineWidth?: number;
  /** Number of contour rings around the outline. */
  rings?: number;
  /** Clicking pulses the cursor blob and splashes the others outward. */
  clickBurst?: boolean;
  /** Starts as a single drop that buds into the blobs. */
  intro?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. Defaults to the device ratio. */
  dpr?: number;
  class?: string;
}

export interface MetaBallsSettings {
  color: string;
  cursorBallColor: string;
  speed: number;
  enableMouseInteraction: boolean;
  hoverSmoothness: number;
  animationSize: number;
  ballCount: number;
  clumpFactor: number;
  cursorBallSize: number;
  enableTransparency: boolean;
  variant: MetaBallsVariant;
  motion: MetaBallsMotion;
  gooeyness: number;
  stickiness: number;
  stretch: number;
  wobble: number;
  lineWidth: number;
  rings: number;
  clickBurst: boolean;
  paused: boolean;
  dpr: number | undefined;
}

export type Vec3Tuple = [number, number, number];

export interface Deformable {
  vx: number;
  vy: number;
  a: number;
  b: number;
  va: number;
  vb: number;
}

export interface Ball extends Deformable {
  start: number;
  rate: number;
  reach: number;
  toggle: number;
  radius: number;
  lane: number;
  rise: number;
  sway: number;
  delay: number;
  x: number;
  y: number;
  fx: number;
  fy: number;
  ax: number;
  ay: number;
  avx: number;
  avy: number;
}

export interface CursorBlob extends Deformable {
  x: number;
  y: number;
  pulse: number;
  pulseVelocity: number;
  ready: boolean;
}

export interface Presence {
  size: number;
  time: number;
}

export interface MetaBallsEngine {
  resize: () => void;
  setVisible: (visible: boolean) => void;
  move: (clientX: number, clientY: number) => void;
  leave: () => void;
  press: (clientX: number, clientY: number) => void;
  refresh: () => void;
  dispose: () => void;
}
