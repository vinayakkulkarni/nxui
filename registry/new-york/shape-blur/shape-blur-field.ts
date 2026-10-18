export const FIELD = 512;
export const PAD = 0.35;
const FAR = 1e20;

function sweep(
  grid: Float64Array,
  offset: number,
  stride: number,
  length: number,
  f: Float64Array,
  v: Int32Array,
  z: Float64Array,
) {
  for (let q = 0; q < length; q++) f[q] = grid[offset + q * stride] ?? FAR;
  const fv = (k: number) => {
    const at = v[k] ?? 0;
    return (f[at] ?? 0) + at * at;
  };
  let k = 0;
  v[0] = 0;
  z[0] = -FAR;
  z[1] = FAR;
  for (let q = 1; q < length; q++) {
    const fq = (f[q] ?? 0) + q * q;
    let s = (fq - fv(k)) / (2 * (q - (v[k] ?? 0)));
    while (s <= (z[k] ?? -FAR)) {
      k--;
      s = (fq - fv(k)) / (2 * (q - (v[k] ?? 0)));
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = FAR;
  }
  k = 0;
  for (let q = 0; q < length; q++) {
    while ((z[k + 1] ?? FAR) < q) k++;
    const at = v[k] ?? 0;
    const gap = q - at;
    grid[offset + q * stride] = gap * gap + (f[at] ?? 0);
  }
}

/** Felzenszwalb squared Euclidean distance transform, in place. */
function distanceTransform(grid: Float64Array, size: number) {
  const f = new Float64Array(size);
  const v = new Int32Array(size);
  const z = new Float64Array(size + 1);
  for (let x = 0; x < size; x++) sweep(grid, x, size, size, f, v, z);
  for (let y = 0; y < size; y++) sweep(grid, y * size, 1, size, f, v, z);
}

/**
 * Rasterizes an image's alpha into a FIELD x FIELD signed distance field
 * (pixels, negative inside), so any SVG or transparent PNG can act as the shape.
 */
export function buildField(image: HTMLImageElement): Float32Array | null {
  const raster = image.ownerDocument.createElement('canvas');
  raster.width = FIELD;
  raster.height = FIELD;
  const ctx = raster.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const width = image.naturalWidth || FIELD;
  const height = image.naturalHeight || FIELD;
  const scale = FIELD / (1 + PAD) / Math.max(width, height);
  ctx.drawImage(
    image,
    (FIELD - width * scale) / 2,
    (FIELD - height * scale) / 2,
    width * scale,
    height * scale,
  );
  const pixels = ctx.getImageData(0, 0, FIELD, FIELD).data;
  const outside = new Float64Array(FIELD * FIELD);
  const inside = new Float64Array(FIELD * FIELD);
  for (let i = 0; i < FIELD * FIELD; i++) {
    const alpha = (pixels[i * 4 + 3] ?? 0) / 255;
    const edge = 0.5 - alpha;
    outside[i] =
      alpha >= 0.999 ? 0 : alpha <= 0.001 ? FAR : edge > 0 ? edge * edge : 0;
    inside[i] =
      alpha >= 0.999 ? FAR : alpha <= 0.001 ? 0 : edge < 0 ? edge * edge : 0;
  }
  distanceTransform(outside, FIELD);
  distanceTransform(inside, FIELD);
  const field = new Float32Array(FIELD * FIELD);
  for (let i = 0; i < FIELD * FIELD; i++)
    field[i] = Math.sqrt(outside[i] ?? 0) - Math.sqrt(inside[i] ?? 0);
  return field;
}
