export interface PixelWaveProps {
  /** Animation speed multiplier. */
  speed?: number;
  /** Additional empty rows above and below the wave grid. */
  verticalPadding?: number;
  /** Run the looping swell animation. */
  animate?: boolean;
}

export interface PixelWaveEmit {
  (e: 'phase', phase: PixelWavePhase): void;
}

export type PixelWavePhase = 'crest' | 'trough' | 'fade' | 'rebuild';
