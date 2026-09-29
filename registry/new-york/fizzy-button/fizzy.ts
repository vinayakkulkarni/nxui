import type { FizzyParticle, FizzyParticleShape, FizzyShape } from './types';

const SHAPE_NAMES: FizzyParticleShape[] = [
  'circle',
  'square',
  'triangle',
  'cross',
];

/** Unit-sized particle paths, scaled per particle when drawn. */
export function createShapes(): Record<FizzyParticleShape, Path2D> {
  const circle = new Path2D();
  circle.arc(0, 0, 0.56, 0, Math.PI * 2);

  const square = new Path2D();
  square.rect(-0.5, -0.5, 1, 1);

  const triangle = new Path2D();
  triangle.moveTo(0, -0.65);
  triangle.lineTo(0.6, 0.4);
  triangle.lineTo(-0.6, 0.4);
  triangle.closePath();

  const cross = new Path2D();
  const points: Array<[number, number]> = [
    [-0.18, -0.6],
    [0.18, -0.6],
    [0.18, -0.18],
    [0.6, -0.18],
    [0.6, 0.18],
    [0.18, 0.18],
    [0.18, 0.6],
    [-0.18, 0.6],
    [-0.18, 0.18],
    [-0.6, 0.18],
    [-0.6, -0.18],
    [-0.18, -0.18],
  ];
  points.forEach(([x, y], index) => {
    if (index === 0) cross.moveTo(x, y);
    else cross.lineTo(x, y);
  });
  cross.closePath();

  return { circle, square, triangle, cross };
}

export const random = (min: number, max: number): number =>
  min + Math.random() * (max - min);

export const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

export function createParticle(shape: FizzyShape, spin: number): FizzyParticle {
  return {
    x: Math.random(),
    y: Math.random(),
    size: random(-1, 1),
    speed: random(0.04, 0.13),
    sway: random(0.4, 1.4),
    phase: random(0, Math.PI * 2),
    freq: random(0.6, 1.6),
    // Squares that never spin stay axis-aligned.
    rot: shape === 'square' && spin === 0 ? 0 : random(0, Math.PI * 2),
    spin: random(-1.2, 1.2),
    alpha: random(0.55, 1),
    shape: SHAPE_NAMES[Math.floor(Math.random() * SHAPE_NAMES.length)]!,
  };
}
