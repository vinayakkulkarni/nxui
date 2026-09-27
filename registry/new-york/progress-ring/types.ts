export interface ProgressRingProps {
  /** Progress from 0 to 100. */
  value: number;
  /** Diameter in pixels. */
  size?: number;
  thickness?: number;
  /** Any CSS color. Defaults to `var(--chart-1)`. */
  color?: string;
  trackColor?: string;
  /** Caption under the percentage. */
  label?: string;
  ariaLabel?: string;
  class?: string;
}
