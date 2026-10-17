import {
  GRADIENT_BLINDS_FRAGMENT,
  GRADIENT_BLINDS_INTRO_SECONDS,
  GRADIENT_BLINDS_MAX_COLORS,
  GRADIENT_BLINDS_MAX_WAVES,
  GRADIENT_BLINDS_RIPPLE_SECONDS,
  GRADIENT_BLINDS_VERTEX,
} from './gradient-blinds-shaders';
import type {
  GradientBlindsEngine,
  GradientBlindsEngineOptions,
  GradientBlindsProgram,
  GradientBlindsSettings,
} from './types';

export const GRADIENT_BLINDS_DEFAULT_COLORS = ['#FF9FFC', '#5227FF'];

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

function link(gl: WebGL2RenderingContext): GradientBlindsProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, GRADIENT_BLINDS_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, GRADIENT_BLINDS_FRAGMENT);
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
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
}

function hexToRgb(hex: string): [number, number, number] {
  const c = String(hex || '')
    .replace('#', '')
    .padEnd(6, '0');
  const r = Number.parseInt(c.slice(0, 2), 16) / 255;
  const g = Number.parseInt(c.slice(2, 4), 16) / 255;
  const b = Number.parseInt(c.slice(4, 6), 16) / 255;
  return [r || 0, g || 0, b || 0];
}

function prepStops(stops: string[]): { flat: Float32Array; count: number } {
  const base = (stops.length ? stops : GRADIENT_BLINDS_DEFAULT_COLORS).slice(
    0,
    GRADIENT_BLINDS_MAX_COLORS,
  );
  if (base.length === 1) base.push(base[0] ?? '#ffffff');
  while (base.length < GRADIENT_BLINDS_MAX_COLORS) {
    base.push(base[base.length - 1] ?? '#ffffff');
  }
  const flat = new Float32Array(GRADIENT_BLINDS_MAX_COLORS * 3);
  for (let i = 0; i < GRADIENT_BLINDS_MAX_COLORS; i++) {
    flat.set(hexToRgb(base[i] ?? '#ffffff'), i * 3);
  }
  const count = Math.max(
    2,
    Math.min(GRADIENT_BLINDS_MAX_COLORS, stops.length || 2),
  );
  return { flat, count };
}

