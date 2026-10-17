import {
  PLASMA_COMPOSITE,
  PLASMA_VERTEX,
  PLASMA_VOLUME,
} from './plasma-shaders';
import type { PlasmaEngine, PlasmaProps, PlasmaSettings } from './types';

const INTRO_SECONDS = 1.6;
const MAX_VOLUME_PIXELS = 1600000;

interface LinkedProgram {
  program: WebGLProgram;
  uniform: (name: string) => WebGLUniformLocation | null;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function toPlasmaSettings(props: PlasmaProps): PlasmaSettings {
  return {
    color: String(props.color ?? '#a6a3b8'),
    speed: props.speed ?? 1,
    direction: props.direction ?? 'forward',
    scale: Math.max(0.1, props.scale ?? 1),
    twist: props.twist ?? 1,
    wave: Math.max(0, props.wave ?? 1),
    softness: clamp(props.softness ?? 0.5, 0, 1),
    shine: Math.max(0, props.shine ?? 1),
    brightness: Math.max(0, props.brightness ?? 1),
    grain: Math.max(0, props.grain ?? 0.04),
    quality: clamp(props.quality ?? 0.75, 0.25, 1),
    mouseInteractive: props.mouseInteractive ?? true,
    intro: props.intro ?? true,
    fade: clamp(props.fade ?? 0, 0, 1),
    opacity: clamp(props.opacity ?? 1, 0, 1),
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
  fragmentSource: string,
): LinkedProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, PLASMA_VERTEX);
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
  const locations = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info)
      locations.set(info.name, gl.getUniformLocation(program, info.name));
  }
  return { program, uniform: (name) => locations.get(name) ?? null };
}

/**
 * Two-pass WebGL2 renderer: a raymarched satin volume at reduced resolution,
 * then a full-resolution composite that tone-maps it into light.
 */
