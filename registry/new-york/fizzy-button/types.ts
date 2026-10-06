export type FizzyShape = 'mixed' | 'circle' | 'square' | 'triangle' | 'cross';

export type FizzyParticleShape = Exclude<FizzyShape, 'mixed'>;

export type FizzyTrigger = 'hover' | 'toggle';

export interface FizzyParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  sway: number;
  phase: number;
  freq: number;
  rot: number;
  spin: number;
  alpha: number;
  shape: FizzyParticleShape;
}

export interface FizzyPoint {
  x: number;
  y: number;
}

/** Per-frame state, kept outside Vue reactivity. */
export interface FizzyState {
  w: number;
  h: number;
  cx: number;
  cy: number;
  radius: number;
  pointer: FizzyPoint | null;
  hovered: boolean;
  focused: boolean;
  down: boolean;
  warm: boolean;
  visible: boolean;
  fill: number;
  from: number;
  target: number;
  started: number;
  fadeUntil: number;
  time: number;
}

export interface FizzyButtonProps {
  label?: string;
  /** `hover` fills while hovered; `toggle` fills on click and stays. */
  trigger?: FizzyTrigger;
  /** Distance in px beyond the button where particles appear. */
  proximity?: number;
  /** Extra px beyond `proximity` where the animation starts running. */
  wakeMargin?: number;
  shape?: FizzyShape;
  count?: number;
  size?: number;
  /** Size spread between particles, 0 to 0.9. */
  variation?: number;
  drift?: number;
  spin?: number;
  /** Size and opacity boost at the rising fill edge. */
  crest?: number;
  restAlpha?: number;
  activeAlpha?: number;
  idleSpeed?: number;
  activeSpeed?: number;
  /** Seconds for the fill to rise or fall. */
  fillDuration?: number;
  /** Shows the proximity and wake rings. */
  debug?: boolean;
  class?: string;
}
