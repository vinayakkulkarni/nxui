export interface TimezoneCity {
  /** City label. */
  name: string;
  /** Short zone label, e.g. 'PDT' or 'UTC-3'. */
  zone: string;
  /** UTC offset in minutes (e.g. -420 for UTC-7, 330 for IST). */
  offsetMinutes: number;
  /** Working-hours window in local 24h time. */
  workStart: number;
  workEnd: number;
  /** Accent color for the meeting grid blocks. */
  color: string;
}

export interface TimezoneCompanionProps {
  cities?: TimezoneCity[];
  class?: string;
}
