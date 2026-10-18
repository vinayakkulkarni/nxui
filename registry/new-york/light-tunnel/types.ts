export type LightTunnelFlowDirection = 'inward' | 'outward';

export interface LightTunnelProps {
  cableColor?: string;
  pulseColor?: string;
  tunnelColor?: string;
  tunnelOpacity?: number;
  speed?: number;
  flowDirection?: LightTunnelFlowDirection;
  pulseSpeed?: number;
  pulseLength?: number;
  pulseBlend?: number;
  pulseWidth?: number;
  pulseDensity?: number;
  cableCount?: number;
  thickness?: number;
  rimWidth?: number;
  waviness?: number;
  sway?: number;
  bend?: number;
  size?: number;
  centerX?: number;
  centerY?: number;
  glow?: number;
  fadeNear?: number;
  fadeFar?: number;
  brightness?: number;
  colorVariance?: boolean;
  grain?: boolean;
  grainIntensity?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  clickSurge?: boolean;
  intro?: boolean;
  variation?: number;
  lightMode?: boolean;
  dpr?: number;
  class?: string;
}

export interface LightTunnelSettings {
  cableColor: string;
  pulseColor: string;
  tunnelColor: string;
  tunnelOpacity: number;
  speed: number;
  flow: number;
  pulseSpeed: number;
  pulseLength: number;
  pulseBlend: number;
  pulseWidth: number;
  pulseDensity: number;
  cableCount: number;
  thickness: number;
  rimWidth: number;
  waviness: number;
  sway: number;
  bend: number;
  size: number;
  centerX: number;
  centerY: number;
  glow: number;
  fadeNear: number;
  fadeFar: number;
  brightness: number;
  colorVariance: boolean;
  grain: boolean;
  grainIntensity: number;
  opacity: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  clickSurge: boolean;
  intro: boolean;
  variation: number;
  lightMode: boolean;
  dpr?: number;
}

export interface LightTunnelProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}
