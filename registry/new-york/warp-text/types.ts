import type { Texture } from 'ogl';

export type WarpTextLens = 'bulge' | 'pinch' | 'swirl';

export interface WarpTextProps {
  /** The headline text rendered into the WebGL texture. Use `\n` for line breaks. */
  text?: string;
  /** Text fill color before the glass pass. `currentColor` follows the surrounding text color. */
  color?: string;
  /** Amount of ambient glass distortion at rest. */
  warpStrength?: number;
  /** Size of the moving distortion cells. */
  warpScale?: number;
  /** Speed of the ambient undulation. */
  speed?: number;
  /** Radius of the cursor lensing area. */
  pointerInfluence?: number;
  /** Strength of cursor-driven bending and magnification. */
  pointerStrength?: number;
  /** Subtle RGB channel split for the glass edge. */
  refraction?: number;
  /** Color fringing inside the lens and click ripples. 0 is off, 1 is strong. */
  chromatic?: number;
  /** Adds a soft ripple to the pointer lens. */
  ripple?: boolean;
  /** Clicking sends a shockwave ring through the text. */
  clickRipple?: boolean;
  /** How strongly the lens keeps wandering over the text while the cursor is away (0–1). */
  idleDrift?: number;
  /** How the cursor bends the text: magnify, pull inward or twist. */
  lens?: WarpTextLens;
  /** Fades the text in from a strong warp that settles. */
  intro?: boolean;
  /** Raster font size. Numbers are pixels. The text shrinks to fit the container. */
  fontSize?: string | number;
  /** Font weight used when rasterising the text texture. */
  fontWeight?: string | number;
  /** Font family used when rasterising the text texture. */
  fontFamily?: string;
  /** Tracking applied while drawing the text into the texture. */
  letterSpacing?: string | number;
  /** Line height for multi-line text. */
  lineHeight?: string | number;
  class?: string;
}

export interface WarpTextRasterSettings {
  text: string;
  color: string;
  fontSize: string | number;
  fontWeight: string | number;
  fontFamily: string;
  letterSpacing: string | number;
  lineHeight: string | number;
}

export interface WarpTextRaster {
  canvas: HTMLCanvasElement;
  ink: string;
}

export interface WarpTextUniform<T> {
  value: T;
}

export interface WarpTextUniforms {
  [key: string]: WarpTextUniform<unknown>;
  uTextTexture: WarpTextUniform<Texture>;
  uResolution: WarpTextUniform<Float32Array>;
  uPointer: WarpTextUniform<Float32Array>;
  uPointerActive: WarpTextUniform<number>;
  uTime: WarpTextUniform<number>;
  uWarpStrength: WarpTextUniform<number>;
  uWarpScale: WarpTextUniform<number>;
  uSpeed: WarpTextUniform<number>;
  uPointerInfluence: WarpTextUniform<number>;
  uPointerStrength: WarpTextUniform<number>;
  uRefraction: WarpTextUniform<number>;
  uChromatic: WarpTextUniform<number>;
  uRipple: WarpTextUniform<number>;
  uMotion: WarpTextUniform<number>;
  uLens: WarpTextUniform<number>;
  uIntro: WarpTextUniform<number>;
  uReveal: WarpTextUniform<number>;
  uBackdrop: WarpTextUniform<number>;
  uClicks: WarpTextUniform<number[][]>;
}
