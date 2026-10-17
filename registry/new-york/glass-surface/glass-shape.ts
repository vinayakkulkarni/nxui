import type { GlassShapeBox } from './types';

/** Sentinel "infinite" squared distance for the distance transform. */
const FAR = 1e20;

function distanceLine(
  f: Float64Array,
  d: Float64Array,
  v: Int32Array,
  z: Float64Array,
  n: number,
) {
  let k = 0;
  v[0] = 0;
  z[0] = -FAR;
  z[1] = FAR;
  for (let q = 1; q < n; q++) {
    let s = (f[q]! + q * q - (f[v[k]!]! + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!);
    while (s <= z[k]!) {
      k--;
      s = (f[q]! + q * q - (f[v[k]!]! + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = FAR;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1]! < q) k++;
    d[q] = (q - v[k]!) * (q - v[k]!) + f[v[k]!]!;
  }
}

/** Felzenszwalb squared Euclidean distance transform, in place. */
function distanceGrid(grid: Float32Array, w: number, h: number) {
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x]!;
    distanceLine(f, d, v, z, h);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y]!;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x]!;
    distanceLine(f, d, v, z, w);
    for (let x = 0; x < w; x++) grid[y * w + x] = d[x]!;
  }
}

function blurLine(
  src: Float32Array,
  dst: Float32Array,
  offset: number,
  stride: number,
  n: number,
  r: number,
) {
  const scale = 1 / (2 * r + 1);
  let sum = src[offset]! * (r + 1);
  for (let i = 1; i <= r; i++)
    sum += src[offset + Math.min(i, n - 1) * stride]!;
  for (let i = 0; i < n; i++) {
    dst[offset + i * stride] = sum * scale;
    sum +=
      src[offset + Math.min(i + r + 1, n - 1) * stride]! -
      src[offset + Math.max(i - r, 0) * stride]!;
  }
}

/** Three box-blur passes ≈ Gaussian. */
function blurGrid(grid: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(w * h);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) blurLine(grid, tmp, y * w, 1, w, r);
    for (let x = 0; x < w; x++) blurLine(tmp, grid, x, w, h, r);
  }
}

const settle = (x: number) => 1 / (1 + Math.exp(-1.702 * x));

function paint(
  w: number,
  h: number,
  fill: (data: Uint8ClampedArray) => void,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2d context unavailable');
  const image = context.createImageData(w, h);
  fill(image.data);
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

function shade(
  depth: Float32Array,
  w: number,
  h: number,
  falloff: (t: number) => number,
): string {
  return paint(w, h, (data) => {
    data.fill(255);
    for (let i = 0; i < w * h; i++)
      data[i * 4 + 3] = 255 * (1 - falloff(depth[i]!));
  });
}

export interface TracedShape {
  box: GlassShapeBox;
  depth: Float32Array;
  w: number;
  h: number;
  ratio: number;
  line: string;
  glow: string;
}

/** Rasterises the shape image and computes a signed distance field plus outline masks. */
export function traceShape(
  image: HTMLImageElement,
  width: number,
  height: number,
  ratio: number,
): TracedShape {
  const naturalWidth = image.naturalWidth || width;
  const naturalHeight = image.naturalHeight || height;
  const fit = Math.min(width / naturalWidth, height / naturalHeight);
  const box = {
    x: (width - naturalWidth * fit) / 2,
    y: (height - naturalHeight * fit) / 2,
    width: naturalWidth * fit,
    height: naturalHeight * fit,
  };
  const w = Math.max(2, Math.round(width * ratio));
  const h = Math.max(2, Math.round(height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('2d context unavailable');
  context.drawImage(
    image,
    box.x * ratio,
    box.y * ratio,
    box.width * ratio,
    box.height * ratio,
  );
  const pixels = context.getImageData(0, 0, w, h).data;
  const outside = new Float32Array(w * h);
  const inside = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const edge = 0.5 - pixels[i * 4 + 3]! / 255;
    outside[i] = edge >= 0.5 ? FAR : Math.max(edge, 0) ** 2;
    inside[i] = edge <= -0.5 ? FAR : Math.min(edge, 0) ** 2;
  }
  distanceGrid(outside, w, h);
  distanceGrid(inside, w, h);
  const depth = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    depth[i] = (Math.sqrt(inside[i]!) - Math.sqrt(outside[i]!)) / ratio;
  }
  return {
    box,
    depth,
    w,
    h,
    ratio,
    line: shade(depth, w, h, (t) => settle(t - 1)),
    glow: shade(depth, w, h, (t) => settle((t - 4) / 5)),
  };
}

/** Builds a displacement map (data URL) whose gradients follow the shape's distance field. */
export function bendShape(
  trace: Pick<TracedShape, 'depth' | 'w' | 'h' | 'ratio'>,
  edge: number,
  softness: number,
  calm: number,
  level: number,
): string {
  const { depth, w, h, ratio } = trace;
  const reach = edge + softness * 2;
  const field = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    field[i] = Math.min(Math.max(depth[i]!, -6), reach);
  }
  blurGrid(
    field,
    w,
    h,
    Math.max(1, Math.round(Math.max(1.5, softness * 0.35) * ratio)),
  );
  return paint(w, h, (data) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const dx =
          field[i + (x < w - 1 ? 1 : 0)]! - field[i - (x > 0 ? 1 : 0)]!;
        const dy =
          field[i + (y < h - 1 ? w : 0)]! - field[i - (y > 0 ? w : 0)]!;
        const still = calm * settle((depth[i]! - edge) / softness);
        const bend = (1 - still) * ratio * 0.25;
        const shift = still * (level - 0.5);
        data[i * 4] = 255 * (0.5 + dx * bend + shift);
        data[i * 4 + 1] = 255 * (0.5 + dy * bend + shift);
        data[i * 4 + 2] = 255 * (0.5 + shift);
        data[i * 4 + 3] = 255;
      }
    }
  });
}
