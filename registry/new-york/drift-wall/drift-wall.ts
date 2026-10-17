import type { DriftWallItem } from './types';

const DEFAULT_IDS = [
  1015, 1025, 1039, 1043, 1044, 1050, 1062, 1069, 1074, 1080, 1084, 106, 110,
  133, 164,
];

export const DRIFT_WALL_DEFAULT_ITEMS: DriftWallItem[] = DEFAULT_IDS.map(
  (id, i) => ({
    image: `https://picsum.photos/id/${id}/600/400`,
    title: `Tile ${i + 1}`,
  }),
);

/** Deterministic per-column speed multiplier (golden-ratio scatter). */
export function columnFactor(index: number, variance: number): number {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
}
