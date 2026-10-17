import {
  GALAXY_FRAGMENT,
  GALAXY_VERTEX,
  MAX_COLORS,
  MAX_LAYERS,
} from './galaxy-shaders';
import type { GalaxyEngine, GalaxyProps, GalaxySettings } from './types';

const INTRO_SECONDS = 2.2;
const DEFAULT_FOCAL: [number, number] = [0.5, 0.5];
const DEFAULT_ROTATION: [number, number] = [1, 0];
const NO_COLORS: string[] = [];

interface LinkedProgram {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}

interface ProgramEntry {
  program: WebGLProgram | null;
  linked: LinkedProgram | null;
  done: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const pair = (
  value: [number, number] | undefined,
  fallback: [number, number],
): [number, number] =>
  Array.isArray(value) && value.length >= 2 ? value : fallback;

export function toGalaxySettings(props: GalaxyProps): GalaxySettings {
  const palette = Array.isArray(props.starColors)
    ? props.starColors.filter(Boolean).slice(0, MAX_COLORS)
    : NO_COLORS;
  return {
    focal: pair(props.focal, DEFAULT_FOCAL),
    rotation: pair(props.rotation, DEFAULT_ROTATION),
    starSpeed: props.starSpeed ?? 0.5,
    density: Math.max(0.01, props.density ?? 1),
    hueShift: props.hueShift ?? 140,
    disableAnimation: props.disableAnimation ?? false,
    speed: props.speed ?? 1,
    mouseInteraction: props.mouseInteraction ?? true,
    glowIntensity: Math.max(0, props.glowIntensity ?? 0.3),
    saturation: Math.max(0, props.saturation ?? 0),
    mouseRepulsion: props.mouseRepulsion ?? true,
    repulsionStrength: props.repulsionStrength ?? 2,
    twinkleIntensity: clamp(props.twinkleIntensity ?? 0.3, 0, 1),
    rotationSpeed: props.rotationSpeed ?? 0.1,
    autoCenterRepulsion: Math.max(0, props.autoCenterRepulsion ?? 0),
    transparent: props.transparent ?? true,
    lightMode: props.lightMode ?? false,
    palette,
    starSize: Math.max(0, props.starSize ?? 1),
    flareIntensity: Math.max(0, props.flareIntensity ?? 1),
    layers: clamp(Math.round(props.layers ?? 4), 2, MAX_LAYERS),
    reverse: props.direction === 'backward',
    clickWarp: props.clickWarp ?? true,
    intro: props.intro ?? true,
    backgroundColor: props.backgroundColor,
    opacity: clamp(props.opacity ?? 1, 0, 1),
    dpr: props.dpr,
  };
}

const variantKey = (palette: boolean, repel: boolean, warp: boolean) =>
  (palette ? 4 : 0) + (repel ? 2 : 0) + (warp ? 1 : 0);

function startProgram(
  gl: WebGL2RenderingContext,
  palette: boolean,
  repel: boolean,
  warp: boolean,
): WebGLProgram | null {
  const defines = `${palette ? '#define PALETTE\n' : ''}${repel ? '#define REPEL\n' : ''}${warp ? '#define WARP\n' : ''}`;
  const program = gl.createProgram();
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  if (!program || !vertex || !fragment) return null;
  gl.shaderSource(vertex, GALAXY_VERTEX);
  gl.shaderSource(fragment, GALAXY_FRAGMENT.replace('\n', `\n${defines}`));
  gl.compileShader(vertex);
  gl.compileShader(fragment);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return program;
}

function finishProgram(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): LinkedProgram | null {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      uniforms.set(
        info.name.replace('[0]', ''),
        gl.getUniformLocation(program, info.name),
      );
    }
  }
  return { program, uniforms };
}

