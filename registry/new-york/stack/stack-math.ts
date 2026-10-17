import type {
  StackLayout,
  StackPlacement,
  StackSample,
  StackSpringKind,
} from './types';

export const STACK_DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format',
];

/** Transform origin (0–1) of every card per layout. */
export const STACK_ORIGINS: Record<StackLayout, [number, number]> = {
  fan: [0.9, 0.9],
  cascade: [0.5, 0.5],
  deck: [0.5, 0],
  pile: [0.5, 0.5],
};

/** Default throw direction per layout (pile picks a seeded random one). */
export const STACK_EXITS: Partial<Record<StackLayout, [number, number]>> = {
  fan: [1, -0.3],
  cascade: [0.8, 0.6],
  deck: [0, 1],
};

export const STACK_SHADOW =
  '0 14px 34px -10px rgba(0, 0, 0, 0.45), 0 3px 8px -2px rgba(0, 0, 0, 0.18)';
export const STACK_CLICK_SLOP = 6;
export const STACK_FLICK_SPEED = 650;
export const STACK_LEAN_SPEED = 1300;
export const STACK_LEAN_REACH = 260;
export const STACK_PRESS_SCALE = 1.035;

export const STACK_SPRINGS: Record<StackSpringKind, [number, number]> = {
  place: [260, 24],
  settle: [320, 34],
  tuck: [240, 28],
  face: [240, 30],
  lean: [240, 28],
  press: [420, 34],
  fling: [650, 42],
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Deterministic hash noise in [0, 1). */
export function noise(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function placement(
  layout: StackLayout,
  position: number,
  card: number,
  spread: number,
  depth: number,
): StackPlacement {
  if (layout === 'cascade') {
    return {
      x: -position * spread * 28,
      y: -position * spread * 28,
      rotate: 0,
      scale: 1 - position * depth * 0.07,
    };
  }
  if (layout === 'deck') {
    return {
      x: 0,
      y: -position * spread * 32,
      rotate: 0,
      scale: 1 - position * depth * 0.1,
    };
  }
  if (layout === 'pile') {
    return {
      x: (noise(card + 1) - 0.5) * spread * 56,
      y: (noise(card + 2) - 0.5) * spread * 44,
      rotate: (noise(card + 3) - 0.5) * spread * 40,
      scale: 1 - position * depth * 0.03,
    };
  }
  return {
    x: 0,
    y: 0,
    rotate: position * spread * 8,
    scale: 1 - position * depth * 0.12,
  };
}

/** Pointer velocity (px/s) over the last 100ms of samples. */
export function releaseVelocity(
  samples: StackSample[],
  time: number,
): [number, number] {
  const recent = samples.filter((sample) => time - sample[2] <= 100);
  if (recent.length < 2) return [0, 0];
  const first = recent[0]!;
  const last = recent[recent.length - 1]!;
  const elapsed = Math.max((last[2] - first[2]) / 1000, 0.008);
  return [(last[0] - first[0]) / elapsed, (last[1] - first[1]) / elapsed];
}
