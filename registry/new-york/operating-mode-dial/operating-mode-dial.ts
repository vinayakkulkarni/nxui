import type {
  OperatingModeOption,
  OperatingModePrices,
  OperatingModeSchedule,
  OperatingModeStop,
  RateTier,
} from './types';

export const DEFAULT_MODES: OperatingModeOption[] = [
  {
    value: 'backup',
    label: 'Backup only',
    title: 'Backup only',
    description: 'Keeps the battery full and waits for an outage',
    angle: -120,
  },
  {
    value: 'self-powered',
    label: 'Self-powered',
    title: 'Self-powered',
    description: 'Runs the home on solar first, then the battery',
    angle: -60,
  },
  {
    value: 'time-based',
    label: 'Time-based',
    title: 'Time-based control',
    description: 'Charges off-peak, runs the home at peak price',
    angle: 60,
  },
  {
    value: 'export',
    label: 'Export',
    title: 'Export',
    description: 'Sells spare solar to the grid at the best rate',
    angle: 120,
  },
];

function tiers(spans: [RateTier, number][]): RateTier[] {
  return spans.flatMap(([tier, count]) =>
    Array.from({ length: count }, () => tier),
  );
}

export const DEFAULT_SCHEDULES: OperatingModeSchedule[] = [
  {
    value: 'weekdays',
    label: 'Weekdays',
    hours: tiers([
      ['off', 7],
      ['mid', 9],
      ['peak', 5],
      ['mid', 2],
      ['off', 1],
    ]),
  },
  {
    value: 'weekends',
    label: 'Weekends',
    hours: tiers([
      ['off', 9],
      ['mid', 8],
      ['peak', 3],
      ['mid', 2],
      ['off', 2],
    ]),
  },
  {
    value: 'holidays',
    label: 'Holidays',
    hours: tiers([
      ['off', 10],
      ['mid', 11],
      ['off', 3],
    ]),
  },
];

export const DEFAULT_PRICES: OperatingModePrices = {
  off: '$0.11',
  mid: '$0.24',
  peak: '$0.48',
};

/** Furthest the knob turns either way, in degrees. */
export const DIAL_LIMIT = 135;
/** Spacing of the dotted arc, in degrees. */
const DOT_STEP = 7.5;

/** Gives every mode an angle, spreading the ones without one evenly. */
export function resolveStops(
  modes: OperatingModeOption[],
): OperatingModeStop[] {
  const count = modes.length;
  return modes
    .map((option, i) => ({
      option,
      angle: option.angle ?? (count < 2 ? 0 : -120 + (240 * i) / (count - 1)),
    }))
    .toSorted((a, b) => a.angle - b.angle);
}

/** Index of the stop closest to an angle. */
export function nearestStop(stops: OperatingModeStop[], angle: number): number {
  let best = 0;
  stops.forEach((stop, i) => {
    const current = stops[best];
    if (
      current &&
      Math.abs(stop.angle - angle) < Math.abs(current.angle - angle)
    ) {
      best = i;
    }
  });
  return best;
}

/** Angles of the dotted arc that do not sit on a mode dot. */
export function arcDots(stops: OperatingModeStop[]): number[] {
  const dots: number[] = [];
  for (let a = -DIAL_LIMIT; a <= DIAL_LIMIT + 0.01; a += DOT_STEP) {
    if (stops.every((stop) => Math.abs(stop.angle - a) > DOT_STEP / 2)) {
      dots.push(a);
    }
  }
  return dots;
}

/** Point on a circle for an angle measured clockwise from 12 o'clock. */
export function polar(radius: number, angle: number): { x: number; y: number } {
  const rad = (angle * Math.PI) / 180;
  return { x: Math.sin(rad) * radius, y: -Math.cos(rad) * radius };
}

/** First contiguous run of peak hours as [start, end), or null. */
export function peakWindow(hours: RateTier[]): [number, number] | null {
  const start = hours.indexOf('peak');
  if (start < 0) return null;
  let end = start;
  while (hours[end] === 'peak') end += 1;
  return [start, end];
}
