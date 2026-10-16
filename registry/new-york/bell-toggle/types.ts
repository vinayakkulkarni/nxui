export type BellToggleSize = 'sm' | 'md' | 'lg';

export interface BellToggleProps {
  offLabel?: string;
  onLabel?: string;
  /** Iconify name for the bell glyph. Ignored when `clapper` is on. */
  icon?: string;
  /** Accessible name; defaults to `offLabel`. */
  label?: string;
  color?: string;
  background?: string;
  onColor?: string;
  onBackground?: string;
  size?: BellToggleSize;
  radius?: number;
  ringAmplitude?: number;
  ringPasses?: number;
  ringDecay?: number;
  ringDuration?: number;
  ringPivot?: number;
  crossfadeMs?: number;
  revealBounce?: number;
  count?: number;
  badge?: boolean;
  badgeColor?: string;
  badgeTextColor?: string;
  waves?: boolean;
  clapper?: boolean;
  /** Controlled state (`v-model:pressed`). */
  pressed?: boolean;
  defaultPressed?: boolean;
  disabled?: boolean;
  class?: string;
}

/** [height, font size, icon size, horizontal padding, gap] in px. */
export type BellToggleSizePreset = [number, number, number, number, number];

export type BellToggleInput = 'pointer' | 'keyboard';
