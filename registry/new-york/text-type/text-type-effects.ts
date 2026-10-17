import type { TextTypeEffect, TextTypeEffectDefinition } from './types';

const NEIGHBORS: Record<string, string> = {
  a: 'qwsz',
  b: 'vghn',
  c: 'xdfv',
  d: 'serfcx',
  e: 'wsdr',
  f: 'drtgvc',
  g: 'ftyhbv',
  h: 'gyujnb',
  i: 'ujko',
  j: 'huikmn',
  k: 'jiolm',
  l: 'kop',
  m: 'njk',
  n: 'bhjm',
  o: 'iklp',
  p: 'ol',
  q: 'wa',
  r: 'edft',
  s: 'awedxz',
  t: 'rfgy',
  u: 'yhji',
  v: 'cfgb',
  w: 'qase',
  x: 'zsdc',
  y: 'tghu',
  z: 'asx',
  0: '9p',
  1: '2q',
  2: '13w',
  3: '24e',
  4: '35r',
  5: '46t',
  6: '57y',
  7: '68u',
  8: '79i',
  9: '80o',
};

export const TEXT_TYPE_EFFECTS: Partial<
  Record<TextTypeEffect, TextTypeEffectDefinition>
> = {
  fade: {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    options: { duration: 360, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
  },
  blur: {
    keyframes: [
      { opacity: 0, filter: 'blur(0.3em)' },
      { opacity: 1, filter: 'blur(0em)' },
    ],
    options: { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  },
  rise: {
    keyframes: [
      { opacity: 0, top: '0.6em' },
      { opacity: 1, top: '0em' },
    ],
    options: { duration: 480, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' },
  },
};

/** Splits text into user-perceived characters so emoji stay whole. */
export function graphemes(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    });
    return Array.from(segmenter.segment(value), (part) => part.segment);
  }
  return Array.from(value);
}

/** A key next to `char` on a QWERTY keyboard, or null for other characters. */
export function typoFor(char: string | undefined): string | null {
  if (!char) return null;
  const keys = NEIGHBORS[char.toLowerCase()];
  if (!keys) return null;
  const pick = keys[Math.floor(Math.random() * keys.length)] ?? keys[0] ?? '';
  return char === char.toLowerCase() ? pick : pick.toUpperCase();
}

/**
 * Soft blink keyframes. Mirrors the upstream timeline: hold for 0.7×,
 * fade out over 0.45×, stay hidden 0.4×, fade back in over 0.45×.
 */
export function blinkKeyframes(): Keyframe[] {
  const ease = 'cubic-bezier(0.37, 0, 0.63, 1)';
  return [
    { opacity: 1, offset: 0 },
    { opacity: 1, offset: 0.35, easing: ease },
    { opacity: 0, offset: 0.575 },
    { opacity: 0, offset: 0.775, easing: ease },
    { opacity: 1, offset: 1 },
  ];
}

/** power3.out, used when the cursor glides to the next caret position. */
export const GLIDE_EASE: [number, number, number, number] = [0.33, 1, 0.68, 1];
