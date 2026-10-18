import type { SpringCheckReadings } from './types';

const RULE_END = 0.84;
const SWELL = 0.35;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Damping ratio for a target overshoot fraction. */
function zetaOf(bounce: number): number {
  if (bounce <= 0) return 1;
  const log = Math.log(bounce);
  return -log / Math.sqrt(Math.PI ** 2 + log ** 2);
}

/** Converts the "overshoot" bounce prop into motion's spring `bounce` option. */
export function springBounce(bounce: number): number {
  return 1 - zetaOf(bounce);
}

/**
 * Maps one spring value onto every part of the row: the fill grows from the
 * center, the box swells past 1, the tick draws, the word fades and the rule wipes.
 */
export function readings(
  t: number,
  doneOpacity: number,
  strikeLag: number,
): SpringCheckReadings {
  const held = clamp01(t);
  return {
    fill: `scale(${Math.max(t, 0)})`,
    box: `scale(${1 + SWELL * Math.max(0, t - 1)})`,
    tick: 1 - held,
    word: 1 - (1 - doneOpacity) * held,
    rule: `scaleX(${clamp01((held - strikeLag) / (RULE_END - strikeLag))})`,
  };
}