export function createPlasmaEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => PlasmaSettings,
  isReduced: () => boolean,
  wake: () => void,
): PlasmaEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const floatTargets = Boolean(gl.getExtension('EXT_color_buffer_float'));
  const volumeProgram = link(gl, PLASMA_VOLUME);
  const compositeProgram = link(gl, PLASMA_COMPOSITE);
  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (
    !volumeProgram ||
    !compositeProgram ||
    !buffer ||
    !vao ||
    !texture ||
    !framebuffer
  ) {
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

  const target = { width: 0, height: 0 };
  const sizeTarget = (width: number, height: number) => {
    if (target.width === width && target.height === height) return;
    target.width = width;
    target.height = height;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (floatTargets) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA16F,
        width,
        height,
        0,
        gl.RGBA,
        gl.HALF_FLOAT,
        null,
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    }
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

  const initial = getSettings();
  const view = { width: 1, height: 1, volumeWidth: 1, volumeHeight: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const state = {
    clock: 0,
    intro: initial.intro && !isReduced() ? 0 : 1,
    yaw: 0,
    pitch: 0,
    yawVelocity: 0,
    pitchVelocity: 0,
    heat: 0,
    heatX: 0,
    heatY: 0,
  };
  let last = 0;
  let looping = false;
  let lastQuality = initial.quality;
  let lastDpr = initial.dpr;

  const timeOf = (s: PlasmaSettings) => {
    const t = state.clock * 0.4;
    if (s.direction === 'reverse') return -t;
    if (s.direction !== 'pingpong') return t;
    const span = 10;
    const segment = (state.clock % span) / span;
    const eased = segment * segment * (3 - 2 * segment);
    return (
      (Math.floor(state.clock / span) % 2 === 0 ? eased : 1 - eased) *
      span *
      0.4
    );
  };

  const render = () => {
    const s = getSettings();
    const presence = state.intro * state.intro * (3 - 2 * state.intro);
    gl.bindVertexArray(vao);
    sizeTarget(view.volumeWidth, view.volumeHeight);

    const v = volumeProgram.uniform;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.useProgram(volumeProgram.program);
    gl.uniform2f(v('uView'), view.width, view.height);
    gl.uniform2f(
      v('uScale'),
      view.width / target.width,
      view.height / target.height,
    );
    gl.uniform1f(v('uZoom'), s.scale);
    gl.uniform1f(v('uTime'), timeOf(s) + (1 - presence) * 1.4);
    gl.uniform1f(v('uTwist'), s.twist);
    gl.uniform1f(v('uWave'), 0.4 * s.wave);
    gl.uniform1f(v('uSharpness'), 100 - s.softness * 90);
    gl.uniform2f(v('uOrbit'), state.yaw, state.pitch);
    gl.uniform1f(v('uDither'), floatTargets ? 0 : 1 / 255);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const c = compositeProgram.uniform;
    const base = toLinear(s.color);
    const highlight = base.map((value) => value + (1 - value) * 0.85);
    const tone =
      0.2126 * (base[0] ?? 1) +
      0.7152 * (base[1] ?? 1) +
      0.0722 * (base[2] ?? 1);
    const depth = Math.min(1, 0.16 / Math.max(tone, 0.001));
    const ink = base.map((value) =>
      Math.pow(Math.min(1, value * depth), 1 / 2.2),
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(compositeProgram.program);
    gl.uniform2f(c('uResolution'), canvas.width, canvas.height);
    gl.uniform3fv(c('uColor'), base);
    gl.uniform3fv(c('uHighlight'), highlight);
    gl.uniform3fv(c('uInk'), ink);
    gl.uniform1f(c('uGain'), 4.8 * s.brightness);
    gl.uniform1f(c('uShine'), 0.025 * s.shine);
    gl.uniform1f(c('uPresence'), presence);
    gl.uniform1f(c('uGrain'), s.grain);
    gl.uniform1f(c('uFade'), s.fade);
    gl.uniform1f(c('uOpacity'), s.opacity);
    gl.uniform1f(c('uTime'), state.clock % 1000);
    gl.uniform1f(c('uLightMode'), s.lightMode ? 1 : 0);
    gl.uniform3f(
      c('uHeat'),
      (state.heatX * canvas.width) / view.width,
      ((view.height - state.heatY) * canvas.height) / view.height,
      state.heat,
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(c('uVolume'), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    const s = getSettings();
    const reduce = isReduced();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !reduce;
    if (moving) state.clock += dt * s.speed;
    if (!s.intro || reduce) state.intro = 1;
    else if (state.intro < 1)
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    const engaged = s.mouseInteractive && pointer.inside && !reduce;
    const goalYaw = engaged ? (pointer.x / view.width - 0.5) * 0.9 : 0;
    const goalPitch = engaged ? (pointer.y / view.height - 0.5) * 0.18 : 0;
    state.yawVelocity +=
      (40 * (goalYaw - state.yaw) - 11 * state.yawVelocity) * dt;
    state.pitchVelocity +=
      (40 * (goalPitch - state.pitch) - 11 * state.pitchVelocity) * dt;
    state.yaw += state.yawVelocity * dt;
    state.pitch += state.pitchVelocity * dt;
    state.heat +=
      ((engaged ? 1 : 0) - state.heat) *
      (1 - Math.exp(-dt * (engaged ? 4 : 2)));
    state.heatX += (pointer.x - state.heatX) * (1 - Math.exp(-dt * 8));
    state.heatY += (pointer.y - state.heatY) * (1 - Math.exp(-dt * 8));
    render();
    const settling =
      state.intro < 1 ||
      Math.abs(goalYaw - state.yaw) > 0.0005 ||
      Math.abs(state.yawVelocity) > 0.0005 ||
      Math.abs(goalPitch - state.pitch) > 0.0005 ||
      Math.abs(state.pitchVelocity) > 0.0005 ||
      Math.abs((engaged ? 1 : 0) - state.heat) > 0.002;
    looping = moving || settling;
    if (!looping) last = 0;
    return looping;
  };

  const resize = (width: number, height: number) => {
    const s = getSettings();
    view.width = Math.max(1, width);
    view.height = Math.max(1, height);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * ratio));
    canvas.height = Math.max(1, Math.round(view.height * ratio));
    let scale = s.quality;
    if (view.width * view.height * scale * scale > MAX_VOLUME_PIXELS) {
      scale = Math.sqrt(MAX_VOLUME_PIXELS / (view.width * view.height));
    }
    view.volumeWidth = Math.max(1, Math.round(view.width * scale));
    view.volumeHeight = Math.max(1, Math.round(view.height * scale));
    if (!looping) render();
    wake();
  };

  return {
    frame,
    update(idle) {
      const s = getSettings();
      if (s.quality !== lastQuality || s.dpr !== lastDpr) {
        lastQuality = s.quality;
        lastDpr = s.dpr;
        resize(view.width, view.height);
        return;
      }
      if (idle) render();
      wake();
    },
    resize,
    pointerMove(x, y, inside) {
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
      wake();
    },
    pointerLeave() {
      pointer.inside = false;
      wake();
    },
    resetClock() {
      last = 0;
    },
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteProgram(volumeProgram.program);
      gl.deleteProgram(compositeProgram.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
