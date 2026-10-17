export type LiquidChromePreset =
  | 'satin'
  | 'polished'
  | 'velvet'
  | 'mercury'
  | 'molten'
  | 'gold';

export interface LiquidChromeLook {
  /** Color of the metal. White is polished chrome, warmer tones give gold or copper. */
  color: string;
  /** How fast the chrome flows. 0 freezes it. */
  speed: number;
  /** How strongly the flow swirls and folds (0–2). */
  amplitude: number;
  /** How tightly the flow folds horizontally. */
  frequencyX: number;
  /** How tightly the flow folds vertically. */
  frequencyY: number;
  /** Layers of swirl, from 1 to 8. */
  detail: number;
  /** Width of the chrome ribbons (0.25–4). */
  thickness: number;
  /** How steeply the chrome rises from the surface. */
  depth: number;
  /** Softens the reflections, from a sharp mirror at 0 to a frosted sheen at 1. */
  roughness: number;
  /** Brightness of the reflections. */
  exposure: number;
}

export interface LiquidChromeProps extends Partial<LiquidChromeLook> {
  /** The cursor leaves a wake, clicks send ripples and the reflections follow the cursor. */
  interactive?: boolean;
  /** How visible the wake and ripples are. */
  rippleStrength?: number;
  /** Size of the wake and ripples (0.2–4). */
  rippleSize?: number;
  /** How much the reflections sway and turn toward the cursor. 0 keeps the light still. */
  tilt?: number;
  /** The chrome rises from the surface when it mounts. */
  intro?: boolean;
  /** Lights the chrome for light pages, with soft gray contours instead of a dark studio. */
  lightMode?: boolean;
  /** Highest pixel ratio the canvas renders at (0.5–3). */
  maxDevicePixelRatio?: number;
  /** Extra classes merged on the container. */
  class?: string;
}

export interface LiquidChromeSettings {
  tint: [number, number, number];
  speed: number;
  amplitude: number;
  frequency: [number, number];
  detail: number;
  thickness: number;
  depth: number;
  roughness: number;
  exposure: number;
  interactive: boolean;
  rippleStrength: number;
  rippleSize: number;
  tilt: number;
  light: boolean;
  maxRatio: number;
}

export interface LiquidChromeSpot {
  /** Pointer position relative to the container, 0–1 on each axis (top-left origin). */
  u: number;
  v: number;
  inside: boolean;
}

export interface LiquidChromeEngine {
  /** Draws one frame. Returns true while the loop must keep running. */
  frame: (now: number) => boolean;
  resize: (width: number, height: number) => void;
  move: (spot: LiquidChromeSpot) => void;
  press: (spot: LiquidChromeSpot) => void;
  leave: () => void;
  resetClock: () => void;
  destroy: () => void;
}

export interface LiquidChromeStroke {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  strength: number;
  radius: number;
}
