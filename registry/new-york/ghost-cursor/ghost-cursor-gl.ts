import {
  GHOST_BLUR,
  GHOST_COMPOSITE,
  GHOST_DOWN,
  GHOST_SHADE,
  GHOST_SIM,
  GHOST_VERTEX,
} from './ghost-cursor-shaders';
import type {
  GhostCursorEngine,
  GhostCursorEngineOptions,
  GhostCursorProgram,
  GhostCursorTarget,
} from './types';

const INTRO_MS = 1900;
const FALLBACK_COLOR: [number, number, number] = [0.706, 0.592, 0.812];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseGhostColor(value: string): [number, number, number] {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex?.[1]) {
    const digits = hex[1];
    const full =
      digits.length === 3
        ? digits.replace(/./g, (digit) => digit + digit)
        : digits;
    return [
      Number.parseInt(full.slice(0, 2), 16) / 255,
      Number.parseInt(full.slice(2, 4), 16) / 255,
      Number.parseInt(full.slice(4, 6), 16) / 255,
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb?.[1] && rgb[2] && rgb[3]) {
    return [
      clamp(Number.parseFloat(rgb[1]) / 255, 0, 1),
      clamp(Number.parseFloat(rgb[2]) / 255, 0, 1),
      clamp(Number.parseFloat(rgb[3]) / 255, 0, 1),
    ];
  }
  return FALLBACK_COLOR;
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
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
): GhostCursorProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, GHOST_VERTEX);
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
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

/**
 * Smoke simulation + shading + 3-level bloom + composite, all on raw WebGL2.
 * Returns null when WebGL2 or float render targets are unavailable.
 */
