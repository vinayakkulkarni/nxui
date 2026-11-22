export interface SelfPoweredSource {
  label: string;
  /** Energy from this source, in the gauge `unit`. */
  value: number;
  color: string;
}

export interface SelfPoweredDay {
  /** Short label under the column, e.g. `M`. */
  label: string;
  /** Full name for screen readers and the hover readout, e.g. `Monday`. */
  name?: string;
  /** Self-powered share for the day, 0–100. */
  value: number;
}

export interface SelfPoweredGaugeMeterProps {
  value: number;
  zoneFrom: number;
  label: string;
  jitter: number;
  color: string;
}

export interface SelfPoweredGaugeProps {
  /** Self-powered share, 0–100. The needle springs to it. */
  value?: number;
  title?: string;
  subtitle?: string;
  /** Text in the pill on the right of the header. Hidden when empty. */
  badge?: string;
  /** Small caps label inside the meter. */
  label?: string;
  /** The orange zone on the scale starts here. */
  zoneFrom?: number;
  /** Where the energy came from. */
  sources?: SelfPoweredSource[];
  /** Unit for source values. */
  unit?: string;
  sourcesLabel?: string;
  /** One entry per day. The last one is today and is highlighted. */
  history?: SelfPoweredDay[];
  historyLabel?: string;
  /** Lit segments per day column. */
  segments?: number;
  /** Needle tremble in points, like a live VU meter. `0` turns it off. */
  jitter?: number;
  /** Accent colour for the zone, readout and today's column. */
  color?: string;
  class?: string;
}
