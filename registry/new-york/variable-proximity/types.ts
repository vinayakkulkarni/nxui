export type VariableProximityFalloff = 'linear' | 'exponential' | 'gaussian';

export interface VariableProximityProps {
  label: string;
  /** Variation settings letters rest at, away from the cursor. */
  fromFontVariationSettings?: string;
  /** Variation settings reached right under the cursor. */
  toFontVariationSettings?: string;
  /** Optional element around the text; distance checks are skipped while the cursor is farther than `radius` from it. */
  containerRef?: HTMLElement | null;
  radius?: number;
  falloff?: VariableProximityFalloff;
  /** 0 (instant) to 1 (slow trailing wake). */
  smoothing?: number;
  fromColor?: string;
  toColor?: string;
  /** Size a letter grows to under the cursor. 1 keeps the normal size. */
  scale?: number;
  /** How far (em) a letter under the cursor rises. */
  lift?: number;
  idleWave?: boolean;
  /** Numbers are px. Inherits the surrounding size when unset. */
  fontSize?: number | string;
  class?: string;
}

export interface VariableProximityAxis {
  axis: string;
  fromValue: number;
  toValue: number;
}

export interface VariableProximityLetter {
  index: number;
  char: string;
}

export interface VariableProximityWord {
  key: string;
  letters: VariableProximityLetter[];
}

export interface VariableProximityOptions {
  axes: VariableProximityAxis[];
  fromFontVariationSettings: string;
  container: HTMLElement | null;
  radius: number;
  falloff: VariableProximityFalloff;
  smoothing: number;
  fromColor: string | undefined;
  toColor: string | undefined;
  scale: number;
  lift: number;
  idleWave: boolean;
  reducedMotion: boolean;
}

/** Pointer + easing state kept across engine rebuilds. */
export interface VariableProximityState {
  pointer: { x: number; y: number; active: boolean };
  levels: number[];
  targets: number[];
}

export type VariableProximityPresetName =
  | 'classic'
  | 'inverse'
  | 'hairline'
  | 'lift';

export interface VariableProximityPresetValues {
  restWeight: number;
  peakWeight: number;
  radius: number;
  falloff: VariableProximityFalloff;
  smoothing: number;
  fromColor: string;
  toColor: string;
  scale: number;
  lift: number;
  idleWave: boolean;
  fontSize: number;
}
