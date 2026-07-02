export type PaperHalftoneDotsFit = 'none' | 'contain' | 'cover';

export type PaperHalftoneDotsType = 'classic' | 'gooey' | 'holes' | 'soft';

export type PaperHalftoneDotsGrid = 'square' | 'hex';

export interface PaperHalftoneDotsProps {
  /** Source image to apply the halftone filter to. */
  image?: string;
  /** Foreground (dot) color in RGBA. */
  colorFront?: string;
  /** Background (paper) color in RGBA. */
  colorBack?: string;
  /** Grid size relative to the image box (0 to 1). */
  size?: number;
  /** Grid style (square or hexagonal). */
  grid?: PaperHalftoneDotsGrid;
  /** Maximum dot size relative to grid cell (0 to 2). */
  radius?: number;
  /** Contrast applied to the sampled image (0 to 1). */
  contrast?: number;
  /** Use sampled image's original colors instead of colorFront. */
  originalColors?: boolean;
  /** Inverts the image luminance, doesn't affect the color scheme. */
  inverted?: boolean;
  /** Strength of grain distortion applied to shape edges (0 to 1). */
  grainMixer?: number;
  /** Post-processing black/white grain overlay (0 to 1). */
  grainOverlay?: number;
  /** Scale applied to both grain distortion and grain overlay (0 to 1). */
  grainSize?: number;
  /** Dot style. */
  type?: PaperHalftoneDotsType;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperHalftoneDotsFit;
  /** Overall zoom level (0.01 to 4). */
  scale?: number;
  /** Overall rotation angle in degrees (0 to 360). */
  rotation?: number;
  /** Horizontal origin for world positioning (0 to 1). */
  originX?: number;
  /** Vertical origin for world positioning (0 to 1). */
  originY?: number;
  /** Horizontal offset of the graphics center (-1 to 1). */
  offsetX?: number;
  /** Vertical offset of the graphics center (-1 to 1). */
  offsetY?: number;
  /** Virtual world width before canvas fitting. */
  worldWidth?: number;
  /** Virtual world height before canvas fitting. */
  worldHeight?: number;
  /** Additional CSS classes. */
  class?: string;
}
