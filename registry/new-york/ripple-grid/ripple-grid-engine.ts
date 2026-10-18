import {
  RIPPLE_GRID_FRAGMENT,
  RIPPLE_GRID_MAX_RIPPLES,
  RIPPLE_GRID_VERTEX,
} from './ripple-grid-shaders';
import type {
  RippleGridEngine,
  RippleGridProps,
  RippleGridSettings,
} from './types';

const INTRO_SECONDS = 1.6;
const VARIANTS: Record<string, number> = { lines: 0, dots: 1, cross: 2 };

interface LinkedProgram {
  program: WebGLProgram;
  uniform: (name: string) => WebGLUniformLocation | null;
}

interface Ripple {
  x: number;
  y: number;
  born: number;
  strength: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function toRippleGridSettings(
  props: RippleGridProps,
): RippleGridSettings {
  return {
    color: String(props.color ?? '#ffffff'),
    variant: VARIANTS[props.variant ?? 'lines'] ?? 0,
    cellSize: Math.max(8, props.cellSize ?? 48),
    lineWidth: Math.max(0.25, props.lineWidth ?? 1),
    glow: Math.max(0, props.glow ?? 0.6),
    rippleStrength: Math.max(0, props.rippleStrength ?? 1),
    rippleSpeed: Math.max(0.05, props.rippleSpeed ?? 1),
    rippleSize: Math.max(0.2, props.rippleSize ?? 1),
    autoRipple: props.autoRipple ?? 'center',
    rippleInterval: Math.max(0.3, props.rippleInterval ?? 2.6),
    tilt: clamp(props.tilt ?? 0, 0, 80),
    rotation: props.rotation ?? 0,
    mouseInteraction: props.mouseInteraction ?? true,
    clickRipple: props.clickRipple ?? true,
    intro: props.intro ?? true,
    fade: clamp(props.fade ?? 0.5, 0, 1),
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

function link(gl: WebGL2RenderingContext): LinkedProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, RIPPLE_GRID_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, RIPPLE_GRID_FRAGMENT);
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
        info.name.replace('[0]', ''),
        gl.getUniformLocation(program, info.name),
      );
    }
  }
  return { program, uniform: (name) => locations.get(name) ?? null };
}

