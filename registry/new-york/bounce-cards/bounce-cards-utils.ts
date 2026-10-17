import type { BounceCardsImage, BounceCardsSlot } from './types';

export const BOUNCE_CARDS_PATTERN = [
  1, 0.5, -0.3, -1, 0.2, 0.75, -0.6, 0.35, -0.85, 0.1,
];

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseTransform(
  value: string | undefined,
): BounceCardsSlot | null {
  if (typeof value !== 'string') return null;
  const rotate = value.match(/rotate\(\s*(-?[\d.]+)deg\s*\)/);
  const translate = value.match(
    /translate\(\s*(-?[\d.]+)px(?:\s*,\s*(-?[\d.]+)px)?\s*\)/,
  );
  return {
    x: translate?.[1] ? Number(translate[1]) : 0,
    y: translate?.[2] ? Number(translate[2]) : 0,
    rotate: rotate?.[1] ? Number(rotate[1]) : 0,
  };
}

export function toCard(item: string | BounceCardsImage): BounceCardsImage {
  return typeof item === 'string'
    ? { src: item, alt: '' }
    : { src: item.src, alt: item.alt ?? '' };
}

export function springStep(
  value: number,
  velocity: number,
  target: number,
  stiffness: number,
  damping: number,
  dt: number,
): [number, number] {
  const next =
    velocity + ((target - value) * stiffness - velocity * damping) * dt;
  return [value + next * dt, next];
}
