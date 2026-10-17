import {
  BLOOM_LEVELS,
  COARSE,
  COARSE_RATIO,
  COMPOSITE,
  DOWN,
  FINE,
  INTRO_SECONDS,
  MAX_LIGHT_PIXELS,
  QUAD_VERTEX,
  UP,
} from './plasma-wave-shaders';
import type {
  PlasmaWaveEngine,
  PlasmaWaveProps,
  PlasmaWaveSettings,
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

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function normalizePlasmaWave(
  p: PlasmaWaveProps,
  reduce: boolean,
): PlasmaWaveSettings {
  return {
    color1: String(p.colors?.[0] ?? '#A855F7'),
    color2: String(p.colors?.[1] ?? p.colors?.[0] ?? '#06B6D4'),
    speed: p.speed ?? 1,
    speed1: p.speed1 ?? 0.05,
    speed2: p.speed2 ?? 0.05,
    dir2: p.dir2 ?? 1,
    bend1: p.bend1 ?? 1,
    bend2: p.bend2 ?? 0.5,
    thickness: Math.max(0.02, p.thickness ?? 0.3),
    focalLength: Math.max(0.05, p.focalLength ?? 1.25),
    rotation: ((p.rotationDeg ?? 0) * Math.PI) / 180,
    xOffset: p.xOffset ?? 0,
    yOffset: p.yOffset ?? 0,
    brightness: Math.max(0, p.brightness ?? 1),
    glow: Math.max(0, p.glow ?? 1),
    core: clamp(p.core ?? 0.6, 0, 1),
    grain: Math.max(0, p.grain ?? 0.03),
    quality: clamp(p.quality ?? 1, 0.25, 1),
    mouseInteraction: p.mouseInteraction ?? true,
    intro: p.intro ?? true,
    fade: clamp(p.fade ?? 0, 0, 1),
    opacity: clamp(p.opacity ?? 1, 0, 1),
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
  const vertex = compile(gl, gl.VERTEX_SHADER, QUAD_VERTEX);
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
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

/**
 * Raw WebGL2 PlasmaWave: two raymarched ribbons are traced at a coarse
 * resolution, refined only along their edges, bloomed through a dual-filter
 * chain and tone-mapped. Returns null when WebGL2 is unavailable.
 */
export function createPlasmaWave(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => PlasmaWaveSettings,
): PlasmaWaveEngine | null {
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
  const range = floatTargets ? 1 : 0.25;
  const coarseProgram = link(gl, COARSE);
  const fineProgram = link(gl, FINE);
  const downProgram = link(gl, DOWN);
  const upProgram = link(gl, UP);
  const compositeProgram = link(gl, COMPOSITE);
  const programs = [
    coarseProgram,
    fineProgram,
    downProgram,
    upProgram,
    compositeProgram,
  ];
  if (
    !coarseProgram ||
    !fineProgram ||
    !downProgram ||
    !upProgram ||
    !compositeProgram
  ) {
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

  const createTarget = (): Target => ({
    texture: gl.createTexture(),
    framebuffer: gl.createFramebuffer(),
    width: 0,
    height: 0,
  });
  const sizeTarget = (target: Target, width: number, height: number) => {
    if (target.width === width && target.height === height) return;
    target.width = width;
    target.height = height;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    if (floatTargets) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA16F,
        width,
        height,
        0,
        gl.RGBA,
        gl.HALF_FLOAT,
        null,
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    }
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
  const coarse = createTarget();
  const fine = createTarget();
  const down = Array.from({ length: BLOOM_LEVELS + 1 }, createTarget);
  const up = Array.from({ length: BLOOM_LEVELS }, createTarget);

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, Rgb>();
  const toLinear = (value: string): Rgb => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb: Rgb = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [
        Math.pow((data[0] ?? 255) / 255, 2.2),
        Math.pow((data[1] ?? 255) / 255, 2.2),
        Math.pow((data[2] ?? 255) / 255, 2.2),
      ];
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const initial = getSettings();
  const view = {
    width: 1,
    height: 1,
    fineWidth: 1,
    fineHeight: 1,
    coarseWidth: 1,
    coarseHeight: 1,
  };
  const pointer = { x: 0, y: 0, inside: false };
  const state = {
    time: 0,
    intro: initial.intro && !initial.reduce ? 0 : 1,
    heat: 0,
    heatVelocity: 0,
    heatX: 0,
    lensX: 0,
    lensY: 0,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let lastQuality = initial.quality;
  let lastDpr = initial.dpr;

  const run = (
    entry: LinkedProgram,
    target: Target | null,
    width: number,
    height: number,
  ) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(entry.program);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const bindTexture = (
    entry: LinkedProgram,
    name: string,
    unit: number,
    texture: WebGLTexture | null,
  ) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(entry.uniforms[name] ?? null, unit);
  };

  const setScene = (
    entry: LinkedProgram,
    s: PlasmaWaveSettings,
    presence: number,
  ) => {
    const u = entry.uniforms;
    gl.useProgram(entry.program);
    gl.uniform2f(u.uView ?? null, view.width, view.height);
    gl.uniform2f(u.uOffset ?? null, s.xOffset, s.yOffset);
    gl.uniform1f(u.uRotation ?? null, s.rotation);
    gl.uniform1f(u.uFocalLength ?? null, s.focalLength);
    gl.uniform1f(u.uTime ?? null, state.time);
    gl.uniform1f(u.uSpeed1 ?? null, s.speed1);
    gl.uniform1f(u.uSpeed2 ?? null, s.speed2);
    gl.uniform1f(u.uDir2 ?? null, s.dir2);
    gl.uniform1f(u.uBend1 ?? null, s.bend1 * (0.3 + 0.7 * presence));
    gl.uniform1f(u.uBend2 ?? null, s.bend2 * (0.3 + 0.7 * presence));
    gl.uniform1f(u.uThickness ?? null, s.thickness);
    gl.uniform3f(u.uHeat ?? null, state.heatX, state.heat, 1.4);
    gl.uniform3fv(u.uColor1 ?? null, toLinear(s.color1));
    gl.uniform3fv(u.uColor2 ?? null, toLinear(s.color2));
    gl.uniform1f(u.uCore ?? null, s.core);
    gl.uniform1f(u.uRange ?? null, range);
  };

  const render = () => {
    const s = getSettings();
    const presence = state.intro * state.intro * (3 - 2 * state.intro);
    gl.bindVertexArray(vao);
    sizeTarget(coarse, view.coarseWidth, view.coarseHeight);
    sizeTarget(fine, view.fineWidth, view.fineHeight);

    setScene(coarseProgram, s, presence);
    gl.uniform2f(
      coarseProgram.uniforms.uScale ?? null,
      view.width / view.coarseWidth,
      view.height / view.coarseHeight,
    );
    run(coarseProgram, coarse, view.coarseWidth, view.coarseHeight);

    const f = fineProgram.uniforms;
    setScene(fineProgram, s, presence);
    gl.uniform2f(
      f.uScale ?? null,
      view.width / view.fineWidth,
      view.height / view.fineHeight,
    );
    gl.uniform2f(f.uCoarseSize ?? null, view.coarseWidth, view.coarseHeight);
    gl.uniform2f(f.uFineSize ?? null, view.fineWidth, view.fineHeight);
    bindTexture(fineProgram, 'uCoarse', 0, coarse.texture);
    run(fineProgram, fine, view.fineWidth, view.fineHeight);

    let source = fine;
    down.forEach((target, level) => {
      const width =
        level === 0 ? Math.round(view.width / 2) : source.width >> 1;
      const height =
        level === 0 ? Math.round(view.height / 2) : source.height >> 1;
      sizeTarget(target, Math.max(1, width), Math.max(1, height));
      gl.useProgram(downProgram.program);
      gl.uniform2f(
        downProgram.uniforms.uTexel ?? null,
        1 / source.width,
        1 / source.height,
      );
      gl.uniform2f(
        downProgram.uniforms.uTarget ?? null,
        target.width,
        target.height,
      );
      bindTexture(downProgram, 'uSource', 0, source.texture);
      run(downProgram, target, target.width, target.height);
      source = target;
    });
    for (let level = BLOOM_LEVELS - 1; level >= 1; level--) {
      const from =
        level === BLOOM_LEVELS - 1 ? down[BLOOM_LEVELS] : up[level + 1];
      const target = up[level];
      const base = down[level];
      if (!from || !target || !base) continue;
      sizeTarget(target, base.width, base.height);
      gl.useProgram(upProgram.program);
      gl.uniform2f(
        upProgram.uniforms.uTexel ?? null,
        1 / from.width,
        1 / from.height,
      );
      gl.uniform2f(
        upProgram.uniforms.uTarget ?? null,
        target.width,
        target.height,
      );
      bindTexture(upProgram, 'uSource', 0, from.texture);
      bindTexture(upProgram, 'uBase', 1, base.texture);
      run(upProgram, target, target.width, target.height);
    }

    const c = compositeProgram.uniforms;
    gl.useProgram(compositeProgram.program);
    gl.uniform2f(c.uResolution ?? null, canvas.width, canvas.height);
    gl.uniform1f(c.uExposure ?? null, (2.4 * s.brightness) / range);
    gl.uniform1f(c.uGlow ?? null, s.glow);
    gl.uniform1f(c.uCore ?? null, s.core);
    gl.uniform1f(c.uPresence ?? null, presence * presence);
    gl.uniform1f(c.uGrain ?? null, s.grain);
    gl.uniform1f(c.uFade ?? null, s.fade);
    gl.uniform1f(c.uOpacity ?? null, s.opacity);
    gl.uniform1f(c.uTime ?? null, state.time);
    gl.uniform1f(c.uLightMode ?? null, s.lightMode ? 1 : 0);
    gl.uniform3f(
      c.uLens ?? null,
      (state.lensX * canvas.width) / view.width,
      ((view.height - state.lensY) * canvas.height) / view.height,
      state.heat,
    );
    bindTexture(compositeProgram, 'uLight', 0, fine.texture);
    bindTexture(compositeProgram, 'uBloom', 1, up[1]?.texture ?? null);
    run(compositeProgram, null, canvas.width, canvas.height);
  };

  const heatTarget = (s: PlasmaWaveSettings): number | null => {
    if (!(s.mouseInteraction && pointer.inside) || s.reduce) return null;
    const x = pointer.x + s.xOffset - view.width / 2;
    const y = view.height - pointer.y + s.yOffset - view.height / 2;
    const c = Math.cos(s.rotation);
    const sn = Math.sin(s.rotation);
    return (7 * (c * x + sn * y)) / view.height / s.focalLength - 15;
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !s.reduce;
    if (moving) state.time += dt * s.speed;
    if (!s.intro || s.reduce) state.intro = 1;
    else if (state.intro < 1)
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    const target = heatTarget(s);
    if (target !== null)
      state.heatX += (target - state.heatX) * (1 - Math.exp(-dt * 6));
    state.heatVelocity +=
      (120 * ((target === null ? 0 : 1) - state.heat) -
        19 * state.heatVelocity) *
      dt;
    state.heat = clamp(state.heat + state.heatVelocity * dt, 0, 1.15);
    state.lensX += (pointer.x - state.lensX) * (1 - Math.exp(-dt * 8));
    state.lensY += (pointer.y - state.lensY) * (1 - Math.exp(-dt * 8));
    render();
    const settling =
      state.intro < 1 ||
      state.heat > 0.001 ||
      Math.abs(state.heatVelocity) > 0.001;
    if (moving || settling) raf = requestAnimationFrame(frame);
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
    view.width = width;
    view.height = height;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    let scale = s.quality;
    if (width * height * scale * scale > MAX_LIGHT_PIXELS)
      scale = Math.sqrt(MAX_LIGHT_PIXELS / (width * height));
    view.fineWidth = Math.max(1, Math.round(width * scale));
    view.fineHeight = Math.max(1, Math.round(height * scale));
    view.coarseWidth = Math.max(1, Math.round(view.fineWidth / COARSE_RATIO));
    view.coarseHeight = Math.max(1, Math.round(view.fineHeight / COARSE_RATIO));
    if (!raf) render();
    wakeLoop();
  };

  return {
    resize,
    wake() {
      const s = getSettings();
      if (s.quality !== lastQuality || s.dpr !== lastDpr) {
        lastQuality = s.quality;
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
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside =
        pointer.x >= 0 &&
        pointer.y >= 0 &&
        pointer.x <= rect.width &&
        pointer.y <= rect.height;
      wakeLoop();
    },
    pointerLeave() {
      pointer.inside = false;
      wakeLoop();
    },
    visibilityChange() {
      last = 0;
      wakeLoop();
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      for (const target of [coarse, fine, ...down, ...up]) {
        gl.deleteTexture(target.texture);
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
