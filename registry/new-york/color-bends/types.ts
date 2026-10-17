export interface ColorBendsProps {
  /** Base rotation of the pattern, in degrees. */
  rotation?: number;
  /** Animation speed. */
  speed?: number;
  /** Up to 8 hex colors. Empty uses the built-in RGB bands. */
  colors?: string[];
  /** Transparent canvas, so the page shows through between the bands. */
  transparent?: boolean;
  /** Extra rotation added every second, in degrees. */
  autoRotate?: number;
  /** Zoom of the pattern. Higher values zoom out. */
  scale?: number;
  /** Frequency of the bends. */
  frequency?: number;
  /** How strongly the bands warp. */
  warpStrength?: number;
  /** How strongly the pattern pulls toward the cursor. */
  mouseInfluence?: number;
  /** How far the pattern shifts with the cursor. */
  parallax?: number;
  /** Amount of film grain. */
  noise?: number;
  /** Extra folding passes, from 1 to 5. More passes = more detail. */
  iterations?: number;
  /** Brightness of the bands. */
  intensity?: number;
  /** Sharpness of the bands. Higher values make thinner, crisper bands. */
  bandWidth?: number;
  /** Extra classes for the container. */
  class?: string;
}
