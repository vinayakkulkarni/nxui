import type { CardSwapItem, CardSwapTheme } from './types';

export const CARD_SWAP_THEMES: Record<CardSwapTheme, Record<string, string>> = {
  dark: {
    '--swap-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--swap-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--swap-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--swap-shadow':
      '0 30px 60px -24px rgba(0, 0, 0, 0.8), 0 10px 24px -12px rgba(0, 0, 0, 0.55)',
    '--swap-media-edge': 'rgba(255, 255, 255, 0.06)',
    '--swap-ink': '#f4f4f5',
    '--swap-badge': 'rgba(255, 255, 255, 0.08)',
    '--swap-shade': '#100e15',
  },
  light: {
    '--swap-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--swap-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--swap-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--swap-shadow':
      '0 30px 60px -28px rgba(24, 24, 27, 0.35), 0 10px 24px -14px rgba(24, 24, 27, 0.2)',
    '--swap-media-edge': 'rgba(24, 24, 27, 0.06)',
    '--swap-ink': '#27272a',
    '--swap-badge': 'rgba(24, 24, 27, 0.05)',
    '--swap-shade': '#ffffff',
  },
};

export const CARD_SWAP_DEFAULT_ITEMS: CardSwapItem[] = [
  {
    title: 'Golden hour',
    image:
      'https://images.unsplash.com/photo-1514519334989-3d5c8b1a9f91?w=900&q=80&auto=format&fit=crop',
    icon: 'lucide:sunset',
  },
  {
    title: 'Black beach',
    image:
      'https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=900&q=80&auto=format&fit=crop',
    icon: 'lucide:tree-palm',
  },
  {
    title: 'Steel arches',
    image:
      'https://images.unsplash.com/photo-1520930528075-4ea5ead759f5?w=900&q=80&auto=format&fit=crop',
    icon: 'lucide:bridge',
  },
  {
    title: 'Pink drift',
    image:
      'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop',
    icon: 'lucide:cloud',
  },
];
