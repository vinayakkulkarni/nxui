import type { TimezoneCity } from './types';

/**
 * UTC offset in minutes for an IANA time zone at a given instant.
 *
 * Derived from `Intl` rather than stored as a constant so daylight saving is
 * always correct — a hard-coded `-420` for Los Angeles is wrong for half the
 * year.
 */
export function offsetMinutesFor(
  timeZone: string,
  at: Date = new Date(),
): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);

  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');

  // `formatToParts` renders hour 24 for midnight under hour12: false.
  const hour = read('hour') % 24;
  const asUtc = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    hour,
    read('minute'),
    read('second'),
  );
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60_000);
}

/** Short zone abbreviation (`IST`, `PDT`) for an IANA zone. */
export function zoneAbbreviation(
  timeZone: string,
  at: Date = new Date(),
): string {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
  })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? timeZone.split('/').pop() ?? timeZone;
}

/**
 * Legacy IANA aliases still reported by some engines — Chromium resolves an
 * Indian locale to `Asia/Calcutta`, which would render a decades-old city name.
 */
const ZONE_ALIASES: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Europe/Kiev': 'Europe/Kyiv',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'Pacific/Ponape': 'Pacific/Pohnpei',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
};

function canonicalZone(timeZone: string): string {
  return ZONE_ALIASES[timeZone] ?? timeZone;
}

/** Human city label from an IANA zone id: `Asia/Kolkata` → `Kolkata`. */
function cityNameFromZone(timeZone: string): string {
  const leaf = canonicalZone(timeZone).split('/').pop() ?? timeZone;
  return leaf.replaceAll('_', ' ');
}

/** The viewer's own IANA zone, falling back to UTC when unavailable. */
function detectTimeZone(): string {
  try {
    return canonicalZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    );
  } catch {
    return 'UTC';
  }
}

/**
 * Build the viewer's "home" row from their detected zone, so the widget opens
 * on *their* city instead of a hard-coded one.
 */
export function homeCityFromEnvironment(color = '#f97316'): TimezoneCity {
  const timeZone = detectTimeZone();
  return {
    name: cityNameFromZone(timeZone),
    timeZone,
    zone: zoneAbbreviation(timeZone),
    offsetMinutes: offsetMinutesFor(timeZone),
    workStart: 9,
    workEnd: 17,
    color,
  };
}

/** Live offset for a city — recomputed from its zone when it has one. */
export function cityOffsetMinutes(
  city: TimezoneCity,
  at: Date = new Date(),
): number {
  return city.timeZone
    ? offsetMinutesFor(city.timeZone, at)
    : city.offsetMinutes;
}
