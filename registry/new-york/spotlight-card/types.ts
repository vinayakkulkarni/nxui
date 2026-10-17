export interface BeamSpotlightCardProps {
  beamColor?: string;
  beamWidth?: number;
  borderRadius?: number;
  class?: string;
}

export interface GradientFollowCardProps {
  gradientColors?: [string, string, string];
  borderRadius?: number;
  class?: string;
}

export interface MultiSpotlightCardProps {
  colors?: string[];
  borderRadius?: number;
  class?: string;
}

export interface TiltSpotlightCardProps {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  borderRadius?: number;
  glareOpacity?: number;
  spotlightColor?: string;
  class?: string;
}

export type SpotlightCardShape = 'circle' | 'beam';

export type SpotlightCardTheme = 'dark' | 'light';

export interface SpotlightCardProps {
  spotlightColor?: string;
  intensity?: number;
  spotlightSize?: number;
  softness?: number;
  shape?: SpotlightCardShape;
  borderGlow?: number;
  proximity?: number;
  smoothing?: number;
  ambient?: boolean;
  flare?: boolean;
  grain?: number;
  theme?: SpotlightCardTheme;
  class?: string;
}

export interface SpotlightCardPalette {
  surface: string;
  border: string;
  shadow: string;
  light: string;
  fill: number;
  edge: number;
}

export interface SpotlightCardSettings {
  shape: SpotlightCardShape;
  fill: string;
  edge: string;
  size: number;
  intensity: number;
  borderGlow: number;
  proximity: number;
  smoothing: number;
  ambient: boolean;
  flare: boolean;
  grain: number;
}
