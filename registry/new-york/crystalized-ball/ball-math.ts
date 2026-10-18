import { MAX_STRANDS, STATE_WIDTH } from './presets';
import type {
  CrystalizedBallDustData,
  CrystalizedBallPalette,
  CrystalizedBallRgb,
  CrystalizedBallStrandData,
} from './types';

type Rgb = CrystalizedBallRgb;

const WHITE: Rgb = [1, 1, 1];
const BLACK: Rgb = [0, 0, 0];

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const smooth = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const mixColor = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const wrapAngle = (a: number) =>
  a - Math.PI * 2 * Math.floor((a + Math.PI) / (Math.PI * 2));

export const parseColor = (value: string, fallback: Rgb): Rgb => {
  if (typeof document === 'undefined') return fallback;
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return fallback;
    ctx.fillStyle = '#000000';
    ctx.fillStyle = value;
    const resolved = String(ctx.fillStyle);
    if (resolved.startsWith('#')) {
      const n = Number.parseInt(resolved.slice(1), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    const parts = resolved.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return fallback;
    return [
      Number(parts[0]) / 255,
      Number(parts[1]) / 255,
      Number(parts[2]) / 255,
    ];
  } catch {
    return fallback;
  }
};

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const toGamma = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

const toOklab = (rgb: Rgb): Rgb => {
  const r = toLinear(rgb[0]);
  const g = toLinear(rgb[1]);
  const b = toLinear(rgb[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const fromOklab = ([L, a, b]: Rgb): Rgb => {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  const out = (v: number) => clamp(toGamma(clamp(v, 0, 1)), 0, 1);
  return [
    out(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    out(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    out(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
};

const blend = (a: Rgb, b: Rgb, t: number): Rgb =>
  fromOklab(mixColor(toOklab(a), toOklab(b), t));

const shift = (
  rgb: Rgb,
  hue: number,
  lightness: number,
  chroma: number,
): Rgb => {
  const [L, a, b] = toOklab(rgb);
  const c = Math.hypot(a, b) * chroma;
  const h = Math.atan2(b, a) + (hue * Math.PI) / 180;
  return fromOklab([
    clamp(L + lightness, 0, 1),
    c * Math.cos(h),
    c * Math.sin(h),
  ]);
};

const withLightness = (
  rgb: Rgb,
  hue: number,
  lightness: number,
  chroma: number,
): Rgb => {
  const [, a, b] = toOklab(rgb);
  const c = Math.max(Math.hypot(a, b) * chroma, 0.02);
  const h = Math.atan2(b, a) + (hue * Math.PI) / 180;
  return fromOklab([clamp(lightness, 0, 1), c * Math.cos(h), c * Math.sin(h)]);
};

export const buildPalette = (
  color: Rgb,
  light: boolean,
): CrystalizedBallPalette => {
  if (light) {
    const ink = withLightness(
      color,
      0,
      Math.min(toOklab(color)[0], 0.62),
      1.15,
    );
    return {
      rim: ink,
      rimHot: ink,
      rimMid: ink,
      rimDeep: withLightness(color, 0, 0.72, 0.8),
      spark: withLightness(color, 0, 0.6, 1.2),
      sparkGlow: withLightness(color, 0, 0.78, 0.8),
      haze: withLightness(color, 0, 0.8, 0.6),
      edge: withLightness(color, 0, 0.72, 0.8),
      tones: [
        withLightness(color, 0, 0.56, 1.1),
        withLightness(color, 16, 0.6, 1.05),
        withLightness(color, -16, 0.5, 1.1),
        withLightness(color, 0, 0.66, 0.9),
        withLightness(color, 0, 0.74, 0.7),
      ],
    };
  }
  return {
    rim: color,
    rimHot: mixColor(color, WHITE, 0.72),
    rimMid: mixColor(color, BLACK, 0.15),
    rimDeep: mixColor(color, BLACK, 0.45),
    spark: mixColor(color, WHITE, 0.45),
    sparkGlow: shift(color, 0, -0.15, 1),
    haze: mixColor(color, BLACK, 0.6),
    edge: shift(color, 0, -0.3, 0.9),
    tones: [
      shift(color, 0, -0.06, 1),
      shift(color, 16, -0.02, 1),
      shift(color, -16, -0.12, 1.05),
      shift(blend(color, WHITE, 0.25), 0, 0.04, 1),
      blend(color, WHITE, 0.7),
    ],
  };
};

export const seeded = (start: number) => {
  let state = start >>> 0;
  return () => {
    state = (state + 1831565813) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const BANDS: ReadonlyArray<readonly [number, number, number, number]> = [
  [6, 12, 0.6, 1.6],
  [18, 34, 1.5, 3.5],
  [40, 70, 3, 7],
  [80, 130, 6, 12],
];

export const buildStrands = (): CrystalizedBallStrandData => {
  const random = seeded(99);
  const data: CrystalizedBallStrandData = {
    harmonics: [],
    rates: [],
    phases: [],
    flareHarmonics: [],
    flareRates: [],
    flarePhases: [],
  };
  for (let s = 0; s < MAX_STRANDS; s++) {
    for (const [low, high, slow, fast] of BANDS) {
      data.harmonics.push(Math.round(low + random() * (high - low)));
      data.rates.push(
        (slow + random() * (fast - slow)) * (random() < 0.5 ? -1 : 1),
      );
      data.phases.push(random() * Math.PI * 2);
    }
    for (let j = 0; j < 3; j++) {
      data.flareHarmonics.push(4 + Math.floor(random() * 6));
      data.flareRates.push((0.4 + random() * 0.8) * (random() < 0.5 ? -1 : 1));
      data.flarePhases.push(random() * Math.PI * 2);
    }
    const lead = s === 0;
    data.flareHarmonics.push(lead ? 0.75 : 0.95 + random() * 0.3);
    data.flareRates.push(lead ? 1.15 : 0.8 + random() * 0.2);
    data.flarePhases.push(lead ? 1 : 0.7 + random() * 0.25);
  }
  return data;
};

export const buildDust = (count: number): CrystalizedBallDustData => {
  const random = seeded(1337);
  const rows = Math.max(1, Math.ceil(count / STATE_WIDTH));
  const home = new Float32Array(STATE_WIDTH * rows * 4);
  const seed = new Float32Array(STATE_WIDTH * rows * 4);
  let k = 0;
  let guard = 0;
  while (k < count && guard < count * 80) {
    guard++;
    let x: number;
    let y: number;
    let tone: number;
    if (random() < 0.28) {
      const angle = random() * Math.PI * 2;
      const radius = 0.87 + Math.sqrt(random()) * 0.105;
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
      if (random() > smooth(-0.6, 0.3, -y)) continue;
      const q = random();
      tone = q < 0.5 ? 3 : q < 0.8 ? 2 : 1;
    } else {
      x = random() * 2 - 1;
      y = random() * 2 - 1;
      const radius = Math.hypot(x, y);
      if (radius > 0.975) continue;
      const bowl = Math.pow(smooth(-0.25, 0.85, -y), 1.3);
      const band = smooth(0.66, 0.96, radius) * smooth(-0.7, 0.3, -y);
      const weight = Math.max(bowl, band * 0.9);
      if (random() > 0.012 + 0.988 * weight) continue;
      if (weight < 0.12) tone = 4;
      else {
        const q = random();
        tone = q < 0.32 ? 0 : q < 0.52 ? 1 : q < 0.8 ? 2 : 3;
      }
    }
    const chord = Math.sqrt(Math.max(0, 0.95 - x * x - y * y));
    home[k * 4] = x;
    home[k * 4 + 1] = y;
    home[k * 4 + 2] = (random() * 2 - 1) * chord;
    home[k * 4 + 3] = tone;
    seed[k * 4] = tone === 4 ? 1.8 : random() < 0.22 ? 2.1 : 1.3;
    seed[k * 4 + 1] = random();
    seed[k * 4 + 2] = 2.5 + random() * 3.5;
    seed[k * 4 + 3] = 0.16 + random() * 0.26;
    k++;
  }
  return { home, seed, count: k, rows };
};
