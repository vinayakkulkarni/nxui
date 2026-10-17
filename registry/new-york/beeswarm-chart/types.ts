export interface BeeswarmChartPart {
  /** Part number shown in the tooltip, e.g. `1187`. */
  id: string | number;
  /** Cycle time, in `unit`. */
  value: number;
  /** Clock time the part finished, e.g. `11:42`. */
  time?: string;
  /** Short reason shown in the tooltip, e.g. `tool change`. */
  note?: string;
}

export interface BeeswarmChartSeries {
  /** Unique key of the series (machine). */
  value: string;
  /** Label in the segmented switch, e.g. `CNC-07`. */
  label: string;
  /**
   * Parts in display order (the footer bars follow this order). Keep the same
   * count across series so dots move to their new places when switching.
   */
  parts: BeeswarmChartPart[];
}

export interface BeeswarmChartProps {
  series: BeeswarmChartSeries[];
  /** Target cycle time. Parts above it are drawn as over takt. */
  takt: number;
  title?: string;
  /** Defaults to `last <n> parts · takt <takt> <unit>`. */
  subtitle?: string;
  /** Axis range. Defaults to the rounded range of every part in every series. */
  domain?: [number, number];
  /** Values above this are squeezed past a `//` axis break. */
  breakAt?: number;
  /** Labelled ticks. Defaults to the domain ends and the break. */
  ticks?: number[];
  unit?: string;
  class?: string;
}

export interface BeeswarmChartScale {
  x: (value: number) => number;
  hasBreak: boolean;
  /** x of the `//` mark. */
  breakX: number;
  /** Last value on the uncompressed part of the axis. */
  mainMax: number;
}

export interface BeeswarmChartDot {
  slot: number;
  part: BeeswarmChartPart;
  x: number;
  y: number;
  over: boolean;
}

export interface BeeswarmChartTick {
  value: number;
  x: number;
  label: string;
  anchor: 'start' | 'middle';
}
