export type MotionBentoArt =
  | 'commerce'
  | 'sla'
  | 'integrations'
  | 'design'
  | 'hosting';

export type MotionBentoSpan = 3 | 4 | 5 | 6 | 7 | 8 | 12;

export interface MotionBentoItem {
  /** Card title shown under the artwork. */
  title: string;
  /** One-line description under the title. */
  description?: string;
  /** Built-in animated artwork. Leave empty to use the `art` slot. */
  art?: MotionBentoArt;
  /** Columns out of 12 the card spans from the `md` breakpoint. */
  span?: MotionBentoSpan;
}

export interface MotionBentoProps {
  /** Cards, placed in order into a 12-column grid. */
  items: MotionBentoItem[];
  /** Section headline. */
  heading?: string;
  /** Part of `heading` drawn in a heavier weight. */
  highlight?: string;
  /** Label of the call-to-action button. Empty hides it. */
  ctaLabel?: string;
  /** Turns the call-to-action into a link. */
  ctaHref?: string;
  /** Accent colour for the artwork and the button. */
  accent?: string;
  /** Freezes every artwork loop. */
  paused?: boolean;
  class?: string;
}

export interface MotionBentoArtProps {
  /** Runs the loop. Off-screen or paused bentos pass `false`. */
  playing?: boolean;
  /** Shows a finished, static frame (reduced motion). */
  still?: boolean;
}

export interface MotionBentoCardProps {
  item: MotionBentoItem;
  playing: boolean;
  still: boolean;
}

export interface MotionBentoArtSlotProps {
  item: MotionBentoItem;
  index: number;
  playing: boolean;
  still: boolean;
}

export interface MotionBentoProduct {
  name: string;
  price: string;
  icon: string;
  tint: string;
  ink: string;
}

export interface MotionBentoPose {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  z: number;
}

export interface MotionBentoSatellite {
  icon: string;
  color: string;
  x: number;
  y: number;
}