export function createRippleGridEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => RippleGridSettings,
  isReduced: () => boolean,
  wake: () => void,
): RippleGridEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;
  const program = link(gl);
  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  if (!program || !buffer || !vao) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  const u = program.uniform;

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

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
  const view = { width: 1, height: 1, ratio: 1 };
  const pointer = { inside: false, planeX: 0, planeY: 0, travel: 0 };
  const state = {
    clock: 0,
    intro: initial.intro && !isReduced() ? 0 : 1,
    glow: 0,
    nextAuto: 0.4,
  };
  const ripples: Ripple[] = [];
  const packed = new Float32Array(RIPPLE_GRID_MAX_RIPPLES * 4);
  let last = 0;
  let looping = false;
  let lastDpr = initial.dpr;

  const focalOf = () => view.height * 1.15;

  const toPlane = (x: number, y: number): [number, number] | null => {
    const sx = x - view.width / 2;
    const sy = y - view.height / 2;
    const tilt = (getSettings().tilt * Math.PI) / 180;
    if (tilt <= 0.0001) return [sx, sy];
    const focal = focalOf();
    const depth = focal + sy * Math.tan(tilt);
    if (depth <= focal * 0.05) return null;
    const scale = focal / depth;
    return [sx * scale, (sy * scale) / Math.cos(tilt)];
  };

  const spawn = (x: number, y: number, strength: number) => {
    ripples.push({ x, y, born: state.clock, strength });
    if (ripples.length > RIPPLE_GRID_MAX_RIPPLES) ripples.shift();
  };

  const render = () => {
    const s = getSettings();
    const reduce = isReduced();
    const presence = state.intro * state.intro * (3 - 2 * state.intro);
    const waveLength = s.cellSize * 2.4 * s.rippleSize;
    const waveSpeed = 240 * s.rippleSpeed;
    let count = 0;
    for (
      let i = ripples.length - 1;
      i >= 0 && count < RIPPLE_GRID_MAX_RIPPLES;
      i--
    ) {
      const r = ripples[i];
      if (!r) continue;
      const age = state.clock - r.born;
      packed.set(
        [r.x, r.y, age, r.strength * Math.exp(-age * 0.55)],
        count * 4,
      );
      count++;
    }
    const angle = (s.rotation * Math.PI) / 180;
    const tint = toLinear(s.color);
    const tone =
      0.2126 * (tint[0] ?? 1) +
      0.7152 * (tint[1] ?? 1) +
      0.0722 * (tint[2] ?? 1);
    const depth = Math.min(1, 0.12 / Math.max(tone, 0.001));
    const ink = tint.map((v) => Math.pow(Math.min(1, v * depth), 1 / 2.2));
    const diagonal = Math.hypot(view.width, view.height);

    gl.bindVertexArray(vao);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program.program);
    gl.uniform2f(u('uView'), view.width, view.height);
    gl.uniform1f(u('uRatio'), view.ratio);
    gl.uniform1f(u('uCell'), s.cellSize);
    gl.uniform1f(u('uLineWidth'), s.lineWidth);
    gl.uniform1f(u('uGlow'), s.glow);
    gl.uniform1f(u('uTilt'), (s.tilt * Math.PI) / 180);
    gl.uniform1f(u('uFocal'), focalOf());
    gl.uniform2f(u('uTurn'), Math.cos(angle), Math.sin(angle));
    gl.uniform4fv(u('uRipples'), packed);
    gl.uniform1i(u('uRippleCount'), count);
    gl.uniform1f(u('uWaveLength'), waveLength);
    gl.uniform1f(u('uWaveSpeed'), waveSpeed);
    gl.uniform1f(u('uStrength'), s.rippleStrength);
    gl.uniform3f(u('uPointer'), pointer.planeX, pointer.planeY, state.glow);
    gl.uniform3fv(
      u('uColor'),
      tint.map((v) => Math.pow(v, 1 / 2.2)),
    );
    gl.uniform3fv(u('uInk'), ink);
    gl.uniform1f(u('uPresence'), Math.min(1, presence * 1.6));
    gl.uniform1f(
      u('uReveal'),
      s.intro && !reduce ? presence * diagonal * 1.4 + s.cellSize * 4 : 1e6,
    );
    gl.uniform1f(u('uFade'), s.fade);
    gl.uniform1f(u('uOpacity'), s.opacity);
    gl.uniform1f(u('uLightMode'), s.lightMode ? 1 : 0);
    gl.uniform1i(u('uVariant'), s.variant);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    const s = getSettings();
    const reduce = isReduced();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !reduce;
    if (moving) state.clock += dt;
    if (!s.intro || reduce) state.intro = 1;
    else if (state.intro < 1)
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

    if (moving && s.autoRipple !== 'none' && state.clock >= state.nextAuto) {
      if (s.autoRipple === 'random') {
        const spot = toPlane(
          Math.random() * view.width,
          view.height * (0.2 + Math.random() * 0.7),
        );
        if (spot) spawn(spot[0], spot[1], 0.75);
      } else {
        spawn(0, 0, 1);
      }
      state.nextAuto = state.clock + s.rippleInterval;
    }
    const lifetime = 9 / Math.max(0.2, s.rippleSpeed);
    while (ripples.length && state.clock - (ripples[0]?.born ?? 0) > lifetime)
      ripples.shift();

    const engaged = s.mouseInteraction && pointer.inside && !reduce;
    state.glow +=
      ((engaged ? 1 : 0) - state.glow) *
      (1 - Math.exp(-dt * (engaged ? 6 : 2.5)));
    render();

    const settling =
      state.intro < 1 || Math.abs((engaged ? 1 : 0) - state.glow) > 0.002;
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
    view.ratio = canvas.width / view.width;
    if (!looping) render();
    wake();
  };

  if (initial.intro && !isReduced()) spawn(0, 0, 1.1);

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
    pointerMove(x, y, inside) {
      const spot = inside ? toPlane(x, y) : null;
      pointer.inside = Boolean(spot);
      if (spot) {
        const s = getSettings();
        const step = Math.hypot(
          spot[0] - pointer.planeX,
          spot[1] - pointer.planeY,
        );
        pointer.planeX = spot[0];
        pointer.planeY = spot[1];
        if (s.mouseInteraction && !isReduced() && step < s.cellSize * 6) {
          pointer.travel += step;
          if (pointer.travel > s.cellSize * 1.6) {
            pointer.travel = 0;
            spawn(spot[0], spot[1], 0.32);
          }
        }
      }
      wake();
    },
    pointerDown(x, y, inside) {
      if (!inside || !getSettings().clickRipple || isReduced()) return;
      const spot = toPlane(x, y);
      if (spot) spawn(spot[0], spot[1], 1.2);
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
      gl.deleteProgram(program.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
