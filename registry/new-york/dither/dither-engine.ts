import {
  INTRO_SECONDS,
  MAX_PALETTE,
  MAX_RIPPLES,
  MAX_TRAIL,
  RIPPLE_SECONDS,
  clamp,
  toLinear,
} from './dither-config';
import { DITHER_FRAGMENT, VERTEX, WAVE_FRAGMENT } from './dither-shaders';
import type {
  DitherColor,
  DitherEngine,
  DitherEngineOptions,
  DitherProgram,
  DitherRipple,
  DitherTrailPoint,
} from './types';

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function link(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
): DitherProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      uniforms[info.name.replace('[0]', '')] = gl.getUniformLocation(
        program,
        info.name,
      );
    }
  }
  return { program, uniforms };
}

/**
 * Two-pass dither on raw WebGL2: an fbm wave field rendered at one texel per
 * dither cell, then a full-res pass that thresholds it into crisp pixels.
 * Returns null when WebGL2 or a shader is unavailable.
 */
export function createDitherEngine(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  { getSettings, reducedMotion: reduce }: DitherEngineOptions,
): DitherEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const wave = link(gl, WAVE_FRAGMENT);
  const dither = link(gl, DITHER_FRAGMENT);
  if (!wave || !dither) {
    if (wave) gl.deleteProgram(wave.program);
    if (dither) gl.deleteProgram(dither.program);
    return null;
  }
  const w = (name: string) => wave.uniforms[name] ?? null;
  const d = (name: string) => dither.uniforms[name] ?? null;

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

  const field = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, field);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const framebuffer = gl.createFramebuffer();

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const cache = new Map<string, number[]>();
  const toColor = (value: DitherColor): number[] => {
    if (Array.isArray(value)) {
      return [0, 1, 2].map((i) => clamp(Number(value[i]) || 0, 0, 1));
    }
    const key = String(value);
    const cached = cache.get(key);
    if (cached) return cached;
    let rgb = [0, 0, 0];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = key;
      probe.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
      rgb = [r, g, b].map((channel) => toLinear(channel / 255));
    }
    cache.set(key, rgb);
    return rgb;
  };

  const view = {
    width: 1,
    height: 1,
    ratio: 1,
    cell: 1,
    cellCss: 1,
    cols: 1,
    rows: 1,
  };
  const pointer = { x: 0, y: 0, inside: false, set: false };
  const trailPoints: DitherTrailPoint[] = [];
  const ripples: DitherRipple[] = [];
  const trailData = new Float32Array(MAX_TRAIL * 3);
  const rippleData = new Float32Array(MAX_RIPPLES * 4);
  const paletteData = new Float32Array(MAX_PALETTE * 3);
  const state = {
    time: 0,
    hx: 0,
    hy: 0,
    presence: 0,
    reveal: getSettings().intro && !reduce ? 0 : 1,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let disposed = false;
  let lastDpr = getSettings().dpr;

  const allocate = () => {
    const s = getSettings();
    view.cell = Math.max(1, Math.round(s.pixelSize * view.ratio));
    view.cellCss = view.cell / view.ratio;
    view.cols = Math.max(1, Math.ceil(canvas.width / view.cell));
    view.rows = Math.max(1, Math.ceil(canvas.height / view.cell));
    gl.bindTexture(gl.TEXTURE_2D, field);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      view.cols,
      view.rows,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      field,
      0,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const toUv = (x: number, y: number): [number, number] => {
    const aspect = view.width / view.height;
    return [(x / view.width - 0.5) * aspect, -(y / view.height - 0.5)];
  };

  const render = () => {
    const s = getSettings();
    const expected = Math.max(1, Math.round(s.pixelSize * view.ratio));
    if (expected !== view.cell) allocate();

    let trailCount = 0;
    for (let i = 0; i < trailPoints.length && trailCount < MAX_TRAIL; i++) {
      const point = trailPoints[i]!;
      if (point.weight <= 0.01) continue;
      trailData.set([point.x, point.y, point.weight], trailCount * 3);
      trailCount++;
    }
    let rippleCount = 0;
    for (let i = ripples.length - 1; i >= 0 && rippleCount < MAX_RIPPLES; i--) {
      const ripple = ripples[i]!;
      rippleData.set([ripple.x, ripple.y, ripple.age, 1], rippleCount * 4);
      rippleCount++;
    }

    const eased =
      s.intro && !reduce
        ? state.reveal * state.reveal * (3 - 2 * state.reveal)
        : 1;

    gl.bindVertexArray(vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, view.cols, view.rows);
    gl.useProgram(wave.program);
    gl.uniform2f(
      w('uResolution'),
      canvas.width / view.ratio,
      canvas.height / view.ratio,
    );
    gl.uniform1f(w('uCell'), view.cellCss);
    gl.uniform1f(w('uTime'), state.time);
    gl.uniform1f(w('uWaveSpeed'), s.waveSpeed);
    gl.uniform1f(w('uWaveFrequency'), s.waveFrequency);
    gl.uniform1f(w('uWaveAmplitude'), s.waveAmplitude);
    gl.uniform1f(w('uScale'), s.scale);
    gl.uniform1f(w('uContrast'), s.contrast);
    gl.uniform1f(w('uBrightness'), s.brightness);
    gl.uniform1i(w('uEffect'), s.effect);
    gl.uniform1f(w('uRadius'), s.mouseRadius);
    gl.uniform1f(w('uStrength'), s.mouseStrength);
    gl.uniform3fv(w('uTrail'), trailData);
    gl.uniform1i(w('uTrailCount'), trailCount);
    gl.uniform4fv(w('uRipples'), rippleData);
    gl.uniform1i(w('uRippleCount'), rippleCount);
    gl.uniform1f(w('uIntro'), eased);
    gl.uniform1f(
      w('uReach'),
      0.5 * Math.hypot(view.width / view.height, 1) + 0.45,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(dither.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, field);
    gl.uniform1i(d('uField'), 0);
    gl.uniform2i(d('uFieldSize'), view.cols, view.rows);
    gl.uniform1f(d('uCellDevice'), view.cell);
    gl.uniform1i(d('uMode'), s.mode);
    gl.uniform1f(d('uColorNum'), s.colorNum);
    gl.uniform3fv(d('uWave'), toColor(s.waveColor));
    const transparent = s.backgroundColor === 'transparent';
    gl.uniform3fv(
      d('uBackground'),
      transparent ? [0, 0, 0] : toColor(s.backgroundColor),
    );
    gl.uniform1f(d('uTransparent'), transparent ? 1 : 0);
    s.palette.forEach((value, index) =>
      paletteData.set(toColor(value), index * 3),
    );
    gl.uniform3fv(d('uPalette'), paletteData);
    gl.uniform1i(d('uPaletteCount'), s.palette.length);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    if (!s.disableAnimation && !reduce) state.time += dt;

    const engaged = s.enableMouseInteraction && pointer.inside && !reduce;
    state.presence +=
      ((engaged ? 1 : 0) - state.presence) *
      (1 - Math.exp(-dt / (engaged ? 0.12 : 0.35)));
    if (pointer.set) {
      const [tx, ty] = toUv(pointer.x, pointer.y);
      const follow = 1 - Math.exp(-dt / 0.06);
      const moved = Math.hypot(tx - state.hx, ty - state.hy);
      state.hx += (tx - state.hx) * follow;
      state.hy += (ty - state.hy) * follow;
      const decay = Math.exp(-dt / (0.08 + s.trail * 0.7));
      trailPoints.forEach((point) => {
        point.weight *= decay;
      });
      const head = trailPoints[0];
      if (
        !head ||
        Math.hypot(head.x - state.hx, head.y - state.hy) > 0.012 ||
        moved > 0.012
      ) {
        trailPoints.unshift({
          x: state.hx,
          y: state.hy,
          weight: state.presence,
        });
      } else {
        head.x = state.hx;
        head.y = state.hy;
        head.weight = state.presence;
      }
      if (s.trail <= 0.001) {
        trailPoints.length = Math.min(trailPoints.length, 1);
      }
      while (
        trailPoints.length > MAX_TRAIL ||
        (trailPoints.length > 1 &&
          trailPoints[trailPoints.length - 1]!.weight < 0.01)
      ) {
        trailPoints.pop();
      }
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i]!;
      ripple.age += dt;
      if (ripple.age >= RIPPLE_SECONDS) ripples.splice(i, 1);
    }

    if (!s.intro || reduce) state.reveal = 1;
    else if (state.reveal < 1) {
      state.reveal = Math.min(1, state.reveal + dt / INTRO_SECONDS);
    }

    render();
    const busy =
      !s.disableAnimation ||
      state.reveal < 1 ||
      ripples.length > 0 ||
      state.presence > 0.002 ||
      trailPoints.some((point) => point.weight > 0.01);
    if (busy && !reduce) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!disposed && !raf && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  };

  const resize = () => {
    if (disposed) return;
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    view.width = width;
    view.height = height;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    view.ratio = canvas.width / width;
    allocate();
    render();
    wake();
  };

  const locate = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.inside =
      pointer.x >= 0 &&
      pointer.y >= 0 &&
      pointer.x <= rect.width &&
      pointer.y <= rect.height;
    if (pointer.inside && !pointer.set) {
      const [x, y] = toUv(pointer.x, pointer.y);
      state.hx = x;
      state.hy = y;
      pointer.set = true;
    }
  };

  resize();

  return {
    pointerMove(event) {
      locate(event);
      wake();
    },
    pointerDown(event) {
      const s = getSettings();
      locate(event);
      if (!pointer.inside || !s.clickRipple || reduce) return;
      const [x, y] = toUv(pointer.x, pointer.y);
      ripples.push({ x, y, age: 0 });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
      wake();
    },
    pointerUp(event) {
      if (event.pointerType !== 'mouse') pointer.inside = false;
    },
    leave() {
      pointer.inside = false;
    },
    setVisible(next) {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    pageVisibilityChanged() {
      last = 0;
      wake();
    },
    resize,
    refresh() {
      if (disposed) return;
      const dpr = getSettings().dpr;
      if (dpr !== lastDpr) {
        lastDpr = dpr;
        resize();
        return;
      }
      if (!raf) render();
      wake();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      gl.deleteProgram(wave.program);
      gl.deleteProgram(dither.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteTexture(field);
      gl.deleteFramebuffer(framebuffer);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
