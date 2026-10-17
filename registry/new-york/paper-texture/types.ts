export type PaperTextureFit = 'none' | 'contain' | 'cover';

export interface PaperTextureProps {
  /** Optional source image URL. Without it the shader renders a standalone paper sheet. */
  image?: string;
  /** Color behind the paper sheet in RGBA. */
  colorBack?: string;
  /** Color of the paper sheet in RGBA. */
  colorPaper?: string;
  /** Color of the patterns over the paper sheet in RGBA. */
  colorShadow?: string;
  /** Amount of image-to-paper blending, needs image (0 to 1). */
  blending?: number;
  /** How much the image bends with the paper surface, needs image (-1 to 1). */
  distortion?: number;
  /** Cuts the paper sheet to the image frame, needs image. */
  clip?: boolean;
  /** Direction the surface is lit from in degrees, also the roughness rows direction (0 to 360). */
  angle?: number;
  /** Seed applied to every pattern (0 to 1000). */
  seed?: number;
  /** Fine grain covering the surface evenly (0 to 1). */
  roughness?: number;
  /** Scale of the roughness grain, needs roughness > 0 (0 to 1). */
  roughnessSize?: number;
  /** Lines the roughness up into stripes: 0 = even scatter, 1 = laid-paper rows (0 to 1). */
  roughnessRows?: number;
  /** Curly thread-like noise covering the surface evenly (0 to 1). */
  fiber?: number;
  /** Scale of the fiber noise, needs fiber > 0 (0 to 1). */
  fiberSize?: number;
  /** Straight vertical and horizontal fold lines producing ridges and valleys (0 to 1). */
  folds?: number;
  /** Size of the vertical folds, needs folds > 0 (0 to 1). */
  foldSizeX?: number;
  /** Size of the horizontal folds, needs folds > 0 (0 to 1). */
  foldSizeY?: number;
  /** Shifts the vertical folds across the surface, needs folds > 0 (0 to 1). */
  foldOffsetX?: number;
  /** Shifts the horizontal folds across the surface, needs folds > 0 (0 to 1). */
  foldOffsetY?: number;
  /** Crumple-like facets repeating across the surface (0 to 1). */
  wrinkles?: number;
  /** Scale of the wrinkle facets, needs wrinkles > 0 (0 to 1). */
  wrinkleSize?: number;
  /** A set of irregular folding lines (0 to 1). */
  crumples?: number;
  /** Number of facets in the crumple field, needs crumples > 0 (2 to 15). */
  crumpleCount?: number;
  /** Visibility of the speckle pattern; darkens the image instead of coloring it (0 to 1). */
  drops?: number;
  /** Animation speed multiplier. 0 renders a static frame. */
  speed?: number;
  /** Initial/seek frame for deterministic rendering. */
  frame?: number;
  /** How the graphic fits the canvas. */
  fit?: PaperTextureFit;
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

export type PaperTexturePresetName = 'Default' | 'Spread' | 'Creased' | 'Flat';

/** Every shader param except the image and CSS class. */
export type PaperTexturePresetParams = Required<
  Omit<PaperTextureProps, 'image' | 'class'>
>;

export interface PaperTexturePreset {
  name: PaperTexturePresetName;
  params: PaperTexturePresetParams;
}
