import type { RenderTarget } from 'ogl';
import type { StyleValue } from 'vue';

/** A complete starting look for the surface. */
export type PatternWavesPreset =
  | 'silk'
  | 'ocean'
  | 'pond'
  | 'lines'
  | 'terminal'
  | 'mesh';

/** The mark that draws the surface. */
export type PatternWavesPattern = 'dot' | 'square' | 'plus' | 'line' | 'glyph';

/** The shape of the moving surface. */
export type PatternWavesWave = 'silk' | 'swell' | 'ripple';

/** Where the pattern fades into the background. */
export type PatternWavesFade = 'edges' | 'center' | 'bottom' | 'top' | 'none';

/** RGBA color with channels from 0 to 1. */
export type PatternWavesRgba = [number, number, number, number];

/** The values a preset fills in. Each one can be overridden by its prop. */
export interface PatternWavesPresetValues {
  pattern: PatternWavesPattern;
  wave: PatternWavesWave;
  spacing: number;
  markSize: number;
  depth: number;
  light: number;
  shine: number;
  contrast: number;
  speed: number;
  scale: number;
  direction: number;
}

/**
 * Props for the PatternWaves registry component.
 * Ported from React Bits (Backgrounds/PatternWaves).
 */
export interface PatternWavesProps {
  /** A complete starting look. Pattern, wave and light props override it. */
  preset?: PatternWavesPreset;
  /** The mark that draws the surface. Defaults to the preset value. */
  pattern?: PatternWavesPattern;
  /** The shape of the moving surface. Defaults to the preset value. */
  wave?: PatternWavesWave;
  /** Distance between marks in CSS pixels. */
  spacing?: number;
  /** Largest mark as a fraction of the spacing. */
  markSize?: number;
  /** How tall the surface is. */
  depth?: number;
  /** Angle of the light across the waves in degrees, -90 to 90. */
  light?: number;
  /** Strength of the glints where the surface catches the light. */
  shine?: number;
  /** Spread between the quiet shadows and the lit areas. */
  contrast?: number;
  /** How fast the surface moves. 0 freezes it. */
  speed?: number;
  /** Size of the waves. */
  scale?: number;
  /** Direction the waves travel in degrees. The light turns with it. */
  direction?: number;
  /** The one color of the pattern. A color darker than the background prints like ink. */
  color?: string;
  /** Color behind the pattern. Pass transparent to show the page through. */
  backgroundColor?: string;
  /** Overall opacity of the pattern, 0 to 1. */
  opacity?: number;
  /** Where the pattern fades into the background. */
  fade?: PatternWavesFade;
  /** How far the fade reaches, 0.05 to 1. */
  fadeSize?: number;
  /** Characters for the glyph pattern, lightest to densest. */
  characters?: string;
  /** Lets the cursor disturb the surface. A click drops a splash. */
  interactive?: boolean;
  /** Radius of the patch the cursor pushes, in CSS pixels. */
  cursorSize?: number;
  /** How hard the cursor pushes the surface, 0 to 1. */
  cursorStrength?: number;
  /** Marks fade in from the center, then the surface rises. */
  intro?: boolean;
  /** Freezes the surface. Cursor ripples keep working. */
  paused?: boolean;
  /** Extra CSS classes for the root element. */
  class?: string;
  /** Inline styles for the root element. */
  style?: StyleValue;
}

/** Resolved settings the render loop reads every frame. */
export interface PatternWavesSettings extends PatternWavesPresetValues {
  color: PatternWavesRgba;
  background: PatternWavesRgba;
  opacity: number;
  fade: PatternWavesFade;
  fadeSize: number;
  characters: string;
  interactive: boolean;
  cursorSize: number;
  cursorStrength: number;
  intro: boolean;
  paused: boolean;
}

/** A glyph atlas drawn on a 2D canvas. */
export interface PatternWavesAtlas {
  canvas: HTMLCanvasElement;
  columns: number;
  lines: number;
  count: number;
}

/** Ping-pong height field for the cursor ripples. */
export interface PatternWavesRippleField {
  width: number;
  height: number;
  read: RenderTarget;
  write: RenderTarget;
}
