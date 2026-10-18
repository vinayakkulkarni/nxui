import type { GalaxyLook, GalaxyPalette, GalaxyPreset } from './types';

export const GALAXY_PALETTES: Record<GalaxyPalette, string[]> = {
  none: [],
  stardust: ['#ffffff', '#ffd9a3', '#a8c8ff'],
  ice: ['#ffffff', '#bfe3ff', '#8fb8ff'],
  gold: ['#fff6e0', '#ffd27a', '#ffb35c'],
  rose: ['#ffffff', '#ffc9d4', '#ffd9b8'],
};

const LOOK: GalaxyLook = {
  starColors: GALAXY_PALETTES.none,
  hueShift: 140,
  saturation: 0,
  density: 1,
  glowIntensity: 0.3,
  starSize: 1,
  flareIntensity: 1,
  twinkleIntensity: 0.3,
  starSpeed: 0.5,
  speed: 1,
  rotationSpeed: 0.1,
  layers: 4,
  direction: 'forward',
  mouseRepulsion: true,
  repulsionStrength: 2,
};

const PRESETS: Record<GalaxyPreset, GalaxyLook> = {
  classic: { ...LOOK },
  stardust: {
    ...LOOK,
    starColors: GALAXY_PALETTES.stardust,
    glowIntensity: 0.5,
    density: 1.4,
    twinkleIntensity: 0.6,
  },
  hyperdrive: {
    ...LOOK,
    starSpeed: 3,
    layers: 6,
    density: 1.2,
    glowIntensity: 0.4,
    mouseRepulsion: false,
  },
  sparkle: {
    ...LOOK,
    flareIntensity: 3,
    glowIntensity: 0.45,
    twinkleIntensity: 0.7,
    density: 0.8,
  },
  drift: {
    ...LOOK,
    direction: 'backward',
    starSpeed: 0.3,
    rotationSpeed: 0.03,
    glowIntensity: 0.35,
  },
  cluster: {
    ...LOOK,
    starColors: GALAXY_PALETTES.gold,
    glowIntensity: 0.5,
    density: 1.6,
    twinkleIntensity: 0.4,
  },
};

/** The look of one of the demo presets. */
export function galaxyPreset(name: GalaxyPreset): GalaxyLook {
  const look = PRESETS[name];
  return { ...look, starColors: [...look.starColors] };
}

function isGalaxyPalette(value: unknown): value is GalaxyPalette {
  return typeof value === 'string' && value in GALAXY_PALETTES;
}

/** The name of the palette matching a list of star colors, or 'none'. */
export function galaxyPaletteName(colors: string[]): GalaxyPalette {
  const key = colors.join(',');
  const names = Object.keys(GALAXY_PALETTES).filter(isGalaxyPalette);
  return (
    names.find((name) => GALAXY_PALETTES[name].join(',') === key) ?? 'none'
  );
}

export function isGalaxyPreset(value: unknown): value is GalaxyPreset {
  return typeof value === 'string' && value in PRESETS;
}
