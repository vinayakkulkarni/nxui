import type { ComponentPublicInstance, HTMLAttributes } from 'vue';

/** A built-in colour set for the wave's glowing edge. */
export type DistortionWaveTheme = 'prism' | 'meadow' | 'lagoon' | 'ember';

/** Where the wave leaves from: an element (or a component), a box in the
 *  wave's own CSS pixels, or nothing to use the last pressed control. */
export type DistortionWaveSource =
  | Element
  | ComponentPublicInstance
  | DistortionWaveBox
  | null
  | undefined;

export interface DistortionWaveBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DistortionWavePoint {
  x: number;
  y: number;
}

export type DistortionWaveMotion = 'auto' | 'full' | 'reduce';

export interface DistortionWaveProps {
  /** Which view shows. Changing it runs the wave (use `v-model:revealed`). */
  revealed?: boolean;
  /** The element, component or box the wave leaves from. */
  source?: DistortionWaveSource;
  /** A preset, or 2–4 colours (`#rrggbb`) for the glowing edge. */
  colors?: DistortionWaveTheme | string[];
  /** Seconds the wave takes to cross. */
  duration?: number;
  /** Seconds the wave takes to fold back. */
  returnDuration?: number;
  /** How strongly the edge bends what it passes over (0–2). */
  refraction?: number;
  /** How far the colour channels split at the edge (0–2). */
  aberration?: number;
  /** How far the front leans toward the press (0–1). */
  lean?: number;
  /** Sparks behind the front. */
  sparks?: boolean;
  /** Corner radius of the glow in CSS pixels. Default: the element's own. */
  radius?: number;
  /** `auto` follows the reduced-motion setting; `reduce` always crossfades. */
  motion?: DistortionWaveMotion;
  class?: HTMLAttributes['class'];
}

export interface DistortionWavePlayOptions {
  source?: DistortionWaveSource;
  /** The press point in the wave's CSS pixels: the front leans toward it. */
  point?: DistortionWavePoint | null;
}

export interface DistortionWaveExpose {
  /** Runs the wave to the revealed view. */
  play: (options?: DistortionWavePlayOptions) => void;
  /** Folds the wave back to the first view. */
  reverse: () => void;
  /** Jumps to the first view with no wave. */
  reset: () => void;
  /** Takes the pictures now so the next wave starts at once. */
  prepare: () => Promise<void>;
}

/** Everything the shader needs for one frame. */
export interface WaveFrame {
  /** Source centre, CSS px. */
  cx: number;
  cy: number;
  /** How much wider than tall the front grows (1 = a ring). */
  hw: number;
  /** The source's own radius, CSS px. */
  hh: number;
  /** Lean direction times strength. */
  lx: number;
  ly: number;
  /** Front distance from the source, CSS px. */
  reach: number;
  /** Width of the bending band, CSS px. */
  band: number;
  /** Pull toward the source before launch, 0–1. */
  pull: number;
  /** Strength of the glowing band, 0–1. */
  glow: number;
  /** Strength of the glow left on the rim, 0–1. */
  rim: number;
  /** How far the revealed view has cleared its blur, 0–1. */
  settle: number;
  time: number;
}

export interface WaveLook {
  colors: [number, number, number][];
  refraction: number;
  aberration: number;
  sparks: boolean;
  radius: number;
  light: boolean;
}
