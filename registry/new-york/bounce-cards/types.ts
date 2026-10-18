export interface BounceCardsImage {
  src: string;
  alt?: string;
}

export interface BounceCardsProps {
  /** Images for the cards, from left to right. */
  images?: Array<string | BounceCardsImage>;
  containerWidth?: number;
  containerHeight?: number;
  /** Width and height of each card in px. */
  cardSize?: number;
  /** Horizontal distance between cards in px. */
  spread?: number;
  /** Largest tilt in degrees; each card leans by a different share of it. */
  rotation?: number;
  /** Drops the outer cards by this many px so the fan curves. */
  arc?: number;
  /** Seconds before the first card pops in. */
  animationDelay?: number;
  /** Seconds between cards popping in. */
  animationStagger?: number;
  /** How much the cards overshoot as they pop in, 0–1. */
  bounciness?: number;
  enableHover?: boolean;
  /** How far the other cards slide away from the hovered one, in px. */
  pushDistance?: number;
  hoverScale?: number;
  borderWidth?: number;
  borderColor?: string;
  radius?: number;
  shadow?: boolean;
  /** Custom positions such as "rotate(5deg) translate(-150px)". */
  transformStyles?: string[];
  /** Card click / Enter handler (bind with `@card-click`). Makes cards focusable buttons. */
  onCardClick?: (index: number) => void;
  class?: string;
}

export interface BounceCardsSlot {
  x: number;
  y: number;
  rotate: number;
}

export interface BounceCardsBody extends BounceCardsSlot {
  scale: number;
  vx: number;
  vy: number;
  vr: number;
  vs: number;
  born: number;
}
