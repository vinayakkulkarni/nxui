/** Where the card listens for pointer movement. */
export type DecayCardScope = 'window' | 'card';

/**
 * Props for the DecayCard registry component.
 */
export interface DecayCardProps {
  /** Image URL. It fills the card like a cover. */
  image?: string;
  /** Card width in px. */
  width?: number;
  /** Card height in px. */
  height?: number;
  /** How far the image tears apart at full decay, 0–2. */
  intensity?: number;
  /** How little pointer movement it takes to reach full decay, 0–1. */
  sensitivity?: number;
  /** Decay that stays while the pointer rests on the card, 0–1. */
  hoverDecay?: number;
  /** Seconds the image takes to pull itself back together. */
  recovery?: number;
  /** Slow fraying of the edges while nobody interacts, 0–1. */
  idle?: number;
  /** Size of the tears, broad (0) to fine shards (1). */
  grain?: number;
  /** Noise layers in the tears, 1–8. */
  detail?: number;
  /** Picks a different tear pattern. */
  pattern?: number;
  /** Lets the tears churn while the card is decaying, 0–2. */
  flow?: number;
  /** Splits the color channels inside the tears, 0–2. */
  chroma?: number;
  /** How far in px the card drifts toward the pointer. */
  travel?: number;
  /** How far in degrees the card rotates as the pointer moves sideways. */
  tilt?: number;
  /** `window` follows the pointer anywhere; `card` only reacts while hovered. */
  scope?: DecayCardScope;
  /** Corner radius of the image in px. */
  radius?: number;
  /** Shows the image in grayscale. */
  grayscale?: boolean;
  /** Extra classes on the root. */
  class?: string;
}

/** Normalized settings read by the render loop. */
export interface DecayCardSettings {
  intensity: number;
  sensitivity: number;
  hoverDecay: number;
  recovery: number;
  frequency: number;
  octaves: number;
  seed: number;
  idle: number;
  flow: number;
  chroma: number;
  travel: number;
  tilt: number;
  scope: DecayCardScope;
  radius: number;
  grayscale: boolean;
}

/** Uniform names used by the decay shader. */
export type DecayCardUniform =
  | 'uImage'
  | 'uSize'
  | 'uImageSize'
  | 'uUnit'
  | 'uScale'
  | 'uIdle'
  | 'uFrequency'
  | 'uOctaves'
  | 'uSeed'
  | 'uRadius'
  | 'uTime'
  | 'uFlow'
  | 'uChroma'
  | 'uGray'
  | 'uReady';
