import type { ShardInstance } from './types';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoother = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

let colorProbe: CanvasRenderingContext2D | null = null;

const parseColor = (
  value: string | undefined,
  fallback: [number, number, number] | null,
): [number, number, number] | null => {
  if (value === undefined || value === 'transparent') return null;
  if (typeof document === 'undefined') return fallback;
  if (!colorProbe)
    colorProbe = document.createElement('canvas').getContext('2d');
  const probe = colorProbe;
  if (!probe) return fallback;
  probe.fillStyle = '#000000';
  probe.fillStyle = value;
  const text = probe.fillStyle;
  if (text.startsWith('#')) {
    const hex = Number.parseInt(text.slice(1), 16);
    if (!Number.isNaN(hex)) {
      return [
        ((hex >> 16) & 255) / 255,
        ((hex >> 8) & 255) / 255,
        (hex & 255) / 255,
      ];
    }
  }
  const match = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(
    text,
  );
  if (!match) return fallback;
  if (match[4] !== undefined && Number(match[4]) === 0) return null;
  return [
    Number(match[1]) / 255,
    Number(match[2]) / 255,
    Number(match[3]) / 255,
  ];
};

/** Reads a value from a fixed-size table or typed array; out of range reads as 0. */
const rd = (array: ArrayLike<number>, index: number): number =>
  array[index] ?? 0;

const latticeHash = (a: number, b: number, c: number, d: number) => {
  let h =
    Math.imul(a + 2654435769, 2246822507) ^
    Math.imul(b + 1663821227, 3266489909);
  h ^=
    Math.imul(c + 668265263, 374761393) ^ Math.imul(d + 2135587861, 2654435761);
  h = Math.imul(h ^ (h >>> 15), 739982445);
  h = Math.imul(h ^ (h >>> 12), 695872825);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
};

