export type ScannerDirection = 'vertical' | 'horizontal' | 'diagonal';

export type ScannerMouseMode = 'repel' | 'attract';

export type ScannerClickEffect = 'ping' | 'none';

export interface ScannerProps {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  sweepSpeed?: number;
  sweepWidth?: number;
  trail?: number;
  reverse?: boolean;
  scale?: number;
  frequency?: number;
  ripple?: number;
  bandDensity?: number;
  lineWidth?: number;
  glow?: number;
  scanDirection?: ScannerDirection;
  colorSpread?: number;
  brightness?: number;
  vignette?: number;
  scanline?: boolean;
  scanlineIntensity?: number;
  grain?: boolean;
  grainIntensity?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseRadius?: number;
  mouseStrength?: number;
  mouseMode?: ScannerMouseMode;
  clickEffect?: ScannerClickEffect;
  intro?: boolean;
  lightMode?: boolean;
  dpr?: number;
  class?: string;
}

export interface ScannerSettings {
  color1: string;
  color2: string;
  color3: string;
  speed: number;
  sweepSpeed: number;
  sweepWidth: number;
  trail: number;
  scale: number;
  frequency: number;
  ripple: number;
  bandDensity: number;
  lineWidth: number;
  glow: number;
  direction: number;
  colorSpread: number;
  brightness: number;
  vignette: number;
  scanline: number;
  grain: number;
  opacity: number;
  mouseInteraction: boolean;
  mouseRadius: number;
  mouseStrength: number;
  attract: boolean;
  clickEffect: ScannerClickEffect;
  intro: boolean;
  lightMode: boolean;
  dpr?: number;
}

export interface ScannerProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}
