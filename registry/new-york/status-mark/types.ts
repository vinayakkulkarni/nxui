export type StatusMarkStatus =
  | 'pending'
  | 'running'
  | 'done'
  | 'failed'
  | 'cancelled';

export interface StatusMarkProps {
  /** Pending is a dashed ring. Running spins an arc, or fills to `progress`. Done draws a check, failed and cancelled a cross. */
  status?: StatusMarkStatus;
  /** 0 to 1. While running, fills the ring to this share instead of spinning. */
  progress?: number;
  /** Task text beside the mark. The default slot overrides it. */
  label?: string;
  /** Ink for the ring and the label. */
  color?: string;
  /** The check and its ring. */
  doneColor?: string;
  /** The cross and its ring on failure. */
  errorColor?: string;
  /** Glyph size in px. */
  size?: number;
  /** Stroke width in the 24-unit viewBox. */
  strokeWidth?: number;
  /** Dashes in the pending ring. */
  dashes?: number;
  /** Label size in px. */
  fontSize?: number;
  /** Milliseconds per spin while running without progress. */
  spinDuration?: number;
  /** Share of the ring the spinning arc covers. */
  arcLength?: number;
  /** Milliseconds to draw the check or cross. */
  drawDuration?: number;
  /** Tint inside the ring when done or failed. */
  fillOpacity?: number;
  /** Strikes the label through when done. */
  strike?: boolean;
  /** Extra delay before the strike, in ms. */
  strikeDelay?: number;
  class?: string;
}
