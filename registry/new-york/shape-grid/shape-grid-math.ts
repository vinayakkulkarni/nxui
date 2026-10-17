import type {
  ShapeGridDirection,
  ShapeGridLayout,
  ShapeGridMatrix,
  ShapeGridProps,
  ShapeGridSettings,
  ShapeGridShape,
  ShapeGridView,
} from './types';

const SHAPES: readonly ShapeGridShape[] = [
  'square',
  'tile',
  'hexagon',
  'triangle',
  'diamond',
  'circle',
  'cross',
  'dot',
];

export const DIRECTIONS: Record<ShapeGridDirection, [number, number]> = {
  right: [1, 0],
  left: [-1, 0],
  up: [0, -1],
  down: [0, 1],
  diagonal: [Math.SQRT1_2, -Math.SQRT1_2],
  none: [0, 0],
};

const SQRT3 = Math.sqrt(3);
const OFFSET = 32768;
const FAR = 2.5;
export const MAX_PIXELS = 8e6;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function hash(i: number, j: number): number {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function keyOf(i: number, j: number): number {
  return (i + OFFSET) * 65536 + (j + OFFSET);
}

/** Two crossed linear gradients that fade the grid out toward every edge. */
export function fadeMask(amount: number): string {
  if (amount <= 0) return 'none';
  const edge = amount * 26;
  const stops: { alpha: string; at: number }[] = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    stops.push({ alpha: smootherstep(t).toFixed(3), at: t * edge });
  }
  const inner = stops
    .map((stop) => `rgba(0, 0, 0, ${stop.alpha}) ${stop.at.toFixed(2)}%`)
    .join(', ');
  const outer = [...stops]
    .reverse()
    .map(
      (stop) =>
        `rgba(0, 0, 0, ${stop.alpha}) ${(100 - Number.parseFloat(stop.at.toFixed(2))).toFixed(2)}%`,
    )
    .join(', ');
  const axis = (direction: string) =>
    `linear-gradient(${direction}, ${inner}, ${outer})`;
  return `${axis('to right')}, ${axis('to bottom')}`;
}

function lightnessOf(color: string): number {
  let hex = String(color).trim().replace(/^#/, '');
  if (hex.length === 3 || hex.length === 4) hex = hex.replace(/./g, '$&$&');
  hex = hex.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0.6;
  const value = Number.parseInt(hex, 16);
  const channels = [value >> 16, (value >> 8) & 255, value & 255];
  return (Math.max(...channels) + Math.min(...channels)) / 510;
}

export function tint(hue: number, lightness: number): string {
  return `hsl(${(((hue % 360) + 360) % 360).toFixed(1)}, 90%, ${(lightness * 100).toFixed(1)}%)`;
}

function multiply(a: ShapeGridMatrix, b: ShapeGridMatrix): ShapeGridMatrix {
  const [a0, a1, a2, a3, a4, a5, a6, a7, a8] = a;
  const [b0, b1, b2, b3, b4, b5, b6, b7, b8] = b;
  return [
    a0 * b0 + a1 * b3 + a2 * b6,
    a0 * b1 + a1 * b4 + a2 * b7,
    a0 * b2 + a1 * b5 + a2 * b8,
    a3 * b0 + a4 * b3 + a5 * b6,
    a3 * b1 + a4 * b4 + a5 * b7,
    a3 * b2 + a4 * b5 + a5 * b8,
    a6 * b0 + a7 * b3 + a8 * b6,
    a6 * b1 + a7 * b4 + a8 * b7,
    a6 * b2 + a7 * b5 + a8 * b8,
  ];
}

function invert(m: ShapeGridMatrix): ShapeGridMatrix {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    A / det,
    (c * h - b * i) / det,
    (b * f - c * e) / det,
    B / det,
    (a * i - c * g) / det,
    (c * d - a * f) / det,
    C / det,
    (b * g - a * h) / det,
    (a * e - b * d) / det,
  ];
}

export function project(
  m: ShapeGridMatrix,
  x: number,
  y: number,
): [number, number] {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w];
}

