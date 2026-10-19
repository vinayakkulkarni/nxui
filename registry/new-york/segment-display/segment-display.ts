import type { SegmentCell, SegmentName } from './types';

/** Lit segments for every character the display can draw. */
const GLYPHS: Record<string, SegmentName[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'c', 'd'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  A: ['a', 'b', 'c', 'e', 'f', 'g'],
  B: ['c', 'd', 'e', 'f', 'g'],
  C: ['a', 'd', 'e', 'f'],
  D: ['b', 'c', 'd', 'e', 'g'],
  E: ['a', 'd', 'e', 'f', 'g'],
  F: ['a', 'e', 'f', 'g'],
  H: ['b', 'c', 'e', 'f', 'g'],
  L: ['d', 'e', 'f'],
  P: ['a', 'b', 'e', 'f', 'g'],
  U: ['b', 'c', 'd', 'e', 'f'],
  '-': ['g'],
  _: ['d'],
  ' ': [],
};

/**
 * Segment polygons in a 12×20 cell. Each bar is a long hexagon so
 * neighbouring bars meet on a diagonal, like a real LCD.
 */
export const SEGMENT_POINTS: Record<SegmentName, string> = {
  a: '2.6,1 9.4,1 10.6,2.2 9.4,3.4 2.6,3.4 1.4,2.2',
  b: '10.8,2.4 12,3.6 12,8.8 10.8,10 9.6,8.8 9.6,3.6',
  c: '10.8,10 12,11.2 12,16.4 10.8,17.6 9.6,16.4 9.6,11.2',
  d: '2.6,16.6 9.4,16.6 10.6,17.8 9.4,19 2.6,19 1.4,17.8',
  e: '1.2,10 2.4,11.2 2.4,16.4 1.2,17.6 0,16.4 0,11.2',
  f: '1.2,2.4 2.4,3.6 2.4,8.8 1.2,10 0,8.8 0,3.6',
  g: '2.6,8.8 9.4,8.8 10.6,10 9.4,11.2 2.6,11.2 1.4,10',
};

export const SEGMENT_NAMES: readonly SegmentName[] = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
];

/** Splits a value into display cells, folding `.` into the cell before it. */
export function toCells(value: string, digits: number): SegmentCell[] {
  const cells: SegmentCell[] = [];
  for (const raw of value.toUpperCase()) {
    const last = cells.at(-1);
    if (raw === '.' && last && !last.dot && !last.colon) {
      last.dot = true;
      continue;
    }
    if (raw === ':') {
      cells.push({ lit: new Set(), dot: false, colon: true });
      continue;
    }
    cells.push({
      lit: new Set(GLYPHS[raw] ?? []),
      dot: raw === '.',
      colon: false,
    });
  }
  const digitCells = cells.filter((c) => !c.colon).length;
  const pad = Math.max(0, digits - digitCells);
  const blanks: SegmentCell[] = Array.from({ length: pad }, () => ({
    lit: new Set<SegmentName>(),
    dot: false,
    colon: false,
  }));
  return [...blanks, ...cells];
}
