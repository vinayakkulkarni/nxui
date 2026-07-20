import type { PixelWavePhase, PixelWaveScene } from './types';

/**
 * Cell palette indices for the pixel grid. Index 0 is always the empty
 * (dark LED) cell; 1-6 are scene-specific ink colours, ordered brightest
 * (foam / sun / flame core) to darkest (deep water / shadow).
 */
type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WAVE_COLS = 20;
export const WAVE_ROWS = 19;

/** Loop duration in frames at 60fps (~8.5s like a full swell cycle). */
const LOOP_FRAMES = 510;

const TAU = Math.PI * 2;

/** Per-scene RGB palette, index 0 = empty cell, 1-6 = ink bands. */
export const SCENE_PALETTES: Record<
  PixelWaveScene,
  [number, number, number][]
> = {
  tahiti: [
    [10, 14, 20],
    [250, 250, 248], // foam
    [148, 163, 171], // gray spray
    [45, 212, 191], // turquoise
    [20, 158, 178], // teal
    [37, 99, 196], // ocean blue
    [19, 42, 99], // deep navy
  ],
  desert: [
    [10, 10, 10],
    [245, 245, 245], // sun white
    [255, 221, 99], // sky yellow
    [163, 148, 80], // dim ochre
    [240, 90, 36], // dune orange
    [141, 12, 50], // crimson
    [75, 10, 36], // deep burgundy
  ],
  hearth: [
    [10, 10, 10],
    [246, 245, 240], // white core
    [232, 197, 71], // gold
    [224, 138, 40], // orange
    [201, 62, 45], // ember red
    [141, 12, 50], // crimson
    [75, 12, 34], // ash
  ],
  mind: [
    [10, 10, 10],
    [214, 214, 210], // pale thought
    [169, 40, 61], // crimson thread
    [99, 29, 50], // deep crimson
    [34, 98, 96], // teal thread
    [22, 61, 62], // deep teal
    [37, 37, 33], // faint gray
  ],
};

/** Fraction of the loop elapsed for a frame. */
function loopT(frame: number): number {
  return (frame % LOOP_FRAMES) / LOOP_FRAMES;
}

