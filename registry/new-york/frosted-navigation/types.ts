export interface FrostedNavigationTab {
  id: string;
  label: string;
  /** Iconify icon name, e.g. `lucide:circle`. */
  icon: string;
}

export interface FrostedNavigationProps {
  tabs: FrostedNavigationTab[];
  /** Placeholder for the search pill. */
  placeholder?: string;
  /** Accent color for the active tab. */
  accent?: string;
  /** Height of the frost zone in pixels. */
  frostHeight?: number;
  class?: string;
}
