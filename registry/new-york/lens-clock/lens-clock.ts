import type { LensClockLabel, LensClockParts, LensClockTick } from './types';

// Geometry in card units (the card is a 100 x 100 viewBox).
export const TICK_OUTER = 54;
const MINOR_INNER = 50.5;
const HOUR_INNER = 42;
const LABEL_RADIUS = 61;
const HAND_LENGTH = 33;
const MINUTE_LENGTH = 48;
export const SECOND_LENGTH = 52;
// How far the dial centre sits behind the card centre, opposite the hand.
export const PAN_DISTANCE = 24;

export const HOUR_SPRING = { stiffness: 70, damping: 18 };
export const HAND_SPRING = { stiffness: 90, damping: 18 };

export const HOUR_HAND_PATH = `M -1.35 2 L -0.95 ${-HAND_LENGTH + 2.4} Q 0 ${-HAND_LENGTH - 0.6} 0.95 ${-HAND_LENGTH + 2.4} L 1.35 2 Z`;
export const MINUTE_HAND_PATH = `M -0.95 2 L -0.6 ${-MINUTE_LENGTH + 1.6} Q 0 ${-MINUTE_LENGTH - 0.4} 0.6 ${-MINUTE_LENGTH + 1.6} L 0.95 2 Z`;

export const SPOKES: number[] = Array.from({ length: 12 }, (_, i) => i * 30);

export const TICKS: LensClockTick[] = Array.from({ length: 60 }, (_, i) => {
  const rad = (i * 6 * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = -Math.cos(rad);
  const isHour = i % 5 === 0;
  const inner = isHour ? HOUR_INNER : MINOR_INNER;
  return {
    i,
    x1: sin * inner,
    y1: cos * inner,
    x2: sin * TICK_OUTER,
    y2: cos * TICK_OUTER,
    lx1: sin * (HOUR_INNER + 0.7),
    ly1: cos * (HOUR_INNER + 0.7),
    lx2: sin * (TICK_OUTER - 0.7),
    ly2: cos * (TICK_OUTER - 0.7),
    isHour,
  };
});

export const LABELS: LensClockLabel[] = Array.from({ length: 12 }, (_, i) => {
  const deg = i * 30;
  const rad = (deg * Math.PI) / 180;
  const x = Math.sin(rad) * LABEL_RADIUS;
  const y = -Math.cos(rad) * LABEL_RADIUS;
  // Tangential labels that stay readable: tops point out on the upper half of
  // the dial and in on the lower half.
  const rotation = deg > 90 && deg < 270 ? deg - 180 : deg;
  return {
    hour: i === 0 ? 12 : i,
    x,
    y,
    transform: `rotate(${rotation} ${x} ${y})`,
  };
});

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hourCycle: 'h23',
};

export function createFormatter(timeZone?: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('en-US', { ...TIME_FORMAT, timeZone });
  } catch {
    // Unknown zone: fall back to the viewer's own.
    return new Intl.DateTimeFormat('en-US', TIME_FORMAT);
  }
}

export function readTime(
  date: Date,
  formatter: Intl.DateTimeFormat,
): LensClockParts {
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    hours: get('hour') % 24,
    minutes: get('minute'),
    seconds: get('second'),
  };
}

/** Next unwrapped angle so 359 → 0 keeps moving forward instead of spinning back. */
export function unwrapAngle(previous: number | null, target: number): number {
  if (previous === null) return target;
  return previous + ((((target - previous) % 360) + 540) % 360) - 180;
}

export function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
