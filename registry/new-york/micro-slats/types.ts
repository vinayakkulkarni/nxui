import type { RenderTarget } from 'ogl';
import type { StyleValue } from 'vue';

/** A starting look for the sea. */
export type MicroSlatsPreset = 'swell' | 'tide' | 'storm' | 'signal';

/** Linear RGBA colour, each channel in 0..1. */
export type MicroSlatsRgba = [number, number, number, number];

/** The wave values a preset fills in. */
export interface MicroSlatsWaveValues {
  /** Size of the swell. Larger values give longer, calmer waves. */
  scale: number;
  /** How fast the waves roll. 0 freezes the sea. */
  speed: number;
  /** Heading of the swell in degrees. 270 rolls towards the viewer. */
  direction: number;
  /** Sharpens the crests and flattens the troughs. */
  chop: number;
  /** How much each slat grows and shrinks with the wave under it. */
  stretch: number;
  /** Strength of the light caught on the crests. */
  glint: number;
  /** Spread between dark troughs and bright crests. */
  contrast: number;
  /** How far the sea recedes towards a horizon above the top edge. */
  perspective: number;
  /** Haze that fades the far rows into the background. */
  fog: number;
}

export interface MicroSlatsProps extends Partial<MicroSlatsWaveValues> {
  /** A starting look. Every wave prop overrides the preset value. */
  preset?: MicroSlatsPreset;
  /** Color of the slats. */
  color?: string;
  /** Color the slats shift towards on crests and in the cursor's light. */
  glintColor?: string;
  /** Color behind the slats. `transparent` shows the page through. */
  backgroundColor?: string;
  /** Width of one slat in CSS pixels. */
  slatWidth?: number;
  /** Full height of one slat in CSS pixels. */
  slatHeight?: number;
  /** Space between slats in CSS pixels. */
  gap?: number;
  /** Corner rounding, from square at 0 to a full pill at 1. */
  roundness?: number;
  /** Lets the cursor stir the water. */
  interactive?: boolean;
  /** Brightness of the light the cursor leaves in the water. */
  cursorStrength?: number;
  /** Radius of the patch of water the cursor pushes, in CSS pixels. */
  cursorSize?: number;
  /** How strongly the stirred water curls into eddies. */
  swirl?: number;
  /** How long the stirred water and its light linger, in seconds. */
  trail?: number;
  /** How far the slats tilt with the current. */
  lean?: number;
  /** Rolls the sea in from the horizon on mount. */
  intro?: boolean;
  /** Length of the intro in seconds. */
  introDuration?: number;
  /** Freezes the waves. The cursor can still stir the water. */
  paused?: boolean;
  /** Extra CSS classes for the root element. */
  class?: string;
  /** Inline styles for the root element. */
  style?: StyleValue;
}

export interface MicroSlatsSettings extends MicroSlatsWaveValues {
  color: MicroSlatsRgba;
  glintColor: MicroSlatsRgba;
  backgroundColor: MicroSlatsRgba;
  slatWidth: number;
  slatHeight: number;
  gap: number;
  roundness: number;
  interactive: boolean;
  cursorStrength: number;
  cursorSize: number;
  swirl: number;
  trail: number;
  lean: number;
  intro: boolean;
  introDuration: number;
  paused: boolean;
}

export interface MicroSlatsGridLayout {
  slatW: number;
  slatH: number;
  tilt: number;
  grid: number[];
  origin: number[];
}

export interface MicroSlatsPair {
  read: RenderTarget;
  write: RenderTarget;
}

export interface MicroSlatsFluid {
  width: number;
  height: number;
  velocity: MicroSlatsPair;
  ink: MicroSlatsPair;
  pressure: MicroSlatsPair;
  divergence: RenderTarget;
  curl: RenderTarget;
}

/** u, v, du, dv, splash turn (null for a drag splat). */
export type MicroSlatsSplat = [number, number, number, number, number | null];
