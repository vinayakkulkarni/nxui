export type DitherVeilFit = 'contain' | 'cover';

export type DitherVeilPattern =
  | 'bayer'
  | 'noise'
  | 'atkinson'
  | 'floyd'
  | 'lines';

export type DitherVeilPalette = 'duotone' | 'rgb';

export interface DitherVeilProps {
  /** Image to veil. Must be served with CORS headers. */
  src?: string;
  /** Show the whole image on the ink, or crop it to fill the container. */
  fit?: DitherVeilFit;
  /** How the image is broken into dots. */
  pattern?: DitherVeilPattern;
  /** Size of each dither cell, in px. */
  pixelSize?: number;
  /** Tones per channel. 2 is pure 1-bit, higher values add in-between shades. */
  levels?: number;
  /** Duotone maps brightness between ink and paper; RGB dithers each channel. */
  palette?: DitherVeilPalette;
  /** Colour of the darkest tone. */
  inkColor?: string;
  /** Colour of the lightest tone. */
  paperColor?: string;
  /** Tonal contrast applied before dithering. */
  contrast?: number;
  /** Shifts the image lighter or darker before dithering. */
  brightness?: number;
  /** Radius of the full-colour window around the cursor, in px. */
  revealRadius?: number;
  /** How much of the reveal edge dissolves through the dither. 0 is a hard cut. */
  softness?: number;
  /** Seconds the revealed trail takes to knit back into dither. 0 turns the trail off. */
  linger?: number;
  /** Colour of the cells along the dissolving edge. */
  rimColor?: string;
  /** Thickness of the coloured rim on the dissolving edge. 0 hides it. */
  rim?: number;
  /** Start in full colour and dither wherever the cursor goes. */
  reverse?: boolean;
  /** Let the reveal drift around on its own while the pointer is away. */
  wander?: boolean;
  /** Clicking sends a ring of colour rippling out across the image. */
  clickBurst?: boolean;
  class?: string;
}

export interface DitherVeilEngine {
  wake: () => void;
  destroy: () => void;
}

export interface DitherVeilSettings {
  src: string;
  fit: DitherVeilFit;
  pattern: DitherVeilPattern;
  pixelSize: number;
  levels: number;
  palette: DitherVeilPalette;
  inkColor: string;
  paperColor: string;
  contrast: number;
  brightness: number;
  revealRadius: number;
  softness: number;
  linger: number;
  rimColor: string;
  rim: number;
  reverse: boolean;
  wander: boolean;
  clickBurst: boolean;
}
