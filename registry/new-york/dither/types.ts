/** Any CSS color, or a linear RGB triplet from 0 to 1. */
export type DitherColor = string | [number, number, number];

export type DitherMode =
  | 'bayer'
  | 'bayer4'
  | 'bayer2'
  | 'halftone'
  | 'lines'
  | 'crosshatch'
  | 'noise'
  | 'none';

export type DitherMouseEffect = 'erase' | 'reveal' | 'ripple';

export interface DitherProps {
  /** Speed of the wave animation. */
  waveSpeed?: number;
  /** How much finer each layer of detail gets. */
  waveFrequency?: number;
  /** How strongly the finer layers of detail show. */
  waveAmplitude?: number;
  /** Color of the waves. */
  waveColor?: DitherColor;
  /** Color behind the waves. `'transparent'` dithers over your own background. */
  backgroundColor?: DitherColor;
  /** Number of shades per color channel. */
  colorNum?: number;
  /** Size of each dither pixel, in px. */
  pixelSize?: number;
  /** Freezes the wave animation. */
  disableAnimation?: boolean;
  /** Lets the cursor interact with the waves. */
  enableMouseInteraction?: boolean;
  /** Radius of the cursor effect. */
  mouseRadius?: number;
  /** Pattern used to dither the shades. */
  ditherMode?: DitherMode;
  /** Two to eight colors from dark to light. Replaces wave and background colors. */
  palette?: string[];
  /** Size of the wave pattern. */
  scale?: number;
  /** Contrast of the waves before dithering. */
  contrast?: number;
  /** Brightens or darkens the waves. */
  brightness?: number;
  /** Erase darkens under the cursor, reveal lights up and ripple bends the waves. */
  mouseEffect?: DitherMouseEffect;
  /** Strength of the cursor effect. */
  mouseStrength?: number;
  /** How long the cursor leaves a fading trail, from 0 to 1. */
  trail?: number;
  /** Clicking sends a ring through the waves. */
  clickRipple?: boolean;
  /** Resolves from chunky pixels to full detail on mount. */
  intro?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface DitherSettings {
  waveSpeed: number;
  waveFrequency: number;
  waveAmplitude: number;
  waveColor: DitherColor;
  backgroundColor: DitherColor;
  colorNum: number;
  pixelSize: number;
  disableAnimation: boolean;
  enableMouseInteraction: boolean;
  mouseRadius: number;
  mode: number;
  palette: string[];
  scale: number;
  contrast: number;
  brightness: number;
  effect: number;
  mouseStrength: number;
  trail: number;
  clickRipple: boolean;
  intro: boolean;
  dpr?: number;
}

export interface DitherTrailPoint {
  x: number;
  y: number;
  weight: number;
}

export interface DitherRipple {
  x: number;
  y: number;
  age: number;
}

export interface DitherProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface DitherEngineOptions {
  getSettings: () => DitherSettings;
  reducedMotion: boolean;
}

export interface DitherEngine {
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  leave: () => void;
  setVisible: (visible: boolean) => void;
  pageVisibilityChanged: () => void;
  resize: () => void;
  refresh: () => void;
  dispose: () => void;
}
