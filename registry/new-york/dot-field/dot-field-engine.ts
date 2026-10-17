import { FRAGMENT, VERTEX } from './dot-field-shaders';
import {
  MAX_DOTS,
  PIXEL_BUDGET,
  buildDots,
  clamp,
  lensReach,
} from './dot-field-math';
import type { DotFieldEngine, DotFieldSettings } from './types';

type Uniforms = Record<string, WebGLUniformLocation | null>;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Uniforms = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

const strengthOf = (s: DotFieldSettings, zoom: number) => {
  const base = s.strength >= 0 ? s.strength * 1.2 : s.strength * 0.7;
  return clamp(base * (1 + zoom * 0.6), -0.85, 1.45);
};

/**
 * Instanced WebGL2 dot field with a spring-follow lens. Returns null without
 * WebGL2. `skipIntro` is set when the context is rebuilt after a loss.
 */
export function createDotFieldEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => DotFieldSettings,
  isReduced: () => boolean,
  skipIntro: boolean,
): DotFieldEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  const shader = gl ? link(gl) : null;
  if (!gl || !shader) return null;
  const u = (name: string) => shader.uniforms[name] ?? null;

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
  gl.vertexAttribDivisor(0, 1);
  gl.bindVertexArray(null);

  const size = { width: 1, height: 1, ratio: 1 };
  const pointer = { x: 0, y: 0, inside: false, down: false };
  const lens = { x: 0, y: 0, vx: 0, vy: 0, presence: 0, zoom: 0, ready: false };
  let layoutKey = '';
  let count = 0;
  let time = Math.random() * 100;
  let focus = getSettings().intro && !isReduced() && !skipIntro ? 0 : 1;
  let last = 0;

  const layout = () => {
    const s = getSettings();
    const reach = lensReach(
      s.lensRadius,
      strengthOf(s, s.holdToZoom ? 1 : 0),
      s.twist * (s.holdToZoom ? 1.6 : 1),
    );
    const margin = Math.ceil(reach + s.wave + s.step * 2);
    const area = (size.width + margin * 2) * (size.height + margin * 2);
    const step = Math.max(s.step, Math.sqrt(area / MAX_DOTS));
    const key = `${size.width}|${size.height}|${step}|${s.pattern}|${margin}`;
    if (key === layoutKey) return;
    layoutKey = key;
    const data = buildDots(size.width, size.height, step, s.pattern, margin);
    count = data.length / 4;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  };

  return {
    resize(cssW, cssH, devicePixelRatio) {
      const s = getSettings();
      const cssWidth = Math.max(1, cssW);
      const cssHeight = Math.max(1, cssH);
      const ratio = Math.min(
        devicePixelRatio || 1,
        s.maxRatio,
        Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight)),
      );
      const width = Math.max(1, Math.round(cssWidth * ratio));
      const height = Math.max(1, Math.round(cssHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      size.width = cssWidth;
      size.height = cssHeight;
      size.ratio = width / cssWidth;
      layout();
    },

    start(now) {
      last = now;
    },

    frame(now) {
      if (gl.isContextLost()) return false;
      const s = getSettings();
      const reduced = isReduced();
      const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
      last = Math.max(last, now);
      if (!reduced) time += dt * s.speed;
      if (focus < 1) focus = Math.min(1, focus + dt / 1.8);

      const tracking = s.interactive && pointer.inside;
      if (tracking && (!lens.ready || lens.presence < 0.01)) {
        lens.x = pointer.x;
        lens.y = pointer.y;
        lens.vx = 0;
        lens.vy = 0;
        lens.ready = true;
      }
      if (lens.ready) {
        const omega = 18;
        const f = 1 + 2 * dt * omega;
        const oo = omega * omega;
        const hoo = dt * oo;
        const hhoo = dt * hoo;
        const inv = 1 / (f + hhoo);
        const nx = (f * lens.x + dt * lens.vx + hhoo * pointer.x) * inv;
        const ny = (f * lens.y + dt * lens.vy + hhoo * pointer.y) * inv;
        lens.vx = (lens.vx + hoo * (pointer.x - lens.x)) * inv;
        lens.vy = (lens.vy + hoo * (pointer.y - lens.y)) * inv;
        lens.x = nx;
        lens.y = ny;
      }
      const presenceTarget = tracking ? 1 : 0;
      lens.presence +=
        (presenceTarget - lens.presence) *
        (1 - Math.exp(-dt / (tracking ? 0.18 : 0.4)));
      const zoomTarget = tracking && pointer.down && s.holdToZoom ? 1 : 0;
      lens.zoom += (zoomTarget - lens.zoom) * (1 - Math.exp(-dt / 0.14));

      const eased =
        focus < 0.5
          ? 4 * focus * focus * focus
          : 1 - Math.pow(-2 * focus + 2, 3) / 2;
      const presence = lens.presence * lens.presence * (3 - 2 * lens.presence);
      const extent =
        Math.abs(size.width * s.direction[0]) +
        Math.abs(size.height * s.direction[1]);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(shader.program);
      gl.bindVertexArray(vao);
      gl.uniform2f(u('uSize'), size.width, size.height);
      gl.uniform1f(u('uPixel'), size.ratio);
      gl.uniform1f(u('uRadius'), s.radius);
      gl.uniform1f(u('uCell'), s.step);
      gl.uniform4f(
        u('uLens'),
        lens.x,
        lens.y,
        s.lensRadius * (1 + lens.zoom * 0.12),
        presence,
      );
      gl.uniform2f(
        u('uWarp'),
        strengthOf(s, lens.zoom),
        s.twist * (1 + lens.zoom * 0.6),
      );
      gl.uniform3f(
        u('uGlow'),
        s.glowRadius * (1 + lens.zoom * 0.1),
        s.glowIntensity * (1 + lens.zoom * 0.25),
        s.light ? 0 : 1,
      );
      gl.uniform3f(u('uFrom'), s.from[0], s.from[1], s.from[2]);
      gl.uniform3f(u('uTo'), s.to[0], s.to[1], s.to[2]);
      gl.uniform4f(
        u('uGlowColor'),
        s.glowColor[0],
        s.glowColor[1],
        s.glowColor[2],
        s.glowWeight,
      );
      gl.uniform3f(
        u('uGradient'),
        s.direction[0],
        s.direction[1],
        Math.max(extent, 1),
      );
      gl.uniform1f(u('uTime'), time);
      gl.uniform1f(u('uWave'), s.wave);
      gl.uniform1f(u('uSparkle'), s.sparkle);
      gl.uniform1f(u('uFocus'), eased);
      gl.uniform1f(u('uBase'), s.light ? Math.min(1, s.base * 1.3) : s.base);
      gl.uniform1f(u('uLight'), s.light ? 1 : 0);
      gl.uniform1f(u('uOpacity'), s.opacity);
      if (count) gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);

      const moving =
        Math.abs(pointer.x - lens.x) + Math.abs(pointer.y - lens.y) > 0.05 ||
        Math.hypot(lens.vx, lens.vy) > 0.5;
      const settling =
        Math.abs(presenceTarget - lens.presence) > 0.002 ||
        Math.abs(zoomTarget - lens.zoom) > 0.002 ||
        (lens.presence > 0.002 && moving);
      const animated = !reduced && s.speed > 0 && (s.wave > 0 || s.sparkle > 0);
      return focus < 1 || settling || animated;
    },

    pointer(x, y, inside, down) {
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
      if (down !== undefined) pointer.down = down;
    },

    release(keepInside) {
      pointer.down = false;
      if (!keepInside) pointer.inside = false;
    },

    leave() {
      pointer.inside = false;
      pointer.down = false;
    },

    dispose() {
      if (gl.isContextLost()) return;
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
    },
  };
}
