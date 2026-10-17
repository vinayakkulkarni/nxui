import type {
  MasonryColumns,
  MasonryGrid,
  MasonryItem,
  MasonryLayout,
  MasonryMeasured,
  MasonryRect,
  MasonryTile,
} from './types';

export const NO_TILES: readonly MasonryTile[] = [];

export const DIRECTIONS = ['bottom', 'top', 'left', 'right'] as const;
export const EASE = 'cubic-bezier(0.2, 0.9, 0.2, 1)';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function keyOf(item: MasonryItem): string {
  return String(item.id);
}

/** Height / width ratio of an item, from its props or its measured image. */
export function aspectOf(item: MasonryItem, measured: MasonryMeasured) {
  const width = item.width ?? 0;
  const height = item.height ?? 0;
  if (width > 0 && height > 0) return height / width;
  const known = measured[keyOf(item)];
  if (known) return known;
  if (height > 0) return height / 600;
  return 1;
}

export function needsMeasure(item: MasonryItem): boolean {
  return !((item.height ?? 0) > 0);
}

function gridOf(
  width: number,
  columns: MasonryColumns,
  columnWidth: number,
  gap: number,
): MasonryGrid {
  const fixed = Number(columns);
  const count =
    columns !== 'auto' && fixed > 0
      ? Math.max(1, Math.round(fixed))
      : Math.max(
          1,
          Math.floor((width + gap) / (Math.max(40, columnWidth) + gap)),
        );
  return { count, size: Math.max(1, (width - gap * (count - 1)) / count) };
}

/** Drop an item into the shortest run of columns it spans. */
function place(
  heights: number[],
  item: MasonryItem,
  grid: MasonryGrid,
  gap: number,
  measured: MasonryMeasured,
  commit: boolean,
): MasonryRect {
  const { count, size } = grid;
  const span = Math.min(count, Math.max(1, Math.round(item.span || 1)));
  let column = 0;
  let top = Infinity;
  for (let start = 0; start <= count - span; start++) {
    let y = 0;
    for (let k = start; k < start + span; k++) y = Math.max(y, heights[k] ?? 0);
    if (y < top - 0.5) {
      top = y;
      column = start;
    }
  }
  const w = size * span + gap * (span - 1);
  const h = Math.max(1, w * aspectOf(item, measured));
  if (commit) {
    for (let k = column; k < column + span; k++) heights[k] = top + h + gap;
  }
  return { x: Math.round(column * (size + gap)), y: Math.round(top), w, h };
}

export function layoutOf(
  list: MasonryItem[],
  width: number,
  columns: MasonryColumns,
  columnWidth: number,
  gap: number,
  measured: MasonryMeasured,
): MasonryLayout {
  const grid = gridOf(width, columns, columnWidth, gap);
  const heights: number[] = Array.from({ length: grid.count }, () => 0);
  const tiles = list.map((item) => ({
    item,
    id: keyOf(item),
    ...place(heights, item, grid, gap, measured, true),
  }));
  return { tiles, height: Math.max(0, Math.max(...heights) - gap) };
}

/** Centre of every slot the dragged tile could drop into, in order. */
export function slotsFor(
  others: MasonryItem[],
  dragged: MasonryItem,
  width: number,
  columns: MasonryColumns,
  columnWidth: number,
  gap: number,
  measured: MasonryMeasured,
) {
  const grid = gridOf(width, columns, columnWidth, gap);
  const heights: number[] = Array.from({ length: grid.count }, () => 0);
  const slots: { x: number; y: number }[] = [];
  for (let i = 0; i <= others.length; i++) {
    const slot = place(heights, dragged, grid, gap, measured, false);
    slots.push({ x: slot.x + slot.w / 2, y: slot.y + slot.h / 2 });
    const other = others[i];
    if (other) place(heights, other, grid, gap, measured, true);
  }
  return slots;
}

/** Nearest scrolling ancestor, or null when the page itself scrolls. */
export function scrollerOf(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (
      (overflow === 'auto' ||
        overflow === 'scroll' ||
        overflow === 'overlay') &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}
