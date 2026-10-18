export type CallChipStatus = 'idle' | 'running' | 'done' | 'error';

export type CallChipIcon = 'terminal' | 'file' | 'search' | 'edit';

export type CallChipGlyph = 'tool' | 'check' | 'retry';

export interface CallChipProps {
  /** Tool glyph preset, or any Iconify name (e.g. `lucide:globe`). The `icon` slot overrides both. */
  icon?: CallChipIcon | string;
  /** The tool name. */
  name?: string;
  /** The argument. */
  argument?: string;
  /** Running wipes the fill and ticks the counter; done completes it with a wash; error stops, tints and shakes. */
  status?: CallChipStatus;
  /** Milliseconds the fill takes to reach its 90% park. */
  expectedMs?: number;
  /** Chip height in pixels. Font, padding and glyph follow. */
  size?: number;
  /** Corner radius in pixels. */
  radius?: number;
  /** Ink for the text and the tool glyph. */
  color?: string;
  /** The chip surface. */
  surfaceColor?: string;
  /** The fill that wipes across while running. */
  progressColor?: string;
  /** Strength of the running fill (0–1). */
  progressOpacity?: number;
  /** The success wash and the check. */
  doneColor?: string;
  /** The stopped fill and the retry glyph on error. */
  errorColor?: string;
  /** Strength of the success wash and of the error tint (0–1). */
  washOpacity?: number;
  /** Error shake amplitude in pixels. 0 tints only. */
  shake?: number;
  /** Shows the millisecond counter. */
  showTimer?: boolean;
  /** Bound by `@retry`. When set, the failed chip becomes a retry button. */
  onRetry?: () => void;
  class?: string;
}
