import type {
  RangeCalendarCell,
  RangeCalendarDay,
  RangeCalendarPreset,
  RangeCalendarWeek,
} from './types';

export const DEFAULT_PRESETS: RangeCalendarPreset[] = [
  { value: '12h', label: '12h', days: 1, hours: 12 },
  { value: '24h', label: '24h', days: 1, hours: 24 },
  { value: '1W', label: '1W', days: 7 },
  { value: '1M', label: '1M', days: 28 },
  { value: '3M', label: '3M', days: 84 },
];

export const NO_DAYS: RangeCalendarDay[] = [];

/** Number of heat steps in the grid and the legend. */
export const LEVELS = 5;

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH = /^(\d{4})-(\d{2})/;
/** 2024-01-01 was a Monday; used to build weekday labels. */
const A_MONDAY = Math.round(Date.UTC(2024, 0, 1) / DAY_MS);

/**
 * Dates are calendar days, not instants. Everything is done in UTC on
 * day numbers so the time zone of the server or the browser never shifts a day.
 */
export function isoToDay(iso: string): number | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  return Math.round(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS,
  );
}

export function dayToIso(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday. */
function weekdayOf(day: number): number {
  return (new Date(day * DAY_MS).getUTCDay() + 6) % 7;
}

export function dayToDate(day: number): Date {
  return new Date(day * DAY_MS);
}

/** First and last day number of a `YYYY-MM` month, or `null` if it does not parse. */
export function monthBounds(
  month: string,
): { first: number; last: number } | null {
  const match = ISO_MONTH.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const index = Number(match[2]) - 1;
  const first = Math.round(Date.UTC(year, index, 1) / DAY_MS);
  const last = Math.round(Date.UTC(year, index + 1, 1) / DAY_MS) - 1;
  return { first, last };
}

/** Monday-first week rows for a month, padded with `null`. */
export function monthWeeks(month: string): RangeCalendarWeek[] {
  const bounds = monthBounds(month);
  if (!bounds) return [];
  const weeks: RangeCalendarWeek[] = [];
  let week: RangeCalendarWeek = Array.from(
    { length: weekdayOf(bounds.first) },
    () => null,
  );
  for (let day = bounds.first; day <= bounds.last; day++) {
    const cell: RangeCalendarCell = {
      iso: dayToIso(day),
      day,
      date: day - bounds.first + 1,
      weekday: weekdayOf(day),
    };
    week.push(cell);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

/** Narrow weekday labels, Monday first (`M T W T F S S` in English). */
export function weekdayLabels(locale: string): string[] {
  const format = new Intl.DateTimeFormat(locale, {
    weekday: 'narrow',
    timeZone: 'UTC',
  });
  return Array.from({ length: 7 }, (_, i) =>
    format.format(dayToDate(A_MONDAY + i)),
  );
}

/** Heat level 1…levels for a value; 0 when there is nothing to compare against. */
export function heatLevel(value: number, max: number, levels: number): number {
  if (max <= 0) return 1;
  const ratio = Math.min(Math.max(value / max, 0), 1);
  return Math.min(Math.max(Math.ceil(ratio * levels), 1), levels);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
