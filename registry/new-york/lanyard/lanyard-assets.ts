import * as THREE from 'three';
import type {
  LanyardAnchor,
  LanyardCardGeometry,
  LanyardCardLayout,
  LanyardFinish,
  LanyardFinishLook,
  LanyardImageFit,
  LanyardMetal,
  LanyardMetalLook,
  LanyardOrientation,
  LanyardPathLike,
  LanyardRgb,
} from './types';

const CARD_SIZES: Record<LanyardOrientation, [number, number]> = {
  portrait: [1.6, 2.25],
  landscape: [2.25, 1.6],
};
export const ANCHORS: Record<LanyardAnchor, number> = {
  left: 0.27,
  center: 0.5,
  right: 0.73,
};
export const THICKNESS = 0.018;
export const BEVEL = 0.007;
export const JOINTS = 4;
export const NODE_WEIGHT = 1 / 0.05;
export const MAX_STEP = 1 / 960;
export const ITERATIONS = 2;
export const SAMPLES = 72;
export const FOV = 24;
export const STRAP_WIDTH = 0.36;
export const RING_RADIUS = 0.095;
export const RING_TUBE = 0.0135;
export const EYELET_RADIUS = 0.036;
export const CLAMP_BODY = 0.15;
export const FACE_WIDTH = 1024;
export const BAND_COLUMNS = [0, 0.07, 0.93, 1];
export const BAND_BEND = [-0.95, -0.28, 0.28, 0.95];
export const FLIP_SPIN = 9;

export const FINISHES: Record<LanyardFinish, LanyardFinishLook> = {
  glossy: {
    roughness: 0.42,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    foil: 0,
    anisotropy: 0,
  },
  matte: {
    roughness: 0.85,
    metalness: 0,
    clearcoat: 0,
    clearcoatRoughness: 0.6,
    foil: 0,
    anisotropy: 0,
  },
  holographic: {
    roughness: 0.3,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    foil: 1,
    anisotropy: 0,
  },
  metallic: {
    roughness: 0.36,
    metalness: 0.75,
    clearcoat: 0.5,
    clearcoatRoughness: 0.18,
    foil: 0,
    anisotropy: 0.7,
  },
};

export const METALS: Record<LanyardMetal, LanyardMetalLook> = {
  silver: { color: '#d9dce2', roughness: 0.16 },
  gold: { color: '#e4b965', roughness: 0.2 },
  graphite: { color: '#4d4f55', roughness: 0.28 },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Resolves any CSS colour to linear-ish 0–1 sRGB channels via a 2D canvas. */
export function parseColor(value: string, fallback: LanyardRgb): LanyardRgb {
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
}

function luminance(rgb: LanyardRgb): number {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function toCss(rgb: LanyardRgb, alpha = 1): string {
  return `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)}, ${alpha})`;
}

/** mulberry32 PRNG so generated textures are identical on every mount. */
function seeded(start: number): () => number {
  let state = start >>> 0;
  return () => {
    state = (state + 1831565813) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function traceRoundedRect(
  path: LanyardPathLike,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const k = r * 0.4477;
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.bezierCurveTo(x + width - k, y, x + width, y + k, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.bezierCurveTo(
    x + width,
    y + height - k,
    x + width - k,
    y + height,
    x + width - r,
    y + height,
  );
  path.lineTo(x + r, y + height);
  path.bezierCurveTo(x + k, y + height, x, y + height - k, x, y + height - r);
  path.lineTo(x, y + r);
  path.bezierCurveTo(x, y + k, x + k, y, x + r, y);
}

export function loadImage(
  cache: Map<string, Promise<HTMLImageElement | null>>,
  url: string | undefined,
): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  const cached = cache.get(url);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
  cache.set(url, promise);
  return promise;
}

export function cardLayout(
  orientation: LanyardOrientation,
  cornerRadius: number,
): LanyardCardLayout {
  const [width, height] = CARD_SIZES[orientation] ?? CARD_SIZES.portrait;
  const radius = mix(
    0.03,
    Math.min(width, height) * 0.2,
    clamp(cornerRadius, 0, 1),
  );
  const slot = { width: 0.34, height: 0.07, y: height / 2 - 0.13 };
  const ringY = height / 2 - 0.055;
  return { width, height, radius, slot, ringY, hangY: ringY + RING_RADIUS };
}

export function buildCardGeometry(
  layout: LanyardCardLayout,
): LanyardCardGeometry {
  const { width, height, radius, slot } = layout;
  const outline = new THREE.Shape();
  traceRoundedRect(
    outline,
    -width / 2 + BEVEL,
    -height / 2 + BEVEL,
    width - BEVEL * 2,
    height - BEVEL * 2,
    Math.max(radius - BEVEL, 0.005),
  );
  const hole = new THREE.Path();
  traceRoundedRect(
    hole,
    -slot.width / 2 - BEVEL,
    slot.y - slot.height / 2 - BEVEL,
    slot.width + BEVEL * 2,
    slot.height + BEVEL * 2,
    slot.height / 2 + BEVEL,
  );
  outline.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(outline, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 5,
    curveSegments: 24,
  });
  body.translate(0, 0, -THICKNESS / 2);
  const face = new THREE.ShapeGeometry(outline, 24);
  const position = face.getAttribute('position');
  const uv = face.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    uv.setXY(
      i,
      (position.getX(i) + width / 2) / width,
      (position.getY(i) + height / 2) / height,
    );
  }
  uv.needsUpdate = true;
  return { body, face };
}

export function buildClampGeometry(width: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const w = width * 1.16;
  traceRoundedRect(
    shape,
    -w / 2 + 0.014,
    -CLAMP_BODY / 2 + 0.014,
    w - 0.028,
    CLAMP_BODY - 0.028,
    0.024,
  );
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 6,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -0.01);
  return geometry;
}

export function buildBandGeometry(count: number): THREE.BufferGeometry {
  const columns = BAND_COLUMNS.length;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3),
  );
  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3),
  );
  geometry.setAttribute(
    'uv',
    new THREE.BufferAttribute(new Float32Array(count * columns * 2), 2),
  );
  const index: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    for (let c = 0; c < columns - 1; c++) {
      const a = i * columns + c;
      index.push(a, a + columns, a + 1, a + 1, a + columns, a + columns + 1);
    }
  }
  geometry.setIndex(index);
  return geometry;
}

