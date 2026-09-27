export type KpiValueFormat = 'number' | 'currency' | 'percent' | 'compact';

export interface KpiAvatar {
  src: string;
  alt: string;
}

export interface KpiCardProps {
  label: string;
  value: number;
  format?: KpiValueFormat;
  /** ISO 4217 code used when `format` is `currency`. */
  currency?: string;
  /** Percent change against the comparison period, e.g. `12.4` or `-3.1`. */
  delta?: number;
  /** Shown after the delta, e.g. `vs last month`. */
  deltaLabel?: string;
  /** Treats a falling value as good news, e.g. churn or latency. */
  invertDelta?: boolean;
  /** Lucide icon name without the prefix, e.g. `users`. */
  icon?: string;
  /** Recent values; renders a sparkline when two or more are given. */
  trend?: number[];
  /** People behind the metric, shown as an overlapping stack. */
  avatars?: KpiAvatar[];
  /** Avatars shown before collapsing the rest into `+N`. */
  maxAvatars?: number;
  class?: string;
}
