import type { OrbitShape } from './types';

function generateEllipsePath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): string {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
}

function generateCirclePath(cx: number, cy: number, r: number): string {
  return generateEllipsePath(cx, cy, r, r);
}

function generateSquarePath(cx: number, cy: number, size: number): string {
  const h = size / 2;
  return `M ${cx - h} ${cy - h} L ${cx + h} ${cy - h} L ${cx + h} ${cy + h} L ${cx - h} ${cy + h} Z`;
}

function generateRectanglePath(
  cx: number,
  cy: number,
  w: number,
  h: number,
): string {
  const hw = w / 2;
  const hh = h / 2;
  return `M ${cx - hw} ${cy - hh} L ${cx + hw} ${cy - hh} L ${cx + hw} ${cy + hh} L ${cx - hw} ${cy + hh} Z`;
}

function generateTrianglePath(cx: number, cy: number, size: number): string {
  const height = (size * Math.sqrt(3)) / 2;
  const hs = size / 2;
  return `M ${cx} ${cy - height / 1.5} L ${cx + hs} ${cy + height / 3} L ${cx - hs} ${cy + height / 3} Z`;
}

function generateStarPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
): string {
  const step = Math.PI / points;
  let path = '';
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return `${path} Z`;
}

function generateHeartPath(cx: number, cy: number, size: number): string {
  const s = size / 30;
  return `M ${cx} ${cy + 12 * s} C ${cx - 20 * s} ${cy - 5 * s}, ${cx - 12 * s} ${cy - 18 * s}, ${cx} ${cy - 8 * s} C ${cx + 12 * s} ${cy - 18 * s}, ${cx + 20 * s} ${cy - 5 * s}, ${cx} ${cy + 12 * s}`;
}

function generateInfinityPath(
  cx: number,
  cy: number,
  w: number,
  h: number,
): string {
  const hw = w / 2;
  const hh = h / 2;
  return `M ${cx} ${cy} C ${cx + hw * 0.5} ${cy - hh}, ${cx + hw} ${cy - hh}, ${cx + hw} ${cy} C ${cx + hw} ${cy + hh}, ${cx + hw * 0.5} ${cy + hh}, ${cx} ${cy} C ${cx - hw * 0.5} ${cy + hh}, ${cx - hw} ${cy + hh}, ${cx - hw} ${cy} C ${cx - hw} ${cy - hh}, ${cx - hw * 0.5} ${cy - hh}, ${cx} ${cy}`;
}

function generateWavePath(
  cx: number,
  cy: number,
  w: number,
  amplitude: number,
  waves: number,
): string {
  const pts: string[] = [];
  const segs = waves * 20;
  const hw = w / 2;
  for (let i = 0; i <= segs; i++) {
    const x = cx - hw + (w * i) / segs;
    const y = cy + Math.sin((i / segs) * waves * 2 * Math.PI) * amplitude;
    pts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  for (let i = segs; i >= 0; i--) {
    const x = cx - hw + (w * i) / segs;
    const y = cy - Math.sin((i / segs) * waves * 2 * Math.PI) * amplitude;
    pts.push(`L ${x} ${y}`);
  }
  return `${pts.join(' ')} Z`;
}

export interface OrbitPathInput {
  shape: OrbitShape;
  customPath?: string;
  center: number;
  radiusX: number;
  radiusY: number;
  radius: number;
  starPoints: number;
  starInnerRatio: number;
}

export function buildOrbitPath(input: OrbitPathInput): string {
  const { center: c, radiusX, radiusY, radius } = input;
  switch (input.shape) {
    case 'circle':
      return generateCirclePath(c, c, radius);
    case 'square':
      return generateSquarePath(c, c, radius * 2);
    case 'rectangle':
      return generateRectanglePath(c, c, radiusX * 2, radiusY * 2);
    case 'triangle':
      return generateTrianglePath(c, c, radius * 2);
    case 'star':
      return generateStarPath(
        c,
        c,
        radius,
        radius * input.starInnerRatio,
        input.starPoints,
      );
    case 'heart':
      return generateHeartPath(c, c, radius * 2);
    case 'infinity':
      return generateInfinityPath(c, c, radiusX * 2, radiusY * 2);
    case 'wave':
      return generateWavePath(c, c, radiusX * 2, radiusY, 3);
    case 'custom':
      return input.customPath || generateCirclePath(c, c, radius);
    default:
      return generateEllipsePath(c, c, radiusX, radiusY);
  }
}

const WIDE_SHAPES: OrbitShape[] = ['ellipse', 'rectangle', 'infinity', 'wave'];

export function estimateAspect(
  shape: OrbitShape,
  radiusX: number,
  radiusY: number,
  radius: number,
  itemSize: number,
): number {
  const wide = WIDE_SHAPES.includes(shape);
  const w = (wide ? radiusX : radius) * 2 + itemSize * 1.6;
  const h = (wide ? radiusY : radius) * 2 + itemSize * 1.6;
  return w > 0 && h > 0 ? w / h : 1;
}
