import type {
  LiquidGlassCarouselItem,
  LiquidGlassCarouselConfig,
  LiquidGlassLensConfig,
  LiquidGlassFocusConfig,
  LiquidGlassEntryConfig,
} from './types';

/**
 * Panels shown in the carousel. Panels are all `panelH` tall and get their
 * width from the image aspect ratio, so nothing is cropped or stretched.
 * Leave `aspect` undefined to auto-measure from the image.
 */
export const DEFAULT_ITEMS: LiquidGlassCarouselItem[] = [
  {
    src: 'https://picsum.photos/seed/lgc1/1200/800',
    brand: 'Nothing',
    desc: 'Phone (2a) Launch Microsite',
  },
  {
    src: 'https://picsum.photos/seed/lgc2/900/1200',
    brand: 'Apple',
    desc: '330 P4 Experience Page Concept',
  },
  {
    src: 'https://picsum.photos/seed/lgc3/1400/900',
    brand: 'Ferrari',
    desc: '499P Hypercar Configurator',
  },
  {
    src: 'https://picsum.photos/seed/lgc4/1000/1000',
    brand: 'Aesop',
    desc: 'Sensorial Fragrance Story',
  },
  {
    src: 'https://picsum.photos/seed/lgc5/1300/850',
    brand: 'Polestar',
    desc: 'Polestar 5 Reveal Journey',
  },
  {
    src: 'https://picsum.photos/seed/lgc6/950/1250',
    brand: 'Bang & Olufsen',
    desc: 'Beosound Acoustic Lab',
  },
  {
    src: 'https://picsum.photos/seed/lgc7/1200/900',
    brand: 'Off-White',
    desc: 'FW Lookbook Digital Drop',
  },
  {
    src: 'https://picsum.photos/seed/lgc8/1100/1400',
    brand: 'Rimowa',
    desc: 'Aluminium Heritage Archive',
  },
  {
    src: 'https://picsum.photos/seed/lgc9/1350/900',
    brand: 'Loewe',
    desc: 'Craft Maison Editorial',
  },
  {
    src: 'https://picsum.photos/seed/lgc10/1000/1300',
    brand: 'Hermès',
    desc: 'Petit h Atelier Stories',
  },
  {
    src: 'https://picsum.photos/seed/lgc11/1250/850',
    brand: 'Balenciaga',
    desc: 'Couture Motion Capsule',
  },
  {
    src: 'https://picsum.photos/seed/lgc12/900/1150',
    brand: 'Teenage Engineering',
    desc: 'OP-1 Field Interactive Showcase',
  },
];

/**
 * Layout + scroll feel. Wheel moves a target, the scroll lerps after it.
 * When the wheel goes quiet and the glide is nearly done, the target gets
 * redirected once onto the nearest panel center — so the row always settles
 * on an image, but the landing is part of the same glide.
 */
export const DEFAULT_CONFIG: LiquidGlassCarouselConfig = {
  panelH: 450,
  gap: 12,
  ease: 0.075,
  wheel: 1,
  snap: true,
  snapDist: 60,
  snapDelay: 120,
  shrinkMax: 60,
  shrinkAttack: 0.25,
  shrinkDecay: 0.06,
};

/**
 * The liquid-glass lens (fullscreen post-process). Ported from a hero
 * explosion shader, hence some of the exotic knob names.
 */
export const DEFAULT_LENS: LiquidGlassLensConfig = {
  shape: 'circle',
  squareRound: 0,
  rotation: 65,
  spin: 0,
  sizeX: 0.565,
  sizeY: 1,
  posX: 0.5,
  posY: 0.5,
  zoom: 0,
  dispersion: 11,
  blur: 0,
  glow: 4.2,
  whiteGlow: 0.24,
  novaSize: 12,
  blueRing: 6,
  ringRadius: 0.49,
  ringWidth: 0.014,
  shimmer: true,
  shimmerFreq: 12,
  shimmerSpeed: 3.5,
  shimmerDepth: 0.12,
  rimStart: 0.578,
  rimTangential: 0.6,
  rimInward: 0,
  rimFreq1: 2,
  rimFreq2: 1,
  blueColor: '#009dff',
  rimLine: 1.4,
  rimLinePos: 0.488,
  rimLineWidth: 0.003,
  vignette: 0,
  vignetteSize: 0.3,
  samples: 16,
};

/**
 * Focus mode: click an image -> it centers and enlarges, everything else
 * sweeps down out of view, the lens distortion fades away.
 */
export const DEFAULT_FOCUS: LiquidGlassFocusConfig = {
  cardDuration: 0.7,
  focusDuration: 0.9,
  stagger: 0.06,
  dropDist: 1.4,
  centerScale: 1.18,
  lensFade: 0.85,
};

/**
 * Entry animation (auto on load): panels rise from below at a small size,
 * hold, then grow to full size while the lens blooms back in.
 */
export const DEFAULT_ENTRY: LiquidGlassEntryConfig = {
  enabled: true,
  delay: 0.5,
  startH: 80,
  riseDuration: 1,
  stagger: 0.07,
  fromBelow: 0.9,
  growDelay: 0.25,
  growDuration: 2.15,
  growStagger: 0.085,
  growDir: 'inward',
  lensBloom: 1.4,
};
