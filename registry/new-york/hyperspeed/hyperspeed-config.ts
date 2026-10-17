import type {
  HyperspeedCurve,
  HyperspeedPalette,
  HyperspeedProps,
  HyperspeedSettings,
  HyperspeedTheme,
  HyperspeedVec3,
} from './types';

export const TRAVEL = 400;
export const MAX_CARS = 160;
export const MAX_POLES = 80;
export const MAX_DUST = 1500;
export const MAX_COLORS = 8;

export const CURVES: HyperspeedCurve[] = [
  'straight',
  'gentle',
  'winding',
  'hills',
  'racing',
  'deep',
];

export const THEMES: Record<HyperspeedTheme, HyperspeedPalette> = {
  dark: {
    background: 'transparent',
    road: '#08080a',
    lines: '#25252d',
    tail: ['#d856bf', '#6750a2', '#c247ac'],
    head: ['#03b3c3', '#0e5ea5', '#324555'],
    poles: ['#03b3c3'],
    dust: '#ffffff',
  },
  light: {
    background: 'transparent',
    road: '#efeff2',
    lines: '#d0d0d7',
    tail: ['#d856bf', '#6750a2', '#c247ac'],
    head: ['#03b3c3', '#0e5ea5', '#324555'],
    poles: ['#03b3c3'],
    dust: '#18181b',
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function resolveSettings(props: HyperspeedProps): HyperspeedSettings {
  const theme = props.theme ?? 'dark';
  const palette = THEMES[theme] ?? THEMES.dark;
  const curve = props.curve ?? 'winding';
  return {
    light: theme === 'light',
    curve: CURVES.includes(curve) ? curve : 'winding',
    curvature: Math.max(0, props.curvature ?? 1),
    speed: Math.max(0, props.speed ?? 1),
    boost: Math.max(1, props.boost ?? 3),
    fov: clamp(props.fov ?? 90, 20, 170),
    boostFov: clamp(props.boostFov ?? 130, 20, 170),
    lanes: Math.max(1, Math.round(props.lanes ?? 3)),
    roadWidth: Math.max(1, props.roadWidth ?? 10),
    medianWidth: Math.max(0, props.medianWidth ?? 2),
    density: clamp(Math.round(props.density ?? 40), 0, MAX_CARS),
    trailLength: Math.max(0.05, props.trailLength ?? 1),
    lightSize: Math.max(0.1, props.lightSize ?? 1),
    poles: clamp(Math.round(props.poles ?? 20), 0, MAX_POLES),
    poleHeight: Math.max(0.1, props.poleHeight ?? 1),
    dust: clamp(Math.round(props.dust ?? 100), 0, MAX_DUST),
    glow: Math.max(0, props.glow ?? 0.6),
    reflections: Math.max(0, props.reflections ?? 0.5),
    steer: Math.max(0, props.steer ?? 0.35),
    tailColors: props.tailColors?.length ? props.tailColors : palette.tail,
    headColors: props.headColors?.length ? props.headColors : palette.head,
    poleColors: props.poleColors?.length ? props.poleColors : palette.poles,
    roadColor: props.roadColor || palette.road,
    roadOpacity: clamp(props.roadOpacity ?? 0.1, 0, 1),
    lineColor: props.lineColor || palette.lines,
    background: props.background || palette.background,
    dustColor: palette.dust,
    interactive: props.interactive ?? true,
    boosting: props.boosting ?? false,
  };
}

const nsin = (value: number) => Math.sin(value) * 0.5 + 0.5;
const windX = (q: number, t: number) =>
  Math.cos(Math.PI * q * 4 + t) * 25 +
  Math.cos(Math.PI * q * 8 + t * 2) ** 2 * 5;
const windY = (q: number, t: number) =>
  -nsin(Math.PI * q * 8 + t) * 10 - nsin(Math.PI * q + t / 8) ** 5 * 10;
const deepX = (q: number, t: number) => Math.sin(q * Math.PI * 4 + t) * 10;
const deepY = (q: number, t: number) =>
  Math.abs(q * 10) ** 2 + Math.sin(q * Math.PI * 8 + t) * 20;

function curveShapes(p: number, t: number): HyperspeedVec3[] {
  const { PI, cos, sin } = Math;
  return [
    [
      cos(p * PI * 5 + t) * 25 - cos(0.02 * PI * 5 + t) * 25,
      sin(p * PI * 2 + PI * 0.5 + t) * 15 -
        sin(0.02 * PI * 2 + PI * 0.5 + t) * 15,
      0,
    ],
    [windX(p, t) - windX(0.0125, t), windY(p, t) - windY(0.0125, t), 0],
    [
      cos(p * PI * 3 + t) * 30 - cos(0.02 * PI * 3 + t) * 30,
      nsin(p * PI * 6 + t) * 30 - nsin(0.02 * PI * 6 + t) * 30,
      nsin(p * PI * 10 + t) * 20 - nsin(0.02 * PI * 10 + t) * 20,
    ],
    [
      sin(p * PI * 2 + t) * 35 - sin(0.0125 * PI * 2 + t) * 35,
      sin(p * PI * 3 + t) * 10 - sin(0.0125 * PI * 3 + t) * 10,
      0,
    ],
    [deepX(p, t) - deepX(0.02, t), deepY(p, t) - deepY(0.02, t), 0],
  ];
}

/** Camera look offsets for each curve shape, matched to the road bend. */
export function lookShapes(t: number, curvature: number): HyperspeedVec3[] {
  const p = 0.025;
  const shapes = curveShapes(p, t);
  const gentle = shapes[0]!;
  const hills = shapes[2]!;
  const racing = shapes[3]!;
  return [
    [gentle[0] * curvature * 2, gentle[1] * curvature * 0.4, -3],
    [
      (windX(p, t) - windX(p + 0.007, t)) * curvature * -2,
      (windY(p, t) - windY(p + 0.007, t)) * curvature * -5,
      -10,
    ],
    [
      hills[0] * curvature * 2,
      hills[1] * curvature * 2,
      hills[2] * curvature * 2 - 5,
    ],
    [racing[0] * curvature, racing[1] * curvature, -5],
    [
      (deepX(p, t) - deepX(p + 0.01, t)) * curvature * -2,
      (deepY(p, t) - deepY(p + 0.01, t)) * curvature * -4,
      -10,
    ],
  ];
}