/** Deterministic hash noise in [0, 1) for a cell. */
function hash(a: number, b: number): number {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Named phase of the loop, for accessibility/status reporting. */
export function phaseOf(frame: number): PixelWavePhase {
  const t = loopT(frame);
  if (t < 0.3) return 'crest';
  if (t < 0.55) return 'trough';
  if (t < 0.72) return 'fade';
  return 'rebuild';
}

/**
 * Global visibility through the cycle: full during the first half,
 * collapses to near-empty during the fade window, rebuilds before looping.
 */
function globalIntensity(frame: number): number {
  const t = loopT(frame);
  if (t < 0.55) return 1;
  if (t < 0.72) {
    const u = (t - 0.55) / 0.17;
    return 1 - u * u * (3 - 2 * u);
  }
  if (t < 0.86) return 0.04;
  const u = (t - 0.86) / 0.14;
  return 0.04 + 0.96 * u * u * (3 - 2 * u);
}

/* ------------------------------------------------------------------ */
/* Scene: Tahiti — a rolling ocean swell anchored to the bottom.       */
/* ------------------------------------------------------------------ */

function surfaceHeight(col: number, frame: number): number {
  const t = loopT(frame);
  const x = col / (WAVE_COLS - 1);
  const crest = Math.sin(x * Math.PI + t * TAU * 2) * 3.4;
  const swell = Math.sin(x * TAU * 0.8 - t * TAU) * 2.2;
  const chop = Math.sin(x * TAU * 2.4 + t * TAU * 3) * 0.9;
  const baseline = 13.2 + Math.sin(t * TAU) * 1.8;
  return baseline - (crest + swell + chop);
}

function tahitiCell(col: number, row: number, frame: number): Cell {
  const x = col / (WAVE_COLS - 1);
  const surf = surfaceHeight(col, frame);
  if (row < surf) return 0;

  const depth = row - surf;
  const t = loopT(frame);
  const noise = hash(col, row);
  const intensity = globalIntensity(frame);

  if (intensity < 0.35) {
    const rippleRow = WAVE_ROWS - 4 + Math.sin(x * TAU * 1.4 + t * TAU) * 1.2;
    if (Math.abs(row - rippleRow) < 1 && noise > 0.45) {
      return noise > 0.8 ? 2 : 3;
    }
    return 0;
  }

  if (depth < 1.1) return noise > 0.55 ? 1 : depth < 0.4 ? 3 : 4;
  if (depth < 2.4) return noise > 0.72 ? 2 : 3;
  if (depth < 4.6) return 4;
  if (depth < 7.2) return noise > 0.88 ? 4 : 5;
  if (depth < 9.6) return noise > 0.82 ? 3 : 6;

  const churn = Math.sin(x * TAU * 3 + t * TAU * 2) * 0.5 + 0.5;
  if (noise > 0.35 + churn * 0.3) return 1;
  if (noise > 0.2) return 2;
  return 6;
}

/* ------------------------------------------------------------------ */
/* Scene: Desert — sky bands, a pulsing sun disc, undulating dunes.    */
/* ------------------------------------------------------------------ */

function desertCell(col: number, row: number, frame: number): Cell {
  const t = loopT(frame);
  const x = col / (WAVE_COLS - 1);
  const cx = (WAVE_COLS - 1) / 2;

  // Horizon undulates gently around row 9.
  const horizon = 9 + Math.sin(x * TAU + t * TAU) * 1.1;

  // Sun disc sitting on the horizon, pulsing in size + brightness.
  const sunR = 2.6 + Math.sin(t * TAU) * 0.9;
  const sunY = 12.5;
  const dx = col - cx;
  const dy = row - sunY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const bright = t < 0.5;
  if (dist < sunR) return bright ? 1 : 2;

  if (row < horizon) {
    // Sky: yellow near horizon fading to dim ochre up top.
    const band = (horizon - row) / horizon;
    const noise = hash(col, row);
    if (band < 0.4) return bright ? 2 : 3;
    return noise > 0.5 && bright ? 2 : 3;
  }

  // Dunes: orange highlights near the crest, deep burgundy below.
  const depth = row - horizon;
  const noise = hash(col + 5, row);
  if (depth < 1.4) return noise > 0.6 ? 4 : 5;
  if (depth < 3.2) return noise > 0.5 ? 5 : 6;
  if (depth < 5) return noise > 0.7 ? 4 : 6;
  return noise > 0.82 ? 5 : 6;
}

/* ------------------------------------------------------------------ */
/* Scene: Hearth — an inverted-triangle flame from the top centre.     */
/* ------------------------------------------------------------------ */

function hearthCell(col: number, row: number, frame: number): Cell {
  const t = loopT(frame);
  const cx = (WAVE_COLS - 1) / 2;

  // Inverted triangle: widest at the top row, tapering to a point near the
  // bottom. Half-width shrinks linearly with depth, with a gentle flicker.
  const flicker = Math.sin(col * 0.9 + t * TAU * 2) * 0.9;
  const halfWidth = (WAVE_COLS / 2) * (1 - row / (WAVE_ROWS - 1)) + flicker;
  const dxAbs = Math.abs(col - cx);
  const noise = hash(col, row + Math.floor(frame * 0.06));

  if (dxAbs > halfWidth) {
    // A few embers break off just beyond the flame edge.
    if (dxAbs < halfWidth + 2.2 && noise > 0.86) return row < 8 ? 3 : 4;
    return 0;
  }

  // Heat falls off from the wide bright top toward the crimson tip and the
  // cooler outer edges.
  const edge = halfWidth <= 0 ? 1 : dxAbs / halfWidth;
  const heat = (1 - row / WAVE_ROWS) * 0.85 + (1 - edge) * 0.25;
  const h = heat + (noise - 0.5) * 0.16;
  if (h > 0.72) return 1;
  if (h > 0.56) return 2;
  if (h > 0.4) return 3;
  if (h > 0.24) return 4;
  if (h > 0.12) return 5;
  return 6;
}

/* ------------------------------------------------------------------ */
/* Scene: Mind — two sparse threads that drift, meet, then part.       */
/* ------------------------------------------------------------------ */

function threadCol(phase: number, frame: number, amp: number): number {
  const t = loopT(frame);
  const cx = (WAVE_COLS - 1) / 2;
  // Threads converge to centre mid-loop, then separate.
  const converge = Math.sin(t * TAU) * 0.5 + 0.5; // 0 apart → 1 together
  const spread = amp * (1 - converge);
  return cx + Math.sin(frame * 0.03 + phase) * 1.6 + spread;
}

function mindCell(col: number, row: number, frame: number): Cell {
  // Two vertical wandering threads through the mid rows.
  if (row < 3 || row > WAVE_ROWS - 3) return 0;
  const a = threadCol(0, frame, 4.5);
  const b = threadCol(Math.PI, frame, -4.5);
  const noise = hash(col, row + Math.floor(frame * 0.04));
  const da = Math.abs(col - a);
  const db = Math.abs(col - b);
  if (da < 1 && noise > 0.35) return da < 0.5 ? 2 : 3;
  if (db < 1 && noise > 0.35) return db < 0.5 ? 4 : 5;
  // Faint connective haze where the threads are close.
  if (Math.abs(a - b) < 2.5 && (da < 2 || db < 2) && noise > 0.75) return 6;
  return 0;
}

const SCENE_FIELDS: Record<
  PixelWaveScene,
  (col: number, row: number, frame: number) => Cell
> = {
  tahiti: tahitiCell,
  desert: desertCell,
  hearth: hearthCell,
  mind: mindCell,
};

/**
 * Render the whole grid into a Uint8Array of palette indices for a scene.
 */
export function computeField(
  scene: PixelWaveScene,
  frame: number,
  out: Uint8Array,
): void {
  const intensity = globalIntensity(frame);
  const fieldFn = SCENE_FIELDS[scene];
  for (let row = 0; row < WAVE_ROWS; row++) {
    for (let col = 0; col < WAVE_COLS; col++) {
      let cell: Cell = intensity <= 0.03 ? 0 : fieldFn(col, row, frame);
      if (cell !== 0 && intensity < 1) {
        // probabilistic dimming during the fade/rebuild window
        if (hash(col * 4.7 + row * 2.9, frame * 0.11) > intensity) cell = 0;
      }
      out[row * WAVE_COLS + col] = cell;
    }
  }
}
