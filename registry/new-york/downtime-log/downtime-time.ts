import type { DowntimeParsedTime } from './types';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const STAMP = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;

/** Parses `YYYY-MM-DDTHH:mm` as wall-clock time, so server and client agree. */
export function parseStamp(stamp: string): DowntimeParsedTime {
  const match = STAMP.exec(stamp);
  if (!match) return { month: 0, day: 1, hour: 0, minute: 0, total: 0 };
  const [, y, mo, d, h, mi] = match.map(Number);
  const year = y ?? 1970;
  const month = (mo ?? 1) - 1;
  const day = d ?? 1;
  const hour = h ?? 0;
  const minute = mi ?? 0;
  const total = Date.UTC(year, month, day, hour, minute) / 60_000;
  return { month, day, hour, minute, total };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `14:08` */
function formatClock(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/** `Sep 24 14:08` */
export function formatStamp(time: DowntimeParsedTime): string {
  return `${MONTHS[time.month] ?? ''} ${time.day} ${formatClock(time.hour, time.minute)}`;
}

/** Wall-clock `HH:mm` for minutes since the epoch. */
export function clockAt(total: number): string {
  const minutes = ((total % 1440) + 1440) % 1440;
  return formatClock(Math.floor(minutes / 60), minutes % 60);
}
