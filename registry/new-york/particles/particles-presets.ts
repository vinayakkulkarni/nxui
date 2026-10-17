import type { ParticlesLook, ParticlesPreset } from './types';

const LOOK: ParticlesLook = {
  particleColors: ['#ffffff', '#ffffff', '#ffffff'],
  particleCount: 200,
  particleSpread: 10,
  particleBaseSize: 100,
  sizeRandomness: 1,
  speed: 0.1,
  shape: 'circle',
  glow: 0.5,
  twinkle: 0.3,
  depthOfField: 0,
  connections: false,
  connectionDistance: 110,
  hoverEffect: 'parallax',
  particleHoverFactor: 1,
  hoverRadius: 140,
  drift: 'none',
  driftSpeed: 1,
  alphaParticles: false,
  disableRotation: false,
};

const PRESETS: Record<ParticlesPreset, ParticlesLook> = {
  classic: { ...LOOK },
  constellation: {
    ...LOOK,
    connections: true,
    particleCount: 220,
    particleSpread: 12,
    hoverEffect: 'repel',
    glow: 0.4,
    twinkle: 0.2,
  },
  bokeh: {
    ...LOOK,
    particleColors: ['#ffd9a8', '#ff9e7a', '#ffffff'],
    particleCount: 260,
    particleBaseSize: 140,
    depthOfField: 1.1,
    glow: 0.9,
  },
  fireflies: {
    ...LOOK,
    particleColors: ['#f4ff8a', '#c6ff6b', '#ffe28a'],
    particleCount: 260,
    particleBaseSize: 170,
    sizeRandomness: 0.8,
    speed: 0.25,
    glow: 1.6,
    twinkle: 0.9,
    drift: 'up',
    driftSpeed: 0.6,
  },
  snow: {
    ...LOOK,
    particleCount: 1400,
    particleBaseSize: 55,
    glow: 0.2,
    twinkle: 0,
    drift: 'down',
    driftSpeed: 0.8,
    alphaParticles: true,
    disableRotation: true,
  },
  warp: {
    ...LOOK,
    particleColors: ['#ffffff', '#bcd4ff', '#ffffff'],
    particleCount: 1600,
    particleBaseSize: 45,
    glow: 0.6,
    twinkle: 0,
    drift: 'forward',
    driftSpeed: 1.2,
  },
  stardust: {
    ...LOOK,
    particleColors: ['#ffffff', '#d8e4ff', '#fff1d6'],
    particleCount: 420,
    particleBaseSize: 120,
    shape: 'sparkle',
    glow: 0.9,
    twinkle: 0.7,
  },
};

/** The look of one of the demo presets. */
export function particlesPreset(name: ParticlesPreset): ParticlesLook {
  const look = PRESETS[name];
  return { ...look, particleColors: [...look.particleColors] };
}

export function isParticlesPreset(value: unknown): value is ParticlesPreset {
  return typeof value === 'string' && value in PRESETS;
}
