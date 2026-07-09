export interface DitheredLogoProps {
  /** Image or SVG source used to generate the dithered particle field. */
  imageSrc: string;
  /** Maximum sampled image dimension before dithering. */
  gridSize?: number;
  /** Relative scale of the generated particle logo inside the canvas. */
  scale?: number;
  /** Multiplier for each rendered particle size. */
  dotScale?: number;
  /** Invert the generated dithered mask. */
  invert?: boolean;
  /** Rounded mask radius used when invert mode is enabled. */
  cornerRadius?: number;
  /** Brightness threshold for error-diffusion dithering. */
  threshold?: number;
  /** Contrast adjustment applied before dithering. */
  contrast?: number;
  /** Gamma correction applied before dithering. */
  gamma?: number;
  /** Image blur amount applied before sampling the grayscale grid. */
  blur?: number;
  /** Strength of the Floyd-Steinberg error diffusion. */
  diffusionStrength?: number;
  /** Alternate dither scan direction on every row. */
  serpentine?: boolean;
  /** Particle color; `currentColor` resolves from the canvas element. */
  particleColor?: string;
  class?: string;
}

export interface DitheredGrayscaleResult {
  grayscale: Uint8Array;
  alpha: Uint8Array;
  width: number;
  height: number;
}

export interface DitheredDitherConfig {
  threshold: number;
  serpentine: boolean;
  diffusionStrength: number;
}

export interface DitheredParticleSystem {
  count: number;
  baseX: Float32Array;
  baseY: Float32Array;
  offsetX: Float32Array;
  offsetY: Float32Array;
  brightness: Float32Array;
  tint: Float32Array;
  size: number;
}

export interface DitheredRipple {
  x: number;
  y: number;
  start: number;
}
