import type {
  TextPressureIdle,
  TextPressurePoint,
  TextPressureRipple,
} from './types';

export const RIPPLE_LIFE = 1.3;
export const MAX_RIPPLES = 6;
const WAVE_PERIOD = 3.2;
const PULSE_PERIOD = 2.8;
const PULSE_DEPTH = 0.42;

export const ROBOTO_FLEX_URL =
  'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap';

export function dist(a: TextPressurePoint, b: TextPressurePoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function getIdlePressure(
  mode: TextPressureIdle,
  position: number,
  clock: number,
  spread: number,
): number {
  if (mode === 'wave') {
    const crest =
      0.5 +
      0.5 * Math.cos(Math.PI * 2 * (position / spread - clock / WAVE_PERIOD));
    return crest * crest;
  }
  if (mode === 'pulse') {
    const lag = Math.abs(position - 0.5) * 0.4;
    const breath =
      0.5 - 0.5 * Math.cos(Math.PI * 2 * (clock / PULSE_PERIOD - lag));
    return PULSE_DEPTH * breath * breath * (3 - 2 * breath);
  }
  return 0;
}

export function getRipplePressure(
  ripples: TextPressureRipple[],
  point: TextPressurePoint,
  now: number,
  span: number,
): number {
  const band = Math.max(span * 0.14, 32);
  let total = 0;
  for (const ripple of ripples) {
    const age = (now - ripple.start) / 1000;
    if (age <= 0 || age >= RIPPLE_LIFE) continue;
    const offset = (dist(ripple, point) - age * span * 1.25) / band;
    if (offset <= -1 || offset >= 1) continue;
    const fade = 1 - age / RIPPLE_LIFE;
    const swell =
      (1 - offset * offset) ** 2 * fade * fade * Math.min(1, age / 0.06);
    total = 1 - (1 - total) * (1 - swell);
  }
  return total;
}
