import type {
  DitheredGrayscaleResult,
  DitheredDitherConfig,
  DitheredParticleSystem,
  DitheredRipple,
} from './types';

const RIPPLE_SPEED = 225;
const RIPPLE_WIDTH = 37;
const RIPPLE_FORCE = 20;
export const RIPPLE_DURATION = 675;
const CURSOR_RADIUS = 100;
const CURSOR_RADIUS_SQ = CURSOR_RADIUS * CURSOR_RADIUS;
const CURSOR_FORCE = 40;
const LERP_FACTOR = 0.12;
const SNAP_THRESHOLD = 0.01;

export function toGrayscaleGrid(
  img: HTMLImageElement,
  maxDim: number,
  contrast: number,
  gamma: number,
  blur: number,
): DitheredGrayscaleResult {
  const aspect = img.naturalWidth / img.naturalHeight;
  const outW = aspect >= 1 ? maxDim : Math.round(maxDim * aspect);
  const outH = aspect >= 1 ? Math.round(maxDim / aspect) : maxDim;
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = outW;
  alphaCanvas.height = outH;
  const alphaCtx = alphaCanvas.getContext('2d');
  if (!alphaCtx) {
    throw new Error('DitheredLogo: unable to create alpha canvas context.');
  }
  alphaCtx.imageSmoothingEnabled = true;
  alphaCtx.imageSmoothingQuality = 'high';
  alphaCtx.drawImage(img, 0, 0, outW, outH);
  const alphaData = alphaCtx.getImageData(0, 0, outW, outH).data;

  const pad = Math.ceil(blur * 3);
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW + pad * 2;
  srcCanvas.height = srcH + pad * 2;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) {
    throw new Error('DitheredLogo: unable to create source canvas context.');
  }
  if (blur > 0) srcCtx.filter = `blur(${blur}px)`;
  srcCtx.drawImage(img, pad, pad, srcW, srcH);
  srcCtx.filter = 'none';

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error(
      'DitheredLogo: unable to create processing canvas context.',
    );
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, pad, pad, srcW, srcH, 0, 0, outW, outH);

  const pixels = ctx.getImageData(0, 0, outW, outH).data;
  const grayscale = new Uint8Array(outW * outH);
  const alpha = new Uint8Array(outW * outH);
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const idx = (y * outW + x) * 4;
      const blurAlpha = pixels[idx + 3]! / 255;
      alpha[y * outW + x] = alphaData[idx + 3]!;

      let luma =
        blurAlpha > 0.01
          ? (0.299 * pixels[idx]! +
              0.587 * pixels[idx + 1]! +
              0.114 * pixels[idx + 2]!) /
            blurAlpha
          : 0;

      if (contrast !== 0) luma = cFactor * (luma - 128) + 128;
      if (gamma !== 1) {
        luma = 255 * Math.pow(Math.max(0, luma / 255), 1 / gamma);
      }

      grayscale[y * outW + x] = Math.max(0, Math.min(255, Math.round(luma)));
    }
  }

  return { grayscale, alpha, width: outW, height: outH };
}

export function errorDiffusionDither(
  grayscale: Uint8Array,
  width: number,
  height: number,
  config: DitheredDitherConfig,
  alpha: Uint8Array,
): Float32Array {
  const errors = new Float32Array(width * height);
  for (let i = 0; i < grayscale.length; i++) errors[i] = grayscale[i]!;

  const positions: number[] = [];
  const strength = config.diffusionStrength;

  for (let y = 0; y < height; y++) {
    const ltr = !config.serpentine || y % 2 === 0;
    const startX = ltr ? 0 : width - 1;
    const endX = ltr ? width : -1;
    const step = ltr ? 1 : -1;

    for (let x = startX; x !== endX; x += step) {
      const idx = y * width + x;
      if (alpha[idx]! < 128) continue;

      const oldVal = errors[idx]!;
      const newVal = oldVal > config.threshold ? 255 : 0;
      const err = (oldVal - newVal) * strength;

      if (newVal > 0) positions.push(x, y);

      const spread = (nx: number, ny: number, weight: number): void => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const ni = ny * width + nx;
        if (alpha[ni]! < 128) return;
        errors[ni] = errors[ni]! + err * weight;
      };

      spread(x + step, y, 7 / 16);
      spread(x - step, y + 1, 3 / 16);
      spread(x, y + 1, 5 / 16);
      spread(x + step, y + 1, 1 / 16);
    }
  }

  return new Float32Array(positions);
}

export function fetchImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function buildRoundedMask(
  w: number,
  h: number,
  radiusPct: number,
): Set<number> {
  const r = Math.round(radiusPct * Math.min(w, h));
  const mask = new Set<number>();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside: boolean;
      if (x >= r && x < w - r) {
        inside = true;
      } else if (y >= r && y < h - r) {
        inside = true;
      } else {
        const cx = x < r ? r : w - r - 1;
        const cy = y < r ? r : h - r - 1;
        const dx = x - cx;
        const dy = y - cy;
        inside = dx * dx + dy * dy <= r * r;
      }
      if (inside) mask.add(y * w + x);
    }
  }

  return mask;
}

