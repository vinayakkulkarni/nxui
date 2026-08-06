export type TimezoneMode = 'meeting' | 'clock';

export interface TimezoneCity {
  /** City label. */
  name: string;
  /** IANA timezone, e.g. 'America/Los_Angeles'. */
  tz: string;
  /** UTC offset hours, e.g. -7. */
  offset: number;
  /** Working-hours window in local 24h time, e.g. [9, 17]. */
  workStart: number;
  workEnd: number;
}

export interface TimezoneCompanionProps {
  /** View mode: meeting overlap finder or world clock. */
  mode?: TimezoneMode;
  cities?: TimezoneCity[];
  class?: string;
}
