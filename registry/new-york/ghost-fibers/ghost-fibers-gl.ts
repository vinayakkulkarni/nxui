import {
  BRIGHT_FRAGMENT,
  COMPOSITE_FRAGMENT,
  DOT_FRAGMENT,
  DOT_VERTEX,
  DOWN_FRAGMENT,
  DUST_VERTEX,
  FOV,
  FULLSCREEN,
  RIBBON_LENGTH,
  UP_FRAGMENT,
} from './ghost-fibers-shaders';
import type {
  GhostFibersEngine,
  GhostFibersProps,
  GhostFibersSettings,
} from './types';

type Vec3 = [number, number, number];
type Vec4 = [number, number, number, number];
type Mat3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
type Mat4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

interface Program {
  program: WebGLProgram;
  uniform: (name: string) => WebGLUniformLocation | null;
}

interface Target {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
}

interface Camera {
  eye: Vec3;
  viewProj: Mat4;
  orient: Mat3;
}

interface Nearest {
  gap: number;
  s: number;
  ribbon: number;
  depth: number;
}

const MAX_RENDER_DIM = 2400;
const BLOOM_LEVELS = 5;
const INTRO_SECONDS = 2.6;
const CAMERA = 7.5;
const HOVER_EFFECTS = { focus: 0, part: 1, none: 2 } as const;
const FIBER_STYLES = { dots: 0, dashes: 0.45, lines: 1 } as const;
const GRADIENTS = { depth: 0, along: 1, across: 2 } as const;
const RIBBON_TINT: Vec3 = [0, 0.75, 0.35];
const PLACEMENTS: [Vec4, Vec4, Vec4] = [
  [0, 0, 0, 0],
  [1.9, -4.6, -0.08, 2.4],
  [-1.05, 2.0, 0.12, 4.1],
];
const RIBBON_GAIN: Vec3 = [1, 0.5, 0.55];
const DEG = Math.PI / 180;
const DEFAULT_GLOW: Vec3 = [0.55, 0.36, 0.96];
const DEFAULT_LINE: Vec3 = [1, 0.85, 0.98];
const DEFAULT_SECONDARY: Vec3 = [0.44, 0.29, 0.77];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function resolveGhostFibersSettings(
  props: GhostFibersProps,
): GhostFibersSettings {
  return {
    glowColor: String(props.glowColor ?? '#8b5cf6'),
    lineColor: props.lineColor ? String(props.lineColor) : '',
    secondaryColor: props.secondaryColor ? String(props.secondaryColor) : '',
    gradient: GRADIENTS[props.gradient ?? 'depth'] ?? 0,
    speed: Math.max(0, props.speed ?? 0.5),
    scale: clamp(props.scale ?? 1, 0.3, 3),
    rotation: (props.rotation ?? 18) * DEG,
    rollSpeed: props.rollSpeed ?? 0.15,
    layers: clamp(Math.round(props.layers ?? 3), 1, 3),
    waves: Math.max(0, props.waves ?? 1),
    twist: Math.max(0, props.twist ?? 1.2),
    threads: clamp(Math.round(props.threads ?? 72), 6, 180),
    volume: clamp(props.volume ?? 0.7, 0, 2),
    spread: clamp(props.spread ?? 1, 0.2, 3),
    density: clamp(props.density ?? 1, 0.2, 3),
    thickness: clamp(props.thickness ?? 1, 0.2, 4),
    flow: props.flow ?? 0.4,
    dotLength: FIBER_STYLES[props.fiberStyle ?? 'dots'] ?? 0,
    tips: clamp(props.tips ?? 0, 0, 1),
    foldGlow: clamp(props.foldGlow ?? 1, 0, 3),
    perspective: clamp(props.perspective ?? 0.65, 0, 1),
    depthOfField: clamp(props.depthOfField ?? 0.85, 0, 2),
    focusDepth: clamp(props.focusDepth ?? 0, -1, 1),
    particles: clamp(props.particles ?? 0.5, 0, 2),
    sparkle: clamp(props.sparkle ?? 0.5, 0, 2),
    glow: Math.max(0, props.glow ?? 0.8),
    brightness: Math.max(0, props.brightness ?? 1),
    vignette: clamp(props.vignette ?? 0.3, 0, 1),
    grain: Math.max(0, props.grain ?? 0.06),
    mouseInteraction: props.mouseInteraction ?? true,
    hover: HOVER_EFFECTS[props.hoverEffect ?? 'focus'] ?? 0,
    mouseStrength: Math.max(0, props.mouseStrength ?? 1),
    pulseOnClick: props.pulseOnClick ?? true,
    intro: props.intro ?? true,
    lightMode: props.lightMode ?? false,
    paused: props.paused ?? false,
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

function link(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): Program | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
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
  const cache = new Map<string, WebGLUniformLocation | null>();
  const uniform = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name));
    return cache.get(name) ?? null;
  };
  return { program, uniform };
}

