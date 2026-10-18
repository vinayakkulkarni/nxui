function hash(x: number, y: number, s: number): number {
  let n = x * 374761393 + y * 668265263 + s * 1274126177;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(
  px: number,
  py: number,
  size: number,
  freq: number,
  seed: number,
): number {
  const fx = (px / size) * freq;
  const fy = (py / size) * freq;
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const tx = fx - ix;
  const ty = fy - iy;
  const w = freq | 0;
  const wrap = (v: number) => ((v % w) + w) % w;
  const v00 = hash(wrap(ix), wrap(iy), seed);
  const v10 = hash(wrap(ix + 1), wrap(iy), seed);
  const v01 = hash(wrap(ix), wrap(iy + 1), seed);
  const v11 = hash(wrap(ix + 1), wrap(iy + 1), seed);
  return (
    v00 * (1 - tx) * (1 - ty) +
    v10 * tx * (1 - ty) +
    v01 * (1 - tx) * ty +
    v11 * tx * ty
  );
}

/** Tileable 8-octave value noise, as RGBA bytes, that drives the flames. */
export function generateNoiseTexture(size = 256): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      let amp = 0.4;
      let totalAmp = 0;
      for (let o = 0; o < 8; o++) {
        v += amp * valueNoise(x, y, size, 32 * (1 << o), o * 31);
        totalAmp += amp;
        amp *= 0.65;
      }
      v /= totalAmp;
      v = (v - 0.5) * 2.2 + 0.5;
      v = Math.max(0, Math.min(1, v));
      const val = Math.round(v * 255);
      const i = (y * size + x) * 4;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
  }
  return data;
}

/** Parses a #rrggbb (or #rgb) color into 0-1 RGB. */
export function hexToVec3(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [
    Number.parseInt(h.slice(0, 2), 16) / 255,
    Number.parseInt(h.slice(2, 4), 16) / 255,
    Number.parseInt(h.slice(4, 6), 16) / 255,
  ];
}
