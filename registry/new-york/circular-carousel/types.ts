/** One image placed on the ring. */
export interface CircularCarouselItem {
  /** Image URL. */
  src: string;
  /** Text announced to screen readers. */
  alt?: string;
  /** Caption title. */
  title?: string;
  /** Caption subtitle. */
  subtitle?: string;
}

/** Shape of the ring. */
export type CircularCarouselPreset =
  | 'cylinder'
  | 'orbit'
  | 'wheel'
  | 'panorama';

/** Entrance played once the images load. */
export type CircularCarouselIntro = 'assemble' | 'rise' | 'spin' | 'none';

/** How the ring moves on its own. */
export type CircularCarouselAutoplay = 'drift' | 'step' | 'off';

/** Which way the front cards travel. */
export type CircularCarouselDirection = 'left' | 'right';

/** Spin axis of the ring. */
export type CircularCarouselAxis = 'x' | 'y';

/**
 * Props for the CircularCarousel registry component.
 */
export interface CircularCarouselProps {
  /** Images placed around the ring. */
  items?: CircularCarouselItem[];
  /** Shape of the ring. */
  preset?: CircularCarouselPreset;
  /** Entrance once the images load. */
  intro?: CircularCarouselIntro;
  /** Card width in px. */
  cardWidth?: number;
  /** Card width divided by its height. */
  aspectRatio?: number;
  /** Space between neighbouring cards, in px. */
  gap?: number;
  /** Card bend from 0 (flat) to 1 (wrapped). Defaults to the preset. */
  curve?: number;
  /** Camera angle in degrees. Defaults to the preset. */
  tilt?: number;
  /** Camera distance in px. Defaults to the preset. */
  perspective?: number;
  /** Drift, step or off. */
  autoplay?: CircularCarouselAutoplay;
  /** Drift speed in degrees per second. */
  speed?: number;
  /** Seconds between moves in step mode. */
  interval?: number;
  /** Which way the front cards travel. */
  direction?: CircularCarouselDirection;
  /** Grab and throw the ring with pointer or horizontal scroll. */
  draggable?: boolean;
  /** How long a throw keeps gliding, from 0 to 1. */
  momentum?: number;
  /** Settle on a card when the ring comes to rest. */
  snap?: boolean;
  /** Ease the ring to a stop while the pointer is over it. */
  pauseOnHover?: boolean;
  /** Clicking a card turns it to the front. */
  focusOnClick?: boolean;
  /** How much the camera leans toward the pointer, from 0 to 1. */
  parallax?: number;
  /** How much the ring swells when it spins fast, from 0 to 1. */
  stretch?: number;
  /** How strongly cards fade into fadeColor as they turn away. */
  depthFade?: number;
  /** Color distant cards fade toward. Any CSS color, including var(). */
  fadeColor?: string;
  /** Brightness of the inside faces, from 0 to 1. */
  innerShade?: number;
  /** Corner radius of the cards, in px. */
  cornerRadius?: number;
  /** Show the front card title, subtitle and position. */
  captions?: boolean;
  /** Extra classes on the root. */
  class?: string;
}

/** Ring geometry for a preset. */
export interface CircularCarouselLayout {
  axis: CircularCarouselAxis;
  tilt: number;
  perspective: number;
  curve: number;
  spread: number;
  inward: boolean;
  billboard: boolean;
  backfaces: boolean;
  /** Visible arc, in card steps, used when fitting (0 = full ring). */
  arc: number;
}

/** One strip of a bent card. */
export interface CircularCarouselTile {
  index: number;
  total: number;
  start: number;
  end: number;
  size: number;
  move: string;
}

/** A rendered face (front or back) of one strip. */
export interface CircularCarouselFace {
  key: string;
  back: boolean;
  tileStyle: Record<string, string>;
  frameStyle: Record<string, string>;
  photoStyle: Record<string, string>;
}

/** Resolved settings read by the animation loop. */
export interface CircularCarouselSettings {
  count: number;
  step: number;
  radius: number;
  layout: CircularCarouselLayout;
  axis: CircularCarouselAxis;
  tilt: number;
  perspective: number;
  cardW: number;
  cardH: number;
  intro: CircularCarouselIntro;
  autoplay: CircularCarouselAutoplay;
  speed: number;
  interval: number;
  draggable: boolean;
  momentum: number;
  snap: boolean;
  pauseOnHover: boolean;
  parallax: number;
  stretch: number;
  depthFade: number;
  captions: boolean;
  reduced: boolean;
}

export interface CircularCarouselSample {
  time: number;
  angle: number;
}

export interface CircularCarouselPress {
  id: number;
  x: number;
  y: number;
  angle: number;
  moved: boolean;
  origin: number;
  samples: CircularCarouselSample[];
}

/** Mutable state owned by the animation loop. */
export interface CircularCarouselState {
  angle: number;
  velocity: number;
  target: number | null;
  dir: number;
  press: CircularCarouselPress | null;
  drag: boolean;
  hover: boolean;
  pointer: { inside: boolean; x: number; y: number };
  yaw: number;
  pitch: number;
  intro: { type: CircularCarouselIntro; start: number } | null;
  introDone: boolean;
  holdUntil: number;
  stepAt: number;
  suppressClick: boolean;
  wheelTimer: ReturnType<typeof setTimeout> | undefined;
  fit: number;
  shift: number;
  drop: number;
  last: number;
}

/** Per-card intro modifier. */
export interface CircularCarouselIntroPose {
  radius: number;
  lift: number;
}

/** Previous images crossfading out after an items swap. */
export interface CircularCarouselLeaving {
  id: number;
  items: CircularCarouselItem[];
  delays: number[];
}

export type CircularCarouselVec3 = [number, number, number];
