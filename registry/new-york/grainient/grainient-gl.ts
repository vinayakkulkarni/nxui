import { COMPOSITE, FIELD, VERTEX } from './grainient-shaders';
import type {
  GrainientEngine,
  GrainientProps,
  GrainientSettings,
} from './types';

type Vec3 = [number, number, number];

interface LinkedProgram {
  program: WebGLProgram;
  loc: (name: string) => WebGLUniformLocation | null;
}

interface StirSample {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  grow: number;
  done: boolean;
}

interface Spin {
  x: number;
  y: number;
  age: number;
  direction: number;
}

const MAX_COLORS = 8;
const MAX_STIRS = 24;
const MAX_TWIRLS = 4;
const STIR_LIFE = 1.3;
const STIR_STEP = 0.06;
const TWIRL_LIFE = 2.6;
const INTRO_SECONDS = 1.6;
const LIFT = 0.2;
const TYPES: Record<string, number> = { linear: 0, radial: 1 };

export const GRAINIENT_COLORS = [
  '#120f17',
  '#2a0f0a',
  '#9a3412',
  '#f97316',
  '#fed7aa',
];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function normalizeGrainient(
  p: GrainientProps,
  reduce: boolean,
): GrainientSettings {
  const source = p.colors && p.colors.length ? p.colors : GRAINIENT_COLORS;
  const palette = source.slice(0, MAX_COLORS);
  const first = palette[0] ?? '#000000';
  return {
    colors: palette.length > 1 ? palette : [first, first],
    type: TYPES[p.type ?? 'linear'] ?? 0,
    angle: p.angle ?? 55,
    bands: clamp(p.bands ?? 1, 1, 8),
    speed: Math.max(0, p.speed ?? 1),
    flow: clamp(p.flow ?? 0.8, 0, 3),
    scale: clamp(p.scale ?? 1, 0.25, 3),
    softness: clamp(p.softness ?? 1, 0, 1),
    silk: clamp(p.silk ?? 0.35, 0, 1),
    grainAmount: clamp(p.grainAmount ?? 0.08, 0, 0.5),
    grainSize: clamp(p.grainSize ?? 1.2, 0.5, 4),
    grainAnimated: p.grainAnimated ?? true,
    contrast: clamp(p.contrast ?? 1, 0.2, 2),
    saturation: clamp(p.saturation ?? 1, 0, 2),
    variation: Math.max(0, p.variation ?? 0),
    interactive: p.interactive ?? true,
    stir: clamp(p.stir ?? 1, 0, 2),
    clickSwirl: p.clickSwirl ?? true,
    intro: p.intro ?? true,
    lightMode: p.lightMode ?? false,
    dpr: p.dpr,
    reduce,
  };
}

const toLinear = (value: number): number =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

function toLab([r, g, b]: Vec3): Vec3 {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
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

function link(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
): LinkedProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
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
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms.set(name, gl.getUniformLocation(program, name));
  }
  return { program, loc: (name) => uniforms.get(name) ?? null };
}

