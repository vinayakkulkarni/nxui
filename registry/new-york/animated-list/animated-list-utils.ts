import type {
  AnimatedListEntry,
  AnimatedListItem,
  AnimatedListTheme,
} from './types';

export const ANIMATED_LIST_THEMES: Record<
  AnimatedListTheme,
  Record<string, string>
> = {
  dark: {
    '--al-frame': 'rgba(38, 35, 46, 0.66)',
    '--al-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--al-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--al-frame-shadow':
      '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--al-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--al-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--al-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--al-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--al-well': 'rgba(255, 255, 255, 0.08)',
    '--al-ink': '#f4f4f5',
    '--al-muted': 'rgba(244, 244, 245, 0.55)',
    '--al-thumb': 'rgba(255, 255, 255, 0.16)',
    '--al-ring': 'rgba(244, 244, 245, 0.3)',
    '--al-ring-fill': 'rgba(244, 244, 245, 0.05)',
    '--al-hover': 'brightness(1.12)',
    '--al-press': 'brightness(0.85)',
    '--al-active': 'brightness(1.16)',
  },
  light: {
    '--al-frame': 'rgba(240, 240, 243, 0.8)',
    '--al-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--al-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--al-frame-shadow':
      '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--al-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--al-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--al-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--al-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--al-well': 'rgba(24, 24, 27, 0.05)',
    '--al-ink': '#27272a',
    '--al-muted': 'rgba(39, 39, 42, 0.55)',
    '--al-thumb': 'rgba(24, 24, 27, 0.16)',
    '--al-ring': 'rgba(24, 24, 27, 0.28)',
    '--al-ring-fill': 'transparent',
    '--al-hover': 'brightness(0.97)',
    '--al-press': 'brightness(0.92)',
    '--al-active': 'none',
  },
};

export const ANIMATED_LIST_DEFAULT_ITEMS: AnimatedListEntry[] = [
  {
    icon: 'lucide:folder',
    title: 'Brand assets',
    description: '24 files',
    meta: '2m',
  },
  {
    icon: 'lucide:image',
    title: 'Launch hero.png',
    description: '2.4 MB',
    meta: '18m',
  },
  {
    icon: 'lucide:video',
    title: 'Product tour.mp4',
    description: '148 MB',
    meta: '1h',
  },
  {
    icon: 'lucide:notebook-pen',
    title: 'Pricing notes',
    description: '1,240 words',
    meta: '3h',
  },
  {
    icon: 'lucide:code',
    title: 'landing-page.tsx',
    description: '12 KB',
    meta: '5h',
  },
  {
    icon: 'lucide:figma',
    title: 'Onboarding flow',
    description: '38 frames',
    meta: '8h',
  },
  {
    icon: 'lucide:music',
    title: 'Ambient loop.wav',
    description: '9.1 MB',
    meta: '1d',
  },
  {
    icon: 'lucide:table',
    title: 'Q3 forecast',
    description: '4 sheets',
    meta: '1d',
  },
  {
    icon: 'lucide:file-text',
    title: 'Brand guidelines.pdf',
    description: '6.8 MB',
    meta: '2d',
  },
  {
    icon: 'lucide:presentation',
    title: 'Investor update',
    description: '22 slides',
    meta: '3d',
  },
  {
    icon: 'lucide:file-archive',
    title: 'Icon set.zip',
    description: '1.2 MB',
    meta: '4d',
  },
  {
    icon: 'lucide:image',
    title: 'Moodboard.jpg',
    description: '3.6 MB',
    meta: '5d',
  },
  {
    icon: 'lucide:file',
    title: 'Release notes',
    description: 'Version 2.4',
    meta: '1w',
  },
  {
    icon: 'lucide:folder',
    title: 'Archive',
    description: '118 files',
    meta: '2w',
  },
  {
    icon: 'lucide:video',
    title: 'Teaser cut.mov',
    description: '86 MB',
    meta: '3w',
  },
];

/** Off-screen poses for rows above or below the viewport. */
export const ANIMATED_LIST_HIDDEN = {
  pop: {
    above: 'translate3d(0, -12px, 0) scale(0.8)',
    below: 'translate3d(0, 12px, 0) scale(0.8)',
  },
  slide: {
    above: 'translate3d(0, -28px, 0) scale(0.98)',
    below: 'translate3d(0, 28px, 0) scale(0.98)',
  },
  fade: { above: 'translate3d(0, -4px, 0)', below: 'translate3d(0, 4px, 0)' },
};

export type AnimatedListMode = keyof typeof ANIMATED_LIST_HIDDEN | 'none';

export const ANIMATED_LIST_SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';

function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Eased edge fade driven by the --al-fade-top / --al-fade-bottom vars. */
export const ANIMATED_LIST_FADE_MASK = (() => {
  const steps = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
  const top = steps.map(
    (t) =>
      `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) calc(var(--al-fade-top) * ${t})`,
  );
  const bottom = [...steps]
    .reverse()
    .map(
      (t) =>
        `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) calc(100% - var(--al-fade-bottom) * ${t})`,
    );
  return `linear-gradient(to bottom, ${[...top, ...bottom].join(', ')})`;
})();

export function toCssSize(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export function toEntry(item: AnimatedListItem): AnimatedListEntry {
  return typeof item === 'object' && item !== null ? item : { title: item };
}

export function isHiddenMode(
  mode: string,
): mode is keyof typeof ANIMATED_LIST_HIDDEN {
  return mode in ANIMATED_LIST_HIDDEN;
}