export function createGalaxyEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => GalaxySettings,
  isReduced: () => boolean,
  wake: () => void,
): GalaxyEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const programs = new Map<number, ProgramEntry>();
  const entry = (palette: boolean, repel: boolean, warp: boolean) => {
    const key = variantKey(palette, repel, warp);
    let found = programs.get(key);
    if (!found) {
      found = {
        program: startProgram(gl, palette, repel, warp),
        linked: null,
        done: false,
      };
      programs.set(key, found);
    }
    return found;
  };
  const variant = (
    palette: boolean,
    repel: boolean,
    warp: boolean,
    wait: boolean,
  ) => {
    const found = entry(palette, repel, warp);
    if (!found.done && found.program) {
      if (
        !wait &&
        parallel &&
        !gl.getProgramParameter(found.program, parallel.COMPLETION_STATUS_KHR)
      ) {
        return null;
      }
      found.linked = finishProgram(gl, found.program);
      found.done = true;
    }
    return found.linked;
  };
  const deletePrograms = () => {
    programs.forEach((found) => {
      if (found.program) gl.deleteProgram(found.program);
    });
    programs.clear();
  };

  const initial = getSettings();
  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  if (
    !variant(initial.palette.length > 0, false, false, true) ||
    !buffer ||
    !vao
  ) {
    deletePrograms();
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

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, number[]>();
  const parse = (value: string | undefined, fallback: number[]) => {
    if (!value) return fallback;
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb = fallback;
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
  const colors = new Float32Array(MAX_COLORS * 3);
  const WHITE = [1, 1, 1];
  const BLACK = [0, 0, 0];

  const view = { width: 1, height: 1 };
  const pointer = { x: 0.5, y: 0.5, inside: false };
  const state = {
    time: 0,
    gloss: 0,
    depth: 0,
    angle: 0,
    mx: 0.5,
    my: 0.5,
    active: 0,
    boost: 0,
    reveal: initial.intro && !isReduced() ? 0 : 1,
  };
  let last = 0;
  let visible = true;
  let lastDpr = initial.dpr;

  const render = () => {
    const s = getSettings();
    s.palette.forEach((value, index) =>
      colors.set(parse(value, WHITE), index * 3),
    );
    const mode = s.lightMode ? (s.transparent ? 3 : 2) : s.transparent ? 1 : 0;
    const background = parse(s.backgroundColor, s.lightMode ? WHITE : BLACK);
    const palette = s.palette.length > 0;
    const repel =
      s.autoCenterRepulsion > 0 ||
      (s.mouseRepulsion && s.repulsionStrength > 0 && state.active > 0);
    const warp = state.boost > 0;
    const base = variant(palette, false, false, true);
    if (!base) return;
    const program =
      (repel || warp ? variant(palette, repel, warp, false) : null) ?? base;
    const u = (name: string) => program.uniforms.get(name) ?? null;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program.program);
    gl.bindVertexArray(vao);
    gl.uniform1f(u('uTime'), state.time);
    gl.uniform2f(u('uResolution'), canvas.width, canvas.height);
    gl.uniform2f(u('uFocal'), s.focal[0], s.focal[1]);
    gl.uniform2f(u('uRotation'), s.rotation[0], s.rotation[1]);
    gl.uniform1f(u('uGloss'), state.gloss);
    gl.uniform1f(u('uDepth'), state.depth);
    gl.uniform1f(u('uDensity'), s.density);
    gl.uniform1f(u('uHueShift'), s.hueShift);
    gl.uniform1f(u('uSpeed'), s.speed);
    gl.uniform2f(u('uMouse'), state.mx, state.my);
    const stretch = 1 + state.boost * 5;
    gl.uniform1f(
      u('uStarGlow'),
      (0.05 * s.glowIntensity * s.starSize) / Math.pow(stretch, 0.6),
    );
    gl.uniform1f(u('uFlareGain'), s.glowIntensity * s.flareIntensity);
    gl.uniform1f(u('uSquash'), 1 - 1 / (stretch * stretch));
    gl.uniform1f(u('uSaturation'), s.saturation);
    gl.uniform1f(u('uMouseRepulsion'), s.mouseRepulsion ? 1 : 0);
    gl.uniform1f(u('uTwinkleIntensity'), s.twinkleIntensity);
    gl.uniform1f(u('uRotationAngle'), state.angle);
    gl.uniform1f(u('uRepulsionStrength'), s.repulsionStrength);
    gl.uniform1f(u('uMouseActiveFactor'), state.active);
    gl.uniform1f(u('uAutoCenterRepulsion'), s.autoCenterRepulsion);
    gl.uniform1i(u('uLayers'), s.layers);
    gl.uniform3fv(u('uColors'), colors);
    gl.uniform1i(u('uColorCount'), s.palette.length);
    gl.uniform1f(u('uWarp'), state.boost);
    const fade = Math.min(1, state.reveal / 0.35);
    gl.uniform1f(u('uReveal'), fade * fade * (3 - 2 * fade));
    gl.uniform1f(u('uMode'), mode);
    gl.uniform3fv(u('uBackground'), background);
    gl.uniform1f(u('uOpacity'), s.opacity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    if (!visible) return false;
    const s = getSettings();
    const reduce = isReduced();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    const motion = s.disableAnimation || reduce ? 0 : 1;
    if (s.intro && !reduce && state.reveal < 1) {
      state.reveal = Math.min(1, state.reveal + dt / INTRO_SECONDS);
      state.boost = Math.max(state.boost, Math.pow(1 - state.reveal, 2) * 1.4);
    } else if (!s.intro || reduce) {
      state.reveal = 1;
    }
    const flight = (s.starSpeed / 10) * (s.reverse ? -1 : 1);
    state.time += dt * motion;
    state.gloss += dt * flight * motion;
    state.depth += dt * flight * s.speed * motion * (1 + state.boost * 14);
    state.angle += dt * s.rotationSpeed * motion;
    state.boost *= Math.exp(-dt * 1.3);
    if (state.boost < 0.001) state.boost = 0;

    const follow = 1 - Math.exp(-dt / 0.325);
    const engaged = s.mouseInteraction && pointer.inside && !reduce;
    if (engaged) {
      state.mx += (pointer.x - state.mx) * follow;
      state.my += (pointer.y - state.my) * follow;
    }
    const target = engaged ? 1 : 0;
    state.active += (target - state.active) * follow;
    if (Math.abs(target - state.active) < 0.001) state.active = target;

    render();
    const busy =
      motion > 0 ||
      state.boost > 0 ||
      state.active !== target ||
      state.reveal < 1;
    if (!busy) last = 0;
    return busy;
  };

  const resize = (width: number, height: number) => {
    const s = getSettings();
    view.width = Math.max(1, width);
    view.height = Math.max(1, height);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * ratio));
    canvas.height = Math.max(1, Math.round(view.height * ratio));
    render();
    wake();
  };

  const locate = (x: number, y: number, inside: boolean) => {
    pointer.inside = inside;
    pointer.x = x / view.width;
    pointer.y = 1 - y / view.height;
  };

  const tinted = initial.palette.length > 0;
  const repelling =
    initial.autoCenterRepulsion > 0 ||
    (initial.mouseInteraction && initial.mouseRepulsion);
  if (initial.clickWarp || initial.intro) entry(tinted, false, true);
  if (repelling) entry(tinted, true, false);
  if (repelling && initial.clickWarp) entry(tinted, true, true);

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
      locate(x, y, inside);
      wake();
    },
    pointerDown(x, y, inside) {
      locate(x, y, inside);
      if (!pointer.inside || !getSettings().clickWarp || isReduced()) return;
      state.boost = Math.min(1.6, state.boost + 1);
      wake();
    },
    pointerUp(isMouse) {
      if (!isMouse) pointer.inside = false;
    },
    pointerLeave() {
      pointer.inside = false;
    },
    resetClock() {
      last = 0;
    },
    dispose() {
      deletePrograms();
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
