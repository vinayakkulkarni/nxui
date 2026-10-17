import type {
  VariableProximityPresetName,
  VariableProximityPresetValues,
} from './types';

const LOOK: VariableProximityPresetValues = {
  restWeight: 400,
  peakWeight: 1000,
  radius: 100,
  falloff: 'linear',
  smoothing: 0.2,
  fromColor: '',
  toColor: '',
  scale: 1,
  lift: 0,
  idleWave: false,
  fontSize: 64,
};

const OVERRIDES: Record<
  VariableProximityPresetName,
  Partial<VariableProximityPresetValues>
> = {
  classic: {},
  inverse: {
    restWeight: 1000,
    peakWeight: 100,
    radius: 120,
    falloff: 'exponential',
    smoothing: 0.1,
    idleWave: true,
  },
  hairline: {
    restWeight: 100,
    peakWeight: 900,
    radius: 180,
    falloff: 'gaussian',
    smoothing: 0.5,
    scale: 1.12,
    fontSize: 72,
  },
  lift: {
    restWeight: 300,
    peakWeight: 800,
    radius: 150,
    falloff: 'gaussian',
    smoothing: 0.3,
    toColor: '#ff5a36',
    scale: 1.22,
    lift: 0.16,
  },
};

/** Full look for a named preset (the React Bits demo presets). */
export function variableProximityPreset(
  name: VariableProximityPresetName,
): VariableProximityPresetValues {
  return { ...LOOK, ...OVERRIDES[name] };
}

export function isVariableProximityPreset(
  value: unknown,
): value is VariableProximityPresetName {
  return typeof value === 'string' && value in OVERRIDES;
}
