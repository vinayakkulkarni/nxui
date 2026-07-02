export type PaperHalftoneCmykFit = 'none' | 'contain' | 'cover';

export type PaperHalftoneCmykType = 'dots' | 'ink' | 'sharp';

export interface PaperHalftoneCmykProps {
  /** Source image to apply the CMYK halftone to. */
  image?: string;
  /** Background (paper) color in RGBA. */
  colorBack?: string;
  /** Cyan ink color in RGBA. */
  colorC?: string;
  /** Magenta ink color in RGBA. */
  colorM?: string;
  /** Yellow ink color in RGBA. */
  colorY?: string;
  /** Black ink color in RGBA. */
  colorK?: string;
  /** Halftone cell size (0 to 1). */
  size?: number;
  /** Image contrast adjustment (0 to 2). */
  contrast?: number;
  /** Edge softness of dots (0 to 1). */
  softness?: number;
  /** Size of grain overlay texture (0 to 1). */
  grainSize?: number;
  /** Strength of grain affecting dot size (0 to 1). */
  grainMixer?: number;
  /** Strength of grain overlay on final output (0 to 1). */
  grainOverlay?: number;
  /** Strength of smooth noise on dot positions and color sampling (0 to 1). */
  gridNoise?: number;
  /** Flat cyan dot size adjustment applied uniformly (-1 to 1). */
  floodC?: number;
  /** Flat magenta dot size adjustment applied uniformly (-1 to 1). */
  floodM?: number;
  /** Flat yellow dot size adjustment applied uniformly (-1 to 1). */
  floodY?: number;
  /** Flat black dot size adjustment applied uniformly (-1 to 1). */
  floodK?: number;
  /** Proportional cyan dot size gain (-1 to 1). */
  gainC?: number;
  /** Proportional magenta dot size gain (-1 to 1). */
  gainM?: number;
  /** Proportional yellow dot size gain (-1 to 1). */
  gainY?: number;
  /** Proportional black dot size gain (-1 to 1). */
  gainK?: number;
  /** Dot shape style. */
  type?: PaperHalftoneCmykType;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperHalftoneCmykFit;
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