const random = (seed: number) => () => {
  seed = (seed + 1831565813) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const TAU = Math.PI * 2;

const CAMERA = 4;
const FOCUS = 3.1;
const SHARD_FOCUS = 2.75;
const LAYER_SCALES = [1, 0.5];
const MAX_BANK = 1.0;
const DEPTHS = [2.7, 3.9, 5.6, 8.1, 11.6];
const SHARE = [0.26, 0.23, 0.2, 0.17, 0.14];
const GROWTH = [1, 1.3, 1.8, 2.6, 3.6];
const FADE = [1, 0.8, 0.52, 0.32, 0.2];
const LEVELS = DEPTHS.length;
const INTRO_SECONDS = 3.4;
const MARKER_FLOATS = 8;
const MARKER_PHASES = [
  [0.37, 0.61],
  [0.83, 0.12],
  [0.21, 0.88],
  [0.66, 0.44],
  [0.05, 0.27],
];
const MAX_RINGS = 4;
const RING_SECONDS = 2.6;
const BLOOM_LEVELS = 4;
const FULL_SLOPES = [
  [0.2, -0.78],
  [-0.72, 0.02],
  [0.58, -0.06],
  [-0.24, 0.62],
  [0.8, 0.3],
];
const SIDE_OFFSETS = [0.84, 0.62, 0.44, 0.28, 0.14];
const RING_SIZES = [
  [0.98, 0.78],
  [0.9, 0.7],
  [0.84, 0.64],
  [0.8, 0.6],
  [0.76, 0.56],
];

const PLACEMENTS: readonly string[] = ['full', 'left', 'right', 'center'];
const MATERIALS: Record<string, number> = { glass: 0, chrome: 1 };
const FLOATS = 24;
const SAMPLES = 160;
const MARKER_STYLES: Record<string, number> = { plus: 0, dots: 1 };

const ribbonPoint = (
  placement: number,
  level: number,
  s: number,
  aspect: number,
  out: number[],
) => {
  let u: number;
  let v: number;
  let d: number;
  if (placement === 0) {
    u = -1.32 + 2.64 * s;
    const slope = FULL_SLOPES[level]!;
    v =
      slope[0]! +
      (slope[1]! - slope[0]!) * s +
      0.1 * Math.sin(s * TAU * 0.7 + level * 2.3) +
      0.045 * Math.sin(s * TAU * 1.9 + level);
    d = DEPTHS[level]! + 0.35 * Math.sin(s * Math.PI * 1.4 + level * 1.9);
  } else if (placement === 3) {
    const angle = s * TAU + level * 0.9 + Math.PI * 0.5;
    const size = RING_SIZES[level]!;
    u = Math.cos(angle) * size[0]!;
    v = Math.sin(angle) * size[1]! - 0.02;
    d = DEPTHS[level]! * 1.1 - Math.sin(angle) * (0.5 + level * 0.25);
  } else {
    const mirror = placement === 1 ? -1 : 1;
    v = 1.32 - 2.64 * s;
    u =
      mirror *
      (SIDE_OFFSETS[level]! +
        0.1 * Math.sin(s * TAU * 0.6 + level * 1.3) +
        0.03 * Math.sin(s * TAU * 2.1 + level) -
        0.08 * (1 - s));
    d = DEPTHS[level]! + 0.3 * Math.sin(s * Math.PI * 1.2 + level);
  }
  out[0] = (u * aspect * d) / CAMERA;
  out[1] = (v * d) / CAMERA;
  out[2] = CAMERA - d;
  return out;
};

const createShards = (count: number, seed: number) => {
  const next = random(seed);
  const shards: ShardInstance[] = [];
  let made = 0;
  for (let level = 0; level < LEVELS; level += 1) {
    const amount =
      level === LEVELS - 1 ? count - made : Math.round(count * SHARE[level]!);
    made += amount;
    for (let index = 0; index < amount; index += 1) {
      const flat = next() * 2 - 1;
      const family = next();
      const outline: number[][] = [];
      if (family < 0.55) {
        const spread = 0.17 + next() * 0.15;
        outline.push([1, (next() - 0.5) * 0.08]);
        outline.push([-0.5 - next() * 0.25, spread * (0.8 + next() * 0.4)]);
        outline.push([-0.5 - next() * 0.25, -spread * (0.8 + next() * 0.4)]);
      } else if (family < 0.8) {
        const spread = 0.2 + next() * 0.14;
        outline.push([1, 0]);
        outline.push([(next() - 0.3) * 0.5, spread]);
        outline.push([-0.55 - next() * 0.2, (next() - 0.5) * 0.1]);
        outline.push([(next() - 0.3) * 0.5, -spread * (0.8 + next() * 0.4)]);
      } else {
        const sides = next() < 0.5 ? 4 : 5;
        const stretch = 0.4 + next() * 0.3;
        const turn = next() * TAU;
        for (let corner = 0; corner < sides; corner += 1) {
          const angle = turn + ((corner + (next() - 0.5) * 0.6) * TAU) / sides;
          outline.push([Math.cos(angle), Math.sin(angle) * stretch]);
        }
      }
      const sides = outline.length;
      let mx = 0;
      let my = 0;
      for (const point of outline) {
        mx += point[0]! / sides;
        my += point[1]! / sides;
      }
      const shape: number[] = [];
      for (let corner = 0; corner < 5; corner += 1) {
        const point = outline[Math.min(corner, sides - 1)]!;
        shape.push(point[0]! - mx, point[1]! - my);
      }
      shards.push({
        level,
        phase: (index + next()) / Math.max(amount, 1),
        lane: Math.sign(flat) * Math.pow(Math.abs(flat), 0.85),
        layer:
          Math.sqrt(-2 * Math.log(Math.max(next(), 1e-6))) *
          Math.cos(TAU * next()),
        size: 0.6 + next() * next() * 1.25,
        shape,
        sides,
        thickness: 0.06 + next() * 0.04,
        yaw: (next() - 0.5) * 0.36,
        bank: (next() - 0.5) * 0.5,
        pitch: (next() - 0.5) * 0.24,
        tint: next(),
        drift: [next() * TAU, next() * TAU, next() * TAU],
        rate: [0.3 + next() * 0.35, 0.25 + next() * 0.35, 0.3 + next() * 0.3],
        flutter: [next() * TAU, 0.5 + next() * 0.5],
        arrive: next(),
        sign: next() < 0.5 ? -1 : 1,
        slot: [
          next() * TAU,
          0.06 + 0.3 * Math.sqrt(next()),
          next() - 0.5,
          next() < 0.85 ? 1 : -1,
        ],
        offset: [0, 0, 0],
        velocity: [0, 0, 0],
        tilt: 0,
        tiltVelocity: 0,
        flash: 0,
        gather: 0,
        joined: false,
        position: [0, 0, 0],
        s: 0,
      });
    }
  }
  return shards;
};

export {
  clamp,
  smoother,
  parseColor,
  rd,
  latticeHash,
  TAU,
  CAMERA,
  FOCUS,
  SHARD_FOCUS,
  LAYER_SCALES,
  MAX_BANK,
  DEPTHS,
  GROWTH,
  FADE,
  LEVELS,
  INTRO_SECONDS,
  MARKER_FLOATS,
  MARKER_PHASES,
  MAX_RINGS,
  RING_SECONDS,
  BLOOM_LEVELS,
  PLACEMENTS,
  MATERIALS,
  FLOATS,
  SAMPLES,
  MARKER_STYLES,
  ribbonPoint,
  createShards,
};
