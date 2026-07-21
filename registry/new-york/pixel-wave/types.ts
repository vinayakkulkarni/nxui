/** Available pixel-art scenes rendered on the LED grid. */
export type PixelWaveScene = 'tahiti' | 'desert' | 'hearth' | 'mind';

export interface PixelWaveProps {
  /** Which pixel-art scene to render. */
  scene?: PixelWaveScene;
  /** Animation speed multiplier. */
  speed?: number;
  /** Additional empty rows above and below the scene grid. */
  verticalPadding?: number;
  /** Run the looping animation. */
  animate?: boolean;
}

export interface PixelWaveEmit {
  (e: 'phase', phase: PixelWavePhase): void;
}

export type PixelWavePhase = 'crest' | 'trough' | 'fade' | 'rebuild';
