import type { PixelWavePhase } from './types';

/**
 * Cell palette indices for the pixel wave grid.
 * 0 = empty (dark LED), 1 = foam white, 2 = gray spray,
 * 3 = turquoise crest, 4 = teal water, 5 = ocean blue, 6 = deep navy.
 */
type WaveCell = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WAVE_COLS = 20;
export const WAVE_ROWS = 19;

/** Loop duration in frames at 60fps (~8.5s like a full swell cycle). */
const LOOP_FRAMES = 510;

const TAU = Math.PI * 2;

/**
 * Fraction of the loop elapsed for a frame.
 */
function loopT(frame: number): number {
  return (frame % LOOP_FRAMES) / LOOP_FRAMES;
}

/**
 * Named phase of the swell cycle, for accessibility/status reporting.
 */
export function phaseOf(frame: number): PixelWavePhase {
  const t = loopT(frame);
  if (t < 0.3) return 'crest';
  if (t < 0.55) return 'trough';
  if (t < 0.72) return 'fade';
  return 'rebuild';
}

/**
 * Global visibility of the wave through the cycle: full during crest/trough,
 * collapses to near-empty during the fade window, rebuilds before looping.
 */
function globalIntensity(frame: number): number {
  const t = loopT(frame);
  if (t < 0.55) return 1;
  if (t < 0.72) {
    // fade to black
    const u = (t - 0.55) / 0.17;
    return 1 - u * u * (3 - 2 * u);
  }
  if (t < 0.86) {
    // stay mostly dark, tiny ripple remains
    return 0.04;
  }
  const u = (t - 0.86) / 0.14;
  return 0.04 + 0.96 * u * u * (3 - 2 * u);
}

/**
 * Water surface height (in grid units, y down) at a column for a frame.
 * Two travelling sine layers + a slow swell harmonic produce the rolling
 * crest → trough morph without any cell displacement.
 */
function surfaceHeight(col: number, frame: number): number {
  const t = loopT(frame);
  const x = col / (WAVE_COLS - 1);
  const crest = Math.sin(x * Math.PI + t * TAU * 2) * 3.4;
  const swell = Math.sin(x * TAU * 0.8 - t * TAU) * 2.2;
  const chop = Math.sin(x * TAU * 2.4 + t * TAU * 3) * 0.9;
  const baseline = 13.2 + Math.sin(t * TAU) * 1.8;
  return baseline - (crest + swell + chop);
}

/**
 * Compute the cell value for one grid position at one frame.
 * Bands below the surface: foam → turquoise crest → teal → blue → navy.
 */
function cellAt(col: number, row: number, frame: number): WaveCell {
  const intensity = globalIntensity(frame);
  if (intensity <= 0.03) return 0;

  const x = col / (WAVE_COLS - 1);
  const surf = surfaceHeight(col, frame);
  if (row < surf) return 0;

  const depth = row - surf;
  const t = loopT(frame);
  const noise =
    Math.sin(col * 12.9898 + row * 78.233) * 43758.5453 -
    Math.floor(Math.sin(col * 12.9898 + row * 78.233) * 43758.5453);

  // Fade window: only a sparse low ripple survives.
  if (intensity < 0.35) {
    const rippleRow = WAVE_ROWS - 4 + Math.sin(x * TAU * 1.4 + t * TAU) * 1.2;
    if (Math.abs(row - rippleRow) < 1 && noise > 0.45) {
      return noise > 0.8 ? 2 : 3;
    }
    return 0;
  }

  // Foam cap right at the breaking crest.
  if (depth < 1.1) {
    return noise > 0.55 ? 1 : depth < 0.4 ? 3 : 4;
  }
  if (depth < 2.4) return noise > 0.72 ? 2 : 3;
  if (depth < 4.6) return 4;
  if (depth < 7.2) return noise > 0.88 ? 4 : 5;
  if (depth < 9.6) return noise > 0.82 ? 3 : 6;

  // Bottom: churned white foam floor with gaps.
  if (depth >= 9.6) {
    const churn = Math.sin(x * TAU * 3 + t * TAU * 2) * 0.5 + 0.5;
    if (noise > 0.35 + churn * 0.3) return 1;
    if (noise > 0.2) return 2;
    return 6;
  }
  return 6;
}

/**
 * Render the whole grid into a Uint8Array of palette indices.
 */
export function computeField(frame: number, out: Uint8Array): void {
  const intensity = globalIntensity(frame);
  for (let row = 0; row < WAVE_ROWS; row++) {
    for (let col = 0; col < WAVE_COLS; col++) {
      let cell = cellAt(col, row, frame);
      if (cell !== 0 && intensity < 1) {
        // probabilistic dimming during fade/rebuild
        const noise =
          Math.sin(col * 91.7 + row * 57.3 + frame * 0.11) * 10000 -
          Math.floor(Math.sin(col * 91.7 + row * 57.3 + frame * 0.11) * 10000);
        if (noise > intensity) cell = 0;
      }
      out[row * WAVE_COLS + col] = cell;
    }
  }
}
