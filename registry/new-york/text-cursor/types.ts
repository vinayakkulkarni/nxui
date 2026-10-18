export type TextCursorMode = 'stamp' | 'chain' | 'ribbon';

/** Live settings the trail engine reads every frame. */
export interface TextCursorSettings {
  spacing: number;
  maxPoints: number;
  fontSize: number;
  followMouseDirection: boolean;
  randomFloat: boolean;
  exitDuration: number;
  removalInterval: number;
  shrink: number;
  fade: number;
  smoothing: number;
  popIn: boolean;
  keepUpright: boolean;
}

export interface TextCursorEngineOptions {
  root: HTMLElement;
  layer: HTMLElement;
  text: string;
  mode: TextCursorMode;
  reduced: boolean;
  settings: () => TextCursorSettings;
}

export interface TextCursorPathPoint {
  x: number;
  y: number;
  /** Distance travelled along the path up to this point. */
  s: number;
}

export interface TextCursorStamp {
  element: HTMLSpanElement;
  x: number;
  y: number;
  s: number;
  angle: number;
  born: number;
  died: number;
  seed: number;
}

export interface TextCursorProps {
  /** The text or emoji the trail is made of. */
  text?: string;
  mode?: TextCursorMode;
  /** Distance between copies (px); in ribbon mode, extra space between letters. */
  spacing?: number;
  /** Most copies shown at once in stamp and chain modes. */
  maxPoints?: number;
  followMouseDirection?: boolean;
  randomFloat?: boolean;
  /** Seconds a stamped copy takes to shrink away. */
  exitDuration?: number;
  /** ms per copy while the trail pulls back after the cursor stops. */
  removalInterval?: number;
  shrink?: number;
  fade?: number;
  smoothing?: number;
  popIn?: boolean;
  keepUpright?: boolean;
  hideCursor?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  class?: string;
}
