export type BubbleMenuEase =
  | 'back.out(1.5)'
  | 'power3.out'
  | 'power2.out'
  | 'elastic.out(1,0.5)'
  | 'bounce.out';

export interface BubbleMenuHoverStyles {
  bgColor?: string;
  textColor?: string;
}

export interface BubbleMenuItem {
  label: string;
  href?: string;
  ariaLabel?: string;
  /** Tilt in degrees, applied on viewports 900px and wider. */
  rotation?: number;
  hoverStyles?: BubbleMenuHoverStyles;
}

export interface BubbleMenuProps {
  /** Image URL for the logo bubble. Use the `logo` slot for markup. */
  logo?: string;
  menuAriaLabel?: string;
  menuBg?: string;
  menuContentColor?: string;
  useFixedPosition?: boolean;
  items?: BubbleMenuItem[];
  animationEase?: BubbleMenuEase;
  /** Seconds. */
  animationDuration?: number;
  /** Seconds between bubbles. */
  staggerDelay?: number;
  class?: string;
}

export interface BubbleMenuTweenOptions {
  duration: number;
  delay?: number;
  ease: (t: number) => number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}
