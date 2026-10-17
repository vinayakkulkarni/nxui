import type { MetallicPaintRgba } from './types';

const WORKING_SIZE = 512;
const MAX_SIDE = 2048;

export const MAX_PIXELS = 2560 * 1600 * 2;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

let colorContext: CanvasRenderingContext2D | null = null;

export function parseColor(
  value: string,
  fallback: MetallicPaintRgba,
): MetallicPaintRgba {
  if (typeof document === 'undefined') return fallback;
  colorContext ??= document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  if (!colorContext) return fallback;
  colorContext.clearRect(0, 0, 1, 1);
  colorContext.fillStyle = 'rgba(0, 0, 0, 0)';
  colorContext.fillStyle = String(value);
  colorContext.fillRect(0, 0, 1, 1);
  const data = colorContext.getImageData(0, 0, 1, 1).data;
  return [
    (data[0] ?? 0) / 255,
    (data[1] ?? 0) / 255,
    (data[2] ?? 0) / 255,
    (data[3] ?? 0) / 255,
  ];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('MetallicPaint: failed to load the image'));
    image.src = src;
  });
}

async function isVector(src: string): Promise<boolean> {
  if (/\.svg(?:$|[?#])/i.test(src) || src.startsWith('data:image/svg+xml'))
    return true;
  if (!src.startsWith('blob:')) return false;
  try {
    const blob = await (await fetch(src)).blob();
    return blob.type === 'image/svg+xml';
  } catch {
    return false;
  }
}

/** Rasterises an image; opaque images are keyed so their dark pixels become the shape. */
export async function drawImageSource(
  src: string,
): Promise<HTMLCanvasElement | null> {
  const [image, vector] = await Promise.all([loadImage(src), isVector(src)]);
  let width = image.naturalWidth || image.width || MAX_SIDE;
  let height = image.naturalHeight || image.height || MAX_SIDE;
  const longest = Math.max(width, height);
  const fit = vector
    ? MAX_SIDE / longest
    : clamp(1024 / longest, 1, MAX_SIDE / longest);
  width = Math.max(1, Math.round(width * fit));
  height = Math.max(1, Math.round(height * fit));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  let opaque = true;
  for (let i = 3; i < data.data.length; i += 4) {
    if ((data.data[i] ?? 255) < 250) {
      opaque = false;
      break;
    }
  }
  if (opaque) {
    for (let i = 0; i < data.data.length; i += 4) {
      const light = Math.min(
        data.data[i] ?? 0,
        data.data[i + 1] ?? 0,
        data.data[i + 2] ?? 0,
      );
      data.data[i + 3] = Math.round(clamp((250 - light) / 30, 0, 1) * 255);
    }
    ctx.putImageData(data, 0, 0);
  }
  return canvas;
}

export async function drawTextSource(
  text: string,
  fontFamily: string,
  fontWeight: number,
): Promise<HTMLCanvasElement | null> {
  const size = 320;
  const font = `${fontWeight} ${size}px ${fontFamily}`;
  try {
    await document.fonts.load(font, text);
  } catch {
    return null;
  }
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) return null;
  probe.font = font;
  const metrics = probe.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || size * 0.8;
  const descent = metrics.actualBoundingBoxDescent || size * 0.2;
  const left = metrics.actualBoundingBoxLeft || 0;
  const right = metrics.actualBoundingBoxRight || metrics.width;
  const pad = size * 0.12;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(left + right + pad * 2);
  canvas.height = Math.ceil(ascent + descent + pad * 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.font = font;
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, pad + left, pad + ascent);
  return canvas;
}

function solvePoisson(mask: Uint8Array, width: number, height: number) {
  const interior: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!mask[i]) continue;
      const boundary =
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        !mask[i - 1] ||
        !mask[i + 1] ||
        !mask[i - width] ||
        !mask[i + width] ||
        !mask[i - width - 1] ||
        !mask[i - width + 1] ||
        !mask[i + width - 1] ||
        !mask[i + width + 1];
      if (!boundary) interior.push(i);
    }
  }
  const field = new Float32Array(width * height);
  const red: number[] = [];
  const black: number[] = [];
  for (const i of interior) {
    if (((i % width) + Math.floor(i / width)) % 2 === 0) red.push(i);
    else black.push(i);
  }
  const relax = (list: number[]) => {
    for (const i of list) {
      const sum =
        (field[i + 1] ?? 0) +
        (field[i - 1] ?? 0) +
        (field[i - width] ?? 0) +
        (field[i + width] ?? 0);
      field[i] = 1.9 * ((0.01 + sum) / 4) - 0.9 * (field[i] ?? 0);
    }
  };
  for (let iteration = 0; iteration < 40; iteration++) {
    relax(red);
    relax(black);
  }
  let peak = 0;
  for (const i of interior) {
    const value = field[i] ?? 0;
    if (value > peak) peak = value;
  }
  return { field, peak: peak || 1 };
}

/**
 * Turns a shape into the shader texture: R = inverted Poisson depth (0 at the
 * ridge, 1 at the outline), G = coverage, B/A = 255.
 */
export function processShape(source: HTMLCanvasElement): ImageData | null {
  const width = source.width;
  const height = source.height;
  const fit = WORKING_SIZE / Math.min(width, height);
  const workW = Math.max(2, Math.round(width * fit));
  const workH = Math.max(2, Math.round(height * fit));

  const small = document.createElement('canvas');
  small.width = workW;
  small.height = workH;
  const smallCtx = small.getContext('2d', { willReadFrequently: true });
  const sourceCtx = source.getContext('2d', { willReadFrequently: true });
  if (!smallCtx || !sourceCtx) return null;
  smallCtx.drawImage(source, 0, 0, workW, workH);
  const smallData = smallCtx.getImageData(0, 0, workW, workH).data;
  const mask = new Uint8Array(workW * workH);
  for (let i = 0; i < mask.length; i++)
    mask[i] = (smallData[i * 4 + 3] ?? 0) > 0 ? 1 : 0;

  const { field, peak } = solvePoisson(mask, workW, workH);
  const gradient = smallCtx.createImageData(workW, workH);
  for (let i = 0; i < mask.length; i++) {
    const p = i * 4;
    const value = mask[i] ? 255 * (1 - (field[i] ?? 0) / peak) : 255;
    gradient.data[p] = value;
    gradient.data[p + 1] = value;
    gradient.data[p + 2] = value;
    gradient.data[p + 3] = mask[i] ? 255 : 0;
  }
  smallCtx.putImageData(gradient, 0, 0);

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const outCtx = out.getContext('2d', { willReadFrequently: true });
  if (!outCtx) return null;
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(small, 0, 0, workW, workH, 0, 0, width, height);
  const result = outCtx.getImageData(0, 0, width, height);
  const original = sourceCtx.getImageData(0, 0, width, height).data;
  for (let i = 0; i < result.data.length; i += 4) {
    const alpha = original[i + 3] ?? 0;
    if (alpha === 0) {
      result.data[i] = 255;
      result.data[i + 1] = 0;
    } else {
      result.data[i] = result.data[i + 3] === 0 ? 0 : (result.data[i] ?? 0);
      result.data[i + 1] = alpha;
    }
    result.data[i + 2] = 255;
    result.data[i + 3] = 255;
  }
  return result;
}
