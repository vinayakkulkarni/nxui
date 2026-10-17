import type { CounterDirection, CounterItem, CounterSlot } from './types';

const NUMERIC = new Set(['integer', 'group', 'decimal', 'fraction']);

export const COUNTER_DIRECTIONS: CounterDirection[] = [
  'auto',
  'up',
  'down',
  'shortest',
];

export const COUNTER_MASK =
  'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.0355) calc(var(--counter-fade, 0em) * 0.1667), rgba(0, 0, 0, 0.2099) calc(var(--counter-fade, 0em) * 0.3333), rgba(0, 0, 0, 0.5) calc(var(--counter-fade, 0em) * 0.5), rgba(0, 0, 0, 0.7901) calc(var(--counter-fade, 0em) * 0.6667), rgba(0, 0, 0, 0.9645) calc(var(--counter-fade, 0em) * 0.8333), #000 var(--counter-fade, 0em), #000 calc(100% - var(--counter-fade, 0em)), rgba(0, 0, 0, 0.9645) calc(100% - var(--counter-fade, 0em) * 0.8333), rgba(0, 0, 0, 0.7901) calc(100% - var(--counter-fade, 0em) * 0.6667), rgba(0, 0, 0, 0.5) calc(100% - var(--counter-fade, 0em) * 0.5), rgba(0, 0, 0, 0.2099) calc(100% - var(--counter-fade, 0em) * 0.3333), rgba(0, 0, 0, 0.0355) calc(100% - var(--counter-fade, 0em) * 0.1667), rgba(0, 0, 0, 0) 100%)';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function mod(value: number, base: number): number {
  return ((value % base) + base) % base;
}

export function wrap(offset: number): number {
  return mod(offset + 5, 10) - 5;
}

export function stepBetween(
  from: number,
  to: number,
  direction: CounterDirection,
): number {
  const up = mod(to - from, 10);
  if (direction === 'up') return up;
  if (direction === 'down') return up === 0 ? 0 : up - 10;
  return up > 5 ? up - 10 : up;
}

export function createFormatter(
  locale: string | string[],
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat('en-US');
  }
}

export function digitsFor(formatter: Intl.NumberFormat): string[] {
  const { locale, numberingSystem } = formatter.resolvedOptions();
  const plain = createFormatter(locale, {
    numberingSystem,
    useGrouping: false,
  });
  return Array.from({ length: 10 }, (_, digit) => plain.format(digit));
}

export function slotsFor(
  formatter: Intl.NumberFormat,
  digits: string[],
  value: number,
): CounterSlot[] {
  const parts = formatter.formatToParts(value);
  let first = -1;
  let last = -1;
  let place = 0;
  parts.forEach((part, index) => {
    if (!NUMERIC.has(part.type)) return;
    if (first < 0) first = index;
    last = index;
    if (part.type === 'integer') place += [...part.value].length;
  });
  let fraction = 0;
  const counts: Record<string, number> = {};
  const slots: CounterSlot[] = [];
  parts.forEach((part, index) => {
    if (part.type === 'integer' || part.type === 'fraction') {
      for (const char of part.value) {
        const digit = Math.max(0, digits.indexOf(char));
        if (part.type === 'integer') {
          place -= 1;
          slots.push({
            key: `i${place}`,
            kind: 'digit',
            digit,
            text: '',
            rank: -2 * place,
          });
        } else {
          slots.push({
            key: `f${fraction}`,
            kind: 'digit',
            digit,
            text: '',
            rank: 1 + fraction,
          });
          fraction += 1;
        }
      }
    } else if (part.type === 'group') {
      slots.push({
        key: `g${place}`,
        kind: 'symbol',
        digit: 0,
        text: part.value,
        rank: 1 - 2 * place,
      });
    } else if (part.type === 'decimal') {
      slots.push({
        key: 'd',
        kind: 'symbol',
        digit: 0,
        text: part.value,
        rank: 0.5,
      });
    } else {
      const before = first < 0 || index < first;
      const name = `${before ? 'p' : 's'}-${part.type}`;
      counts[name] = (counts[name] ?? 0) + 1;
      slots.push({
        key: `${name}-${counts[name]}`,
        kind: 'symbol',
        digit: 0,
        text: part.value,
        rank: before ? -10000 - (first - index) : 10000 + (index - last),
      });
    }
  });
  return slots;
}

export function makeItem(
  slot: CounterSlot,
  position: number,
  shown: number,
): CounterItem {
  return {
    kind: slot.kind,
    rank: slot.rank,
    pos: position,
    vel: 0,
    target: position,
    shown,
    shownVel: 0,
    shownTarget: shown,
    wait: 0,
    exiting: false,
    natural: 0,
    el: null,
    numerals: null,
    strip: null,
    blur: null,
    filter: '',
    blurred: false,
  };
}
