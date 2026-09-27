export interface SparklineProps {
  /** Series values in order. */
  data: number[];
  /** Any CSS color. Defaults to `var(--chart-1)`. */
  color?: string;
  height?: number;
  strokeWidth?: number;
  /** Shades the area under the line. */
  fill?: boolean;
  ariaLabel?: string;
  class?: string;
}
