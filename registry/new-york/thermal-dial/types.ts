export type ThermalDialTheme = 'light' | 'dark';

export type ThermalDialSeason = 'Winter' | 'Autumn' | 'Spring' | 'Summer';

export interface ThermalDialProps {
  /** The reading it settles on after its opening sweep (when no v-model is bound). */
  defaultValue?: number;
  min?: number;
  max?: number;
  /** How wide the card is drawn, in px; it never exceeds 80% of the viewport. */
  size?: number;
  theme?: ThermalDialTheme;
  /** A line under the card saying how to use it. */
  hint?: boolean;
  /** Accessible name of the slider. */
  label?: string;
  class?: string;
}

/** Static geometry of one tick on the ring. */
export interface ThermalDialTick {
  /** Position along the sweep, 0–1. */
  tf: number;
  /** `rotate(...)` transform about the dial centre. */
  transform: string;
  /** Fade toward both ends of the arc, 0–1. */
  edge: number;
}
