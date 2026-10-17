export interface GridMotionImage {
  src: string;
  alt?: string;
}

/** Image URLs and paths render as photos, other values as text. */
export type GridMotionItem =
  | string
  | number
  | GridMotionImage
  | null
  | undefined
  | false;

export type GridMotionDirection = 'alternate' | 'left' | 'right';

export type GridMotionTheme = 'dark' | 'light';

export interface GridMotionProps {
  /** Tile content. Items repeat to fill the wall. */
  items?: GridMotionItem[];
  /** Rows of tiles. More rows means smaller tiles. */
  rows?: number;
  /** Width of each tile divided by its height. Below 1 gives portrait tiles. */
  aspectRatio?: number;
  /** Space between tiles in pixels. */
  gap?: number;
  /** Corner radius of the tiles in pixels. */
  radius?: number;
  /** Rotation of the whole wall in degrees. */
  angle?: number;
  /** Leans the wall back in 3D, in degrees. 0 keeps it flat. */
  tilt?: number;
  /** Drift speed of the rows in pixels per second. */
  speed?: number;
  /** Which way the rows drift. */
  direction?: GridMotionDirection;
  /** How far the rows slide against each other as the pointer moves, 0–1. */
  parallax?: number;
  /** Size of the area around the pointer that brings tiles back to full color, 0–1. */
  spotlight?: number;
  /** Fades the tiles outside the spotlight, 0–1. */
  dim?: number;
  /** Shows tiles in grayscale until the spotlight brings their color back. */
  grayscale?: boolean;
  /** Fades the edges of the wall into the page, 0–1. */
  fade?: number;
  /** Background of text and empty tiles. Follows the theme when not set. */
  tileColor?: string;
  /** Color of text tiles. Follows the theme when not set. */
  textColor?: string;
  /** Picks the default tile and text colors. */
  theme?: GridMotionTheme;
  class?: string;
}

export type GridMotionTile =
  | { kind: 'empty'; index: number; item: GridMotionItem }
  | {
      kind: 'image';
      index: number;
      item: GridMotionItem;
      src: string;
      alt: string;
    }
  | { kind: 'text'; index: number; item: GridMotionItem; text: string };

export interface GridMotionLayout {
  planeWidth: number;
  planeHeight: number;
  tileWidth: number;
  tileHeight: number;
  step: number;
  perRow: number;
  period: number;
  copies: number;
  top: number;
  perspective: number;
}

export interface GridMotionLayoutInput {
  width: number;
  height: number;
  rows: number;
  aspect: number;
  gap: number;
  angle: number;
  tilt: number;
}
