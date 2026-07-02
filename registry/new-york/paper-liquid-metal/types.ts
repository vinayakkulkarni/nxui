export type PaperLiquidMetalFit = 'none' | 'contain' | 'cover';

export type PaperLiquidMetalShape =
  | 'none'
  | 'circle'
  | 'daisy'
  | 'diamond'
  | 'metaballs';

export interface PaperLiquidMetalProps {
  /** Background color shown behind the metal surface. */
  colorBack?: string;
  /** Overlay color (color-burn blended) applied to the metal pattern. */
  colorTint?: string;
  /** Source image used as the effect mask. Pass a URL string. */
  image?: string;
  /** Density of pattern stripes (1 to 10). */
  repetition?: number;
  /** R-channel dispersion (-1 to 1). */
  shiftRed?: number;
  /** B-channel dispersion (-1 to 1). */
  shiftBlue?: number;
  /** Strength of the distortion on the shape edges (0 to 1). */
  contour?: number;
  /** Color transition sharpness (0 = hard edge, 1 = smooth gradient). */
  softness?: number;
  /** Noise distortion over the stripes pattern (0 to 1). */
  distortion?: number;
  /** Direction of pattern animation in degrees (0 to 360). */
  angle?: number;
  /** Predefined shape used when no image is provided. */
  shape?: PaperLiquidMetalShape;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperLiquidMetalFit;
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
