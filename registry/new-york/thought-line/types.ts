/** Built-in glyph that breathes beside the label. Use the `glyph` slot for a custom mark. */
export type ThoughtLineGlyph = 'sparkle' | 'dot' | 'none';

/**
 * Props for the ThoughtLine registry component.
 */
export interface ThoughtLineProps {
  /** The working line. It breathes, and it is the spoken text. */
  label?: string;
  /** The settled line. Empty gives "Thought for", or "Done thinking" without the timer. */
  doneLabel?: string;
  /** The mark that breathes and dims. */
  glyph?: ThoughtLineGlyph;
  /** The trace beneath the line. The last step is current, earlier ones tick. */
  steps?: string[];
  /** The line becomes a toggle for the trace, with a chevron. */
  collapsible?: boolean;
  /** Fold the trace into the line when it settles. */
  collapseOnSettle?: boolean;
  /** The ink of the line and the trace. */
  color?: string;
  /** The glyph alone. Empty follows the ink. */
  glyphColor?: string;
  /** Type size in px. Everything scales in em. */
  fontSize?: number;
  /** One breath, up and down, in seconds. */
  breathPeriod?: number;
  /** How far the glyph and label dim at the trough. 0 is no breath. */
  breathDepth?: number;
  /** A band of ink sweeps the working label. */
  shimmer?: boolean;
  /** One shimmer sweep, in seconds. */
  shimmerDuration?: number;
  /** The settle chord, in ms: crossfade, dim, glide, fold. */
  settleDuration?: number;
  /** Blur through the crossfade seam, in px. */
  settleBlur?: number;
  /** Working or settled. True again starts a new clock. */
  working?: boolean;
  /** Seconds after which the line settles by itself. 0 waits for `working`. */
  settleAfter?: number;
  /** Controlled seconds. The internal clock never runs. */
  elapsed?: number;
  /** The live clock that freezes into the sentence. */
  showTimer?: boolean;
  /** Extra classes for the root. */
  class?: string;
}
