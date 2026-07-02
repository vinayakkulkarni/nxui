export type PaperSmokeRingFit = 'none' | 'contain' | 'cover';

export interface PaperSmokeRingProps {
  /** Background color behind the ring. */
  colorBack?: string;
  /** Up to 10 gradient colors blended across the ring. */
  colors?: string[];
  /** Noise frequency driving the smoky texture (0.01 to 5). */
  noiseScale?: number;
  /** Thickness of the ring shape (0.01 to 1). */
  thickness?: number;
  /** Radius of the ring shape (0 to 1). */
  radius?: number;
  /** Ring inner fill amount (0 to 4). */
  innerShape?: number;
  /** Number of noise layers stacked for detail (1 to 8). */
  noiseIterations?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperSmokeRingFit;
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
