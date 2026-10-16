export type GradientAsciiShape = 'horizon' | 'pinch' | 'rise' | 'eclipse';

export type GradientAsciiClickEffect = 'wave' | 'burst' | 'none';

export interface GradientAsciiProps {
  /** Two to eight colors for the light, from the edge of the shadow to the brightest or farthest point. */
  colors?: string[];
  /** Horizon, pinch, rise or eclipse. */
  shape?: GradientAsciiShape;
  /** Characters from dimmest to brightest. */
  characters?: string;
  /** Height of each character cell in px. */
  cellSize?: number;
  /** Share of cells that show a character, from 0 to 1. */
  density?: number;
  /** How strongly the characters stand out from the gradient. */
  glyphOpacity?: number;
  /** Soft glow around the characters. */
  glow?: number;
  /** Share of characters drawn out of focus, from 0 to 1. */
  depthOfField?: number;
  /** How often characters swap with their neighbors in brightness. */
  flicker?: number;
  /** How soft the edges of the shape are. */
  softness?: number;
  /** Size of the shape, from 0.4 to 2.5. */
  scale?: number;
  /** How much the light wavers as it drifts. */
  flow?: number;
  /** Speed of the drift. 0 holds the shape still. */
  speed?: number;
  /** Opacity of the gradient behind the characters. */
  gradientOpacity?: number;
  /** Strength of the film grain, from 0 to 0.4. */
  grain?: number;
  /** Picks a different drift and a different pattern of characters. */
  variation?: number;
  /** Scrambles the characters under the cursor as it moves. */
  mouseInteraction?: boolean;
  /** Size of the scrambled area around the cursor, relative to the container height. */
  scrambleRadius?: number;
  /** Wave sends a ring of scrambled characters out, burst scrambles a patch. */
  clickEffect?: GradientAsciiClickEffect;
  /** Fades the light in from its source while the characters decode. */
  intro?: boolean;
  /** Draws the gradient as a wash on light backgrounds. */
  lightMode?: boolean;
  /** Font used for the characters. */
  fontFamily?: string;
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  class?: string;
}

export interface GradientAsciiSettings {
  colors: string[];
  shape: number;
  characters: string;
  cellSize: number;
  density: number;
  glyphOpacity: number;
  glow: number;
  depthOfField: number;
  flicker: number;
  softness: number;
  scale: number;
  flow: number;
  speed: number;
  gradientOpacity: number;
  grain: number;
  variation: number;
  mouseInteraction: boolean;
  scrambleRadius: number;
  clickEffect: number;
  intro: boolean;
  lightMode: boolean;
  fontFamily: string;
  dpr: number | undefined;
}

export interface GradientAsciiProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface GradientAsciiTarget {
  textures: (WebGLTexture | null)[];
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
}

export interface GradientAsciiAtlas {
  texture: WebGLTexture | null;
  count: number;
  grid: [number, number];
}

export interface GradientAsciiPoint {
  x: number;
  y: number;
  age: number;
}

export interface GradientAsciiEngine {
  wake: () => void;
  destroy: () => void;
}
