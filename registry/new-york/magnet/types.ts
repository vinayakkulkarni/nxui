export type MagnetAxis = 'both' | 'x' | 'y';

export interface MagnetSpring {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export interface MagnetProps {
  /** Distance in px around the element where the cursor starts to pull it. */
  padding?: number;
  /** Turns the effect off and lets the element spring back to rest. */
  disabled?: boolean;
  /** The cursor offset is divided by this value: 1 follows the cursor, higher moves less. */
  magnetStrength?: number;
  /** Caps how far the element can move from its resting place, in px. */
  maxOffset?: number;
  /** When several magnets are in range, only the nearest exclusive one is pulled. */
  exclusive?: boolean;
  /** Limits the movement to one axis. */
  axis?: MagnetAxis;
  /** Maximum 3D tilt toward the cursor, in degrees. */
  tilt?: number;
  /** Scale of the element while the cursor pulls it. */
  scale?: number;
  /** Spring that drives the movement. */
  spring?: MagnetSpring;
  /** Classes for the outer wrapper, which stays in place. */
  class?: string;
  /** Classes for the inner element that moves. */
  innerClass?: string;
}

export type MagnetMotion = {
  x: number;
  y: number;
  tiltX: number;
  tiltY: number;
  scale: number;
};

export interface MagnetPoint {
  x: number;
  y: number;
}

export interface MagnetSettings {
  padding: number;
  disabled: boolean;
  strength: number;
  maxOffset: number | undefined;
  exclusive: boolean;
  axis: MagnetAxis;
  tilt: number;
  scale: number;
  stiffness: number;
  damping: number;
  mass: number;
}

export interface MagnetEntry {
  wrapper: HTMLElement;
  settings: () => MagnetSettings;
  reduce: () => boolean;
  wake: () => void;
  active: boolean;
}

export interface MagnetReach {
  dx: number;
  dy: number;
  outside: number;
}
