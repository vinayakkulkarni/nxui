import type { SHADERS } from './splash-cursor-shaders';

export type SplashCursorQuality = 'low' | 'medium' | 'high';

export type SplashCursorTheme = 'dark' | 'light';

export interface SplashCursorProps {
  /** Palette the ink cycles through when `rainbow` is off. */
  colors?: string[];
  /** Cycles through the full spectrum instead of the palette. */
  rainbow?: boolean;
  /** How fast the colors shift while you move. 0 keeps one color per stroke. */
  colorSpeed?: number;
  /** How much ink each movement leaves behind. */
  intensity?: number;
  /** Width of the stroke and the splash. */
  size?: number;
  /** How hard the cursor pushes the fluid. */
  force?: number;
  /** Amount of curling eddies in the flow. */
  swirl?: number;
  /** How long the ink lingers before it fades. */
  trail?: number;
  /** How long the fluid keeps moving after the cursor stops. */
  momentum?: number;
  /** Depth shading on the ripples, 0 to 1. */
  shading?: number;
  /** Soft bloom around the brightest ink, 0 to 1. */
  glow?: number;
  /** Simulation detail. */
  quality?: SplashCursorQuality;
  /** Bursts a splash where you click or tap. */
  clickSplash?: boolean;
  /** Plays a short stroke across the screen on mount. */
  intro?: boolean;
  /** Fills the parent element instead of the viewport and only reacts inside it. */
  contained?: boolean;
  /** Glowing ink for dark backgrounds or absorbing ink for light ones. */
  theme?: SplashCursorTheme;
  /** Stacking order of the effect over your content. */
  zIndex?: number;
  class?: string;
}

export type RGB = [number, number, number];

export interface SplashSettings {
  palette: RGB[];
  rainbow: boolean;
  colorSpeed: number;
  intensity: number;
  size: number;
  force: number;
  swirl: number;
  trail: number;
  momentum: number;
  shading: number;
  glow: number;
  quality: SplashCursorQuality;
  clickSplash: boolean;
  contained: boolean;
  light: boolean;
}

export interface QualityLevel {
  sim: number;
  dye: number;
  iterations: number;
}

export type ShaderName = keyof typeof SHADERS;

export type Uniforms = Record<string, WebGLUniformLocation | null>;

export interface ProgramInfo {
  program: WebGLProgram;
  uniforms: Uniforms;
}

export interface TextureFormat {
  internal: number;
  format: number;
}

export interface RenderTarget {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelX: number;
  texelY: number;
  attach: (unit: number) => number;
}

export interface DoubleTarget {
  read: RenderTarget;
  write: RenderTarget;
  width: number;
  height: number;
  texelX: number;
  texelY: number;
  swap: () => void;
}

export interface FluidPointer {
  x: number;
  y: number;
  px: number;
  py: number;
  ready: boolean;
  moved: boolean;
  offset: number;
}

export interface FluidPoint {
  x: number;
  y: number;
}

export interface SplashFluid {
  track: (id: string, clientX: number, clientY: number) => void;
  press: (clientX: number, clientY: number) => void;
  release: (id: string) => void;
  leave: () => void;
  dispose: () => void;
}
