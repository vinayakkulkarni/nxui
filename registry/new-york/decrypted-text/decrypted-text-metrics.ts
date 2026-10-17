import type { DecryptedTextFontMetrics as FontMetrics } from './types';

export const FADE_FLOOR = 0.16;
export const FADE_PEAK = 0.62;
export const FADE_LEAD = 6;
export const SETTLE =
  'color 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

export const isSpace = (char: string) => /\s/.test(char);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const glyphWidths = new Map<string, Map<string, number>>();
let measureContext: CanvasRenderingContext2D | null = null;

export function readFont(node: HTMLElement): FontMetrics {
  const style = window.getComputedStyle(node);
  return {
    font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    spacing: Number.parseFloat(style.letterSpacing) || 0,
  };
}

export function forgetFont(font: string) {
  glyphWidths.delete(font);
}

/** Canvas-measured advance width of one glyph, cached per font. */
export function advance(font: string, glyph: string): number {
  let widths = glyphWidths.get(font);
  if (!widths) {
    widths = new Map();
    glyphWidths.set(font, widths);
  }
  let width = widths.get(glyph);
  if (width === undefined) {
    measureContext ??= document.createElement('canvas').getContext('2d');
    if (!measureContext) return 0;
    measureContext.font = font;
    width = measureContext.measureText(glyph).width;
    widths.set(glyph, width);
  }
  return width;
}

/** Web Animations keyframes for one flip-board roll. */
export function flipFrames(angle: number, opacity: number): Keyframe[] {
  return [
    {
      transform: `perspective(4em) translateZ(-0.42em) rotateX(${angle}deg) translateZ(0.42em)`,
      opacity,
    },
    {
      transform:
        'perspective(4em) translateZ(-0.42em) rotateX(0deg) translateZ(0.42em)',
      opacity: 1,
    },
  ];
}
