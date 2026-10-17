import {
  MAX_CELLS,
  PALETTE_SIZE,
  PIXEL_BUDGET,
  PRESSURE_STEPS,
  buildPalette,
  clamp,
  keepFor,
} from './liquid-ether-config';
import {
  ADVECT,
  DISPLAY,
  DIVERGENCE,
  PRESSURE,
  PROJECT,
  SMOOTH,
  SPLAT,
  VERTEX,
} from './liquid-ether-shaders';
import type {
  LiquidEtherEngine,
  LiquidEtherEngineOptions,
  LiquidEtherProgram,
  LiquidEtherSettings,
  LiquidEtherSplat,
  LiquidEtherTarget,
} from './types';

type Uniforms = LiquidEtherProgram['uniforms'];
type TargetName =
  | 'velocity'
  | 'velocityNext'
  | 'divergence'
  | 'pressure'
  | 'pressureNext';

const NOOP_ENGINE: LiquidEtherEngine = {
  refresh: () => {},
  resize: () => {},
  setVisible: () => {},
  pageVisibilityChanged: () => {},
  pointerMove: () => {},
  pointerDown: () => {},
  pointerUp: () => {},
  leave: () => {},
  dispose: () => {},
};

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
): LiquidEtherProgram | null {
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

export function createLiquidEtherEngine(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  options: LiquidEtherEngineOptions,
): LiquidEtherEngine {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return NOOP_ENGINE;
  if (
    !gl.getExtension('EXT_color_buffer_float') &&
    !gl.getExtension('EXT_color_buffer_half_float')
  ) {
    return NOOP_ENGINE;
  }

  const splatProgram = link(gl, SPLAT);
  const smoothProgram = link(gl, SMOOTH);
  const divergenceProgram = link(gl, DIVERGENCE);
  const pressureProgram = link(gl, PRESSURE);
  const projectProgram = link(gl, PROJECT);
  const advectProgram = link(gl, ADVECT);
  const displayProgram = link(gl, DISPLAY);
  const linked = [
    splatProgram,
    smoothProgram,
    divergenceProgram,
    pressureProgram,
    projectProgram,
    advectProgram,
    displayProgram,
  ];
  if (
    !splatProgram ||
    !smoothProgram ||
    !divergenceProgram ||
    !pressureProgram ||
    !projectProgram ||
    !advectProgram ||
    !displayProgram
  ) {
    for (const entry of linked) if (entry) gl.deleteProgram(entry.program);
    return NOOP_ENGINE;
  }
  const programs = {
    splat: splatProgram,
    smooth: smoothProgram,
    divergence: divergenceProgram,
    pressure: pressureProgram,
    project: projectProgram,
    advect: advectProgram,
    display: displayProgram,
  };

  const { reducedMotion: reduced } = options;
  const vao = gl.createVertexArray();
  const size = { width: 1, height: 1 };
  const grid = { width: 0, height: 0 };
  const targets = new Map<TargetName, LiquidEtherTarget>();
  const pointer = {
    x: 0,
    y: 0,
    fromX: 0,
    fromY: 0,
    dx: 0,
    dy: 0,
    inside: false,
    ready: false,
    moved: false,
    last: 0,
  };
  const auto = {
    phase: Math.random() * 100,
    x: 0,
    y: 0,
    ready: false,
    ramp: 0,
  };
  const opening = {
    active: options.getSettings().intro && !reduced && options.allowIntro,
    time: 0,
  };
  const splats: LiquidEtherSplat[] = [];
  const puffs: LiquidEtherSplat[] = [];
  let energy = 1;
  let lastInput = -Infinity;
  let raf = 0;
  let last = 0;
  let visible = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let lost = false;
  let disposed = false;
  let paletteKey = '';

  const paletteTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  function updatePalette(s: LiquidEtherSettings) {
    if (!gl || s.paletteKey === paletteKey) return;
    paletteKey = s.paletteKey;
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      PALETTE_SIZE,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      buildPalette(s.colors),
    );
  }

  function makeTarget(
    context: WebGL2RenderingContext,
    width: number,
    height: number,
    channels: 1 | 2,
  ): LiquidEtherTarget {
    const texture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      channels === 2 ? context.RG16F : context.R16F,
      width,
      height,
      0,
      channels === 2 ? context.RG : context.RED,
      context.HALF_FLOAT,
      null,
    );
    context.texParameteri(
      context.TEXTURE_2D,
      context.TEXTURE_MIN_FILTER,
      context.LINEAR,
    );
    context.texParameteri(
      context.TEXTURE_2D,
      context.TEXTURE_MAG_FILTER,
      context.LINEAR,
    );
    context.texParameteri(
      context.TEXTURE_2D,
      context.TEXTURE_WRAP_S,
      context.CLAMP_TO_EDGE,
    );
    context.texParameteri(
      context.TEXTURE_2D,
      context.TEXTURE_WRAP_T,
      context.CLAMP_TO_EDGE,
    );
    const framebuffer = context.createFramebuffer();
    context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
    context.framebufferTexture2D(
      context.FRAMEBUFFER,
      context.COLOR_ATTACHMENT0,
      context.TEXTURE_2D,
      texture,
      0,
    );
    context.clearColor(0, 0, 0, 0);
    context.clear(context.COLOR_BUFFER_BIT);
    return { texture, framebuffer };
  }

  function target(name: TargetName): LiquidEtherTarget {
    return targets.get(name)!;
  }

  function dropTargets() {
    if (!gl) return;
    for (const entry of targets.values()) {
      gl.deleteTexture(entry.texture);
      gl.deleteFramebuffer(entry.framebuffer);
    }
    targets.clear();
  }

  function resize() {
    if (!gl || lost || disposed) return;
    const s = options.getSettings();
    const rect = container.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const ratio = Math.min(
      window.devicePixelRatio || 1,
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
    const base = s.resolution * 0.5;
    const scale =
      base *
      Math.min(1, Math.sqrt(MAX_CELLS / (cssWidth * cssHeight * base * base)));
    const gridWidth = clamp(Math.round(cssWidth * scale), 16, 1024);
    const gridHeight = clamp(Math.round(cssHeight * scale), 16, 1024);
    if (gridWidth === grid.width && gridHeight === grid.height) return;
    dropTargets();
    grid.width = gridWidth;
    grid.height = gridHeight;
    targets.set('velocity', makeTarget(gl, gridWidth, gridHeight, 2));
    targets.set('velocityNext', makeTarget(gl, gridWidth, gridHeight, 2));
    targets.set('divergence', makeTarget(gl, gridWidth, gridHeight, 1));
    targets.set('pressure', makeTarget(gl, gridWidth, gridHeight, 1));
    targets.set('pressureNext', makeTarget(gl, gridWidth, gridHeight, 1));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function swap(a: TargetName, b: TargetName) {
    const held = target(a);
    targets.set(a, target(b));
    targets.set(b, held);
  }

  function bindTexture(
    unit: number,
    texture: WebGLTexture | null,
    location: WebGLUniformLocation | null | undefined,
  ) {
    if (!gl) return;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(location ?? null, unit);
  }

  function run(
    entry: LiquidEtherProgram,
    output: LiquidEtherTarget | null,
    bind: (uniforms: Uniforms) => void,
  ) {
    if (!gl) return;
    gl.useProgram(entry.program);
    gl.uniform2f(
      entry.uniforms.uTexel ?? null,
      1 / grid.width,
      1 / grid.height,
    );
    bind(entry.uniforms);
    gl.bindFramebuffer(gl.FRAMEBUFFER, output ? output.framebuffer : null);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function simulate(
    context: WebGL2RenderingContext,
    s: LiquidEtherSettings,
    dt: number,
  ) {
    context.viewport(0, 0, grid.width, grid.height);
    const walls = s.walls ? 1 : 0;
    for (const splat of splats) {
      run(programs.splat, target('velocityNext'), (u) => {
        bindTexture(0, target('velocity').texture, u.uVelocity);
        context.uniform2f(u.uSize ?? null, size.width, size.height);
        context.uniform4f(
          u.uSegment ?? null,
          splat.ax,
          splat.ay,
          splat.bx,
          splat.by,
        );
        context.uniform2f(u.uForce ?? null, splat.vx, splat.vy);
        context.uniform1f(u.uRadius ?? null, splat.radius);
      });
      swap('velocity', 'velocityNext');
    }
    splats.length = 0;
    const passes = Math.ceil(s.viscosity * 4);
    for (let pass = 0; pass < passes; pass++) {
      run(programs.smooth, target('velocityNext'), (u) => {
        bindTexture(0, target('velocity').texture, u.uVelocity);
        context.uniform1f(
          u.uAmount ?? null,
          Math.min(1, s.viscosity * 4 - pass) * 0.9,
        );
      });
      swap('velocity', 'velocityNext');
    }
    run(programs.divergence, target('divergence'), (u) => {
      bindTexture(0, target('velocity').texture, u.uVelocity);
      context.uniform1f(u.uWalls ?? null, walls);
    });
    for (let iteration = 0; iteration < PRESSURE_STEPS; iteration++) {
      run(programs.pressure, target('pressureNext'), (u) => {
        bindTexture(0, target('pressure').texture, u.uPressure);
        bindTexture(1, target('divergence').texture, u.uDivergence);
        context.uniform1f(u.uWalls ?? null, walls);
      });
      swap('pressure', 'pressureNext');
    }
    run(programs.project, target('velocityNext'), (u) => {
      bindTexture(0, target('pressure').texture, u.uPressure);
      bindTexture(1, target('velocity').texture, u.uVelocity);
      context.uniform1f(u.uWalls ?? null, walls);
    });
    swap('velocity', 'velocityNext');
    run(programs.advect, target('velocityNext'), (u) => {
      bindTexture(0, target('velocity').texture, u.uVelocity);
      context.uniform2f(u.uStep ?? null, dt / size.width, dt / size.height);
      context.uniform1f(u.uKeep ?? null, keepFor(s.persistence, dt));
      context.uniform1f(u.uWalls ?? null, walls);
    });
    swap('velocity', 'velocityNext');
  }

  function render(context: WebGL2RenderingContext, s: LiquidEtherSettings) {
    context.viewport(0, 0, canvas.width, canvas.height);
    run(programs.display, null, (u) => {
      bindTexture(0, target('velocity').texture, u.uVelocity);
      bindTexture(1, paletteTexture, u.uPalette);
      context.uniform2f(u.uSimSize ?? null, grid.width, grid.height);
      context.uniform1f(
        u.uSpeedScale ?? null,
        (1.25 * s.intensity) / (0.84 * Math.max(size.width, size.height)),
      );
      context.uniform1f(u.uLight ?? null, s.light ? 1 : 0);
      context.uniform4f(
        u.uBackground ?? null,
        s.background[0],
        s.background[1],
        s.background[2],
        s.background[3],
      );
    });
  }

  function wander(t: number): [number, number] {
    const x = 0.62 * Math.sin(t * 0.83 + 1.3) + 0.38 * Math.sin(t * 1.71 + 0.4);
    const y = 0.6 * Math.sin(t * 1.07 + 2.1) + 0.4 * Math.cos(t * 0.61 + 0.7);
    return [(0.5 + 0.41 * x) * size.width, (0.5 + 0.41 * y) * size.height];
  }

  function sweep(t: number): [number, number] {
    const k = clamp(t / 1.4, 0, 1);
    const eased = 1 - Math.pow(1 - k, 3);
    const angle = -0.6 + eased * 3.6;
    const reach = 0.08 + 0.3 * eased;
    return [
      (0.5 + Math.cos(angle) * reach * 1.1) * size.width,
      (0.5 + Math.sin(angle) * reach * (size.width / size.height) * 0.75) *
        size.height,
    ];
  }

  function addStroke(
    from: [number, number],
    to: [number, number],
    dt: number,
    scale: number,
    radius: number,
  ) {
    splats.push({
      ax: from[0],
      ay: from[1],
      bx: to[0],
      by: to[1],
      vx: clamp(((to[0] - from[0]) / dt) * scale, -6000, 6000),
      vy: clamp(((to[1] - from[1]) / dt) * scale, -6000, 6000),
      radius,
    });
  }

  function frame(now: number) {
    raf = 0;
    if (!gl || lost || disposed || !targets.size) return;
    const s = options.getSettings();
    updatePalette(s);
    const dt = clamp((now - last) / 1000 || 0, 0, 1 / 30);
    last = Math.max(last, now);
    const pace = Math.min(1, dt * 60);
    const idle = now - lastInput > s.autoResumeDelay && !pointer.inside;

    if (opening.active && dt > 0) {
      const from = sweep(opening.time);
      opening.time += dt;
      const fade = Math.sin(Math.min(1, opening.time / 1.4) * Math.PI);
      addStroke(from, sweep(opening.time), dt, 0.2 * fade, s.radius);
      energy = 1;
      if (opening.time > 1.4) opening.active = false;
    } else if (s.autoDemo && !reduced && idle && dt > 0) {
      auto.ramp = Math.min(1, auto.ramp + dt / 0.8);
      auto.phase += dt * s.autoSpeed * 1.6;
      const spot = wander(auto.phase);
      if (auto.ready) {
        const gust =
          0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(auto.phase * 2.6), 2);
        const scale =
          (s.force / 20) *
          0.45 *
          s.autoIntensity *
          auto.ramp *
          auto.ramp *
          gust *
          pace;
        addStroke([auto.x, auto.y], spot, dt, scale, s.radius);
      }
      auto.x = spot[0];
      auto.y = spot[1];
      auto.ready = true;
      energy = 1;
    } else {
      auto.ramp = 0;
    }

    if (pointer.moved && dt > 0) {
      pointer.moved = false;
      const span = Math.max(now - pointer.last, 8) / 1000;
      addStroke(
        [pointer.fromX, pointer.fromY],
        [pointer.x, pointer.y],
        span,
        (s.force / 20) * 0.15 * pace,
        s.radius,
      );
      pointer.fromX = pointer.x;
      pointer.fromY = pointer.y;
      pointer.last = now;
      energy = 1;
    }

    const puff = puffs.shift();
    if (puff) splats.push(puff);

    gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);
    if (dt > 0) simulate(gl, s, dt);
    render(gl, s);

    energy *= keepFor(s.persistence, dt);
    const busy =
      opening.active ||
      (s.autoDemo && !reduced) ||
      energy > 0.002 ||
      puffs.length > 0 ||
      pointer.moved;
    if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (raf || lost || disposed || !visible || !pageVisible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function locate(event: PointerEvent) {
    const rect = container.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: rect.bottom - event.clientY,
      inside:
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom,
    };
  }

  function pointerMove(event: PointerEvent) {
    const spot = locate(event);
    pointer.inside = spot.inside;
    if (!spot.inside) {
      pointer.ready = false;
      return;
    }
    lastInput = performance.now();
    opening.active = false;
    if (!pointer.ready) {
      pointer.fromX = spot.x;
      pointer.fromY = spot.y;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.last = lastInput;
      pointer.ready = true;
    }
    const travelX = spot.x - pointer.x;
    const travelY = spot.y - pointer.y;
    if (Math.hypot(travelX, travelY) > 0.5) {
      pointer.dx = pointer.dx * 0.7 + travelX * 0.3;
      pointer.dy = pointer.dy * 0.7 + travelY * 0.3;
    }
    pointer.x = spot.x;
    pointer.y = spot.y;
    pointer.moved = true;
    wake();
  }

  function pointerDown(event: PointerEvent) {
    const s = options.getSettings();
    const spot = locate(event);
    if (!spot.inside) return;
    lastInput = performance.now();
    if (!s.clickBurst || reduced) return;
    const angle =
      Math.hypot(pointer.dx, pointer.dy) > 1
        ? Math.atan2(pointer.dy, pointer.dx)
        : Math.random() * Math.PI * 2;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const reach = s.radius * 0.5;
    const push = 1400 * (s.force / 20);
    puffs.push({
      ax: spot.x - dirX * reach,
      ay: spot.y - dirY * reach,
      bx: spot.x + dirX * reach,
      by: spot.y + dirY * reach,
      vx: dirX * push,
      vy: dirY * push,
      radius: s.radius * 0.9,
    });
    if (puffs.length > 4) puffs.shift();
    energy = 1;
    wake();
  }

  function leave() {
    pointer.inside = false;
    pointer.ready = false;
  }

  function pointerUp(event: PointerEvent) {
    if (event.pointerType !== 'mouse') leave();
  }

  function onLost(event: Event) {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function onRestored() {
    options.onContextRestored();
  }

  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  resize();
  wake();

  return {
    refresh() {
      resize();
      wake();
    },
    resize() {
      resize();
      wake();
    },
    setVisible(value: boolean) {
      visible = value;
      wake();
    },
    pageVisibilityChanged() {
      pageVisible = document.visibilityState !== 'hidden';
      wake();
    },
    pointerMove,
    pointerDown,
    pointerUp,
    leave,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        dropTargets();
        gl.deleteTexture(paletteTexture);
        gl.deleteVertexArray(vao);
        for (const entry of Object.values(programs)) {
          gl.deleteProgram(entry.program);
        }
      }
    },
  };
}
