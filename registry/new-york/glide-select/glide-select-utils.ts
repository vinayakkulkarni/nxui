import type {
  GlideSelectItem,
  GlideSelectOption,
  GlideSelectSize,
  GlideSelectSizePreset,
} from './types';

export const SIZES: Record<GlideSelectSize, GlideSelectSizePreset> = {
  sm: { chip: 28, row: 26, font: 12 },
  md: { chip: 32, row: 30, font: 13 },
  lg: { chip: 44, row: 40, font: 14 },
};
export const PAD = 4;
export const GAP = 1;
export const MENU_GAP = 6;
export const DEFAULT_OPTIONS: GlideSelectItem[] = ['One', 'Two', 'Three'];

export function norm(o: GlideSelectItem): GlideSelectOption {
  return typeof o === 'string' ? { value: o, label: o } : o;
}

/** Next option after `from` whose label starts with `ch`, wrapping around. */
export function typeaheadIndex(
  items: GlideSelectOption[],
  from: number,
  ch: string,
): number {
  const c = ch.toLowerCase();
  const n = items.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (items[i]?.label.toLowerCase().startsWith(c)) return i;
  }
  return from;
}
