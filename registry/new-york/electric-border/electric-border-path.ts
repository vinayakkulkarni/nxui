import type {
  ElectricBorderPath,
  ElectricBorderPoint,
  ElectricBorderRgb,
} from './types';

export const ARCS = 4;
export const PULSES = 3;
export const MARGIN = 64;
export const PIXEL_BUDGET = 3e6;
export const SURGE_SPEED = 560;
const HALF_PI = Math.PI / 2;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const FALLBACK: ElectricBorderRgb = [0.49, 0.98, 1];

export function parseColor(value: string | undefined): ElectricBorderRgb {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  const digits = hex?.[1];
  if (digits) {
    const full =
      digits.length === 3
        ? digits.replace(/./g, (digit) => digit + digit)
        : digits;
    return [
      Number.parseInt(full.slice(0, 2), 16) / 255,
      Number.parseInt(full.slice(2, 4), 16) / 255,
      Number.parseInt(full.slice(4, 6), 16) / 255,
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) {
    return [
      clamp(Number.parseFloat(rgb[1] ?? '0') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[2] ?? '0') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[3] ?? '0') / 255, 0, 1),
    ];
  }
  if (typeof document !== 'undefined') {
    const context = document.createElement('canvas').getContext('2d');
    if (context) {
      context.fillStyle = '#000000';
      context.fillStyle = text;
      const normal = String(context.fillStyle);
      if (normal !== '#000000' || /^(?:#0{3}|#0{6}|black)$/i.test(text))
        return parseColor(normal);
    }
  }
  return FALLBACK;
}

function roundBox(
  x: number,
  y: number,
  hx: number,
  hy: number,
  r: number,
): number {
  const qx = Math.abs(x) - (hx - r);
  const qy = Math.abs(y) - (hy - r);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    r
  );
}

/** Rounded-rect path, parameterised by arc length (with a widened virtual corner radius). */
export function pathOf(
  width: number,
  height: number,
  radius: number,
  offset: number,
): ElectricBorderPath {
  const hx = Math.max(1, width / 2 + offset);
  const hy = Math.max(1, height / 2 + offset);
  const r = clamp(radius + offset, 0, Math.min(hx, hy));
  const vr = Math.min(r + 48, Math.min(hx, hy));
  const ax = hx - vr;
  const ay = hy - vr;
  const quarter = ax + ay + HALF_PI * vr;
  return { hx, hy, r, vr, ax, ay, quarter, perimeter: quarter * 4 };
}

export function pointOn(
  path: ElectricBorderPath,
  s: number,
): ElectricBorderPoint {
  const { hx, hy, r, vr, ax, ay, quarter, perimeter } = path;
  const u = ((s % perimeter) + perimeter) % perimeter;
  const part = Math.min(3, Math.floor(u / quarter));
  const rest = u - part * quarter;
  const local = part % 2 ? quarter - rest : rest;
  let x: number;
  let y: number;
  if (local <= ax) {
    x = local;
    y = -hy;
  } else if (local <= ax + HALF_PI * vr) {
    const angle = vr > 0 ? (local - ax) / vr : 0;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    let low = 0;
    let high = vr + r + 2;
    for (let step = 0; step < 18; step++) {
      const mid = (low + high) / 2;
      if (roundBox(ax + dx * mid, -ay + dy * mid, hx, hy, r) < 0) low = mid;
      else high = mid;
    }
    x = ax + dx * low;
    y = -ay + dy * low;
  } else {
    x = hx;
    y = -ay + (local - ax - HALF_PI * vr);
  }
  const flipX = part >= 2 ? -1 : 1;
  const flipY = part === 1 || part === 2 ? -1 : 1;
  const px = x * flipX;
  const py = y * flipY;
  const nx =
    roundBox(px + 0.5, py, hx, hy, r) - roundBox(px - 0.5, py, hx, hy, r);
  const ny =
    roundBox(px, py + 0.5, hx, hy, r) - roundBox(px, py - 0.5, hx, hy, r);
  const length = Math.hypot(nx, ny) || 1;
  return { x: px, y: py, nx: nx / length, ny: ny / length };
}

export function nearestOn(
  path: ElectricBorderPath,
  x: number,
  y: number,
): number {
  const { ax, ay, vr, quarter } = path;
  const qx = Math.abs(x) - ax;
  const qy = Math.abs(y) - ay;
  let t: number;
  if (qx > 0 && qy > 0) t = ax + vr * Math.atan2(qx, qy);
  else if (qx > qy) t = ax + HALF_PI * vr + ay - Math.abs(y);
  else t = Math.abs(x);
  t = clamp(t, 0, quarter);
  if (x >= 0) return y < 0 ? t : 2 * quarter - t;
  return y < 0 ? 4 * quarter - t : 2 * quarter + t;
}
