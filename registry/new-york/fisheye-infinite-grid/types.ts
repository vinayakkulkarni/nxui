export interface FisheyeGridItem {
  /** Image displayed inside the tile. */
  image: string;
  /** Accessible description for the image. */
  alt: string;
  /** Primary tile label. */
  title?: string;
  /** Secondary tile label, such as a year or category. */
  meta?: string;
}

export type FisheyeInfiniteGridTheme = 'dark' | 'light' | 'system';

export type FisheyeResolvedTheme = 'dark' | 'light';

export interface FisheyeInfiniteGridProps {
  /** Items repeated across the infinite field. */
  items?: FisheyeGridItem[];
  /** Width of each tile in CSS pixels. */
  tileWidth?: number;
  /** Height of each tile in CSS pixels. */
  tileHeight?: number;
  /** Space between tiles in CSS pixels. */
  gap?: number;
  /** Strength of the lens warp. Set to 0 for a flat grid. */
  lensStrength?: number;
  /** Visual treatment for the grid surface and tile chrome. */
  theme?: FisheyeInfiniteGridTheme;
  /** Distance of the subtle ambient hover drift in CSS pixels. */
  hoverNudge?: number;
  /** Momentum retained after releasing a drag, from 0 to 1. */
  inertia?: number;
  /** Amount of movement produced by trackpad or mouse-wheel input. */
  wheelSensitivity?: number;
  /** Accessible label for the grid region. */
  ariaLabel?: string;
  /** Additional classes applied to the root container. */
  class?: string;
}

export interface FisheyeAtlasLayout {
  tileWidth: number;
  tileHeight: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
  width: number;
  height: number;
}

export interface FisheyeVector {
  x: number;
  y: number;
}

export interface FisheyeNudge extends FisheyeVector {
  startedAt: number;
}

export interface FisheyeNudgeState extends FisheyeVector {
  active: boolean;
}

export interface FisheyeDragState extends FisheyeVector {
  active: boolean;
  pointerId: number;
  time: number;
}

export interface FisheyeGlResources {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  texture: WebGLTexture;
  resolution: WebGLUniformLocation | null;
  atlasSize: WebGLUniformLocation | null;
  offset: WebGLUniformLocation | null;
  curvature: WebGLUniformLocation | null;
  sampler: WebGLUniformLocation | null;
}
