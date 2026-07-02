export type PaperVoronoiFit = 'none' | 'contain' | 'cover';

export interface PaperVoronoiProps {
  /** Up to 5 colors used for cells and gradients. */
  colors?: string[];
  /** Step granularity within each color band (1 to 10). */
  stepsPerColor?: number;
  /** Glow color blending into cell edges. */
  colorGlow?: string;
  /** Color of the gaps between cells. */
  colorGap?: string;
  /** Strength of organic distortion (0 to 1). */
  distortion?: number;
  /** Width of the gap between cells (0 to 0.1). */
  gap?: number;
  /** Strength of the glow between cells (0 to 1). */
  glow?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperVoronoiFit;
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
