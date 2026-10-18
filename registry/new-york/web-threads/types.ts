import type { HTMLAttributes } from 'vue';

export interface WebThreadsProps {
  /** Gradient across the threads, from the first thread to the last. Up to six colors. */
  colors?: string[];
  /** Hot color where threads overlap and converge. */
  coreColor?: string;
  /** Fills the canvas behind the threads. `transparent` lets the page show through. */
  backgroundColor?: string;
  /** Draws crisp ink strokes for light backgrounds instead of glowing light. */
  lightMode?: boolean;
  /** Number of threads, up to 24. */
  threadCount?: number;
  /** How fast the threads weave. */
  speed?: number;
  /** How many waves fit across the width. */
  frequency?: number;
  /** How far the threads fan away from the pinch. */
  spread?: number;
  /** How much wider each next thread swings. */
  taper?: number;
  /** Height of the weave, from bottom 0 to top 1. */
  position?: number;
  /** Where the threads converge across the width, from 0 to 1. */
  pinch?: number;
  /** Number of pinch points. More than one braids the threads. */
  nodes?: number;
  /** Rotation of the whole weave in degrees. */
  angle?: number;
  /** Strength of the light around each thread. */
  glow?: number;
  /** How quickly the glow fades. Higher is tighter. */
  falloff?: number;
  /** Width of the threads. */
  thickness?: number;
  /** Overall brightness. */
  brightness?: number;
  /** Opacity of the whole effect. */
  opacity?: number;
  /** Twists the threads in 3D. */
  depth?: number;
  /** Strength of light pulses that travel along the threads. */
  pulses?: number;
  /** Weaves each side of the pinch as a mirror. */
  mirror?: boolean;
  /** Adds a gentle, uneven sway to each thread. */
  shimmer?: boolean;
  /** Fades the threads out toward both ends. */
  fade?: number;
  /** Film grain in the light. 0 turns it off. */
  grain?: number;
  /** Draws the threads in one after another when they first come into view. */
  intro?: boolean;
  /** The strand nearest the cursor lights up while the others recede. */
  mouseInteraction?: boolean;
  /** How strongly the focused strand stands out. */
  mouseStrength?: number;
  /** Clicking sends light along every thread. */
  pulseOnClick?: boolean;
  /** Freezes the weaving. */
  paused?: boolean;
  /** Maximum device pixel ratio of the canvas. */
  dpr?: number;
  class?: HTMLAttributes['class'];
}

export type WebThreadsRgb = [number, number, number];

export interface WebThreadsSurge {
  x: number;
  direction: number;
  at: number;
}

export interface WebThreadsShape {
  nodes: number;
  pinch: number;
  mirror: boolean;
  spread: number;
  shimmer: boolean;
  frequency: number;
  count: number;
  taper: number;
  position: number;
}

export interface WebThreadsSettings extends WebThreadsShape {
  palette: WebThreadsRgb[];
  core: WebThreadsRgb;
  paper: WebThreadsRgb | null;
  lightMode: boolean;
  speed: number;
  angle: number;
  glow: number;
  falloff: number;
  thickness: number;
  brightness: number;
  opacity: number;
  depth: number;
  pulses: number;
  fade: number;
  grain: number;
  intro: boolean;
  mouseInteraction: boolean;
  mouseStrength: number;
  pulseOnClick: boolean;
  paused: boolean;
  dpr: number;
}

export type WebThreadsPreset = 'aurora' | 'helix' | 'fiber' | 'ember' | 'mono';

export type WebThreadsLook = Required<
  Omit<
    WebThreadsProps,
    | 'class'
    | 'backgroundColor'
    | 'intro'
    | 'mouseInteraction'
    | 'mouseStrength'
    | 'pulseOnClick'
    | 'paused'
    | 'dpr'
  >
>;
