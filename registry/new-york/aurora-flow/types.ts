export type AuroraFlowPreset =
  | 'ocean'
  | 'aurora'
  | 'sky'
  | 'cloud'
  | 'sunset'
  | 'midnight'
  | 'ice'
  | 'dream'
  | 'nebula'
  | 'emerald'
  | 'lavender'
  | 'mono';

export type AuroraFlowPalette = readonly [
  string,
  string,
  string,
  string,
  string,
];

export type AuroraFlowRgb = [number, number, number];

export interface AuroraFlowSettings {
  palette: AuroraFlowRgb[];
  speed: number;
  intensity: number;
  opacity: number;
  blur: number;
  contrast: number;
  brightness: number;
  grainOpacity: number;
  layers: number;
  flowScale: number;
  flowStrength: number;
  flowDirection: number;
  animationSpeed: number;
  pointerStrength: number;
  scrollInteraction: boolean;
  parallaxStrength: number;
  lighting: number;
  lightingIntensity: number;
  lightingRadius: number;
  lightingSpeed: number;
  ambientGlow: number;
  ambientOpacity: number;
  noiseOpacity: number;
  noiseScale: number;
  vignette: number;
  pointerInteraction: boolean;
}

export interface AuroraFlowProps {
  /** Up to five custom hex colors overriding the selected preset. */
  colors?: readonly string[];
  preset?: AuroraFlowPreset;
  speed?: number;
  intensity?: number;
  opacity?: number;
  blur?: number;
  contrast?: number;
  brightness?: number;
  grain?: boolean;
  grainOpacity?: number;
  layers?: number;
  flowScale?: number;
  flowStrength?: number;
  flowDirection?: number;
  animationSpeed?: number;
  pointerInteraction?: boolean;
  pointerStrength?: number;
  scrollInteraction?: boolean;
  parallaxStrength?: number;
  lighting?: boolean;
  lightingIntensity?: number;
  lightingRadius?: number;
  lightingSpeed?: number;
  ambientGlow?: boolean;
  ambientOpacity?: number;
  noise?: boolean;
  noiseOpacity?: number;
  noiseScale?: number;
  vignette?: boolean;
  vignetteStrength?: number;
  /** CSS border-radius; numbers are treated as px. */
  borderRadius?: string | number;
  class?: string;
}

export interface AuroraFlowFrame {
  settings: AuroraFlowSettings;
  time: number;
  pointerX: number;
  pointerY: number;
  pointerStrength: number;
  scroll: number;
}

export interface AuroraFlowRenderer {
  resize: (width: number, height: number) => void;
  draw: (frame: AuroraFlowFrame) => void;
  dispose: () => void;
}
