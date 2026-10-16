/** Row order: newest first, oldest first, or the longest stops first. */
export type DowntimeSort = 'newest' | 'oldest' | 'longest';

export interface DowntimeReason {
  /** Key referenced by `DowntimeStop.reason`. */
  value: string;
  label: string;
  /** Color of the reason diamond and of the stop bars in the timeline. */
  color: string;
}

export interface DowntimeStop {
  id: string;
  /** Local wall-clock start, `YYYY-MM-DDTHH:mm`. Parsed without time zones. */
  startedAt: string;
  /** `DowntimeReason.value`. */
  reason: string;
  /** Stop length in minutes. */
  minutes: number;
  /** Machine that stopped. Picks the timeline track. */
  machine: string;
}

export interface DowntimeLogProps {
  stops: DowntimeStop[];
  reasons: DowntimeReason[];
  /** Local wall-clock "now", `YYYY-MM-DDTHH:mm`. The timeline ends here. */
  now: string;
  /** Timeline tracks, top to bottom. Defaults to machines in stop order. */
  machines?: string[];
  title?: string;
  /** Period text after the stop count, e.g. `this week`. */
  period?: string;
  /** Stops longer than this many minutes show their minutes in orange. */
  threshold?: number;
  /** Hours covered by the timeline. */
  windowHours?: number;
  /** Hours between x-axis labels. */
  axisStep?: number;
  /** Minutes between two ruler ticks. */
  tickMinutes?: number;
  /** Rows visible before the list scrolls. */
  visibleRows?: number;
  class?: string;
}

export interface DowntimeParsedTime {
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** Minutes since the Unix epoch, treating the stamp as UTC. */
  total: number;
}

export interface DowntimeTick {
  key: string;
  /** Horizontal position in percent of the track. */
  left: number;
}

export interface DowntimeBar {
  stop: DowntimeStop;
  color: string;
  /** Group bounds in percent of the track. */
  left: number;
  width: number;
  /** Tick positions in percent of the group. */
  ticks: DowntimeTick[];
}

export interface DowntimeTrack {
  machine: string;
  ticks: DowntimeTick[];
  bars: DowntimeBar[];
}

export interface DowntimeAxisLabel {
  label: string;
  left: number;
}