export function applyMaskInversion(
  positions: Float32Array,
  gridW: number,
  gridH: number,
  radiusPct: number,
  alpha: Uint8Array,
): Float32Array {
  const mask = buildRoundedMask(gridW, gridH, radiusPct);
  const filled = new Set<number>();

  for (let i = 0; i < positions.length; i += 2) {
    filled.add(
      Math.round(positions[i + 1]!) * gridW + Math.round(positions[i]!),
    );
  }

  const result: number[] = [];
  for (const idx of mask) {
    if (!filled.has(idx)) {
      if (alpha[idx]! < 128) continue;
      result.push(idx % gridW, Math.floor(idx / gridW));
    }
  }

  return new Float32Array(result);
}

export function initParticles(
  points: Float32Array,
  scaleFactor: number,
  dotScale: number,
  originX: number,
  originY: number,
): DitheredParticleSystem {
  const count = points.length / 2;
  const baseX = new Float32Array(count);
  const baseY = new Float32Array(count);
  const offsetX = new Float32Array(count);
  const offsetY = new Float32Array(count);
  const brightness = new Float32Array(count);
  const tint = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    baseX[i] = originX + points[i * 2]! * scaleFactor;
    baseY[i] = originY + points[i * 2 + 1]! * scaleFactor;
    brightness[i] = 1;
    tint[i] = 1;
  }

  return {
    count,
    baseX,
    baseY,
    offsetX,
    offsetY,
    brightness,
    tint,
    size: scaleFactor * dotScale,
  };
}

export function stepParticles(
  sys: DitheredParticleSystem,
  cursorX: number,
  cursorY: number,
  cursorActive: boolean,
  ripples: DitheredRipple[],
  now: number,
): boolean {
  const { count, baseX, baseY, offsetX, offsetY } = sys;

  for (let k = ripples.length - 1; k >= 0; k--) {
    if (now - ripples[k]!.start >= RIPPLE_DURATION) ripples.splice(k, 1);
  }

  const numRipples = ripples.length;
  const rippleMul = numRipples > 0 ? 1 + 0.5 * (numRipples - 1) : 0;
  let hasMotion = false;

  for (let i = 0; i < count; i++) {
    let fx = 0;
    let fy = 0;

    if (cursorActive) {
      const vx = baseX[i]! + offsetX[i]! - cursorX;
      const vy = baseY[i]! + offsetY[i]! - cursorY;
      const d2 = vx * vx + vy * vy;
      if (d2 > 0.1 && d2 < CURSOR_RADIUS_SQ) {
        const d = Math.sqrt(d2);
        const f = (1 - d / CURSOR_RADIUS) ** 3 * CURSOR_FORCE;
        fx += (vx / d) * f;
        fy += (vy / d) * f;
      }
    }

    for (let k = 0; k < numRipples; k++) {
      const ripple = ripples[k]!;
      const elapsed = now - ripple.start;
      const radius = (elapsed / 1000) * RIPPLE_SPEED;
      const life = 1 - elapsed / RIPPLE_DURATION;
      const sx = baseX[i]! - ripple.x;
      const sy = baseY[i]! - ripple.y;
      const d = Math.sqrt(sx * sx + sy * sy);
      if (d < 0.1) continue;
      const band = Math.abs(d - radius);
      if (band < RIPPLE_WIDTH) {
        const wf = (1 - band / RIPPLE_WIDTH) * life * RIPPLE_FORCE * rippleMul;
        fx += (sx / d) * wf;
        fy += (sy / d) * wf;
      }
    }

    offsetX[i] = offsetX[i]! + (fx - offsetX[i]!) * LERP_FACTOR;
    offsetY[i] = offsetY[i]! + (fy - offsetY[i]!) * LERP_FACTOR;
    if (Math.abs(offsetX[i]!) < SNAP_THRESHOLD) offsetX[i] = 0;
    if (Math.abs(offsetY[i]!) < SNAP_THRESHOLD) offsetY[i] = 0;
    if (offsetX[i] !== 0 || offsetY[i] !== 0) hasMotion = true;
  }

  return hasMotion || numRipples > 0 || cursorActive;
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  sys: DitheredParticleSystem,
  particleColor: string,
  canvasW: number,
  canvasH: number,
  dpr: number,
): void {
  ctx.clearRect(0, 0, canvasW * dpr, canvasH * dpr);

  const buckets: number[][] = new Array(126);
  for (let i = 0; i < 126; i++) buckets[i] = [];

  for (let i = 0; i < sys.count; i++) {
    const bucket =
      6 * Math.round(20 * sys.brightness[i]!) + Math.round(5 * sys.tint[i]!);
    buckets[Math.max(0, Math.min(125, bucket))]!.push(i);
  }

  const size = sys.size * dpr;
  const pad = 0.25 * dpr;
  const padSize = 0.5 * dpr;

  for (let z = 0; z < 126; z++) {
    const ids = buckets[z]!;
    if (ids.length === 0) continue;
    const alpha = Math.floor(z / 6) / 20;
    ctx.fillStyle = particleColor;
    ctx.globalAlpha = alpha;

    for (let j = 0; j < ids.length; j++) {
      const i = ids[j]!;
      const rx = (sys.baseX[i]! + sys.offsetX[i]!) * dpr;
      const ry = (sys.baseY[i]! + sys.offsetY[i]!) * dpr;
      ctx.fillRect(rx - pad, ry - pad, size + padSize, size + padSize);
    }
  }

  ctx.globalAlpha = 1;
}
