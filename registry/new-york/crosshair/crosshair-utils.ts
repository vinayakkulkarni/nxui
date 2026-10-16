import type {
  CrosshairInk,
  CrosshairLineStyle,
  CrosshairTargetEffect,
} from './types';

export const LINE_STYLES: CrosshairLineStyle[] = ['solid', 'dashed', 'dotted'];
export const EFFECTS: CrosshairTargetEffect[] = ['lock', 'glitch', 'none'];
export const FONT =
  '500 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
export const HIDDEN = 'crosshair-cursor-hidden';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Resolves any CSS color to RGBA through the canvas color parser. */
export function toRgb(
  ctx: CanvasRenderingContext2D,
  color: string,
): CrosshairInk {
  ctx.fillStyle = '#000';
  ctx.fillStyle = color;
  const value = String(ctx.fillStyle);
  if (value.startsWith('#')) {
    const hex = Number.parseInt(value.slice(1, 7), 16);
    return { r: (hex >> 16) & 255, g: (hex >> 8) & 255, b: hex & 255, a: 1 };
  }
  const parts = value.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255, 1];
  return {
    r: parts[0] ?? 255,
    g: parts[1] ?? 255,
    b: parts[2] ?? 255,
    a: parts[3] ?? 1,
  };
}
