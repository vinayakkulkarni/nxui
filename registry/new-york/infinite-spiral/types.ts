import type { HTMLAttributes } from 'vue';

export type InfiniteSpiralTarget = '_blank' | '_self' | '_parent' | '_top';

export interface InfiniteSpiralItem {
  id?: string | number;
  /** Image URL. */
  src: string;
  /** Alt text. Defaults to "Spiral image N". */
  alt?: string;
  /** When set, the card is a link. */
  href?: string;
  /** Link target. */
  target?: InfiniteSpiralTarget;
  /** Accessible name of the card. Defaults to the alt text. */
  label?: string;
}

export type InfiniteSpiralDirection = 'up' | 'down';

export type InfiniteSpiralAnimationMode = 'auto' | 'drag' | 'scroll' | 'all';

export type InfiniteSpiralImageFit =
  | 'cover'
  | 'contain'
  | 'fill'
  | 'none'
  | 'scale-down';

export interface InfiniteSpiralProps {
  /** Image URLs or item objects. */
  items?: Array<string | InfiniteSpiralItem>;
  /** Auto-play speed in cards per second. */
  speed?: number;
  /** Auto-play direction. */
  direction?: InfiniteSpiralDirection;
  /** auto plays by itself, drag follows the pointer, scroll follows page scroll, all combines them. */
  animationMode?: InfiniteSpiralAnimationMode;
  /** Helix radius in pixels (shrinks on narrow containers). */
  radius?: number;
  /** Card width in pixels. */
  cardWidth?: number;
  /** Card height in pixels. */
  cardHeight?: number;
  /** Vertical distance between neighbouring cards in pixels. */
  verticalSpacing?: number;
  /** Perspective distance in pixels. */
  perspective?: number;
  /** Cards in one full turn of the helix. */
  cardsPerTurn?: number;
  /** Extra rotation of the helix in degrees. */
  rotation?: number;
  /** In-plane tilt of every card in degrees. */
  cardTilt?: number;
  /** Card corner radius in pixels. */
  cardRadius?: number;
  /** Scale of the card at the centre of the helix. */
  centerScale?: number;
  /** Fraction of the helix length that fades out at each end (0–1). */
  edgeFade?: number;
  /** Largest blur in pixels on cards near the ends. */
  edgeBlur?: number;
  /** Pause auto-play while the pointer is over the spiral. */
  pauseOnHover?: boolean;
  /** CSS object-fit of the images. */
  imageFit?: InfiniteSpiralImageFit;
  /** Grayscale amount of the images (0–1). */
  grayscale?: number;
  class?: HTMLAttributes['class'];
}

export interface InfiniteSpiralNormalizedItem extends InfiniteSpiralItem {
  alt: string;
  key: string;
}
