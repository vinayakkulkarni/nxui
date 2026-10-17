import { cubicBezier } from 'motion-v';
import type { CSSProperties } from 'vue';
import type {
  CountUpCharSlot,
  CountUpColumn,
  CountUpEase,
  CountUpEasing,
  CountUpFormatOptions,
  CountUpRollModel,
  CountUpScale,
  CountUpSlot,
} from './types';

export const CELL = 1.2;
export const STAGGER = 0.07;

const UNITS: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function smooth(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function mod10(value: number): number {
  return ((value % 10) + 10) % 10;
}

/** Critically-tuned spring that overshoots by `overshoot` and lands exactly at t = 1. */
export function makeSpring(overshoot: number): CountUpEase {
  const log = Math.log(Math.min(0.5, Math.max(0.001, overshoot)));
  const zeta = -log / Math.sqrt(Math.PI * Math.PI + log * log);
  const damped = Math.PI / 0.52;
  const natural = damped / Math.sqrt(1 - zeta * zeta);
  const raw = (t: number) =>
    1 -
    Math.exp(-zeta * natural * t) *
      (Math.cos(damped * t) +
        ((zeta * natural) / damped) * Math.sin(damped * t));
  const residual = 1 - raw(1);
  return (t) => (t >= 1 ? 1 : raw(t) + residual * t * t * t);
}

export const EASINGS: Record<CountUpEasing, CountUpEase> = {
  linear: (t) => t,
  easeOut: cubicBezier(0.33, 1, 0.68, 1),
  expo: (t) => (t >= 1 ? 1 : (1 - 2 ** (-10 * t)) / (1 - 2 ** -10)),
  spring: makeSpring(0.06),
};

export function getDecimalPlaces(num: number): number {
  const str = num.toString();
  if (str.includes('.')) {
    const decimals = str.split('.')[1] ?? '';
    if (Number.parseInt(decimals) !== 0) return decimals.length;
  }
  return 0;
}

function unitFor(value: number): [number, string] {
  return UNITS.find(([size]) => Math.abs(value) >= size * 0.9995) ?? [1, ''];
}

function scaleFor(
  value: number,
  compact: boolean,
  decimals: number | undefined,
  places: number,
): CountUpScale {
  if (!compact) return { size: 1, label: '', digits: places };
  const [size, label] = unitFor(value);
  const digits =
    decimals ?? (label ? (Math.abs(value) / size < 100 ? 1 : 0) : places);
  return { size, label, digits };
}

function splitNumber(
  value: number,
  digits: number,
  size: number,
): { negative: boolean; int: string; frac: string } {
  const fixed = (Math.abs(value) / size).toFixed(digits);
  const [int = '0', frac = ''] = fixed.split('.');
  return { negative: value < 0 && Number(fixed) !== 0, int, frac };
}

function groupDigits(int: string, separator: string): string {
  return separator ? int.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : int;
}

export function formatCount(
  latest: number,
  options: CountUpFormatOptions,
  prefix: string,
  suffix: string,
): string {
  const { size, label, digits } = scaleFor(
    latest,
    options.compact,
    options.decimals,
    options.places,
  );
  const parts = splitNumber(latest, digits, size);
  const body = `${parts.negative ? '-' : ''}${groupDigits(parts.int, options.separator)}${parts.frac ? `.${parts.frac}` : ''}`;
  return `${prefix}${body}${label}${suffix}`;
}

export function isCharSlot(slot: CountUpSlot): slot is CountUpCharSlot {
  return 'char' in slot;
}

export function buildRoll(
  a: number,
  b: number,
  spin: boolean,
  options: CountUpFormatOptions,
): CountUpRollModel {
  const { size, label, digits } = scaleFor(
    b,
    options.compact,
    options.decimals,
    options.places,
  );
  const pa = splitNumber(a, digits, size);
  const pb = splitNumber(b, digits, size);
  const length = Math.max(pa.int.length, pb.int.length);
  const slots: CountUpSlot[] = [];
  const columns: CountUpColumn[] = [];
  if (pa.negative || pb.negative)
    slots.push({ char: '-', enter: !pa.negative, leave: !pb.negative });
  const digitAt = (parts: typeof pa, place: number): number | null => {
    if (place < 0) return Number(parts.frac[-place - 1]);
    const index = parts.int.length - 1 - place;
    return index >= 0 ? Number(parts.int[index]) : null;
  };
  for (let place = length - 1; place >= -digits; place--) {
    if (place === -1) slots.push({ char: '.' });
    const start = digitAt(pa, place);
    const end = digitAt(pb, place);
    const column: CountUpColumn = {
      slot: slots.length,
      index: columns.length,
      place,
      from: start ?? 0,
      to: end ?? 0,
      enter: start === null,
      leave: end === null,
      delta: 0,
    };
    slots.push(column);
    columns.push(column);
    if (options.separator && place > 0 && place % 3 === 0)
      slots.push({ char: options.separator, follow: column.index });
  }
  const up = spin || b >= a;
  columns.forEach((column, index) => {
    const rank = columns.length - 1 - index;
    const base = up
      ? mod10(column.to - column.from)
      : -mod10(column.from - column.to);
    const turns = spin
      ? Math.max(1, 3 - rank)
      : Math.min(
          Math.floor(Math.abs(b - a) / (size * 10 ** (column.place + 1))),
          Math.max(0, 3 - rank),
        );
    column.delta = base + (up ? 10 : -10) * turns;
  });
  return { slots, columns, label };
}

const SLOT_BASE: CSSProperties = {
  display: 'inline-block',
  height: `${CELL}em`,
  lineHeight: `${CELL}em`,
};

// Hoisted style objects: the roll animation writes width/opacity/transform
// imperatively, and stable references keep Vue from re-patching them.
export const SLOT_STYLE: CSSProperties = SLOT_BASE;
export const CHAR_STYLE: CSSProperties = { ...SLOT_BASE, overflow: 'hidden' };
export const CHAR_HIDDEN_STYLE: CSSProperties = {
  ...CHAR_STYLE,
  width: '0px',
  opacity: 0,
};
export const COLUMN_STYLE: CSSProperties = {
  ...SLOT_BASE,
  position: 'relative',
  overflow: 'hidden',
};
export const COLUMN_HIDDEN_STYLE: CSSProperties = {
  ...COLUMN_STYLE,
  width: '0px',
  opacity: 0,
};
export const STRIP_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  transform: `translateY(${-CELL}em)`,
};
export const CELL_STYLE: CSSProperties = { height: `${CELL}em` };
export const CELL_OFFSETS = [-1, 0, 1, 2];
