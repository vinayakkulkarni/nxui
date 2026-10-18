import type { VNode } from 'vue';

export type CardSwapTheme = 'dark' | 'light';

export interface CardSwapItem {
  title?: string;
  image?: string;
  /** Iconify name, e.g. `lucide:sunset`. */
  icon?: string;
  alt?: string;
}

export interface CardSwapProps {
  items?: CardSwapItem[];
  width?: number;
  height?: number;
  cardDistance?: number;
  verticalDistance?: number;
  depth?: number;
  skewAmount?: number;
  visibleCards?: number;
  delay?: number;
  autoplay?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  speed?: number;
  bounce?: number;
  parallax?: number;
  hoverSpread?: number;
  dim?: number;
  cardRadius?: number;
  intro?: boolean;
  theme?: CardSwapTheme;
  class?: string;
}

export interface CardSwapCardProps {
  class?: string;
}

export interface CardSwapBounds {
  width: number;
  height: number;
  originX: number;
  originY: number;
}

export interface CardSwapSettings {
  width: number;
  height: number;
  dx: number;
  dy: number;
  dz: number;
  skew: number;
  visible: number;
  delay: number;
  autoplay: boolean;
  pauseOnHover: boolean;
  draggable: boolean;
  speed: number;
  bounce: number;
  parallax: number;
  hoverSpread: number;
  dim: number;
  bounds: CardSwapBounds;
}

export interface CardSwapEngineOptions {
  root: HTMLElement;
  stage: HTMLElement;
  count: number;
  intro: boolean;
  reduce: boolean;
  getSlot: (index: number) => HTMLElement | null;
  getShade: (index: number) => HTMLElement | null;
  getSettings: () => CardSwapSettings;
  onChange: (index: number) => void;
  onCardClick: (index: number) => void;
}

export interface CardSwapEngine {
  next: () => void;
  prev: () => void;
  refresh: () => void;
  fit: () => void;
  setInView: (inView: boolean) => void;
  onMove: (event: PointerEvent) => void;
  onLeave: (event: PointerEvent) => void;
  onDown: (event: PointerEvent) => void;
  onUp: (event: PointerEvent) => void;
  onClick: (event: MouseEvent) => void;
  onVisibility: () => void;
  destroy: () => void;
}

export interface CardSwapExpose {
  next: () => void;
  prev: () => void;
}

export interface CardSwapEntry {
  node?: VNode;
  item?: CardSwapItem;
}
