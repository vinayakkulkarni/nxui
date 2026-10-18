/** Built-in glyph. Use the `icon` slot for a custom one. */
export type PulseHeartIcon = 'heart' | 'star' | 'thumb';

/** One cell of the rendered count: a static character or a rolling slot. */
export type PulseHeartCell = { ch: string } | { top: string; bottom: string };

/** In-flight count roll between two formatted values. */
export interface PulseHeartRoll {
  a: string;
  b: string;
  /** Index of the single changed character, or -1 to roll the whole number. */
  at: number;
  up: boolean;
}

/**
 * Props for the PulseHeart registry component.
 * Use `v-model:liked` for a controlled state; leave `liked` unset for uncontrolled.
 */
export interface PulseHeartProps {
  /** Controlled liked state. Leave undefined to let the button own it. */
  liked?: boolean;
  /** Initial state when uncontrolled. */
  defaultLiked?: boolean;
  /** The number shown; a press adds or removes one. */
  count?: number;
  /** Show the count beside the glyph. */
  showCount?: boolean;
  /** Built-in glyph. */
  icon?: PulseHeartIcon;
  /** Idle glyph is an outline; false makes it solid. */
  idleOutline?: boolean;
  /** Glyph size in px; the pill and text scale with it. */
  size?: number;
  /** Pill corner radius in px. */
  corner?: number;
  /** Glyph colour when liked. */
  likedColor?: string;
  /** Glyph colour when idle. */
  idleColor?: string;
  /** Pill background. */
  pillColor?: string;
  /** Count colour. */
  textColor?: string;
  /** The whole pulse, in ms. */
  duration?: number;
  /** How small the glyph contracts, as a fraction of its size. */
  dotSize?: number;
  /** Back-ease overshoot of the swell. */
  overshoot?: number;
  /** How much the pill contracts with the beat, in percent. */
  beat?: number;
  /** Count roll duration, in ms. */
  rollDuration?: number;
  /** Disables the button. */
  disabled?: boolean;
  /** Accessible name. */
  label?: string;
  /** Extra classes for the button. */
  class?: string;
}
