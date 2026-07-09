export interface RippleTransitionProps {
  /** Images to transition between. Use at least two for the ripple swap. */
  images?: string[];
  /** Transition duration in seconds. */
  duration?: number;
  /** Automatically trigger transitions on an interval. */
  autoPlay?: boolean;
  /** Delay between automatic transitions in milliseconds. */
  autoPlayInterval?: number;
  /** Start point for autoplay ripples. */
  autoPlayOrigin?: 'center' | 'random';
  /** Speed of the expanding wavefront. */
  waveSpeed?: number;
  /** Thickness of the main ripple band. */
  sigma?: number;
  /** Frequency of the small concentric ripples. */
  waveFreq?: number;
  /** Amount of radial image displacement. */
  pushAmt?: number;
  /** Chromatic aberration strength. */
  caStrength?: number;
  /** Bloom-like highlight strength on the wave. */
  glow?: number;
  /** Noise applied to the ripple edge. */
  noiseWarp?: number;
  /** Adds a subtle inward pull at the ripple origin. */
  pinch?: boolean;
  /** Root border radius in pixels. */
  borderRadius?: number;
  /** Canvas fallback background. */
  background?: string;
  /** Accessible label for the interactive region. */
  label?: string;
  class?: string;
}
