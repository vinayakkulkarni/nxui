import type { FlippingWordSwapLayer, FlippingWordSwapTiming } from './types';

const FLIP_ANGLE = 82;

const graphemeSegmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

export function segmentCharacters(text: string): string[] {
  if (!graphemeSegmenter) return Array.from(text);
  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
}

export function resolveTiming(
  durationMs: number,
  staggerMs: number,
  firstCount: number,
  secondCount: number,
  reduced: boolean,
): FlippingWordSwapTiming {
  const duration = reduced ? 0 : Math.max(180, durationMs) / 1000;
  const stagger = reduced ? 0 : Math.max(0, staggerMs) / 1000;
  const offset = duration * 0.62;
  const firstEnd = duration + Math.max(0, firstCount - 1) * stagger;
  const secondEnd = offset + duration + Math.max(0, secondCount - 1) * stagger;
  return { duration, stagger, offset, total: Math.max(firstEnd, secondEnd) };
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

/** GSAP `power2.in` (cubic). */
function easeIn(t: number) {
  return t * t * t;
}

/** GSAP `power2.out` (cubic). */
function easeOut(t: number) {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

function localProgress(
  playhead: number,
  start: number,
  timing: FlippingWordSwapTiming,
) {
  if (timing.duration <= 0) return playhead > start ? 1 : 0;
  return clamp01((playhead - start) / timing.duration);
}

export function characterStyle(
  layer: FlippingWordSwapLayer,
  index: number,
  playhead: number,
  timing: FlippingWordSwapTiming,
): Record<string, string> {
  if (layer === 'first') {
    const p = easeIn(localProgress(playhead, index * timing.stagger, timing));
    return {
      transform: `rotateX(${(FLIP_ANGLE * p).toFixed(3)}deg)`,
      opacity: (1 - p).toFixed(4),
      transformOrigin: 'center top',
    };
  }
  const p = easeOut(
    localProgress(playhead, timing.offset + index * timing.stagger, timing),
  );
  return {
    transform: `rotateX(${(-FLIP_ANGLE * (1 - p)).toFixed(3)}deg)`,
    opacity: p.toFixed(4),
    transformOrigin: 'center bottom',
  };
}
