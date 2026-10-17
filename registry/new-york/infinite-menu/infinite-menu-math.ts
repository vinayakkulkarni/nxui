import type { Quat, Vec2, Vec3 } from './types';

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const dot = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const cross = (a: Vec3 | Quat, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};

export const quatMultiply = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

export const quatAxisAngle = (axis: Vec3, angle: number): Quat => {
  const s = Math.sin(angle / 2);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
};

export const quatNormalize = (q: Quat): Quat => {
  const length = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / length, q[1] / length, q[2] / length, q[3] / length];
};

export const rotate = (q: Quat, v: Vec3): Vec3 => {
  const c = cross(q, v);
  const t: Vec3 = [c[0] * 2, c[1] * 2, c[2] * 2];
  const u = cross(q, t);
  return [
    v[0] + q[3] * t[0] + u[0],
    v[1] + q[3] * t[1] + u[1],
    v[2] + q[3] * t[2] + u[2],
  ];
};

/** Evenly spread points on a unit sphere (Fibonacci lattice). */
export const sphere = (count: number): Vec3[] => {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / count;
    const ring = Math.sqrt(1 - y * y);
    return [Math.cos(golden * i) * ring, y, Math.sin(golden * i) * ring];
  });
};

export const luminance = (hex: string): number => {
  const value = hex.replace('#', '');
  const full =
    value.length === 3 ? value.replace(/./g, (c) => c + c) : value.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return 0;
  return (
    (0.2126 * ((n >> 16) & 255) +
      0.7152 * ((n >> 8) & 255) +
      0.0722 * (n & 255)) /
    255
  );
};

export const INFINITE_MENU_DIRECTIONS: Record<string, Vec2> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};
