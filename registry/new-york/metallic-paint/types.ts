export type MetallicPaintRgba = [number, number, number, number];

export interface MetallicPaintProps {
  /** URL of the logo or image to paint. SVGs work best. Transparent pixels are left empty. */
  imageSrc?: string;
  /** Text to paint instead of an image. Takes priority over `imageSrc`. */
  text?: string;
  /** Font used for text. */
  fontFamily?: string;
  /** Font weight used for text. */
  fontWeight?: number;
  /** Tint of the metal. White keeps it chrome, warm tones turn it gold or copper. */
  color?: string;
  /** Color behind the shape. The canvas is transparent by default. */
  backgroundColor?: string;
  /** How many reflection bands run across the shape (0.5 to 12). */
  density?: number;
  /** Softness of the reflection edges, from 0 (crisp chrome) to 1 (brushed metal). */
  softness?: number;
  /** Rainbow fringes where the reflections bend (-1 to 1). */
  dispersion?: number;
  /** How much the reflections ripple as they flow (0 to 1). */
  distortion?: number;
  /** How strongly the reflections bend around the edges of the shape (0 to 1). */
  edgeBend?: number;
  /** Direction the reflections flow in, in degrees. */
  angle?: number;
  /** Speed of the flow. 0 freezes it. */
  speed?: number;
  /** Size of the shape inside the canvas. */
  scale?: number;
  /** Rotation of the shape, in degrees. */
  rotation?: number;
  /** How much the reflections shift as the cursor moves (0 to 1.5). */
  mouseTilt?: number;
  /** Adds a soft dark rim and dims the brightest highlights so the shape reads on light pages. */
  lightMode?: boolean;
  /** Pours the metal in from the outline on mount. */
  intro?: boolean;
  /** Freezes the animation. */
  paused?: boolean;
  /** Device pixel ratio cap. Renders at 2× or more for clean edges. */
  dpr?: number;
  class?: string;
}
