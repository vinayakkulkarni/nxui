export interface MasonryItem {
  id: string | number;
  img: string;
  /** Natural width. With `height`, the tile lays out without measuring the image. */
  width?: number;
  /** Natural height. */
  height?: number;
  title?: string;
  description?: string;
  alt?: string;
  url?: string;
  /** Number of columns the tile covers. */
  span?: number;
}

export type MasonryColumns = 'auto' | number;

export type MasonryAnimateFrom =
  | 'bottom'
  | 'top'
  | 'left'
  | 'right'
  | 'center'
  | 'random'
  | 'none';

export type MasonryHoverEffect = 'zoom' | 'lift' | 'tilt' | 'none';

export type MasonryCaptions = 'hover' | 'always' | 'none';

export interface MasonryProps {
  items?: MasonryItem[];
  columns?: MasonryColumns;
  columnWidth?: number;
  gap?: number;
  radius?: number;
  animateFrom?: MasonryAnimateFrom;
  stagger?: number;
  duration?: number;
  bounce?: number;
  blurToFocus?: boolean;
  revealOnScroll?: boolean;
  hoverEffect?: MasonryHoverEffect;
  focusOnHover?: boolean;
  captions?: MasonryCaptions;
  parallax?: number;
  lightbox?: boolean;
  draggable?: boolean;
  /** Called on click (`@item-click`). Call `event.preventDefault()` to skip the lightbox or link. */
  onItemClick?: (item: MasonryItem, index: number, event: MouseEvent) => void;
  /** Called with the new order after a drag (`@reorder`). */
  onReorder?: (items: MasonryItem[]) => void;
  class?: string;
}

export type MasonryMeasured = Record<string, number>;

export interface MasonryGrid {
  count: number;
  size: number;
}

export interface MasonryRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MasonryTile extends MasonryRect {
  item: MasonryItem;
  id: string;
}

export interface MasonryLayout {
  tiles: MasonryTile[];
  height: number;
}

export interface MasonrySpring {
  x: number;
  y: number;
  s: number;
  vx: number;
  vy: number;
  vs: number;
  tx: number;
  ty: number;
  w: number;
  h: number;
  shown: boolean;
  dragging: boolean;
  blur: boolean;
  reveal: number;
  start: number;
}

export interface MasonryGhost {
  id: string;
  item: MasonryItem;
  x: number;
  y: number;
  s: number;
  w: number;
  h: number;
}

export interface MasonryDrag {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  active: boolean;
  moved: boolean;
}

export interface MasonryLightboxFrame {
  left: number;
  top: number;
  width: number;
  height: number;
  room: number;
}
