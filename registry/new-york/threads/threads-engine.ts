import {
  THREADS_LINE_FRAGMENT,
  THREADS_LINE_VERTEX,
  THREADS_SCREEN_FRAGMENT,
  THREADS_SCREEN_VERTEX,
} from './threads-shaders';
import type {
  ThreadsColor,
  ThreadsEngine,
  ThreadsProps,
  ThreadsSettings,
} from './types';

const MAX_RENDER_DIM = 1920;

const LINE_UNIFORMS = [
  'uTime',
  'uResolution',
  'uFrame',
  'uAmplitude',
  'uDistance',
  'uMouse',
  'uCount',
  'uThickness',
  'uSoftness',
  'uWaves',
  'uSplit',
  'uFray',
  'uSeed',
  'uTurn',
  'uPart',
  'uTaper',
  'uColor',
  'uAccent',
];
const SCREEN_UNIFORMS = [
  'uLines',
  'uResolution',
  'uFade',
  'uOpacity',
  'uCurve',
];

type Uniforms = Record<string, WebGLUniformLocation | null>;
type Rgb = [number, number, number];
type Vec2 = [number, number];

interface EngineState {
  time: number;
  width: number;
  height: number;
  segments: number;
  colorKey: string;
  color: Rgb;
  accent: Rgb;
  mouse: [number, number];
  targetMouse: [number, number];
  pointer: [number, number];
  targetPointer: [number, number];
  presence: number;
  inside: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const colorKeyOf = (value: ThreadsColor | undefined) =>
  Array.isArray(value) ? value.join(',') : String(value ?? '');

/** Resolves props into the clamped settings the renderer reads. */
export function toThreadsSettings(props: ThreadsProps): ThreadsSettings {
  const color = props.color ?? [1, 1, 1];
  return {
    color,
    accentColor: props.accentColor,
    colorKey: `${colorKeyOf(color)}|${colorKeyOf(props.accentColor)}`,
    amplitude: props.amplitude ?? 1.7,
    distance: props.distance ?? 0.4,
    enableMouseInteraction: props.enableMouseInteraction ?? false,
    lineCount: clamp(Math.round(props.lineCount ?? 90), 1, 400),
    thickness: Math.max(0, props.thickness ?? 0.6),
    softness: Math.max(0, props.softness ?? 1.3),
    speed: props.speed ?? 0.6,
    waves: Math.max(0, props.waves ?? 1.05),
    split: clamp(props.split ?? 0.04, 0, 1),
    fray: clamp(props.fray ?? 0.5, 0, 1),
    angle: props.angle ?? 25,
    seed: props.seed ?? 0,
    parting: clamp(props.parting ?? 0, 0, 1),
    taper: clamp(props.taper ?? 0.85, 0, 1),
    brightness: clamp(props.brightness ?? 1.4, 0.25, 2),
    fade: clamp(props.fade ?? 0, 0, 1),
    opacity: clamp(props.opacity ?? 1, 0, 1),
    paused: props.paused ?? false,
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

function link(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

function locate(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: string[],
): Uniforms {
  const result: Uniforms = {};
  for (const name of names) result[name] = gl.getUniformLocation(program, name);
  return result;
}

/**
 * Draws every thread as one instanced triangle strip into an offscreen
 * target, then composites it with brightness, edge fade and opacity.
 */
export function createThreadsEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => ThreadsSettings,
  isReduced: () => boolean,
): ThreadsEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const lineProgram = link(gl, THREADS_LINE_VERTEX, THREADS_LINE_FRAGMENT);
  const screenProgram = link(
    gl,
    THREADS_SCREEN_VERTEX,
    THREADS_SCREEN_FRAGMENT,
  );
  if (!lineProgram || !screenProgram) return null;

  const lineUniforms = locate(gl, lineProgram, LINE_UNIFORMS);
  const screenUniforms = locate(gl, screenProgram, SCREEN_UNIFORMS);

  const lineVao = gl.createVertexArray();
  const lineBuffer = gl.createBuffer();
  gl.bindVertexArray(lineVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  const pointLocation = gl.getAttribLocation(lineProgram, 'aPoint');
  gl.enableVertexAttribArray(pointLocation);
  gl.vertexAttribPointer(pointLocation, 2, gl.FLOAT, false, 0, 0);

  const screenVao = gl.createVertexArray();
  const screenBuffer = gl.createBuffer();
  gl.bindVertexArray(screenVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, screenBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const positionLocation = gl.getAttribLocation(screenProgram, 'aPosition');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const target = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, target);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const probeContext = probe.getContext('2d', { willReadFrequently: true });

  const state: EngineState = {
    time: 0,
    width: 1,
    height: 1,
    segments: 0,
    colorKey: '\u0000',
    color: [1, 1, 1],
    accent: [1, 1, 1],
    mouse: [0.5, 0.5],
    targetMouse: [0.5, 0.5],
    pointer: [0, 0],
    targetPointer: [0, 0],
    presence: 0,
    inside: false,
  };
  let last = 0;

  const toRgb = (value: ThreadsColor): Rgb => {
    if (Array.isArray(value)) {
      return [
        clamp(Number(value[0] ?? 1), 0, 1),
        clamp(Number(value[1] ?? 1), 0, 1),
        clamp(Number(value[2] ?? 1), 0, 1),
      ];
    }
    if (!probeContext) return [1, 1, 1];
    probeContext.clearRect(0, 0, 1, 1);
    probeContext.fillStyle = '#ffffff';
    probeContext.fillStyle = String(value);
    probeContext.fillRect(0, 0, 1, 1);
    const data = probeContext.getImageData(0, 0, 1, 1).data;
    return [
      (data[0] ?? 255) / 255,
      (data[1] ?? 255) / 255,
      (data[2] ?? 255) / 255,
    ];
  };

  const resolveColors = (s: ThreadsSettings) => {
    if (s.colorKey === state.colorKey) return;
    state.colorKey = s.colorKey;
    state.color = toRgb(s.color);
    state.accent =
      s.accentColor === undefined || s.accentColor === ''
        ? state.color
        : toRgb(s.accentColor);
  };

  const buildStrip = (segments: number) => {
    if (segments === state.segments) return;
    state.segments = segments;
    const points = new Float32Array((segments + 1) * 4);
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      points.set([u, -1, u, 1], i * 4);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
  };

  const render = () => {
    const s = getSettings();
    resolveColors(s);
    const w = canvas.width;
    const h = canvas.height;
    const radians = (s.angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const length = Math.abs(w * cos) + Math.abs(h * sin);
    const across = Math.abs(w * sin) + Math.abs(h * cos);
    const scale = w / state.width;
    const mouse: Vec2 = s.enableMouseInteraction ? state.mouse : [0.5, 0.5];
    const strength = s.parting * state.presence * 2;
    const px = state.pointer[0] * scale;
    const py = state.pointer[1] * scale;
    const localX = px * cos + py * sin;
    const localY = -px * sin + py * cos;

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(lineProgram);
    const u = lineUniforms;
    gl.uniform1f(u.uTime ?? null, state.time);
    gl.uniform2f(u.uResolution ?? null, w, h);
    gl.uniform2f(u.uFrame ?? null, length, across);
    gl.uniform1f(u.uAmplitude ?? null, s.amplitude);
    gl.uniform1f(u.uDistance ?? null, s.distance);
    gl.uniform2f(u.uMouse ?? null, mouse[0], mouse[1]);
    gl.uniform1f(u.uCount ?? null, s.lineCount);
    gl.uniform1f(u.uThickness ?? null, s.thickness);
    gl.uniform1f(u.uSoftness ?? null, s.softness);
    gl.uniform1f(u.uWaves ?? null, s.waves);
    gl.uniform1f(u.uSplit ?? null, s.split);
    gl.uniform1f(u.uFray ?? null, s.fray);
    gl.uniform1f(u.uSeed ?? null, s.seed * 13.37);
    gl.uniform2f(u.uTurn ?? null, cos, sin);
    gl.uniform4f(
      u.uPart ?? null,
      localX,
      localY,
      strength,
      Math.min(w, h) * 0.16,
    );
    gl.uniform1f(u.uTaper ?? null, s.taper);
    gl.uniform3f(
      u.uColor ?? null,
      state.color[0],
      state.color[1],
      state.color[2],
    );
    gl.uniform3f(
      u.uAccent ?? null,
      state.accent[0],
      state.accent[1],
      state.accent[2],
    );
    gl.bindVertexArray(lineVao);
    gl.drawArraysInstanced(
      gl.TRIANGLE_STRIP,
      0,
      (state.segments + 1) * 2,
      s.lineCount,
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(screenProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.uniform1i(screenUniforms.uLines ?? null, 0);
    gl.uniform2f(screenUniforms.uResolution ?? null, w, h);
    gl.uniform1f(screenUniforms.uFade ?? null, s.fade);
    gl.uniform1f(screenUniforms.uOpacity ?? null, s.opacity);
    gl.uniform1f(screenUniforms.uCurve ?? null, 2 / s.brightness);
    gl.bindVertexArray(screenVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  const resize = (cssWidth: number, cssHeight: number) => {
    const width = Math.max(1, cssWidth);
    const height = Math.max(1, cssHeight);
    const baseDpr = Math.min(window.devicePixelRatio || 1, 2);
    const longest = Math.max(width, height) * baseDpr;
    const dpr =
      longest > MAX_RENDER_DIM ? (baseDpr * MAX_RENDER_DIM) / longest : baseDpr;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    state.width = width;
    state.height = height;
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      canvas.width,
      canvas.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      target,
      0,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    buildStrip(clamp(Math.round(width / 3), 96, 640));
    render();
  };

  const frame = (now: number) => {
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !isReduced();
    if (moving) state.time += dt * s.speed;
    const follow = 1 - Math.exp(-dt * 3);
    state.mouse[0] += (state.targetMouse[0] - state.mouse[0]) * follow;
    state.mouse[1] += (state.targetMouse[1] - state.mouse[1]) * follow;
    const glide = 1 - Math.exp(-dt * 10);
    state.pointer[0] += (state.targetPointer[0] - state.pointer[0]) * glide;
    state.pointer[1] += (state.targetPointer[1] - state.pointer[1]) * glide;
    const wanted = state.inside && s.parting > 0 ? 1 : 0;
    state.presence += (wanted - state.presence) * (1 - Math.exp(-dt * 4));
    render();
    const settling =
      Math.abs(state.targetMouse[0] - state.mouse[0]) > 0.0005 ||
      Math.abs(state.targetMouse[1] - state.mouse[1]) > 0.0005 ||
      Math.abs(state.targetPointer[0] - state.pointer[0]) > 0.05 ||
      Math.abs(state.targetPointer[1] - state.pointer[1]) > 0.05 ||
      Math.abs(wanted - state.presence) > 0.002;
    if (moving || settling) return true;
    last = 0;
    return false;
  };

  const pointerMove = (x: number, y: number, width: number, height: number) => {
    const nx = x / Math.max(1, width);
    const ny = y / Math.max(1, height);
    const inside = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
    if (inside) {
      state.targetMouse = [nx, 1 - ny];
      state.targetPointer = [x - width / 2, height / 2 - y];
      if (!state.inside && state.presence < 0.01) {
        state.pointer = [state.targetPointer[0], state.targetPointer[1]];
      }
    } else if (state.inside) {
      state.targetMouse = [0.5, 0.5];
    }
    state.inside = inside;
  };

  const pointerLeave = () => {
    state.inside = false;
    state.targetMouse = [0.5, 0.5];
  };

  const dispose = () => {
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(target);
    gl.deleteBuffer(lineBuffer);
    gl.deleteBuffer(screenBuffer);
    gl.deleteVertexArray(lineVao);
    gl.deleteVertexArray(screenVao);
    gl.deleteProgram(lineProgram);
    gl.deleteProgram(screenProgram);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  return {
    frame,
    render,
    resize,
    pointerMove,
    pointerLeave,
    resetClock: () => {
      last = 0;
    },
    dispose,
  };
}
