export type PaperDotOrbitFit = 'none' | 'contain' | 'cover';

export interface PaperDotOrbitProps {
  /** Background color behind the dots. */
  colorBack?: string;
  /** Up to 10 base colors blended across the dots. */
  colors?: string[];
  /** Dot radius relative to cell size (0 to 1). */
  size?: number;
  /** Random variation in shape size, 0 = uniform, higher = random up to base size (0 to 1). */
  sizeRange?: number;
  /** Maximum orbit distance around cell center (0 to 1). */
  spreading?: number;
  /** Number of extra colors between base colors, 1 = N colors, 2 = 2x N, etc. (1 to 4). */
  stepsPerColor?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperDotOrbitFit;
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
