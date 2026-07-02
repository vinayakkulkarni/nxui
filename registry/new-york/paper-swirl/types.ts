export type PaperSwirlFit = 'none' | 'contain' | 'cover';

export interface PaperSwirlProps {
  /** Background color in any CSS color format. */
  colorBack?: string;
  /** Up to 10 stripe colors blended into the swirl. */
  colors?: string[];
  /** Number of color bands, 0 = concentric ripples (0 to 15). */
  bandCount?: number;
  /** Vortex power, 0 = straight sectoral shapes (0 to 1). */
  twist?: number;
  /** How far from the center the swirl colors begin to appear (0 to 1). */
  center?: number;
  /** Blend point between colors, 0.5 = equal distribution (0 to 1). */
  proportion?: number;
  /** Color transition sharpness, 0 = hard edge, 1 = smooth gradient (0 to 1). */
  softness?: number;
  /** Noise frequency, no effect with noise = 0 (0 to 1). */
  noiseFrequency?: number;
  /** Strength of noise distortion, no effect with noiseFrequency = 0 (0 to 1). */
  noise?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperSwirlFit;
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
