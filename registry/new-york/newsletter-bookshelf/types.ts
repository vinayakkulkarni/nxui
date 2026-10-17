import type { HTMLAttributes } from 'vue';

export interface NewsletterBookshelfItem {
  id: string;
  title: string;
  /** Printed on the cover and shown in the hover tooltip. */
  date: string;
  subtitle?: string;
  /** Opened when an already-focused book is activated again (http/https only). */
  href?: string;
  /** Cloth colour (hex). Falls back to a seeded palette pick. */
  color?: string;
  /** Foil/ink colour (hex). Falls back to cream on dark cloth, blue on light. */
  foil?: string;
}

export interface NewsletterBookshelfProps {
  items?: NewsletterBookshelfItem[];
  /** Stage height — number = px, string = any CSS length. */
  height?: number | string;
  /** Wordmark printed on every generated cover. */
  brand?: string;
  class?: HTMLAttributes['class'];
}

export interface NewsletterBookshelfEmits {
  select: [item: NewsletterBookshelfItem, index: number];
}

export interface BookLayout extends NewsletterBookshelfItem {
  x: number;
  width: number;
  bookHeight: number;
  depth: number;
  motif: number;
  color: string;
  foil: string;
}

export type BookFace = 'cover' | 'spine';

/** Mutable camera/orbit targets shared between the Vue shell and the engine. */
export interface ShelfRig {
  cameraX: number;
  yaw: number;
  pitch: number;
}

export interface ShelfBounds {
  min: number;
  max: number;
  visibleSpan: number;
}

export interface ShelfViewState {
  hoveredIndex: number | null;
  selectedIndex: number | null;
  reducedMotion: boolean;
}

/** Snapshot a book flies from when it enters or leaves the focused view. */
export interface BookFlight {
  startedAt: number;
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
}

export type ShelfGestureMode = 'pending' | 'drag' | 'orbit';

export interface ShelfGesture {
  mode: ShelfGestureMode;
  x: number;
  y: number;
  startX: number;
  startY: number;
  downIndex: number | null;
}

export interface BookshelfEngine {
  setBooks: (books: BookLayout[], brand: string) => void;
  setView: (view: ShelfViewState) => void;
  /** Advance one frame (seconds since the previous frame) and render. */
  frame: (delta: number) => void;
  resize: (width: number, height: number) => void;
  /** Index of the book under the given client point, or null. */
  pick: (clientX: number, clientY: number) => number | null;
  dispose: () => void;
}
