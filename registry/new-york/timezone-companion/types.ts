export type TimezoneMode = 'meeting' | 'clock';

export interface TimezoneCity {
  /** City label. */
  name: string;
  /** Short zone label, e.g. 'PDT' or 'UTC-3'. */
  zone: string;
  /** UTC offset in minutes (e.g. -420 for UTC-7, 330 for IST). */
  offsetMinutes: number;
  /**
   * IANA zone id, e.g. `Asia/Kolkata`. When present the offset is recomputed
   * from it so daylight saving stays correct.
   */
  timeZone?: string;
  /** Working-hours window in local 24h time. */
  workStart: number;
  workEnd: number;
  /** Accent color for the meeting grid blocks. */
  color: string;
}

/** A zone the user can add to the world clock from the picker. */
export interface TimezoneOption {
  /** Display label, e.g. 'Tokyo'. */
  name: string;
  /** IANA zone id, e.g. 'Asia/Tokyo'. */
  timeZone: string;
}

export interface TimezoneCompanionProps {
  /** View mode: meeting overlap finder or world clock. */
  mode?: TimezoneMode;
  cities?: TimezoneCity[];
  class?: string;
}
