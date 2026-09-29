export type EraFont = 'pixel' | 'classic' | 'modern';

export interface ButtonEra {
  year: number;
  /** Surface class defined in ButtonEvolution.vue. */
  surface: string;
  font: EraFont;
  /** Light label for dark surfaces. */
  light?: boolean;
}

export interface ButtonEvolutionProps {
  /** Plays a short synthesized click on each era change. */
  sound?: boolean;
  class?: string;
}

export interface ButtonEvolutionDigitProps {
  digit: number;
}
