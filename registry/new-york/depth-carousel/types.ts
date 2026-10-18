export interface DepthCarouselSlide {
  image: string;
  alt?: string;
}

export type DepthCarouselItem = string | DepthCarouselSlide;

export type DepthCarouselTiltDirection = 'left' | 'right';

export interface DepthCarouselProps {
  /** Slides to display: image URLs or objects with an image URL and alt text. */
  items?: DepthCarouselItem[];
  /** Width of each card in px. */
  cardWidth?: number;
  /** Height of each card in px. */
  cardHeight?: number;
  /** Corner rounding of the cards in px. */
  radius?: number;
  /** Colour multiplied over cards as they recede. */
  tint?: string;
  /** Z distance in px between cards along the depth rail. */
  depth?: number;
  /** Lateral offset in px applied per card. */
  spread?: number;
  /** Degrees each receding card rotates around the vertical axis. */
  tilt?: number;
  /** Which side the stack fans and tilts toward. */
  tiltDirection?: DepthCarouselTiltDirection;
  /** CSS perspective in px. */
  perspective?: number;
  /** How many cards deep stay visible before further ones fade out. */
  visibleCards?: number;
  /** How quickly brightness, tint and blur ramp up with depth. */
  falloff?: number;
  /** Maximum blur in px on the furthest visible card. */
  blur?: number;
  /** Length of the advance transition in ms. */
  duration?: number;
  /** GSAP-style easing name, e.g. `power3.out`, `expo.out`, `back.out(1.4)`, `none`. */
  ease?: string;
  /** Auto-advance, pausing on hover or focus. */
  autoplay?: boolean;
  /** Delay between auto-advances in ms. */
  autoplayDelay?: number;
  /** Wrap from the last card back to the first. */
  loop?: boolean;
  /** Show the previous and next arrow buttons. */
  showControls?: boolean;
  /** Show the dot indicators. */
  showIndicators?: boolean;
  class?: string;
}

export interface DepthCarouselEmits {
  change: [index: number, item: DepthCarouselSlide];
}

export interface DepthCarouselDrag {
  x: number;
  startPos: number;
  lastX: number;
  lastT: number;
  v: number;
  moved: boolean;
  id: number;
}

export type DepthCarouselEase = (t: number) => number;
