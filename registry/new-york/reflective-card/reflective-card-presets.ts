import type {
  ReflectiveCardLook,
  ReflectiveCardPreset,
  ReflectiveCardTheme,
} from './types';

export const REFLECTIVE_CARD_LOOK: ReflectiveCardLook = {
  tint: '#ffffff',
  metalness: 1,
  roughness: 0.3,
  blurStrength: 6,
  grayscale: 1,
  warp: 0.6,
  warpScale: 1,
  shine: 1,
  bevel: 3,
  glare: 0.5,
};

export const REFLECTIVE_CARD_PRESETS: Record<
  ReflectiveCardPreset,
  Partial<ReflectiveCardLook>
> = {
  steel: {},
  brushed: { roughness: 0.85, blurStrength: 8, shine: 1.2 },
  mirror: { roughness: 0, blurStrength: 1.5, warp: 0.3 },
  gold: { tint: '#f3cf8a', shine: 1.1 },
  rose: { tint: '#f1b9a4' },
  satin: { blurStrength: 14, roughness: 0.5, glare: 0.4 },
};

export const REFLECTIVE_CARD_VIDEOS: Record<ReflectiveCardTheme, string> = {
  light:
    'https://cdn.jsdelivr.net/gh/DavidHDev/react-bits@d9085a5/public/assets/demo/reflection-day.mp4',
  dark: 'https://cdn.jsdelivr.net/gh/DavidHDev/react-bits@d9085a5/public/assets/demo/reflection-night.mp4',
};
