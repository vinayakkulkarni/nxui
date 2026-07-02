export type PaperStaticMeshGradientFit = 'none' | 'contain' | 'cover';

export interface PaperStaticMeshGradientProps {
  /** Up to 10 gradient colors blended across the surface. */
  colors?: string[];
  /** Color spots placement seed (0 to 100). */
  positions?: number;
  /** Strength of sine wave distortion along X axis (0 to 1). */
  waveX?: number;
  /** Phase offset applied to the X-axis wave (0 to 1). */
  waveXShift?: number;
  /** Strength of sine wave distortion along Y axis (0 to 1). */
  waveY?: number;
  /** Phase offset applied to the Y-axis wave (0 to 1). */
  waveYShift?: number;
  /** Blending behavior, 0 = hard stripes, 0.5 = smooth, 1 = gradual blend (0 to 1). */
  mixing?: number;
  /** Strength of grain distortion applied to shape edges (0 to 1). */
  grainMixer?: number;
  /** Post-processing black/white grain overlay (0 to 1). */
  grainOverlay?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperStaticMeshGradientFit;
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
