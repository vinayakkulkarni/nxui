export interface RadialGaugeThreshold {
  /** The band applies from this value upward. */
  from: number;
  color: string;
}

export interface RadialGaugeProps {
  value: number;
  min?: number;
  max?: number;
  /** Caption under the value. */
  label?: string;
  /** Appended to the value, e.g. `%` or ` ms`. */
  unit?: string;
  /** Diameter in pixels. */
  size?: number;
  thickness?: number;
  /** Arc sweep in degrees, centered on 12 o'clock. */
  sweep?: number;
  /** Any CSS color. Ignored when `thresholds` match. */
  color?: string;
  /** Colors the value arc by the highest band the value reaches. */
  thresholds?: RadialGaugeThreshold[];
  ariaLabel?: string;
  class?: string;
}
