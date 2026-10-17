import { SILK_COMPOSITE, SILK_FIELD, SILK_VERTEX } from './silk-shaders';
import type { SilkEngine, SilkProps, SilkSettings } from './types';

const INTRO_SECONDS = 2.2;
const INTRO_RUSH = 1.6;
const WAVE_LIFE = 1.6;
const DEFAULT_LIGHT_X = -0.55;
const DEFAULT_LIGHT_Y = 0.7;
const LIGHT_TILT = Math.hypot(DEFAULT_LIGHT_X, DEFAULT_LIGHT_Y);

interface LinkedProgram {
  program: WebGLProgram;
  uniform: (name: string) => WebGLUniformLocation | null;
}

interface Ripple {
  x: number;
  y: number;
  age: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function variationShift(variation: number): [number, number] {
  const n = Number(variation) || 0;
  if (!n) return [0, 0];
  const wave = (k: number) => {
    const v = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453;
    return v - Math.floor(v) - 0.5;
  };
  return [wave(1) * 6, wave(2) * 6];
}

export function toSilkSettings(props: SilkProps): SilkSettings {
  return {
    speed: props.speed ?? 5,
    scale: props.scale ?? 1,
    color: String(props.color ?? '#7B7481'),
    sheenColor: String(props.sheenColor ?? '#ffffff'),
    noiseIntensity: Math.max(0, props.noiseIntensity ?? 1.5),
    rotation: props.rotation ?? 0,
    sheen: Math.max(0, props.sheen ?? 0.5),
    depth: clamp(props.depth ?? 0.5, 0, 1),
    glow: Math.max(0, props.glow ?? 0.3),
    ripple: Math.max(0, props.ripple ?? 1),
    wave: Math.max(0, props.wave ?? 1),
    variation: props.variation ?? 0,
    mouseInteraction: props.mouseInteraction ?? true,
    interactionStrength: Math.max(0, props.interactionStrength ?? 1),
    clickRipple: props.clickRipple ?? true,
    intro: props.intro ?? true,
    fade: clamp(props.fade ?? 0, 0, 1),
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
  const vertex = compile(gl, gl.VERTEX_SHADER, SILK_VERTEX);
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
    if (info) {
      locations.set(
        info.name.replace(/\[0\]$/, ''),
        gl.getUniformLocation(program, info.name),
      );
    }
  }
  return { program, uniform: (name) => locations.get(name) ?? null };
}

export function createSilkEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => SilkSettings,
  isReduced: () => boolean,
  wake: () => void,
): SilkEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const fieldProgram = link(gl, SILK_FIELD);
  const compositeProgram = link(gl, SILK_COMPOSITE);
  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (
    !fieldProgram ||
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
  const toRgb = (value: string) => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255];
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const initial = getSettings();
  const view = { width: 1, height: 1, ratio: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const waves: Ripple[] = [];
  const waveData = new Float32Array(16);
  const state = {
    flow: 0,
    intro: initial.intro && !isReduced() ? 0 : 1,
    touch: 0,
    x: 0,
    y: 0,
    dragX: 0,
    dragY: 0,
    lightX: DEFAULT_LIGHT_X,
    lightY: DEFAULT_LIGHT_Y,
  };
  let last = 0;
  let visible = true;
  let looping = false;
  let lastDpr = initial.dpr;

  const setShared = (
    program: LinkedProgram,
    width: number,
    height: number,
    s: SilkSettings,
    unfold: number,
  ) => {
    const u = program.uniform;
    const [shiftX, shiftY] = variationShift(s.variation);
    gl.uniform2f(u('uView'), width, height);
    gl.uniform1f(u('uScale'), s.scale);
    gl.uniform1f(u('uRotation'), s.rotation);
    gl.uniform1f(u('uTime'), state.flow - INTRO_RUSH * (1 - unfold));
    gl.uniform1f(u('uWave'), s.wave);
    gl.uniform1f(u('uRipple'), s.ripple);
    gl.uniform1f(u('uFold'), 0.25 + 0.75 * unfold);
    gl.uniform2f(u('uShift'), shiftX, shiftY);
    gl.uniform4f(
      u('uPointer'),
      state.x / view.width,
      1 - state.y / view.height,
      state.touch * s.interactionStrength,
      0.32,
    );
    gl.uniform2f(u('uDrag'), state.dragX, state.dragY);
    gl.uniform4fv(u('uWaves'), waveData);
  };

  const render = () => {
    const s = getSettings();
    const unfold = ease(state.intro);
    const presence = 1 - Math.pow(1 - state.intro, 3);
    gl.bindVertexArray(vao);

    waveData.fill(0);
    waves.slice(-4).forEach((item, index) => {
      waveData.set(
        [
          item.x,
          item.y,
          item.age * 0.6,
          Math.exp(-item.age / (WAVE_LIFE * 0.45)),
        ],
        index * 4,
      );
    });

    if (s.glow > 0) {
      sizeTarget(
        Math.max(1, Math.round(canvas.width / 4)),
        Math.max(1, Math.round(canvas.height / 4)),
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, target.width, target.height);
      gl.useProgram(fieldProgram.program);
      setShared(fieldProgram, target.width, target.height, s, unfold);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    const c = compositeProgram.uniform;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(compositeProgram.program);
    setShared(compositeProgram, canvas.width, canvas.height, s, unfold);
    gl.uniform3fv(c('uColor'), toRgb(s.color));
    gl.uniform3fv(c('uSheenColor'), toRgb(s.sheenColor));
    gl.uniform1f(c('uNoiseIntensity'), s.noiseIntensity);
    gl.uniform1f(c('uDepth'), s.depth);
    gl.uniform1f(c('uSheen'), s.sheen);
    gl.uniform1f(c('uGlow'), s.glow);
    gl.uniform1f(c('uLightMode'), s.lightMode ? 1 : 0);
    gl.uniform3f(
      c('uLight'),
      state.lightX,
      state.lightY,
      state.touch * s.interactionStrength,
    );
    gl.uniform2f(
      c('uStep'),
      view.ratio / canvas.width,
      view.ratio / canvas.height,
    );
    gl.uniform1f(c('uPresence'), presence);
    gl.uniform1f(c('uFade'), s.fade);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(c('uBloom'), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    if (!visible) {
      looping = false;
      return false;
    }
    looping = true;
    const s = getSettings();
    const reduce = isReduced();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const flowing = !s.paused && !reduce && s.speed !== 0;
    if (flowing) state.flow += dt * 0.1 * s.speed;
    if (!s.intro || reduce) state.intro = 1;
    else if (state.intro < 1)
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

    const engaged = s.mouseInteraction && pointer.inside && !reduce;
    if (engaged && state.touch < 0.01) {
      state.x = pointer.x;
      state.y = pointer.y;
    }
    const follow = 1 - Math.exp(-dt * 10);
    const prevX = state.x;
    const prevY = state.y;
    state.x += (pointer.x - state.x) * follow;
    state.y += (pointer.y - state.y) * follow;
    const velX = (state.x - prevX) / Math.max(dt, 0.001) / view.height;
    const velY = (state.y - prevY) / Math.max(dt, 0.001) / view.height;
    const dragBlend = 1 - Math.exp(-dt * 4);
    state.dragX += (clamp(velX * 0.03, -0.06, 0.06) - state.dragX) * dragBlend;
    state.dragY += (clamp(-velY * 0.03, -0.06, 0.06) - state.dragY) * dragBlend;
    state.touch +=
      ((engaged ? 1 : 0) - state.touch) *
      (1 - Math.exp(-dt * (engaged ? 3.5 : 1.4)));

    let lightGoalX = DEFAULT_LIGHT_X;
    let lightGoalY = DEFAULT_LIGHT_Y;
    if (engaged) {
      const aimX = (pointer.x / view.width - 0.5) * (view.width / view.height);
      const aimY = 0.5 - pointer.y / view.height;
      const reach = Math.hypot(aimX, aimY);
      if (reach > 0.04) {
        lightGoalX = (aimX / reach) * LIGHT_TILT;
        lightGoalY = (aimY / reach) * LIGHT_TILT;
      } else {
        lightGoalX = state.lightX;
        lightGoalY = state.lightY;
      }
    }
    const lightFollow = 1 - Math.exp(-dt * 3);
    state.lightX += (lightGoalX - state.lightX) * lightFollow;
    state.lightY += (lightGoalY - state.lightY) * lightFollow;

    for (let i = waves.length - 1; i >= 0; i--) {
      const item = waves[i];
      if (!item) continue;
      item.age += dt;
      if (item.age > WAVE_LIFE * 2.5) waves.splice(i, 1);
    }

    render();

    const settling =
      state.intro < 1 ||
      waves.length > 0 ||
      Math.abs((engaged ? 1 : 0) - state.touch) > 0.002 ||
      Math.abs(state.dragX) + Math.abs(state.dragY) > 0.0002 ||
      Math.abs(pointer.x - state.x) + Math.abs(pointer.y - state.y) > 0.3 ||
      Math.abs(lightGoalX - state.lightX) +
        Math.abs(lightGoalY - state.lightY) >
        0.001;
    looping = flowing || settling;
    if (!looping) last = 0;
    return looping;
  };

  const resize = (width: number, height: number) => {
    const s = getSettings();
    view.width = Math.max(1, width);
    view.height = Math.max(1, height);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    if (!looping) render();
    wake();
  };

  return {
    frame,
    update(idle) {
      const s = getSettings();
      if (s.dpr !== lastDpr) {
        lastDpr = s.dpr;
        resize(view.width, view.height);
        return;
      }
      if (idle) render();
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
    pointerMove(x, y, inside) {
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
      wake();
    },
    pointerDown(x, y, inside) {
      if (!getSettings().clickRipple || isReduced() || !inside) return;
      waves.push({ x: x / view.width, y: 1 - y / view.height, age: 0 });
      if (waves.length > 4) waves.shift();
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
      gl.deleteProgram(fieldProgram.program);
      gl.deleteProgram(compositeProgram.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
