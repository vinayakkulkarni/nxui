import {
  BLOOM_LEVELS,
  BLUR,
  COMPOSITE,
  DOWNSAMPLE,
  MAX_COLORS,
  STREAKS,
  VERTEX,
} from './lightfall-shaders';
import type {
  LightfallEngine,
  LightfallProps,
  LightfallSettings,
} from './types';

interface LinkedProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Target {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
}

type Rgb = [number, number, number];

const INTRO_SECONDS = 2.6;
const WARP_SPEED = 9;
const TAU = Math.PI * 2;
const FALLBACK_COLORS = ['#ffffff'];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function normalizeLightfall(
  p: LightfallProps,
  reduce: boolean,
): LightfallSettings {
  const colors =
    Array.isArray(p.colors) && p.colors.length ? p.colors : FALLBACK_COLORS;
  return {
    colors: colors.slice(0, MAX_COLORS).map(String),
    backgroundColor: String(p.backgroundColor ?? '#94a3b8'),
    speed: p.speed ?? 0.3,
    streakCount: Math.round(clamp(p.streakCount ?? 2, 1, 16)),
    streakWidth: Math.max(0.05, p.streakWidth ?? 0.8),
    streakLength: Math.max(0.05, p.streakLength ?? 1),
    glow: Math.max(0, p.glow ?? 1),
    density: p.density ?? 0.6,
    twinkle: clamp(p.twinkle ?? 0.3, 0, 1),
    zoom: Math.max(0.1, p.zoom ?? 3),
    backgroundGlow: Math.max(0, p.backgroundGlow ?? 0.1),
    headGlow: clamp(p.headGlow ?? 0.6, 0, 1),
    depth: Math.max(0, p.depth ?? 0.5),
    bloom: Math.max(0, p.bloom ?? 0.35),
    opacity: clamp(p.opacity ?? 1, 0, 1),
    mouseInteraction: p.mouseInteraction ?? true,
    mouseStrength: Math.max(0, p.mouseStrength ?? 0.4),
    mouseRadius: Math.max(0.01, p.mouseRadius ?? 0.45),
    mouseDampening: Math.max(0, p.mouseDampening ?? 0.15),
    lens: clamp(p.lens ?? 0.5, 0, 1),
    holdToWarp: p.holdToWarp ?? true,
    intro: p.intro ?? true,
    fade: clamp(p.fade ?? 0, 0, 1),
    lightMode: p.lightMode ?? false,
    paused: p.paused ?? false,
    dpr: p.dpr,
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

/**
 * Raw WebGL2 Lightfall: streaks are ray-cast onto a curved superellipsoid
 * tunnel, bloomed through a four-level blur chain and tone-mapped in a
 * composite pass. Returns null when WebGL2 is unavailable.
 */
export function createLightfall(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => LightfallSettings,
): LightfallEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
  const streakProgram = link(gl, STREAKS);
  const downProgram = link(gl, DOWNSAMPLE);
  const blurProgram = link(gl, BLUR);
  const compositeProgram = link(gl, COMPOSITE);
  const programs = [streakProgram, downProgram, blurProgram, compositeProgram];
  if (!streakProgram || !downProgram || !blurProgram || !compositeProgram) {
    for (const entry of programs) if (entry) gl.deleteProgram(entry.program);
    return null;
  }

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

  const format = floatTargets ? gl.RGBA16F : gl.RGBA8;
  const encode = floatTargets ? 1 : 0.25;
  const createTarget = (): Target => ({
    texture: null,
    framebuffer: gl.createFramebuffer(),
    width: 0,
    height: 0,
  });
  const scene = createTarget();
  const levels: [Target, Target][] = Array.from(
    { length: BLOOM_LEVELS },
    () => [createTarget(), createTarget()],
  );

  const allocate = (target: Target, width: number, height: number) => {
    if (target.texture && target.width === width && target.height === height)
      return;
    if (target.texture) gl.deleteTexture(target.texture);
    target.texture = gl.createTexture();
    target.width = width;
    target.height = height;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      target.texture,
      0,
    );
  };

  const pass = (target: Target | null, linked: LinkedProgram) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(
      0,
      0,
      target ? target.width : canvas.width,
      target ? target.height : canvas.height,
    );
    gl.useProgram(linked.program);
    return linked.uniforms;
  };

  const bind = (unit: number, texture: WebGLTexture | null) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  };

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, Rgb>();
  const toRgb = (value: string): Rgb => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb: Rgb = [1, 1, 1];
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
    colorCache.set(value, rgb);
    return rgb;
  };
  const toLinear = (value: string): Rgb => {
    const [r, g, b] = toRgb(value);
    return [r * r, g * g, b * b];
  };

  const initial = getSettings();
  const palette = new Float32Array(MAX_COLORS * 3);
  const pointer = { x: 0, y: 0, inside: false, held: false };
  const state = {
    travel: 0,
    intro: initial.intro && !initial.reduce ? 0 : 1,
    mouseX: 0,
    mouseY: 0,
    lensX: 0,
    lensY: 0,
    touch: 0,
    warp: 0,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let lastDpr = initial.dpr;

  const render = () => {
    const s = getSettings();
    const width = canvas.width;
    const height = canvas.height;
    const cssWidth = Math.max(1, container.clientWidth);
    const cssHeight = Math.max(1, container.clientHeight);
    gl.bindVertexArray(vao);
    allocate(scene, width, height);
    levels.forEach((pair, index) => {
      const levelWidth = Math.max(1, Math.round(cssWidth / 2 ** (index + 1)));
      const levelHeight = Math.max(1, Math.round(cssHeight / 2 ** (index + 1)));
      allocate(pair[0], levelWidth, levelHeight);
      allocate(pair[1], levelWidth, levelHeight);
    });

    const intro = state.intro;
    const presence = Math.min(1, intro * 2.2);
    const stretch = 1 + 5 * Math.pow(1 - intro, 2) + 2.5 * state.warp;
    const rings = Math.max(
      1,
      Math.floor(TAU * Math.max(s.density, 0.05) + 0.5),
    );
    const period = TAU / rings;
    const clock = 9 + state.travel;

    const list = s.colors.map(toLinear);
    palette.fill(0);
    for (let i = 0; i < MAX_COLORS; i++) {
      const entry = list[Math.min(i, list.length - 1)];
      if (entry) palette.set(entry, i * 3);
    }

    const toScreenX = (value: number) => (2 * value - width) / width;
    const toScreenY = (value: number) => (2 * value - height) / width;

    const r = pass(scene, streakProgram);
    gl.uniform2f(r.uView ?? null, width, height);
    gl.uniform1f(r.uZoom ?? null, s.zoom);
    gl.uniform1f(r.uPhase ?? null, clock % (16 * period));
    gl.uniform1f(r.uTwinkleClock ?? null, clock % TAU);
    gl.uniform1f(r.uRings ?? null, rings);
    gl.uniform3fv(r.uColors ?? null, palette);
    gl.uniform1i(r.uColorCount ?? null, list.length);
    gl.uniform1i(r.uStreakCount ?? null, s.streakCount);
    gl.uniform1i(r.uColumns ?? null, s.streakWidth > 1 ? 2 : 1);
    gl.uniform1f(r.uWidth ?? null, 5e-4 * s.streakWidth);
    gl.uniform1f(r.uTail ?? null, 19 / (s.streakLength * stretch));
    gl.uniform1f(r.uTwinkle ?? null, s.twinkle);
    gl.uniform1f(r.uHead ?? null, s.headGlow);
    gl.uniform1f(r.uDepth ?? null, s.depth);
    gl.uniform4f(
      r.uMouse ?? null,
      toScreenX(state.mouseX),
      toScreenY(state.mouseY),
      s.mouseInteraction ? s.mouseStrength * state.touch : 0,
      s.mouseRadius,
    );
    gl.uniform3f(
      r.uLens ?? null,
      toScreenX(state.lensX),
      toScreenY(state.lensY),
      s.mouseInteraction ? 0.5 * s.lens * state.touch : 0,
    );
    gl.uniform1f(r.uLightMode ?? null, s.lightMode ? 1 : 0);
    gl.uniform1f(r.uEncode ?? null, encode);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (s.bloom > 0) {
      let source = scene;
      for (const [front, back] of levels) {
        const d = pass(front, downProgram);
        bind(0, source.texture);
        gl.uniform1i(d.uSource ?? null, 0);
        gl.uniform2f(d.uTarget ?? null, front.width, front.height);
        gl.uniform2f(d.uTexel ?? null, 1 / source.width, 1 / source.height);
        gl.uniform1f(d.uLimit ?? null, 4 * encode);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        let b = pass(back, blurProgram);
        bind(0, front.texture);
        gl.uniform1i(b.uSource ?? null, 0);
        gl.uniform2f(b.uTarget ?? null, back.width, back.height);
        gl.uniform2f(b.uStep ?? null, 1 / front.width, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        b = pass(front, blurProgram);
        bind(0, back.texture);
        gl.uniform1i(b.uSource ?? null, 0);
        gl.uniform2f(b.uTarget ?? null, front.width, front.height);
        gl.uniform2f(b.uStep ?? null, 0, 1 / back.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        source = front;
      }
    }

    const c = pass(null, compositeProgram);
    bind(0, scene.texture);
    gl.uniform1i(c.uScene ?? null, 0);
    levels.forEach(([front], index) => {
      bind(index + 1, front.texture);
      gl.uniform1i(c[`uBloom${index}`] ?? null, index + 1);
    });
    gl.uniform2f(c.uView ?? null, width, height);
    gl.uniform1f(c.uDecode ?? null, 1 / encode);
    gl.uniform1f(c.uGlow ?? null, s.glow);
    gl.uniform1f(c.uBloom ?? null, s.bloom);
    gl.uniform1f(c.uPresence ?? null, presence);
    gl.uniform1f(c.uOpacity ?? null, s.opacity);
    gl.uniform1f(c.uFade ?? null, s.fade);
    gl.uniform1f(c.uLightMode ?? null, s.lightMode ? 1 : 0);
    gl.uniform3fv(c.uTopColor ?? null, toLinear(s.backgroundColor));
    gl.uniform1f(c.uTopGlow ?? null, s.backgroundGlow);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    for (let unit = BLOOM_LEVELS; unit >= 0; unit--) bind(unit, null);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (!s.intro || s.reduce) state.intro = 1;
    else if (state.intro < 1)
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

    const holding = s.holdToWarp && pointer.held && pointer.inside && !s.reduce;
    state.warp +=
      ((holding ? 1 : 0) - state.warp) *
      (1 - Math.exp(-dt * (holding ? 2.2 : 1.6)));
    const rush = WARP_SPEED * Math.pow(1 - state.intro, 2) + 6 * state.warp;
    const running = !s.paused && !s.reduce;
    if (running) state.travel += dt * 0.1 * s.speed * (1 + rush);

    const ratio = canvas.width / Math.max(1, container.clientWidth);
    const targetX = pointer.x * ratio;
    const targetY = (container.clientHeight - pointer.y) * ratio;
    const engaged = s.mouseInteraction && pointer.inside && !s.reduce;
    if (engaged && state.touch < 0.01) {
      state.mouseX = targetX;
      state.mouseY = targetY;
      state.lensX = targetX;
      state.lensY = targetY;
    }
    const follow =
      s.mouseDampening > 0 ? 1 - Math.exp(-dt / s.mouseDampening) : 1;
    state.mouseX += (targetX - state.mouseX) * follow;
    state.mouseY += (targetY - state.mouseY) * follow;
    const lensFollow = 1 - Math.exp(-dt * 6);
    state.lensX += (targetX - state.lensX) * lensFollow;
    state.lensY += (targetY - state.lensY) * lensFollow;
    state.touch +=
      ((engaged ? 1 : 0) - state.touch) *
      (1 - Math.exp(-dt * (engaged ? 4 : 2)));

    render();

    const settling =
      state.intro < 1 ||
      state.warp > 0.001 ||
      Math.abs((engaged ? 1 : 0) - state.touch) > 0.002;
    if ((running && s.speed !== 0) || settling)
      raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wakeLoop = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    if (!raf) render();
    wakeLoop();
  };

  const locate = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return {
      x,
      y,
      inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
    };
  };

  return {
    resize,
    wake() {
      const s = getSettings();
      if (s.dpr !== lastDpr) {
        lastDpr = s.dpr;
        resize();
        return;
      }
      if (!raf) render();
      wakeLoop();
    },
    setVisible(next: boolean) {
      visible = next;
      if (visible) {
        last = 0;
        wakeLoop();
      }
    },
    pointerMove(event: PointerEvent) {
      const point = locate(event);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = point.inside;
      wakeLoop();
    },
    pointerDown(event: PointerEvent) {
      const point = locate(event);
      if (!point.inside) return;
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = true;
      pointer.held = true;
      wakeLoop();
    },
    pointerUp() {
      pointer.held = false;
      wakeLoop();
    },
    pointerLeave() {
      pointer.inside = false;
      pointer.held = false;
      wakeLoop();
    },
    visibilityChange() {
      last = 0;
      wakeLoop();
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      for (const target of [scene, ...levels.flat()]) {
        if (target.texture) gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      for (const entry of programs) if (entry) gl.deleteProgram(entry.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      if (!gl.isContextLost())
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
