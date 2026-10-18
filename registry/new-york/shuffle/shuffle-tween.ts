import type {
  ShuffleEase,
  ShuffleEaseFn,
  ShuffleTimelineOptions,
  ShuffleTween,
} from './types';

const linear: ShuffleEaseFn = (t) => t;

const BASES: Record<string, (param: number) => ShuffleEaseFn> = {
  power0: () => linear,
  power1: () => (t) => t ** 2,
  quad: () => (t) => t ** 2,
  power2: () => (t) => t ** 3,
  cubic: () => (t) => t ** 3,
  power3: () => (t) => t ** 4,
  quart: () => (t) => t ** 4,
  power4: () => (t) => t ** 5,
  quint: () => (t) => t ** 5,
  sine: () => (t) => 1 - Math.cos((t * Math.PI) / 2),
  expo: () => (t) => (t === 0 ? 0 : 2 ** (10 * (t - 1))),
  circ: () => (t) => 1 - Math.sqrt(1 - t * t),
  back: (s) => (t) => t * t * ((s + 1) * t - s),
};

/**
 * Turns a GSAP-style ease name ('power3.out', 'back.out(2)', 'expo.inOut',
 * 'none') into an easing function. Unknown names fall back to power3.out.
 */
export function parseEase(ease: ShuffleEase): ShuffleEaseFn {
  if (typeof ease === 'function') return ease;
  const value = ease.trim();
  if (value === '' || value === 'none' || value === 'linear') return linear;
  const match = /^([a-z]+\d?)(?:\.(in|out|inOut))?(?:\(([\d.]+)\))?$/.exec(
    value,
  );
  const base = match?.[1] ?? 'power3';
  const mode = match?.[2] ?? 'out';
  const param = match?.[3] ? Number.parseFloat(match[3]) : 1.70158;
  const make = BASES[base] ?? BASES.power3;
  const easeIn = make ? make(param) : linear;
  const curve: ShuffleEaseFn =
    mode === 'in'
      ? easeIn
      : mode === 'inOut'
        ? (t) => (t < 0.5 ? easeIn(t * 2) / 2 : 1 - easeIn((1 - t) * 2) / 2)
        : (t) => 1 - easeIn(1 - t);
  return (t) => (t <= 0 ? 0 : t >= 1 ? 1 : curve(t));
}

let probe: CanvasRenderingContext2D | null = null;

/** Resolves any CSS color to [r, g, b, a] using a 1px canvas. */
export function parseColor(value: string): [number, number, number, number] {
  if (!probe) probe = document.createElement('canvas').getContext('2d');
  if (!probe) return [0, 0, 0, 1];
  probe.fillStyle = '#000';
  probe.fillStyle = value;
  const normalized = String(probe.fillStyle);
  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1);
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
      1,
    ];
  }
  const parts = normalized.match(/[\d.]+/g) ?? [];
  return [
    Number(parts[0] ?? 0),
    Number(parts[1] ?? 0),
    Number(parts[2] ?? 0),
    Number(parts[3] ?? 1),
  ];
}

export function mixColor(
  from: [number, number, number, number],
  to: [number, number, number, number],
  t: number,
): string {
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  const a = from[3] + (to[3] - from[3]) * t;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

export function createTween(
  offset: number,
  duration: number,
  ease: ShuffleEaseFn,
  update: (progress: number) => void,
  hooks: { onStart?: () => void; onComplete?: () => void } = {},
): ShuffleTween {
  return {
    offset,
    duration,
    ease,
    update,
    onStart: hooks.onStart,
    onComplete: hooks.onComplete,
    started: false,
    done: false,
  };
}

/**
 * A tiny GSAP-like timeline: tweens placed at offsets (s), optional start
 * delay and infinite repeat with a repeat delay. Advanced by `tick(dt)`.
 */
export class ShuffleTimeline {
  tweens: ShuffleTween[] = [];
  time: number;
  finished = false;
  private readonly options: ShuffleTimelineOptions;

  constructor(options: ShuffleTimelineOptions = {}) {
    this.options = options;
    this.time = -(options.delay ?? 0);
  }

  add(tweens: ShuffleTween[]) {
    this.tweens.push(...tweens);
  }

  get duration(): number {
    let end = 0;
    for (const tween of this.tweens) {
      end = Math.max(end, tween.offset + tween.duration);
    }
    return end;
  }

  private render(time: number) {
    for (const tween of this.tweens) {
      if (tween.done || time < tween.offset) continue;
      if (!tween.started) {
        tween.started = true;
        tween.onStart?.();
      }
      const local = Math.min(time - tween.offset, tween.duration);
      const progress = tween.duration > 0 ? local / tween.duration : 1;
      tween.update(tween.ease(progress));
      if (progress >= 1) {
        tween.done = true;
        tween.onComplete?.();
      }
    }
  }

  tick(dt: number) {
    if (this.finished) return;
    this.time += dt;
    if (this.time < 0) return;
    const total = this.duration;
    if (!this.options.repeat) {
      this.render(Math.min(this.time, total));
      if (this.time >= total) {
        this.finished = true;
        this.options.onComplete?.();
      }
      return;
    }
    this.render(Math.min(this.time, total));
    const cycle = total + (this.options.repeatDelay ?? 0);
    if (cycle > 0 && this.time >= cycle) {
      this.time -= cycle;
      for (const tween of this.tweens) {
        tween.started = false;
        tween.done = false;
      }
      this.options.onRepeat?.();
      this.render(this.time);
    }
  }
}