export function createGrainient(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  read: () => GrainientSettings,
): GrainientEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;
  const field = link(gl, FIELD);
  const composite = link(gl, COMPOSITE);
  if (!field || !composite) return null;
  const fu = field.loc;
  const cu = composite.loc;
  const vao = gl.createVertexArray();
  const target = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, target);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const buffer = gl.createFramebuffer();
  const fieldSize = { width: 0, height: 0 };

  // A 1×1 2D canvas resolves any CSS color string to sRGB.
  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, Vec3>();
  const parse = (value: string): Vec3 => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb: Vec3 = [0, 0, 0];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255];
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const initial = read();
  const reduce = initial.reduce;
  const view = { width: 1, height: 1, ratio: 1 };
  const ramp = new Float32Array(MAX_COLORS * 3);
  const stirs = new Float32Array(MAX_STIRS * 4);
  const stirWeights = new Float32Array(MAX_STIRS);
  const twirls = new Float32Array(MAX_TWIRLS * 4);
  const trail: StirSample[] = [];
  const spins: Spin[] = [];
  const pointer = {
    x: 0.5,
    y: 0.5,
    sx: 0.5,
    sy: 0.5,
    vx: 0,
    inside: false,
    fresh: true,
  };
  let paletteKey = '';
  let time = 0;
  let introClock = initial.intro && !reduce ? 0 : 1;
  let frameSeed = 0;
  let grainClock = 0;
  let raf = 0;
  let last = 0;
  let visible = true;
  let destroyed = false;

  const syncPalette = (s: GrainientSettings) => {
    const key = `${s.colors.join(',')}|${s.lightMode}`;
    if (key === paletteKey) return;
    paletteKey = key;
    const labs = s.colors.map((color) => toLab(parse(color)));
    if (!s.lightMode) {
      labs.forEach((lab, i) => ramp.set(lab, i * 3));
      return;
    }
    // Light palettes: colors matching the base lightness turn white, the rest run in reverse.
    const baseL = labs[0]?.[0] ?? 0;
    const blank = labs.map(([L]) => Math.abs(L - baseL) < 0.1);
    const tints = labs.filter((_, i) => !blank[i]).reverse();
    labs.forEach((_, i) => {
      const [L, a, b]: Vec3 = blank[i]
        ? [1, 0, 0]
        : (tints.shift() ?? [1, 0, 0]);
      ramp.set([L + (1 - L) * LIFT, a * (1 - LIFT), b * (1 - LIFT)], i * 3);
    });
  };

  const draw = () => {
    const s = read();
    const aspect = view.width / view.height;
    syncPalette(s);
    gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    gl.viewport(0, 0, fieldSize.width, fieldSize.height);
    gl.useProgram(field.program);
    gl.uniform1f(fu('uAspect'), aspect);
    gl.uniform1f(fu('uTime'), time);
    gl.uniform3fv(fu('uRamp'), ramp);
    gl.uniform1i(fu('uCount'), s.colors.length);
    const radians = (s.angle * Math.PI) / 180;
    gl.uniform1i(fu('uType'), s.type);
    gl.uniform2f(fu('uDir'), Math.sin(radians), Math.cos(radians));
    gl.uniform1f(
      fu('uExtent'),
      aspect * Math.abs(Math.sin(radians)) + Math.abs(Math.cos(radians)),
    );
    gl.uniform1f(fu('uBands'), s.bands);
    gl.uniform1f(fu('uSoftness'), s.softness);
    gl.uniform1f(fu('uFlow'), s.flow);
    gl.uniform1f(fu('uScale'), s.scale);
    gl.uniform1f(fu('uSilk'), s.silk);
    gl.uniform4fv(fu('uStir'), stirs);
    gl.uniform1fv(fu('uStirWeight'), stirWeights);
    gl.uniform4fv(fu('uTwirl'), twirls);
    gl.uniform2f(fu('uSeed'), s.variation * 3.17, s.variation * 1.91);
    gl.uniform1f(fu('uContrast'), s.contrast);
    gl.uniform1f(fu('uSaturation'), s.saturation);
    gl.uniform1f(fu('uSettle'), introClock * introClock * (3 - 2 * introClock));
    gl.uniform1f(fu('uReveal'), introClock);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(composite.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.uniform1i(cu('uField'), 0);
    gl.uniform1f(cu('uGrain'), s.grainAmount);
    gl.uniform1f(cu('uGrainSize'), s.grainSize * view.ratio);
    gl.uniform1f(cu('uFrame'), frameSeed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const updateTouches = (dt: number, aspect: number) => {
    const s = read();
    const follow = 1 - Math.exp(-dt / 0.06);
    const px = pointer.sx;
    const py = pointer.sy;
    pointer.sx += (pointer.x - pointer.sx) * follow;
    pointer.sy += (pointer.y - pointer.sy) * follow;
    const vx = ((pointer.sx - px) / dt) * aspect;
    const vy = (pointer.sy - py) / dt;
    pointer.vx = vx;
    const head = trail[0];
    for (const sample of trail) {
      if (sample.done) sample.age += dt;
    }
    if (
      s.interactive &&
      pointer.inside &&
      Math.hypot(vx, vy) > 0.02 &&
      !reduce
    ) {
      let live = head;
      if (!live || live.done) {
        live = { x: 0, y: 0, vx: 0, vy: 0, age: 0, grow: 0, done: false };
        trail.unshift(live);
        if (trail.length > MAX_STIRS) trail.pop();
      }
      live.x = (pointer.sx - 0.5) * aspect;
      live.y = pointer.sy - 0.5;
      live.vx = vx;
      live.vy = vy;
      live.grow = Math.min(1, live.grow + dt / STIR_STEP);
      live.done = live.grow >= 1;
    } else if (head) {
      head.done = true;
    }
    while (trail.length && (trail.at(-1)?.age ?? 0) > STIR_LIFE) trail.pop();
    for (let i = 0; i < MAX_STIRS; i++) {
      const sample = trail[i];
      if (!sample) {
        stirWeights[i] = 0;
        continue;
      }
      const fade = 1 - sample.age / STIR_LIFE;
      const cap = Math.min(
        1,
        2.2 / Math.max(Math.hypot(sample.vx, sample.vy), 0.001),
      );
      stirs.set([sample.x, sample.y, sample.vx * cap, sample.vy * cap], i * 4);
      stirWeights[i] = fade * fade * sample.grow * s.stir * 0.05;
    }
    for (const spin of spins) spin.age += dt;
    while (spins.length && (spins.at(-1)?.age ?? 0) > TWIRL_LIFE) spins.pop();
    for (let i = 0; i < MAX_TWIRLS; i++) {
      const spin = spins[i];
      if (!spin) {
        twirls[i * 4 + 2] = 0;
        continue;
      }
      const k = spin.age / TWIRL_LIFE;
      const envelope = Math.min(1, spin.age / 0.18) * (1 - k) * (1 - k);
      twirls.set(
        [
          spin.x,
          spin.y,
          spin.direction * 2.4 * envelope,
          0.16 + 0.1 * Math.min(1, spin.age / 0.5),
        ],
        i * 4,
      );
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (destroyed || !visible || document.hidden) return;
    const s = read();
    const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
    last = now;
    if (!reduce) time += dt * s.speed * 0.16;
    if (introClock < 1) {
      introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
    }
    grainClock += dt;
    if (s.grainAnimated && !reduce && grainClock > 1 / 24) {
      grainClock = 0;
      frameSeed = (frameSeed + 1) % 97;
    }
    updateTouches(dt, view.width / view.height);
    draw();
    const busy =
      (!reduce && (s.speed > 0 || s.grainAnimated)) ||
      introClock < 1 ||
      trail.length > 0 ||
      spins.length > 0;
    if (busy) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!destroyed && !raf && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  };

  const locate = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(1, rect.width);
    const y = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
    pointer.inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    pointer.x = x;
    pointer.y = y;
    if (pointer.fresh || !pointer.inside) {
      pointer.sx = x;
      pointer.sy = y;
      pointer.fresh = false;
    }
  };

  const resize = () => {
    const s = read();
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    const width = Math.max(1, Math.round(canvas.width / 2));
    const height = Math.max(1, Math.round(canvas.height / 2));
    if (width !== fieldSize.width || height !== fieldSize.height) {
      fieldSize.width = width;
      fieldSize.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target);
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
      gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        target,
        0,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    draw();
    wake();
  };

  return {
    resize,
    wake,
    setVisible(next) {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    pointerMove(event) {
      locate(event);
      if (pointer.inside || trail.length) wake();
    },
    pointerDown(event) {
      locate(event);
      if (!pointer.inside || !read().clickSwirl || reduce) return;
      spins.unshift({
        x: (pointer.x - 0.5) * (view.width / view.height),
        y: pointer.y - 0.5,
        age: 0,
        direction: pointer.vx < 0 ? 1 : -1,
      });
      if (spins.length > MAX_TWIRLS) spins.pop();
      wake();
    },
    pointerLeave() {
      pointer.inside = false;
    },
    visibilityChange() {
      last = 0;
      wake();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      gl.deleteTexture(target);
      gl.deleteFramebuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(field.program);
      gl.deleteProgram(composite.program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
