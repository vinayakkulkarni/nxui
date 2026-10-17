/** Height, padding and font-size preset. */
export type HoldButtonSize = 'sm' | 'md' | 'lg';

/** Direction the liquid fill travels. */
export type HoldButtonDirection = 'right' | 'up';

/** Interaction phase of the button. */
export type HoldButtonPhase = 'idle' | 'holding' | 'done';

/** Input that started the current hold. */
export type HoldButtonInput = 'pointer' | 'key' | null;

/**
 * Props for the HoldButton registry component.
 * The idle label goes in the default slot; `done` and `icon` / `done-icon` slots override the props.
 */
export interface HoldButtonProps {
  /** Label that blurs in when the hold completes. */
  doneLabel?: string;
  /** Iconify name rendered before the idle label (e.g. `lucide:trash-2`). */
  icon?: string;
  /** Iconify name rendered before the done label (e.g. `lucide:check`). */
  doneIcon?: string;
  /** Button body colour. */
  backgroundColor?: string;
  /** Colour of the liquid fill, its wave, the glow and the focus ring. */
  fillColor?: string;
  /** Label colour outside the fill. */
  textColor?: string;
  /** Label colour inside the fill. */
  fillTextColor?: string;
  /** Height, padding and font size preset. */
  size?: HoldButtonSize;
  /** Corner radius in pixels. */
  radius?: number;
  /** Whether the liquid sweeps left to right or rises from the bottom. */
  fillDirection?: HoldButtonDirection;
  /** How long the press must last, in milliseconds. */
  holdTime?: number;
  /** How fast the fill snaps back on release or reset, in milliseconds. */
  releaseTime?: number;
  /** Squash of the button while a pointer holds it. 1 disables it. */
  pressScale?: number;
  /** Scrolling meniscus on the leading edge of the fill. */
  wave?: boolean;
  /** Height of the wave crests in pixels. */
  waveAmplitude?: number;
  /** Glow that charges with the hold and pulses once on completion. */
  glow?: boolean;
  /** Milliseconds the done state stays before resetting. 0 keeps it done. */
  resetAfter?: number;
  /** Dims the button and ignores input. */
  disabled?: boolean;
  /** Extra classes for the button. */
  class?: string;
}

/** Props for the internal label layer (rendered three times: base, fill and crest). */
export interface HoldButtonLabelsProps {
  phase: HoldButtonPhase;
  doneLabel: string;
  icon?: string;
  doneIcon?: string;
  fill?: boolean;
}
