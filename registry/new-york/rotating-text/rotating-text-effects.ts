import type { Transition, VariantType } from 'motion-v';
import type {
  RotatingTextEffect,
  RotatingTextElement,
  RotatingTextPreset,
  RotatingTextSplitBy,
} from './types';

export const LAYOUT_SPRING: Transition = {
  type: 'spring',
  damping: 25,
  stiffness: 300,
};

export const WIDTH_SPRING: Transition = {
  type: 'spring',
  damping: 34,
  stiffness: 320,
};

export const FLIP_STYLE = {
  transformOrigin: '50% 50% -0.45em',
  backfaceVisibility: 'hidden',
} as const;

export const ROTATING_TEXT_EFFECTS: Record<
  RotatingTextEffect,
  (up: boolean) => RotatingTextPreset
> = {
  slide: (up) => ({
    initial: { y: up ? '100%' : '-100%', opacity: 0 },
    animate: { y: '0%', opacity: 1 },
    exit: { y: up ? '-120%' : '120%', opacity: 0 },
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  }),
  flip: (up) => ({
    initial: { rotateX: up ? -90 : 90, opacity: 0, transformPerspective: 480 },
    animate: { rotateX: 0, opacity: 1, transformPerspective: 480 },
    exit: { rotateX: up ? 90 : -90, opacity: 0, transformPerspective: 480 },
    transition: { type: 'tween', duration: 0.6, ease: [0.34, 1.4, 0.64, 1] },
    exitTransition: {
      type: 'tween',
      duration: 0.32,
      ease: [0.5, 0, 0.75, 0],
    },
  }),
  blur: (up) => ({
    initial: { y: up ? '45%' : '-45%', opacity: 0 },
    animate: { y: '0%', opacity: 1 },
    exit: { y: up ? '-45%' : '45%', opacity: 0 },
    transition: { type: 'tween', duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
  scale: (up) => ({
    initial: { scale: up ? 0.35 : 1.7, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: up ? 1.7 : 0.35, opacity: 0 },
    transition: { type: 'spring', damping: 17, stiffness: 240 },
  }),
  drop: () => ({
    initial: { y: '-110%', opacity: 0 },
    animate: { y: '0%', opacity: 1 },
    exit: { y: '110%', opacity: 0 },
    transition: { type: 'spring', damping: 18, stiffness: 320, mass: 0.9 },
    exitTransition: {
      type: 'tween',
      duration: 0.3,
      ease: [0.55, 0, 1, 0.45],
    },
  }),
};

export function withFilter(state: VariantType, filter: string): VariantType {
  return { ...state, filter };
}

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('en', { granularity: 'grapheme' })
    : null;

function splitIntoCharacters(text: string): string[] {
  return segmenter
    ? Array.from(segmenter.segment(text), (segment) => segment.segment)
    : Array.from(text);
}

export function splitText(
  text: string,
  splitBy: RotatingTextSplitBy,
): RotatingTextElement[] {
  if (splitBy === 'characters') {
    const words = text.split(' ');
    return words.map((word, i) => ({
      characters: splitIntoCharacters(word),
      needsSpace: i !== words.length - 1,
    }));
  }
  const parts = text.split(
    splitBy === 'words' ? ' ' : splitBy === 'lines' ? '\n' : splitBy,
  );
  return parts.map((part, i) => ({
    characters: [part],
    needsSpace: i !== parts.length - 1,
  }));
}

/** Black or white, whichever reads better on `color` (WCAG luminance). */
export function readableText(color: string): string | undefined {
  const value = color.trim();
  let rgb: number[] | null = null;
  const hex = value.match(
    /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  );
  if (hex?.[1]) {
    const raw = hex[1];
    const digits =
      raw.length < 6
        ? Array.from(raw.slice(0, 3))
            .map((c) => c + c)
            .join('')
        : raw.slice(0, 6);
    rgb = [0, 2, 4].map((i) => Number.parseInt(digits.slice(i, i + 2), 16));
  } else {
    const fn = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (fn) rgb = fn.slice(1, 4).map(Number);
  }
  if (!rgb) return undefined;
  const [r = 0, g = 0, b = 0] = rgb.map((channel) => {
    const c = Math.min(Math.max(channel / 255, 0), 1);
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? '#0b0b0c' : '#ffffff';
}
