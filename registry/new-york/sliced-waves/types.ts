export interface SlicedWavesProps {
  color1?: string;
  color2?: string;
  color3?: string;
  ribbons?: number;
  spacing?: number;
  barWidth?: number;
  ribbonHeight?: number;
  spread?: number;
  amplitude?: number;
  frequency?: number;
  speed?: number;
  perspective?: number;
  curve?: number;
  blur?: number;
  glow?: number;
  brightness?: number;
  position?: number;
  rotation?: number;
  slices?: number;
  grain?: number;
  mouseInteraction?: boolean;
  intro?: boolean;
  fade?: number;
  opacity?: number;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
  class?: string;
}

export type SlicedWavesUniformName =
  | 'uView'
  | 'uAngle'
  | 'uGlow'
  | 'uSlices'
  | 'uBase'
  | 'uHalfBar'
  | 'uScale'
  | 'uLight'
  | 'uResolution'
  | 'uExposure'
  | 'uGrain'
  | 'uTime'
  | 'uFade'
  | 'uOpacity'
  | 'uLightMode';

export type SlicedWavesRgb = [number, number, number];

export interface SlicedWavesSettings {
  color1: string;
  color2: string;
  color3: string;
  ribbons: number;
  spacing: number;
  barWidth: number;
  ribbonHeight: number;
  spread: number;
  amplitude: number;
  frequency: number;
  speed: number;
  perspective: number;
  curve: number;
  blur: number;
  glow: number;
  brightness: number;
  position: number;
  rotation: number;
  slices: number;
  grain: number;
  mouseInteraction: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr: number | undefined;
}

export interface SlicedWavesBar {
  i: number;
  x: number;
  Z: number;
  sx: number;
  scale: number;
}

export interface SlicedWavesView {
  bars: SlicedWavesBar[];
  halfBar: number;
  centerScale: number;
}

export interface SlicedWavesRenderer {
  refresh: () => void;
  resize: () => void;
  pointerMove: (event: PointerEvent) => void;
  pointerLeave: () => void;
  visibilityChange: () => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
}
