export interface AreaChartDatum {
  label: string;
  value: number;
}

export interface AreaChartProps {
  data: AreaChartDatum[];
  /** Any CSS color. Defaults to `var(--chart-1)`. */
  color?: string;
  height?: number;
  strokeWidth?: number;
  /** Horizontal grid lines at the y-axis ticks. */
  grid?: boolean;
  /** Shows the x and y axes. */
  axes?: boolean;
  ariaLabel?: string;
  class?: string;
}
