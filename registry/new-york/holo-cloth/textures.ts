import * as THREE from 'three';

/** Deterministic pseudo-random for texture generation */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 1831565813) | 0; // 0x6D2B79F5
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Height field of a fine fabric weave: interleaved warp/weft threads,
 * per-thread thickness variation and micro grain.
 */
function weaveHeight(
  size: number,
  threads: number,
  rand: () => number,
): Float32Array {
  const h = new Float32Array(size * size);
  // per-thread random thickness so the weave doesn't look machine-perfect
  const warpVar = new Float32Array(threads + 1);
  const weftVar = new Float32Array(threads + 1);
  for (let i = 0; i <= threads; i++) {
    warpVar[i] = 0.85 + rand() * 0.3;
    weftVar[i] = 0.85 + rand() * 0.3;
  }
  const grain = new Float32Array(size * size);
  for (let i = 0; i < grain.length; i++) grain[i] = rand();

  for (let y = 0; y < size; y++) {
    const v = (y / size) * threads;
    const vi = Math.floor(v);
    const vf = v - vi;
    for (let x = 0; x < size; x++) {
      const u = (x / size) * threads;
      const ui = Math.floor(u);
      const uf = u - ui;
      // thread cross-section profile (half-sine bump per thread)
      const warp = Math.sin(uf * Math.PI) * warpVar[ui % (threads + 1)];
      const weft = Math.sin(vf * Math.PI) * weftVar[vi % (threads + 1)];
      // plain weave: alternate which thread lies on top
      const over = (ui + vi) % 2 === 0;
      const height = over
        ? warp * 0.62 + weft * 0.38
        : weft * 0.62 + warp * 0.38;
      const g = grain[y * size + x];
      h[y * size + x] = height * 0.85 + g * 0.15;
    }
  }
  return h;
}

/** Sobel a height field into a tangent-space normal map texture. */
function heightToNormalTexture(
  h: Float32Array,
  size: number,
  strength: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const at = (x: number, y: number) =>
    h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * size + x) * 4;
      data[i] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round((dy * inv * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export function makeWeaveNormalMap(
  size = 512,
  threads = 64,
  seed = 1337,
): THREE.CanvasTexture {
  const rand = mulberry32(seed);
  const h = weaveHeight(size, threads, rand);
  return heightToNormalTexture(h, size, 1.6);
}

/** Subtle grain map used as roughness variation — keeps the matte finish alive. */
export function makeGrainRoughnessMap(
  size = 256,
  seed = 4242,
): THREE.CanvasTexture {
  const rand = mulberry32(seed);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;
  for (let i = 0; i < size * size; i++) {
    // mid-gray with mild noise; roughnessMap multiplies material.roughness
    const v = Math.round(215 + (rand() - 0.5) * 70);
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}
