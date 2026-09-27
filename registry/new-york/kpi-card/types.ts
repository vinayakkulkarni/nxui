export type KpiAccent = 'violet' | 'emerald' | 'blue' | 'rose' | 'amber';

export interface KpiPerson {
  /** Shown as initials when `src` is missing or fails to load. */
  name: string;
  src?: string;
}

export interface KpiAccentStyle {
  icon: string;
  glow: string;
}

export interface KpiCardProps {
  label: string;
  value: number;
  /** Lucide icon name without the prefix, e.g. `users`. */
  icon: string;
  /** Tints the icon box and the corner glow. */
  accent?: KpiAccent;
  /** People behind the metric, shown as an overlapping stack. */
  people?: KpiPerson[];
  /** People shown before collapsing the rest into `+N`. */
  maxPeople?: number;
  /** Shows the actions button; listen to `menu` to open your own menu. */
  showMenu?: boolean;
  class?: string;
}
