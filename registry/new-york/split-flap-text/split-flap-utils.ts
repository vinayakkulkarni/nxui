import type {
  SplitFlapAlign,
  SplitFlapCharset,
  SplitFlapOrder,
  SplitFlapTile,
} from './types';

export const DEFAULT_WORDS = ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'];

const CHARSETS: Record<string, string> = {
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  numeric: '0123456789',
};

export function toCssUnit(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export function resolveCharset(charset: SplitFlapCharset | undefined): string {
  if (charset && CHARSETS[charset]) return CHARSETS[charset];
  return typeof charset === 'string' && charset.length > 0
    ? charset
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
}

export function normalizePhrase(
  phrase: string,
  width: number,
  align: SplitFlapAlign = 'left',
): string {
  const safe = String(phrase ?? '').slice(0, width);
  if (align === 'right') return safe.padStart(width, ' ');
  if (align === 'center') {
    return safe
      .padStart(safe.length + Math.floor((width - safe.length) / 2), ' ')
      .padEnd(width, ' ');
  }
  return safe.padEnd(width, ' ');
}

export function createTiles(phrase: string): SplitFlapTile[] {
  return phrase.split('').map((char) => ({
    current: char,
    next: char,
    flipping: false,
    tick: 0,
  }));
}

function sampleChar(charset: string): string {
  return charset.charAt(Math.floor(Math.random() * charset.length)) || ' ';
}

export function buildSequence(
  target: string,
  flips: number,
  charset: string,
): string[] {
  const steps: string[] = [];
  for (let i = 0; i < flips; i += 1) {
    steps.push(sampleChar(charset));
  }
  steps.push(target);
  return steps;
}

export function toGlyph(char: string): string {
  return char === ' ' ? '\u00A0' : char;
}

export function shuffleIndices(count: number): number[] {
  const list = Array.from({ length: count }, (_, index) => index);
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = list[i]!;
    list[i] = list[j]!;
    list[j] = swap;
  }
  return list;
}

export function cascadeStep(
  index: number,
  width: number,
  order: SplitFlapOrder,
  randomOrder: number[] | null,
): number {
  if (order === 'right') return width - 1 - index;
  if (order === 'center') return Math.floor(Math.abs(index - (width - 1) / 2));
  if (order === 'random' && randomOrder) return randomOrder[index] ?? index;
  return index;
}

export function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

export function round(value: number): number {
  return Number(value.toFixed(3));
}
