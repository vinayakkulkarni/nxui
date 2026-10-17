export type GhostFibersFiberStyle = 'dots' | 'dashes' | 'lines';

export type GhostFibersGradient = 'depth' | 'along' | 'across';

export type GhostFibersHoverEffect = 'focus' | 'part' | 'none';

export type GhostFibersPresetName =
  | 'violet'
  | 'fiber'
  | 'minimal'
  | 'prism'
  | 'ember'
  | 'silk'
  | 'bokeh';

export interface GhostFibersLook {
  glowColor: string;
  lineColor: string;
  secondaryColor: string;
  gradient: GhostFibersGradient;
  layers: number;
  waves: number;
  twist: number;
  volume: number;
  spread: number;
  scale: number;
  rotation: number;
  perspective: number;
  threads: number;
  density: number;
  thickness: number;
  fiberStyle: GhostFibersFiberStyle;
  tips: number;
  foldGlow: number;
  speed: number;
  flow: number;
  rollSpeed: number;
  depthOfField: number;
  focusDepth: number;
  particles: number;
  sparkle: number;
  glow: number;
  brightness: number;
  vignette: number;
  grain: number;
}

export interface GhostFibersProps {
  glowColor?: string;
  lineColor?: string;
  secondaryColor?: string;
  gradient?: GhostFibersGradient;
  speed?: number;
  scale?: number;
  rotation?: number;
  rollSpeed?: number;
  layers?: number;
  waves?: number;
  twist?: number;
  threads?: number;
  volume?: number;
  spread?: number;
  density?: number;
  thickness?: number;
  flow?: number;
  fiberStyle?: GhostFibersFiberStyle;
  tips?: number;
  foldGlow?: number;
  perspective?: number;
  depthOfField?: number;
  focusDepth?: number;
  particles?: number;
  sparkle?: number;
  glow?: number;
  brightness?: number;
  vignette?: number;
  grain?: number;
  mouseInteraction?: boolean;
  hoverEffect?: GhostFibersHoverEffect;
  mouseStrength?: number;
  pulseOnClick?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
  class?: string;
}

/** Clamped, numeric form of the props that the renderer reads every frame. */
export interface GhostFibersSettings {
  glowColor: string;
  lineColor: string;
  secondaryColor: string;
  gradient: number;
  speed: number;
  scale: number;
  rotation: number;
  rollSpeed: number;
  layers: number;
  waves: number;
  twist: number;
  threads: number;
  volume: number;
  spread: number;
  density: number;
  thickness: number;
  flow: number;
  dotLength: number;
  tips: number;
  foldGlow: number;
  perspective: number;
  depthOfField: number;
  focusDepth: number;
  particles: number;
  sparkle: number;
  glow: number;
  brightness: number;
  vignette: number;
  grain: number;
  mouseInteraction: boolean;
  hover: number;
  mouseStrength: number;
  pulseOnClick: boolean;
  intro: boolean;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
}

export interface GhostFibersEngine {
  update: (settings: GhostFibersSettings) => void;
  setReducedMotion: (reduce: boolean) => void;
  resize: () => void;
  setVisible: (visible: boolean) => void;
  pointerMove: (clientX: number, clientY: number) => void;
  pointerDown: (clientX: number, clientY: number) => void;
  pointerLeave: () => void;
  visibilityChange: () => void;
  destroy: () => void;
}
