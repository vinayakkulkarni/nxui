export type KpiTone = 'best' | 'worst' | 'neutral';

export interface KpiToneStyle {
  badge: string;
  label: string;
  icon: string;
  glow: string;
}

export interface KpiCarouselItem {
  /** Short heading, e.g. `Best performer`. */
  title: string;
  /** Pre-formatted headline value, e.g. `$48.2k`. */
  value: string;
  /** Supporting line under the value. */
  caption: string;
  tone: KpiTone;
}

export interface KpiCarouselProps {
  items: KpiCarouselItem[];
  /** Advances automatically every N ms; `0` disables autoplay. */
  interval?: number;
  ariaLabel?: string;
  class?: string;
}
