import type { HTMLAttributes } from 'vue';

export interface WakeSliderProps {
  /** Controlled value (`v-model`). */
  modelValue?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  /** Lowest value. */
  min?: number;
  /** Highest value. */
  max?: number;
  /** Snapping grid. Large steps move the handle in notches. */
  step?: number;
  /** How many bars draw the track. */
  bars?: number;
  /** Full bar height in pixels, the ceiling of the wake. */
  height?: number;
  /** Bar height at rest in pixels. */
  restHeight?: number;
  /** Space between bars in pixels. */
  gap?: number;
  /** Lit bars, up to the value. */
  fillColor?: string;
  /** Unlit bars. */
  trackColor?: string;
  /** Optional tint the raised bars take on by their lift. Empty renders no tint layer. */
  crestColor?: string;
  /** How easily speed raises the wake. */
  sensitivity?: number;
  /** Half-width of the wake at full speed, in bars. */
  reach?: number;
  /** How much wider the wake is behind the handle than ahead. 0 is symmetric. */
  skew?: number;
  /** Seconds the handle takes to settle. */
  glide?: number;
  /** Milliseconds of velocity lag. */
  smoothing?: number;
  /** Shows the value beside the track. */
  showValue?: boolean;
  /** Formats the readout and the announced value. */
  formatValue?: (value: number) => string;
  /** Fades the slider and ignores input. */
  disabled?: boolean;
  /** Accessible name of the slider. */
  ariaLabel?: string;
  class?: HTMLAttributes['class'];
}
