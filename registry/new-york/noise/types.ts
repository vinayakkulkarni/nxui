export type NoiseBlendMode =
  | 'normal'
  | 'overlay'
  | 'soft-light'
  | 'multiply'
  | 'screen'
  | 'difference';

export interface NoiseProps {
  /** Strength of the grain, from 0 to 1. */
  opacity?: number;
  /** Size of each grain in CSS pixels. 0.5 is one device pixel on retina screens. */
  size?: number;
  /** How many times per second the grain changes. 0 keeps it still. */
  fps?: number;
  /** How the grain mixes with what is underneath. */
  blendMode?: NoiseBlendMode;
  /** From soft, fine grain at 0 to harsh, punchy grain at 1. */
  contrast?: number;
  /** Uses colored grain instead of gray. */
  colored?: boolean;
  /** Specks, hairs and fibers that flicker over the frame, from 0 to 1. */
  dust?: number;
  /** How often thin vertical scratches run down the frame, from 0 to 1. */
  scratches?: number;
  /** Rolling horizontal lines, like an old screen, from 0 to 1. */
  scanlines?: number;
  /** Makes the grain strength jump a little every frame, from 0 to 1. */
  flicker?: number;
  /** Covers the whole viewport instead of the nearest positioned parent. */
  fixed?: boolean;
  /** Stacking order of the overlay. */
  zIndex?: number;
  /** Extra classes for the overlay. */
  class?: string;
}

export interface NoiseSettings {
  opacity: number;
  size: number;
  fps: number;
  flicker: number;
  dust: number;
  scratches: number;
}

export interface NoiseScratch {
  x: number;
  age: number;
  life: number;
  weight: number;
  light: boolean;
  phase: number;
}
