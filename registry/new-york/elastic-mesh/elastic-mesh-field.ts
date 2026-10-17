export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const at = (list: ArrayLike<number>, i: number) => list[i] ?? 0;

// Felzenszwalb 1D squared-distance transform.
const distance1d = (
  f: Float64Array,
  n: number,
  d: Float64Array,
  v: Int32Array,
  z: Float64Array,
) => {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let vk = at(v, k);
    let s = (at(f, q) + q * q - (at(f, vk) + vk * vk)) / (2 * q - 2 * vk);
    while (s <= at(z, k)) {
      k--;
      vk = at(v, k);
      s = (at(f, q) + q * q - (at(f, vk) + vk * vk)) / (2 * q - 2 * vk);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (at(z, k + 1) < q) k++;
    const vk = at(v, k);
    d[q] = (q - vk) * (q - vk) + at(f, vk);
  }
};

export const distanceField = (
  grid: Float64Array,
  width: number,
  height: number,
) => {
  const n = Math.max(width, height);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) f[y] = at(grid, y * width + x);
    distance1d(f, height, d, v, z);
    for (let y = 0; y < height; y++) grid[y * width + x] = at(d, y);
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) f[x] = at(grid, y * width + x);
    distance1d(f, width, d, v, z);
    for (let x = 0; x < width; x++) grid[y * width + x] = Math.sqrt(at(d, x));
  }
  return grid;
};

// For every pixel, the label of the nearest labelled pixel (Voronoi ownership).
export const nearestLabels = (
  labels: Int32Array,
  width: number,
  height: number,
) => {
  const far = 1e20;
  const column = new Float64Array(width * height);
  const site = new Int32Array(width * height);
  for (let x = 0; x < width; x++) {
    let last = -1;
    for (let y = 0; y < height; y++) {
      const i = y * width + x;
      if (at(labels, i)) last = y;
      site[i] = last;
      column[i] = last >= 0 ? (y - last) * (y - last) : far;
    }
    last = -1;
    for (let y = height - 1; y >= 0; y--) {
      const i = y * width + x;
      if (at(labels, i)) last = y;
      if (last >= 0 && (last - y) * (last - y) < at(column, i)) {
        column[i] = (last - y) * (last - y);
        site[i] = last;
      }
    }
  }
  const out = new Float32Array(width * height);
  const f = new Float64Array(width);
  const v = new Int32Array(width);
  const z = new Float64Array(width + 1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) f[x] = at(column, y * width + x);
    let k = 0;
    v[0] = 0;
    z[0] = -Infinity;
    z[1] = Infinity;
    for (let q = 1; q < width; q++) {
      let vk = at(v, k);
      let cut = (at(f, q) + q * q - (at(f, vk) + vk * vk)) / (2 * q - 2 * vk);
      while (cut <= at(z, k)) {
        k--;
        vk = at(v, k);
        cut = (at(f, q) + q * q - (at(f, vk) + vk * vk)) / (2 * q - 2 * vk);
      }
      k++;
      v[k] = q;
      z[k] = cut;
      z[k + 1] = Infinity;
    }
    k = 0;
    for (let x = 0; x < width; x++) {
      while (at(z, k + 1) < x) k++;
      const sx = at(v, k);
      const sy = at(site, y * width + sx);
      out[y * width + x] = sy >= 0 ? at(labels, sy * width + sx) : 0;
    }
  }
  return out;
};

interface FieldLevel {
  width: number;
  height: number;
  mask: Float32Array;
}

// Multigrid Poisson solve: the "inflated" height of the mask.
export const inflateField = (
  mask: Float32Array,
  width: number,
  height: number,
) => {
  const levels: FieldLevel[] = [{ width, height, mask }];
  let top = levels[0]!;
  while (Math.max(top.width, top.height) > 48) {
    const prev = top;
    const w = Math.ceil(prev.width / 2);
    const h = Math.ceil(prev.height / 2);
    const next = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const sx = x * 2 + dx;
            const sy = y * 2 + dy;
            if (sx < prev.width && sy < prev.height) {
              sum += at(prev.mask, sy * prev.width + sx);
              count++;
            }
          }
        }
        next[y * w + x] = sum / count;
      }
    }
    top = { width: w, height: h, mask: next };
    levels.push(top);
  }

  let solution: Float32Array | null = null;
  for (let level = levels.length - 1; level >= 0; level--) {
    const { width: w, height: h, mask: m } = levels[level]!;
    const current = new Float32Array(w * h);
    if (solution) {
      const pw = levels[level + 1]!.width;
      const ph = levels[level + 1]!.height;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const fx = clamp((x + 0.5) / 2 - 0.5, 0, pw - 1);
          const fy = clamp((y + 0.5) / 2 - 0.5, 0, ph - 1);
          const x0 = Math.floor(fx);
          const y0 = Math.floor(fy);
          const x1 = Math.min(pw - 1, x0 + 1);
          const y1 = Math.min(ph - 1, y0 + 1);
          const tx = fx - x0;
          const ty = fy - y0;
          const upper =
            at(solution, y0 * pw + x0) * (1 - tx) +
            at(solution, y0 * pw + x1) * tx;
          const lower =
            at(solution, y1 * pw + x0) * (1 - tx) +
            at(solution, y1 * pw + x1) * tx;
          current[y * w + x] = upper * (1 - ty) + lower * ty;
        }
      }
    }
    const source = 4 ** level;
    const iterations = level === levels.length - 1 ? 300 : 60;
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (at(m, i) < 0.5) {
            current[i] = 0;
            continue;
          }
          const l = x > 0 ? at(current, i - 1) : 0;
          const r = x < w - 1 ? at(current, i + 1) : 0;
          const u = y > 0 ? at(current, i - w) : 0;
          const d = y < h - 1 ? at(current, i + w) : 0;
          const c = at(current, i);
          current[i] = c + ((l + r + u + d + source) * 0.25 - c) * 1.85;
        }
      }
    }
    solution = current;
  }
  return solution ?? new Float32Array(width * height);
};

export const blurField = (
  source: ArrayLike<number>,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.max(1, Math.round(radius));
  const sigma = r / 2.5;
  const kernel = new Float32Array(r * 2 + 1);
  let total = 0;
  for (let i = -r; i <= r; i++) {
    const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + r] = weight;
    total += weight;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] = at(kernel, i) / total;
  const temp = new Float32Array(width * height);
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let i = -r; i <= r; i++)
        sum +=
          at(source, y * width + clamp(x + i, 0, width - 1)) *
          at(kernel, i + r);
      temp[y * width + x] = sum;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let i = -r; i <= r; i++)
        sum +=
          at(temp, clamp(y + i, 0, height - 1) * width + x) * at(kernel, i + r);
      out[y * width + x] = sum;
    }
  }
  return out;
};
