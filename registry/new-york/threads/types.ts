/** Any CSS color, or an RGB array from 0 to 1. */
export type ThreadsColor = string | number[];

export type ThreadsPreset =
  | 'silk'
  | 'classic'
  | 'rope'
  | 'strands'
  | 'contour'
  | 'curtain';

export interface ThreadsProps {
  /** Color of the threads. Any CSS color, or an RGB array from 0 to 1. */
  color?: ThreadsColor;
  /** Color the outer threads blend toward. Leave it out for a single color. */
  accentColor?: ThreadsColor;
  /** Number of threads. */
  lineCount?: number;
  /** Width of the threads. */
  thickness?: number;
  /** How much the threads soften as they separate. 0 keeps every thread crisp. */
  softness?: number;
  /** Height of the waves. */
  amplitude?: number;
  /** Spacing between the threads. 0 starts them all from a single line. */
  distance?: number;
  /** How many waves run along each thread. */
  waves?: number;
  /** Animation speed. 0 holds the threads still. */
  speed?: number;
  /** Where the first thread leaves the bundle, from 0 at the start to 1 at the end. */
  split?: number;
  /** How gradually the other threads peel away after the first one. */
  fray?: number;
  /** Direction of the threads in degrees. */
  angle?: number;
  /** How much the outer threads fade away, from 0 for all equally bright to 1. */
  taper?: number;
  /** Brightness of the threads, from 0.25 to 2. */
  brightness?: number;
  /** How far the threads move aside around the cursor, from 0 to 1. */
  parting?: number;
  /** Lets the cursor steer the waves sideways and change their height. */
  enableMouseInteraction?: boolean;
  /** Fades the edges into the page, from 0 to 1. */
  fade?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Changes the wave pattern. */
  seed?: number;
  /** Freezes the animation. */
  paused?: boolean;
  class?: string;
}

export interface ThreadsSettings {
  color: ThreadsColor;
  accentColor: ThreadsColor | undefined;
  colorKey: string;
  amplitude: number;
  distance: number;
  enableMouseInteraction: boolean;
  lineCount: number;
  thickness: number;
  softness: number;
  speed: number;
  waves: number;
  split: number;
  fray: number;
  angle: number;
  seed: number;
  parting: number;
  taper: number;
  brightness: number;
  fade: number;
  opacity: number;
  paused: boolean;
}

/** The props a demo preset sets. */
export interface ThreadsLook {
  lineCount: number;
  thickness: number;
  softness: number;
  amplitude: number;
  distance: number;
  waves: number;
  speed: number;
  split: number;
  fray: number;
  angle: number;
  taper: number;
  brightness: number;
  parting: number;
  enableMouseInteraction: boolean;
  fade: number;
  opacity: number;
  seed: number;
}

export interface ThreadsEngine {
  /** Advances one frame. Returns false once nothing is moving, so the loop can stop. */
  frame: (now: number) => boolean;
  /** Redraws with the current settings. */
  render: () => void;
  resize: (width: number, height: number) => void;
  pointerMove: (x: number, y: number, width: number, height: number) => void;
  pointerLeave: () => void;
  resetClock: () => void;
  dispose: () => void;
}