/** Studio light-box rendered once into a PMREM environment map. */
export function buildEnvironment(
  renderer: THREE.WebGLRenderer,
): THREE.WebGLRenderTarget {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.035, 0.035, 0.04);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials: THREE.MeshBasicMaterial[] = [];
  const panel = (
    intensity: number,
    position: [number, number, number],
    scale: [number, number],
    rotation = 0,
  ) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(intensity, intensity, intensity),
      side: THREE.DoubleSide,
    });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.scale.set(scale[0], scale[1], 1);
    mesh.lookAt(0, 0, 0);
    mesh.rotateZ(rotation);
    scene.add(mesh);
  };
  panel(2.6, [0, 4.5, 8], [9, 4]);
  panel(6, [-5.5, 0.5, 7], [0.9, 14]);
  panel(4, [5, -0.5, 8], [0.6, 14]);
  panel(3.5, [0, -1, 9], [24, 0.35], Math.PI / 3);
  panel(2.5, [1, 2.5, 9], [24, 0.2], Math.PI / 3);
  panel(1.4, [0, 6, -6], [12, 4]);
  panel(0.5, [0, -7, 1], [16, 6]);
  panel(0.9, [8, 0, -2], [4, 10]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  geometry.dispose();
  materials.forEach((material) => material.dispose());
  return target;
}

export function makeCanvasTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

/** Fine paper-grain normal map for the card faces. */
export function buildGrainTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const random = seeded(7);
  const field = Float32Array.from({ length: size * size }, () => random());
  const height = (x: number, y: number) => {
    let sum = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++)
        sum +=
          field[((y + j + size) % size) * size + ((x + i + size) % size)] ?? 0;
    }
    return (sum / 9) * 1.6;
  };
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = height((x - 1 + size) % size, y) - height((x + 1) % size, y);
      const ny = height(x, (y - 1 + size) % size) - height(x, (y + 1) % size);
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      image.data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 7);
  return texture;
}

/** Woven-strap normal map: alternating warp/weft threads with fibre noise. */
export function buildWeaveTexture(): THREE.DataTexture {
  const size = 128;
  const threads = 8;
  const random = seeded(19);
  const fiber = Float32Array.from({ length: size * size }, () => random());
  const profile = (f: number) => Math.sqrt(Math.max(0, 1 - 4 * f * f));
  const height = (x: number, y: number) => {
    const px = ((x % size) + size) % size;
    const py = ((y % size) + size) % size;
    const u = (px / size) * threads;
    const v = (py / size) * threads;
    const cu = Math.floor(u);
    const cv = Math.floor(v);
    const fu = u - cu - 0.5;
    const fv = v - cv - 0.5;
    const lift = (cu + cv) % 2 === 0;
    const warp =
      profile(fu) * (0.55 + 0.45 * Math.cos(fv * Math.PI * (lift ? 1 : 0.6)));
    const weft =
      profile(fv) * (0.55 + 0.45 * Math.cos(fu * Math.PI * (lift ? 0.6 : 1)));
    return (
      (lift ? Math.max(warp, weft * 0.7) : Math.max(weft, warp * 0.7)) +
      (fiber[py * size + px] ?? 0) * 0.08
    );
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (height(x - 1, y) - height(x + 1, y)) * 1.6;
      const ny = (height(x, y - 1) - height(x, y + 1)) * 1.6;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function drawFitted(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  fit: LanyardImageFit,
) {
  const scale = (fit === 'contain' ? Math.min : Math.max)(
    width / image.width,
    height / image.height,
  );
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}

export function paintFace(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  color: LanyardRgb,
  fit: LanyardImageFit,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (image) drawFitted(ctx, image, canvas.width, canvas.height, fit);
}

/** Paints one strap tile (image rotated along the band, or a stitched plain weave); returns its length/width ratio. */
export function paintStrap(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  color: LanyardRgb,
): number {
  const across = 192;
  const along = image
    ? Math.max(64, Math.round((image.width / image.height) * across))
    : across * 2;
  canvas.width = across;
  canvas.height = along;
  const ctx = canvas.getContext('2d');
  if (!ctx) return along / across;
  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, across, along);
  if (image) {
    ctx.save();
    ctx.translate(across, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(image, 0, 0, along, across);
    ctx.restore();
    return along / across;
  }
  const ink: LanyardRgb = luminance(color) > 0.5 ? [0, 0, 0] : [1, 1, 1];
  ctx.fillStyle = toCss(ink, 0.05);
  for (let y = 0; y < along; y += 4) ctx.fillRect(0, y, across, 1);
  ctx.fillStyle = toCss(ink, 0.2);
  for (let y = 0; y < along; y += 14) {
    ctx.fillRect(across * 0.075, y, 2, 8);
    ctx.fillRect(across * 0.925 - 2, y, 2, 8);
  }
  return along / across;
}
