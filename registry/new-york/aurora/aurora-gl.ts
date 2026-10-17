import {
  FRAGMENT,
  INTRO_SECONDS,
  MAX_LAYERS,
  MAX_STOPS,
  VERTEX,
} from './aurora-shaders';
import type { AuroraEngine, AuroraProps, AuroraSettings } from './types';

interface LinkedProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

type Triple = [number, number, number];

const FALLBACK_STOPS = ['#5227FF', '#7cff67'];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function normalizeAurora(
  p: AuroraProps,
  reduce: boolean,
): AuroraSettings {
  const stops = (Array.isArray(p.colorStops) ? p.colorStops : [])
    .filter(Boolean)
    .map(String)
    .slice(0, MAX_STOPS);
  const first = stops[0];
  return {
    stops:
      stops.length >= 2
        ? stops
        : first !== undefined
          ? [first, first]
          : FALLBACK_STOPS,
    amplitude: Math.max(0, p.amplitude ?? 1),
    blend: clamp(p.blend ?? 0.5, 0, 1),
    speed: p.speed ?? 1,
    time: p.time,
    height: clamp(p.height ?? 0.45, 0, 1),
    scale: Math.max(0.1, p.scale ?? 1),
    glow: Math.max(0, p.glow ?? 0.6),
    brightness: Math.max(0, p.brightness ?? 1),
    layers: clamp(Math.round(p.layers ?? 1), 1, MAX_LAYERS),
    flip: p.direction === 'bottom' ? 1 : 0,
    mouseInteraction: p.mouseInteraction ?? true,
    intro: p.intro ?? true,
    opacity: clamp(p.opacity ?? 1, 0, 1),
    lightMode: p.lightMode ?? false,
    paused: p.paused ?? false,
    dpr: p.dpr,
    reduce,
  };
}

const toLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

function toOklch(rgb: Triple): Triple {
  const r = toLinear(rgb[0]);
  const g = toLinear(rgb[1]);
  const b = toLinear(rgb[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lab: Triple = [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
  return [lab[0], Math.hypot(lab[1], lab[2]), Math.atan2(lab[2], lab[1])];
}

function unwrapHues(stops: Triple[]): Triple[] {
  const known = stops.find((stop) => stop[1] > 0.02);
  let previous = known ? known[2] : 0;
  return stops.map((stop) => {
    let hue = stop[1] > 0.02 ? stop[2] : previous;
    while (hue - previous > Math.PI) hue -= Math.PI * 2;
    while (hue - previous < -Math.PI) hue += Math.PI * 2;
    previous = hue;
    return [stop[0], stop[1], hue];
  });
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

function link(gl: WebGL2RenderingContext): LinkedProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
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
    if (info) {
      uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(
        program,
        info.name,
      );
    }
  }
  return { program, uniforms };
}

export function createAurora(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  read: () => AuroraSettings,
): AuroraEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;
  const linked = link(gl);
  if (!linked) return null;
  const { program, uniforms: u } = linked;

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

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const cache = new Map<string, Triple>();
  const parse = (value: string): Triple => {
    const hit = cache.get(value);
    if (hit) return hit;
    let rgb: Triple = [1, 1, 1];
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
    cache.set(value, rgb);
    return rgb;
  };
  const palette = new Float32Array(MAX_STOPS * 3);

  const initial = read();
  const view = { width: 1, height: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const state = {
    clock: 0,
    px: 0,
    py: 0.5,
    reach: 0,
    reveal: initial.intro && !initial.reduce ? 0 : 1,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let lastDpr = initial.dpr;

  const render = () => {
    const s = read();
    unwrapHues(s.stops.map((value) => toOklch(parse(value)))).forEach(
      (stop, index) => palette.set(stop, index * 3),
    );
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(u.uResolution ?? null, canvas.width, canvas.height);
    gl.uniform1f(
      u.uTime ?? null,
      s.time !== undefined ? s.time * s.speed * 0.1 : state.clock,
    );
    gl.uniform3fv(u.uStops ?? null, palette);
    gl.uniform1i(u.uStopCount ?? null, s.stops.length);
    gl.uniform1f(u.uAmplitude ?? null, s.amplitude);
    gl.uniform1f(u.uBlend ?? null, s.blend);
    gl.uniform1f(u.uHeight ?? null, s.height);
    gl.uniform1f(u.uScale ?? null, s.scale);
    gl.uniform1f(u.uGlow ?? null, s.glow);
    gl.uniform1f(u.uBrightness ?? null, s.brightness);
    gl.uniform1i(u.uLayers ?? null, s.layers);
    gl.uniform1f(u.uFlip ?? null, s.flip);
    gl.uniform3f(u.uPointer ?? null, state.px, state.py, state.reach);
    gl.uniform1f(u.uReveal ?? null, 1 - Math.pow(1 - state.reveal, 3));
    gl.uniform1f(u.uOpacity ?? null, s.opacity);
    gl.uniform1f(u.uLightMode ?? null, s.lightMode ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const s = read();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    if (s.paused) {
      state.reveal = 1;
      render();
      last = 0;
      return;
    }
    const motion = s.reduce ? 0 : 1;
    state.clock += dt * s.speed * motion;
    const engaged = s.mouseInteraction && pointer.inside && !s.reduce;
    const follow = 1 - Math.exp(-dt / 0.6);
    if (engaged) {
      const tx = (pointer.x - view.width / 2) / view.height;
      const ty = s.flip ? 1 - pointer.y / view.height : pointer.y / view.height;
      state.px += (tx - state.px) * follow;
      state.py += (ty - state.py) * follow;
    }
    state.reach +=
      ((engaged ? 1 : 0) - state.reach) *
      (1 - Math.exp(-dt / (engaged ? 0.9 : 1.4)));
    if (!s.intro || s.reduce) state.reveal = 1;
    else if (state.reveal < 1) {
      state.reveal = Math.min(1, state.reveal + dt / INTRO_SECONDS);
    }
    render();
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const s = read();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    view.width = width;
    view.height = height;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    render();
    start();
  };

  return {
    resize,
    wake() {
      const s = read();
      if (s.dpr !== lastDpr) {
        lastDpr = s.dpr;
        resize();
        return;
      }
      if (!raf) render();
      start();
    },
    setVisible(next) {
      visible = next;
      if (visible) {
        last = 0;
        start();
      }
    },
    visibilityChange() {
      last = 0;
      start();
    },
    pointerMove(event) {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      const wasInside = pointer.inside;
      pointer.inside =
        pointer.x >= 0 &&
        pointer.y >= 0 &&
        pointer.x <= rect.width &&
        pointer.y <= rect.height;
      if (pointer.inside && !wasInside) {
        const s = read();
        const h = Math.max(1, rect.height);
        state.px = (pointer.x - rect.width / 2) / h;
        state.py = s.flip ? 1 - pointer.y / h : pointer.y / h;
      }
      if (!read().paused) start();
    },
    pointerUp(event) {
      if (event.pointerType !== 'mouse') pointer.inside = false;
    },
    pointerLeave() {
      pointer.inside = false;
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
