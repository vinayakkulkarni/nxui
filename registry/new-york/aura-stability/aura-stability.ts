import type {
  AuraStabilityMarker,
  AuraStabilityRun,
  AuraStabilityStar,
} from './types';

export const DEFAULT_RUNS: AuraStabilityRun[] = [
  { label: '06:00', min: 3.98, max: 9.14 },
  { label: '09:00', min: 2.65, max: 8.0 },
  { label: '12:00', min: 3.52, max: 9.21 },
  { label: '15:00', min: 5.57, max: 7.75 },
  { label: '18:00', min: 3.88, max: 9.13 },
  { label: '21:00', min: 4.89, max: 7.53 },
];

export const DEFAULT_MARKERS: AuraStabilityMarker[] = [
  { label: 'B', value: 9.21 },
  { label: 'A', value: 3.52 },
];

const WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
];

export function countWord(n: number): string {
  return WORDS[n] ?? String(n);
}

/** Index of the run with the largest drift. */
export function peakIndex(runs: AuraStabilityRun[]): number {
  let best = 0;
  runs.forEach((run, i) => {
    const top = runs[best];
    if (top && run.max > top.max) best = i;
  });
  return best;
}

/** Small deterministic PRNG so server and client place the same stars. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 1_831_565_813) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function starField(count: number, seed = 5): AuraStabilityStar[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: Math.round(rand() * 1000) / 10,
    y: Math.round(rand() * 700) / 10,
    size: rand() < 0.12 ? 2 : 1,
    opacity: Math.round((0.25 + rand() * 0.6) * 100) / 100,
  }));
}
