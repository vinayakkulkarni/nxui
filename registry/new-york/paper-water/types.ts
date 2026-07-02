export type PaperWaterFit = 'none' | 'contain' | 'cover';

export interface PaperWaterProps {
  /** Optional source image URL — when set, the water distortion is applied over the image. */
  image?: string;
  /** Background color in RGBA. */
  colorBack?: string;
  /** Highlight color in RGBA. */
  colorHighlight?: string;
  /** Coloring added over image/background following caustic shape (0 to 1). */
  highlights?: number;
  /** Power of 2nd layer of caustic distortion (0 to 1). */
  layering?: number;
  /** Caustic distortion power on the image edges (0 to 1). */
  edges?: number;
  /** Power of caustic distortion (0 to 1). */
  caustic?: number;
  /** Additional distortion based on simplex noise, independent from caustic (0 to 1). */
  waves?: number;
  /** Pattern scale relative to the image (0.01 to 7). */
  size?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperWaterFit;
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
