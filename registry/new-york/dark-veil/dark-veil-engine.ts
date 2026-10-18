import {
  DARK_VEIL_COMPOSITE,
  DARK_VEIL_FIELD,
  DARK_VEIL_VERTEX,
} from './dark-veil-shaders';
import type { DarkVeilEngine, DarkVeilProps, DarkVeilSettings } from './types';

const INTRO_SECONDS = 1.8;
const MAX_FIELD_PIXELS = 900000;

interface GlProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Resolves props into the clamped settings the renderer reads. */
export function toDarkVeilSettings(props: DarkVeilProps): DarkVeilSettings {
  return {
    color: String(props.color ?? '#6b12ff'),
    speed: props.speed ?? 0.5,
    scale: Math.max(0.1, props.scale ?? 1),
    rotation: props.rotation ?? 0,
    flow: Math.max(0, props.flow ?? 1),
    warp: Math.max(0, props.warp ?? 0),
    variation: props.variation ?? 0,
    brightness: Math.max(0, props.brightness ?? 1),
    sheen: Math.max(0, props.sheen ?? 0),
    glow: Math.max(0, props.glow ?? 0.4),
    grain: Math.max(0, props.grain ?? 0.03),
    quality: clamp(props.quality ?? 0.5, 0.25, 1),
    mouseInteraction: props.mouseInteraction ?? true,
    mouseStrength: Math.max(0, props.mouseStrength ?? 1),
    intro: props.intro ?? true,
    fade: clamp(props.fade ?? 0, 0, 1),
    opacity: clamp(props.opacity ?? 1, 0, 1),
    lightMode: props.lightMode ?? false,
    paused: props.paused ?? false,
    dpr: props.dpr,
  };
}

function variationOffsets(variation: number): [number, number, number] {
  const n = Number(variation) || 0;
  if (!n) return [0, 0, 0];
  const wave = (k: number) => {
    const v = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453;
    return v - Math.floor(v) - 0.5;
  };
  return [wave(1), wave(2), wave(3)];
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
  fragmentSource: string,
): GlProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, DARK_VEIL_VERTEX);
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
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

/**
 * Raw WebGL2 renderer: a CPPN field pass into a mipmapped target at reduced
 * resolution, then a composite that tints it, adds glow from the mip chain,
 * a cursor-following sheen and film grain. Ported from React Bits DarkVeil.
 */
