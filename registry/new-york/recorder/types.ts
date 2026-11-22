import type { AnimationPlaybackControls, VariantType } from 'motion-v';

/** Variants keyed by label; functions receive the roll direction as `custom`. */
export type RecorderVariants = Record<
  string,
  VariantType | ((dir: number) => VariantType)
>;

export type RecorderTheme = 'light' | 'dark';

/** idle → recording ⇄ paused → saved ⇄ playing */
export type RecorderMode =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'saved'
  | 'playing';

export type RecorderGlyph = 'rec' | 'pause' | 'play' | 'stop' | 'clear';

export type RecorderClick = 'down' | 'up' | 'tick';

export interface RecorderProps {
  /** How wide the card is drawn, in px. It shrinks further to fit a small screen. */
  size?: number;
  /** Tactile clicks on every press and a tick as you scrub, synthesised at play time. */
  sound?: boolean;
  /** Take the keyboard as soon as it mounts, so Space and S work straight away. */
  autoFocus?: boolean;
  /** `dark` graphite, or `light` porcelain. The red key is the same in both. */
  theme?: RecorderTheme;
  class?: string;
}

/** One bar of the take: its target height and the time it was born (ms). */
export interface RecorderSample {
  h: number;
  t: number;
}

/** A pooled bar element and the last values written to it. */
export interface RecorderPoolBar {
  el: HTMLElement | null;
  on: boolean;
  tf: string;
  op: number;
  used: boolean;
}

/** A dot of the empty track and its last written opacity. */
export interface RecorderTrackDot {
  el: HTMLElement | null;
  x: number;
  a: number;
}

/** One digit cell of the HH:MM:SS timer. `key` changes on every roll. */
export interface RecorderDigit {
  ch: string;
  key: number;
}

/** A cell of the rendered timer: a rolling digit, or a colon. */
export interface RecorderTimerCell {
  colon: boolean;
  ch: string;
  key: number;
}

/** The engine's running state, mutated every frame (not reactive). */
export interface RecorderState {
  elapsed: number;
  cursor: number;
  nextBarAt: number;
  view: number;
}

/** The generated "speech" signal: words with a rise-and-fall envelope, then pauses. */
export interface RecorderVoice {
  i: number;
  len: number;
  peak: number;
  speaking: boolean;
}

/** A hold-to-clear in progress on the side key. */
export interface RecorderHold {
  anim: AnimationPlaybackControls;
  done: boolean;
  /** Driven from code (no sound, no haptics). */
  quiet: boolean;
}

export interface RecorderDrag {
  x: number;
  was: boolean;
}

export interface RecorderClicker {
  click: (kind?: RecorderClick, gain?: number) => void;
  dispose: () => void;
}
