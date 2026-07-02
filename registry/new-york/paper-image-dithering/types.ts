export type PaperImageDitheringFit = 'none' | 'contain' | 'cover';
export type PaperImageDitheringType = 'random' | '2x2' | '4x4' | '8x8';

export interface PaperImageDitheringProps {
  /** Source image URL — required, the dithering filter is applied to this image. */
  image: string;
  /** Foreground color in RGBA. */
  colorFront?: string;
  /** Background color in RGBA. */
  colorBack?: string;
  /** Secondary foreground color in RGBA (set same as colorFront for classic 2-color dithering). */
  colorHighlight?: string;
  /** Dithering type. */
  type?: PaperImageDitheringType;
  /** Pixel size of dithering grid (0.5 to 20). */
  size?: number;
  /** Number of colors to use, applies to both color modes (1 to 7). */
  colorSteps?: number;
  /** Use the original colors of the image instead of the color palette. */
  originalColors?: boolean;
  /** Inverts the image luminance, doesn't affect the color scheme; not effective at zero contrast. */
  inverted?: boolean;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperImageDitheringFit;
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
