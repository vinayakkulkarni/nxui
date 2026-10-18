import type { StaggeredMenuEase } from './types';

/** GSAP ease equivalents as cubic-bezier control points. */
export const EASE: Record<
  'power2Out' | 'power3Out' | 'power3In' | 'power3InOut' | 'power4Out',
  StaggeredMenuEase
> = {
  power2Out: [0.25, 0.46, 0.45, 0.94],
  power3Out: [0.215, 0.61, 0.355, 1],
  power3In: [0.55, 0.055, 0.675, 0.19],
  power3InOut: [0.645, 0.045, 0.355, 1],
  power4Out: [0.165, 0.84, 0.44, 1],
};

export const ITEM_HIDDEN = 'translateY(140%) rotate(10deg)';
export const ITEM_SHOWN = 'translateY(0%) rotate(0deg)';
export const SOCIAL_HIDDEN = 'translateY(25px)';
export const SOCIAL_SHOWN = 'translateY(0px)';

export function offscreenTransform(position: 'left' | 'right'): string {
  return `translateX(${position === 'left' ? -100 : 100}%)`;
}

/** Underlay colors: up to four, dropping the middle one when there are 3+. */
export function layerColors(colors: string[]): string[] {
  const raw = colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c'];
  const layers = [...raw];
  if (layers.length >= 3) layers.splice(Math.floor(layers.length / 2), 1);
  return layers;
}

/** Label sequence that rolls through the toggle text a few times. */
export function labelSequence(opening: boolean): string[] {
  const current = opening ? 'Menu' : 'Close';
  const target = opening ? 'Close' : 'Menu';
  const sequence = [current];
  let last = current;
  for (let i = 0; i < 3; i++) {
    last = last === 'Menu' ? 'Close' : 'Menu';
    sequence.push(last);
  }
  if (last !== target) sequence.push(target);
  sequence.push(target);
  return sequence;
}
