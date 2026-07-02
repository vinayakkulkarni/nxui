export type PaperSpiralFit = 'none' | 'contain' | 'cover';

export interface PaperSpiralProps {
  /** Background color. */
  colorBack?: string;
  /** Foreground (spiral stroke) color. */
  colorFront?: string;
  /** Spiral arm density (0 to 1). */
  density?: number;
  /** Strength of distortion applied to the spiral path (0 to 1). */
  distortion?: number;
  /** Spiral stroke width (0 to 1). */
  strokeWidth?: number;
  /** How much the stroke tapers toward the spiral center (0 to 1). */
  strokeTaper?: number;
  /** Stroke cap extension length (0 to 1). */
  strokeCap?: number;
  /** Strength of the procedural noise displacement (0 to 1). */
  noise?: number;
  /** Frequency of the noise displacement (0 to 1). */
  noiseFrequency?: number;
  /** Edge softness of the spiral stroke (0 to 1). */
  softness?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperSpiralFit;
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
