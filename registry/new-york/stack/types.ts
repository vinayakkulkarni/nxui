import type { MotionValue } from 'motion-v';

export type StackLayout = 'fan' | 'cascade' | 'deck' | 'pile';

export interface StackProps {
  /** Image URLs for the cards, top first. Ignored when the default slot has content. */
  cards?: string[];
  layout?: StackLayout;
  visible?: number;
  spread?: number;
  depth?: number;
  radius?: number;
  frame?: number;
  frameColor?: string;
  shadow?: boolean;
  tilt?: number;
  threshold?: number;
  speed?: number;
  sendToBackOnClick?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  class?: string;
}

export interface StackPlacement {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

export type StackSpringKind =
  | 'place'
  | 'settle'
  | 'tuck'
  | 'face'
  | 'lean'
  | 'press'
  | 'fling';

export interface StackSettings {
  layout: StackLayout;
  visible: number;
  spread: number;
  depth: number;
  tilt: number;
  threshold: number;
  speed: number;
  sendToBackOnClick: boolean;
  count: number;
  reduceMotion: boolean;
}

export interface StackCardValues {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
  spin: MotionValue<number>;
  lift: MotionValue<number>;
  grabX: MotionValue<number>;
  grabY: MotionValue<number>;
  z: MotionValue<number>;
  opacity: MotionValue<number>;
  shade: MotionValue<number>;
}

/** [clientX, clientY, timeStamp] */
export type StackSample = [number, number, number];

export interface StackDrag {
  card: number;
  id: number;
  element: HTMLElement;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  idle: ReturnType<typeof setTimeout> | undefined;
  moved: boolean;
  progress: number;
  samples: StackSample[];
}

export interface StackPlaceOptions {
  delay?: number;
  lift?: number;
  kind?: StackSpringKind;
  velocity?: [number, number] | null;
  keepZ?: boolean;
}

export interface StackPlaceAllOptions {
  stagger?: number;
  lift?: number;
  released?: number;
  velocity?: [number, number] | null;
  kind?: StackSpringKind;
}

export interface StackFlight {
  turned: boolean;
}
