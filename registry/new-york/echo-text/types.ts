export type EchoTextDirection = 'right' | 'left' | 'up' | 'down' | 'diagonal';
export type EchoTextMode = 'entrance' | 'pointer' | 'both';
export type EchoTextTrail = 'pointer' | 'auto' | 'scroll';
export type EchoTextEase = 'linear' | 'ease-out' | 'ease-in-out' | 'snappy';
export type EchoTextStyle = 'solid' | 'outline';

export interface EchoTextProps {
  /** Text rendered by the crisp front copy and every echo. */
  text?: string;
  /** Number of ghost copies behind the front text, up to 24. */
  echoes?: number;
  /** How slowly deeper echoes catch up, and how far apart they spread along the auto trail. */
  lag?: number;
  /** Entrance spread, cursor lean, drift and burst reach, in px. */
  offset?: number;
  /** Direction the entrance trail settles in from. */
  direction?: EchoTextDirection;
  /** How much of its opacity each echo keeps from the one in front of it. */
  fade?: number;
  /** Blur on the deepest echo, in px. */
  blur?: number;
  /** Color blended into the echoes, stronger toward the back. `false` for plain echoes. */
  tint?: string | false;
  /** Two colors the echoes fade between (nearest → deepest). Replaces the tint when set. */
  echoColors?: [string, string];
  /** Filled or outlined echoes. */
  echoStyle?: EchoTextStyle;
  /** Size of the deepest echo relative to the text. */
  echoScale?: number;
  /** Whether the echoes play on entrance, run the live trail, or both. */
  mode?: EchoTextMode;
  /** What drives the live trail. */
  trail?: EchoTextTrail;
  /** Clicking the text releases a burst of expanding echoes. */
  clickBurst?: boolean;
  /** Distance in px over which the cursor pulls the text to full offset. */
  cursorRadius?: number;
  /** Entrance duration in ms. */
  duration?: number;
  /** Timing curve of the entrance. */
  ease?: EchoTextEase;
  /** Font size of the text. */
  fontSize?: string | number;
  /** Font weight of the text. */
  fontWeight?: string | number;
  /** Color of the front copy. */
  color?: string;
  class?: string;
}

export interface EchoTextVector {
  x: number;
  y: number;
}

export interface EchoTextBurst {
  start: number;
  x: number;
  y: number;
  nodes: HTMLElement[];
}

export interface EchoTextEngineOptions {
  root: HTMLElement;
  burstLayer: HTMLElement | null;
  copies: ReadonlyArray<HTMLElement | null>;
  echoCount: number;
  direction: EchoTextDirection;
  offset: number;
  cursorRadius: number;
  lag: number;
  fade: number;
  blur: number;
  echoScale: number;
  duration: number;
  ease: EchoTextEase;
  mode: EchoTextMode;
  trail: EchoTextTrail;
  clickBurst: boolean;
}
