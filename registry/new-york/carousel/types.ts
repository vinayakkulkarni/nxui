import type { ComputedRef, Ref } from 'vue';

export type CarouselEffect = 'tilt' | 'slide' | 'scale' | 'fade' | 'cube';

export type CarouselIndicator = 'dots' | 'bars' | 'counter' | 'none';

export type CarouselTheme = 'dark' | 'light';

export interface CarouselItem {
  /** Stable key for the card. Falls back to the index. */
  id?: number | string;
  /** Photo that fills the card. */
  image?: string;
  /** Alt text for the photo. */
  alt?: string;
  /** Iconify icon name shown in the badge, e.g. `lucide:timer`. */
  icon?: string;
  title?: string;
  description?: string;
}

/** Objects get the built-in card; strings are used as image URLs. */
export type CarouselEntry = CarouselItem | string;

export interface CarouselProps {
  items?: CarouselEntry[];
  /** Width in px, or any CSS width. Never grows past its container. */
  baseWidth?: number | string;
  /** Card width divided by its height. */
  aspectRatio?: number;
  /** Space on each side of the active card where neighbours show, in px. */
  peek?: number;
  gap?: number;
  radius?: number;
  frame?: boolean;
  effect?: CarouselEffect;
  indicator?: CarouselIndicator;
  arrows?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  draggable?: boolean;
  round?: boolean;
  initialIndex?: number;
  theme?: CarouselTheme;
  class?: string;
}

export interface CarouselCard extends CarouselItem {
  key: number | string;
}

export interface CarouselSettings {
  count: number;
  mode: CarouselEffect;
  width: number;
  bleed: number;
  inset: number;
  cardWidth: number;
  span: number;
  loop: boolean;
  autoplay: boolean;
  autoplayDelay: number;
  pauseOnHover: boolean;
  draggable: boolean;
  bars: boolean;
  shade: number;
}

export interface CarouselPose {
  transform: string;
  opacity: number;
  visible: boolean;
  layer: number;
  shade: number;
  focus: number;
}

export interface CarouselEngine {
  goTo: (index: number) => void;
  step: (direction: number, auto?: boolean) => void;
  sync: () => void;
}

export interface CarouselDragState {
  id: number;
  x: number;
  y: number;
  p: number;
  from: number;
  moved: boolean;
  samples: Array<[number, number]>;
}

export interface CarouselEngineOptions {
  root: Ref<HTMLElement | null>;
  viewport: Ref<HTMLElement | null>;
  settings: ComputedRef<CarouselSettings>;
  slides: Array<HTMLElement | null>;
  shades: Array<HTMLElement | null>;
  fills: Array<HTMLElement | null>;
  active: Ref<number>;
}

export interface CarouselEngineState {
  p: number;
  v: number;
  target: number;
  shown: number;
  elapsed: number;
  hovered: boolean;
  focused: boolean;
  visible: boolean;
  drag: CarouselDragState | null;
  wheeling: boolean;
  wheelTimer: number;
  suppress: boolean;
  last: number;
}

export interface CarouselControlsProps {
  count: number;
  active: number;
  indicator: CarouselIndicator;
  arrows: boolean;
  autoplay: boolean;
  loop: boolean;
  atStart: boolean;
  atEnd: boolean;
  /** Width of the controls row in px (matches the card). */
  width: number;
  /** Registers a bar fill element so the engine can drive its timer. */
  bindFill: (el: unknown, index: number) => void;
}
