export type PaperStaticRadialGradientFit = 'none' | 'contain' | 'cover';

export interface PaperStaticRadialGradientProps {
  /** Background color behind the gradient. */
  colorBack?: string;
  /** Up to 10 colors blended radially across the surface. */
  colors?: string[];
  /** Size of the radial shape (0 to 3). */
  radius?: number;
  /** Distance of the focal point from center (0 to 3). */
  focalDistance?: number;
  /** Angle of the focal point in degrees, effective with focalDistance > 0 (0 to 360). */
  focalAngle?: number;
  /** Gradient decay, 0 = linear gradient (-1 to 1). */
  falloff?: number;
  /** Blending behavior, 0 = hard stripes, 1 = smooth gradient (0 to 1). */
  mixing?: number;
  /** Strength of radial distortion (0 to 1). */
  distortion?: number;
  /** Radial distortion offset, effective with distortion > 0 (-1 to 1). */
  distortionShift?: number;
  /** Radial distortion frequency, effective with distortion > 0 (0 to 20). */
  distortionFreq?: number;
  /** Strength of grain distortion applied to shape edges (0 to 1). */
  grainMixer?: number;
  /** Post-processing black/white grain overlay (0 to 1). */
  grainOverlay?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperStaticRadialGradientFit;
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
