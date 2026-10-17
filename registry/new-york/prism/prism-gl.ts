import {
  PRISM_FRAGMENT,
  PRISM_INTRO_SECONDS,
  PRISM_PALETTE_SIZE,
  PRISM_VERTEX,
} from './prism-shaders';
import type {
  PrismEngine,
  PrismEngineOptions,
  PrismProgram,
  PrismSettings,
} from './types';

const HUE_W = [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114];
const HUE_U = [
  0.701, -0.587, -0.114, -0.299, 0.413, -0.114, -0.3, -0.588, 0.886,
];
const HUE_V = [0.168, -0.331, 0.5, 0.328, 0.035, -0.5, -0.497, 0.296, 0.201];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

function link(gl: WebGL2RenderingContext): PrismProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, PRISM_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, PRISM_FRAGMENT);
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
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

// Column-major 3×3 rotation from yaw (y), pitch (x) and roll (z).
function rotation(yaw: number, pitch: number, roll: number): number[] {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);
  const cz = Math.cos(roll);
  const sz = Math.sin(roll);
  return [
    cy * cz + sy * sx * sz,
    cx * sz,
    -sy * cz + cy * sx * sz,
    -cy * sz + sy * sx * cz,
    cx * cz,
    sy * sz + cy * sx * cz,
    sy * cx,
    -sx,
    cy * cx,
  ];
}

function multiply(a: number[], b: number[]): number[] {
  const out = Array.from({ length: 9 }, () => 0);
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 3; r++) {
      out[c * 3 + r] =
        (a[r] ?? 0) * (b[c * 3] ?? 0) +
        (a[3 + r] ?? 0) * (b[c * 3 + 1] ?? 0) +
        (a[6 + r] ?? 0) * (b[c * 3 + 2] ?? 0);
    }
  }
  return out;
}

