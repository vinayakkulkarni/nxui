import type { CSSProperties } from 'vue';

export type StickerFinish = 'gloss' | 'matte' | 'holo';

export interface StickerPoint {
  x: number;
  y: number;
}

export type StickerHullPoint = [number, number];

export type StickerSpringKey =
  | 'swing'
  | 'swingV'
  | 'peel'
  | 'peelV'
  | 'lift'
  | 'liftV';

export interface StickerMesh {
  ready: boolean;
  aspect: number;
  meshX: number;
  meshY: number;
  texel: number;
  mask: Uint8Array | null;
  maskW: number;
  maskH: number;
  hull: StickerHullPoint[];
}

export interface StickerTarget {
  texture: WebGLTexture;
  buffer: WebGLFramebuffer;
  width: number;
  height: number;
}

export interface StickerEngine {
  wake: () => void;
  destroy: () => void;
}

export interface StickerPress {
  id: number;
  grab: { x: number; y: number };
  origin: { x: number; y: number };
  pointer: { x: number; y: number };
  pivot: { x: number; y: number };
  moving: boolean;
  samples: { x: number; y: number; t: number }[];
}

export interface StickerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  placed: boolean;
  swing: number;
  swingV: number;
  peel: number;
  peelV: number;
  lift: number;
  liftV: number;
  dir: number;
  hover: boolean;
  local: { x: number; y: number };
  press: StickerPress | null;
  pivotV: { x: number; y: number };
  light: { x: number; y: number; z: number };
  pointer: { x: number; y: number; inside: boolean };
  intro: number;
}

export interface StickerSettings {
  imageSrc: string;
  width: number;
  rotate: number;
  peelDirection: number;
  hoverPeel: number;
  activePeel: number;
  curlRadius: number;
  finish: number;
  backColor: string;
  lighting: number;
  shadow: number;
  followPointer: boolean;
  draggable: boolean;
  swing: number;
  friction: number;
  bounce: number;
  intro: boolean;
  initialPosition: 'center' | { x: number; y: number };
  onDragStart?: () => void;
  onDragEnd?: () => void;
  dpr?: number;
  reducedMotion: boolean;
}

export interface StickerPeelProps {
  /** Sticker image. Use a PNG with a transparent background so the die-cut outline shows. */
  imageSrc: string;
  /** Width of the sticker in pixels. Minimum 16. */
  width?: number;
  /** Resting rotation of the sticker in degrees. */
  rotate?: number;
  /** Edge that peels, in degrees clockwise from the top. */
  peelDirection?: number;
  /** How far the sticker peels back on hover, as a percentage of its size. */
  peelBackHoverPct?: number;
  /** How far the sticker peels back while pressed or dragged. */
  peelBackActivePct?: number;
  /** Radius of the curl where the sticker bends, in pixels. */
  curlRadius?: number;
  /** Surface of the sticker. Holo turns light areas into foil with rainbow bands and glitter. */
  finish?: StickerFinish;
  /** Color of the back of the sticker, seen on the peeled part. */
  backColor?: string;
  /** Strength of the highlights that follow the cursor, from 0 to 1. */
  lightingIntensity?: number;
  /** Strength of the shadows under the sticker and the peeled part, from 0 to 1. */
  shadowIntensity?: number;
  /** Peels the edge or corner nearest the cursor, and the edge you grab while dragging. */
  followPointer?: boolean;
  /** Lets the sticker be picked up, dragged and thrown around its parent. */
  draggable?: boolean;
  /** How much the sticker swings around the point you hold while dragging, from 0 to 3. */
  swing?: number;
  /** How quickly a thrown sticker slides to a stop, from 0 (ice) to 1 (felt). */
  friction?: number;
  /** How much of its speed a thrown sticker keeps when it hits the edge of its parent. */
  bounce?: number;
  /** Drops the sticker onto the surface on mount and smooths its corner down. */
  intro?: boolean;
  /** Starting position. 'center' or { x, y } offset in pixels from the parent center. */
  initialPosition?: 'center' | { x: number; y: number };
  /** Maximum device pixel ratio, capped at 2. */
  dpr?: number;
  /** Extra classes for the root element. */
  class?: string;
  /** Inline styles for the root element. */
  style?: CSSProperties;
}

export interface StickerPeelEmits {
  /** Fired when the sticker starts being dragged. */
  'drag-start': [];
  /** Fired when a dragged sticker is released. */
  'drag-end': [];
}

/** The tunable look of a sticker: every visual and physics prop. */
export type StickerPeelLook = Required<
  Omit<
    StickerPeelProps,
    | 'imageSrc'
    | 'draggable'
    | 'intro'
    | 'initialPosition'
    | 'dpr'
    | 'class'
    | 'style'
  >
>;

/** A named look override plus the sticker image key it pairs with. */
export type StickerPeelPreset = Partial<StickerPeelLook> & { sticker: string };
