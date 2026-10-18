import type { CSSProperties } from 'vue';
import type {
  GradualBlurCurve,
  GradualBlurPosition,
  GradualBlurStack,
  GradualBlurStackOptions,
} from './types';

const CURVES: Record<GradualBlurCurve, (t: number) => number> = {
  linear: (t) => t,
  bezier: (t) => t * t * (3 - 2 * t),
  'ease-in': (t) => t * t,
  'ease-out': (t) => 1 - (1 - t) * (1 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
};

export const DIRECTIONS: Record<GradualBlurPosition, string> = {
  top: 'to top',
  bottom: 'to bottom',
  left: 'to left',
  right: 'to right',
};

export const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export const toLength = (value: number | string) =>
  typeof value === 'number' ? `${value}px` : value;

const toTime = (value: number | string) =>
  typeof value === 'number' ? `${value}s` : value;

/**
 * Builds the stacked backdrop-filter layers. Each layer adds only the blur
 * missing since the previous one (radii add in quadrature), so the ramp has
 * no visible steps.
 */
export function buildStack(o: GradualBlurStackOptions): GradualBlurStack {
  const count = Math.min(Math.max(Math.round(o.layers) || 1, 1), 16);
  const shape = CURVES[o.curve] ?? CURVES.linear;
  const maxBlur = Math.max(o.strength, 0) * 12;
  const level = (u: number) => {
    const t = shape(clamp01(u));
    return maxBlur * (o.exponential ? (2 ** (4 * t) - 1) / 15 : t);
  };
  const boost = Math.max(o.saturation, 0) ** (1 / count);
  const fade = `${toTime(o.duration)} ${o.easing}`;
  const direction = DIRECTIONS[o.edge];
  const steps: CSSProperties[] = [];
  for (let i = 0; i < count; i++) {
    const from = level(i / count);
    const to = level((i + 1) / count);
    const radius = Math.sqrt(Math.max(to * to - from * from, 0));
    const filter = [
      `blur(calc(${radius.toFixed(3)}px * var(--gradual-blur-reveal, 1) * var(--gradual-blur-hover, 1)))`,
      boost !== 1
        ? `saturate(calc(1 + ${(boost - 1).toFixed(4)} * var(--gradual-blur-reveal, 1)))`
        : '',
    ]
      .filter(Boolean)
      .join(' ');
    const mask = `linear-gradient(${direction}, transparent ${((i / count) * 100).toFixed(2)}%, #000 ${(((i + 1) / count) * 100).toFixed(2)}%)`;
    steps.push({
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      backdropFilter: filter,
      WebkitBackdropFilter: filter,
      maskImage: mask,
      WebkitMaskImage: mask,
      opacity: o.opacity,
      transition: `backdrop-filter ${fade}, -webkit-backdrop-filter ${fade}`,
    });
  }
  const stops = Array.from({ length: 9 }, (_, k) => {
    const u = k / 8;
    const t = shape(u);
    const alpha = t * t * t * (t * (t * 6 - 15) + 10);
    return `rgba(0, 0, 0, ${alpha.toFixed(3)}) ${(u * 100).toFixed(1)}%`;
  }).join(', ');
  const tintMask = `linear-gradient(${direction}, ${stops})`;
  const wash: CSSProperties | null =
    o.tint && o.tint !== 'transparent'
      ? {
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: o.tint,
          maskImage: tintMask,
          WebkitMaskImage: tintMask,
          opacity:
            'calc(var(--gradual-blur-reveal, 1) * min(var(--gradual-blur-hover, 1), 1))',
          transition: `opacity ${fade}`,
        }
      : null;
  return { steps, wash };
}

/** Finds the scroll container autoHide should watch. */
export function findScroller(
  container: string | HTMLElement | null | undefined,
  root: HTMLElement,
  page: boolean,
  vertical: boolean,
): HTMLElement | Window | null {
  if (container) {
    if (typeof container === 'string') {
      return document.querySelector<HTMLElement>(container);
    }
    return container;
  }
  if (page) return window;
  const parent = root.parentElement;
  if (!parent) return null;
  const scrolls = (node: Element) => {
    const style = getComputedStyle(node);
    return /auto|scroll|overlay/.test(
      vertical ? style.overflowY : style.overflowX,
    );
  };
  const sibling = Array.from(parent.children).find(
    (child): child is HTMLElement =>
      child !== root && child instanceof HTMLElement && scrolls(child),
  );
  return sibling ?? (scrolls(parent) ? parent : null);
}
