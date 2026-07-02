export type PaperTextureFit = 'none' | 'contain' | 'cover';

export interface PaperTextureProps {
  /** Optional source image URL — when set, the texture is composited over the image. */
  image?: string;
  /** Foreground color in RGBA. */
  colorFront?: string;
  /** Background color in RGBA. */
  colorBack?: string;
  /** Sharpness of color transitions (0 to 1). */
  contrast?: number;
  /** Pixel noise, related to canvas and not scalable (0 to 1). */
  roughness?: number;
  /** Curly-shaped noise intensity (0 to 1). */
  fiber?: number;
  /** Curly-shaped noise scale (0 to 1). */
  fiberSize?: number;
  /** Cell-based crumple pattern intensity (0 to 1). */
  crumples?: number;
  /** Cell-based crumple pattern scale (0 to 1). */
  crumpleSize?: number;
  /** Depth of the folds (0 to 1). */
  folds?: number;
  /** Number of folds (1 to 15). */
  foldCount?: number;
  /** Big-scale noise mask applied to the pattern (0 to 1). */
  fade?: number;
  /** Visibility of speckle pattern (0 to 1). */
  drops?: number;
  /** Seed applied to folds, crumples and dots (0 to 1000). */
  seed?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperTextureFit;
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
