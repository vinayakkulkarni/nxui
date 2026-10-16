import { CRT_VERTEX } from './crt-warp-shaders';
import type {
  CrtWarpLook,
  CrtWarpProgram,
  CrtWarpRGB,
  CrtWarpSettings,
  CrtWarpTarget,
} from './types';

const MASKS: Record<string, number> = {
  none: 0,
  aperture: 1,
  shadow: 2,
  slot: 3,
};
export const CELL_ASPECT = 0.56;
export const INTRO_SECONDS = 1.6;
export const FLIP_SECONDS = 0.8;
export const TAU = Math.PI * 2;

const DEFAULT_INK: CrtWarpRGB = [0.78, 0.33, 0.97];
const DEFAULT_PAPER: CrtWarpRGB = [0.07, 0.06, 0.09];

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smooth = (t: number) => t * t * (3 - 2 * t);

export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

let probe: CanvasRenderingContext2D | null = null;

function parseColor(
  value: string,
  fallback: CrtWarpRGB | null,
): CrtWarpRGB | null {
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

export function seedFor(channel: number): [number, number, number, number] {
  const a = Math.sin(channel * 12.9898 + 1.7) * 43758.5453;
  const b = Math.sin(channel * 78.233 + 4.1) * 24634.6345;
  const c = Math.sin(channel * 37.719 + 2.9) * 17431.7731;
  const d = Math.sin(channel * 91.113 + 0.3) * 31337.1337;
  const f = (v: number) => (v - Math.floor(v)) * TAU;
  return channel === 0 ? [0, 0, 0, 0] : [f(a), f(b), f(c), f(d)];
}

/** Returns [reveal, warm, focus] for the power-on intro. */
export function introAt(t: number): [number, number, number] {
  if (t >= INTRO_SECONDS) return [1, 1, 1];
  const reveal = smooth(clamp(t / INTRO_SECONDS, 0, 1));
  const warm = smooth(clamp(t / 0.6, 0, 1));
  const focus = smooth(clamp((t - 0.15) / (INTRO_SECONDS - 0.15), 0, 1));
  return [reveal, warm, focus];
}

export function toSettings(
  look: CrtWarpLook,
  extra: Pick<
    CrtWarpSettings,
    | 'intro'
    | 'mouseReact'
    | 'mouseStrength'
    | 'changeOnClick'
    | 'dpr'
    | 'fps'
    | 'paused'
  >,
): CrtWarpSettings {
  return {
    ink: parseColor(look.color, DEFAULT_INK) ?? DEFAULT_INK,
    paper: parseColor(look.backgroundColor, DEFAULT_PAPER),
    lightMode: look.lightMode,
    speed: look.speed,
    variation: look.variation,
    amplitude: Math.max(0, look.waveAmplitude) / 0.28,
    frequency: Math.max(0.01, look.waveFrequency) / 2.2,
    levels: clamp(Math.round(look.levels), 2, 12),
    columns: clamp(Math.round(look.columns), 8, 400),
    persistence: clamp(look.persistence, 0, 0.98),
    curve: look.curvature > 0.001 ? 1.1 + 0.42 / look.curvature : 0,
    corners: clamp(look.corners, 0, 1),
    scanline: clamp(look.scanlineStrength, 0, 1),
    lines: clamp(look.scanlineFrequency, 20, 1200),
    mask: MASKS[look.mask] ?? 0,
    maskStrength: clamp(look.maskStrength, 0, 1),
    bloom: Math.max(0, look.bloom),
    bloomRadius: Math.max(0.05, look.bloomRadius),
    rgbShift: look.rgbShift,
    noise: Math.max(0, look.noise),
    flicker: Math.max(0, look.flicker),
    interference: Math.max(0, look.interference),
    vignette: clamp(look.vignette, 0, 1),
    brightness: Math.max(0, look.brightness),
    intro: extra.intro,
    mouseReact: extra.mouseReact,
    mouseStrength: Math.max(0, extra.mouseStrength),
    changeOnClick: extra.changeOnClick,
    dpr: Math.max(0.5, extra.dpr),
    fps: Math.max(1, extra.fps),
    paused: extra.paused,
  };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
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

export function createProgram(
  gl: WebGL2RenderingContext,
  fragment: string,
  names: string[],
): CrtWarpProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, CRT_VERTEX);
  const shader = compile(gl, gl.FRAGMENT_SHADER, fragment);
  if (!vertex || !shader) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, shader);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(shader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  names.forEach((name) => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });
  return { program, uniforms };
}

export function createTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
): CrtWarpTarget | null {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return { texture, framebuffer, width, height };
}

export function deleteTarget(
  gl: WebGL2RenderingContext,
  target: CrtWarpTarget | null,
) {
  if (!target) return;
  gl.deleteTexture(target.texture);
  gl.deleteFramebuffer(target.framebuffer);
}
