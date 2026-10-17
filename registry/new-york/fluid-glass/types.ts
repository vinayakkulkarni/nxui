import type { HTMLAttributes } from 'vue';

export type FluidGlassShape =
  | 'lens'
  | 'blob'
  | 'cube'
  | 'pill'
  | 'torus'
  | 'prism'
  | 'diamond';

export type FluidGlassInteraction = 'follow' | 'drag' | 'static';

export type FluidGlassFit = 'cover' | 'contain';

export type FluidGlassVec2 = [number, number];
export type FluidGlassVec3 = [number, number, number];
export type FluidGlassRgba = [number, number, number, number];
export type FluidGlassQuat = [number, number, number, number];
export type FluidGlassMat3 = [
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

export interface FluidGlassProps {
  /** Headline drawn behind the glass so the glass can bend it. Use \n for line breaks. */
  text?: string;
  /** Text colour. Defaults to the CSS colour of the container. */
  textColor?: string;
  /** Text font. Defaults to the font of the container. */
  fontFamily?: string;
  /** Text weight. */
  fontWeight?: number | string;
  /** Text size in px. By default it scales to fill the width. */
  fontSize?: number;
  /** Image or video behind the glass. Videos play muted on a loop. Cross-origin files need CORS. */
  src?: string;
  /** How the image or video fills the area. */
  fit?: FluidGlassFit;
  /** Colour behind the text and media. Transparent lets the page show through. */
  background?: string;
  /** Shape of the glass. Changing it melts the glass into the new shape. */
  shape?: FluidGlassShape;
  /** Shapes the glass cycles through when clicked. Defaults to all shapes. */
  shapes?: FluidGlassShape[];
  /** Diameter of the glass in px. It shrinks to fit small areas. */
  size?: number;
  /** How strongly the glass bends light, 0 to 2. */
  refraction?: number;
  /** Rainbow fringes at the edges, 0 to 1. */
  dispersion?: number;
  /** Highlights and reflections, 0 to 2. */
  reflection?: number;
  /** Frosted blur of what is behind the glass, 0 to 1. */
  frost?: number;
  /** Colour of the glass. */
  color?: string;
  /** How strongly the glass takes on its colour, 0 to 1. */
  tint?: number;
  /** Strength of the shadow and caustic below the glass, 0 to 1. */
  shadow?: number;
  /** How high the glass floats above the content. */
  elevation?: number;
  /** Follow the cursor, drag and throw, or stay in place. */
  interaction?: FluidGlassInteraction;
  /** How lazily the glass follows, 0 (snappy) to 1 (floaty). */
  smoothness?: number;
  /** Liquid stretch and wobble, 0 keeps it rigid. */
  wobble?: number;
  /** Idle rotation speed. Negative values spin the other way. */
  spin?: number;
  /** Drift gently around the resting place while idle. */
  idle?: boolean;
  /** Clicking the glass melts it into the next shape. */
  morphOnClick?: boolean;
  /** Resting place as fractions of width and height. */
  position?: [number, number];
  /** Pop into place on mount. */
  intro?: boolean;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  class?: HTMLAttributes['class'];
}

export interface FluidGlassSettings {
  text: string;
  textColor?: string;
  fontFamily?: string;
  fontWeight: number | string;
  fontSize?: number;
  src?: string;
  fit: FluidGlassFit;
  background: FluidGlassRgba;
  shape: FluidGlassShape;
  cycle: FluidGlassShape[];
  size: number;
  ior: number;
  dispersion: number;
  reflection: number;
  frost: number;
  color: FluidGlassRgba;
  tint: number;
  shadow: number;
  elevation: number;
  interaction: FluidGlassInteraction;
  smoothness: number;
  wobble: number;
  spin: number;
  idle: boolean;
  morphOnClick: boolean;
  position: FluidGlassVec2;
  intro: boolean;
  maxRatio: number;
}

export type FluidGlassUniforms = Record<string, WebGLUniformLocation | null>;

export interface FluidGlassProgram {
  program: WebGLProgram;
  fragment: WebGLShader | null;
  uniforms: FluidGlassUniforms | null;
  failed: boolean;
}

export interface FluidGlassEngineOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  handle: HTMLElement | null;
  getSettings: () => FluidGlassSettings;
  /** True on the first mount only, so the intro pop is not replayed after a context restore. */
  firstRun: boolean;
  reduced: boolean;
  onShapeChange: (shape: FluidGlassShape) => void;
}

export interface FluidGlassEngine {
  refresh: () => void;
  redrawText: () => void;
  resetText: () => void;
  setVisible: (visible: boolean) => void;
  setPageVisible: (visible: boolean) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  leave: () => void;
  destroy: () => void;
}
