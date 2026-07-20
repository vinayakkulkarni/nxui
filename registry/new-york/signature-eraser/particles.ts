import type {
  SignatureEraserEffect,
  SignatureEraserPoint,
  SignatureEraserStroke,
} from './types';

/**
 * A single physics particle spawned from an ink sample.
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
  r: number;
  life: number;
  maxLife: number;
  delay: number;
}

export const EFFECT_LABELS: Record<SignatureEraserEffect, string> = {
  'thanos-snap': 'Thanos Snap',
  'black-hole': 'Black Hole',
  explosion: 'Explosion',
  'wind-sweep': 'Wind Sweep',
  rewind: 'Rewind',
};

export const EFFECT_ORDER: SignatureEraserEffect[] = [
  'thanos-snap',
  'black-hole',
  'explosion',
  'wind-sweep',
  'rewind',
];

/**
 * Sample ink points from a stroke path at a fixed spacing so dense strokes
 * don't over-spawn and thin strokes still read as continuous ink.
 */
/**
 * Spawn physics particles for every sampled ink point, seeded by effect.
 */
export function spawnParticles(
  points: SignatureEraserPoint[],
  effect: SignatureEraserEffect,
  width: number,
  height: number,
): Particle[] {
  const cx = width / 2;
  const cy = height / 2;
  return points.map((p) => {
    const base: Particle = {
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      ox: p.x,
      oy: p.y,
      r: 0.8 + Math.random() * 1.6,
      life: 0,
      maxLife: 90 + Math.random() * 60,
      delay: 0,
    };
    switch (effect) {
      case 'thanos-snap':
        base.vx = (Math.random() - 0.5) * 2.4;
        base.vy = -(0.4 + Math.random() * 2.2);
        base.delay = Math.random() * 35;
        base.maxLife = 80 + Math.random() * 70;
        break;
      case 'black-hole': {
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        // Tangential orbit + slight inward pull.
        const tx = -dy / dist;
        const ty = dx / dist;
        const speed = 1 + Math.random() * 1.4;
        base.vx = tx * speed + (dx / dist) * 0.35;
        base.vy = ty * speed + (dy / dist) * 0.35;
        base.maxLife = 100 + Math.random() * 60;
        break;
      }
      case 'explosion': {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.max(8, Math.hypot(dx, dy));
        const speed = 2 + Math.random() * 6;
        base.vx = (dx / dist) * speed + (Math.random() - 0.5) * 1.5;
        base.vy = (dy / dist) * speed + (Math.random() - 0.5) * 1.5;
        base.maxLife = 70 + Math.random() * 50;
        break;
      }
      case 'wind-sweep':
        base.vx = 2.5 + Math.random() * 4.5;
        base.vy = (Math.random() - 0.5) * 1.8 - 0.4;
        base.delay = Math.random() * 25;
        base.maxLife = 90 + Math.random() * 60;
        break;
      case 'rewind':
        base.maxLife = 1; // handled by the rewind tween, not physics
        break;
    }
    return base;
  });
}

/**
 * Advance one particle by one frame. Returns false once it should be culled.
 */
export function stepParticle(
  p: Particle,
  effect: SignatureEraserEffect,
  width: number,
  height: number,
  frame: number,
): boolean {
  if (frame < p.delay) return true;
  p.life += 1;
  const cx = width / 2;
  const cy = height / 2;
  switch (effect) {
    case 'thanos-snap':
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.015; // gentle gravity drift upward-drag
      p.x += p.vx;
      p.y += p.vy;
      break;
    case 'black-hole': {
      const dx = cx - p.x;
      const dy = cy - p.y;
      const dist = Math.max(2, Math.hypot(dx, dy));
      const pull = 46 / (dist + 18);
      const tx = -dy / dist;
      const ty = dx / dist;
      p.vx = (p.vx + tx * pull * 0.55 + (dx / dist) * pull * 0.3) * 0.96;
      p.vy = (p.vy + ty * pull * 0.55 + (dy / dist) * pull * 0.3) * 0.96;
      p.x += p.vx;
      p.y += p.vy;
      if (dist < 6) return false;
      break;
    }
    case 'explosion':
      p.vx *= 0.965;
      p.vy = p.vy * 0.965 + 0.06; // gravity
      p.x += p.vx;
      p.y += p.vy;
      break;
    case 'wind-sweep':
      p.vx *= 1.012;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy + Math.sin((p.life + p.ox) * 0.08) * 0.35;
      break;
    case 'rewind':
      return false;
  }
  return p.life < p.maxLife;
}

/**
 * Alpha of a particle for fade-out rendering.
 */
export function particleAlpha(p: Particle, frame: number): number {
  if (frame < p.delay) return 0;
  const t = p.life / p.maxLife;
  return Math.max(0, 1 - t * t);
}

/**
 * Built-in cursive signature path, authored in a 560×320 design box and
 * scaled to the canvas at draw time. Flowing loops that read as a signature.
 */
export const DEFAULT_SIGNATURE: SignatureEraserStroke[] = [
  {
    // sweeping "S" loop with a tail
    points: [
      { x: 148, y: 86 },
      { x: 120, y: 76 },
      { x: 92, y: 82 },
      { x: 72, y: 104 },
      { x: 66, y: 132 },
      { x: 74, y: 158 },
      { x: 96, y: 176 },
      { x: 122, y: 190 },
      { x: 140, y: 208 },
      { x: 144, y: 230 },
      { x: 132, y: 252 },
      { x: 106, y: 262 },
      { x: 78, y: 258 },
      { x: 56, y: 244 },
      { x: 52, y: 226 },
    ],
  },
  {
    // cross-stroke through the S
    points: [
      { x: 44, y: 176 },
      { x: 92, y: 166 },
      { x: 150, y: 162 },
      { x: 208, y: 166 },
    ],
  },
  {
    // flowing middle run "i/a" humps
    points: [
      { x: 210, y: 166 },
      { x: 228, y: 138 },
      { x: 240, y: 118 },
      { x: 252, y: 138 },
      { x: 258, y: 168 },
      { x: 268, y: 188 },
      { x: 284, y: 192 },
      { x: 300, y: 182 },
      { x: 312, y: 160 },
      { x: 322, y: 138 },
      { x: 334, y: 150 },
      { x: 340, y: 176 },
      { x: 352, y: 196 },
    ],
  },
  {
    // dot over the "i"
    points: [{ x: 236, y: 96 }],
  },
  {
    // long underline flourish
    points: [
      { x: 60, y: 288 },
      { x: 160, y: 300 },
      { x: 280, y: 302 },
      { x: 400, y: 292 },
      { x: 470, y: 272 },
      { x: 490, y: 250 },
    ],
  },
];
