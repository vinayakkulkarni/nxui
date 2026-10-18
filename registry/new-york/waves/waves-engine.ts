import {
  CELL,
  INTRO_SECONDS,
  MAX_VERTICES,
  RIPPLE_IMPULSE,
  RIPPLE_SPEED,
  RIPPLE_WIDTH,
  STEP,
  WAVES_FRAGMENT,
  WAVES_VERTEX,
} from './waves-shaders';
import type { WavesEngine, WavesProps, WavesSettings } from './types';

const STYLES: Record<string, number> = { solid: 0, dashed: 1 };

interface Ripple {
  x: number;
  y: number;
  age: number;
  range: number;
}

interface LiveRipple {
  x: number;
  y: number;
  front: number;
  power: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smootherstep = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, WAVES_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, WAVES_FRAGMENT);
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
  const locations = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info)
      locations.set(info.name, gl.getUniformLocation(program, info.name));
  }
  const uniform = (name: string) => locations.get(name) ?? null;
  return { program, uniform };
}

export function toWavesSettings(props: WavesProps): WavesSettings {
  return {
    lineColor: String(props.lineColor ?? '#ffffff'),
    accentColor: props.accentColor ? String(props.accentColor) : '',
    lineStyle: STYLES[props.lineStyle ?? 'solid'] ?? 0,
    spacing: Math.max(2, props.spacing ?? 10),
    lineWidth: Math.max(0.25, props.lineWidth ?? 1),
    rotation: props.rotation ?? 0,
    amplitude: Math.max(0, props.amplitude ?? 32),
    scale: Math.max(0.05, props.scale ?? 1),
    twist: Math.max(0, props.twist ?? 1),
    speed: props.speed ?? 1,
    variation: Math.max(0, Math.round(props.variation ?? 0)),
    mouseInteraction: props.mouseInteraction ?? true,
    mouseRadius: Math.max(20, props.mouseRadius ?? 175),
    mouseStrength: Math.max(0, props.mouseStrength ?? 1),
    bounce: clamp(props.bounce ?? 0.5, 0, 1),
    returnDuration: Math.max(0.2, props.returnDuration ?? 1.4),
    clickRipple: props.clickRipple ?? true,
    intro: props.intro ?? true,
    fade: clamp(props.fade ?? 0, 0, 1),
    opacity: clamp(props.opacity ?? 1, 0, 1),
    lightMode: props.lightMode ?? false,
    paused: props.paused ?? false,
    dpr: props.dpr,
  };
}

