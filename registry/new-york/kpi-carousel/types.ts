export type KpiTone = 'best' | 'worst' | 'neutral';

export interface KpiCarouselItem {
  /** Card heading, e.g. `Best Contributor`. */
  title: string;
  /** Supporting line under the heading. */
  caption: string;
  /** Headline value on the right, e.g. `TCS` or `45.52`. */
  value: string;
  /** Percent change shown under the value, e.g. `4.2`. Omit to hide. */
  delta?: number;
  tone: KpiTone;
}

export interface KpiToneStyle {
  card: string;
  title: string;
  delta: string;
}

export interface KpiCarouselProps {
  /** Panel heading, e.g. `Active Top Names`. */
  title: string;
  items: KpiCarouselItem[];
  /** Advances automatically every N ms; `0` (default) disables autoplay. */
  interval?: number;
  class?: string;
}
