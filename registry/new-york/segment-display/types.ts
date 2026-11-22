/** One of the seven bars of a digit, clockwise from the top, then the middle. */
export type SegmentName = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

export interface SegmentCell {
  /** Segments lit for this cell. */
  lit: ReadonlySet<SegmentName>;
  /** A decimal point follows this cell. */
  dot: boolean;
  /** Cell is a colon (two dots), rendered narrower. */
  colon: boolean;
}

export interface SegmentDisplayProps {
  /** Text to show. Digits, `-`, `_`, space, `.`, `:` and the letters A–F, H, L, P, U render. */
  value: string | number;
  /** Pad on the left to at least this many cells with unlit digits. */
  digits?: number;
  /** Lit segment color. Any CSS color; defaults to the current text color. */
  color?: string;
  /** Opacity of unlit segments, so every digit shows a faint `8` behind it. */
  ghost?: number;
  /** Adds a soft glow around lit segments. */
  glow?: boolean;
  /** Slant in degrees. Positive leans right. */
  slant?: number;
  /** Accessible label. Defaults to the value. */
  label?: string;
  class?: string;
}
