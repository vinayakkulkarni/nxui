export type PaperHeatmapFit = 'none' | 'contain' | 'cover';

export interface PaperHeatmapProps {
  /** Source image URL — required. The image is preprocessed (blurred to feed contour/outer/inner channels) before being passed to the shader. */
  image: string;
  /** Heat intensity near the edges of the input shape (0 to 1). */
  contour?: number;
  /** Direction of the heatwaves in degrees (0 to 360). */
  angle?: number;
  /** Grain applied across the entire graphic (0 to 1). */
  noise?: number;
  /** Size of the heated area inside the input shape (0 to 1). */
  innerGlow?: number;
  /** Size of the heated area outside the input shape (0 to 1). */
  outerGlow?: number;
  /** Background color in RGBA. */
  colorBack?: string;
  /** Up to 10 heatmap colors in RGBA. */
  colors?: string[];
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperHeatmapFit;
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
