import { BEAMS_COMPOSITE, BEAMS_FIELD, BEAMS_VERTEX } from './beams-shaders';
import type {
  BeamsEngine,
  BeamsLook,
  BeamsPresetName,
  BeamsProps,
  BeamsSettings,
} from './types';

type Vec3 = [number, number, number];
type Uniforms = Map<string, WebGLUniformLocation | null>;

const INTRO_SECONDS = 1.6;
const MAX_FIELD_PIXELS = 1600000;

const LOOK: BeamsLook = {
  color: '#ffffff',
  beamWidth: 140,
  rotation: 30,
  waveLength: 233,
  depth: 1,
  sharpness: 0.6,
  twist: 0,
  fillLight: 0.3,
  glow: 0.6,
};

const PRESETS: Record<BeamsPresetName, Partial<BeamsLook>> = {
  studio: {},
  ember: { color: '#ff8a4c', rotation: 20, glow: 0.85, fillLight: 0.2 },
  glacier: {
    color: '#8fd0ff',
    beamWidth: 90,
    rotation: 45,
    sharpness: 0.75,
    fillLight: 0.4,
  },
  chrome: {
    sharpness: 0.8,
    depth: 1.2,
    fillLight: 0.9,
    glow: 0.4,
    rotation: 35,
  },
  dawn: {
    color: '#ffd59a',
    rotation: -30,
    waveLength: 320,
    twist: 0.4,
    glow: 0.7,
  },
};

/** Full look for a named preset, ready to spread onto the component. */
export function beamsPreset(name: BeamsPresetName): BeamsLook {
  return { ...LOOK, ...PRESETS[name] };
}

