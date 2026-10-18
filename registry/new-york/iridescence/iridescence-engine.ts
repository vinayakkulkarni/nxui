import {
  IRIDESCENCE_FRAGMENT,
  IRIDESCENCE_VERTEX,
} from './iridescence-shaders';
import type {
  IridescenceColor,
  IridescenceEngine,
  IridescenceProps,
  IridescenceSettings,
} from './types';

const FIELD_COLUMNS = 48;
const MAX_SWIRLS = 6;
const SWIRL_LIFE = 3.2;

const UNIFORMS = [
  'uResolution',
  'uTime',
  'uColor',
  'uMouse',
  'uAmplitude',
  'uScale',
  'uRotation',
  'uDetail',
  'uWarp',
  'uHue',
  'uSaturation',
  'uBrightness',
  'uContrast',
  'uGrain',
  'uSeed',
  'uFade',
  'uOpacity',
  'uField',
  'uStir',
  'uPointer',
  'uSheen',
  'uSwirls',
];

type Rgb = [number, number, number];

interface Swirl {
  x: number;
  y: number;
  age: number;
}

interface EngineState {
  width: number;
  height: number;
  phase: number;
  mouse: [number, number];
  presence: number;
  color: Rgb;
  colorKey: string;
  cols: number;
  rows: number;
  field: Float32Array;
  scratch: Float32Array;
  fieldActive: boolean;
  swirls: Swirl[];
  seed: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const colorKeyOf = (value: IridescenceColor) =>
  Array.isArray(value) ? value.join(',') : String(value);

/** Resolves props into the clamped settings the renderer reads. */
export function toIridescenceSettings(
  props: IridescenceProps,
): IridescenceSettings {
  const color = props.color ?? [1, 1, 1];
  return {
    colorKey: colorKeyOf(color),
    color,
    speed: props.speed ?? 1,
    amplitude: props.amplitude ?? 0.1,
    mouseReact: props.mouseReact ?? true,
    scale: Math.max(0.05, props.scale ?? 1),
    detail: clamp(Math.round(props.detail ?? 8), 1, 24),
    rotation: props.rotation ?? 0,
    warp: props.warp ?? 1,
    hueShift: props.hueShift ?? 0,
    saturation: Math.max(0, props.saturation ?? 1),
    brightness: Math.max(0, props.brightness ?? 1.5),
    contrast: Math.max(0, props.contrast ?? 1),
    stir: Math.max(0, props.stir ?? 0.5),
    sheen: Math.max(0, props.sheen ?? 0.3),
    clickSwirl: props.clickSwirl ?? true,
    grain: clamp(props.grain ?? 0, 0, 1),
    fade: clamp(props.fade ?? 0, 0, 1),
    opacity: clamp(props.opacity ?? 1, 0, 1),
    resolution: clamp(props.resolution ?? 1, 0.1, 2),
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

/**
 * One full-screen WebGL2 pass of folded cosine layers. A coarse velocity
 * field brushed by the pointer drags the folds like a liquid, and clicks
 * add swirls that unwind over a few seconds.
 */
export function createIridescenceEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => IridescenceSettings,
  isReduced: () => boolean,
): IridescenceEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, IRIDESCENCE_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, IRIDESCENCE_FRAGMENT);
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

  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of UNIFORMS) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  const u = (name: string) => uniforms[name] ?? null;

  const fieldTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u('uField'), 0);

  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const probeCtx = probe.getContext('2d', { willReadFrequently: true });
  const pointer = { x: 0.5, y: 0.5, inside: false, tracked: false };
  const state: EngineState = {
    width: 1,
    height: 1,
    phase: 0,
    mouse: [0.5, 0.5],
    presence: 0,
    color: [1, 1, 1],
    colorKey: '\u0000',
    cols: 0,
    rows: 0,
    field: new Float32Array(0),
    scratch: new Float32Array(0),
    fieldActive: false,
    swirls: [],
    seed: 0,
  };
  const swirlData = new Float32Array(MAX_SWIRLS * 4);
  let last = 0;

  const resolveColor = (s: IridescenceSettings) => {
    if (s.colorKey === state.colorKey) return;
    state.colorKey = s.colorKey;
    if (Array.isArray(s.color)) {
      state.color = [
        clamp(Number(s.color[0] ?? 1), 0, 1),
        clamp(Number(s.color[1] ?? 1), 0, 1),
        clamp(Number(s.color[2] ?? 1), 0, 1),
      ];
      return;
    }
    if (!probeCtx) return;
    probeCtx.clearRect(0, 0, 1, 1);
    probeCtx.fillStyle = '#ffffff';
    probeCtx.fillStyle = String(s.color);
    probeCtx.fillRect(0, 0, 1, 1);
    const data = probeCtx.getImageData(0, 0, 1, 1).data;
    state.color = [
      (data[0] ?? 255) / 255,
      (data[1] ?? 255) / 255,
      (data[2] ?? 255) / 255,
    ];
  };

  const layoutField = () => {
    const cols = FIELD_COLUMNS;
    const rows = clamp(Math.round((cols * state.height) / state.width), 6, 96);
    if (cols === state.cols && rows === state.rows) return;
    state.cols = cols;
    state.rows = rows;
    state.field = new Float32Array(cols * rows * 2);
    state.scratch = new Float32Array(cols * rows * 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RG16F,
      cols,
      rows,
      0,
      gl.RG,
      gl.FLOAT,
      state.field,
    );
  };

  const brush = (x: number, y: number, dx: number, dy: number) => {
    const { cols, rows, field } = state;
    const radius = 0.22;
    const aspect = state.width / state.height;
    const fromCol = Math.max(0, Math.floor((x - radius / aspect) * cols));
    const toCol = Math.min(cols - 1, Math.ceil((x + radius / aspect) * cols));
    const fromRow = Math.max(0, Math.floor((y - radius) * rows));
    const toRow = Math.min(rows - 1, Math.ceil((y + radius) * rows));
    for (let row = fromRow; row <= toRow; row++) {
      for (let col = fromCol; col <= toCol; col++) {
        const ox = ((col + 0.5) / cols - x) * aspect;
        const oy = (row + 0.5) / rows - y;
        const t = 1 - (ox * ox + oy * oy) / (radius * radius);
        if (t <= 0) continue;
        const i = (row * cols + col) * 2;
        const px = (field[i] ?? 0) + dx * t * t * 3.2;
        const py = (field[i + 1] ?? 0) + dy * t * t * 3.2;
        const length = Math.hypot(px, py);
        const limit = 0.4;
        const k = length > 0 ? (limit * Math.tanh(length / limit)) / length : 0;
        field[i] = px * k;
        field[i + 1] = py * k;
      }
    }
    state.fieldActive = true;
  };

  const relaxField = (dt: number) => {
    const { cols, rows, field, scratch } = state;
    const decay = Math.exp(-dt * 1.4);
    let peak = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = (row * cols + col) * 2;
        const l = (row * cols + Math.max(0, col - 1)) * 2;
        const r = (row * cols + Math.min(cols - 1, col + 1)) * 2;
        const up = (Math.max(0, row - 1) * cols + col) * 2;
        const down = (Math.min(rows - 1, row + 1) * cols + col) * 2;
        for (let c = 0; c < 2; c++) {
          const value =
            ((field[i + c] ?? 0) * 12 +
              (field[l + c] ?? 0) +
              (field[r + c] ?? 0) +
              (field[up + c] ?? 0) +
              (field[down + c] ?? 0)) /
            16;
          scratch[i + c] = value * decay;
          peak = Math.max(peak, Math.abs(value * decay));
        }
      }
    }
    field.set(scratch);
    if (peak < 0.0004) {
      field.fill(0);
      state.fieldActive = false;
    }
  };

  const render = () => {
    const s = getSettings();
    resolveColor(s);
    layoutField();
    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      state.cols,
      state.rows,
      gl.RG,
      gl.FLOAT,
      state.field,
    );
    swirlData.fill(0);
    state.swirls.forEach((swirl, k) => {
      const radius = 0.21 * (1 + 0.4 * swirl.age);
      const ease = Math.exp(-swirl.age * 1.35) - Math.exp(-swirl.age * 10);
      const fade = Math.min(1, (SWIRL_LIFE - swirl.age) / 0.8);
      swirlData.set(
        [swirl.x, swirl.y, radius, 3 * ease * fade * (0.21 / radius) ** 2],
        k * 4,
      );
    });
    gl.uniform2f(u('uResolution'), state.width, state.height);
    gl.uniform1f(u('uTime'), state.phase);
    gl.uniform3f(u('uColor'), state.color[0], state.color[1], state.color[2]);
    gl.uniform2f(u('uMouse'), state.mouse[0], state.mouse[1]);
    gl.uniform1f(u('uAmplitude'), s.amplitude);
    gl.uniform1f(u('uScale'), s.scale);
    gl.uniform1f(u('uRotation'), (s.rotation * Math.PI) / 180);
    gl.uniform1i(u('uDetail'), s.detail);
    gl.uniform1f(u('uWarp'), s.warp);
    gl.uniform1f(u('uHue'), (s.hueShift * Math.PI) / 180);
    gl.uniform1f(u('uSaturation'), s.saturation);
    gl.uniform1f(u('uBrightness'), s.brightness);
    gl.uniform1f(u('uContrast'), s.contrast);
    gl.uniform1f(u('uGrain'), s.grain);
    gl.uniform1f(u('uSeed'), state.seed);
    gl.uniform1f(u('uFade'), s.fade);
    gl.uniform1f(u('uOpacity'), s.opacity);
    gl.uniform1f(u('uStir'), s.mouseReact ? s.stir : 0);
    gl.uniform3f(
      u('uPointer'),
      pointer.x,
      pointer.y,
      s.mouseReact ? state.presence : 0,
    );
    gl.uniform1f(u('uSheen'), s.sheen);
    gl.uniform4fv(u('uSwirls'), swirlData);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const pixelRatio = () =>
    Math.min(window.devicePixelRatio || 1, 2) * getSettings().resolution;

  const resize = (width: number, height: number) => {
    const dpr = pixelRatio();
    state.width = Math.max(1, width);
    state.height = Math.max(1, height);
    canvas.width = Math.max(1, Math.round(state.width * dpr));
    canvas.height = Math.max(1, Math.round(state.height * dpr));
    render();
  };

  const update = () => {
    if (canvas.width !== Math.max(1, Math.round(state.width * pixelRatio()))) {
      resize(state.width, state.height);
    } else {
      render();
    }
  };

  const frame = (now: number) => {
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !isReduced();
    if (moving) state.phase += dt * s.speed;
    const tx = s.mouseReact && pointer.tracked ? pointer.x : 0.5;
    const ty = s.mouseReact && pointer.tracked ? pointer.y : 0.5;
    const follow = 1 - Math.exp(-dt * 5);
    state.mouse[0] += (tx - state.mouse[0]) * follow;
    state.mouse[1] += (ty - state.mouse[1]) * follow;
    const wanted = pointer.inside ? 1 : 0;
    state.presence += (wanted - state.presence) * (1 - Math.exp(-dt * 4));
    if (state.fieldActive) relaxField(dt);
    state.swirls = state.swirls.filter(
      (swirl) => (swirl.age += dt) < SWIRL_LIFE,
    );
    if (s.grain > 0 && moving) state.seed = Math.floor(now / 42) % 997;
    render();
    const settling =
      Math.abs(tx - state.mouse[0]) > 0.0005 ||
      Math.abs(ty - state.mouse[1]) > 0.0005 ||
      Math.abs(wanted - state.presence) > 0.002;
    if (moving || settling || state.fieldActive || state.swirls.length > 0) {
      return true;
    }
    last = 0;
    return false;
  };

  const pointerMove = (x: number, y: number) => {
    const s = getSettings();
    const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    if (
      inside &&
      s.mouseReact &&
      !isReduced() &&
      pointer.inside &&
      s.stir > 0
    ) {
      brush(x, y, x - pointer.x, y - pointer.y);
    }
    pointer.x = x;
    pointer.y = y;
    pointer.inside = inside;
    if (inside) pointer.tracked = true;
  };

  const swirl = (x: number, y: number) => {
    if (!getSettings().clickSwirl || isReduced()) return false;
    if (x < 0 || x > 1 || y < 0 || y > 1) return false;
    if (state.swirls.length >= MAX_SWIRLS) {
      const oldest = state.swirls[0];
      if (oldest && oldest.age < SWIRL_LIFE - 0.4) return false;
      state.swirls.shift();
    }
    state.swirls.push({ x, y, age: 0 });
    return true;
  };

  const dispose = () => {
    gl.deleteTexture(fieldTexture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  return {
    frame,
    update,
    resize,
    pointerMove,
    pointerLeave: () => {
      pointer.inside = false;
    },
    swirl,
    resetClock: () => {
      last = 0;
    },
    dispose,
  };
}
