import type { LiquidEtherProps, LiquidEtherSettings } from './types';

export const PIXEL_BUDGET = 2.4e6;
export const MAX_CELLS = 140000;
export const PRESSURE_STEPS = 32;
export const PALETTE_SIZE = 256;

export const DEFAULT_COLORS = ['#5227FF', '#FF9FFC', '#B497CF'];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Per-step velocity decay; a half-life that grows with persistence. */
export function keepFor(persistence: number, dt: number): number {
  return Math.pow(0.5, dt / (0.35 + persistence * persistence * 12));
}

function parseColor(
  value: string | undefined,
): [number, number, number] | null {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex?.[1]) {
    const digits = hex[1];
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
  return null;
}

function toLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** 256×1 RGBA ramp from slow to fast, smoothstepped between stops in linear light. */
export function buildPalette(colors: string[]): Uint8Array {
  const stops: [number, number, number][] = [];
  for (const color of colors) {
    const parsed = parseColor(color);
    if (parsed) stops.push(parsed);
  }
  if (!stops.length) stops.push([1, 1, 1]);
  const values = stops.map((color) => color.map(toLinear));
  const data = new Uint8Array(PALETTE_SIZE * 4);
  for (let index = 0; index < PALETTE_SIZE; index++) {
    const t = clamp(
      (index / (PALETTE_SIZE - 1)) * values.length - 0.5,
      0,
      values.length - 1,
    );
    const from = Math.min(Math.floor(t), Math.max(values.length - 2, 0));
    const to = Math.min(from + 1, values.length - 1);
    const k = t - from;
    const eased = k * k * (3 - 2 * k);
    const a = values[from]!;
    const b = values[to]!;
    for (let channel = 0; channel < 3; channel++) {
      const start = a[channel] ?? 0;
      const value = start + ((b[channel] ?? 0) - start) * eased;
      data[index * 4 + channel] = Math.round(clamp(value, 0, 1) * 255);
    }
    data[index * 4 + 3] = 255;
  }
  return data;
}

export function resolveSettings(
  props: Required<Omit<LiquidEtherProps, 'class'>>,
): LiquidEtherSettings {
  const palette = props.colors;
  const background =
    props.backgroundColor === 'transparent'
      ? null
      : parseColor(props.backgroundColor);
  return {
    colors: palette,
    paletteKey: palette.join(','),
    intensity: Math.max(0, props.intensity),
    force: Math.max(0, props.mouseForce),
    radius: clamp(props.cursorSize, 4, 600),
    persistence: clamp(props.persistence, 0, 1),
    viscosity: clamp(props.viscosity, 0, 1),
    resolution: clamp(props.resolution, 0.05, 1),
    walls: props.bounceEdges,
    clickBurst: props.clickBurst,
    autoDemo: props.autoDemo,
    autoSpeed: Math.max(0, props.autoSpeed),
    autoIntensity: Math.max(0, props.autoIntensity),
    autoResumeDelay: Math.max(0, props.autoResumeDelay),
    intro: props.intro,
    light: props.lightMode,
    background: background ? [...background, 1] : [0, 0, 0, 0],
    maxRatio: clamp(props.maxDevicePixelRatio, 0.5, 3),
  };
}