export function isBeamsPreset(value: unknown): value is BeamsPresetName {
  return typeof value === 'string' && Object.hasOwn(PRESETS, value);
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function normalizeBeams(
  props: BeamsProps,
  reduce: boolean,
): BeamsSettings {
  return {
    color: String(props.color ?? '#ffffff'),
    beamWidth: Math.max(8, props.beamWidth ?? 140),
    rotation: props.rotation ?? 30,
    speed: props.speed ?? 1,
    waveLength: Math.max(20, props.waveLength ?? 233),
    depth: Math.max(0, props.depth ?? 1),
    sharpness: clamp(props.sharpness ?? 0.6, 0, 1),
    twist: clamp(props.twist ?? 0, 0, 2),
    fillLight: clamp(props.fillLight ?? 0.3, 0, 1.5),
    glow: Math.max(0, props.glow ?? 0.6),
    brightness: Math.max(0, props.brightness ?? 1.6),
    variation: Number(props.variation) || 0,
    grain: Math.max(0, props.grain ?? 0.35),
    quality: clamp(props.quality ?? 0.75, 0.25, 1),
    mouseInteraction: props.mouseInteraction ?? true,
    mouseStrength: Math.max(0, props.mouseStrength ?? 1),
    intro: props.intro ?? true,
    fade: clamp(props.fade ?? 0, 0, 1),
    opacity: clamp(props.opacity ?? 1, 0, 1),
    lightMode: props.lightMode ?? false,
    paused: props.paused ?? false,
    dpr: props.dpr,
    reduce,
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

function link(gl: WebGL2RenderingContext, fragmentSource: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, BEAMS_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Uniforms = new Map();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info)
      uniforms.set(info.name, gl.getUniformLocation(program, info.name));
  }
  return { program, uniforms };
}

export function createBeams(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => BeamsSettings,
): BeamsEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
  const fieldProgram = link(gl, BEAMS_FIELD);
  const compositeProgram = link(gl, BEAMS_COMPOSITE);
  if (!fieldProgram || !compositeProgram) return null;
  const f = (name: string) => fieldProgram.uniforms.get(name) ?? null;
  const c = (name: string) => compositeProgram.uniforms.get(name) ?? null;

  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  let texture: WebGLTexture | null = null;
  const framebuffer = gl.createFramebuffer();
  const target = { width: 0, height: 0 };
  const sizeTarget = (width: number, height: number) => {
    if (target.width === width && target.height === height) return;
    target.width = width;
    target.height = height;
    if (texture) gl.deleteTexture(texture);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;
    gl.texStorage2D(
      gl.TEXTURE_2D,
      levels,
      floatTargets ? gl.RGBA16F : gl.RGBA8,
      width,
      height,
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
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
  };

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, Vec3>();
  const toLinear = (value: string): Vec3 => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb: Vec3 = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [
        Math.pow((data[0] ?? 255) / 255, 2.2),
        Math.pow((data[1] ?? 255) / 255, 2.2),
        Math.pow((data[2] ?? 255) / 255, 2.2),
      ];
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const initial = getSettings();
  const view = { width: 1, height: 1, fieldWidth: 1, fieldHeight: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const state = {
    clock: 0,
    intro: initial.intro && !initial.reduce ? 0 : 1,
    reach: 0,
    x: 0,
    y: 0,
    lightY: 0,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let disposed = false;
  let lastQuality = initial.quality;
  let lastDpr = initial.dpr;

  const render = () => {
    const s = getSettings();
    const p = state.intro;
    const presence = p * p * p * (p * (p * 6 - 15) + 10);
    gl.bindVertexArray(vao);
    sizeTarget(view.fieldWidth, view.fieldHeight);

    const angle = (s.rotation * Math.PI) / 180;
    const sweep = (1 - presence) * -9;
    const reach = state.reach * s.mouseStrength;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.useProgram(fieldProgram.program);
    gl.uniform2f(f('uView'), view.width, view.height);
    gl.uniform2f(
      f('uScale'),
      view.width / target.width,
      view.height / target.height,
    );
    gl.uniform2f(f('uTurn'), Math.cos(angle), Math.sin(angle));
    gl.uniform1f(f('uTime'), (state.clock * 0.12) % 289);
    gl.uniform1f(f('uWidth'), s.beamWidth);
    gl.uniform1f(f('uWave'), s.waveLength);
    gl.uniform1f(f('uDepth'), s.depth);
    gl.uniform1f(f('uRough'), 0.55 - s.sharpness * 0.5);
    gl.uniform1f(f('uSeed'), s.variation);
    gl.uniform1f(f('uTwist'), s.twist);
    gl.uniform1f(f('uFill'), s.fillLight);
    gl.uniform3f(f('uLight'), 0, 3 + sweep + state.lightY * reach, 10);
    gl.uniform1f(f('uCamera'), view.height * 1.866);
    gl.uniform4f(
      f('uPointer'),
      state.x,
      view.height - state.y,
      reach,
      Math.max(view.height, view.width) * 0.28,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.generateMipmap(gl.TEXTURE_2D);

    const tint = toLinear(s.color);
    const tone = 0.2126 * tint[0] + 0.7152 * tint[1] + 0.0722 * tint[2];
    const shadeDepth = Math.min(1, 0.18 / Math.max(tone, 0.001));
    const ink = tint.map((v) => Math.pow(Math.min(1, v * shadeDepth), 1 / 2.2));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(compositeProgram.program);
    gl.uniform2f(c('uResolution'), canvas.width, canvas.height);
    gl.uniform3fv(c('uColor'), tint);
    gl.uniform3fv(c('uInk'), ink);
    gl.uniform1f(c('uGain'), s.brightness);
    gl.uniform1f(c('uGlow'), s.glow);
    gl.uniform1f(c('uPresence'), presence);
    gl.uniform1f(c('uGrain'), s.grain * 1.75);
    gl.uniform1f(c('uFade'), s.fade);
    gl.uniform1f(c('uOpacity'), s.opacity);
    gl.uniform1f(c('uLightMode'), s.lightMode ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(c('uField'), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !s.reduce;
    if (moving) state.clock += dt * s.speed;
    if (!s.intro || s.reduce) state.intro = 1;
    else if (state.intro < 1) {
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    }

    const engaged = s.mouseInteraction && pointer.inside && !s.reduce;
    if (engaged && state.reach < 0.01) {
      state.x = pointer.x;
      state.y = pointer.y;
    }
    const follow = 1 - Math.exp(-dt * 7);
    state.x += (pointer.x - state.x) * follow;
    state.y += (pointer.y - state.y) * follow;
    state.reach +=
      ((engaged ? 1 : 0) - state.reach) *
      (1 - Math.exp(-dt * (engaged ? 3.2 : 1.8)));
    const turn = (s.rotation * Math.PI) / 180;
    const offsetX = state.x - view.width / 2;
    const offsetY = view.height / 2 - state.y;
    const along = -Math.sin(turn) * offsetX + Math.cos(turn) * offsetY;
    state.lightY = clamp((along / (view.height * 0.5)) * 3, -4, 4);
    render();

    const settling =
      state.intro < 1 ||
      Math.abs((engaged ? 1 : 0) - state.reach) > 0.002 ||
      Math.abs(pointer.x - state.x) + Math.abs(pointer.y - state.y) > 0.3;
    if (moving || settling) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!raf && !disposed && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  };

  const resize = () => {
    if (disposed) return;
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    view.width = width;
    view.height = height;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    let fieldScale = s.quality * ratio;
    if (width * height * fieldScale * fieldScale > MAX_FIELD_PIXELS) {
      fieldScale = Math.sqrt(MAX_FIELD_PIXELS / (width * height));
    }
    view.fieldWidth = Math.max(1, Math.round(width * fieldScale));
    view.fieldHeight = Math.max(1, Math.round(height * fieldScale));
    if (!raf) render();
    wake();
  };

  resize();

  return {
    resize,
    refresh() {
      if (disposed) return;
      const s = getSettings();
      if (s.quality !== lastQuality || s.dpr !== lastDpr) {
        lastQuality = s.quality;
        lastDpr = s.dpr;
        resize();
        return;
      }
      if (!raf) render();
      wake();
    },
    setVisible(nextVisible: boolean) {
      visible = nextVisible;
      if (visible) {
        last = 0;
        wake();
      }
    },
    visibilityChange() {
      last = 0;
      wake();
    },
    pointerMove(event: PointerEvent) {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside =
        pointer.x >= 0 &&
        pointer.y >= 0 &&
        pointer.x <= rect.width &&
        pointer.y <= rect.height;
      wake();
    },
    pointerOut(event: PointerEvent) {
      if (event.relatedTarget) return;
      pointer.inside = false;
      wake();
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      if (texture) gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteProgram(fieldProgram.program);
      gl.deleteProgram(compositeProgram.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
