import type {
  PillNavItem,
  PillNavSize,
  PillNavTheme,
  PillNavVarInput,
  PillNavVars,
} from './types';

const PILL_NAV_THEMES: Record<PillNavTheme, PillNavVars> = {
  dark: {
    '--pn-surface': 'rgba(38, 35, 46, 0.66)',
    '--pn-solid': '#26232e',
    '--pn-edge': 'rgba(255, 255, 255, 0.08)',
    '--pn-rim': 'rgba(255, 255, 255, 0.07)',
    '--pn-shadow':
      '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--pn-text': 'rgba(244, 244, 245, 0.64)',
    '--pn-strong': '#f4f4f5',
    '--pn-pill': 'linear-gradient(180deg, #ffffff 0%, #ebebf0 100%)',
    '--pn-pill-ink': '#121016',
    '--pn-pill-shadow':
      'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 6px 16px -6px rgba(0, 0, 0, 0.6)',
    '--pn-dot': '#f4f4f5',
    '--pn-ring': 'rgba(244, 244, 245, 0.55)',
    '--pn-row-hover': 'rgba(255, 255, 255, 0.06)',
    '--pn-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--pn-tile-rim':
      'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
  },
  light: {
    '--pn-surface': 'rgba(240, 240, 243, 0.8)',
    '--pn-solid': '#f0f0f3',
    '--pn-edge': 'rgba(24, 24, 27, 0.07)',
    '--pn-rim': 'rgba(255, 255, 255, 0.95)',
    '--pn-shadow':
      '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--pn-text': 'rgba(24, 24, 27, 0.6)',
    '--pn-strong': '#18181b',
    '--pn-pill': 'linear-gradient(180deg, #2c2c31 0%, #18181b 100%)',
    '--pn-pill-ink': '#ffffff',
    '--pn-pill-shadow':
      'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 6px 14px -6px rgba(24, 24, 27, 0.45)',
    '--pn-dot': '#18181b',
    '--pn-ring': 'rgba(24, 24, 27, 0.45)',
    '--pn-row-hover': 'rgba(24, 24, 27, 0.05)',
    '--pn-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--pn-tile-rim':
      'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
  },
};

const PILL_NAV_SIZES: Record<PillNavSize, PillNavVars> = {
  sm: {
    '--pn-h': '36px',
    '--pn-pad': '3px',
    '--pn-inner': '30px',
    '--pn-x': '12px',
    '--pn-font': '13px',
    '--pn-gap': '6px',
    '--pn-mark': '18px',
  },
  md: {
    '--pn-h': '44px',
    '--pn-pad': '4px',
    '--pn-inner': '36px',
    '--pn-x': '16px',
    '--pn-font': '14px',
    '--pn-gap': '8px',
    '--pn-mark': '22px',
  },
  lg: {
    '--pn-h': '52px',
    '--pn-pad': '5px',
    '--pn-inner': '42px',
    '--pn-x': '20px',
    '--pn-font': '15px',
    '--pn-gap': '10px',
    '--pn-mark': '26px',
  },
};

export const PILL_NAV_DEFAULT_ITEMS: PillNavItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export const PILL_NAV_EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Picks near-black or white ink for text placed on `color` (hex only). */
function contrastInk(color: string | undefined): string | null {
  const hex = String(color ?? '')
    .trim()
    .replace('#', '');
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  const channel = (index: number) => {
    const value = Number.parseInt(full.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.36 ? '#121016' : '#ffffff';
}

export function buildPillNavVars(input: PillNavVarInput): PillNavVars {
  const palette = PILL_NAV_THEMES[input.theme] ?? PILL_NAV_THEMES.dark;
  const vars: PillNavVars = {
    ...palette,
    ...(PILL_NAV_SIZES[input.size] ?? PILL_NAV_SIZES.md),
  };
  if (input.surface === 'glass') vars['--pn-blur'] = 'blur(20px) saturate(1.6)';
  if (input.surface === 'solid') {
    vars['--pn-surface'] = palette['--pn-solid'] ?? '';
    vars['--pn-blur'] = 'none';
  }
  if (input.surface === 'none') {
    vars['--pn-surface'] = 'transparent';
    vars['--pn-shadow'] = 'none';
    vars['--pn-blur'] = 'none';
    vars['--pn-edge'] = 'transparent';
    vars['--pn-rim'] = 'transparent';
  }
  if (input.barColor) {
    vars['--pn-surface'] = input.barColor;
    vars['--pn-solid'] = input.barColor;
  }
  if (input.textColor) {
    vars['--pn-strong'] = input.textColor;
    vars['--pn-text'] =
      `color-mix(in srgb, ${input.textColor} 64%, transparent)`;
  }
  if (input.highlightColor) {
    vars['--pn-pill'] = input.highlightColor;
    vars['--pn-dot'] = input.highlightColor;
    vars['--pn-pill-shadow'] =
      'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 6px 16px -6px rgba(0, 0, 0, 0.45)';
    vars['--pn-pill-ink'] =
      input.highlightTextColor ||
      contrastInk(input.highlightColor) ||
      palette['--pn-pill-ink'] ||
      '';
  } else if (input.highlightTextColor) {
    vars['--pn-pill-ink'] = input.highlightTextColor;
  }
  return vars;
}

export function readCssVar(element: HTMLElement, name: string): number {
  return (
    Number.parseFloat(getComputedStyle(element).getPropertyValue(name)) || 0
  );
}
