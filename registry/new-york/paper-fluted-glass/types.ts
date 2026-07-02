export type PaperFlutedGlassFit = 'none' | 'contain' | 'cover';
export type PaperFlutedGlassGridShape =
  | 'lines'
  | 'linesIrregular'
  | 'wave'
  | 'zigzag'
  | 'pattern';
export type PaperFlutedGlassDistortionShape =
  | 'prism'
  | 'lens'
  | 'contour'
  | 'cascade'
  | 'flat';

export interface PaperFlutedGlassProps {
  /** Source image URL — when set, the glass distortion is applied over the image. */
  image?: string;
  /** Background color in RGBA. */
  colorBack?: string;
  /** Shadows color in RGBA. */
  colorShadow?: string;
  /** Highlights color in RGBA. */
  colorHighlight?: string;
  /** Color gradient added over image and background, following distortion shape (0 to 1). */
  shadows?: number;
  /** Thin strokes along distortion shape, useful for antialiasing on small grid (0 to 1). */
  highlights?: number;
  /** Size of the distortion shape grid (0 to 1). */
  size?: number;
  /** Direction of the grid relative to the image in degrees (0 to 180). */
  angle?: number;
  /** Power of distortion applied within each stripe (0 to 1). */
  distortion?: number;
  /** Grid shape. */
  shape?: PaperFlutedGlassGridShape;
  /** Glass distortion shape. */
  distortionShape?: PaperFlutedGlassDistortionShape;
  /** Texture shift in direction opposite to the grid (-1 to 1). */
  shift?: number;
  /** One-directional blur over the image and extra blur around edges (0 to 1). */
  blur?: number;
  /** Glass distortion and softness on the image edges (0 to 1). */
  edges?: number;
  /** Distance from the left edge to the effect (0 to 1). */
  marginLeft?: number;
  /** Distance from the right edge to the effect (0 to 1). */
  marginRight?: number;
  /** Distance from the top edge to the effect (0 to 1). */
  marginTop?: number;
  /** Distance from the bottom edge to the effect (0 to 1). */
  marginBottom?: number;
  /** Extra distortion along the grid lines (0 to 1). */
  stretch?: number;
  /** Strength of grain distortion applied to shape edges (0 to 1). */
  grainMixer?: number;
  /** Post-processing black/white grain overlay (0 to 1). */
  grainOverlay?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperFlutedGlassFit;
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
