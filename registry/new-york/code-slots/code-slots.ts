export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
export const WASH_IN = 0.3;
export const WASH_OUT = 0.2;
export const SINK_DELAY = 0.06;
export const SINK_STEP = 0.03;
export const CHECK_DELAY = 0.28;
export const CHECK_RISE = 8;
export const SINK_FADE = 0.6;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const digitsOf = (raw: string | undefined) =>
  String(raw ?? '').replace(/\D/g, '');

export function toSlots(raw: string | undefined, n: number): string[] {
  const d = digitsOf(raw).slice(0, n);
  return Array.from({ length: n }, (_, i) => d[i] ?? '');
}

export function firstEmptyOf(slots: string[]): number {
  const i = slots.indexOf('');
  return i === -1 ? slots.length - 1 : i;
}

export const isFull = (slots: string[]) => slots.every(Boolean);
