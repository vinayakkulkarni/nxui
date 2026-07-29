export interface LiquidGlassCarouselItem {
  /** Image URL for the panel. */
  src: string;
  /** Brand / title line shown in the overlay heading. */
  brand: string;
  /** Description line shown under the brand. */
  desc: string;
  /** Aspect ratio (w/h). Leave undefined to auto-measure from the image. */
  aspect?: number;
}

/** Layout + scroll feel. */
export interface LiquidGlassCarouselConfig {
  /** px height — same for every panel. */
  panelH: number;
  /** px gap between panels. */
  gap: number;
  /** lerp toward target (lower = heavier / more glide). */
  ease: number;
  /** wheel sensitivity. */
  wheel: number;
  /** settle onto the nearest panel center. */
  snap: boolean;
  /** remaining glide px below which the settle-snap engages. */
  snapDist: number;
  /** ms of wheel silence required before snapping. */
  snapDelay: number;
  /** scroll speed (px/frame) that equals a full 25% shrink. */
  shrinkMax: number;
  /** how fast panels shrink when speeding up. */
  shrinkAttack: number;
  /** how fast they grow back when settling. */
  shrinkDecay: number;
}

/** The liquid-glass lens (fullscreen post-process). */
export interface LiquidGlassLensConfig {
  /** 'circle' (ellipse) | 'square' (rectangle). */
  shape: 'circle' | 'square';
  /** corner rounding for rectangle (0 sharp .. 1 very round). */
  squareRound: number;
  /** static rotation in degrees. */
  rotation: number;
  /** auto-spin speed (deg/sec, 0 = off). */
  spin: number;
  /** half-width (fraction of viewport height). */
  sizeX: number;
  /** half-height (fraction of viewport height). */
  sizeY: number;
  /** center x in screen-UV (0 left .. 1 right). */
  posX: number;
  /** center y in screen-UV (0 bottom .. 1 top). */
  posY: number;
  /** inward pull strength. */
  zoom: number;
  /** chromatic dispersion. */
  dispersion: number;
  /** blur amount (px). */
  blur: number;
  /** overall glow multiplier. */
  glow: number;
  /** central white nova intensity. */
  whiteGlow: number;
  /** nova size. */
  novaSize: number;
  /** blue ring intensity. */
  blueRing: number;
  /** ring radius (0..0.5). */
  ringRadius: number;
  /** ring width. */
  ringWidth: number;
  /** animated ring shimmer. */
  shimmer: boolean;
  /** shimmer wave count around the ring. */
  shimmerFreq: number;
  /** shimmer animation speed. */
  shimmerSpeed: number;
  /** shimmer intensity (0 = none .. 0.5 = strong). */
  shimmerDepth: number;
  /** where the rim fluid wave begins. */
  rimStart: number;
  /** tangential fluid-wave displacement. */
  rimTangential: number;
  /** extra inward pull at the rim. */
  rimInward: number;
  /** fluid wave frequency 1. */
  rimFreq1: number;
  /** fluid wave frequency 2. */
  rimFreq2: number;
  /** the soul: blue tint / ring color. */
  blueColor: string;
  /** bright white border line intensity (0 = off). */
  rimLine: number;
  /** where the white border sits (0..0.5). */
  rimLinePos: number;
  /** sharpness of the white border. */
  rimLineWidth: number;
  /** overall screen vignette strength (0 = off). */
  vignette: number;
  /** how far in the vignette reaches. */
  vignetteSize: number;
  /** dispersion samples. */
  samples: number;
}

/** Focus mode: click an image and everything else sweeps away. */
export interface LiquidGlassFocusConfig {
  /** seconds for the OTHER cards to drop. */
  cardDuration: number;
  /** seconds for the MAIN card to scale into focus. */
  focusDuration: number;
  /** seconds between successive panels leaving (center-out). */
  stagger: number;
  /** how far panels drop, as a fraction of viewport height. */
  dropDist: number;
  /** how much the focused image grows when alone. */
  centerScale: number;
  /** seconds for the lens props to ramp to invisible. */
  lensFade: number;
}

/** Entry animation: panels rise from below, then grow to full size. */
export interface LiquidGlassEntryConfig {
  enabled: boolean;
  /** seconds before the entry begins. */
  delay: number;
  /** px height each panel starts at. */
  startH: number;
  /** seconds for a panel to rise into place. */
  riseDuration: number;
  /** seconds between panels rising. */
  stagger: number;
  /** start offset below screen, as a fraction of viewport height. */
  fromBelow: number;
  /** seconds to wait after the rise before growing. */
  growDelay: number;
  /** seconds for each panel to grow to full size. */
  growDuration: number;
  /** seconds between successive panels growing. */
  growStagger: number;
  /** 'outward' = center grows first, 'inward' = edges first. */
  growDir: 'outward' | 'inward';
  /** seconds for the lens effect to fade back in. */
  lensBloom: number;
}

export interface LiquidGlassCarouselCallbacks {
  /** Optional trailing "View" label element moved by the engine. */
  cursorElement?: HTMLElement | null;
  /** Fires when the centered image changes. */
  onActiveChange?: (index: number) => void;
  /** Fires when focus mode opens / closes. */
  onFocusChange?: (open: boolean) => void;
  /** Fires when the entry animation settles. */
  onEntryDone?: (done: boolean) => void;
}

/** Resolved settings the engine runs on. */
export interface LiquidGlassCarouselOptions {
  items: LiquidGlassCarouselItem[];
  config: LiquidGlassCarouselConfig;
  lens: LiquidGlassLensConfig;
  focus: LiquidGlassFocusConfig;
  entry: LiquidGlassEntryConfig;
}

/** Public handle returned by `createCarousel`. */
export interface LiquidGlassCarouselHandle {
  closeFocus: () => void;
  replayEntry: () => void;
  refreshLayout: () => void;
  destroy: () => void;
}

export interface LiquidGlassCarouselProps {
  /** Panels shown in the carousel. */
  items?: LiquidGlassCarouselItem[];
  /** Layout + scroll overrides. */
  config?: Partial<LiquidGlassCarouselConfig>;
  /** Liquid-glass lens overrides. */
  lens?: Partial<LiquidGlassLensConfig>;
  /** Focus-mode overrides. */
  focus?: Partial<LiquidGlassFocusConfig>;
  /** Entry-animation overrides. */
  entry?: Partial<LiquidGlassEntryConfig>;
  /**
   * Below this viewport width the carousel is replaced by a notice — it is a
   * wheel-driven, shader-heavy desktop experience.
   */
  minViewportWidth?: number;
  class?: string;
}
