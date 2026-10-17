import { Comment, Fragment, Text, isVNode } from 'vue';
import type { ButtonHTMLAttributes, VNode } from 'vue';
import type { StepperButtonProps, StepperEntry, StepperTheme } from './types';

export const STEPPER_THEMES: Record<StepperTheme, Record<string, string>> = {
  dark: {
    '--stepper-frame': 'rgba(38, 35, 46, 0.66)',
    '--stepper-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--stepper-frame-shadow':
      '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--stepper-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--stepper-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--stepper-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--stepper-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--stepper-well': 'rgba(255, 255, 255, 0.07)',
    '--stepper-track': 'rgba(255, 255, 255, 0.1)',
    '--stepper-ink': '#f4f4f5',
    '--stepper-muted': 'rgba(244, 244, 245, 0.55)',
    '--stepper-faint': 'rgba(255, 255, 255, 0.22)',
    '--stepper-ring': 'rgba(244, 244, 245, 0.3)',
    '--stepper-solid': '#f4f4f5',
    '--stepper-solid-ink': '#18181b',
    '--stepper-hover': 'brightness(1.12)',
    '--stepper-hover-fill': 'rgba(255, 255, 255, 0.04)',
    '--stepper-solid-hover': 'brightness(0.9)',
    '--stepper-press': 'brightness(0.85)',
  },
  light: {
    '--stepper-frame': 'rgba(240, 240, 243, 0.8)',
    '--stepper-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--stepper-frame-shadow':
      '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--stepper-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--stepper-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--stepper-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--stepper-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--stepper-well': 'rgba(24, 24, 27, 0.05)',
    '--stepper-track': 'rgba(24, 24, 27, 0.08)',
    '--stepper-ink': '#27272a',
    '--stepper-muted': 'rgba(39, 39, 42, 0.55)',
    '--stepper-faint': 'rgba(24, 24, 27, 0.16)',
    '--stepper-ring': 'rgba(24, 24, 27, 0.28)',
    '--stepper-solid': '#27272a',
    '--stepper-solid-ink': '#ffffff',
    '--stepper-hover': 'brightness(0.97)',
    '--stepper-hover-fill': 'rgba(24, 24, 27, 0.035)',
    '--stepper-solid-hover': 'brightness(1.3)',
    '--stepper-press': 'brightness(0.92)',
  },
};

export const STEPPER_SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';
export const STEPPER_SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export const clampStep = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** The spring curve when `linear()` easing is supported, else an overshoot bezier. */
export const springEase = (): string =>
  typeof CSS !== 'undefined' &&
  CSS.supports?.('transition-timing-function', 'linear(0, 1)')
    ? STEPPER_SPRING
    : 'cubic-bezier(0.34, 1.4, 0.64, 1)';

/** Dark or white ink, whichever reads better on the given hex color. */
export const readableOn = (color: string): string => {
  let hex = String(color || '')
    .trim()
    .replace('#', '');
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((index) => {
    const c = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#18181b' : '#ffffff';
};

const readString = (props: VNode['props'], key: string): string | undefined => {
  const value: unknown = props?.[key];
  return typeof value === 'string' && value ? value : undefined;
};

/** Flattens slot output (v-for fragments included) into one entry per step. */
export const collectSteps = (nodes: VNode[]): StepperEntry[] => {
  const out: StepperEntry[] = [];
  const walk = (list: unknown[]): void => {
    for (const node of list) {
      if (Array.isArray(node)) {
        walk(node);
        continue;
      }
      if (!isVNode(node) || node.type === Comment || node.type === Text)
        continue;
      if (node.type === Fragment) {
        if (Array.isArray(node.children)) walk(node.children);
        continue;
      }
      out.push({
        node,
        title: readString(node.props, 'title'),
        description: readString(node.props, 'description'),
        icon: readString(node.props, 'icon'),
      });
    }
  };
  walk(nodes);
  return out;
};

/** Button attributes minus `class` and `onClick`, which the Stepper merges itself. */
export const buttonAttrs = (
  source: StepperButtonProps,
): ButtonHTMLAttributes => {
  const out: StepperButtonProps = { ...source };
  delete out.class;
  delete out.onClick;
  return out;
};
