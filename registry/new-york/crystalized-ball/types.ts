import type { Mesh, RenderTarget, Texture } from 'ogl';

export type CrystalizedBallPreset =
  | 'plasma'
  | 'aurora'
  | 'nebula'
  | 'ember'
  | 'frost'
  | 'solar'
  | 'eclipse'
  | 'abyss';
export type CrystalizedBallMotion = 'rise' | 'fall' | 'drift' | 'orbit';
export type CrystalizedBallParticleShape = 'square' | 'round';
export type CrystalizedBallTheme = 'dark' | 'light';
export type CrystalizedBallRgb = [number, number, number];

/** Values every preset defines. Each one can be overridden by a prop. */
export interface CrystalizedBallPresetValues {
  color: string;
  strands: number;
  crackle: number;
  flares: number;
  glow: number;
  sparks: number;
  particleCount: number;
  fill: number;
  motion: CrystalizedBallMotion;
  particleShape: CrystalizedBallParticleShape;
  depth: number;
  sway: number;
  twinkle: number;
  haze: number;
  dustSpeed: number;
}

export interface CrystalizedBallProps {
  /** A complete starting look, color included. */
  preset?: CrystalizedBallPreset;
  /** The one color of the ball. Every tone is derived from it. */
  color?: string;
  /** The background the ball sits on. */
  theme?: CrystalizedBallTheme;
  /** Diameter as a fraction of the smaller side of the container. */
  size?: number;
  /** Electric strands braided around the rim, 1 to 8. */
  strands?: number;
  /** How far the strands bend and jitter. */
  crackle?: number;
  /** How far the glow licks outward from the rim. */
  flares?: number;
  /** Strength of the halo around the rim. */
  glow?: number;
  /** How often small arcs discharge along the rim. 0 turns them off. */
  sparks?: number;
  /** Number of dust particles, up to 40000. */
  particleCount?: number;
  /** How full the ball is. */
  fill?: number;
  /** How the dust moves. */
  motion?: CrystalizedBallMotion;
  /** Crisp square pixels or soft round dots. */
  particleShape?: CrystalizedBallParticleShape;
  /** Strength of the depth cues. */
  depth?: number;
  /** How much the dust turns back and forth inside the glass. */
  sway?: number;
  /** How much the dust sparkles on and off. */
  twinkle?: number;
  /** Strength of the glow pooled under the dust and along the glass. */
  haze?: number;
  /** Animation speed of the rim, flares and sparks. */
  speed?: number;
  /** Animation speed of the dust. */
  dustSpeed?: number;
  /** Lets the cursor heat the rim, stir the dust and shake the ball. */
  interactive?: boolean;
  /** How strongly the ball reacts to the cursor, 0 to 1. */
  hoverStrength?: number;
  /** Power up the rim and light the dust from the bottom on mount. */
  intro?: boolean;
  /** Freezes the animation. The dust can still be stirred. */
  paused?: boolean;
  class?: string;
}

export interface CrystalizedBallPalette {
  rim: CrystalizedBallRgb;
  rimHot: CrystalizedBallRgb;
  rimMid: CrystalizedBallRgb;
  rimDeep: CrystalizedBallRgb;
  spark: CrystalizedBallRgb;
  sparkGlow: CrystalizedBallRgb;
  haze: CrystalizedBallRgb;
  edge: CrystalizedBallRgb;
  tones: CrystalizedBallRgb[];
}

export interface CrystalizedBallSettings extends Omit<
  CrystalizedBallPresetValues,
  'color'
> {
  light: boolean;
  palette: CrystalizedBallPalette;
  size: number;
  speed: number;
  interactive: boolean;
  hoverStrength: number;
  intro: boolean;
  paused: boolean;
  reducedMotion: boolean;
}

export interface CrystalizedBallStrandData {
  harmonics: number[];
  rates: number[];
  phases: number[];
  flareHarmonics: number[];
  flareRates: number[];
  flarePhases: number[];
}

export interface CrystalizedBallArc {
  start: number;
  span: number;
  curl: number;
  life: number;
  duration: number;
  drift: number;
  strength: number;
}

export interface CrystalizedBallDustData {
  home: Float32Array;
  seed: Float32Array;
  count: number;
  rows: number;
}

export interface CrystalizedBallDustLayer {
  requested: number;
  rows: number;
  home: Texture;
  seed: Texture;
  mesh: Mesh;
  read: RenderTarget | null;
  write: RenderTarget | null;
}

export interface CrystalizedBallEngine {
  wake: () => void;
  destroy: () => void;
}
