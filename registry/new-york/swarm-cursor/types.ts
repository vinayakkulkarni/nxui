import type { CSSProperties } from 'vue';

export type SwarmShape = 'dot' | 'streak' | 'square';
export type SwarmIdle = 'roam' | 'gather' | 'hide';
export type SwarmClickEffect = 'burst' | 'pulse' | 'none';

export interface SwarmCursorProps {
  count?: number;
  size?: number;
  shape?: SwarmShape;
  color?: string;
  accentColor?: string;
  spread?: number;
  speed?: number;
  swirl?: number;
  tail?: number;
  trail?: number;
  wander?: number;
  depth?: number;
  targets?: string;
  idle?: SwarmIdle;
  clickEffect?: SwarmClickEffect;
  hideCursor?: boolean;
  intro?: boolean;
  enabled?: boolean;
  lightMode?: boolean;
  dpr?: number;
  class?: string;
  style?: CSSProperties;
}

// Fully-resolved settings after defaults and clamping are applied.
export interface SwarmCursorSettings {
  count: number;
  size: number;
  shape: number;
  color: string;
  accentColor: string;
  spread: number;
  speed: number;
  swirl: number;
  tail: number;
  trail: number;
  wander: number;
  depth: number;
  targets: string;
  idle: SwarmIdle;
  clickEffect: SwarmClickEffect;
  hideCursor: boolean;
  intro: boolean;
  enabled: boolean;
  lightMode: boolean;
  dpr: number | undefined;
}

export interface SwarmEngineOptions {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  settings: () => SwarmCursorSettings;
  reduce: () => boolean;
  setHidden: (value: boolean) => void;
}

export interface SwarmEngine {
  resize: () => void;
  frame: (now: number) => boolean;
  resetClock: () => void;
  pointerMove: (event: PointerEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerUp: (event: PointerEvent) => void;
  pointerLeave: () => void;
  dispose: () => void;
}
