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
