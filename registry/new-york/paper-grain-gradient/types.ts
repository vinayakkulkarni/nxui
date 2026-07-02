export type PaperGrainGradientFit = 'none' | 'contain' | 'cover';
export type PaperGrainGradientShape =
  | 'wave'
  | 'dots'
  | 'truchet'
  | 'corners'
  | 'ripple'
  | 'blob'
  | 'sphere';

export interface PaperGrainGradientProps {
  /** Background color in any CSS color format. */
  colorBack?: string;
  /** Up to 7 gradient colors blended across the surface. */
  colors?: string[];
  /** Color transition sharpness, 0 = hard edge, 1 = smooth gradient (0 to 1). */
  softness?: number;
  /** Distortion between color bands (0 to 1). */
  intensity?: number;
  /** Grainy noise overlay (0 to 1). */
  noise?: number;
  /** Shape type used to drive the gradient field. */
  shape?: PaperGrainGradientShape;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperGrainGradientFit;
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