export function createDarkVeilEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => DarkVeilSettings,
  isReduced: () => boolean,
  wake: () => void,
): DarkVeilEngine | null {
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
  const fieldProgram = link(gl, DARK_VEIL_FIELD);
  const compositeProgram = link(gl, DARK_VEIL_COMPOSITE);
  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  const framebuffer = gl.createFramebuffer();
  if (!fieldProgram || !compositeProgram || !buffer || !vao || !framebuffer) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }

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
  const target = { width: 0, height: 0 };
  // texStorage2D is immutable, so a new size needs a fresh texture.
  const sizeTarget = (width: number, height: number) => {
    if (texture && target.width === width && target.height === height) return;
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
  const colorCache = new Map<string, number[]>();
  const toLinear = (value: string): number[] => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [data[0] ?? 255, data[1] ?? 255, data[2] ?? 255].map((v) =>
        Math.pow(v / 255, 2.2),
      );
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const view = { width: 1, height: 1, fieldWidth: 1, fieldHeight: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const state = {
    clock: 0,
    intro: getSettings().intro && !isReduced() ? 0 : 1,
    touch: 0,
    x: 0,
    y: 0,
    dragX: 0,
    dragY: 0,
    lightX: 0.5,
    lightY: 0.15,
  };
  let last = 0;
  let visible = true;
  let lastQuality = getSettings().quality;
  let lastDpr = getSettings().dpr;

  const render = () => {
    const s = getSettings();
    const k = state.intro;
    const presence = k * k * k * (k * (k * 6 - 15) + 10);
    gl.bindVertexArray(vao);
    sizeTarget(view.fieldWidth, view.fieldHeight);

    const f = fieldProgram.uniforms;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.useProgram(fieldProgram.program);
    const angle = (s.rotation * Math.PI) / 180;
    const [sx, sy, sz] = variationOffsets(s.variation);
    gl.uniform2f(f.uView ?? null, view.width, view.height);
    gl.uniform2f(
      f.uScale ?? null,
      view.width / target.width,
      view.height / target.height,
    );
    gl.uniform1f(f.uZoom ?? null, s.scale);
    gl.uniform2f(f.uTurn ?? null, Math.cos(angle), Math.sin(angle));
    gl.uniform1f(f.uTime ?? null, state.clock);
    gl.uniform1f(f.uFlow ?? null, s.flow);
    gl.uniform1f(f.uWarp ?? null, s.warp);
    gl.uniform3f(
      f.uSeed ?? null,
      0.3948333106474662 + sx,
      0.36 + sy,
      0.14 + sz,
    );
    gl.uniform4f(
      f.uPointer ?? null,
      state.x,
      state.y,
      state.touch * s.mouseStrength * 0.9,
      0.42,
    );
    gl.uniform2f(
      f.uDrag ?? null,
      (state.dragX * 2) / view.height,
      (state.dragY * 2) / view.height,
    );
    gl.uniform1f(f.uUnfold ?? null, (1 - presence) * 0.45);
    gl.uniform1f(f.uDither ?? null, floatTargets ? 0 : 1 / 255);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.generateMipmap(gl.TEXTURE_2D);

    const c = compositeProgram.uniforms;
    const tint = toLinear(s.color);
    const tone =
      0.2126 * (tint[0] ?? 1) +
      0.7152 * (tint[1] ?? 1) +
      0.0722 * (tint[2] ?? 1);
    const depth = Math.min(1, 0.2 / Math.max(tone, 0.001));
    const ink = tint.map((v) => Math.pow(Math.min(1, v * depth), 1 / 2.2));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(compositeProgram.program);
    gl.uniform2f(c.uResolution ?? null, canvas.width, canvas.height);
    gl.uniform2f(c.uTexel ?? null, 1 / target.width, 1 / target.height);
    gl.uniform3fv(c.uColor ?? null, tint);
    gl.uniform3fv(c.uInk ?? null, ink);
    gl.uniform1f(c.uGain ?? null, 1.15 * s.brightness);
    gl.uniform1f(c.uSheen ?? null, 0.5 * s.sheen);
    gl.uniform1f(c.uGlow ?? null, s.glow);
    gl.uniform1f(c.uPresence ?? null, presence);
    gl.uniform1f(c.uGrain ?? null, s.grain);
    gl.uniform1f(c.uFade ?? null, s.fade);
    gl.uniform1f(c.uOpacity ?? null, s.opacity);
    gl.uniform1f(c.uTime ?? null, state.clock % 1000);
    gl.uniform1f(c.uLightMode ?? null, s.lightMode ? 1 : 0);
    gl.uniform4f(
      c.uLight ?? null,
      (state.lightX * view.width) / view.height,
      1 - state.lightY,
      state.touch * s.mouseStrength,
      0,
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(c.uField ?? null, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    if (!visible) return false;
    const s = getSettings();
    const reduce = isReduced();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !reduce;
    if (moving) state.clock += dt * s.speed;
    if (!s.intro || reduce) state.intro = 1;
    else if (state.intro < 1)
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

    const engaged = s.mouseInteraction && pointer.inside && !reduce;
    if (engaged && state.touch < 0.01) {
      state.x = pointer.x;
      state.y = pointer.y;
    }
    const follow = 1 - Math.exp(-dt * 9);
    const prevX = state.x;
    const prevY = state.y;
    state.x += (pointer.x - state.x) * follow;
    state.y += (pointer.y - state.y) * follow;
    const velX = (state.x - prevX) / Math.max(dt, 0.001);
    const velY = (state.y - prevY) / Math.max(dt, 0.001);
    const dragBlend = 1 - Math.exp(-dt * 5);
    state.dragX += (clamp(velX * 0.12, -120, 120) - state.dragX) * dragBlend;
    state.dragY += (clamp(-velY * 0.12, -120, 120) - state.dragY) * dragBlend;
    state.touch +=
      ((engaged ? 1 : 0) - state.touch) *
      (1 - Math.exp(-dt * (engaged ? 3 : 1.6)));
    const lightGoalX = engaged ? pointer.x / view.width : 0.5;
    const lightGoalY = engaged ? pointer.y / view.height : 0.15;
    const lightFollow = 1 - Math.exp(-dt * 4);
    state.lightX += (lightGoalX - state.lightX) * lightFollow;
    state.lightY += (lightGoalY - state.lightY) * lightFollow;
    render();

    const settling =
      state.intro < 1 ||
      Math.abs((engaged ? 1 : 0) - state.touch) > 0.002 ||
      Math.abs(state.dragX) + Math.abs(state.dragY) > 0.05 ||
      Math.abs(pointer.x - state.x) + Math.abs(pointer.y - state.y) > 0.3 ||
      Math.abs(lightGoalX - state.lightX) +
        Math.abs(lightGoalY - state.lightY) >
        0.0005;
    const busy = moving || settling;
    if (!busy) last = 0;
    return busy;
  };

  const resize = (width: number, height: number) => {
    const s = getSettings();
    lastQuality = s.quality;
    lastDpr = s.dpr;
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    view.width = w;
    view.height = h;
    canvas.width = Math.max(1, Math.round(w * ratio));
    canvas.height = Math.max(1, Math.round(h * ratio));
    let fieldScale = s.quality;
    if (w * h * fieldScale * fieldScale > MAX_FIELD_PIXELS) {
      fieldScale = Math.sqrt(MAX_FIELD_PIXELS / (w * h));
    }
    view.fieldWidth = Math.max(1, Math.round(w * fieldScale));
    view.fieldHeight = Math.max(1, Math.round(h * fieldScale));
    render();
    wake();
  };

  return {
    frame,
    update: (idle) => {
      const s = getSettings();
      if (s.quality !== lastQuality || s.dpr !== lastDpr) {
        resize(view.width, view.height);
        return;
      }
      if (idle) render();
      wake();
    },
    resize,
    setVisible: (value) => {
      visible = value;
      if (value) {
        last = 0;
        wake();
      }
    },
    pointerMove: (x, y, inside) => {
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
      wake();
    },
    pointerLeave: () => {
      pointer.inside = false;
      wake();
    },
    resetClock: () => {
      last = 0;
    },
    dispose: () => {
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
