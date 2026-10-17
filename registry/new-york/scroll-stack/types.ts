export interface ScrollStackProps {
  /** Gap between cards before they stack, in px. */
  itemDistance?: number;
  /** How far each card rests below the one before it in the stack, in px. */
  itemStackDistance?: number;
  /** Where the stack pins. A number is px, or use a % string. */
  stackPosition?: number | string;
  /** How much a card shrinks for each card stacked on top of it. */
  itemScale?: number;
  /** The smallest a buried card can shrink to. */
  baseScale?: number;
  /** How much a card darkens for each card stacked on top, 0–1. */
  dimAmount?: number;
  /** Blur added for each card stacked on top, in px. */
  blurAmount?: number;
  /** How far buried cards lean back in 3D, in degrees. */
  tiltAmount?: number;
  /** How far buried cards turn, alternating left and right, in degrees. */
  rotationAmount?: number;
  /** How long the finished stack stays pinned, in px of scrolling. */
  holdDistance?: number;
  /** Glides mouse wheel scrolling smoothly. */
  smoothScroll?: boolean;
  /** Glides the nearest card onto the stack when scrolling stops near it. */
  snap?: boolean;
  /** Stacks the cards as the page scrolls instead of inside the container. */
  useWindowScroll?: boolean;
  class?: string;
}

export interface ScrollStackItemProps {
  class?: string;
}
