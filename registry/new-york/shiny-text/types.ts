export type ShinyTextDirection = 'left' | 'right';

export type ShinyTextEasing = 'linear' | 'smooth' | 'snappy';

export type ShinyTextTrigger = 'loop' | 'hover' | 'view';

/** RGBA, channels 0–255 and alpha 0–1. */
export type ShinyTextRgba = [number, number, number, number];

/** Normalised settings the shine engine reads every frame. */
export interface ShinyTextSettings {
  color: string;
  shineColor: string;
  speed: number;
  delay: number;
  angle: number;
  shineWidth: number;
  softness: number;
  bands: number;
  glow: number;
  /** +1 travels right, −1 travels left. */
  sign: number;
  ease: (t: number) => number;
  trigger: ShinyTextTrigger;
  yoyo: boolean;
  followPointer: boolean;
  pauseOnHover: boolean;
  disabled: boolean;
}

export interface ShinyTextState {
  /** Band center along the travel axis (%), or null when no band is drawn. */
  pos: number | null;
  vel: number;
  phase: 'idle' | 'sweep' | 'wait' | 'follow';
  from: number;
  to: number;
  start: number;
  duration: number;
  resume: number;
  flip: boolean;
  inside: boolean;
  target: number;
  visible: boolean;
  seen: boolean;
  colors: string;
}

export interface ShinyTextEngineOptions {
  root: HTMLElement;
  glow: () => HTMLElement | null;
  reduced: boolean;
  settings: () => ShinyTextSettings;
}

export interface ShinyTextEngine {
  /** Re-read settings after a prop change, redraw and resume. */
  sync: () => void;
  dispose: () => void;
}

export interface ShinyTextProps {
  /** Text to shine. The default slot works too. */
  text?: string;
  color?: string;
  shineColor?: string;
  /** Seconds for one sweep across the text. */
  speed?: number;
  /** Seconds of rest between sweeps. */
  delay?: number;
  /** Tilt of the band of light in degrees; 90 is upright. */
  angle?: number;
  /** Band width as a percentage of the text. */
  shineWidth?: number;
  /** 0 = crisp glint, 1 = soft sheen. */
  softness?: number;
  /** 1–3 bands that follow each other. */
  bands?: number;
  /** 0–1 bloom that travels with the band. */
  glow?: number;
  direction?: ShinyTextDirection;
  easing?: ShinyTextEasing;
  trigger?: ShinyTextTrigger;
  yoyo?: boolean;
  followPointer?: boolean;
  pauseOnHover?: boolean;
  disabled?: boolean;
  class?: string;
}
