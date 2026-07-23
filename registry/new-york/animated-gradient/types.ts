export type AnimatedGradientPatternShape = 'Checks' | 'Stripes' | 'Edge';

export type AnimatedGradientPresetName =
  | 'Aurora'
  | 'Oceanic'
  | 'Amber'
  | 'Toxic'
  | 'Ghost';

export interface AnimatedGradientCustomConfig {
  preset: 'custom';
  color1: string;
  color2: string;
  color3: string;
  rotation?: number;
  proportion?: number;
  scale?: number;
  speed?: number;
  distortion?: number;
  swirl?: number;
  swirlIterations?: number;
  softness?: number;
  offset?: number;
  shape?: AnimatedGradientPatternShape;
  shapeSize?: number;
}

export interface AnimatedGradientPresetConfig {
  preset: AnimatedGradientPresetName;
  speed?: number;
}

export type AnimatedGradientConfig =
  | AnimatedGradientCustomConfig
  | AnimatedGradientPresetConfig;

export interface AnimatedGradientNoiseConfig {
  opacity: number;
  scale?: number;
}

export interface AnimatedGradientProps {
  config?: AnimatedGradientConfig;
  noise?: AnimatedGradientNoiseConfig;
  radius?: string;
  class?: string;
}

export interface AnimatedGradientPresetParams {
  color1: string;
  color2: string;
  color3: string;
  rotation: number;
  proportion: number;
  scale: number;
  speed: number;
  distortion: number;
  swirl: number;
  swirlIterations: number;
  softness: number;
  offset: number;
  shape: AnimatedGradientPatternShape;
  shapeSize: number;
}

export type AnimatedGradientUniforms = Record<string, WebGLUniformLocation>;
