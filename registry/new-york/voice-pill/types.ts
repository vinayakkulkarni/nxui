/** Capsule outline: a circle that opens into a pill, or a rounded square. */
export type VoicePillShape = 'pill' | 'rounded';

/** How a release behaves. */
export type VoicePillMode = 'auto' | 'hold' | 'toggle';

/** What drives the level meter. */
export type VoicePillSource = 'simulated' | 'mic';

/** Why listening stopped. */
export type VoicePillStopReason =
  | 'release'
  | 'tap'
  | 'key'
  | 'escape'
  | 'blur'
  | 'cancel'
  | 'disabled'
  | 'mic-denied'
  | 'unmount';

/** Payload of the `start` event. */
export interface VoicePillStartDetail {
  source: VoicePillSource;
}

/** Payload of the `stop` event. */
export interface VoicePillStopDetail {
  reason: VoicePillStopReason;
  /** Listening time in ms. */
  duration: number;
}

/** Props for the VoicePill registry component. */
export interface VoicePillProps {
  /** The waveform, the clock and the stop mark. */
  accentColor?: string;
  /** The mic at rest, and the hover wash. */
  iconColor?: string;
  /** The capsule surface. */
  background?: string;
  /** Footprint in px. The icon, the stop mark and the clock scale with it. */
  size?: number;
  /** A circle that opens into a capsule, or a rounded square. */
  shape?: VoicePillShape;
  /** The room the capsule leaves before the waveform, in px. */
  reach?: number;
  /** An elapsed clock in the capsule. */
  showTime?: boolean;
  /** A scrolling history of the level. */
  waveform?: boolean;
  /** While held, sliding left reveals Cancel and stops without a result. */
  slideToCancel?: boolean;
  /** How far left a held pointer slides before it cancels, in px. */
  cancelDistance?: number;
  /** How fast the level rises, in ms. */
  attack?: number;
  /** How long the level hangs after the sound drops, in ms. */
  release?: number;
  /** Gain on the signal before the envelope. */
  sensitivity?: number;
  /** Waveform bar height when silent, as a fraction of its box. */
  floor?: number;
  /** The capsule open and close, in ms. */
  openDuration?: number;
  /** Scale of the button while a pointer is down. */
  pressScale?: number;
  /** Auto: a tap latches, a hold stops on release. Hold: release always stops. Toggle: release never stops. */
  mode?: VoicePillMode;
  /** In auto, the press length after which a release stops instead of latching, in ms. */
  holdAfter?: number;
  /** What drives the level. Mic asks for permission on the first press. */
  reactive?: VoicePillSource;
  /** Dimmed and inert. A listening pill stops. */
  disabled?: boolean;
  /** Accessible name. The state is carried by aria-pressed. */
  ariaLabel?: string;
  /** Extra classes on the button. */
  class?: string;
}

/** Microphone graph, created on demand. */
export interface VoicePillAudio {
  ctx: AudioContext;
  stream: MediaStream | null;
  src: MediaStreamAudioSourceNode | null;
  analyser: AnalyserNode | null;
  buf: Uint8Array<ArrayBuffer> | null;
}

/** Mutable per-instance runtime state (never reactive). */
export interface VoicePillState {
  listening: boolean;
  pointerId: number | null;
  ownPress: boolean;
  downX: number;
  sliding: boolean;
  hist: number[];
  tick: number;
  acc: number;
  downAt: number;
  startedAt: number;
  raf: number;
  last: number;
  env: number;
  t0: number;
  audio: VoicePillAudio | null;
}
