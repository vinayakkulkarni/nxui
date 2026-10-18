import type { BubbleMenuEase, BubbleMenuItem } from './types';

export const BUBBLE_MENU_DEFAULT_ITEMS: BubbleMenuItem[] = [
  {
    label: 'home',
    href: '#',
    ariaLabel: 'Home',
    rotation: -8,
    hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' },
  },
  {
    label: 'about',
    href: '#',
    ariaLabel: 'About',
    rotation: 8,
    hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' },
  },
  {
    label: 'projects',
    href: '#',
    ariaLabel: 'Documentation',
    rotation: 8,
    hoverStyles: { bgColor: '#f59e0b', textColor: '#ffffff' },
  },
  {
    label: 'blog',
    href: '#',
    ariaLabel: 'Blog',
    rotation: 8,
    hoverStyles: { bgColor: '#ef4444', textColor: '#ffffff' },
  },
  {
    label: 'contact',
    href: '#',
    ariaLabel: 'Contact',
    rotation: -8,
    hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' },
  },
];

type Ease = (t: number) => number;

export const power3Out: Ease = (t) => 1 - (1 - t) ** 4;
export const power3In: Ease = (t) => t ** 4;

function bounceOut(t: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t - 1.5 / d) ** 2 + 0.75;
  if (t < 2.5 / d) return n * (t - 2.25 / d) ** 2 + 0.9375;
  return n * (t - 2.625 / d) ** 2 + 0.984375;
}

function elasticOut(amplitude: number, period: number): Ease {
  const a = Math.max(1, amplitude);
  const s = (period / (2 * Math.PI)) * Math.asin(1 / a);
  return (t) =>
    t <= 0 || t >= 1
      ? t
      : a * 2 ** (-10 * t) * Math.sin(((t - s) * 2 * Math.PI) / period) + 1;
}

function backOut(overshoot: number): Ease {
  return (t) => {
    const p = t - 1;
    return p * p * ((overshoot + 1) * p + overshoot) + 1;
  };
}

/** The GSAP eases upstream exposes, as plain easing functions. */
export const BUBBLE_MENU_EASES: Record<BubbleMenuEase, Ease> = {
  'back.out(1.5)': backOut(1.5),
  'power3.out': power3Out,
  'power2.out': (t) => 1 - (1 - t) ** 3,
  'elastic.out(1,0.5)': elasticOut(1, 0.5),
  'bounce.out': bounceOut,
};
