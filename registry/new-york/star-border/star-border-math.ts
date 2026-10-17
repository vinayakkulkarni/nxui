import type {
  StarBorderHover,
  StarBorderPalette,
  StarBorderPoint,
  StarBorderRgb,
  StarBorderShape,
  StarBorderSegment,
  StarBorderTheme,
} from './types';

export const STAR_BORDER_THEMES: Record<StarBorderTheme, StarBorderPalette> = {
  dark: {
    surface: '#0c0c0f',
    text: '#fafafa',
    track: 'rgba(255, 255, 255, 0.1)',
    light: '#ffffff',
  },
  light: {
    surface: '#ffffff',
    text: '#18181b',
    track: 'rgba(24, 24, 27, 0.12)',
    light: '#18181b',
  },
};

export const HOVERS: StarBorderHover[] = ['lap', 'brighten', 'reveal', 'none'];
export const BLEED = 48;
export const LAP = 0.9;
export const TAU = Math.PI * 2;
export const WHITE: StarBorderRgb = [255, 255, 255];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function wrap(value: number, total: number): number {
  return ((value % total) + total) % total;
}

export function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (2 - 2 * t) ** 3 / 2;
}

export function mix(
  a: StarBorderRgb,
  b: StarBorderRgb,
  t: number,
): StarBorderRgb {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function rgba(rgb: StarBorderRgb, alpha: number): string {
  return `rgba(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}, ${clamp(alpha, 0, 1).toFixed(3)})`;
}

let colorContext: CanvasRenderingContext2D | null = null;

/** Resolves any CSS color (incl. `var()`-free keywords, hsl, oklch) to RGB via canvas. */
export function toRgb(color: string): StarBorderRgb {
  colorContext =
    colorContext ?? document.createElement('canvas').getContext('2d');
  if (!colorContext) return WHITE;
  colorContext.fillStyle = '#000000';
  colorContext.fillStyle = color;
  const value = String(colorContext.fillStyle);
  if (value.startsWith('#')) {
    const hex = Number.parseInt(value.slice(1, 7), 16);
    return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  }
  const parts = value.match(/[\d.]+/g)?.map(Number) ?? WHITE;
  return [parts[0] ?? 255, parts[1] ?? 255, parts[2] ?? 255];
}

export function outline(
  width: number,
  height: number,
  radius: number,
): StarBorderShape {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const arc = (Math.PI * r) / 2;
  const across = Math.max(0, width - 2 * r);
  const down = Math.max(0, height - 2 * r);
  const segments: StarBorderSegment[] = [
    { length: across, x: r, y: 0, dx: 1, dy: 0, angle: null },
    { length: arc, x: width - r, y: r, dx: 0, dy: 0, angle: -Math.PI / 2 },
    { length: down, x: width, y: r, dx: 0, dy: 1, angle: null },
    { length: arc, x: width - r, y: height - r, dx: 0, dy: 0, angle: 0 },
    { length: across, x: width - r, y: height, dx: -1, dy: 0, angle: null },
    { length: arc, x: r, y: height - r, dx: 0, dy: 0, angle: Math.PI / 2 },
    { length: down, x: 0, y: height - r, dx: 0, dy: -1, angle: null },
    { length: arc, x: r, y: r, dx: 0, dy: 0, angle: Math.PI },
  ];
  return {
    r,
    segments,
    total: Math.max(
      1,
      segments.reduce((sum, segment) => sum + segment.length, 0),
    ),
  };
}

export function pointAt(
  shape: StarBorderShape,
  distance: number,
  point: StarBorderPoint,
): StarBorderPoint {
  let s = wrap(distance, shape.total);
  for (const segment of shape.segments) {
    if (segment.length > 0 && s <= segment.length) {
      if (segment.angle === null) {
        point.x = segment.x + segment.dx * s;
        point.y = segment.y + segment.dy * s;
        point.nx = segment.dy;
        point.ny = -segment.dx;
      } else {
        const angle = segment.angle + s / shape.r;
        point.nx = Math.cos(angle);
        point.ny = Math.sin(angle);
        point.x = segment.x + point.nx * shape.r;
        point.y = segment.y + point.ny * shape.r;
      }
      return point;
    }
    s -= segment.length;
  }
  return point;
}

/** Arc-length position on the outline closest to (px, py). */
export function project(
  shape: StarBorderShape,
  px: number,
  py: number,
): number {
  let best = Infinity;
  let found = 0;
  let offset = 0;
  for (const segment of shape.segments) {
    if (segment.length > 0) {
      let s: number;
      let x: number;
      let y: number;
      if (segment.angle === null) {
        s = clamp(
          (px - segment.x) * segment.dx + (py - segment.y) * segment.dy,
          0,
          segment.length,
        );
        x = segment.x + segment.dx * s;
        y = segment.y + segment.dy * s;
      } else {
        let angle = wrap(
          Math.atan2(py - segment.y, px - segment.x) - segment.angle,
          TAU,
        );
        if (angle > Math.PI / 2)
          angle = angle > Math.PI * 1.25 ? 0 : Math.PI / 2;
        s = angle * shape.r;
        x = segment.x + Math.cos(segment.angle + angle) * shape.r;
        y = segment.y + Math.sin(segment.angle + angle) * shape.r;
      }
      const distance = (px - x) ** 2 + (py - y) ** 2;
      if (distance < best) {
        best = distance;
        found = offset + s;
      }
    }
    offset += segment.length;
  }
  return found;
}
