import type {
  ScrollFloatEaseFn,
  ScrollFloatEffect,
  ScrollFloatOrder,
} from './types';

export const clamp01 = (value: number): number =>
  Math.min(Math.max(value, 0), 1);

const smoothstep = (from: number, to: number, value: number): number => {
  const k = clamp01((value - from) / (to - from));
  return k * k * (3 - 2 * k);
};

const seeded = (index: number, salt: number): number => {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

export function getDelays(
  count: number,
  order: ScrollFloatOrder,
  stagger: number,
): number[] {
  const middle = (count - 1) / 2;
  const ranks = Array.from({ length: count }, (_, index) => {
    if (order === 'end') return count - 1 - index;
    if (order === 'center') return Math.abs(index - middle);
    if (order === 'edges') return middle - Math.abs(index - middle);
    return index;
  });
  if (order === 'random') {
    const shuffled = ranks
      .map((_, index) => index)
      .sort((a, b) => seeded(a, 9) - seeded(b, 9));
    shuffled.forEach((target, rank) => {
      ranks[target] = rank;
    });
  }
  const first = count ? Math.min(...ranks) : 0;
  return ranks.map((rank) => (rank - first) * Math.max(0, stagger));
}

export interface FloatLook {
  effect: ScrollFloatEffect;
  sign: number;
  reach: number;
  stretch: number;
  squeeze: number;
  /** Font size of the text in px. */
  size: number;
  count: number;
  colorShift: boolean;
  ease: ScrollFloatEaseFn;
}

/** Paints one piece at linear tween progress `q` (0 = from, 1 = to). */
export function paintFloat(
  piece: HTMLElement,
  index: number,
  q: number,
  look: FloatLook,
) {
  const e = look.ease(q);
  const timing = clamp01(e);
  const { sign, reach, size } = look;
  const middle = (look.count - 1) / 2;
  const edge = middle > 0 ? (index - middle) / middle : 0;
  let opacity: number;
  let x = 0;
  let y = 0;
  let yPercent = 0;
  let rotate = 0;
  let rotateX = 0;
  let scaleX = 1;
  let scaleY = 1;
  let blur = 0;
  let perspective = 0;

  if (look.effect === 'flip') {
    rotateX = -90 * sign * (1 - e);
    perspective = size * 4;
    opacity = smoothstep(0.05, 0.55, timing);
  } else if (look.effect === 'scatter') {
    const sx = ((seeded(index, 1) * 2 - 1) * 1.3 - edge * 0.9) * size * reach;
    const sy = sign * (0.35 + seeded(index, 2)) * size * 1.1 * reach;
    const sr =
      (seeded(index, 3) < 0.5 ? -1 : 1) * (40 + seeded(index, 4) * 120);
    const ss = 0.35 + seeded(index, 5) * 0.9;
    x = lerp(sx, 0, e);
    y = lerp(sy, 0, e);
    rotate = lerp(sr, 0, e);
    scaleX = scaleY = lerp(ss, 1, e);
    opacity = smoothstep(0, 0.4, timing);
  } else if (look.effect === 'blur') {
    opacity = lerp(0, 1, e);
    y = lerp(sign * size * 0.3 * reach, 0, e);
    scaleX = scaleY = lerp(1.45, 1, e);
    blur = lerp(size * 0.2, 0, e);
  } else if (look.effect === 'wave') {
    const decay = Math.pow(1 - timing, 2.6);
    const swell = 1 - Math.cos(timing * Math.PI * 2.5) * decay;
    const sway = Math.sin(timing * Math.PI * 2.5) * decay;
    yPercent = lerp(120 * reach * sign, 0, swell);
    scaleY = lerp(look.stretch, 1, swell);
    scaleX = lerp(look.squeeze, 1, swell);
    rotate = -16 * sign * sway;
    opacity = clamp01(timing * 2.5);
  } else {
    opacity = lerp(0, 1, e);
    yPercent = lerp(120 * reach * sign, 0, e);
    scaleY = lerp(look.stretch, 1, e);
    scaleX = lerp(look.squeeze, 1, e);
  }

  const parts: string[] = [];
  if (perspective) parts.push(`perspective(${perspective.toFixed(2)}px)`);
  if (yPercent) parts.push(`translate(0%, ${yPercent.toFixed(3)}%)`);
  if (x || y) parts.push(`translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`);
  if (rotate) parts.push(`rotate(${rotate.toFixed(3)}deg)`);
  if (rotateX) parts.push(`rotateX(${rotateX.toFixed(3)}deg)`);
  if (scaleX !== 1 || scaleY !== 1) {
    parts.push(`scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`);
  }
  piece.style.transform = parts.join(' ');
  piece.style.opacity = opacity >= 1 ? '' : Math.max(0, opacity).toFixed(3);
  piece.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : '';
  if (look.colorShift) {
    piece.style.setProperty(
      '--scroll-float-mix',
      (1 - smoothstep(0.5, 1, timing)).toFixed(3),
    );
  }
}

export function preparePiece(piece: HTMLElement, look: FloatLook) {
  piece.style.willChange =
    look.effect === 'blur'
      ? 'opacity, transform, filter'
      : 'opacity, transform';
  if (look.effect === 'flip') {
    piece.style.transformOrigin = `50% 50% ${(-look.size * 0.55 * look.reach).toFixed(2)}px`;
    piece.style.backfaceVisibility = 'hidden';
  } else if (look.effect === 'float') {
    piece.style.transformOrigin = look.sign > 0 ? '50% 0%' : '50% 100%';
  } else if (look.effect === 'wave') {
    piece.style.transformOrigin = look.sign > 0 ? '50% 100%' : '50% 0%';
  } else {
    piece.style.transformOrigin = '50% 50%';
  }
}

export function resetPiece(piece: HTMLElement) {
  piece.style.transform = '';
  piece.style.opacity = '';
  piece.style.filter = '';
  piece.style.willChange = '';
  piece.style.transformOrigin = '';
  piece.style.backfaceVisibility = '';
  piece.style.removeProperty('--scroll-float-mix');
}

export interface ScrollGeometry {
  top: number;
  height: number;
  view: number;
  scroll: number;
  maxScroll: number;
}

function edgeOffset(token: string, size: number): number {
  const match =
    /^([a-z]+|-?[\d.]+%?(?:px)?)((?:[+-]=-?[\d.]+(?:%|px)?)?)$/.exec(token);
  if (!match) return 0;
  const [, base = '', shift = ''] = match;
  let value: number;
  if (base === 'top' || base === 'left') value = 0;
  else if (base === 'center') value = size / 2;
  else if (base === 'bottom' || base === 'right') value = size;
  else if (base.endsWith('%')) value = (Number.parseFloat(base) / 100) * size;
  else value = Number.parseFloat(base) || 0;
  if (shift) {
    const raw = shift.slice(2);
    let amount = Number.parseFloat(raw) || 0;
    if (raw.endsWith('%')) amount = (amount / 100) * size;
    value += shift.startsWith('+') ? amount : -amount;
  }
  return value;
}

/** Resolves a ScrollTrigger-style position ("center bottom+=50%", "clamp(bottom bottom-=40%)", "+=300"). */
export function resolvePosition(
  position: string,
  geo: ScrollGeometry,
  relativeTo = 0,
): number {
  let source = position.trim();
  let clamped = false;
  const clampMatch = /^clamp\((.*)\)$/.exec(source);
  if (clampMatch) {
    clamped = true;
    source = (clampMatch[1] ?? '').trim();
  }
  let value: number;
  if (/^[+-]=/.test(source)) {
    const amount = Number.parseFloat(source.slice(2)) || 0;
    value = relativeTo + (source.startsWith('+') ? amount : -amount);
  } else {
    const [triggerEdge = 'top', scrollerEdge = 'bottom'] = source.split(/\s+/);
    value =
      geo.top +
      edgeOffset(triggerEdge, geo.height) -
      edgeOffset(scrollerEdge, geo.view);
  }
  return clamped ? Math.min(Math.max(value, 0), geo.maxScroll) : value;
}

export function clampToScroll(position: string): string {
  return position.startsWith('clamp(') ? position : `clamp(${position})`;
}

export function progressBetween(
  scroll: number,
  start: number,
  end: number,
): number {
  if (end <= start) return scroll >= start ? 1 : 0;
  return clamp01((scroll - start) / (end - start));
}
