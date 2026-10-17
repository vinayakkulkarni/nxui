export type PrismAnimationType =
  | 'rotate'
  | '3drotate'
  | 'rotate3d'
  | 'hover'
  | 'static';

export interface PrismOffset {
  x?: number;
  y?: number;
}

export interface PrismProps {
  /** Height of the prism from its base to its tip. */
  height?: number;
  /** Width of the prism at its base. */
  baseWidth?: number;
  /** Spin in place, tumble in 3D, turn only toward the cursor, or hold. */
  animationType?: PrismAnimationType;
  /** Brightness of the light. */
  glow?: number;
  /** Moves the prism in px, x to the right and y down. */
  offset?: PrismOffset;
  /** Film grain over the light, 0 to 1. */
  noise?: number;
  /** Size of the prism on screen. Larger values zoom in. */
  scale?: number;
  /** Rotates every color around the color wheel, in degrees. */
  hueShift?: number;
  /** How quickly the colors change through the light. */
  colorFrequency?: number;
  /** Custom colors cycled through the bands, up to 8. Empty = spectrum. */
  colors?: string[];
  /** Color intensity, 0 (grayscale) to 2. */
  saturation?: number;
  /** Speed of the rotation. 0 holds it still. */
  timeScale?: number;
  /** Tilts the prism toward the cursor in every animation mode. */
  interactive?: boolean;
  /** How far the prism turns toward the cursor. */
  hoverStrength?: number;
  /** How quickly the prism follows the cursor, 0.01 to 1. */
  inertia?: number;
  /** Fades the light in on mount. */
  intro?: boolean;
  /** Fraction of the screen resolution rendered, 0.25 to 1. */
  resolution?: number;
  /** Draws the light as colored ink for light backgrounds. */
  lightMode?: boolean;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export type PrismMode = 'rotate' | '3drotate' | 'hover' | 'static';

export interface PrismSettings {
  height: number;
  baseWidth: number;
  animationType: PrismMode;
  glow: number;
  offsetX: number;
  offsetY: number;
  noise: number;
  scale: number;
  hueShift: number;
  colorFrequency: number;
  colors: string[];
  saturation: number;
  timeScale: number;
  interactive: boolean;
  hoverStrength: number;
  inertia: number;
  intro: boolean;
  resolution: number;
  lightMode: boolean;
  dpr: number | undefined;
}

export interface PrismEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => PrismSettings;
  reduce: boolean;
  onRestored: () => void;
}

export interface PrismEngine {
  refresh: () => void;
  resize: () => void;
  pointerMove: (clientX: number, clientY: number) => void;
  pointerLeave: () => void;
  setVisible: (visible: boolean) => void;
  visibilityChanged: () => void;
  dispose: (loseContext: boolean) => void;
}

export interface PrismProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}
