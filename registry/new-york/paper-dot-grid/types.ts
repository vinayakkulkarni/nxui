export type PaperDotGridFit = 'none' | 'contain' | 'cover';

export type PaperDotGridShape = 'circle' | 'diamond' | 'square' | 'triangle';

export interface PaperDotGridProps {
  /** Background color behind the shapes. */
  colorBack?: string;
  /** Shape fill color. */
  colorFill?: string;
  /** Shape stroke color. */
  colorStroke?: string;
  /** Base size of each shape in pixels (1 to 100). */
  size?: number;
  /** Pattern horizontal spacing in pixels (2 to 500). */
  gapX?: number;
  /** Pattern vertical spacing in pixels (2 to 500). */
  gapY?: number;
  /** Outline stroke width in pixels (0 to 50). */
  strokeWidth?: number;
  /** Random variation in shape size, 0 = uniform, higher = random up to base size (0 to 1). */
  sizeRange?: number;
  /** Random variation in shape opacity, 0 = opaque, higher = semi-transparent (0 to 1). */
  opacityRange?: number;
  /** Shape type rendered in each grid cell. */
  shape?: PaperDotGridShape;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperDotGridFit;
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
