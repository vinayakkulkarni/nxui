export type TargetCursorBlendMode =
  | 'normal'
  | 'difference'
  | 'exclusion'
  | 'multiply'
  | 'screen'
  | 'overlay';

export interface TargetCursorProps {
  /** CSS selector for the elements the brackets lock onto. */
  targetSelector?: string;
  /** Color of the brackets and dot. */
  cursorColor?: string;
  /** Color the cursor blends to while locked onto a target. */
  cursorColorOnTarget?: string;
  /** Seconds per turn while the cursor roams. 0 stops the spin. */
  spinDuration?: number;
  /** How long the brackets take to snap onto a target, in seconds. */
  hoverDuration?: number;
  /** Lets the locked brackets lean slightly toward the cursor. */
  parallaxOn?: boolean;
  /** Hides the system cursor while this cursor is shown. */
  hideDefaultCursor?: boolean;
  /** Size of the reticle while roaming, in px. */
  size?: number;
  /** Length of each bracket arm, in px. */
  cornerSize?: number;
  /** Stroke width of the brackets, in px. */
  thickness?: number;
  /** Gap between a locked target and the brackets, in px. */
  padding?: number;
  /** Rounds the brackets to follow the target's corner radius. */
  matchRadius?: boolean;
  /** Size of the center dot, in px. 0 hides it. */
  dotSize?: number;
  /** CSS blend mode of the cursor. */
  blendMode?: TargetCursorBlendMode;
  /** Shows the data-cursor-label text of a locked target above the brackets. */
  showLabel?: boolean;
  /** Squeezes the brackets and dot while the mouse button is held. */
  clickEffect?: boolean;
  /** Limits the cursor to one element (or selector). By default it works across the page. */
  container?: HTMLElement | string | null;
}

export interface TargetCursorSettings {
  targetSelector: string;
  cursorColor: string;
  cursorColorOnTarget: string | undefined;
  spinDuration: number;
  hoverDuration: number;
  parallaxOn: boolean;
  hideDefaultCursor: boolean;
  size: number;
  cornerSize: number;
  thickness: number;
  padding: number;
  matchRadius: boolean;
  dotSize: number;
  showLabel: boolean;
  clickEffect: boolean;
  container: HTMLElement | null;
  reduce: boolean;
}

export interface TargetCursorElements {
  root: HTMLElement;
  corners: HTMLElement[];
  dot: HTMLElement | null;
  label: HTMLElement | null;
}

export interface TargetCursorEngine {
  wake: () => void;
  destroy: () => void;
}
