export type MagicRingsMotion = 'pulse' | 'ripple' | 'breathe';

export type MagicRingsTheme = 'dark' | 'light';

export interface MagicRingsProps {
  /** Color of the innermost ring. */
  color?: string;
  /** Color of the outermost ring. The rings in between blend from one to the other. */
  colorTwo?: string;
  /** Number of rings, from 1 to 12. */
  ringCount?: number;
  /** A wave that lights the rings one by one, rings flowing outward, or all rings breathing. */
  motion?: MagicRingsMotion;
  /** Animation speed. 0 freezes the rings. */
  speed?: number;
  /** Thickness of the rings in px. Rings taper toward the top and bottom. */
  lineThickness?: number;
  /** Size and strength of the glow around the rings. */
  glow?: number;
  /** Radius of the innermost ring, as a share of the smaller side of the container. */
  baseRadius?: number;
  /** Space between neighboring rings. */
  radiusStep?: number;
  /** How far each ring drifts outward while it glows. */
  expansion?: number;
  /** How quickly outer rings shorten into side arcs. 1 keeps every ring the same length. */
  taper?: number;
  /** Rotates the whole pattern, in degrees. */
  rotation?: number;
  /** Spins the arcs around the center, neighbors turning in opposite directions. */
  spin?: number;
  /** Leans the rings back in 3D, in degrees. */
  tilt?: number;
  /** Splits each ring into rainbow fringes, from 0 to 1. */
  dispersion?: number;
  /** Film grain over the glow, from 0 to 1. */
  grain?: number;
  /** Overall opacity, from 0 to 1. */
  opacity?: number;
  /** The rings drift toward the cursor. */
  followMouse?: boolean;
  /** How far the rings drift when followMouse is on. */
  mouseInfluence?: number;
  /** How much the rings swell on hover. */
  hoverScale?: number;
  /** How much the rings brighten and thicken near the cursor. */
  hoverIntensity?: number;
  /** How much the rings shift and lean with the cursor. */
  parallax?: number;
  /** Clicking sends a bright ring racing outward. */
  clickBurst?: boolean;
  /** The rings open from the sides one by one when they mount. */
  intro?: boolean;
  /** Glowing light for dark pages, or crisp ink with a soft halo for light ones. */
  theme?: MagicRingsTheme;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  class?: string;
}

export type MagicRingsRgb = [number, number, number];

export type MagicRingsVec3 = [number, number, number];

export type MagicRingsMat3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface MagicRingsSettings {
  color: MagicRingsRgb;
  colorTwo: MagicRingsRgb;
  ringCount: number;
  motion: MagicRingsMotion;
  speed: number;
  lineThickness: number;
  glow: number;
  baseRadius: number;
  radiusStep: number;
  expansion: number;
  taper: number;
  rotation: number;
  spin: number;
  tilt: number;
  dispersion: number;
  grain: number;
  opacity: number;
  followMouse: boolean;
  mouseInfluence: number;
  hoverScale: number;
  hoverIntensity: number;
  parallax: number;
  clickBurst: boolean;
  intro: boolean;
  light: boolean;
  maxRatio: number;
}

export interface MagicRingsPointer {
  clientX: number;
  clientY: number;
  pointerType: string;
}

export interface MagicRingsUniforms {
  [name: string]: WebGLUniformLocation | undefined;
}

export interface MagicRingsProgram {
  program: WebGLProgram;
  uniforms: MagicRingsUniforms;
}

export interface MagicRingsRingState {
  radius: number;
  life: number;
  virtual: number;
  mix: number;
  opening: number;
}

export interface MagicRingsBurst {
  start: number;
  radius: number;
}

export interface MagicRingsEngine {
  resize: () => void;
  wake: () => void;
  pointerMove: (event: MagicRingsPointer) => void;
  pointerDown: (event: MagicRingsPointer) => void;
  pointerUp: (event: MagicRingsPointer) => void;
  leave: () => void;
  setVisible: (value: boolean) => void;
  setPageVisible: (value: boolean) => void;
  loseContext: () => void;
  destroy: () => void;
}

export type MagicRingsShaderName = 'glow' | 'compose' | 'line';
