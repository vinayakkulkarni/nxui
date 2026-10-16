import type {
  LatticeGrid,
  LatticePattern,
  LatticePatternName,
  LatticeResolvedPattern,
} from './types';

const LATTICE_PATTERNS: Record<
  LatticePatternName,
  Partial<Record<LatticeGrid, LatticeResolvedPattern>>
> = {
  arrow: { 3: { cells: [1, 2, 3, 0, 1, 2, 1, 2, 3], loop: 7.2, scale: 1 } },
  dots: { 3: { cells: [0, 1, 2, 0, 1, 2, 0, 1, 2], loop: 3, scale: 2.4 } },
  ripple: { 3: { cells: [2, 1, 2, 1, 0, 1, 2, 1, 2], loop: 4.8, scale: 1.5 } },
  spiral: {
    3: { cells: [0, 1, 2, 7, 8, 3, 6, 5, 4], loop: 9, scale: 1.2, lit: 0.35 },
  },
  orbit: {
    3: { cells: [0, 1, 2, 7, null, 3, 6, 5, 4], loop: 8, scale: 1.2 },
    4: {
      cells: [0, 1, 2, 3, 11, null, null, 4, 10, null, null, 5, 9, 8, 7, 6],
      loop: 6,
      scale: 1.2,
      lit: 0.45,
    },
  },
  snake: {
    3: { cells: [0, 1, 2, 5, 4, 3, 6, 7, 8], loop: 9, scale: 1, lit: 0.35 },
    4: {
      cells: [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11, 15, 14, 13, 12],
      loop: 16,
      scale: 1,
      lit: 0.25,
    },
  },
  sweep: {
    4: {
      cells: [0, 1, 2, 3, 1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6],
      loop: 5,
      scale: 1,
      lit: 0.45,
    },
  },
  spin: {
    4: {
      cells: [0, 0, 1, 1, 0, 0, 1, 1, 3, 3, 2, 2, 3, 3, 2, 2],
      loop: 4,
      scale: 1.6,
      lit: 0.35,
    },
  },
  rain: {
    4: {
      cells: [0, 2, 1, 3, 1, 3, 2, 4, 2, 4, 3, 5, 3, 5, 4, 6],
      loop: 4,
      scale: 1.2,
      lit: 0.35,
    },
  },
  pulse: {
    4: {
      cells: [2, 1, 1, 2, 1, 0, 0, 1, 1, 0, 0, 1, 2, 1, 1, 2],
      loop: 2.4,
      scale: 2.5,
      lit: 0.45,
    },
  },
};

const LATTICE_DEFAULT_PATTERN: Record<LatticeGrid, LatticePatternName> = {
  3: 'orbit',
  4: 'sweep',
};

export const LATTICE_MARKS: Record<
  LatticeGrid,
  Record<'done' | 'error', number[]>
> = {
  3: { done: [2, 3, 5, 7], error: [0, 2, 4, 6, 8] },
  4: { done: [7, 8, 10, 13], error: [0, 3, 5, 6, 9, 10, 12, 15] },
};

export function resolveLatticePattern(
  pattern: LatticePatternName | LatticePattern,
  grid: LatticeGrid,
): LatticeResolvedPattern {
  if (typeof pattern === 'string') {
    const named = LATTICE_PATTERNS[pattern][grid];
    if (named) return named;
    const fallback = LATTICE_PATTERNS[LATTICE_DEFAULT_PATTERN[grid]][grid];
    if (fallback) return fallback;
    return {
      cells: Array.from({ length: grid * grid }, () => 0),
      loop: 4.2,
      scale: 1,
    };
  }
  const cells = Array.from(
    { length: grid * grid },
    (_, i) => pattern.cells[i] ?? null,
  );
  const steps = cells.filter((v): v is number => v !== null);
  const max = Math.max(0, ...steps);
  return {
    cells,
    loop: pattern.loop ?? max + 4.2,
    scale: pattern.scale ?? 1,
    lit: pattern.lit ?? 0.62,
  };
}

export function formatLatticeTime(ds: number): string {
  return ds < 600
    ? `${(ds / 10).toFixed(1)}s`
    : `${Math.floor(ds / 600)}m ${((ds % 600) / 10).toFixed(1)}s`;
}

export function speakLatticeTime(ds: number): string {
  return ds < 600
    ? `${(ds / 10).toFixed(1)} seconds`
    : `${Math.floor(ds / 600)} minutes ${((ds % 600) / 10).toFixed(1)} seconds`;
}
