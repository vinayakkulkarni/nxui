export type PaperPulsingBorderFit = 'none' | 'contain' | 'cover';
export type PaperPulsingBorderAspectRatio = 'auto' | 'square';

export interface PaperPulsingBorderProps {
  /** Background color in any CSS color format. */
  colorBack?: string;
  /** Up to 5 spot colors used in the gradient. */
  colors?: string[];
  /** Border radius (0 to 1). */
  roundness?: number;
  /** Border base width (0 to 1). */
  thickness?: number;
  /** Convenience: sets all four margin values at once. Overrides margin-left/right/top/bottom if provided. */
  margin?: number;
  /** Distance from the left edge to the effect (0 to 1). */
  marginLeft?: number;
  /** Distance from the right edge to the effect (0 to 1). */
  marginRight?: number;
  /** Distance from the top edge to the effect (0 to 1). */
  marginTop?: number;
  /** Distance from the bottom edge to the effect (0 to 1). */
  marginBottom?: number;
  /** Aspect ratio mode. */
  aspectRatio?: PaperPulsingBorderAspectRatio;
  /** Border edge sharpness, 0 = hard edge, 1 = smooth gradient (0 to 1). */
  softness?: number;
  /** Thickness of individual color spots (0 to 1). */
  intensity?: number;
  /** Power of glow, 0 = normal blending, 1 = additive blending (0 to 1). */
  bloom?: number;
  /** Number of spots added for each color (1 to 20). */
  spots?: number;
  /** Angular size of spots (0 to 1). */
  spotSize?: number;
  /** Optional pulsing animation intensity (0 to 1). */
  pulse?: number;
  /** Optional noisy shape extending the border (0 to 1). */
  smoke?: number;
  /** Size of the smoke effect (0 to 1). */
  smokeSize?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperPulsingBorderFit;
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
