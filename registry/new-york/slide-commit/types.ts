/** Lifecycle phase of the slider. */
export type SlideCommitPhase = 'idle' | 'pending' | 'done' | 'error';

/**
 * Props for the SlideCommit registry component.
 */
export interface SlideCommitProps {
  /** Track text, and the accessible name. */
  label?: string;
  /** Pill text after success. */
  doneLabel?: string;
  /** Track text after a failure. */
  errorLabel?: string;
  /**
   * Runs when the handle reaches the end (also bound by `@confirm`).
   * Return a promise to show the spinner until it settles; a rejection shakes and returns.
   */
  onConfirm?: () => unknown;
  /** Track fill. */
  trackColor?: string;
  /** Handle fill. Text on it picks black or white for contrast. */
  handleColor?: string;
  /** Pill fill on success. */
  successColor?: string;
  /** Handle fill and error text on failure. */
  dangerColor?: string;
  /** Width in pixels. */
  width?: number;
  /** Height in pixels. */
  height?: number;
  /** Corner radius in pixels, capped at half the height. */
  radius?: number;
  /** How quickly the handle travels on its springs, 0 to 100. */
  speed?: number;
  /** Bounce when the handle springs back home. */
  returnBounce?: number;
  /** How far the track dips when the pill lands. 0 turns it off. */
  landingDip?: number;
  /** How long the done pill stays before it resets, in ms. 0 keeps it. */
  holdMs?: number;
  /** Dims the slider and ignores input. */
  disabled?: boolean;
  /** Additional classes on the root element. */
  class?: string;
}

/** Internal drag state while the handle is held. */
export interface SlideCommitGrip {
  id: number;
  grab: number | null;
  moved: boolean;
  hist: Array<[number, number]>;
}
