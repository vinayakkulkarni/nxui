import type { HTMLAttributes } from 'vue';

export interface DriftWallItem {
  /** Image URL of the tile. */
  image: string;
  /** Alt text and accessible name of the tile. */
  title?: string;
  /** When set, the tile is a link that opens in a new tab. */
  href?: string;
}

export type DriftWallDirection = 'up' | 'down';

export interface DriftWallProps {
  /** Tiles to display. Each item has { image, title?, href? }. */
  items?: DriftWallItem[];
  /** Number of drifting columns. */
  columns?: number;
  /** Width of each tile in pixels. */
  tileWidth?: number;
  /** Height of each tile in pixels. */
  tileHeight?: number;
  /** Spacing between tiles and columns in pixels. */
  gap?: number;
  /** Corner radius of each tile in pixels. */
  radius?: number;
  /** Perspective pitch of the wall (rotateX, degrees). */
  tilt?: number;
  /** Perspective yaw of the wall (rotateY, degrees). */
  turn?: number;
  /** In-plane rotation of the wall (rotateZ, degrees). */
  roll?: number;
  /** Perspective distance in pixels. Smaller is more dramatic. */
  perspective?: number;
  /** How far the wall sits back from the viewer in pixels. */
  depth?: number;
  /** Base drift speed in pixels per second. */
  speed?: number;
  /** Primary drift direction; columns alternate around it. */
  direction?: DriftWallDirection;
  /** How much column speeds differ from each other (0–1). */
  variance?: number;
  /** Pointer-follow tilt strength (0 disables it). */
  parallax?: number;
  /** Pause the whole wall while the pointer is over it. */
  pauseOnHover?: boolean;
  /** How far a hovered tile lifts toward the viewer in pixels. */
  lift?: number;
  /** Strength of the edge and depth dissolve (0–1). */
  fade?: number;
  /** Resting opacity of unhovered tiles (0–1). */
  dim?: number;
  /** Desaturate resting tiles; hover restores colour. */
  grayscale?: boolean;
  /** Tint laid over resting tiles, cleared on hover. */
  overlayColor?: string;
  class?: HTMLAttributes['class'];
}

export interface DriftWallColumnMeta {
  copyHeight: number;
  copies: number;
}
