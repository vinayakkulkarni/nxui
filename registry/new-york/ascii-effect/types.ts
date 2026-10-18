export type AsciiEffectVariant = 'image' | 'flow' | 'glitch';

export type AsciiEffectDither = 'none' | 'floyd-steinberg' | 'bayer';

export type AsciiEffectFit = 'cover' | 'contain' | 'stretch';

export type AsciiEffectColorMode = 'gradient' | 'source';

export interface AsciiEffectProps {
  /** Image URL rendered as ASCII characters. */
  imageSrc: string;
  /** Accessible label for the canvas. */
  alt?: string;
  /** Visual effect variation. */
  variant?: AsciiEffectVariant;
  /** Characters ordered from darkest to brightest. */
  chars?: string;
  /** Character height in pixels. */
  fontSize?: number;
  /** Font stack used to draw the characters. */
  fontFamily?: string;
  /** Canvas font weight. */
  fontWeight?: number | string;
  /** Character row height multiplier. */
  lineHeight?: number;
  /** Horizontal character-cell spacing multiplier. */
  characterSpacing?: number;
  /** Multiplier applied to sampled image luminance. */
  brightnessBoost?: number;
  /** Contrast applied before character selection. */
  contrast?: number;
  /** Dark-pixel cutoff used to keep the background clean. */
  threshold?: number;
  /** Number of luminance steps. */
  posterize?: number;
  /** Dithering algorithm used to preserve photographic detail. */
  dither?: AsciiEffectDither;
  /** Amount of error diffusion or ordered dithering. */
  ditherStrength?: number;
  /** Flow cycles per second for the flow variant. */
  flowSpeed?: number;
  /** Flow direction in degrees. */
  flowDirection?: number;
  /** Directional displacement in pixels. */
  flowStrength?: number;
  /** Size of the flowing wave field. */
  flowFrequency?: number;
  /** Radius of the pointer ripple in pixels. */
  mouseRadius?: number;
  /** Pointer ripple displacement in pixels. */
  mouseStrength?: number;
  /** Speed of the pointer ripple. */
  mouseWaveSpeed?: number;
  /** Image zoom inside the ASCII field. */
  scale?: number;
  /** How the source image fits the canvas. */
  fit?: AsciiEffectFit;
  /** One or more hex colors used as a luminance gradient. */
  colors?: readonly string[];
  /** Use the supplied gradient or colors sampled from the image. */
  colorMode?: AsciiEffectColorMode;
  /** Canvas background color. */
  backgroundColor?: string;
  /** Reverse the luminance-to-character mapping. */
  invert?: boolean;
  /** Strength and number of displaced signal bands. */
  glitchIntensity?: number;
  /** Approximate glitches per second. */
  glitchFrequency?: number;
  /** Radial reveal duration in milliseconds. */
  revealDuration?: number;
  /** Additional classes for the container. */
  class?: string;
}

/** Props of the variant presets: everything except `variant`. */
export type AsciiEffectPresetProps = Omit<AsciiEffectProps, 'variant'>;
