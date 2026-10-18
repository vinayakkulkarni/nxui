export interface RangeCalendarDay {
  /** Local calendar date as `YYYY-MM-DD`. */
  date: string;
  /** Count shaded in the heatmap, e.g. stops on the line that day. */
  value: number;
}

export interface RangeCalendarPreset {
  /** Stored in `v-model:preset` while this preset is active. */
  value: string;
  label: string;
  /** Length of the range in days, ending on `today`. */
  days: number;
  /** For sub-day presets such as `12h`: the range is `today` only and the label shows the hours. */
  hours?: number;
}

export interface RangeCalendarCell {
  /** `YYYY-MM-DD`. */
  iso: string;
  /** Days since 1970-01-01 (UTC calendar math, never a wall-clock time). */
  day: number;
  /** Day of the month, 1–31. */
  date: number;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
}

/** One week row; `null` pads days that belong to another month. */
export type RangeCalendarWeek = (RangeCalendarCell | null)[];

export interface RangeCalendarProps {
  /**
   * The current day as `YYYY-MM-DD`. Later days are disabled and presets end
   * here. Passed in (not read from the clock) so server and client agree.
   */
  today: string;
  /** Month to show as `YYYY-MM`. Defaults to the month of `today`. */
  month?: string;
  /** Per-day values for the heatmap. Days without an entry are disabled. */
  days?: RangeCalendarDay[];
  title?: string;
  subtitle?: string;
  presets?: RangeCalendarPreset[];
  /** Noun for the value, used in labels, e.g. `stops`. */
  unit?: string;
  /** Left legend label. Defaults to `fewer <unit>`. */
  legendLow?: string;
  legendHigh?: string;
  compareTitle?: string;
  /** Text under the compare title. Defaults to `previous <N> days`. */
  compareLabel?: string;
  /** BCP 47 locale for month and weekday names. */
  locale?: string;
  class?: string;
}
