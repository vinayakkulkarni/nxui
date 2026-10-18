import type { NoiseBlendMode, NoiseScratch, NoiseSettings } from './types';

export const NOISE_TILE = 256;
const TAU = Math.PI * 2;

export const NOISE_BLENDS: NoiseBlendMode[] = [
  'normal',
  'overlay',
  'soft-light',
  'multiply',
  'screen',
  'difference',
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function generator(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 1831565813) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Paints one seamless 256px grain tile; the overlay repeats it and jitters its position. */
export function paintTile(
  contrast: number,
  colored: boolean,
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = NOISE_TILE;
  canvas.height = NOISE_TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const image = ctx.createImageData(NOISE_TILE, NOISE_TILE);
  const data = image.data;
  const random = generator(1013904223);
  const range = 0.5 + contrast * 1.1;
  const sample = () =>
    clamp(0.5 + (random() + random() - 1) * range, 0, 1) * 255;
  for (let i = 0; i < data.length; i += 4) {
    const value = sample();
    data[i] = value;
    data[i + 1] = colored ? sample() : value;
    data[i + 2] = colored ? sample() : value;
    data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function drawSpeck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  tone: string,
  alpha: number,
): void {
  const lobes = 1 + Math.floor(Math.random() * 3);
  for (let k = 0; k < lobes; k++) {
    const ox = x + (Math.random() - 0.5) * radius * 1.4;
    const oy = y + (Math.random() - 0.5) * radius * 1.4;
    const size = radius * (0.55 + Math.random() * 0.5);
    const fill = ctx.createRadialGradient(ox, oy, 0, ox, oy, size);
    fill.addColorStop(0, `rgba(${tone}, ${alpha})`);
    fill.addColorStop(0.55, `rgba(${tone}, ${alpha * 0.85})`);
    fill.addColorStop(1, `rgba(${tone}, 0)`);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(ox, oy, size, 0, TAU);
    ctx.fill();
  }
}

function drawHair(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const x = Math.random() * width;
  const y = Math.random() * height;
  const length = 14 + Math.random() * 46;
  const angle = Math.random() * TAU;
  const bend = (Math.random() - 0.5) * length * 0.9;
  const ex = x + Math.cos(angle) * length;
  const ey = y + Math.sin(angle) * length;
  const cx = (x + ex) / 2 - Math.sin(angle) * bend;
  const cy = (y + ey) / 2 + Math.cos(angle) * bend;
  ctx.strokeStyle = `rgba(16, 12, 9, ${0.4 + Math.random() * 0.35})`;
  ctx.lineWidth = 0.6 + Math.random() * 0.7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(cx, cy, ex, ey);
  ctx.stroke();
}

/** Draws one frame of dust, hairs and scratches. `step` is seconds since the last frame (0 = repaint only). */
export function paintDust(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  s: NoiseSettings,
  scratchList: NoiseScratch[],
  width: number,
  height: number,
  step: number,
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (s.dust <= 0 && s.scratches <= 0 && scratchList.length === 0) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const area = (width * height) / 400000;

  if (s.dust > 0) {
    const specks = Math.round(s.dust * 42 * area * (0.6 + Math.random() * 0.8));
    for (let i = 0; i < specks; i++) {
      const light = Math.random() < 0.3;
      drawSpeck(
        ctx,
        Math.random() * width,
        Math.random() * height,
        0.6 + Math.random() ** 2.5 * 3.4,
        light ? '255, 250, 240' : '18, 14, 10',
        0.6 + Math.random() * 0.35,
      );
    }
    const hairs =
      Math.random() < s.dust * 0.7
        ? 1 + Math.floor(Math.random() * s.dust * 2.4)
        : 0;
    for (let i = 0; i < hairs; i++) drawHair(ctx, width, height);
  }

  if (step) {
    if (scratchList.length < 3 && Math.random() < s.scratches * 0.06) {
      scratchList.push({
        x: Math.random() * width,
        age: 0,
        life: 0.6 + Math.random() * 2.6,
        weight: 0.6 + Math.random() * 0.8,
        light: Math.random() < 0.7,
        phase: Math.random() * TAU,
      });
    }
    for (let i = scratchList.length - 1; i >= 0; i--) {
      const scratch = scratchList[i]!;
      scratch.age += step;
      scratch.x += (Math.random() - 0.5) * 1.2;
      if (scratch.age >= scratch.life) scratchList.splice(i, 1);
    }
  }
  for (const scratch of scratchList) {
    const fade = Math.min(
      1,
      scratch.age / 0.15,
      (scratch.life - scratch.age) / 0.3,
    );
    const alpha = (0.25 + Math.random() * 0.35) * fade;
    ctx.strokeStyle = scratch.light
      ? `rgba(255, 252, 245, ${alpha})`
      : `rgba(14, 11, 8, ${alpha})`;
    ctx.lineWidth = scratch.weight;
    ctx.beginPath();
    for (let y = 0; y <= height; y += 24) {
      const x = scratch.x + Math.sin(y * 0.012 + scratch.phase) * 1.4;
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
