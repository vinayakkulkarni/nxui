import type {
  MagicBentoApp,
  MagicBentoCurve,
  MagicBentoItem,
  MagicBentoPoint,
  MagicBentoRgb,
  MagicBentoStep,
  MagicBentoTheme,
  MagicBentoToggle,
  MagicBentoVisual,
} from './types';

export const MAGIC_BENTO_THEMES: Record<
  MagicBentoTheme,
  Record<string, string>
> = {
  dark: {
    '--mb-surface': 'linear-gradient(180deg, #1a1820 0%, #121116 100%)',
    '--mb-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-highlight': 'rgba(255, 255, 255, 0.06)',
    '--mb-shadow':
      '0 24px 48px -28px rgba(0, 0, 0, 0.85), 0 8px 18px -12px rgba(0, 0, 0, 0.6)',
    '--mb-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--mb-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--mb-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--mb-well': 'rgba(255, 255, 255, 0.03)',
    '--mb-well-edge': 'rgba(255, 255, 255, 0.06)',
    '--mb-ink': '#f4f4f5',
    '--mb-muted': 'rgba(244, 244, 245, 0.6)',
    '--mb-faint': 'rgba(244, 244, 245, 0.3)',
    '--mb-line': 'rgba(244, 244, 245, 0.1)',
    '--mb-secondary': '#a1a1aa',
    '--mb-secondary-ink': '#121016',
    '--mb-cursor-stroke': 'rgba(18, 16, 22, 0.9)',
    '--mb-ring': 'rgba(18, 16, 22, 0.85)',
    '--mb-focus': 'rgba(244, 244, 245, 0.5)',
    '--mb-glow-alpha': '0.85',
    '--mb-spot-alpha': '0.07',
  },
  light: {
    '--mb-surface': 'linear-gradient(180deg, #ffffff 0%, #f7f7f9 100%)',
    '--mb-edge': 'rgba(24, 24, 27, 0.08)',
    '--mb-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-shadow':
      '0 24px 48px -30px rgba(24, 24, 27, 0.28), 0 8px 18px -14px rgba(24, 24, 27, 0.16)',
    '--mb-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--mb-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.22)',
    '--mb-well': 'rgba(24, 24, 27, 0.025)',
    '--mb-well-edge': 'rgba(24, 24, 27, 0.06)',
    '--mb-ink': '#18181b',
    '--mb-muted': 'rgba(24, 24, 27, 0.6)',
    '--mb-faint': 'rgba(24, 24, 27, 0.3)',
    '--mb-line': 'rgba(24, 24, 27, 0.08)',
    '--mb-secondary': '#71717a',
    '--mb-secondary-ink': '#ffffff',
    '--mb-cursor-stroke': '#ffffff',
    '--mb-ring': '#ffffff',
    '--mb-focus': 'rgba(24, 24, 27, 0.4)',
    '--mb-glow-alpha': '0.5',
    '--mb-spot-alpha': '0.035',
  },
};

export const MAGIC_BENTO_INK: Record<MagicBentoTheme, MagicBentoRgb> = {
  dark: [244, 244, 245],
  light: [24, 24, 27],
};

export const MIN_CELL = 150;
export const MIN_PAIR = 200;
export const STAGGER = 80;
export const TILT = 6;
export const MAGNET = 6;

export const MAGIC_BENTO_DEFAULT_ITEMS: MagicBentoItem[] = [
  {
    title: 'Analytics',
    description: 'Track user behavior',
    visual: 'analytics',
  },
  {
    title: 'Dashboard',
    description: 'Centralized data view',
    visual: 'dashboard',
  },
  {
    title: 'Collaboration',
    description: 'Work together seamlessly',
    visual: 'collaboration',
    colSpan: 2,
    rowSpan: 2,
  },
  {
    title: 'Automation',
    description: 'Streamline workflows',
    visual: 'automation',
    colSpan: 2,
    rowSpan: 2,
  },
  {
    title: 'Integration',
    description: 'Connect favorite tools',
    visual: 'integration',
  },
  {
    title: 'Security',
    description: 'Enterprise-grade protection',
    visual: 'security',
  },
];

const VISUAL_NAMES: readonly string[] = [
  'analytics',
  'dashboard',
  'collaboration',
  'automation',
  'integration',
  'security',
];

export function isMagicBentoVisual(value: unknown): value is MagicBentoVisual {
  return typeof value === 'string' && VISUAL_NAMES.includes(value);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseRgb(value: string | undefined): MagicBentoRgb | null {
  if (!value) return null;
  const text = value.trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex?.[1]) {
    const full =
      hex[1].length === 3
        ? hex[1].replace(/./g, (digit) => digit + digit)
        : hex[1];
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16),
    ];
  }
  const numbers = text.match(/[\d.]+/g);
  if (numbers && numbers.length >= 3 && /^(?:rgba?\(|[\d.\s,]+$)/i.test(text)) {
    const channel = (raw: string | undefined) =>
      clamp(Math.round(Number.parseFloat(raw ?? '0')), 0, 255);
    return [channel(numbers[0]), channel(numbers[1]), channel(numbers[2])];
  }
  return null;
}