/** projection(FOV, aspect, 0.1, 60) * translate(-eye), with eye = (0, 0, CAMERA). */
function viewProjection(aspect: number): Mat4 {
  const near = 0.1;
  const far = 60;
  const f = 1 / Math.tan(FOV / 2);
  const nf = 1 / (near - far);
  const a = (far + near) * nf;
  const b = 2 * far * near * nf;
  return [
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    a,
    -1,
    0,
    0,
    b - CAMERA * a,
    CAMERA,
  ];
}

function mul3(a: Mat3, b: Mat3): Mat3 {
  const [a0, a1, a2, a3, a4, a5, a6, a7, a8] = a;
  const [b0, b1, b2, b3, b4, b5, b6, b7, b8] = b;
  return [
    a0 * b0 + a3 * b1 + a6 * b2,
    a1 * b0 + a4 * b1 + a7 * b2,
    a2 * b0 + a5 * b1 + a8 * b2,
    a0 * b3 + a3 * b4 + a6 * b5,
    a1 * b3 + a4 * b4 + a7 * b5,
    a2 * b3 + a5 * b4 + a8 * b5,
    a0 * b6 + a3 * b7 + a6 * b8,
    a1 * b6 + a4 * b7 + a7 * b8,
    a2 * b6 + a5 * b7 + a8 * b8,
  ];
}

function orientation(yaw: number, pitch: number, roll: number): Mat3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const ry: Mat3 = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
  const rx: Mat3 = [1, 0, 0, 0, cp, sp, 0, -sp, cp];
  const rz: Mat3 = [cr, sr, 0, -sr, cr, 0, 0, 0, 1];
  return mul3(rz, mul3(rx, ry));
}

function applyMat3(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
    m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
    m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
  ];
}

function placement(ribbon: number): Vec4 {
  return PLACEMENTS[ribbon] ?? PLACEMENTS[0];
}

function centerLocal(
  s: number,
  t: number,
  ribbon: number,
  waves: number,
): Vec3 {
  const place = placement(ribbon);
  const ph = place[3];
  const x = s * RIBBON_LENGTH;
  const y =
    waves *
      (0.52 * Math.sin(x * 0.43 + t * 0.31 + ph) +
        0.26 * Math.sin(x * 0.79 - t * 0.23 + 1.3 + ph * 0.7)) +
    place[0] +
    x * place[2];
  const z =
    waves * 0.65 * Math.sin(x * 0.33 + t * 0.19 + 0.7 + ph * 1.3) + place[1];
  return [x, y, z];
}

