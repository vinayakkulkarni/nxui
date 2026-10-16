import type {
  FolderFloatEntry,
  FolderFloatPos,
  FolderFloatSize,
} from './types';

const PAD = 28;
const CHAR = 6.8;
const GAP = 12;
const ROW = 52;

/** Deterministic 0..1 noise per index (SSR-safe, no Math.random). */
export function jitter(i: number): number {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
}

/** Pack pills into centred, alternately offset rows above the folder. */
export function layout(
  list: FolderFloatEntry[],
  spread: number,
  lift: number,
  tilt: number,
  sizes: FolderFloatSize[],
): FolderFloatPos[] {
  const rows: Array<{
    items: Array<{ i: number; pw: number }>;
    width: number;
  }> = [];
  let row: Array<{ i: number; pw: number }> = [];
  let width = 0;
  list.forEach((item, i) => {
    const pw = sizes[i]?.w ?? PAD + item.label.length * CHAR;
    if (row.length && width + GAP + pw > spread * 2) {
      rows.push({ items: row, width });
      row = [];
      width = 0;
    }
    row.push({ i, pw });
    width += (row.length > 1 ? GAP : 0) + pw;
  });
  if (row.length) rows.push({ items: row, width });
  const pos: FolderFloatPos[] = [];
  rows.forEach((r, ri) => {
    let x = -r.width / 2;
    const shift = (ri % 2 ? 1 : -1) * Math.min(16, spread * 0.1);
    r.items.forEach(({ i, pw }) => {
      const j = jitter(i);
      pos[i] = {
        x: x + pw / 2 + shift + (j - 0.5) * 6,
        y: -lift - ri * ROW - j * 6,
        r: tilt * (j * 2 - 1),
      };
      x += pw + GAP;
    });
  });
  return pos;
}