export function inkFor(rgb: MagicBentoRgb): string {
  const [r, g, b] = rgb.map((channel) => channel / 255);
  const luma = 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
  return luma > 0.55 ? '#121016' : '#ffffff';
}

export const CHART = [
  3.1, 3.8, 3.5, 4.9, 4.4, 5.8, 5.3, 6.9, 6.5, 8.2, 9.4, 12.4,
];

/** Monotone cubic curve through the chart values, plus dense samples for scrubbing. */
export function curve(
  values: number[],
  width: number,
  height: number,
): MagicBentoCurve {
  const top = 6;
  const bottom = 2;
  const low = Math.min(...values) * 0.7;
  const high = Math.max(...values);
  const points: MagicBentoPoint[] = values.map((value, index) => [
    (index / (values.length - 1)) * width,
    top + (1 - (value - low) / (high - low)) * (height - top - bottom),
  ]);
  const count = points.length;
  const at = (i: number): MagicBentoPoint => points[i] ?? [0, 0];
  const slopes: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    slopes.push((at(i + 1)[1] - at(i)[1]) / (at(i + 1)[0] - at(i)[0]));
  }
  const slope = (i: number) => slopes[i] ?? 0;
  const tangents = points.map((_, i) => {
    if (i === 0) return slope(0);
    if (i === count - 1) return slope(count - 2);
    return slope(i - 1) * slope(i) > 0 ? (slope(i - 1) + slope(i)) / 2 : 0;
  });
  const tangent = (i: number) => tangents[i] ?? 0;
  for (let i = 0; i < count - 1; i++) {
    if (slope(i) === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangent(i) / slope(i);
    const b = tangent(i + 1) / slope(i);
    const length = a * a + b * b;
    if (length > 9) {
      const scale = 3 / Math.sqrt(length);
      tangents[i] = scale * a * slope(i);
      tangents[i + 1] = scale * b * slope(i);
    }
  }
  const first = at(0);
  let line = `M${first[0].toFixed(2)},${first[1].toFixed(2)}`;
  const samples: MagicBentoPoint[] = [];
  for (let i = 0; i < count - 1; i++) {
    const [x0, y0] = at(i);
    const [x1, y1] = at(i + 1);
    const third = (x1 - x0) / 3;
    const c1: MagicBentoPoint = [x0 + third, y0 + tangent(i) * third];
    const c2: MagicBentoPoint = [x1 - third, y1 - tangent(i + 1) * third];
    line += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`;
    for (let step = 0; step < 12; step++) {
      const t = step / 12;
      const u = 1 - t;
      samples.push([
        u * u * u * x0 +
          3 * u * u * t * c1[0] +
          3 * u * t * t * c2[0] +
          t * t * t * x1,
        u * u * u * y0 +
          3 * u * u * t * c1[1] +
          3 * u * t * t * c2[1] +
          t * t * t * y1,
      ]);
    }
  }
  samples.push(at(count - 1));
  const area = `${line} L${width.toFixed(2)},${height.toFixed(2)} L0,${height.toFixed(2)} Z`;
  return { line, area, samples };
}

export function sampleAt(samples: MagicBentoPoint[], x: number): number {
  let index = 1;
  while (index < samples.length - 1 && (samples[index]?.[0] ?? 0) < x) index++;
  const [x0, y0] = samples[index - 1] ?? [0, 0];
  const [x1, y1] = samples[index] ?? [0, 0];
  const t = x1 === x0 ? 0 : clamp((x - x0) / (x1 - x0), 0, 1);
  return y0 + (y1 - y0) * t;
}

export const BARS = [42, 58, 49, 71, 63, 88, 76];

export const STEPS: MagicBentoStep[] = [
  { label: 'Install', time: '8s' },
  { label: 'Build', time: '12s' },
  { label: 'Test', time: '48s' },
  { label: 'Deploy', time: '9s' },
];

export const APPS: MagicBentoApp[] = [
  { icon: 'lucide:slack', x: 17, y: 24 },
  { icon: 'lucide:github', x: 83, y: 24 },
  { icon: 'lucide:figma', x: 17, y: 78 },
  { icon: 'lucide:notebook-text', x: 83, y: 78 },
];

export const TOGGLES: MagicBentoToggle[] = [
  { icon: 'lucide:key-round', label: 'SSO' },
  { icon: 'lucide:fingerprint', label: '2FA' },
];

/** Finite artwork animations replayed on click. */
export const REPLAY = [
  'magic-bento-draw',
  'magic-bento-fade',
  'magic-bento-grow',
  'magic-bento-pop',
  'magic-bento-select',
  'magic-bento-wait',
  'magic-bento-run',
  'magic-bento-check',
  'magic-bento-rail',
  'magic-bento-switch-track',
  'magic-bento-switch-knob',
];

/** Pipeline animations replayed when the pointer enters the automation card. */
export const FLOW = [
  'magic-bento-wait',
  'magic-bento-run',
  'magic-bento-check',
  'magic-bento-rail',
  'magic-bento-fade',
];

/**
 * Scoped styles suffix keyframe names with the component hash
 * (`magic-bento-draw-1a2b3c4d`), so match on the base name.
 */
export function animationIn(name: string, list: string[]): boolean {
  return list.some((base) => name === base || name.startsWith(`${base}-`));
}