export function createWavesEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => WavesSettings,
  isReduced: () => boolean,
  wake: () => void,
): WavesEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const linked = link(gl);
  const vao = gl.createVertexArray();
  const texture = gl.createTexture();
  if (!linked || !vao || !texture) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  const { program, uniform: u } = linked;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colors = new Map<string, number[]>();
  const parse = (value: string): number[] => {
    const cached = colors.get(value);
    if (cached) return cached;
    let rgb = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [
        (data[0] ?? 255) / 255,
        (data[1] ?? 255) / 255,
        (data[2] ?? 255) / 255,
      ];
    }
    colors.set(value, rgb);
    return rgb;
  };
  // Darkens a color to ink so it reads on light backgrounds.
  const ink = (rgb: number[]) => {
    const linear = rgb.map((v) => Math.pow(v, 2.2));
    const tone =
      0.2126 * (linear[0] ?? 0) +
      0.7152 * (linear[1] ?? 0) +
      0.0722 * (linear[2] ?? 0);
    const depth = Math.min(1, 0.045 / Math.max(tone, 0.0001));
    return linear.map((v) => Math.pow(v * depth, 1 / 2.2));
  };

  const view = { width: 1, height: 1, ratio: 1 };
  const grid = {
    cols: 0,
    rows: 0,
    shift: new Float32Array(0),
    speed: new Float32Array(0),
    top: 0,
    bottom: -1,
    left: 0,
    right: -1,
  };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0, inside: false };
  const ripples: Ripple[] = [];
  const live: LiveRipple[] = [];
  const state = { flow: 0, intro: getSettings().intro && !isReduced() ? 0 : 1 };
  let last = 0;
  let visible = true;
  let lastDpr = getSettings().dpr;

  const limitOf = (s: WavesSettings) => Math.max(12, s.mouseRadius * 0.5);

  const rebuild = () => {
    grid.cols = Math.ceil(view.width / CELL) + 2;
    grid.rows = Math.ceil(view.height / CELL) + 2;
    grid.shift = new Float32Array(grid.cols * grid.rows * 2);
    grid.speed = new Float32Array(grid.cols * grid.rows * 2);
    grid.top = 0;
    grid.bottom = -1;
    grid.left = 0;
    grid.right = -1;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RG32F,
      grid.cols,
      grid.rows,
      0,
      gl.RG,
      gl.FLOAT,
      grid.shift,
    );
  };

  // Grows the dirty rectangle of spring cells that need simulating.
  const include = (x0: number, y0: number, x1: number, y1: number) => {
    const c0 = clamp(Math.floor(x0 / CELL), 0, grid.cols - 1);
    const c1 = clamp(Math.ceil(x1 / CELL), 0, grid.cols - 1);
    const r0 = clamp(Math.floor(y0 / CELL), 0, grid.rows - 1);
    const r1 = clamp(Math.ceil(y1 / CELL), 0, grid.rows - 1);
    const empty = grid.bottom < grid.top;
    grid.top = empty ? r0 : Math.min(grid.top, r0);
    grid.bottom = empty ? r1 : Math.max(grid.bottom, r1);
    grid.left = empty ? c0 : Math.min(grid.left, c0);
    grid.right = empty ? c1 : Math.max(grid.right, c1);
  };

  const simulate = (dt: number, reduce: boolean) => {
    const s = getSettings();
    const follow = 1 - Math.exp(-dt / 0.045);
    const nx = pointer.sx + (pointer.x - pointer.sx) * follow;
    const ny = pointer.sy + (pointer.y - pointer.sy) * follow;
    const blend = 1 - Math.exp(-dt / 0.06);
    pointer.vx += ((nx - pointer.sx) / dt - pointer.vx) * blend;
    pointer.vy += ((ny - pointer.sy) / dt - pointer.vy) * blend;
    pointer.sx = nx;
    pointer.sy = ny;

    const zeta = 1 - 0.85 * s.bounce;
    const omega = 4 / (zeta * s.returnDuration);
    const radius = s.mouseRadius;
    const speedNow = Math.hypot(pointer.vx, pointer.vy);
    const drive =
      s.mouseInteraction && pointer.inside && !reduce
        ? 26000 * Math.tanh(speedNow / 1400) * s.mouseStrength
        : 0;
    if (drive > 1) {
      include(
        pointer.sx - radius,
        pointer.sy - radius,
        pointer.sx + radius,
        pointer.sy + radius,
      );
    }

    live.length = 0;
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      if (!ripple) continue;
      ripple.age += dt;
      const front = ripple.age * RIPPLE_SPEED;
      const life = 1 - front / ripple.range;
      if (life <= 0) {
        ripples.splice(i, 1);
        continue;
      }
      const reach = front + RIPPLE_WIDTH * 3;
      include(
        ripple.x - reach,
        ripple.y - reach,
        ripple.x + reach,
        ripple.y + reach,
      );
      live.push({
        x: ripple.x,
        y: ripple.y,
        front,
        power: (150 * omega * life * Math.sqrt(life)) / RIPPLE_IMPULSE,
      });
    }

    if (grid.bottom < grid.top) return false;

    const stiffness = omega * omega;
    const damping = 2 * zeta * omega;
    const steps = Math.min(
      16,
      Math.max(1, Math.ceil(dt / Math.min(1 / 120, 0.6 / omega))),
    );
    const h = dt / steps;
    const dirX = speedNow > 0.001 ? pointer.vx / speedNow : 0;
    const dirY = speedNow > 0.001 ? pointer.vy / speedNow : 0;
    const { cols, shift, speed: velocity, left, right } = grid;
    let peak = 0;

    for (let row = grid.top; row <= grid.bottom; row++) {
      const y = row * CELL;
      for (let col = left; col <= right; col++) {
        const x = col * CELL;
        const index = (row * cols + col) * 2;
        let ax = 0;
        let ay = 0;
        if (drive > 1) {
          const distance = Math.hypot(x - pointer.sx, y - pointer.sy);
          if (distance < radius) {
            const weight = smootherstep(1 - distance / radius) * drive;
            ax += dirX * weight;
            ay += dirY * weight;
          }
        }
        for (const ripple of live) {
          const ex = x - ripple.x;
          const ey = y - ripple.y;
          const distance = Math.hypot(ex, ey);
          const offset = (distance - ripple.front) / RIPPLE_WIDTH;
          if (distance > 0.001 && Math.abs(offset) < 3) {
            const push =
              ripple.power *
              Math.exp(-offset * offset * 2) *
              smootherstep(distance / 56);
            ax += (ex / distance) * push;
            ay += (ey / distance) * push;
          }
        }
        let px = shift[index] ?? 0;
        let py = shift[index + 1] ?? 0;
        let vx = velocity[index] ?? 0;
        let vy = velocity[index + 1] ?? 0;
        for (let k = 0; k < steps; k++) {
          vx += (ax - stiffness * px - damping * vx) * h;
          vy += (ay - stiffness * py - damping * vy) * h;
          px += vx * h;
          py += vy * h;
        }
        shift[index] = px;
        shift[index + 1] = py;
        velocity[index] = vx;
        velocity[index + 1] = vy;
        peak = Math.max(
          peak,
          Math.abs(px) + Math.abs(py) + (Math.abs(vx) + Math.abs(vy)) * 0.05,
        );
      }
    }

    const top = grid.top;
    const height = grid.bottom - grid.top + 1;
    if (peak < 0.02 && drive <= 1 && !live.length) {
      for (let row = grid.top; row <= grid.bottom; row++) {
        shift.fill(0, (row * cols + left) * 2, (row * cols + right + 1) * 2);
        velocity.fill(0, (row * cols + left) * 2, (row * cols + right + 1) * 2);
      }
      grid.top = 0;
      grid.bottom = -1;
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      top,
      cols,
      height,
      gl.RG,
      gl.FLOAT,
      shift.subarray(top * cols * 2, (top + height) * cols * 2),
    );
    return grid.bottom >= grid.top;
  };

  const render = () => {
    const s = getSettings();
    const reduce = isReduced();
    const angle = (s.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const limit = limitOf(s);
    const margin = s.amplitude * 1.1 + limit + s.spacing * 2 + 8;
    const reachU =
      (view.width * Math.abs(cos) + view.height * Math.abs(sin)) / 2 + margin;
    const reachV =
      (view.width * Math.abs(sin) + view.height * Math.abs(cos)) / 2 + margin;
    const half = Math.ceil(reachU / s.spacing);
    const lines = half * 2 + 1;
    let step = STEP;
    let samples = Math.ceil((reachV * 2) / step) + 1;
    if (lines * samples * 2 > MAX_VERTICES) {
      samples = Math.max(16, Math.floor(MAX_VERTICES / (lines * 2)));
      step = (reachV * 2) / (samples - 1);
    }
    const width = s.lineWidth * view.ratio;
    const halfWidth = Math.max(0.5, width / 2);
    const progress = state.intro;
    const animated = s.intro && !reduce;
    const reveal = animated
      ? (1 - Math.pow(1 - clamp(progress / 0.7, 0, 1), 3)) * reachU * 1.3
      : 1e6;
    const swell = animated ? smootherstep((progress - 0.1) / 0.9) : 1;
    const base = parse(s.lineColor);
    const tone = s.lightMode ? ink(base) : base;
    const accent = s.accentColor ? parse(s.accentColor) : tone;
    const flowTime = state.flow + s.variation * 37.1;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(u('uField'), 0);
    gl.uniform2f(u('uView'), view.width, view.height);
    gl.uniform1f(u('uRatio'), view.ratio);
    gl.uniform2f(u('uAxis'), cos, sin);
    gl.uniform1f(u('uSpacing'), s.spacing);
    gl.uniform1f(u('uStep'), step);
    gl.uniform2f(u('uStart'), -half * s.spacing, -reachV);
    gl.uniform1f(u('uAmplitude'), s.amplitude * swell);
    gl.uniform2f(u('uFrequency'), 0.002 / s.scale, 0.0015 / s.scale);
    gl.uniform2f(u('uDrift'), flowTime * 0.025, flowTime * 0.0075);
    gl.uniform1f(u('uTwist'), s.twist);
    gl.uniform1ui(u('uSeed'), s.variation);
    gl.uniform2i(u('uFieldSize'), grid.cols, grid.rows);
    gl.uniform1f(u('uCell'), CELL);
    gl.uniform1f(u('uLimit'), limit);
    gl.uniform1f(u('uReach'), halfWidth + 1);
    gl.uniform1f(u('uReveal'), reveal);
    gl.uniform1f(u('uBand'), Math.max(1, reachU * 0.3));
    gl.uniform1f(u('uHalf'), halfWidth);
    gl.uniform1f(u('uThin'), Math.min(1, width));
    gl.uniform1i(u('uStyle'), s.lineStyle);
    gl.uniform1f(u('uPeriod'), s.spacing * 2.6);
    gl.uniform1f(u('uFlow'), (state.flow * 16) % (s.spacing * 2.6));
    gl.uniform3fv(u('uColor'), tone);
    gl.uniform3fv(u('uAccent'), accent);
    gl.uniform1f(u('uBase'), 0.62);
    gl.uniform1f(u('uHeat'), limit * 0.55);
    gl.uniform1f(u('uFade'), s.fade);
    gl.uniform1f(u('uOpacity'), s.opacity);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, samples * 2, lines);
  };

  const frame = (now: number) => {
    if (!visible) return false;
    const s = getSettings();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    if (s.paused) {
      state.intro = 1;
      render();
      last = 0;
      return false;
    }
    const reduce = isReduced();
    if (!reduce) state.flow += dt * s.speed;
    if (!s.intro || reduce) state.intro = 1;
    else if (state.intro < 1)
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    const awake = simulate(dt, reduce);
    render();
    const engaged =
      pointer.inside &&
      s.mouseInteraction &&
      Math.hypot(pointer.vx, pointer.vy) > 1;
    if (!reduce || awake || engaged || ripples.length || state.intro < 1)
      return true;
    last = 0;
    return false;
  };

  const resize = (width: number, height: number) => {
    const s = getSettings();
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    view.width = w;
    view.height = h;
    canvas.width = Math.max(1, Math.round(w * ratio));
    canvas.height = Math.max(1, Math.round(h * ratio));
    view.ratio = canvas.width / w;
    rebuild();
    render();
    wake();
  };

  const place = (x: number, y: number, inside: boolean, snap: boolean) => {
    if (snap || (inside && !pointer.inside)) {
      pointer.sx = x;
      pointer.sy = y;
      pointer.vx = 0;
      pointer.vy = 0;
    }
    pointer.inside = inside;
    pointer.x = x;
    pointer.y = y;
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
      place(x, y, inside, false);
      if (!getSettings().paused) wake();
    },
    pointerDown(x, y, inside, snap) {
      const s = getSettings();
      place(x, y, inside, snap);
      if (inside && s.clickRipple && !s.paused && !isReduced()) {
        ripples.push({
          x,
          y,
          age: 0,
          range: Math.max(360, Math.hypot(view.width, view.height) * 0.55),
        });
        if (ripples.length > 6) ripples.shift();
      }
      wake();
    },
    pointerUp(isMouse) {
      if (!isMouse) pointer.inside = false;
    },
    pointerLeave() {
      pointer.inside = false;
      wake();
    },
    resetClock() {
      last = 0;
    },
    dispose() {
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
      gl.deleteTexture(texture);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
