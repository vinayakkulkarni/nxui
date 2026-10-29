export type JoystickDirection = 'up' | 'down' | 'left' | 'right';

export type JoystickTheme = 'light' | 'dark';

/** Which input is steering the stick right now. Only one at a time. */
export type JoystickSource = 'pointer' | 'keys' | 'pad';

export interface JoystickProps {
  /** The size of one art pixel, in CSS pixels. It shrinks to fit a narrow container. */
  pixel?: number;
  /** Microswitch clicks, the gate thock and the spring's twang. */
  sound?: boolean;
  theme?: JoystickTheme;
  /** Take keyboard focus on mount, so the arrow keys work straight away. */
  autoFocus?: boolean;
  /** Accessible name of the stick. */
  label?: string;
  class?: string;
}

export interface JoystickSpring {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass?: number;
}

/** Tests whether an art-pixel centre lies inside a shape. */
export type JoystickInside = (x: number, y: number) => boolean;

/** Picks the packed RGBA colour of one art pixel. */
export type JoystickPaint = (x: number, y: number) => number;

export interface JoystickRenderer {
  /** jx, jy inside the gate (about −1…1); +x is right, +y toward the player. */
  draw: (jx: number, jy: number) => void;
}

export interface JoystickToneOptions {
  type?: OscillatorType;
  freq: number;
  to?: number;
  t: number;
  dur: number;
  gain: number;
  release?: number;
}

export interface JoystickHitOptions {
  t: number;
  dur: number;
  gain: number;
  type?: BiquadFilterType;
  freq?: number;
  q?: number;
}

export interface JoystickAudioGraph {
  ctx: AudioContext;
  bus: GainNode;
  noise: AudioBuffer;
}

export interface JoystickSfx {
  unlock: () => void;
  warm: () => void;
  setMuted: (muted: boolean) => void;
  click: (make: boolean) => void;
  thock: () => void;
  boing: (strength?: number) => void;
  tick: () => void;
  close: () => void;
}

export interface JoystickHaptics {
  unlock: () => void;
  pulse: (ms?: number, power?: number) => void;
  dispose: () => void;
}
