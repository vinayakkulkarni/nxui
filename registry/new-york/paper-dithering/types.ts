export type PaperDitheringFit = 'none' | 'contain' | 'cover';
export type PaperDitheringShape =
  | 'simplex'
  | 'warp'
  | 'dots'
  | 'wave'
  | 'ripple'
  | 'swirl'
  | 'sphere';
export type PaperDitheringType = 'random' | '2x2' | '4x4' | '8x8';

export interface PaperDitheringProps {
  /** Background color in any CSS color format. */
  colorBack?: string;
  /** Foreground (ink) color in any CSS color format. */
  colorFront?: string;
  /** Shape pattern type used to drive the dither threshold. */
  shape?: PaperDitheringShape;
  /** Dithering algorithm applied to the shape. */
  type?: PaperDitheringType;
  /** Pixel size of the dithering grid (0.5 to 20). */
  size?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperDitheringFit;
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
