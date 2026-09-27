export interface DonutChartDatum {
  label: string;
  value: number;
  /** Any CSS color. Falls back to the `--chart-1`…`--chart-5` palette. */
  color?: string;
}

export interface DonutChartProps {
  data: DonutChartDatum[];
  /** Diameter in pixels. */
  size?: number;
  /** Ring thickness in pixels. */
  thickness?: number;
  /** Empty angle between slices, in radians. */
  gap?: number;
  cornerRadius?: number;
  /** Caption under the total in the center. */
  centerLabel?: string;
  legend?: boolean;
  ariaLabel?: string;
  class?: string;
}
