export interface MeshGradientProps {
  /** Up to 10 hex color spots blended across the surface. */
  colors?: string[];
  /** Animation speed multiplier. Set to 0 to freeze. */
  speed?: number;
  /** Power of organic noise distortion (0 to 1). */
  distortion?: number;
  /** Power of vortex/swirl distortion (0 to 1). */
  swirl?: number;
  /** Strength of grain distortion applied to shape edges (0 to 1). */
  grainMixer?: number;
  /** Post-processing black/white grain overlay (0 to 1). */
  grainOverlay?: number;
  /** Overall zoom level of the graphics. */
  scale?: number;
  /** Additional CSS classes. */
  class?: string;
}
