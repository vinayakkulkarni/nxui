import type { ScrollRevealEffect } from './types';

export const SCRUB_SPAN = 0.5;
export const RISE_MASK = 'inset(-1em -1em -0.15em -1em)';

export interface RevealLook {
  effect: ScrollRevealEffect;
  masked: boolean;
  baseOpacity: number;
  blur: number;
  offset: number;
  highlightColor: string;
}

export const clamp01 = (value: number): number =>
  Math.min(Math.max(value, 0), 1);
const smooth = (value: number): number => value * value * (3 - 2 * value);
const easeOut = (value: number): number => 1 - Math.pow(1 - value, 3);
const easeBack = (value: number, overshoot: number): number => {
  const shifted = value - 1;
  return (
    1 +
    (overshoot + 1) * shifted * shifted * shifted +
    overshoot * shifted * shifted
  );
};
const glowAt = (t: number): number =>
  t <= 0 || t >= 1
    ? 0
    : t < 0.35
      ? smooth(t / 0.35)
      : 1 - smooth((t - 0.35) / 0.65);

export function paintPiece(piece: HTMLElement, t: number, look: RevealLook) {
  let reveal = t;
  let fadeIn = t;
  let motion = '';
  if (look.effect === 'rise') {
    reveal = easeOut(t);
    fadeIn = clamp01(reveal * 1.25);
    if (reveal < 1) {
      motion = look.masked
        ? `translateY(${((1 - reveal) * 100).toFixed(2)}%) translateY(${((1 - reveal) * 0.2).toFixed(3)}em)`
        : `translateY(${((1 - reveal) * 0.8).toFixed(3)}em)`;
    }
  } else if (look.effect === 'flip') {
    reveal = easeBack(t, 1.2);
    fadeIn = clamp01(t * 2);
    if (t < 1) {
      motion = `perspective(6em) rotateX(${((1 - reveal) * 90).toFixed(2)}deg)`;
    }
  } else if (look.effect === 'scale') {
    reveal = easeBack(t, 1.6);
    fadeIn = clamp01(t * 1.6);
    if (t < 1) motion = `scale(${(0.35 + 0.65 * reveal).toFixed(4)})`;
  }
  if (look.highlightColor) fadeIn = Math.max(fadeIn, clamp01(t / 0.35));
  const settle = clamp01(reveal);
  const lift = look.offset * (1 - settle);
  piece.style.opacity =
    t >= 1
      ? ''
      : (look.baseOpacity + (1 - look.baseOpacity) * fadeIn).toFixed(3);
  piece.style.transform = [
    lift ? `translateY(${lift.toFixed(2)}px)` : '',
    motion,
  ]
    .filter(Boolean)
    .join(' ');
  piece.style.filter =
    look.blur && settle < 1
      ? `blur(${(look.blur * (1 - settle)).toFixed(2)}px)`
      : '';
  if (look.highlightColor) {
    const glow = glowAt(t);
    piece.style.color =
      glow > 0.002
        ? `color-mix(in srgb, ${look.highlightColor} ${(glow * 100).toFixed(1)}%, currentColor)`
        : '';
  }
}

export function resetPiece(piece: HTMLElement) {
  piece.style.opacity = '';
  piece.style.transform = '';
  piece.style.transformOrigin = '';
  piece.style.filter = '';
  piece.style.color = '';
  piece.style.willChange = '';
}

/** Geometry of the trigger inside its scroller, in scroll coordinates. */
export interface ScrollGeometry {
  /** Trigger top in scroll coordinates (px). */
  top: number;
  /** Trigger height (px). */
  height: number;
  /** Scroller viewport height (px). */
  view: number;
  /** Current scroll offset (px). */
  scroll: number;
  /** Largest reachable scroll offset (px). */
  maxScroll: number;
}

function edgeOffset(token: string, size: number): number {
  const match = /^([a-z]+|-?[\d.]+%?(?:px)?)((?:[+-]=-?[\d.]+(?:px)?)?)$/.exec(
    token,
  );
  if (!match) return 0;
  const [, base = '', shift = ''] = match;
  let value: number;
  if (base === 'top' || base === 'left') value = 0;
  else if (base === 'center') value = size / 2;
  else if (base === 'bottom' || base === 'right') value = size;
  else if (base.endsWith('%')) value = (Number.parseFloat(base) / 100) * size;
  else value = Number.parseFloat(base) || 0;
  if (shift) {
    const amount = Number.parseFloat(shift.slice(2)) || 0;
    value += shift.startsWith('+') ? amount : -amount;
  }
  return value;
}

/**
 * Resolves a ScrollTrigger-style position ("top bottom", "bottom 80%",
 * "center center+=100", "+=300", "clamp(bottom bottom)") to a scroll offset.
 */
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
