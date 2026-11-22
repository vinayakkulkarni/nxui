import type { AuraSpeedTestLossDot } from './types';

/** Small deterministic PRNG so server and client render the same dots. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 1_831_565_813) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RAMP = 6;
const RAMP_END = 1 - Math.exp(-RAMP);

/** Share of the final speed reached at progress `p` (0–1): a fast ramp, then a plateau. */
function rampAt(p: number): number {
  const t = Math.min(Math.max(p, 0), 1);
  return (1 - Math.exp(-RAMP * t)) / RAMP_END;
}

/** Live download reading: the ramp plus a wobble that fades out as the run settles. */
export function downloadAt(p: number, target: number): number {
  if (p >= 1) return target;
  const wobble = 0.045 * Math.sin(p * 37) + 0.025 * Math.sin(p * 91);
  return Math.max(0, target * rampAt(p) * (1 + wobble * (1 - p)));
}

/** Upload is measured in the second half of the run. */
export function uploadAt(p: number, target: number): number {
  if (p >= 1) return target;
  const t = (p - 0.55) / 0.45;
  if (t <= 0) return 0;
  return target * (1 - (1 - t) ** 3);
}

/** Ping is measured first and settles from a high first sample. */
export function pingAt(p: number, target: number): number {
  const t = Math.min(p / 0.14, 1);
  return target + (1 - t) * target * 3;
}

/** Column shape (0.5–1) that gives the spectrum its uneven skyline. */
export function spectrumShape(columns: number, seed = 7): number[] {
  const rand = seeded(seed);
  return Array.from({ length: columns }, (_, i) => {
    const wave = 0.5 + 0.5 * Math.sin(i * 0.55 + 1.3);
    return 0.6 + 0.22 * wave + 0.18 * rand();
  });
}

/** Lit dots for column `i` once the run has measured it. */
export function columnLevel(
  i: number,
  columns: number,
  rows: number,
  shape: number,
): number {
  const share = rampAt((i + 1) / columns);
  return Math.max(1, Math.min(rows, Math.round(rows * shape * share)));
}

/** A 10 × 10 packet grid: arrival order, lost packets and late packets. */
export function lossLayout(loss: number, seed = 11): AuraSpeedTestLossDot[] {
  const count = 100;
  const rand = seeded(seed);
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = order[i] ?? i;
    order[i] = order[j] ?? j;
    order[j] = a;
  }
  const lost = Math.min(count, Math.max(0, Math.round(loss)));
  // The lost packets are the last ones due, so they show up as gaps at the end of a run.
  return order.map((rank) => {
    const isLost = rank >= count - lost;
    return { rank, lost: isLost, late: !isLost && rand() < 0.16 };
  });
}
