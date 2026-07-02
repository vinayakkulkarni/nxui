export type PaperColorPanelsFit = 'none' | 'contain' | 'cover';

export interface PaperColorPanelsProps {
  /** Up to 7 RGBA colors used to color the panels. */
  colors?: string[];
  /** Background color in any CSS color format. */
  colorBack?: string;
  /** Skew angle applied to all panels (-1 to 1). */
  angle1?: number;
  /** Skew angle applied to all panels (-1 to 1). */
  angle2?: number;
  /** Panel length relative to total height (0 to 3). */
  length?: number;
  /** Highlight the panel edges with a brighter rim. */
  edges?: boolean;
  /** Side blur, 0 for sharp edges (0 to 0.5). */
  blur?: number;
  /** Transparency near the central axis (0 to 1). */
  fadeIn?: number;
  /** Transparency near the viewer (0 to 1). */
  fadeOut?: number;
  /** Angle between every 2 panels (0.25 to 7). */
  density?: number;
  /** Color mixing within a panel, 0 = solid, 1 = gradient (0 to 1). */
  gradient?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperColorPanelsFit;
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
