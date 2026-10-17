import type {
  FluidGlassMat3,
  FluidGlassQuat,
  FluidGlassRgba,
  FluidGlassShape,
  FluidGlassVec2,
} from './types';

export const PIXEL_BUDGET = 5e6;
export const SHADOW_SIZE = 160;
export const SHAPES: FluidGlassShape[] = [
  'lens',
  'blob',
  'cube',
  'pill',
  'torus',
  'prism',
  'diamond',
];
export const EXTENT: Record<FluidGlassShape, number> = {
  lens: 1.02,
  blob: 1.08,
  cube: 1.32,
  pill: 1.02,
  torus: 1.0,
  prism: 1.18,
  diamond: 1.05,
};
export const BASE: Record<FluidGlassShape, [number, number, number]> = {
  lens: [0, 0, 0],
  blob: [0.2, 0, 0],
  cube: [-0.48, 0.62, 0.0],
  pill: [0.0, 0.0, 0.0],
  torus: [-0.5, 0.18, 0.0],
  prism: [-0.3, 0.45, 0.0],
  diamond: [-0.35, 0.5, 0.0],
};
export const SPIN: Record<FluidGlassShape, [number, number]> = {
  lens: [0, 0],
  blob: [1, 0],
  cube: [1, 0],
  pill: [0, 0],
  torus: [0, 1],
  prism: [1, 0],
  diamond: [1, 0],
};
export const VIDEO = /\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i;

const SHAPE_SET: ReadonlySet<string> = new Set(SHAPES);

export const isShape = (value: string | undefined): value is FluidGlassShape =>
  value !== undefined && SHAPE_SET.has(value);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const channel = (value: string | undefined): number =>
  clamp(Number.parseFloat(value ?? '0') / 255, 0, 1);

export const parseColor = (
  value: string | undefined,
): FluidGlassRgba | null => {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const digits = hex[1] ?? '';
    const full =
      digits.length === 3
        ? digits.replace(/./g, (digit) => digit + digit)
        : digits;
    const byte = (index: number) =>
      Number.parseInt(full.slice(index, index + 2), 16) / 255;
    return [byte(0), byte(2), byte(4), 1];
  }
  const rgb =
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?/i.exec(
      text,
    );
  if (rgb) {
    const raw = rgb[4];
    const alpha =
      raw === undefined
        ? 1
        : raw.endsWith('%')
          ? Number.parseFloat(raw) / 100
          : Number.parseFloat(raw);
    return [
      channel(rgb[1]),
      channel(rgb[2]),
      channel(rgb[3]),
      clamp(alpha, 0, 1),
    ];
  }
  return null;
};

export const compile = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

export const smoother = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export const quaternion = (x: number, y: number, z: number): FluidGlassQuat => {
  const cx = Math.cos(x / 2);
  const sx = Math.sin(x / 2);
  const cy = Math.cos(y / 2);
  const sy = Math.sin(y / 2);
  const cz = Math.cos(z / 2);
  const sz = Math.sin(z / 2);
  return [
    sx * cy * cz - cx * sy * sz,
    cx * sy * cz + sx * cy * sz,
    cx * cy * sz - sx * sy * cz,
    cx * cy * cz + sx * sy * sz,
  ];
};

export const multiply = (
  a: FluidGlassQuat,
  b: FluidGlassQuat,
): FluidGlassQuat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

export const slerp = (
  a: FluidGlassQuat,
  b: FluidGlassQuat,
  t: number,
): FluidGlassQuat => {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const target: FluidGlassQuat = dot < 0 ? [-b[0], -b[1], -b[2], -b[3]] : b;
  dot = Math.abs(dot);
  if (dot > 0.9995) {
    const mixed: FluidGlassQuat = [
      a[0] + (target[0] - a[0]) * t,
      a[1] + (target[1] - a[1]) * t,
      a[2] + (target[2] - a[2]) * t,
      a[3] + (target[3] - a[3]) * t,
    ];
    const length = Math.hypot(...mixed);
    return [
      mixed[0] / length,
      mixed[1] / length,
      mixed[2] / length,
      mixed[3] / length,
    ];
  }
  const theta = Math.acos(dot);
  const sin = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sin;
  const wb = Math.sin(t * theta) / sin;
  return [
    a[0] * wa + target[0] * wb,
    a[1] * wa + target[1] * wb,
    a[2] * wa + target[2] * wb,
    a[3] * wa + target[3] * wb,
  ];
};

export const driftAt = (clock: number, size: number): FluidGlassVec2 => [
  Math.sin(clock * 0.37) * size * 0.35 +
    Math.sin(clock * 0.71 + 1.3) * size * 0.12,
  Math.sin(clock * 0.29 + 0.8) * size * 0.2 +
    Math.cos(clock * 0.53) * size * 0.08,
];

export const toMatrix = ([x, y, z, w]: FluidGlassQuat): FluidGlassMat3 => [
  1 - 2 * (y * y + z * z),
  2 * (x * y + z * w),
  2 * (x * z - y * w),
  2 * (x * y - z * w),
  1 - 2 * (x * x + z * z),
  2 * (y * z + x * w),
  2 * (x * z + y * w),
  2 * (y * z - x * w),
  1 - 2 * (x * x + y * y),
];