export function createPrismEngine(
  options: PrismEngineOptions,
): PrismEngine | null {
  const { container, canvas, getSettings, reduce, onRestored } = options;
  const context = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;
  const linked = link(gl);
  if (!linked) return null;
  const shader: PrismProgram = linked;
  const u = shader.uniforms;

  function onContextLost(event: Event) {
    event.preventDefault();
  }
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  const vao = gl.createVertexArray();
  const paletteTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    PRISM_PALETTE_SIZE,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );

  // Any CSS color string resolves through a 1×1 2D canvas.
  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  function parse(value: string): [number, number, number] {
    if (!probe) return [255, 255, 255];
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = '#000000';
    probe.fillStyle = String(value);
    probe.fillRect(0, 0, 1, 1);
    const data = probe.getImageData(0, 0, 1, 1).data;
    return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
  }

  let paletteKey = '';
  // 1 when every custom color is gray, so light mode inks them darker.
  let neutral = 0;
  function syncPalette(list: string[]) {
    const key = list.join(',');
    if (key === paletteKey) return;
    paletteKey = key;
    neutral = 0;
    if (!list.length) return;
    const stops = list.map(parse);
    neutral =
      1 -
      stops.reduce((sum, [r, g, b]) => {
        const top = Math.max(r, g, b);
        return sum + (top > 0 ? (top - Math.min(r, g, b)) / top : 0);
      }, 0) /
        stops.length;
    const data = new Uint8Array(PRISM_PALETTE_SIZE * 4);
    for (let i = 0; i < PRISM_PALETTE_SIZE; i++) {
      const position = (i / PRISM_PALETTE_SIZE) * stops.length;
      const index = Math.floor(position);
      const a = stops[index % stops.length] ?? [255, 255, 255];
      const b = stops[(index + 1) % stops.length] ?? a;
      const t = position - index;
      const k = t * t * (3 - 2 * t);
      for (let c = 0; c < 3; c++) {
        const from = a[c] ?? 0;
        data[i * 4 + c] = Math.round(from + ((b[c] ?? 0) - from) * k);
      }
      data[i * 4 + 3] = 255;
    }
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      PRISM_PALETTE_SIZE,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data,
    );
  }

  const view = { width: 1, height: 1, scale: 1 };
  const pose = { yaw: 0, pitch: 0, roll: 0 };
  const pointer = { x: 0, y: 0, inside: false };
  let time = 0;
  let introClock = getSettings().intro && !reduce ? 0 : 1;
  let raf = 0;
  let last = 0;
  let visible = true;
  let disposed = false;

  function orientation(s: PrismSettings): number[] {
    const tilt = rotation(pose.yaw, pose.pitch, pose.roll);
    if (s.animationType === 'rotate') {
      const t = time * s.timeScale;
      const c0 = Math.cos(t);
      const c1 = Math.cos(t + 33);
      const c2 = Math.cos(t + 11);
      return multiply(tilt, [c0, 0, c2, 0, 1, 0, c1, 0, c0]);
    }
    if (s.animationType === '3drotate') {
      const t = time * s.timeScale;
      return multiply(
        tilt,
        rotation(
          t * 0.55,
          Math.sin(t * 0.6 + 0.6) * 0.6,
          Math.sin(t * 0.35 + 1.9) * 0.5,
        ),
      );
    }
    return tilt;
  }

  function draw() {
    const s = getSettings();
    syncPalette(s.colors);
    const half = s.baseWidth * 0.5;
    const ignite = introClock * introClock * (3 - 2 * introClock);
    const c = Math.cos(s.hueShift);
    const sn = Math.sin(s.hueShift);
    gl.bindVertexArray(vao);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(shader.program);
    gl.uniform2f(u.uResolution ?? null, canvas.width, canvas.height);
    gl.uniformMatrix3fv(u.uRay ?? null, false, orientation(s));
    gl.uniform1f(u.uGlow ?? null, s.glow * ignite * ignite);
    gl.uniform2f(
      u.uOffset ?? null,
      s.offsetX * view.scale,
      -s.offsetY * view.scale,
    );
    gl.uniform1f(u.uColorFreq ?? null, s.colorFrequency);
    gl.uniform1f(u.uCenterShift ?? null, s.height * 0.25);
    gl.uniform1f(u.uInvBaseHalf ?? null, 1 / half);
    gl.uniform1f(u.uInvHeight ?? null, 1 / s.height);
    gl.uniform1f(u.uMinAxis ?? null, Math.min(half, s.height));
    gl.uniform1f(u.uPxScale ?? null, 1 / (canvas.height * 0.1 * s.scale));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.uniform1i(u.uPalette ?? null, 0);
    gl.uniform1i(u.uUsePalette ?? null, s.colors.length ? 1 : 0);
    gl.uniform1f(u.uTime ?? null, time);
    gl.uniform1f(u.uNoise ?? null, s.noise);
    gl.uniform1f(u.uSaturation ?? null, s.saturation);
    gl.uniformMatrix3fv(
      u.uHue ?? null,
      false,
      HUE_W.map((w, i) => w + (HUE_U[i] ?? 0) * c + (HUE_V[i] ?? 0) * sn),
    );
    gl.uniform1i(u.uUseHue ?? null, Math.abs(s.hueShift) > 0.0001 ? 1 : 0);
    gl.uniform1f(u.uLight ?? null, s.lightMode ? 1 : 0);
    gl.uniform1f(u.uNeutral ?? null, neutral);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function ratio(s: PrismSettings): number {
    return Math.min(s.dpr || window.devicePixelRatio || 1, 2) * s.resolution;
  }

  function resize() {
    if (disposed) return;
    const s = getSettings();
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.scale = ratio(s);
    canvas.width = Math.max(1, Math.round(view.width * view.scale));
    canvas.height = Math.max(1, Math.round(view.height * view.scale));
    draw();
    wake();
  }

  function frame(now: number) {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const s = getSettings();
    if (Math.round(view.width * ratio(s)) !== canvas.width) {
      resize();
      return;
    }
    const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
    last = now;
    if (!reduce) time += dt;
    if (introClock < 1) {
      introClock = Math.min(1, introClock + dt / PRISM_INTRO_SECONDS);
    }
    const hover = s.animationType === 'hover';
    const aim = pointer.inside && !reduce && (hover || s.interactive);
    const reach = (hover ? 0.6 : 0.09) * s.hoverStrength;
    const yaw = aim ? -pointer.x * reach : 0;
    const pitch = aim ? pointer.y * reach : 0;
    const follow = 1 - Math.pow(1 - s.inertia, dt * 60);
    pose.yaw += (yaw - pose.yaw) * follow;
    pose.pitch += (pitch - pose.pitch) * follow;
    pose.roll += (0 - pose.roll) * (1 - Math.pow(0.9, dt * 60));
    draw();
    const settling =
      Math.abs(yaw - pose.yaw) +
        Math.abs(pitch - pose.pitch) +
        Math.abs(pose.roll) >
      1e-4;
    const spinning =
      !reduce && !hover && s.animationType !== 'static' && s.timeScale > 0;
    const busy =
      spinning || settling || introClock < 1 || (!reduce && s.noise > 0);
    if (busy) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  function wake() {
    if (!raf && !disposed && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  }

  resize();

  return {
    refresh: wake,
    resize,
    pointerMove(clientX, clientY) {
      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const y = ((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
      pointer.inside = Math.abs(x) <= 1 && Math.abs(y) <= 1;
      pointer.x = clamp(x, -1, 1);
      pointer.y = clamp(y, -1, 1);
      const s = getSettings();
      if (s.interactive || s.animationType === 'hover') wake();
    },
    pointerLeave() {
      pointer.inside = false;
      wake();
    },
    setVisible(next) {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    visibilityChanged() {
      last = 0;
      wake();
    },
    dispose(loseContext) {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      gl.deleteTexture(paletteTexture);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
      if (loseContext) gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
