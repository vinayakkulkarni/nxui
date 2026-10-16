import { GRID_SCAN_VERTEX } from './grid-scan-shaders';
import type { GridScanProps, GridScanSettings } from './types';

export interface GlProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface GlTarget {
  texture: WebGLTexture;
  width: number;
  height: number;
}

const STYLES = { solid: 0, dashed: 1, dotted: 2 } as const;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Resolves props into the clamped settings the renderer reads. */
export function toSettings(props: GridScanProps): GridScanSettings {
  const light = props.lightMode ?? false;
  return {
    linesColor: props.linesColor ?? (light ? '#d4d4d8' : '#4d4757'),
    scanColor: props.scanColor ?? (light ? '#0284c7' : '#7dd3fc'),
    cells: clamp(props.cells ?? 8, 2, 40),
    thickness: clamp(props.lineThickness ?? 1, 0.5, 4),
    style: STYLES[props.lineStyle ?? 'solid'] ?? 0,
    depth: clamp(props.depth ?? 3, 0.5, 12),
    depthFade: clamp(props.depthFade ?? 0.6, 0, 1),
    parallax: clamp(props.parallax ?? 1, 0, 3),
    points: props.points ?? true,
    reflection: clamp(props.reflection ?? 0.35, 0, 1),
    shading: clamp(props.shading ?? 0.7, 0, 1),
    direction: props.scanDirection ?? 'forward',
    duration: clamp(props.scanDuration ?? 2.4, 0.3, 20),
    delay: clamp(props.scanDelay ?? 1.6, 0, 30),
    scanWidth: clamp(props.scanWidth ?? 1, 0.2, 5),
    trail: clamp(props.trail ?? 0.5, 0, 1),
    glow: clamp(props.glow ?? 0.6, 0, 1.5),
    autoScan: props.autoScan ?? true,
    interactive: props.interactive ?? true,
    clickEffect: props.clickEffect ?? 'ping',
    enableGyro: props.enableGyro ?? false,
    intro: props.intro ?? true,
    lightMode: light,
    dpr: props.dpr,
  };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function link(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
): GlProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, GRID_SCAN_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
}

export function createTarget(gl: WebGL2RenderingContext): GlTarget | null {
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { texture, width: 0, height: 0 };
}

export function sizeTarget(
  gl: WebGL2RenderingContext,
  target: GlTarget,
  width: number,
  height: number,
) {
  if (target.width === width && target.height === height) return;
  target.width = width;
  target.height = height;
  gl.bindTexture(gl.TEXTURE_2D, target.texture);
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
}

/** Parses any CSS color into linear 0–1 RGB through a 1×1 canvas. */
export function createColorParser() {
  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const cache = new Map<string, [number, number, number]>();
  return (value: string): [number, number, number] => {
    const cached = cache.get(value);
    if (cached) return cached;
    let rgb: [number, number, number] = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [
        (data[0] ?? 255) / 255,
        (data[1] ?? 255) / 255,
        (data[2] ?? 255) / 255,
      ];
    }
    cache.set(value, rgb);
    return rgb;
  };
}
