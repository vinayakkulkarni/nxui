import type {
  ClickSparkBurst,
  ClickSparkEase,
  ClickSparkEasing,
  ClickSparkSettings,
  ClickSparkShape,
  Spark,
} from './types';

export const EASINGS: Record<ClickSparkEasing, ClickSparkEase> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => 1 - Math.pow(1 - t, 3),
  'ease-in-out': (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  spring: (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2),
};

export const SHAPES: ClickSparkShape[] = ['line', 'streak', 'dot', 'star'];
export const MAX_BURSTS = 32;
const GRAVITY = 500;
const REDUCED_MS = 320;
const FALLBACK_COLORS = ['#ffffff'];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

export function toColors(value: string | string[]): string[] {
  const list = (Array.isArray(value) ? value : [value]).filter(Boolean);
  return list.length ? list : FALLBACK_COLORS;
}

function starPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
) {
  const pinch = radius * 0.16;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(rotation) * radius, y + Math.sin(rotation) * radius);
  for (let i = 1; i <= 4; i++) {
    const a = rotation + (i * Math.PI) / 2;
    const mid = a - Math.PI / 4;
    ctx.quadraticCurveTo(
      x + Math.cos(mid) * pinch,
      y + Math.sin(mid) * pinch,
      x + Math.cos(a) * radius,
      y + Math.sin(a) * radius,
    );
  }
  ctx.closePath();
}

/** RGB channels of any CSS color via the canvas color parser. */
export function channels(
  ctx: CanvasRenderingContext2D,
  color: string,
): [number, number, number] {
  ctx.fillStyle = color;
  const normal = String(ctx.fillStyle);
  const hex = /^#([0-9a-f]{6})$/i.exec(normal);
  if (hex?.[1]) {
    const value = Number.parseInt(hex[1], 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(normal);
  if (rgb?.[1]) {
    const parts = rgb[1].split(',').map((part) => Number.parseFloat(part));
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  }
  return [0, 0, 0];
}

export function drop(s: ClickSparkSettings, seconds: number): number {
  return 0.5 * s.gravity * GRAVITY * seconds * seconds;
}

function position(
  burst: ClickSparkBurst,
  spark: Spark,
  distance: number,
  seconds: number,
): [number, number] {
  return [
    burst.x + Math.cos(spark.angle) * distance,
    burst.y + Math.sin(spark.angle) * distance + drop(burst.settings, seconds),
  ];
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Draws one spark; returns false once its life is over. */
export function drawSpark(
  ctx: CanvasRenderingContext2D,
  burst: ClickSparkBurst,
  spark: Spark,
  elapsed: number,
  reduced: boolean,
): boolean {
  const s = burst.settings;
  const life = reduced ? REDUCED_MS : s.duration * spark.life;
  const p = elapsed / life;
  if (p >= 1) return false;
  const e = reduced ? 0.55 : s.ease(clamp(p, 0, 1));
  const seconds = reduced ? 0 : elapsed / 1000;
  const distance = s.radius * spark.reach * e;
  const width = s.width * spark.scale;
  const fade = reduced
    ? 1 - p
    : 1 - smoothstep(s.shape === 'line' ? 0.55 : 0.7, 1, p);
  if (fade <= 0) return true;
  ctx.strokeStyle = spark.color;
  ctx.fillStyle = spark.color;

  if (s.shape === 'line') {
    const length =
      s.size * spark.scale * (reduced ? 0.5 : Math.pow(1 - p, 1.6));
    const [x1, y1] = position(burst, spark, distance, seconds);
    const [x2, y2] = position(
      burst,
      spark,
      distance + Math.max(0.01, length),
      seconds,
    );
    ctx.lineCap = 'round';
    if (spark.glow > 0) {
      ctx.globalAlpha = fade * 0.14 * spark.glow;
      ctx.lineWidth = width * 4.5;
      line(ctx, x1, y1, x2, y2);
    }
    ctx.globalAlpha = fade;
    ctx.lineWidth = width;
    line(ctx, x1, y1, x2, y2);
    return true;
  }

  if (s.shape === 'streak') {
    const lag = reduced ? 0 : Math.min(elapsed, 70 + s.size * 4 * spark.scale);
    const back = reduced ? 0.4 : s.ease(clamp((elapsed - lag) / life, 0, 1));
    const [hx, hy] = position(burst, spark, distance, seconds);
    const [tx, ty] = position(
      burst,
      spark,
      s.radius * spark.reach * back,
      Math.max(0, seconds - lag / 1000),
    );
    const dx = hx - tx;
    const dy = hy - ty;
    const length = Math.hypot(dx, dy) || 1;
    const nx = (-dy / length) * width * 0.5;
    const ny = (dx / length) * width * 0.5;
    const paint = (spreadWidth: number, alpha: number) => {
      const gradient = ctx.createLinearGradient(tx, ty, hx, hy);
      gradient.addColorStop(0, spark.clear);
      gradient.addColorStop(1, spark.color);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx + nx * spreadWidth, hy + ny * spreadWidth);
      ctx.lineTo(hx - nx * spreadWidth, hy - ny * spreadWidth);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(hx, hy, width * 0.5 * spreadWidth, 0, Math.PI * 2);
      ctx.fill();
    };
    if (spark.glow > 0) paint(3.2, fade * 0.16 * spark.glow);
    paint(1, fade);
    return true;
  }

  if (s.shape === 'dot') {
    const [x, y] = position(burst, spark, distance, seconds);
    const radius = width * 1.25 * (1 - 0.5 * e);
    if (spark.glow > 0) {
      ctx.globalAlpha = fade * 0.18 * spark.glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  const [x, y] = position(burst, spark, distance, seconds);
  const twinkle = reduced
    ? 1 - p
    : Math.pow(Math.sin(Math.PI * clamp(p * 1.1, 0, 1)), 0.7);
  const radius = s.size * 0.6 * spark.scale * twinkle;
  const rotation = spark.angle + spark.spin * p * Math.PI * 0.5;
  if (radius <= 0.05) return true;
  if (spark.glow > 0) {
    ctx.globalAlpha = fade * 0.2 * spark.glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = fade;
  starPath(ctx, x, y, radius, rotation);
  ctx.fill();
  return true;
}

/** Draws the expanding click ring; returns false once it has faded. */
export function drawRing(
  ctx: CanvasRenderingContext2D,
  burst: ClickSparkBurst,
  elapsed: number,
  reduced: boolean,
): boolean {
  const s = burst.settings;
  const life = reduced ? REDUCED_MS : s.duration * 0.8;
  const p = elapsed / life;
  if (p >= 1) return false;
  const radius = 2 + s.radius * 0.6 * (reduced ? 0.6 : EASINGS['ease-out'](p));
  ctx.globalAlpha = Math.pow(1 - p, 2) * 0.7;
  ctx.strokeStyle = burst.sparks[0]?.color ?? s.colors[0] ?? '#ffffff';
  ctx.lineWidth = Math.max(0.5, s.width * (1 - p) * 0.9);
  ctx.beginPath();
  ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  return true;
}
