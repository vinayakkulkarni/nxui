export type PaperLensDistortionFit = 'none' | 'contain' | 'cover';

export interface PaperLensDistortionProps {
  /** Source image URL — required, the lens filter is applied to this image. */
  image: string;
  /** Strength of the color split; how far the color layers are pushed apart, 0 is off (0 to 1). */
  spread?: number;
  /** Shifts the colors toward one end of the spread; 0 spaces them evenly (-1 to 1). */
  bias?: number;
  /** Direction of the spread in degrees, needs perspective < 1 (0 to 360). */
  angle?: number;
  /** Spread direction from a straight line (0) to a radial burst out from the center (1). */
  perspective?: number;
  /** Number of sampled color layers along the spread; higher is smoother and costlier (2 to 50). */
  count?: number;
  /** Color dispersion: 1 gives each layer its own spectrum color, 0 keeps the image color (0 to 1). */
  dispersion?: number;
  /** Dispersion balance: -1 keeps it in the center only, 1 at the edges only, 0 evenly (-1 to 1). */
  dispersionShift?: number;
  /** Rotates the colors around the hue wheel, 0 to 1 for a full turn. */
  dispersionColor?: number;
  /** Reduces the spread in a circular zone at the center (0 to 1). */
  focusCenter?: number;
  /** Reduces the spread toward the edges; 1 restores the original image there (0 to 1). */
  focusEdges?: number;
  /** Rotates the color layers around the center by an angle growing along the spread (-1 to 1). */
  swirl?: number;
  /** Scatters the spread direction with noise, 0 is off (0 to 1). */
  noise?: number;
  /** Frequency of the noise; higher is finer (0 to 1). */
  noiseFrequency?: number;
  /** Offsets the noise pattern for a different seed (0 to 1). */
  noiseOffset?: number;
  /** Radial lens warp: positive bulges out like a fisheye, negative pinches in (-1 to 1). */
  lensBulge?: number;
  /** Squeezes pixels outside the inscribed circle so the outline becomes a circle (0 to 1). */
  lensCircle?: number;
  /** Scatters the spread with grain noise, breaking up the layer edges (0 to 1). */
  grainMixer?: number;
  /** Post-processing black/white grain overlay (0 to 1). */
  grainOverlay?: number;
  /** Pans the image horizontally behind the effect, 0 is centered (-1 to 1). */
  imageX?: number;
  /** Pans the image vertically behind the effect, 0 is centered (-1 to 1). */
  imageY?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperLensDistortionFit;
  /** Overall zoom level (0.1 to 4). */
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

export type PaperLensDistortionPresetName =
  | 'Default'
  | 'Fisheye'
  | 'Duotone'
  | 'Smoke';

/** Every shader param except the image and CSS class. */
export type PaperLensDistortionPresetParams = Required<
  Omit<PaperLensDistortionProps, 'image' | 'class'>
>;

export interface PaperLensDistortionPreset {
  name: PaperLensDistortionPresetName;
  params: PaperLensDistortionPresetParams;
}
