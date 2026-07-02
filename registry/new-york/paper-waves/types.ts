export type PaperWavesFit = 'none' | 'contain' | 'cover';

export interface PaperWavesProps {
  /** Foreground color. */
  colorFront?: string;
  /** Background color. */
  colorBack?: string;
  /** Wave shape morph parameter (0 to ~3). */
  shape?: number;
  /** Wave frequency (0 to 1). */
  frequency?: number;
  /** Wave amplitude (0 to 1). */
  amplitude?: number;
  /** Spacing between waves (0.5 to 3). */
  spacing?: number;
  /** Wave proportion/blend point (0 to 1). */
  proportion?: number;
  /** Edge softness for color transitions (0 to 1). */
  softness?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperWavesFit;
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
