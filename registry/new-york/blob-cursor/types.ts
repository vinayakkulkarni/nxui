export type BlobCursorMaterial = 'chrome' | 'jelly' | 'pearl' | 'ink';

export type BlobCursorBlend =
  | 'normal'
  | 'difference'
  | 'exclusion'
  | 'multiply'
  | 'screen'
  | 'overlay';

export interface BlobCursorProps {
  material?: BlobCursorMaterial;
  color?: string;
  size?: number;
  morph?: number;
  morphSpeed?: number;
  depth?: number;
  trail?: number;
  lag?: number;
  goo?: number;
  stretch?: number;
  wobble?: number;
  drip?: number;
  splash?: boolean;
  splashCount?: number;
  splashSpeed?: number;
  splashSize?: number;
  splashGravity?: number;
  regrow?: number;
  shine?: number;
  shadow?: boolean;
  blend?: BlobCursorBlend;
  hideCursor?: boolean;
  class?: string;
}

export interface BlobCursorSettings {
  material: BlobCursorMaterial;
  color: string;
  size: number;
  morph: number;
  morphSpeed: number;
  depth: number;
  trail: number;
  lag: number;
  goo: number;
  stretch: number;
  wobble: number;
  drip: number;
  splash: boolean;
  splashCount: number;
  splashSpeed: number;
  splashSize: number;
  splashGravity: number;
  regrow: number;
  shine: number;
  shadow: boolean;
  blend: BlobCursorBlend;
  hideCursor: boolean;
}

export interface BlobBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export interface BlobCoreBall extends BlobBody {
  spread: number;
  angle: number;
  shape: number;
  tx: number;
  ty: number;
  grow: number;
}

export interface BlobDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  cx: number;
  cy: number;
  r: number;
  share: number;
  age: number;
  life: number;
  drag: number;
  free: boolean;
  sink: number;
}

/** [ax, ay, bx, by, r1, r2, blend] — one capsule of the signed distance field. */
export type BlobPart = [number, number, number, number, number, number, number];

export interface BlobPointerSample {
  clientX: number;
  clientY: number;
  pointerType: string;
  target: EventTarget | null;
}

export interface BlobEngineOptions {
  root: HTMLElement;
  getSettings: () => BlobCursorSettings;
  isReducedMotion: () => boolean;
  isVisible: () => boolean;
}

export interface BlobEngine {
  resize: () => void;
  apply: () => void;
  start: () => void;
  onMove: (event: BlobPointerSample) => void;
  onDown: (event: BlobPointerSample) => void;
  onUp: (event: BlobPointerSample) => void;
  onLeave: (relatedTarget: EventTarget | null) => void;
  onBlur: () => void;
  dispose: () => void;
}
