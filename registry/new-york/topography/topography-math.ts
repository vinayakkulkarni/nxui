import { FAR, FOV, NEAR } from './topography-constants';
import type { TopographyCamera, TopographyFrame, Vec3 } from './types';

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const smoother = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

const lattice = (x: number, y: number) => {
  let h =
    (Math.imul(x + 1073741824, 2654435761) +
      Math.imul(y + 1073741824, 2246822519)) >>>
    0;
  h = Math.imul(h ^ (h >>> 15), 739982445) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 695872825) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
};

const corner = (cx: number, cy: number, fx: number, fy: number) => {
  const h = lattice(cx, cy);
  return ((h & 65535) / 32767.5 - 1) * fx + ((h >>> 16) / 32767.5 - 1) * fy;
};

const noise = (x: number, y: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const a = corner(ix, iy, fx, fy);
  const b = corner(ix + 1, iy, fx - 1, fy);
  const d = corner(ix, iy + 1, fx, fy - 1);
  const e = corner(ix + 1, iy + 1, fx - 1, fy - 1);
  const top = a + (b - a) * ux;
  return top + (d + (e - d) * ux - top) * uy;
};

/** CPU twin of the GLSL `relief()` so picking matches the rendered land. */
export const relief = (
  tx: number,
  tz: number,
  frequency: number,
  morphX: number,
  morphZ: number,
) => {
  let px = tx * frequency;
  let pz = tz * frequency;
  const wx = noise(px * 0.42 + morphX, pz * 0.42 + morphZ);
  const wz = noise(px * 0.42 - morphZ + 5.2, pz * 0.42 - morphX + 1.3);
  px += wx * 0.8;
  pz += wz * 0.8;
  let n = noise(px, pz) * 0.55;
  const qx = 1.6 * px - 1.2 * pz + 7.1;
  const qz = 1.2 * px + 1.6 * pz + 3.7;
  n += noise(qx, qz) * 0.15;
  n += noise(1.6 * qx - 1.2 * qz + 1.9, 1.2 * qx + 1.6 * qz + 8.3) * 0.04;
  const s = Math.log(1 + Math.exp(7 * (3 * n + 0.05))) / 7;
  return s * s * 1.4 + 0.1 * n;
};

export const fineDetail = (tx: number, tz: number, frequency: number) => {
  const px = tx * frequency * 5 + 13.1;
  const pz = tz * frequency * 5 + 4.7;
  return (
    noise(px, pz) * 0.6 +
    noise(1.6 * px - 1.2 * pz + 2.3, 1.2 * px + 1.6 * pz + 6.1) * 0.3
  );
};

export const toRgb = (hex: string): Vec3 => {
  let h = String(hex || '#ffffff')
    .replace('#', '')
    .trim();
  if (h.length === 3 || h.length === 4)
    h = h
      .slice(0, 3)
      .split('')
      .map((c) => c + c)
      .join('');
  const num = Number.parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(num)) return [1, 1, 1];
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
};

export const orient = (yaw: number, pitch: number): TopographyFrame => {
  const cp = Math.cos(pitch);
  const f: Vec3 = [Math.sin(yaw) * cp, -Math.sin(pitch), Math.cos(yaw) * cp];
  const r: Vec3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const u: Vec3 = [
    f[1] * r[2] - f[2] * r[1],
    f[2] * r[0] - f[0] * r[2],
    f[0] * r[1] - f[1] * r[0],
  ];
  return { f, r, u };
};

export const lens = (aspect: number) => clamp(0.4877 / aspect, FOV, 0.6);

export const viewProjection = (
  { eye, f, r, u }: TopographyCamera,
  aspect: number,
  out: Float32Array,
) => {
  const t = 1 / lens(aspect);
  const nf = 1 / (NEAR - FAR);
  const view = [
    r[0],
    u[0],
    -f[0],
    0,
    r[1],
    u[1],
    -f[1],
    0,
    r[2],
    u[2],
    -f[2],
    0,
    -(r[0] * eye[0] + r[1] * eye[1] + r[2] * eye[2]),
    -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]),
    f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2],
    1,
  ];
  const projection = [
    t / aspect,
    0,
    0,
    0,
    0,
    t,
    0,
    0,
    0,
    0,
    (FAR + NEAR) * nf,
    -1,
    0,
    0,
    2 * FAR * NEAR * nf,
    0,
  ];
  for (let c = 0; c < 4; c++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++)
        sum += projection[k * 4 + row]! * view[c * 4 + k]!;
      out[c * 4 + row] = sum;
    }
  }
  return out;
};