export function flatView(width: number, height: number): ShapeGridView {
  return {
    x0: 0,
    y0: 0,
    width,
    height,
    inverse: null,
    transform: 'none',
    mist: null,
    far: FAR,
    reach: Math.hypot(width, height) / 2,
  };
}

/**
 * Perspective tilt as a 2D homography: the canvas covers the visible part of the
 * tilted plane and a CSS matrix3d maps it back onto the container.
 */
export function viewFor(
  tiltX: number,
  tiltY: number,
  width: number,
  height: number,
  cellSize: number,
): ShapeGridView {
  if (!tiltX && !tiltY) return flatView(width, height);
  const ax = (tiltX * Math.PI) / 180;
  const ay = (tiltY * Math.PI) / 180;
  const depth = Math.max(width, height) * 1.25;
  const cx = width / 2;
  const cy = height / 2;
  const tilt: ShapeGridMatrix = [
    Math.cos(ay),
    0,
    0,
    Math.sin(ax) * Math.sin(ay),
    Math.cos(ax),
    0,
    (Math.sin(ay) * Math.cos(ax)) / depth,
    -Math.sin(ax) / depth,
    1,
  ];
  const forward = multiply(multiply([1, 0, cx, 0, 1, cy, 0, 0, 1], tilt), [
    1,
    0,
    -cx,
    0,
    1,
    -cy,
    0,
    0,
    1,
  ]);
  const inverse = invert(forward);
  const facing = Math.cos(ax) * Math.cos(ay);
  const far = clamp(Math.sqrt((facing * cellSize) / 5), 1.15, FAR);
  const near = Math.min(Math.sqrt((facing * cellSize) / 14), far - 0.35);
  const nearness = (x: number, y: number) =>
    inverse[6] * x + inverse[7] * y + inverse[8] - 1 / far;
  const corners: [number, number][] = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const include = (x: number, y: number) => {
    const [px, py] = project(inverse, x, y);
    x0 = Math.min(x0, px);
    y0 = Math.min(y0, py);
    x1 = Math.max(x1, px);
    y1 = Math.max(y1, py);
  };
  corners.forEach((a, k) => {
    const b = corners[(k + 1) % 4] ?? a;
    const na = nearness(a[0], a[1]);
    const nb = nearness(b[0], b[1]);
    if (na >= 0) include(a[0], a[1]);
    if (na >= 0 !== nb >= 0) {
      const t = na / (na - nb);
      include(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
    }
  });
  if (!(x1 > x0 && y1 > y0)) return flatView(width, height);
  x0 = Math.floor(x0 / 16) * 16;
  y0 = Math.floor(y0 / 16) * 16;
  x1 = Math.ceil(x1 / 16) * 16;
  y1 = Math.ceil(y1 / 16) * 16;
  const m = multiply(forward, [1, 0, x0, 0, 1, y0, 0, 0, 1]);
  const transform = `matrix3d(${[m[0], m[3], 0, m[6], m[1], m[4], 0, m[7], 0, 0, 1, 0, m[2], m[5], 0, m[8]].join(', ')})`;
  const gx = forward[6];
  const gy = forward[7];
  const slope = Math.hypot(gx, gy);
  const mist: ShapeGridView['mist'] =
    slope > 1e-9
      ? [
          cx + (gx / slope) * ((near - 1) / slope),
          cy + (gy / slope) * ((near - 1) / slope),
          cx + (gx / slope) * ((far - 1) / slope),
          cy + (gy / slope) * ((far - 1) / slope),
        ]
      : null;
  const reach = Math.max(
    Math.hypot(x0 - cx, y0 - cy),
    Math.hypot(x1 - cx, y0 - cy),
    Math.hypot(x1 - cx, y1 - cy),
    Math.hypot(x0 - cx, y1 - cy),
  );
  return {
    x0,
    y0,
    width: x1 - x0,
    height: y1 - y0,
    inverse,
    transform,
    mist,
    far,
    reach,
  };
}

export function layoutFor(
  shape: ShapeGridShape,
  size: number,
): ShapeGridLayout {
  if (shape === 'hexagon') {
    const radius = size / SQRT3;
    return { stepX: radius * 1.5, stepY: size, radius, side: 0 };
  }
  if (shape === 'triangle') {
    const side = (size * 2) / SQRT3;
    return { stepX: side / 2, stepY: size, radius: 0, side };
  }
  return { stepX: size, stepY: size, radius: 0, side: 0 };
}

function pointsUp(i: number, j: number): boolean {
  return (((i + j) % 2) + 2) % 2 === 0;
}

export function centerOf(
  shape: ShapeGridShape,
  layout: ShapeGridLayout,
  i: number,
  j: number,
): [number, number] {
  const { stepX, stepY } = layout;
  if (shape === 'hexagon') {
    return [i * stepX, j * stepY + (Math.abs(i) % 2 === 1 ? stepY / 2 : 0)];
  }
  if (shape === 'triangle') {
    return [
      i * stepX,
      j * stepY + (pointsUp(i, j) ? stepY * (2 / 3) : stepY / 3),
    ];
  }
  if (shape === 'cross' || shape === 'dot') return [i * stepX, j * stepY];
  return [(i + 0.5) * stepX, (j + 0.5) * stepY];
}

export function traceCell(
  ctx: CanvasRenderingContext2D,
  shape: ShapeGridShape,
  layout: ShapeGridLayout,
  size: number,
  cell: [number, number],
  x: number,
  y: number,
  inset: number,
) {
  if (shape === 'hexagon') {
    const r = layout.radius - inset;
    for (let k = 0; k < 6; k++) {
      const angle = (Math.PI / 3) * k;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'triangle') {
    const up = pointsUp(cell[0], cell[1]);
    const half = layout.side / 2 - inset * 1.7;
    const height = size - inset * 2.6;
    const top = up ? y - height * (2 / 3) : y + height * (2 / 3);
    const base = up ? y + height / 3 : y - height / 3;
    ctx.moveTo(x, top);
    ctx.lineTo(x + half, base);
    ctx.lineTo(x - half, base);
    ctx.closePath();
  } else if (shape === 'diamond') {
    const r = size / 2 - inset;
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  } else if (shape === 'circle') {
    ctx.moveTo(x + size / 2 - inset, y);
    ctx.arc(x, y, Math.max(0.5, size / 2 - inset), 0, Math.PI * 2);
  } else if (shape === 'tile') {
    const half = size / 2 - Math.max(inset, size * 0.06);
    const r = Math.min(half, size * 0.22);
    ctx.roundRect(x - half, y - half, half * 2, half * 2, r);
  } else if (shape === 'cross') {
    const arm = size * 0.16 + inset;
    ctx.moveTo(x - arm, y);
    ctx.lineTo(x + arm, y);
    ctx.moveTo(x, y - arm);
    ctx.lineTo(x, y + arm);
  } else if (shape === 'dot') {
    const r = size * 0.05 + inset;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  } else {
    const half = size / 2 - inset;
    ctx.rect(x - half, y - half, half * 2, half * 2);
  }
}

export function resolveSettings(
  props: Required<Omit<ShapeGridProps, 'class' | 'hoverFillColor' | 'dpr'>> &
    Pick<ShapeGridProps, 'hoverFillColor' | 'dpr'>,
): ShapeGridSettings {
  return {
    shape: SHAPES.includes(props.shape) ? props.shape : 'square',
    cellSize: Math.max(8, props.cellSize),
    lineWidth: Math.max(0.25, props.lineWidth),
    direction: props.direction in DIRECTIONS ? props.direction : 'diagonal',
    speed: Math.max(0, props.speed),
    lineColor: props.lineColor,
    hoverColor: props.hoverColor,
    hoverFillColor: props.hoverFillColor ?? props.hoverColor,
    fillOpacity: clamp(props.fillOpacity, 0, 1),
    rainbow: props.rainbow,
    tone: clamp(lightnessOf(props.hoverColor), 0.45, 0.68),
    tiltX: clamp(props.tiltX, -70, 70),
    tiltY: clamp(props.tiltY, -70, 70),
    radius: Math.max(0, props.radius),
    trail: Math.max(0.05, props.trail),
    glow: clamp(props.glow, 0, 1),
    twinkle: clamp(props.twinkle, 0, 1),
    clickCascade: props.clickCascade,
    intro: props.intro,
    paused: props.paused,
    dpr: props.dpr,
  };
}
