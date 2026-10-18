import { FRAGMENT, VERTEX } from './cursor-grid-shaders';
import type {
  CursorGridLook,
  CursorGridPreset,
  CursorGridProgram,
  CursorGridProps,
  CursorGridSettings,
  CursorGridStyle,
} from './types';

type Vec3 = [number, number, number];

export const INTRO_SECONDS = 1.4;

const STYLES: Record<CursorGridStyle, number> = {
  lines: 0,
  dashed: 1,
  dots: 2,
  crosses: 3,
};

export const FALLOFF_CURVES = {
  linear: (t: number) => t,
  smooth: (t: number) => t * t * (3 - 2 * t),
  sharp: (t: number) => t * t * t,
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function resolveSettings(p: CursorGridProps): CursorGridSettings {
  const ink = p.lightMode ? '#18181b' : '#ffffff';
  return {
    cellSize: Math.max(8, p.cellSize ?? 60),
    color: p.color || ink,
    gridColor: p.gridColor || ink,
    radius: Math.max(1, p.radius ?? 140),
    falloff: p.falloff ?? 'smooth',
    highlight: p.highlight ?? 'area',
    holdTime: Math.max(0, p.holdTime ?? 400),
    fadeDuration: Math.max(16, p.fadeDuration ?? 800),
    lineWidth: Math.max(0.25, p.lineWidth ?? 1),
    maxOpacity: clamp(p.maxOpacity ?? 1, 0, 1),
    fillOpacity: clamp(p.fillOpacity ?? 0.06, 0, 1),
    gridOpacity: clamp(p.gridOpacity ?? 0.08, 0, 1),
    gridStyle: STYLES[p.gridStyle ?? 'lines'] ?? 0,
    cellRadius: Math.max(0, p.cellRadius ?? 0),
    cellGap: Math.max(0, p.cellGap ?? 0),
    spotlight: clamp(p.spotlight ?? 0.6, 0, 1),
    clickPulse: p.clickPulse ?? true,
    pulseSpeed: Math.max(1, p.pulseSpeed ?? 600),
    ambient: clamp(p.ambient ?? 0, 0, 1),
    edgeFade: clamp(p.edgeFade ?? 0.2, 0, 0.5),
    intro: p.intro ?? true,
    dpr: p.dpr,
  };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error('[CursorGrid]', gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

export function linkCursorGrid(
  gl: WebGL2RenderingContext,
): CursorGridProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info)
      uniforms.set(info.name, gl.getUniformLocation(program, info.name));
  }
  return { program, uniforms };
}

const colorCache = new Map<string, Vec3>();

function parseHex(hex: string): Vec3 {
  let h = String(hex || '#ffffff')
    .replace('#', '')
    .trim();
  if (h.length === 3 || h.length === 4)
    h = h
      .slice(0, 3)
      .split('')
      .map((c) => c + c)
      .join('');
  const num = Number.parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(num)) return [1, 1, 1];
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

export function hexToRgb(hex: string): Vec3 {
  const key = String(hex);
  const cached = colorCache.get(key);
  if (cached) return cached;
  const rgb = parseHex(hex);
  if (colorCache.size > 64) colorCache.clear();
  colorCache.set(key, rgb);
  return rgb;
}

export const CURSOR_GRID_LOOK: CursorGridLook = {
  color: '#ffffff',
  gridColor: '#ffffff',
  highlight: 'area',
  gridStyle: 'lines',
  falloff: 'smooth',
  cellSize: 60,
  radius: 140,
  holdTime: 400,
  fadeDuration: 800,
  lineWidth: 1,
  maxOpacity: 1,
  fillOpacity: 0.06,
  gridOpacity: 0.08,
  spotlight: 0.6,
  cellGap: 0,
  cellRadius: 0,
  pulseSpeed: 600,
  ambient: 0,
  edgeFade: 0.2,
};

export const CURSOR_GRID_PRESETS: Record<
  CursorGridPreset,
  Partial<CursorGridLook>
> = {
  minimal: {},
  cell: { highlight: 'cell', fadeDuration: 1400, fillOpacity: 0.08 },
  tiles: {
    color: '#7dd3fc',
    highlight: 'cell',
    cellGap: 4,
    cellRadius: 10,
    fillOpacity: 0.14,
    gridOpacity: 0.05,
    fadeDuration: 1200,
  },
  marks: {
    color: '#fbbf24',
    gridStyle: 'crosses',
    gridOpacity: 0.28,
    fillOpacity: 0.08,
    spotlight: 0.8,
  },
  dots: {
    gridStyle: 'dots',
    cellSize: 36,
    radius: 120,
    gridOpacity: 0.3,
    fillOpacity: 0.1,
  },
  dashed: {
    color: '#34d399',
    gridStyle: 'dashed',
    gridOpacity: 0.14,
    ambient: 0.5,
    fadeDuration: 1600,
  },
  classic: {
    color: '#D946EF',
    cellSize: 70,
    lineWidth: 1.2,
    fillOpacity: 0,
    gridOpacity: 0,
    spotlight: 0,
    edgeFade: 0,
  },
};

const LIGHT_SWAP: Record<string, string> = {
  '#ffffff': '#18181b',
  '#7dd3fc': '#0284c7',
  '#fbbf24': '#d97706',
  '#34d399': '#059669',
  '#d946ef': '#c026d3',
};

const DARK_SWAP: Record<string, string> = Object.fromEntries(
  Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]),
);

/** Swaps a preset color for its light or dark page counterpart. */
export function swapCursorGridTone(color: string, light: boolean): string {
  const table = light ? LIGHT_SWAP : DARK_SWAP;
  return table[color.toLowerCase()] ?? color;
}
