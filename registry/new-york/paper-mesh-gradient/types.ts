export type PaperMeshGradientFit = 'none' | 'contain' | 'cover';

export interface PaperMeshGradientProps {
  /** Up to 10 color spots blended across the surface. */
  colors?: string[];
  /** Power of organic noise distortion (0 to 1). */
  distortion?: number;
  /** Power of vortex distortion (0 to 1). */
  swirl?: number;
  /** Strength of grain distortion applied to shape edges (0 to 1). */
  grainMixer?: number;
  /** Post-processing black/white grain overlay (0 to 1). */
  grainOverlay?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperMeshGradientFit;
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