export function createGhostFibersEngine(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  initial: GhostFibersSettings,
  initialReduce: boolean,
): GhostFibersEngine | null {
  const context = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;

  const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
  const dots = link(gl, DOT_VERTEX, DOT_FRAGMENT);
  const dust = link(gl, DUST_VERTEX, DOT_FRAGMENT);
  const bright = link(gl, FULLSCREEN, BRIGHT_FRAGMENT);
  const down = link(gl, FULLSCREEN, DOWN_FRAGMENT);
  const up = link(gl, FULLSCREEN, UP_FRAGMENT);
  const composite = link(gl, FULLSCREEN, COMPOSITE_FRAGMENT);
  if (!dots || !dust || !bright || !down || !up || !composite) {
    [dots, dust, bright, down, up, composite].forEach((entry) => {
      if (entry) gl.deleteProgram(entry.program);
    });
    return null;
  }

  const format = floatTargets ? gl.RGBA16F : gl.RGBA8;
  const makeTarget = (): Target => ({
    texture: null,
    framebuffer: gl.createFramebuffer(),
    width: 0,
    height: 0,
  });
  const allocate = (target: Target, width: number, height: number) => {
    if (target.texture && target.width === width && target.height === height)
      return;
    if (target.texture) gl.deleteTexture(target.texture);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    target.texture = texture;
    target.width = width;
    target.height = height;
  };
  const scene = makeTarget();
  const chain: Target[] = Array.from({ length: BLOOM_LEVELS }, makeTarget);
  const vao = gl.createVertexArray();

  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const probeContext = probe.getContext('2d', { willReadFrequently: true });

  let settings = initial;
  let reduce = initialReduce;
  const state = {
    time: 0,
    roll: 0,
    flow: 0,
    frame: 0,
    intro: initial.intro && !initialReduce ? 0 : INTRO_SECONDS,
    width: 1,
    height: 1,
    fit: 1,
    colorKey: '',
    glow: DEFAULT_GLOW,
    line: DEFAULT_LINE,
    secondary: DEFAULT_SECONDARY,
    pointer: { x: 0, y: 0, inside: false },
    hover: { x: 0, y: 0, presence: 0, placed: false },
    look: { x: 0, y: 0, vx: 0, vy: 0 },
    focus: CAMERA + initial.focusDepth * 3,
    pulse: { s: 0, age: 9, strength: 0, ribbon: 0 },
  };
  let currentCamera: Camera | null = null;
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = true;

  const toRgb = (value: string, fallback: Vec3): Vec3 => {
    if (!probeContext || !value) return fallback;
    const css = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
    probeContext.clearRect(0, 0, 1, 1);
    probeContext.fillStyle = '#000000';
    probeContext.fillStyle = css;
    probeContext.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = probeContext.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255];
  };

  const resolveColors = (s: GhostFibersSettings) => {
    const key = `${s.glowColor}|${s.lineColor}|${s.secondaryColor}|${s.lightMode}`;
    if (key === state.colorKey) return;
    state.colorKey = key;
    const glow = toRgb(s.glowColor, DEFAULT_GLOW);
    state.glow = glow;
    state.secondary = s.secondaryColor
      ? toRgb(s.secondaryColor, glow)
      : [glow[0] * 0.8, glow[1] * 0.8, glow[2] * 0.8];
    if (s.lineColor) state.line = toRgb(s.lineColor, glow);
    else
      state.line = s.lightMode
        ? glow
        : [
            glow[0] + (1 - glow[0]) * 0.72,
            glow[1] + (1 - glow[1]) * 0.72,
            glow[2] + (1 - glow[2]) * 0.72,
          ];
  };

  const cameraFor = (s: GhostFibersSettings): Camera => {
    const aspect = state.width / Math.max(state.height, 1);
    const orient = orientation(
      s.perspective * 0.85 + state.look.x * 0.22,
      0.12 - state.look.y * 0.14,
      s.rotation,
    );
    return { eye: [0, 0, CAMERA], viewProj: viewProjection(aspect), orient };
  };

  const screenOf = (camera: Camera, world: Vec3) => {
    const m = camera.viewProj;
    const x = m[0] * world[0] + m[4] * world[1] + m[8] * world[2] + m[12];
    const y = m[1] * world[0] + m[5] * world[1] + m[9] * world[2] + m[13];
    const w = m[3] * world[0] + m[7] * world[1] + m[11] * world[2] + m[15];
    return {
      x: ((x / w) * 0.5 + 0.5) * state.width,
      y: (0.5 - (y / w) * 0.5) * state.height,
      depth: w,
    };
  };

  const nearestOnRibbon = (
    s: GhostFibersSettings,
    px: number,
    py: number,
  ): Nearest | null => {
    const camera = currentCamera;
    if (!camera) return null;
    const factor = s.scale * state.fit;
    let best: Nearest | null = null;
    for (let ribbon = 0; ribbon < s.layers; ribbon += 1) {
      for (let i = 0; i <= 96; i += 1) {
        const u = i / 96 - 0.5;
        const [lx, ly, lz] = centerLocal(u, state.time, ribbon, s.waves);
        const world = applyMat3(camera.orient, [
          lx * factor,
          ly * factor,
          lz * factor,
        ]);
        const screen = screenOf(camera, world);
        const gap = Math.hypot(screen.x - px, screen.y - py);
        if (!best || gap < best.gap)
          best = { gap, s: u, ribbon, depth: screen.depth };
      }
    }
    return best;
  };

  const drawPass = (
    program: Program,
    target: Target,
    source: Target,
    texelX: number,
    texelY: number,
  ) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.useProgram(program.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform1i(program.uniform('uSource'), 0);
    gl.uniform2f(program.uniform('uTexel'), texelX, texelY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const render = () => {
    const s = settings;
    resolveColors(s);
    const camera = cameraFor(s);
    currentCamera = camera;
    const ratio = canvas.height / Math.max(state.height, 1);
    const intro =
      s.paused || reduce ? 1 : clamp(state.intro / INTRO_SECONDS, 0, 1);
    const introEase = 1 - (1 - intro) * (1 - intro) * (1 - intro);

    allocate(scene, canvas.width, canvas.height);
    gl.bindVertexArray(vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.framebuffer);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    const dotsPerFiber = Math.round(260 * s.density);
    const blurCap =
      22 *
      clamp(Math.sqrt(56000 / (s.threads * dotsPerFiber * s.layers)), 0.45, 1);
    const area = Math.max(0.8 * s.thickness, 0.45) ** 2 / 0.64;
    const load = Math.pow((s.threads / 72) * s.density * area, -0.75);
    gl.useProgram(dots.program);
    const u = dots.uniform;
    gl.uniform1f(u('uTime'), state.time);
    gl.uniform1f(u('uTwist'), s.twist);
    gl.uniform1f(u('uRoll'), state.roll);
    gl.uniform1f(u('uWaves'), s.waves);
    gl.uniform1f(u('uWidth'), 0.62 * s.spread);
    gl.uniformMatrix3fv(u('uOrient'), false, camera.orient);
    gl.uniform1f(u('uScale'), s.scale * state.fit);
    gl.uniformMatrix4fv(u('uViewProj'), false, camera.viewProj);
    gl.uniform3f(u('uEye'), camera.eye[0], camera.eye[1], camera.eye[2]);
    gl.uniform2f(u('uViewport'), canvas.width, canvas.height);
    gl.uniform1f(u('uDpr'), ratio);
    gl.uniform1f(u('uFibers'), s.threads);
    gl.uniform1f(u('uDots'), dotsPerFiber);
    gl.uniform1f(u('uFlow'), state.flow);
    gl.uniform1f(u('uSize'), 1.6 * s.thickness);
    gl.uniform1f(u('uFocus'), state.focus);
    gl.uniform1f(u('uDof'), s.depthOfField);
    gl.uniform1f(u('uMaxCoc'), blurCap);
    gl.uniform1f(u('uFocal'), CAMERA);
    gl.uniform1f(u('uIntro'), introEase);
    gl.uniform4f(
      u('uPulse'),
      state.pulse.s,
      state.pulse.age,
      state.pulse.strength,
      state.pulse.ribbon,
    );
    gl.uniform4f(
      u('uHover'),
      state.hover.x * ratio,
      (state.height - state.hover.y) * ratio,
      140 * ratio,
      state.hover.presence * s.mouseStrength,
    );
    gl.uniform1f(u('uPart'), s.hover === 1 ? 1 : 0);
    gl.uniform1f(u('uDotLength'), s.dotLength);
    gl.uniform1f(u('uSparkle'), s.sparkle);
    gl.uniform1f(u('uDepthSpread'), 0.12);
    gl.uniform1f(u('uVolume'), s.volume);
    gl.uniform3f(u('uGlowColor'), ...state.glow);
    gl.uniform3f(u('uLineColor'), ...state.line);
    gl.uniform3f(u('uSecondaryColor'), ...state.secondary);
    gl.uniform1f(u('uTips'), s.tips);
    gl.uniform1f(u('uGradient'), s.gradient);
    gl.uniform1f(u('uFold'), s.foldGlow);
    for (let ribbon = 0; ribbon < s.layers; ribbon += 1) {
      const place = placement(ribbon);
      gl.uniform1f(u('uRibbon'), ribbon);
      gl.uniform4f(u('uPlace'), place[0], place[1], place[2], place[3]);
      gl.uniform1f(u('uGain'), (RIBBON_GAIN[ribbon] ?? 1) * load);
      gl.uniform1f(u('uTint'), RIBBON_TINT[ribbon] ?? 0);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, s.threads * dotsPerFiber);
    }

    const dustCount = Math.round(420 * s.particles);
    if (dustCount > 0) {
      gl.useProgram(dust.program);
      const d = dust.uniform;
      gl.uniformMatrix4fv(d('uViewProj'), false, camera.viewProj);
      gl.uniform2f(d('uViewport'), canvas.width, canvas.height);
      gl.uniform1f(d('uDpr'), ratio);
      gl.uniform1f(d('uTime'), state.time);
      gl.uniform1f(d('uSize'), 2.2 * s.thickness);
      gl.uniform1f(d('uFocus'), state.focus);
      gl.uniform1f(d('uDof'), s.depthOfField);
      gl.uniform1f(d('uMaxCoc'), 22);
      gl.uniform1f(d('uFocal'), CAMERA);
      gl.uniform1f(d('uIntro'), introEase);
      gl.uniform1f(d('uSparkle'), s.sparkle);
      gl.uniform1f(d('uScale'), s.scale * state.fit);
      gl.uniform1f(d('uGradient'), s.gradient);
      gl.uniform1f(d('uGain'), 1 / s.thickness);
      gl.uniform3f(d('uGlowColor'), ...state.glow);
      gl.uniform3f(d('uLineColor'), ...state.line);
      gl.uniform3f(d('uSecondaryColor'), ...state.secondary);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, dustCount);
    }
    gl.disable(gl.BLEND);

    const blooming = s.glow > 0.001 && !s.lightMode;
    gl.bindVertexArray(vao);
    const first = chain[0];
    if (blooming && first) {
      chain.forEach((target, index) => {
        allocate(
          target,
          Math.max(1, Math.round(canvas.width / 2 ** (index + 1))),
          Math.max(1, Math.round(canvas.height / 2 ** (index + 1))),
        );
      });
      drawPass(bright, first, scene, 0.5 / scene.width, 0.5 / scene.height);
      for (let index = 1; index < chain.length; index += 1) {
        const target = chain[index];
        const source = chain[index - 1];
        if (target && source)
          drawPass(down, target, source, 1 / source.width, 1 / source.height);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      for (let index = chain.length - 1; index > 0; index -= 1) {
        const target = chain[index - 1];
        const source = chain[index];
        if (target && source)
          drawPass(up, target, source, 0.5 / source.width, 0.5 / source.height);
      }
      gl.disable(gl.BLEND);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(composite.program);
    const c = composite.uniform;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(
      gl.TEXTURE_2D,
      blooming && first ? first.texture : scene.texture,
    );
    gl.uniform1i(c('uScene'), 0);
    gl.uniform1i(c('uBloom'), 1);
    gl.uniform1f(c('uGlow'), blooming ? s.glow : 0);
    gl.uniform1f(c('uBrightness'), s.brightness);
    gl.uniform1f(c('uLightMode'), s.lightMode ? 1 : 0);
    gl.uniform1f(c('uGrain'), s.grain);
    gl.uniform1f(c('uVignette'), s.vignette);
    gl.uniform1f(c('uFrame'), state.frame % 977);
    gl.uniform2f(c('uView'), canvas.width, canvas.height);
    gl.uniform1f(c('uDpr'), ratio);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive || !visible || document.hidden) return;
    const s = settings;
    const elapsed = last ? (now - last) / 1000 : 1 / 60;
    const dt = Math.min(0.05, elapsed);
    last = now;
    const moving = !s.paused && !reduce;
    if (moving) {
      state.frame += 1;
      state.time += dt * s.speed;
      state.roll += dt * s.speed * s.rollSpeed;
      state.flow += dt * s.flow * 12;
      state.intro += Math.min(elapsed, 1);
    } else if (state.intro < INTRO_SECONDS) {
      state.intro = INTRO_SECONDS;
    }
    state.pulse.age += dt;
    state.pulse.strength = Math.max(0, 1 - state.pulse.age / 1.8) ** 2;

    const { pointer, hover, look } = state;
    const active = s.mouseInteraction && pointer.inside && !reduce;
    if (active && !hover.placed) {
      hover.x = pointer.x;
      hover.y = pointer.y;
      hover.placed = true;
    }
    hover.x += (pointer.x - hover.x) * (1 - Math.exp(-dt / 0.08));
    hover.y += (pointer.y - hover.y) * (1 - Math.exp(-dt / 0.08));
    const goal = active ? 1 : 0;
    hover.presence +=
      (goal - hover.presence) *
      (1 - Math.exp(-dt / (goal > hover.presence ? 0.3 : 0.6)));
    if (!active && hover.presence < 0.001) hover.placed = false;
    const lookX = active ? (pointer.x / state.width - 0.5) * 0.5 : 0;
    const lookY = active ? (0.5 - pointer.y / state.height) * 0.5 : 0;
    look.vx += (30 * (lookX - look.x) - 11 * look.vx) * dt;
    look.vy += (30 * (lookY - look.y) - 11 * look.vy) * dt;
    look.x += look.vx * dt;
    look.y += look.vy * dt;

    const resting = CAMERA + s.focusDepth * 3;
    let focusGoal = resting;
    if (active && s.hover === 0) {
      const near = nearestOnRibbon(s, hover.x, hover.y);
      if (near)
        focusGoal =
          resting +
          (near.depth - resting) *
            hover.presence *
            Math.min(1, s.mouseStrength);
    }
    state.focus += (focusGoal - state.focus) * (1 - Math.exp(-dt / 0.35));

    render();
    const settling =
      Math.abs(goal - hover.presence) > 0.002 ||
      Math.abs(lookX - look.x) > 0.0002 ||
      Math.abs(lookY - look.y) > 0.0002 ||
      Math.abs(focusGoal - state.focus) > 0.001 ||
      state.pulse.strength > 0.001;
    if (moving || settling) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!raf && alive && visible && !document.hidden)
      raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const baseDpr = Math.min(settings.dpr || window.devicePixelRatio || 1, 2);
    const longest = Math.max(width, height) * baseDpr;
    const ratio =
      longest > MAX_RENDER_DIM ? (baseDpr * MAX_RENDER_DIM) / longest : baseDpr;
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    state.width = width;
    state.height = height;
    state.fit = clamp(width / height / 1.5, 0.6, 1);
    render();
  };

  resize();
  wake();

  return {
    update(next) {
      const dprChanged = next.dpr !== settings.dpr;
      settings = next;
      if (dprChanged) resize();
      else if (!raf) render();
      wake();
    },
    setReducedMotion(next) {
      reduce = next;
      if (!raf) render();
      wake();
    },
    resize,
    setVisible(next) {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    pointerMove(clientX, clientY) {
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      state.pointer.x = x;
      state.pointer.y = y;
      state.pointer.inside =
        x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      wake();
    },
    pointerDown(clientX, clientY) {
      const s = settings;
      if (!s.mouseInteraction || !s.pulseOnClick || reduce) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const near = nearestOnRibbon(s, x, y);
      if (near)
        state.pulse = { s: near.s, age: 0, strength: 1, ribbon: near.ribbon };
      wake();
    },
    pointerLeave() {
      state.pointer.inside = false;
      wake();
    },
    visibilityChange() {
      last = 0;
      wake();
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      gl.deleteVertexArray(vao);
      [scene, ...chain].forEach((target) => {
        if (target.texture) gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      });
      [dots, dust, bright, down, up, composite].forEach((entry) =>
        gl.deleteProgram(entry.program),
      );
    },
  };
}
