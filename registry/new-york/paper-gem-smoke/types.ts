export type PaperGemSmokeFit = 'none' | 'contain' | 'cover';

export type PaperGemSmokeShape =
  | 'none'
  | 'circle'
  | 'daisy'
  | 'diamond'
  | 'metaballs';

export interface PaperGemSmokeProps {
  /** Up to 6 smoke colors in RGBA. */
  colors?: string[];
  /** Background color in RGBA. */
  colorBack?: string;
  /** Additional color inside the input shape, mixing with smoke (RGBA). */
  colorInner?: string;
  /** Source image used as the effect mask. Pass a URL string. */
  image?: string;
  /** Power of smoke distortion inside the input shape (0 to 1). */
  innerDistortion?: number;
  /** Power of smoke distortion outside the input shape (0 to 1). */
  outerDistortion?: number;
  /** Visibility of smoke shape outside the input shape (0 to 1). */
  outerGlow?: number;
  /** Visibility of smoke shape inside the input shape (0 to 1). */
  innerGlow?: number;
  /** Vertical offset of smoke inside the shape (-1 to 1). */
  offset?: number;
  /** Smoke direction in degrees (0 to 360). */
  angle?: number;
  /** Size of smoke shape relative to the image box (0 to 1). */
  size?: number;
  /** Predefined shape used when no image is provided. */
  shape?: PaperGemSmokeShape;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperGemSmokeFit;
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
