export type ReflectiveCardTheme = 'dark' | 'light';

export interface ReflectiveCardProps {
  name?: string;
  role?: string;
  badge?: string;
  status?: string;
  statusColor?: string;
  idLabel?: string;
  idValue?: string;
  theme?: ReflectiveCardTheme;
  videoSrc?: string;
  webcam?: boolean;
  tint?: string;
  metalness?: number;
  roughness?: number;
  blurStrength?: number;
  grayscale?: number;
  warp?: number;
  warpScale?: number;
  shine?: number;
  bevel?: number;
  glare?: number;
  enableTilt?: boolean;
  tiltStrength?: number;
  intro?: boolean;
  width?: number | string;
  height?: number | string;
  radius?: number;
  class?: string;
}

export interface ReflectiveCardEmits {
  'webcam-error': [error: Error];
}

export type ReflectiveCardRgb = [number, number, number];

export interface ReflectiveCardSettings {
  tint: ReflectiveCardRgb;
  metalness: number;
  roughness: number;
  blurStrength: number;
  grayscale: number;
  warp: number;
  warpScale: number;
  shine: number;
  bevel: number;
  glare: number;
  enableTilt: boolean;
  tiltStrength: number;
  radius: number;
  theme: number;
  intro: boolean;
}

export type ReflectiveCardSourceKey = 'video' | 'cam';

export interface ReflectiveCardSource {
  element: HTMLVideoElement;
  src: string;
  time: number;
  ready: boolean;
  failed: boolean;
  width: number;
  height: number;
  mix: number;
}

export interface ReflectiveCardEnvFrame {
  width: number;
  height: number;
  scale: number;
  blur: number;
  roughness: number;
  video: ReflectiveCardSource;
  cam: ReflectiveCardSource;
}

export interface ReflectiveCardPlateFrame {
  width: number;
  height: number;
  rotateX: number;
  rotateY: number;
  capture: number;
  glare: number;
  pointerX: number;
  pointerY: number;
  settings: ReflectiveCardSettings;
}

export interface ReflectiveCardRenderer {
  upload: (key: ReflectiveCardSourceKey, element: HTMLVideoElement) => boolean;
  renderEnv: (frame: ReflectiveCardEnvFrame) => void;
  renderPlate: (frame: ReflectiveCardPlateFrame) => void;
  dispose: () => void;
}

export interface ReflectiveCardProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface ReflectiveCardTarget {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
}

export type ReflectiveCardThemeVars = Record<string, string>;

export interface ReflectiveCardLook {
  tint: string;
  metalness: number;
  roughness: number;
  blurStrength: number;
  grayscale: number;
  warp: number;
  warpScale: number;
  shine: number;
  bevel: number;
  glare: number;
}

export type ReflectiveCardPreset =
  | 'steel'
  | 'brushed'
  | 'mirror'
  | 'gold'
  | 'rose'
  | 'satin';

export type ReflectiveCardReflection = 'video' | 'studio' | 'camera';
