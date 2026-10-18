import { FRAGMENT, VERTEX } from './grid-distortion-shaders';
import type {
  GridDistortionEngine,
  GridDistortionMode,
  GridDistortionProps,
  GridDistortionSettings,
} from './types';

interface Ripple {
  x: number;
  y: number;
  start: number;
}

const MODES: GridDistortionMode[] = ['drag', 'push', 'swirl'];
const GAIN = 18;
const RIPPLE_LIFE = 1.6;
const UNIFORMS = [
  'uImage',
  'uField',
  'uGrid',
  'uCover',
  'uSoftness',
  'uChroma',
  'uReveal',
] as const;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

function hash(x: number, y: number, z: number): number {
  let h =
    Math.imul(x, 668265261) ^ Math.imul(y, 374761393) ^ Math.imul(z, 739982445);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 2147483648 - 1;
}

export function normalizeGridDistortion(
  p: GridDistortionProps,
  reduce: boolean,
): GridDistortionSettings {
  const mode = MODES.find((value) => value === p.mode) ?? 'drag';
  return {
    grid: clamp(Math.round(p.grid ?? 15), 2, 120),
    radius: clamp(p.radius ?? 0.18, 0.01, 1),
    strength: Math.max(0, p.strength ?? 0.15),
    relaxation: clamp(p.relaxation ?? 0.96, 0, 0.995),
    mode,
    softness: clamp(p.softness ?? 0, 0, 1),
    chroma: clamp(p.chroma ?? 0, 0, 2),
    idle: clamp(p.idle ?? 0.3, 0, 1),
    clickRipple: p.clickRipple ?? true,
    intro: p.intro ?? true,
    reduce,
  };
}

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function createGridDistortion(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  read: () => GridDistortionSettings,
): GridDistortionEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const u: Record<string, WebGLUniformLocation | null> = {};
  for (const name of UNIFORMS) u[name] = gl.getUniformLocation(program, name);
  gl.uniform1i(u.uImage ?? null, 0);
  gl.uniform1i(u.uField ?? null, 1);

  const imageTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, imageTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const fieldTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const pointer = { x: 0, y: 0, px: 0, py: 0, inside: false };
  const ripples: Ripple[] = [];
  const state = {
    width: 1,
    height: 1,
    cols: 0,
    rows: 0,
    sim: new Float32Array(0),
    out: new Float32Array(0),
    ripples,
    time: 0,
    reveal: 0,
    loaded: false,
    imageAspect: 1,
    request: 0,
    lastMove: -10,
    phantom: 1,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = true;

  const layout = () => {
    const cols = read().grid;
    const rows = Math.max(1, Math.round((cols * state.height) / state.width));
    if (cols === state.cols && rows === state.rows) return;
    state.cols = cols;
    state.rows = rows;
    state.sim = new Float32Array(cols * rows * 2);
    state.out = new Float32Array(cols * rows * 2);
    gl.activeTexture(gl.TEXTURE1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RG32F,
      cols,
      rows,
      0,
      gl.RG,
      gl.FLOAT,
      state.out,
    );
  };

  const scramble = () => {
    const { sim, cols, rows, width, height } = state;
    const reach = Math.min(width, height) * 0.12;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = (row * cols + col) * 2;
        sim[i] = (hash(col + 1, row + 1, 11) * reach) / width;
        sim[i + 1] = (hash(col + 1, row + 1, 23) * reach) / height;
      }
    }
  };

  const brush = (
    s: GridDistortionSettings,
    x: number,
    y: number,
    dx: number,
    dy: number,
    weight: number,
  ) => {
    const { sim, cols, rows, width, height } = state;
    const reach = Math.max(1, s.radius * width);
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const speed = Math.hypot(dx, dy);
    const limit = (0.25 + s.strength) * 0.4 * width;
    const fromCol = Math.max(0, Math.floor((x - reach) / cellWidth));
    const toCol = Math.min(cols - 1, Math.floor((x + reach) / cellWidth));
    const fromRow = Math.max(0, Math.floor((y - reach) / cellHeight));
    const toRow = Math.min(rows - 1, Math.floor((y + reach) / cellHeight));
    for (let row = fromRow; row <= toRow; row++) {
      for (let col = fromCol; col <= toCol; col++) {
        const ox = (col + 0.5) * cellWidth - x;
        const oy = (row + 0.5) * cellHeight - y;
        const distance = Math.hypot(ox, oy);
        if (distance >= reach) continue;
        const t = 1 - (distance / reach) ** 2;
        const k = s.strength * GAIN * weight * t * t;
        let vx = dx;
        let vy = dy;
        if (s.mode !== 'drag') {
          const nx = distance > 0 ? ox / distance : 0;
          const ny = distance > 0 ? oy / distance : 0;
          vx = s.mode === 'push' ? nx * speed : -ny * speed;
          vy = s.mode === 'push' ? ny * speed : nx * speed;
        }
        const i = (row * cols + col) * 2;
        const px = (sim[i] ?? 0) * width + vx * k;
        const py = (sim[i + 1] ?? 0) * height + vy * k;
        const length = Math.hypot(px, py);
        const scale =
          length > 0 ? (limit * Math.tanh(length / limit)) / length : 0;
        sim[i] = (px * scale) / width;
        sim[i + 1] = (py * scale) / height;
      }
    }
  };

  const wander = (t: number): [number, number] => [
    state.width *
      (0.5 + 0.34 * Math.sin(t * 0.43) + 0.08 * Math.sin(t * 1.21 + 1.7)),
    state.height *
      (0.5 + 0.3 * Math.sin(t * 0.61 + 0.9) + 0.08 * Math.cos(t * 1.03 + 0.4)),
  ];

  const simulate = (s: GridDistortionSettings, dt: number): number => {
    const { sim } = state;
    const decay = Math.pow(s.relaxation, dt * 60);
    let peak = 0;
    for (let i = 0; i < sim.length; i++) {
      const value = (sim[i] ?? 0) * decay;
      if (Math.abs(value) < 1e-5) sim[i] = 0;
      else {
        sim[i] = value;
        peak = Math.max(peak, Math.abs(value));
      }
    }
    if (s.strength <= 0) return peak;

    const dx = pointer.x - pointer.px;
    const dy = pointer.y - pointer.py;
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    if (pointer.inside && (dx || dy)) {
      state.lastMove = state.time;
      brush(s, pointer.x, pointer.y, dx, dy, 1);
      peak = Math.max(peak, 1e-3);
    }

    const drift = s.reduce ? 0 : s.idle;
    const resting = state.time - state.lastMove > 2.5;
    state.phantom = clamp(state.phantom + (resting ? dt : -dt * 3), 0, 1);
    if (drift > 0 && state.phantom > 0) {
      const [x, y] = wander(state.time);
      const [px, py] = wander(state.time - dt);
      brush(
        s,
        x,
        y,
        x - px,
        y - py,
        drift * 0.6 * state.phantom * state.phantom,
      );
    }
    return peak;
  };

  const compose = (s: GridDistortionSettings) => {
    const { sim, out, cols, rows, width, height, time } = state;
    out.set(sim);
    if (!state.ripples.length) return;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const span = Math.hypot(width, height);
    const band = Math.max(cellWidth, cellHeight) * 1.2 + span * 0.03;
    const amount = width * (0.03 + s.strength * 0.3);
    state.ripples = state.ripples.filter(
      (ripple) => time - ripple.start < RIPPLE_LIFE,
    );
    for (const ripple of state.ripples) {
      const age = (time - ripple.start) / RIPPLE_LIFE;
      const front = age * span * 0.75;
      const fade = (1 - age) ** 2;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ox = (col + 0.5) * cellWidth - ripple.x;
          const oy = (row + 0.5) * cellHeight - ripple.y;
          const distance = Math.hypot(ox, oy);
          const wave = Math.exp(-(((distance - front) / band) ** 2)) * fade;
          if (wave < 0.002 || distance === 0) continue;
          const i = (row * cols + col) * 2;
          out[i] = (out[i] ?? 0) + (ox / distance) * ((wave * amount) / width);
          out[i + 1] =
            (out[i + 1] ?? 0) + (oy / distance) * ((wave * amount) / height);
        }
      }
    }
  };

  const render = () => {
    const { width, height } = state;
    const aspect = width / height;
    const coverX = aspect > state.imageAspect ? 1 : aspect / state.imageAspect;
    const coverY = aspect > state.imageAspect ? state.imageAspect / aspect : 1;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE1);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      state.cols,
      state.rows,
      gl.RG,
      gl.FLOAT,
      state.out,
    );
    const s = read();
    gl.uniform2f(u.uGrid ?? null, state.cols, state.rows);
    gl.uniform2f(u.uCover ?? null, coverX, coverY);
    gl.uniform1f(u.uSoftness ?? null, s.softness);
    gl.uniform1f(u.uChroma ?? null, s.chroma);
    gl.uniform1f(u.uReveal ?? null, state.reveal);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive || !visible) return;
    const s = read();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    state.time += dt;
    layout();
    if (state.loaded) {
      state.reveal = s.reduce ? 1 : Math.min(1, state.reveal + dt / 0.6);
    }
    const peak = simulate(s, dt);
    compose(s);
    render();
    const busy =
      peak > 0 ||
      state.ripples.length > 0 ||
      (s.idle > 0 && !s.reduce) ||
      state.reveal < 1;
    if (busy) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (raf || !alive || !visible) return;
    raf = requestAnimationFrame(frame);
  };

  const load = (src: string | undefined) => {
    const request = ++state.request;
    if (!src) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      if (!alive || request !== state.request) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      state.imageAspect = image.naturalWidth / Math.max(1, image.naturalHeight);
      layout();
      const s = read();
      if (s.intro && !s.reduce) scramble();
      state.loaded = true;
      wake();
    };
    image.src = src;
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = Math.max(1, root.clientWidth);
    state.height = Math.max(1, root.clientHeight);
    canvas.width = Math.round(state.width * dpr);
    canvas.height = Math.round(state.height * dpr);
    layout();
    if (!raf) {
      compose(read());
      render();
    }
    wake();
  };

  return {
    load,
    wake,
    resize,
    setVisible(next) {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    pointerMove(event) {
      const rect = root.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      if (inside && !pointer.inside) {
        pointer.px = x;
        pointer.py = y;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
      if (inside) wake();
    },
    pointerDown(event) {
      const s = read();
      if (!s.clickRipple || s.reduce) return;
      const rect = root.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      state.ripples.push({ x, y, start: state.time });
      if (state.ripples.length > 4) state.ripples.shift();
      wake();
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      raf = 0;
      gl.deleteTexture(imageTexture);
      gl.deleteTexture(fieldTexture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
