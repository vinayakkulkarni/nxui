import type {
  TextLoopFadeStop,
  TextLoopScaleTween as ScaleTween,
  TextLoopShape,
} from './types';

export const VIEW_W = 1200;
export const VIEW_H = 520;
export const CX = VIEW_W / 2;
export const CY = VIEW_H / 2;
export const MAX_FLING = 2600;
export const MAX_BOOST = 1600;

const EDGE_PAD = 6;
const FADE_STEPS = 8;

const smootherstep = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const wrap = (v: number, length: number): number =>
  ((v % length) + length) % length;

export function circleRadius(curviness: number, ribbonWidth: number): number {
  return Math.min(
    90 + Math.max(0, curviness) * 0.95,
    Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD),
  );
}

export function buildPath(
  shape: TextLoopShape,
  curviness: number,
  ribbonWidth: number,
  mirrored = false,
): string {
  const c = Math.max(0, curviness);
  const room = Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);
  const flip = mirrored ? -1 : 1;

  switch (shape) {
    case 'circle': {
      const r = circleRadius(curviness, ribbonWidth);
      if (mirrored) {
        const rx = r * 1.22;
        const ry = r * 0.42;
        return `M ${CX - rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX + rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX - rx} ${CY} Z`;
      }
      return `M ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} Z`;
    }
    case 'infinity': {
      const r = 150 + c * 1.4;
      const h = Math.min(60 + c * 0.95, room);
      return [
        `M ${CX} ${CY}`,
        `C ${CX + r * 0.55} ${CY - h} ${CX + r} ${CY - h} ${CX + r} ${CY}`,
        `C ${CX + r} ${CY + h} ${CX + r * 0.55} ${CY + h} ${CX} ${CY}`,
        `C ${CX - r * 0.55} ${CY - h} ${CX - r} ${CY - h} ${CX - r} ${CY}`,
        `C ${CX - r} ${CY + h} ${CX - r * 0.55} ${CY + h} ${CX} ${CY}`,
        'Z',
      ].join(' ');
    }
    case 'arch': {
      const rise = Math.min(120 + c * 1.1, room * 2) * flip;
      return `M 120 ${CY + rise / 2} Q ${CX} ${CY - rise * 1.5} ${VIEW_W - 120} ${CY + rise / 2}`;
    }
    case 'line':
      return `M -320 ${CY} L ${VIEW_W + 320} ${CY}`;
    case 'wave':
    default: {
      const a = Math.min(c * 2.2, room * 2) * flip;
      return `M -320 ${CY} Q -160 ${CY - a} 0 ${CY} T 320 ${CY} T 640 ${CY} T 960 ${CY} T 1280 ${CY} T ${VIEW_W + 320} ${CY}`;
    }
  }
}

export function buildFade(edgeFade: number): TextLoopFadeStop[] {
  const width = Math.min(1, Math.max(0, edgeFade)) * 0.3;
  if (width <= 0) return [];
  const stops: TextLoopFadeStop[] = [];
  for (let i = 0; i <= FADE_STEPS; i++) {
    const t = i / FADE_STEPS;
    stops.push({ offset: t * width, opacity: smootherstep(t) });
  }
  for (let i = FADE_STEPS; i >= 0; i--) {
    const t = i / FADE_STEPS;
    stops.push({ offset: 1 - t * width, opacity: smootherstep(t) });
  }
  return stops;
}

function parseHex(value: string | undefined): number[] | null {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(String(value ?? '').trim());
  if (!match?.[1]) return null;
  const raw = match[1];
  const hex = raw.length === 3 ? raw.replace(/./g, (ch) => ch + ch) : raw;
  return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}

/** Mixes a hex color toward white by `amount` (0–1). */
export function tint(color: string, amount: number): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  return `#${rgb
    .map((v) =>
      Math.round(v + (255 - v) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Picks near-black or white ink for legible text on `color`. */
export function inkOn(color: string): string {
  const rgb = parseHex(color);
  if (!rgb) return '#ffffff';
  const [r = 0, g = 0, b = 0] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.2 ? '#120f17' : '#ffffff';
}

// GSAP's power2 is a cubic curve.
const easePower2Out = (t: number): number => 1 - (1 - t) ** 3;
const easePower2InOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export function createScaleTween(): ScaleTween {
  return { from: 1, to: 1, start: 0, duration: 0, ease: easePower2Out };
}

export function tweenValue(tween: ScaleTween, now: number): number {
  if (tween.duration <= 0) return tween.to;
  const t = clamp((now - tween.start) / tween.duration, 0, 1);
  return tween.from + (tween.to - tween.from) * tween.ease(t);
}

export function glideTween(tween: ScaleTween, hovered: boolean, now: number) {
  tween.from = tweenValue(tween, now);
  tween.to = hovered ? 0 : 1;
  tween.start = now;
  tween.duration = hovered ? 600 : 900;
  tween.ease = hovered ? easePower2Out : easePower2InOut;
}
