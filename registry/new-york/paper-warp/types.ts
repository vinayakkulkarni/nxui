export type PaperWarpFit = 'none' | 'contain' | 'cover';
export type PaperWarpShape = 'checks' | 'stripes' | 'edge';

export interface PaperWarpProps {
  /** Up to 10 color stops blended across the warped surface. */
  colors?: string[];
  /** Blend point between colors (0 to 1). */
  proportion?: number;
  /** Edge softness of color transitions (0 to 1). */
  softness?: number;
  /** Strength of organic noise distortion (0 to 1). */
  distortion?: number;
  /** Power of vortex distortion (0 to 1). */
  swirl?: number;
  /** Number of swirl iterations (0 to 20). */
  swirlIterations?: number;
  /** Scale of the pattern shape (0 to 1). */
  shapeScale?: number;
  /** Shape pattern used by the warp. */
  shape?: PaperWarpShape;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperWarpFit;
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