export function createGhostCursorEngine(
  options: GhostCursorEngineOptions,
): GhostCursorEngine | null {
  const { container, canvas, getSettings } = options;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'default',
  });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;

  const simProgram = link(gl, GHOST_SIM);
  const shadeProgram = link(gl, GHOST_SHADE);
  const downProgram = link(gl, GHOST_DOWN);
  const blurProgram = link(gl, GHOST_BLUR);
  const compositeProgram = link(gl, GHOST_COMPOSITE);
  const linked = [
    simProgram,
    shadeProgram,
    downProgram,
    blurProgram,
    compositeProgram,
  ];
  if (
    !simProgram ||
    !shadeProgram ||
    !downProgram ||
    !blurProgram ||
    !compositeProgram
  ) {
    for (const item of linked) if (item) gl.deleteProgram(item.program);
    return null;
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  const createTarget = (): GhostCursorTarget => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer();
    return { texture, framebuffer, width: 0, height: 0 };
  };

  const allocate = (
    target: GhostCursorTarget,
    width: number,
    height: number,
  ) => {
    if (target.width === width && target.height === height) return;
    target.width = width;
    target.height = height;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      target.texture,
      0,
    );
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const simA = createTarget();
  const simB = createTarget();
  const sims: [GhostCursorTarget, GhostCursorTarget] = [simA, simB];
  const shade = createTarget();
  const downs = [createTarget(), createTarget(), createTarget()];
  const blurs = [createTarget(), createTarget(), createTarget()];

  type Uniform = (name: string) => WebGLUniformLocation | null;
  const pass = (
    target: GhostCursorTarget | null,
    program: GhostCursorProgram,
  ): Uniform => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(
      0,
      0,
      target ? target.width : canvas.width,
      target ? target.height : canvas.height,
    );
    gl.useProgram(program.program);
    return (name) => program.uniforms[name] ?? null;
  };

  const bind = (unit: number, texture: WebGLTexture) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  };

  const view = { width: 1, height: 1, ratio: 1, sim: 0.25, shade: 1 };
  const ghost = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0, ready: false };
  const pointer = { x: 0, y: 0, inside: false, moved: -1e9 };
  const flow = { y: 0 };
  const puffs: { x: number; y: number }[] = [];
  let presence = 0;
  let current = 0;
  let raf = 0;
  let last = 0;
  let clock = 0;
  let visible = true;
  let pageVisible = options.pageVisible;
  let lost = false;
  let dirty = true;
  let introLive = options.intro;
  let introStart = -1;

  const simSource = () => (current === 0 ? simA : simB);
  const simDest = () => (current === 0 ? simB : simA);

  const resize = () => {
    const s = getSettings();
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const ratio = Math.min(window.devicePixelRatio || 1, s.maxRatio);
    view.width = width;
    view.height = height;
    view.ratio = ratio;
    const cw = Math.max(1, Math.round(width * ratio));
    const ch = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    view.shade = Math.min(1, Math.sqrt(s.budget / (width * height)));
    const sw = Math.max(8, Math.round(width * view.shade));
    const sh = Math.max(8, Math.round(height * view.shade));
    allocate(shade, sw, sh);
    let w = Math.max(4, Math.round(sw / 2));
    let h = Math.max(4, Math.round(sh / 2));
    downs.forEach((down, i) => {
      allocate(down, w, h);
      const blur = blurs[i];
      if (blur) allocate(blur, w, h);
      w = Math.max(2, Math.round(w / 2));
      h = Math.max(2, Math.round(h / 2));
    });
    view.sim = Math.min(0.35, 220 / Math.max(width, height));
    const simW = Math.max(16, Math.round(width * view.sim));
    const simH = Math.max(16, Math.round(height * view.sim));
    allocate(simA, simW, simH);
    allocate(simB, simW, simH);
    dirty = true;
  };

  const simulate = (dt: number, active: boolean) => {
    const s = getSettings();
    const src = simSource();
    const dst = simDest();
    const scale = view.sim;
    const sigma = s.size * scale * 0.3;
    const decay = Math.exp(-dt / (0.12 + s.trail * 0.022));
    const u = pass(dst, simProgram);
    bind(0, src.texture);
    gl.uniform1i(u('uState'), 0);
    gl.uniform2f(u('uSize'), dst.width, dst.height);
    gl.uniform1f(u('uDt'), dt);
    gl.uniform1f(u('uTime'), clock);
    gl.uniform1f(u('uDecay'), decay);
    gl.uniform1f(u('uDrag'), Math.exp(-dt * 2.4));
    gl.uniform2f(u('uDrift'), 0, s.drift * 110 * scale);
    gl.uniform1f(u('uTurbulence'), s.turbulence * 70 * scale);
    gl.uniform1f(u('uSwirl'), 1 / Math.max(1, s.size * scale * 2.2));
    gl.uniform2f(
      u('uFrom'),
      ghost.px * scale,
      (view.height - ghost.py) * scale,
    );
    gl.uniform2f(u('uTo'), ghost.x * scale, (view.height - ghost.y) * scale);
    gl.uniform1f(u('uRadius'), sigma);
    gl.uniform1f(u('uTrail'), active ? 0.42 * presence : 0);
    gl.uniform1f(u('uIdle'), active ? 0.22 * presence : 0);
    gl.uniform2f(
      u('uVelocity'),
      ghost.vx * scale * 0.5,
      -ghost.vy * scale * 0.5,
    );
    const puff = puffs.shift();
    if (puff) {
      gl.uniform4f(
        u('uPuff'),
        puff.x * scale,
        (view.height - puff.y) * scale,
        sigma * 1.4,
        0.9,
      );
    } else {
      gl.uniform4f(u('uPuff'), 0, 0, 1, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    current = 1 - current;
  };

  const render = () => {
    const s = getSettings();
    const state = simSource();
    let u = pass(shade, shadeProgram);
    bind(0, state.texture);
    gl.uniform1i(u('uState'), 0);
    gl.uniform2f(u('uSimSize'), state.width, state.height);
    gl.uniform2f(u('uView'), view.width, view.height);
    gl.uniform2f(u('uHead'), ghost.x, view.height - ghost.y);
    gl.uniform1f(u('uHeadSize'), s.size * 0.38);
    gl.uniform1f(u('uHeadAmount'), ghost.ready ? 0.8 * presence : 0);
    gl.uniform1f(u('uTime'), clock);
    gl.uniform3fv(u('uColor'), s.color);
    gl.uniform1f(u('uDetail'), s.detail);
    gl.uniform1f(u('uNoiseScale'), 2.4 / Math.max(20, s.size * 2.6));
    gl.uniform2f(u('uFlow'), 0, flow.y);
    gl.uniform1f(u('uBrightness'), s.brightness);
    gl.uniform1f(u('uTheme'), s.theme);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    let source = shade;
    downs.forEach((down, i) => {
      const blur = blurs[i];
      if (!blur) return;
      u = pass(down, downProgram);
      bind(0, source.texture);
      gl.uniform1i(u('uSource'), 0);
      gl.uniform2f(u('uTexel'), 1 / source.width, 1 / source.height);
      gl.uniform1f(u('uThreshold'), i === 0 ? s.threshold : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      u = pass(blur, blurProgram);
      bind(0, down.texture);
      gl.uniform1i(u('uSource'), 0);
      gl.uniform2f(u('uDirection'), 1 / down.width, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      u = pass(down, blurProgram);
      bind(0, blur.texture);
      gl.uniform1i(u('uSource'), 0);
      gl.uniform2f(u('uDirection'), 0, 1 / blur.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      source = down;
    });

    u = pass(null, compositeProgram);
    bind(0, shade.texture);
    downs.forEach((down, i) => bind(i + 1, down.texture));
    gl.uniform1i(u('uShade'), 0);
    gl.uniform1i(u('uBloom0'), 1);
    gl.uniform1i(u('uBloom1'), 2);
    gl.uniform1i(u('uBloom2'), 3);
    gl.uniform2f(u('uShadeSize'), shade.width, shade.height);
    const spread = s.bloomRadius;
    gl.uniform3f(
      u('uWeights'),
      1,
      0.6 + 0.4 * spread,
      0.25 + 0.75 * Math.min(1, spread * spread * 0.5),
    );
    gl.uniform1f(u('uBloom'), s.bloom);
    gl.uniform1f(u('uPresence'), presence);
    gl.uniform1f(u('uGrain'), s.grain);
    gl.uniform1f(u('uEdge'), s.edge);
    gl.uniform1f(u('uTime'), clock);
    gl.uniform1f(u('uTheme'), s.theme);
    gl.uniform3fv(u('uColor'), s.color);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const clearAll = () => {
    for (const target of sims) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const frame = (now: number) => {
    raf = 0;
    if (lost) return;
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    clock += dt;
    const s = getSettings();
    if (dirty) resize();
    dirty = false;

    if (introLive) {
      if (introStart < 0) introStart = now + 280;
      const t = (now - introStart) / INTRO_MS;
      if (t >= 0) {
        const e = t < 1 ? t * t * (3 - 2 * t) : 1;
        const x = view.width * (0.16 + 0.44 * e + 0.05 * Math.sin(e * Math.PI));
        const y =
          view.height * (0.7 - 0.24 * e - 0.1 * Math.sin(e * Math.PI * 2));
        if (!ghost.ready) {
          ghost.x = ghost.px = x;
          ghost.y = ghost.py = y;
          ghost.vx = ghost.vy = 0;
          ghost.ready = true;
        }
        pointer.x = x;
        pointer.y = y;
        pointer.inside = true;
        pointer.moved = now;
        if (t >= 1) introLive = false;
      }
    }

    const idle = now - pointer.moved;
    const target = !ghost.ready
      ? 0
      : idle < s.fadeDelay
        ? 1
        : Math.max(0, 1 - (idle - s.fadeDelay) / s.fadeDuration);
    presence +=
      (target - presence) *
      (1 - Math.exp(-dt / (target > presence ? 0.12 : 0.08)));
    if (Math.abs(target - presence) < 0.002) presence = target;

    ghost.px = ghost.x;
    ghost.py = ghost.y;
    if (ghost.ready) {
      if (pointer.inside) {
        const stiffness = 520 * Math.pow(1 - s.inertia, 2) + 26;
        const damping = 2 * Math.sqrt(stiffness) * 0.92;
        const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          ghost.vx +=
            (stiffness * (pointer.x - ghost.x) - damping * ghost.vx) * h;
          ghost.vy +=
            (stiffness * (pointer.y - ghost.y) - damping * ghost.vy) * h;
          ghost.x += ghost.vx * h;
          ghost.y += ghost.vy * h;
        }
      } else {
        const glide = Math.pow(s.inertia, dt * 60);
        ghost.vx *= glide;
        ghost.vy *= glide;
        ghost.x += ghost.vx * dt;
        ghost.y += ghost.vy * dt;
      }
    }
    flow.y -= s.drift * 110 * dt;

    simulate(dt, presence > 0.01);
    render();

    const busy =
      introLive || target > 0 || presence > 0.001 || puffs.length > 0;
    if (!busy) {
      clearAll();
      return;
    }
    if (visible && pageVisible) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf || lost || !visible || !pageVisible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const locate = (clientX: number, clientY: number) => {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
      x,
      y,
      inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
    };
  };

  const leave = () => {
    const now = performance.now();
    if (pointer.inside && now - pointer.moved < getSettings().fadeDelay)
      pointer.moved = now;
    pointer.inside = false;
    wake();
  };

  const pointerMove = (clientX: number, clientY: number) => {
    const spot = locate(clientX, clientY);
    if (spot.inside) introLive = false;
    if (!spot.inside) {
      if (pointer.inside) leave();
      return;
    }
    if (!pointer.inside && (!ghost.ready || presence < 0.05)) {
      ghost.x = ghost.px = spot.x;
      ghost.y = ghost.py = spot.y;
      ghost.vx = ghost.vy = 0;
      ghost.ready = true;
    }
    pointer.x = spot.x;
    pointer.y = spot.y;
    pointer.inside = true;
    pointer.moved = performance.now();
    wake();
  };

  const pointerDown = (clientX: number, clientY: number) => {
    const spot = locate(clientX, clientY);
    if (!spot.inside) return;
    pointerMove(clientX, clientY);
    if (getSettings().clickPuff) {
      puffs.push({ x: spot.x, y: spot.y });
      wake();
    }
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
  };
  canvas.addEventListener('webglcontextlost', onLost);

  resize();
  if (introLive) wake();

  return {
    wake,
    pointerMove,
    pointerDown,
    leave,
    setVisible(value) {
      visible = value;
      wake();
    },
    setPageVisible(value) {
      pageVisible = value;
      wake();
    },
    markDirty() {
      dirty = true;
      wake();
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('webglcontextlost', onLost);
      if (!gl.isContextLost()) {
        for (const target of [simA, simB, shade, ...downs, ...blurs]) {
          gl.deleteFramebuffer(target.framebuffer);
          gl.deleteTexture(target.texture);
        }
        gl.deleteBuffer(buffer);
        gl.deleteVertexArray(vao);
        for (const item of linked) if (item) gl.deleteProgram(item.program);
      }
    },
  };
}
