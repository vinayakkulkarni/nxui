export type PaperNeuroNoiseFit = 'none' | 'contain' | 'cover';

export interface PaperNeuroNoiseProps {
  /** Highlight color at the brightest crossing points. */
  colorFront?: string;
  /** Main color of the flowing structure. */
  colorMid?: string;
  /** Background color behind the web. */
  colorBack?: string;
  /** Luminosity of the crossing points (0 to 1). */
  brightness?: number;
  /** Sharpness of the bright-dark transition (0 to 1). */
  contrast?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperNeuroNoiseFit;
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
