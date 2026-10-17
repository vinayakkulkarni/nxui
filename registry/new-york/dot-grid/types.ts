export type DotGridShape = 'circle' | 'square';

export interface DotGridProps {
  /** Size of each dot, in px. */
  dotSize?: number;
  /** Space between dots, in px. */
  gap?: number;
  /** Color of the dots at rest. Hex only. */
  baseColor?: string;
  /** Color the dots light up to while they move or sit near the cursor. Hex only. */
  activeColor?: string;
  /** Radius around the cursor that pushes the dots and lights them up, in px. */
  proximity?: number;
  /** How hard a moving cursor pushes the dots. */
  strength?: number;
  /** How much the dots overshoot and wobble as they settle, 0 to 1. */
  bounce?: number;
  /** How strongly each dot pulls on its neighbours. 0 keeps every dot independent. */
  tension?: number;
  /** Roughly how long the dots take to settle back into place, in seconds. */
  returnDuration?: number;
  /** How far a click shockwave travels, in px. */
  shockRadius?: number;
  /** How hard a click shockwave pushes the dots. */
  shockStrength?: number;
  /** How much the dots grow while they are lit. */
  swell?: number;
  /** How much moving dots stretch into short streaks along their motion. */
  stretch?: number;
  /** Soft halo around lit dots. */
  glow?: number;
  /** Shape of each dot. */
  shape?: DotGridShape;
  /** Fades the grid out toward the edges, 0 to 1. */
  fade?: number;
  /** Overall opacity of the grid. */
  opacity?: number;
  /** Pops the dots in from the center when the grid first appears. */
  intro?: boolean;
  /** Lets the cursor push the dots and light them up. */
  mouseInteraction?: boolean;
  /** Sends a shockwave out from each click. */
  clickShock?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface DotGridSettings {
  dotSize: number;
  gap: number;
  baseColor: string;
  activeColor: string;
  proximity: number;
  strength: number;
  bounce: number;
  tension: number;
  returnDuration: number;
  shockRadius: number;
  shockStrength: number;
  swell: number;
  stretch: number;
  glow: number;
  shape: DotGridShape;
  fade: number;
  opacity: number;
  intro: boolean;
  mouseInteraction: boolean;
  clickShock: boolean;
  paused: boolean;
  dpr: number | undefined;
}

export type DotGridRgb = [number, number, number];

export interface DotGridShock {
  x: number;
  y: number;
  start: number;
}

export interface DotGridEngineOptions {
  canvas: HTMLCanvasElement;
  getSettings: () => DotGridSettings;
  reduce: boolean;
}

export interface DotGridEngine {
  rebuild: () => void;
  refresh: () => void;
  resize: () => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerOut: (event: PointerEvent) => void;
  pointerLeave: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChanged: () => void;
  dispose: () => void;
}
