/** Height, font and padding preset. */
export type FuseButtonSize = 'sm' | 'md' | 'lg';

/** Where the fuse burns: a ring around the pill, or a line along the bottom/top edge. */
export type FuseButtonFuse = 'outline' | 'bottom' | 'top';

/** When `commit` fires: on the press, or only once the fuse burns out. */
export type FuseButtonCommitOn = 'press' | 'fuseEnd';

/** What happens after the fuse burns out. */
export type FuseButtonSettle = 'reset' | 'stay';

/** Interaction phase. */
export type FuseButtonPhase = 'idle' | 'armed' | 'settled';

/** Why `commit` fired. */
export type FuseButtonCommitReason = 'press' | 'fuseEnd';

/** Native button type of the idle face. */
export type FuseButtonType = 'button' | 'submit' | 'reset';

/**
 * Props for the FuseButton registry component.
 */
export interface FuseButtonProps {
  /** The idle action. */
  label?: string;
  /** The armed face that cancels. */
  undoLabel?: string;
  /** Announced on press, and shown when `settle` is `'stay'`. */
  doneLabel?: string;
  /** Iconify name of the idle icon. The `icon` slot overrides it. */
  icon?: string;
  /** Text and icon ink. */
  color?: string;
  /** The pill surface. */
  background?: string;
  /** The lit line or ring. */
  fuseColor?: string;
  /** Height, font and padding preset. */
  size?: FuseButtonSize;
  /** Corner radius in pixels. */
  radius?: number;
  /** How long the undo stays available, in ms. */
  undoWindow?: number;
  /** A ring around the pill, or a line along the bottom or top edge. */
  fuse?: FuseButtonFuse;
  /** Line height or rim stroke in pixels. */
  fuseThickness?: number;
  /** Crossfade between faces, in ms. */
  crossfadeMs?: number;
  /** Fire `commit` on press, or only when the fuse ends. */
  commitOn?: FuseButtonCommitOn;
  /** Hovering the pill pauses the fuse (mouse only). */
  pauseOnHover?: boolean;
  /** Return to idle, or stay done, after the fuse ends. */
  settle?: FuseButtonSettle;
  /** Disables the idle face. */
  disabled?: boolean;
  /** Native type of the idle button. */
  type?: FuseButtonType;
  /** Extra classes for the pill. */
  class?: string;
}
