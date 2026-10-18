import type { RadarContactMotion, RadarProps, RadarSettings } from './types';

export const TAU = Math.PI * 2;
export const MAX_TARGETS = 16;
export const HISTORY = 4;
export const FOCAL = 2;
export const INTRO_SECONDS = 2.2;
export const MAX_RENDER_DIM = 2560;
export const BLOOM_LEVELS = 5;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Mulberry32 PRNG so contact spawns are deterministic. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 1831565813) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function spawnTarget(
  rng: () => number,
  inward: boolean,
): RadarContactMotion {
  const angle = rng() * TAU;
  const radius = inward ? 0.94 : 0.2 + rng() * 0.68;
  const heading = inward ? angle + Math.PI + (rng() - 0.5) * 1.6 : rng() * TAU;
  return {
    x: Math.sin(angle) * radius,
    y: Math.cos(angle) * radius,
    heading,
    velocity: 0.012 + rng() * 0.03,
    turn: (rng() - 0.5) * 0.18,
  };
}

/** Clamps raw props into the ranges the renderer expects. */
export function resolveSettings(
  props: Required<Omit<RadarProps, 'dpr' | 'class'>> & {
    dpr?: number;
  },
): RadarSettings {
  return {
    color: String(props.color),
    backgroundColor: String(props.backgroundColor),
    mode: props.mode === 'pulse' ? 'pulse' : 'sweep',
    speed: props.speed,
    trail: clamp(props.trail, 0.02, 1),
    scale: Math.max(0.05, props.scale),
    ringCount: Math.round(clamp(props.ringCount, 1, 24)),
    spokeCount: Math.round(clamp(props.spokeCount, 0, 72)),
    ticks: props.ticks,
    targets: Math.round(clamp(props.targets, 0, MAX_TARGETS)),
    clutter: clamp(props.clutter, 0, 1),
    glow: Math.max(0, props.glow),
    brightness: Math.max(0, props.brightness),
    gridOpacity: clamp(props.gridOpacity, 0, 2),
    lineWidth: clamp(props.lineWidth, 0.25, 4),
    tilt: (clamp(props.tilt, 0, 80) * Math.PI) / 180,
    centerX: props.centerX,
    centerY: props.centerY,
    mouseInteraction: props.mouseInteraction,
    intro: props.intro,
    grain: Math.max(0, props.grain),
    fade: clamp(props.fade, 0, 1),
    opacity: clamp(props.opacity, 0, 1),
    lightMode: props.lightMode,
    paused: props.paused,
    dpr: props.dpr,
  };
}
