import type { WebThreadsRgb, WebThreadsShape } from './types';

const TAU = Math.PI * 2;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const mod = (value: number, base: number) => ((value % base) + base) % base;

let probe: CanvasRenderingContext2D | null = null;

/** Resolves any CSS color to linear 0..1 RGB. Returns null for transparent. */
export function parseColor(
  value: string,
  fallback: WebThreadsRgb | null,
): WebThreadsRgb | null {
  if (value === 'transparent') return null;
  if (typeof document === 'undefined') return fallback;
  if (!probe) probe = document.createElement('canvas').getContext('2d');
  if (!probe) return fallback;
  probe.fillStyle = '#000000';
  probe.fillStyle = value;
  const text = String(probe.fillStyle);
  if (text.startsWith('#')) {
    const hex = Number.parseInt(text.slice(1), 16);
    return [
      ((hex >> 16) & 255) / 255,
      ((hex >> 8) & 255) / 255,
      (hex & 255) / 255,
    ];
  }
  const match = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(
    text,
  );
  if (!match) return fallback;
  if (match[4] !== undefined && Number(match[4]) === 0) return null;
  return [
    Number(match[1]) / 255,
    Number(match[2]) / 255,
    Number(match[3]) / 255,
  ];
}

export const staggerFor = (count: number) =>
  Math.min(0.12, 0.9 / Math.max(count - 1, 1));

/** Maps a container-relative point (y down) into the rotated thread space. */
export function toThreadSpace(
  px: number,
  py: number,
  aspect: number,
  angle: number,
): [number, number] {
  const qx = (px - 0.5) * aspect;
  const qy = 0.5 - py;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [(qx * cos + qy * sin) / aspect + 0.5, -qx * sin + qy * cos + 0.5];
}

/** CPU mirror of the shader's thread curve, used for cursor hit-testing. */
export function threadY(
  s: WebThreadsShape,
  x: number,
  index: number,
  phase: number,
  clock: number,
) {
  const lane = s.nodes <= 1 ? x - s.pinch : (x - s.pinch + 0.5) * s.nodes - 0.5;
  const side = s.mirror ? (mod(Math.floor(lane), 2) < 0.5 ? -1 : 1) : 1;
  const dx = x - s.pinch;
  const env =
    s.nodes <= 1
      ? s.spread * Math.abs(dx)
      : s.spread * 0.5 * Math.abs(Math.cos(Math.PI * s.nodes * (dx + 0.5)));
  const shimmer = s.shimmer ? Math.sin(clock * 1.7 + index * 1.3) * 0.35 : 0;
  const angle =
    x * s.frequency +
    (phase + (index * TAU) / Math.max(s.count, 1)) * side +
    shimmer;
  return s.position - env * (1 + index * s.taper) * Math.sin(angle);
}

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
