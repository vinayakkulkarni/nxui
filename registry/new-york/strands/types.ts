export interface StrandsProps {
  /**
   * Colors of the strands, in order: the red top edge of the bulge, orange, amber,
   * the warm white core, cyan, blue and deep blue. Fewer colors are spread across these roles.
   */
  colors?: string[];
  /** How many strands show inside the bulge of light, from 1 to 3. */
  count?: number;
  /** How fast the light turns. 0 holds it still. */
  speed?: number;
  /** How tall the arch rises and how deeply the ribbon curves. */
  amplitude?: number;
  /** How tightly the ribbon twists along its length. */
  waviness?: number;
  /** How thick the edges of the light are, and the white core where the ribbon turns edge-on. */
  thickness?: number;
  /** Strength of the soft glow around the light. */
  glow?: number;
  /** How quickly the light fades toward the sides of the orb. */
  taper?: number;
  /** How wide the ribbon opens, fanning its colors out. */
  spread?: number;
  /** Rotates the colors around the color wheel, from 0 to 1. */
  hueShift?: number;
  /** Overall brightness of the light. */
  intensity?: number;
  /** Color saturation of the light. 0 is greyscale. */
  saturation?: number;
  /** Overall opacity. */
  opacity?: number;
  /** Width of the light. */
  scale?: number;
  /** Shows the glass orb. Turn it off for the light on its own. */
  glass?: boolean;
  /** How strongly the edge of the glass bends the light. */
  refraction?: number;
  /** Amount of rainbow color separation along the edge of the glass. */
  dispersion?: number;
  /** Size of the glass orb. */
  glassSize?: number;
  /** Brightness of the glass rim and the light it catches. */
  rim?: number;
  /** How lively the light is on its own, from 0 (calm white line) to 1 (ribbons fully open). */
  energy?: number;
  /** Animates the orb as if it were hearing someone speak. */
  listening?: boolean;
  /** Drives the orb from your own audio level (0 to 1). Overrides `listening`. */
  level?: number;
  /** The light tilts toward the cursor and stirs as it gets close. */
  interactive?: boolean;
  /** Clicking sends a burst of motion through the light. */
  clickPulse?: boolean;
  /** The orb fades in and the light unfolds from the center when it first appears. */
  intro?: boolean;
  /** For light pages: frosted white glass and deeper strand colors with a warm core. */
  lightMode?: boolean;
  /** Highest pixel ratio the canvas renders at. */
  maxDevicePixelRatio?: number;
  class?: string;
}
