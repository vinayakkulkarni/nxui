/** Time span shown by the chart. */
export type PowerMonitorRange = 'day' | 'week' | 'month' | 'year';

export interface PowerMonitorTick {
  /** Position along the chart, from 0 (left edge) to 1 (right edge). */
  at: number;
  label: string;
}

export interface PowerMonitorSummaryRow {
  label: string;
  value: string;
  /** Colour of the small LED square in front of the row. */
  color: string;
  /** Dim the LED, e.g. for a forecast row. */
  dim?: boolean;
}

export interface PowerMonitorSeries {
  range: PowerMonitorRange;
  /** Label in the segmented control, e.g. `Day`. */
  label: string;
  /** Text shown next to the segmented control, e.g. `Oct 15`. */
  date: string;
  /** Unit for chart values, e.g. `kW` or `kWh`. */
  unit: string;
  /** Solar per column. Drawn above the baseline. */
  solar: number[];
  /** Home use per column. Drawn below the baseline. */
  home: number[];
  /** Cursor label per column, e.g. `14:20`. */
  columnLabels: string[];
  ticks: PowerMonitorTick[];
  /** Column index of "now". Later columns are drawn dimmed as a forecast. */
  now: number;
  summary: PowerMonitorSummaryRow[];
}

export interface PowerMonitorCursor {
  index: number;
  label: string;
  solar: number;
  home: number;
  forecast: boolean;
}

export interface PowerMonitorChartProps {
  solar: number[];
  home: number[];
  columnLabels: string[];
  ticks: PowerMonitorTick[];
  now: number;
  /** Changes when the range changes, to replay the reveal. */
  revealKey: string;
  rowsUp: number;
  rowsDown: number;
  color: string;
  homeColor: string;
}

export interface PowerMonitorProps {
  title?: string;
  /** Replaces the automatic `Live · updated 2 s ago` line. */
  subtitle?: string;
  /** Text in the status pill. */
  status?: string;
  /** Solar production right now, in kW. */
  solar?: number;
  /** Peak production today, in kW. */
  peak?: number;
  /** Home use right now, in kW. */
  home?: number;
  /** Power going into the battery, in kW. */
  toBattery?: number;
  /** Power exported to the grid, in kW. */
  exportPower?: number;
  /** Let live values drift gently on their own. */
  live?: boolean;
  /** Milliseconds between live updates. */
  interval?: number;
  /** Chart data per range. Defaults to a generated sample day, week, month and year. */
  series?: PowerMonitorSeries[];
  /** Rows of pixels above the baseline. */
  rowsUp?: number;
  /** Rows of pixels below the baseline. */
  rowsDown?: number;
  /** Solar and LCD accent colour. */
  color?: string;
  homeColor?: string;
  batteryColor?: string;
  exportColor?: string;
  class?: string;
}
