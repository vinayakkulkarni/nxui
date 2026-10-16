import type {
  NodeCanvasAnchor,
  NodeCanvasPoint,
  NodeCanvasRect,
  NodeCanvasSide,
} from './types';

const NORMALS: Record<NodeCanvasSide, NodeCanvasPoint> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function anchorPoint(
  rect: NodeCanvasRect,
  anchor: NodeCanvasAnchor,
): NodeCanvasPoint {
  const t = clamp(anchor.offset ?? 0.5, 0, 1);
  switch (anchor.side) {
    case 'left':
      return { x: rect.x, y: rect.y + rect.height * t };
    case 'right':
      return { x: rect.x + rect.width, y: rect.y + rect.height * t };
    case 'top':
      return { x: rect.x + rect.width * t, y: rect.y };
    default:
      return { x: rect.x + rect.width * t, y: rect.y + rect.height };
  }
}

/** Cubic bezier that leaves and enters each node along its side normal. */
export function bezierPath(
  start: NodeCanvasPoint,
  startSide: NodeCanvasSide,
  end: NodeCanvasPoint,
  endSide: NodeCanvasSide,
): string {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  // Same-side edges loop around, so they need a shorter reach to stay compact.
  const reach = Math.max(48, distance * (startSide === endSide ? 0.25 : 0.45));
  const a = NORMALS[startSide];
  const b = NORMALS[endSide];
  const c1 = { x: start.x + a.x * reach, y: start.y + a.y * reach };
  const c2 = { x: end.x + b.x * reach, y: end.y + b.y * reach };
  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
}

export function unionRect(rects: NodeCanvasRect[]): NodeCanvasRect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, width: 1, height: 1 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
