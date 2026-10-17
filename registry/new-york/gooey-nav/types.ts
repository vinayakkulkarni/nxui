export type GooeyNavTheme = 'dark' | 'light';
export type GooeyNavSize = 'sm' | 'md' | 'lg';

export interface GooeyNavItem {
  label?: string;
  /** Items without an href render as buttons. */
  href?: string;
  /** Iconify name, e.g. `lucide:house`. */
  icon?: string;
}

export interface GooeyNavProps {
  items?: GooeyNavItem[];
  /** Which item starts selected. */
  initialActiveIndex?: number;
  /** Controls the selected item yourself. Use it with `@change` or `v-model:active-index`. */
  activeIndex?: number;
  theme?: GooeyNavTheme;
  /** Color of the active pill. Uses a high-contrast color for the theme when not set. */
  color?: string;
  /** Text color inside the pill. Picked from the pill color when not set. */
  activeTextColor?: string;
  /** Droplet colors. They blend as they merge. Uses the pill color when empty. */
  colors?: string[];
  size?: GooeyNavSize;
  /** Shows the frosted panel around the items. */
  frame?: boolean;
  /** Roughly how long the droplets take to reach the new item, in ms. */
  animationTime?: number;
  /** How many droplets the pill breaks into. */
  particleCount?: number;
  /** Random variation in each droplet's timing, in ms. */
  timeVariance?: number;
  /** How far the droplets scatter on the way, in px. */
  spread?: number;
  /** How readily droplets and pills melt together, 0 to 1. */
  gooeyness?: number;
  /** How much the new pill wobbles as it forms, 0 to 1. */
  wobble?: number;
  /** Soft highlight behind the hovered item. */
  hoverEffect?: boolean;
  class?: string;
}

export type GooeyRgba = [number, number, number, number];

export interface GooeySettings {
  animationTime: number;
  particleCount: number;
  timeVariance: number;
  spread: number;
  gooeyness: number;
  wobble: number;
  hoverEffect: boolean;
  pillRgb: GooeyRgba;
  tints: GooeyRgba[];
  hoverRgb: GooeyRgba;
  shadow: number;
}

export interface GooeyEngineOptions {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  list: HTMLElement;
  overlay: HTMLElement;
  fallback: HTMLElement;
  reduced: boolean;
  settings: () => GooeySettings;
}

export interface GooeyRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GooeyPillState {
  mass: number;
  scale: number;
  velocity: number;
  outgoing: number;
}

export interface GooeyDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  size: number;
  given: number;
  source: number;
  index: number;
  leave: number;
  emerged: number;
  absorbed: number;
  state: 'waiting' | 'flying' | 'absorbing';
  tint: GooeyRgba | null;
  start: number;
  duration: number;
  path: number[];
}

export interface GooeyBox {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
}

export interface GooeyBlob {
  x: number;
  y: number;
  r: number;
  tx: number;
  ty: number;
  tint: GooeyRgba | null;
}

export interface GooeyPipeline {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  position: number;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface GooeyEngine {
  go: (index: number) => void;
  settle: (index: number) => void;
  resize: () => void;
  hover: (index: number) => void;
  leave: () => void;
  refresh: () => void;
  dispose: () => void;
}
