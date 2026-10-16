export type GradientWavesQuality = 'low' | 'medium' | 'high';

export interface GradientWavesProps {
  horizonColor?: string;
  waveColor?: string;
  crestColor?: string;
  backgroundColor?: string;
  lightMode?: boolean;
  speed?: number;
  amplitude?: number;
  waveScale?: number;
  waveRatio?: number;
  swell?: number;
  turbulence?: number;
  tilt?: number;
  zoom?: number;
  height?: number;
  fogDepth?: number;
  relief?: number;
  lightAngle?: number;
  sheen?: number;
  brightness?: number;
  opacity?: number;
  grain?: number | boolean;
  quality?: GradientWavesQuality;
  intro?: boolean;
  mouseInteraction?: boolean;
  parallaxStrength?: number;
  mouseStrength?: number;
  swellOnClick?: boolean;
  paused?: boolean;
  dpr?: number;
  class?: string;
}

export type Rgb = [number, number, number];

export type Vec2 = [number, number];

export type Vec3 = [number, number, number];

export interface GradientWavesSettings {
  horizon: Rgb;
  wave: Rgb;
  crest: Rgb;
  paper: Rgb | null;
  lightMode: boolean;
  speed: number;
  amplitude: number;
  waveScale: number;
  waveRatio: number;
  swell: number;
  turbulence: number;
  tilt: number;
  zoom: number;
  height: number;
  fogDepth: number;
  relief: number;
  lightAngle: number;
  sheen: number;
  brightness: number;
  opacity: number;
  grain: number;
  steps: number;
  intro: boolean;
  mouseInteraction: boolean;
  parallaxStrength: number;
  mouseStrength: number;
  swellOnClick: boolean;
  paused: boolean;
  dpr: number;
}

export interface GradientWavesSwell {
  x: number;
  y: number;
  at: number;
}

export interface GradientWavesState {
  width: number;
  height: number;
  cssWidth: number;
  cssHeight: number;
  time: number;
  clock: number;
  last: number;
  raf: number;
  visible: boolean;
  introAt: number;
  pointer: Vec2;
  inside: boolean;
  look: Vec2;
  steer: Vec2;
  swells: GradientWavesSwell[];
  quiet: number;
  seen: GradientWavesSettings | null;
}

export type UniformName =
  | 'uResolution'
  | 'uTime'
  | 'uClock'
  | 'uAmplitude'
  | 'uWaveScale'
  | 'uWaveRatio'
  | 'uSwell'
  | 'uTurbulence'
  | 'uHeight'
  | 'uTilt'
  | 'uZoom'
  | 'uLook'
  | 'uFogDepth'
  | 'uBrightness'
  | 'uOpacity'
  | 'uGrain'
  | 'uHorizon'
  | 'uWave'
  | 'uCrest'
  | 'uBackground'
  | 'uOpaque'
  | 'uLight'
  | 'uSun'
  | 'uRelief'
  | 'uSheen'
  | 'uSteps'
  | 'uStride'
  | 'uIntro'
  | 'uSwells'
  | 'uSwellWidth';
