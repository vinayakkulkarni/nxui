export type GlassIconsPlate = 'tilt' | 'offset' | 'circle' | 'none';
export type GlassIconsHover = 'lift' | 'float' | 'press' | 'none';
export type GlassIconsLabels = 'hover' | 'always' | 'none';
export type GlassIconsTheme = 'dark' | 'light';

export interface GlassIconsItem {
  /** Iconify icon name, e.g. `lucide:folder`. Use the `icon` slot for custom markup. */
  icon?: string;
  label?: string;
  /** Preset name (blue, purple, red, indigo, orange, green, teal, pink, graphite, silver) or any CSS color or linear-gradient. */
  color?: string;
  href?: string;
  target?: string;
  onClick?: (event: MouseEvent) => void;
  id?: string | number;
  className?: string;
}

export interface GlassIconsProps {
  items?: GlassIconsItem[];
  size?: number;
  gap?: number;
  columns?: number;
  roundness?: number;
  refraction?: number;
  bevel?: number;
  dispersion?: number;
  frost?: number;
  shine?: number;
  tint?: string;
  tintOpacity?: number;
  iconColor?: string;
  plate?: GlassIconsPlate;
  tilt?: number;
  spread?: number;
  hover?: GlassIconsHover;
  parallax?: number;
  labels?: GlassIconsLabels;
  intro?: boolean;
  theme?: GlassIconsTheme;
  class?: string;
}

export interface GlassIconsMaps {
  refractionUrl: string;
  shineUrl: string;
  shadeUrl: string;
}

export type GlassIconsStop = [number, string];

export interface GlassIconsGradient {
  angle: number;
  stops: GlassIconsStop[];
}

export interface GlassIconsMotion {
  h: number;
  hv: number;
  ht: number;
  p: number;
  pv: number;
  pt: number;
  x: number;
  xv: number;
  xt: number;
  y: number;
  yv: number;
  yt: number;
  e: number;
  ev: number;
  et: number;
  at: number;
}

export interface GlassIconsSettings {
  count: number;
  tile: number;
  radius: number;
  edge: number;
  strength: number;
  split: number;
  soft: number;
  shine: number;
  shade: number;
  tint: string;
  tintOpacity: number;
  plate: GlassIconsPlate;
  hover: GlassIconsHover;
  labels: GlassIconsLabels;
  tilt: number;
  spread: number;
  parallax: number;
  intro: boolean;
  colors: string[];
  colorKey: string;
}

export interface GlassIconsPose {
  liftY: number;
  glassScale: number;
  domScale: number;
  glassAlpha: number;
  plateAlpha: number;
  faceY: number;
  faceScale: number;
  faceAlpha: number;
  plateScale: number;
  shift: [number, number];
  angle: number;
  offset: [number, number];
  bend: number;
  glow: number;
  light: [number, number];
}

export interface GlassIconsEngine {
  hover: (index: number, on: boolean) => void;
  aim: (index: number, x: number, y: number) => void;
  press: (index: number, on: boolean) => void;
  sync: () => void;
  destroy: () => void;
}

export interface GlassIconsEngineOptions {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => GlassIconsSettings;
  plates: (HTMLElement | null)[];
  glasses: (HTMLElement | null)[];
  faces: (HTMLElement | null)[];
  labels: (HTMLElement | null)[];
  onGpu: (enabled: boolean) => void;
}
