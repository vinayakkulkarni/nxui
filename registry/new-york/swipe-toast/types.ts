export type SwipeToastFuse = 'bottom' | 'top' | 'none';

export type SwipeToastCloseReason =
  | 'timeout'
  | 'swipe'
  | 'action'
  | 'close'
  | 'escape'
  | 'programmatic';

export type SwipeToastPhase = 'open' | 'closing' | 'gone';

export interface SwipeToastProps {
  /** The first line. */
  title?: string;
  /** The dimmer second line. Empty hides it. */
  description?: string;
  /** Iconify name of an 18px icon before the text (or use the `icon` slot). */
  icon?: string;
  /** The inverted button label. Empty hides it. */
  actionLabel?: string;
  /** Flip to false to close from outside. True again re-enters. */
  open?: boolean;
  /** The card surface, and the action text. */
  background?: string;
  /** Ink: title, description and the action fill. */
  color?: string;
  /** The burning line. */
  fuseColor?: string;
  /** Card width in pixels, capped at the parent when inline. */
  width?: number;
  /** Corner radius in pixels. */
  radius?: number;
  /** How long the rise and the drop take, in ms. */
  slideMs?: number;
  /** Overshoot of the return after an abandoned swipe. 0 stops dead. */
  settleBounce?: number;
  /** How far a slow drag must go before release dismisses. */
  swipeDistance?: number;
  /** Milliseconds until it closes itself. 0 keeps it until dismissed. */
  duration?: number;
  /** Which edge the line burns along. */
  fuse?: SwipeToastFuse;
  /** Hovering freezes the line and the timer. */
  pauseOnHover?: boolean;
  /** Adds a cross at the end of the row. */
  closeButton?: boolean;
  /** In flow inside the parent instead of fixed to the viewport corner. */
  inline?: boolean;
  /** Off removes the swipe and Escape. */
  dismissible?: boolean;
  class?: string;
}

export interface SwipeToastDrag {
  id: number;
  startY: number;
  grab: number | null;
  moved: boolean;
  hist: Array<[number, number]>;
}

export interface SwipeToastDemoItem {
  id: number;
  open: boolean;
}
