import type { BellToggleSize, BellToggleSizePreset } from './types';

export const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
const SEG_EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';
const WARP = 0.6;

export const SIZES: Record<BellToggleSize, BellToggleSizePreset> = {
  sm: [36, 12.5, 14, 15, 8],
  md: [44, 13.5, 16, 19, 9],
  lg: [52, 15, 18, 23, 10],
};
export const WOBBLE = { amplitude: 0.4, passes: 3, duration: 420 };
export const BELL_BODY = 'M6 16.5V10a6 6 0 0 1 12 0v6.5l1.6 2.3H4.4L6 16.5z';

/** Time offset (0–1) of swing pass `k`; passes bunch up toward the end. */
export function passOffset(k: number, passes: number): number {
  return 1 - Math.pow(1 - (k + 2 / 3) / (passes + 1), WARP);
}

/** Decaying alternating rotation keyframes starting from the live angle. */
export function ringKeyframes(
  from: number,
  amplitude: number,
  passes: number,
  decay: number,
): Keyframe[] {
  const frames: Keyframe[] = [
    { transform: `rotate(${from}deg)`, offset: 0, easing: SEG_EASE },
  ];
  for (let k = 0; k < passes; k++) {
    const angle =
      amplitude * Math.pow(1 - k / passes, decay) * (k % 2 ? 1 : -1);
    frames.push({
      transform: `rotate(${angle.toFixed(2)}deg)`,
      offset: passOffset(k, passes),
      easing: SEG_EASE,
    });
  }
  frames.push({ transform: 'rotate(0deg)', offset: 1 });
  return frames;
}

/** Current rotation of an element in degrees, read from its computed transform. */
export function liveAngle(el: Element): number {
  const tf = getComputedStyle(el).transform;
  if (!tf || tf === 'none') return 0;
  const m = new DOMMatrix(tf);
  return (Math.atan2(m.b, m.a) * 180) / Math.PI;
}
