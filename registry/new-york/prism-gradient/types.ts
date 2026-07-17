/** Grain overlay settings for PrismGradient. */
export interface PrismGradientNoise {
  /** Opacity of the grain overlay. */
  opacity: number;
  /** Size multiplier for the grain texture. */
  scale?: number;
}

/**
 * Props for the PrismGradient registry component.
 */
export interface PrismGradientProps {
  /** Animation speed multiplier. Prism's original speed is 1. */
  speed?: number;
  /** Optional grain overlay. */
  noise?: PrismGradientNoise;
  /** Border radius applied to the gradient. */
  radius?: string;
  /** Additional CSS classes. */
  class?: string;
}