export function createGradientBlindsEngine(
  options: GradientBlindsEngineOptions,
): GradientBlindsEngine | null {
  const { container, canvas, getSettings, reduce, onRestored } = options;
  const context = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
  });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;
  const linked = link(gl);
  if (!linked) return null;
  const shader: GradientBlindsProgram = linked;
  const u = shader.uniforms;
  const vao = gl.createVertexArray();

  function onContextLost(event: Event) {
    event.preventDefault();
  }
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  const view = { width: 1, height: 1, ratio: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const light = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, ready: false };
  const waves = new Float32Array(GRADIENT_BLINDS_MAX_WAVES * 4);
  let waveIndex = 0;
  let hover = 0;
  let time = 0;
  let swayTime = 0;
  let shift = 0;
  let grainTime = 0;
  let introClock = getSettings().intro && !reduce ? 0 : 1;
  let colorKeyCache = '';
  let colorStops = prepStops(getSettings().gradientColors);
  let raf = 0;
  let last = 0;
  let visible = true;
  let disposed = false;

  function blindTotal(s: GradientBlindsSettings): number {
    if (s.blindMinWidth && s.blindMinWidth > 0) {
      const byWidth = Math.max(1, Math.floor(view.width / s.blindMinWidth));
      return Math.max(
        1,
        s.blindCount ? Math.min(s.blindCount, byWidth) : byWidth,
      );
    }
    return Math.max(1, s.blindCount);
  }

  function draw() {
    const s = getSettings();
    if (colorKeyCache !== s.colorKey) {
      colorStops = prepStops(s.gradientColors);
      colorKeyCache = s.colorKey;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(shader.program);
    gl.bindVertexArray(vao);
    gl.uniform2f(u.uResolution ?? null, canvas.width, canvas.height);
    gl.uniform1f(u.uTime ?? null, time);
    gl.uniform2f(
      u.uMouse ?? null,
      light.x * view.ratio,
      (view.height - light.y) * view.ratio,
    );
    gl.uniform1f(u.uAngle ?? null, (s.angle * Math.PI) / 180);
    gl.uniform1f(u.uNoise ?? null, s.noise);
    gl.uniform1f(u.uBlindCount ?? null, blindTotal(s));
    gl.uniform1f(u.uSpotlightRadius ?? null, s.spotlightRadius);
    gl.uniform1f(u.uSpotlightSoftness ?? null, s.spotlightSoftness);
    gl.uniform1f(u.uSpotlightOpacity ?? null, s.spotlightOpacity);
    gl.uniform1f(u.uMirror ?? null, s.mirrorGradient ? 1 : 0);
    gl.uniform1f(u.uDistort ?? null, s.distortAmount);
    gl.uniform1f(u.uShineFlip ?? null, s.shineDirection === 'right' ? 1 : 0);
    gl.uniform3fv(u.uColors ?? null, colorStops.flat);
    gl.uniform1i(u.uColorCount ?? null, colorStops.count);
    gl.uniform1f(u.uLightMode ?? null, s.lightMode ? 1 : 0);
    gl.uniform1f(u.uShine ?? null, s.shine);
    gl.uniform1f(u.uRelief ?? null, s.relief);
    gl.uniform1f(u.uGlow ?? null, s.glow);
    gl.uniform1f(u.uSway ?? null, reduce ? 0 : s.sway);
    gl.uniform1f(u.uSwayTime ?? null, swayTime);
    gl.uniform1f(u.uHover ?? null, hover * s.hoverTilt);
    gl.uniform4fv(u.uWaves ?? null, waves);
    gl.uniform1f(u.uIntro ?? null, introClock);
    gl.uniform1f(u.uGrainTime ?? null, grainTime);
    gl.uniform3fv(u.uLightColor ?? null, hexToRgb(s.lightColor || '#ffffff'));
    gl.uniform1f(u.uPerspective ?? null, s.perspective);
    gl.uniform1f(u.uGradientShift ?? null, shift);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  function aim(s: GradientBlindsSettings) {
    if (pointer.inside) {
      light.tx = pointer.x;
      light.ty = pointer.y;
    } else if (s.idle === 'center') {
      light.tx = view.width / 2;
      light.ty = view.height / 2;
    } else if (s.idle === 'drift' && !reduce) {
      light.tx =
        view.width *
        (0.5 +
          0.22 * Math.sin(swayTime * 0.23) +
          0.05 * Math.sin(swayTime * 0.61 + 1.3));
      light.ty =
        view.height *
        (0.5 +
          0.16 * Math.sin(swayTime * 0.31 + 0.7) +
          0.04 * Math.sin(swayTime * 0.83));
    }
  }

  // Critically damped spring: the light settles on the target without
  // overshoot, in roughly `mouseDampening` seconds.
  function follow(s: GradientBlindsSettings, dt: number) {
    const tau = s.mouseDampening;
    if (tau <= 0) {
      light.x = light.tx;
      light.y = light.ty;
      light.vx = 0;
      light.vy = 0;
      return;
    }
    const omega = 2.4 / tau;
    const k = omega * omega;
    const c = 2 * omega;
    const steps = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      light.vx += (k * (light.tx - light.x) - c * light.vx) * h;
      light.vy += (k * (light.ty - light.y) - c * light.vy) * h;
      light.x += light.vx * h;
      light.y += light.vy * h;
    }
  }

  function wavesActive(): boolean {
    for (let i = 0; i < GRADIENT_BLINDS_MAX_WAVES; i++) {
      if ((waves[i * 4 + 3] ?? 0) > 0) return true;
    }
    return false;
  }

  function frame(now: number) {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? clamp((now - last) / 1000, 0.001, 1 / 20) : 1 / 60;
    last = now;
    if (s.paused) return;
    time += dt;
    if (!reduce) {
      swayTime += dt * s.speed;
      shift = (shift + dt * s.gradientSpeed * 0.06) % 2;
    }
    grainTime = Math.floor(time * 24) * 17.13;
    if (introClock < 1) {
      introClock = Math.min(1, introClock + dt / GRADIENT_BLINDS_INTRO_SECONDS);
    }
    hover += ((pointer.inside ? 1 : 0) - hover) * (1 - Math.exp(-dt / 0.35));
    aim(s);
    follow(s, dt);
    for (let i = 0; i < GRADIENT_BLINDS_MAX_WAVES; i++) {
      if (
        (waves[i * 4 + 3] ?? 0) > 0 &&
        time - (waves[i * 4 + 2] ?? 0) > GRADIENT_BLINDS_RIPPLE_SECONDS
      ) {
        waves[i * 4 + 3] = 0;
      }
    }
    draw();
    const settling =
      Math.abs(light.tx - light.x) > 0.05 ||
      Math.abs(light.ty - light.y) > 0.05 ||
      Math.abs(light.vx) + Math.abs(light.vy) > 0.05 ||
      Math.abs((pointer.inside ? 1 : 0) - hover) > 0.002;
    const active =
      settling ||
      introClock < 1 ||
      wavesActive() ||
      (!reduce &&
        (s.noise > 0 ||
          s.gradientSpeed !== 0 ||
          (s.sway > 0 && s.speed > 0) ||
          (s.idle === 'drift' && !pointer.inside)));
    if (active) raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (!raf && !disposed && visible && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function resize() {
    if (disposed) return;
    const s = getSettings();
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    if (!light.ready) {
      light.ready = true;
      light.x = light.tx = view.width / 2;
      light.y = light.ty = view.height / 2;
    }
    draw();
    wake();
  }

  function locate(clientX: number, clientY: number) {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
      x,
      y,
      inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
    };
  }

  resize();

  return {
    refresh: wake,
    resize,
    pointerMove(clientX, clientY) {
      const { x, y, inside } = locate(clientX, clientY);
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
      if (inside) wake();
    },
    pointerDown(clientX, clientY) {
      const s = getSettings();
      const { x, y, inside } = locate(clientX, clientY);
      if (!inside || reduce || s.clickEffect !== 'ripple') return;
      const o = waveIndex * 4;
      waves[o] = x * view.ratio;
      waves[o + 1] = (view.height - y) * view.ratio;
      waves[o + 2] = time;
      waves[o + 3] = 1;
      waveIndex = (waveIndex + 1) % GRADIENT_BLINDS_MAX_WAVES;
      wake();
    },
    pointerLeave() {
      pointer.inside = false;
      wake();
    },
    setVisible(next) {
      visible = next;
      if (visible) wake();
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
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
      if (loseContext) gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
