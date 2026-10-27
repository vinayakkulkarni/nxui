import type { VariantType } from 'motion-v';

/** Variants keyed by label; functions receive the swap direction as `custom`. */
export type LiquidTabsVariants = Record<
  string,
  VariantType | ((dir: number) => VariantType)
>;

/** Custom glyphs drawn by the component itself (no Iconify equivalent). */
export type LiquidTabsGlyphName = 'dome' | 'shield-outline' | 'shield-notch';

export type LiquidTabsTheme = 'light' | 'dark';

export type LiquidTabsRowCount = 2 | 3 | 4;

/** The row payload passed to the `select` event. */
export interface LiquidTabsItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
}

export interface LiquidTabsRow extends LiquidTabsItem {
  /** An Iconify name such as `lucide:inbox`, or one of the built-in glyphs. */
  icon: LiquidTabsGlyphName | string;
}

export interface LiquidTabsTab {
  key: string;
  label: string;
  rows: LiquidTabsRow[];
  /** Id of the row selected when the tab first opens. */
  selected?: string;
}

export interface LiquidTabsProps {
  /** The card's corner radius, 0–40px. */
  corner?: number;
  /** How many rows each tab shows. */
  rows?: LiquidTabsRowCount;
  theme?: LiquidTabsTheme;
  /** The fixed leading tabs. */
  tabs?: LiquidTabsTab[];
  /** Tabs offered by the chevron menu. The picked one becomes the last tab. */
  overflow?: LiquidTabsTab[];
  /** Accessible name of the tab list. */
  label?: string;
  class?: string;
}

export interface LiquidTabsGlyphProps {
  name: LiquidTabsGlyphName;
  size?: number;
}

export interface LiquidTabsBlob {
  x: number;
  w: number;
}
