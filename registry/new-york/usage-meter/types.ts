export interface UsageMeterCategory {
  /** Key used in `UsageMeterRange.usage`. */
  key: string;
  label: string;
  /** Segment and dot colour in light mode. */
  color: string;
  /** Segment and dot colour in dark mode. Defaults to `color`. */
  darkColor?: string;
}

export interface UsageMeterStat {
  label: string;
  value: number;
  /** Leave out for an unlimited quota (shown as ∞ with a hatched track). */
  max?: number;
  /** Unit after the max, e.g. `GB`. */
  unit?: string;
}

export interface UsageMeterRange {
  value: string;
  label: string;
  /** Usage per category key. Categories at 0 are hidden. */
  usage: Record<string, number>;
  /** Usage per day. */
  daily: number[];
  /** Total day slots. Slots after `daily` are drawn as empty future days. */
  days?: number;
  /** Label per day slot, e.g. `Oct 5`. Defaults to `Day N`. */
  dayLabels?: string[];
  stats?: UsageMeterStat[];
}

export interface UsageMeterProps {
  workspace?: string;
  plan?: string;
  /** Second part of the plan line, e.g. `Resets in 9 days`. */
  resets?: string;
  limit?: number;
  unit?: string;
  categories: UsageMeterCategory[];
  ranges: UsageMeterRange[];
  /** Day-bar colour on hover. Defaults to the first category colour. */
  accent?: string;
  upgradeLabel?: string;
  addCreditsLabel?: string;
  limitLabel?: string;
  class?: string;
}

export interface UsageMeterNumberProps {
  value: number;
  duration?: number;
  class?: string;
}

export interface UsageMeterDay {
  label: string;
  value: number;
  future: boolean;
}

export interface UsageMeterBarsProps {
  days: UsageMeterDay[];
  /** Changes when the range changes, to replay the grow-in. */
  rangeKey: string;
  unit: string;
  accent: string;
  accentDark: string;
}

export interface UsageMeterStatsProps {
  stats: UsageMeterStat[];
}
