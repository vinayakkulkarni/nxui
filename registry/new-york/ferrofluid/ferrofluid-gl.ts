import {
  FERRO_BOUND,
  FERRO_RENDER,
  FERRO_SIM,
  FERRO_VERTEX,
} from './ferrofluid-shaders';
import type {
  FerrofluidEngine,
  FerrofluidProgram,
  FerrofluidProps,
  FerrofluidSettings,
  FerrofluidShape,
  FerrofluidTarget,
} from './types';

type Vec2 = [number, number];
type Vec3 = [number, number, number];

export const FERROFLUID_COLORS: readonly string[] = [
  '#ffffff',
  '#ffffff',
  '#ffffff',
];

const CELL = 1 / 3;
const BOUND_CELL = 1;
const INTRO_SECONDS = 2.4;
const FOV = (38 * Math.PI) / 180;
const FLOW: Record<string, Vec2> = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0],
  none: [0, 0],
};
const WHITE: Vec3 = [1, 1, 1];
const DARK_BASE: Vec3 = [0.0706, 0.0588, 0.0902];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function normalizeFerrofluid(
  props: FerrofluidProps,
  reduce: boolean,
): FerrofluidSettings {
  const colors =
    Array.isArray(props.colors) && props.colors.length
      ? props.colors.slice(0, 3)
      : ['#ffffff'];
  return {
    colors,
    speed: Math.max(0, props.speed ?? 0.5),
    scale: clamp(props.scale ?? 1.6, 0.2, 6),
    spikeHeight: Math.max(0, props.spikeHeight ?? 1),
    sharpness: clamp(props.sharpness ?? 2.5, 0.6, 6),
    turbulence: Math.max(0, props.turbulence ?? 1),
    fluidity: clamp(props.fluidity ?? 0.5, 0, 1),
    tilt: clamp(props.tilt ?? 48, 10, 70),
    magnetism: Math.max(0, props.magnetism ?? 1),
    variation: props.variation ?? 0,
    flow: FLOW[props.flowDirection ?? 'down'] ?? [0, -1],
    brightness: Math.max(0, props.brightness ?? 1),
    mouseInteraction: props.mouseInteraction ?? true,
    mouseStrength: Math.max(0, props.mouseStrength ?? 1),
    mouseRadius: clamp(props.mouseRadius ?? 0.22, 0.02, 2),
    mouseDampening: Math.max(0, props.mouseDampening ?? 0.15),
    clickPulse: props.clickPulse ?? true,
    intro: props.intro ?? true,
    lightMode: props.lightMode ?? false,
    transparent: props.transparent ?? true,
    color: props.color,
    opacity: clamp(props.opacity ?? 1, 0, 1),
    paused: props.paused ?? false,
    dpr: props.dpr,
    reduce,
  };
}

function shapeOf(sharpness: number): FerrofluidShape {
  const edge = clamp((sharpness - 1) / 4, 0, 1);
  const round = 1 - edge * 0.7;
  const exponent = 1.05 + edge * 1.2;
  const span = Math.sqrt(1 + round * round) - round;
  return { round, exponent, span };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
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
): FerrofluidProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, FERRO_VERTEX);
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
      uniforms[info.name.replace('[0]', '')] = gl.getUniformLocation(
        program,
        info.name,
      );
    }
  }
  return { program, uniforms };
}

export function createFerrofluid(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => FerrofluidSettings,
): FerrofluidEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const floatTargets = Boolean(gl.getExtension('EXT_color_buffer_float'));
  const sim = link(gl, FERRO_SIM);
  const bounds = link(gl, FERRO_BOUND);
  const render = link(gl, FERRO_RENDER);
  if (!sim || !bounds || !render) return null;

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

  const makeTarget = (
    width: number,
    height: number,
    filter: number,
  ): FerrofluidTarget => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, framebuffer };
  };

  const dropTarget = (target: FerrofluidTarget | null) => {
    if (!target) return;
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.framebuffer);
  };

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const cache = new Map<string, Vec3>();
  const parse = (value: string | undefined, fallback: Vec3): Vec3 => {
    if (!value) return fallback;
    const cached = cache.get(value);
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
    cache.set(value, rgb);
    return rgb;
  };

  const tanHalf = Math.tan(FOV / 2);
  const view = {
    width: 1,
    height: 1,
    worldHeight: 10,
    scale: 0,
    tilt: -1,
    reach: 1,
  };
  const forward: Vec3 = [0, 1, 0];
  const upward: Vec3 = [0, 0, 1];
  const camera = {
    x: 0,
    y: 0,
    z: 1,
    forward,
    upward,
    far: 10,
    distance: 4,
  };
  const grid = {
    width: 0,
    height: 0,
    originX: 0,
    originY: 0,
    boundWidth: 0,
    boundHeight: 0,
  };
  let states: FerrofluidTarget[] = [];
  let boundTarget: FerrofluidTarget | null = null;
  let current = 0;
  let settle = true;

  const pointer = { x: 0, y: 0, inside: false };
  const cursor = { x: 0, y: 0, strength: 0 };
  const pulse = { x: 0, y: 0, age: 10 };
  const initial = getSettings();
  let wander = 0;
  let presence = initial.intro && !initial.reduce ? 0 : 1;
  let shape = shapeOf(initial.sharpness);
  let shapeKey = initial.sharpness;
  let lastDpr = initial.dpr;
  let raf = 0;
  let last = 0;
  let visible = true;
  let destroyed = false;

  const castRay = (x: number, y: number): Vec3 => {
    const aspect = view.width / view.height;
    const sx = x * aspect * tanHalf;
    const sy = y * tanHalf;
    const [fx, fy, fz] = camera.forward;
    const uy = camera.upward[1];
    const uz = camera.upward[2];
    const dx = fx + sx;
    const dy = fy + sy * uy;
    const dz = fz + sy * uz;
    const length = Math.hypot(dx, dy, dz) || 1;
    return [dx / length, dy / length, dz / length];
  };

  const groundAt = (x: number, y: number): Vec2 => {
    const [dx, dy, dz] = castRay(x, y);
    const t = dz < -0.004 ? Math.min(-camera.z / dz, camera.far) : camera.far;
    return [camera.x + dx * t, camera.y + dy * t];
  };

  const layout = () => {
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    view.width = canvas.width;
    view.height = canvas.height;
    view.worldHeight = 22 / s.scale;
    view.scale = s.scale;
    view.tilt = s.tilt;
    const pitch = ((90 - s.tilt) * Math.PI) / 180;
    const distance = view.worldHeight / (2 * tanHalf);
    camera.forward = [0, Math.cos(pitch), -Math.sin(pitch)];
    camera.upward = [0, Math.sin(pitch), Math.cos(pitch)];
    camera.x = 0;
    camera.y = -distance * Math.cos(pitch);
    camera.z = distance * Math.sin(pitch);
    camera.far = distance * 2.5;
    camera.distance = distance;
    const corners = [
      groundAt(-1, -1),
      groundAt(1, -1),
      groundAt(-1, 1),
      groundAt(1, 1),
      groundAt(0, 1),
    ];
    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => c[1]);
    const minX = Math.min(...xs) - 3;
    const maxX = Math.max(...xs) + 3;
    const minY = Math.min(...ys) - 3;
    const maxY = Math.max(...ys) + 3;
    view.reach = Math.max(...corners.map((c) => Math.hypot(c[0], c[1]))) + 4;
    const gridWidth = Math.ceil((maxX - minX) / CELL) + 2;
    const gridHeight = Math.ceil((maxY - minY) / CELL) + 2;
    grid.originX = minX;
    grid.originY = minY;
    if (gridWidth !== grid.width || gridHeight !== grid.height) {
      states.forEach(dropTarget);
      dropTarget(boundTarget);
      states = [
        makeTarget(gridWidth, gridHeight, gl.LINEAR),
        makeTarget(gridWidth, gridHeight, gl.LINEAR),
      ];
      grid.width = gridWidth;
      grid.height = gridHeight;
      grid.boundWidth = Math.ceil((gridWidth * CELL) / BOUND_CELL);
      grid.boundHeight = Math.ceil((gridHeight * CELL) / BOUND_CELL);
      boundTarget = makeTarget(grid.boundWidth, grid.boundHeight, gl.NEAREST);
      current = 0;
    }
    settle = true;
  };

  const toWorld = (clientX: number, clientY: number): Vec2 => {
    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const y = 1 - ((clientY - rect.top) / Math.max(1, rect.height)) * 2;
    return groundAt(x, y);
  };

  const step = (dt: number) => {
    const s = getSettings();
    if (s.scale !== view.scale || s.tilt !== view.tilt) layout();
    const motion = s.paused ? 0 : 1;
    wander += dt * motion * (s.reduce ? 0 : s.speed);
    presence =
      s.intro && !s.reduce
        ? Math.min(1, presence + (dt * motion) / INTRO_SECONDS)
        : 1;
    pulse.age += dt * motion;

    const engaged = s.mouseInteraction && pointer.inside;
    const follow =
      s.mouseDampening > 0 ? 1 - Math.exp(-dt / s.mouseDampening) : 1;
    if (engaged) {
      cursor.x += (pointer.x - cursor.x) * follow;
      cursor.y += (pointer.y - cursor.y) * follow;
    }
    const targetStrength = engaged ? s.mouseStrength * 1.4 : 0;
    cursor.strength +=
      (targetStrength - cursor.strength) * (1 - Math.exp(-dt / 0.35));
    if (Math.abs(targetStrength - cursor.strength) < 0.001) {
      cursor.strength = targetStrength;
    }
  };

  const draw = (dt: number) => {
    const read = states[current];
    const write = states[1 - current];
    if (!boundTarget || !read || !write) return;
    const s = getSettings();
    const worldUnit = view.worldHeight;
    const radius = s.mouseRadius * worldUnit;
    const fullHeight = 1.2 * s.spikeHeight;
    if (s.sharpness !== shapeKey) {
      shapeKey = s.sharpness;
      shape = shapeOf(s.sharpness);
    }
    const reveal = presence * presence * (3 - 2 * presence);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
    gl.viewport(0, 0, grid.width, grid.height);
    gl.useProgram(sim.program);
    const su = sim.uniforms;
    gl.bindTexture(gl.TEXTURE_2D, read.texture);
    gl.uniform1i(su.uState ?? null, 0);
    gl.uniform2f(su.uGridOrigin ?? null, grid.originX, grid.originY);
    gl.uniform1f(su.uCell ?? null, CELL);
    gl.uniform1f(su.uDt ?? null, Math.max(dt, 0.001));
    gl.uniform1f(su.uTime ?? null, wander);
    gl.uniform2f(su.uFlow ?? null, s.flow[0], s.flow[1]);
    gl.uniform1f(su.uTurbulence ?? null, s.turbulence);
    gl.uniform1f(su.uMagnetism ?? null, s.magnetism);
    gl.uniform1f(su.uFieldScale ?? null, 5.5);
    gl.uniform2f(su.uSeed ?? null, s.variation * 17.31, s.variation * 9.73);
    gl.uniform4f(
      su.uCursor ?? null,
      cursor.x,
      cursor.y,
      cursor.strength,
      radius,
    );
    gl.uniform4f(
      su.uPulse ?? null,
      pulse.x,
      pulse.y,
      pulse.age,
      pulse.age < 4 ? 1.1 : 0,
    );
    gl.uniform1f(su.uPulseSpeed ?? null, worldUnit * 0.45);
    gl.uniform1f(su.uPulseWidth ?? null, 1.4);
    gl.uniform3f(su.uIntro ?? null, 0, 0, reveal * (view.reach + 3));
    gl.uniform1f(su.uSpikeHeight ?? null, fullHeight);
    gl.uniform1f(su.uMound ?? null, 0.6);
    gl.uniform1f(su.uStiffness ?? null, 150);
    gl.uniform1f(su.uDamping ?? null, 22 - s.fluidity * 15);
    gl.uniform1f(
      su.uSettle ?? null,
      settle || !floatTargets || s.reduce ? 1 : 0,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    settle = false;
    current = 1 - current;

    gl.bindFramebuffer(gl.FRAMEBUFFER, boundTarget.framebuffer);
    gl.viewport(0, 0, grid.boundWidth, grid.boundHeight);
    gl.useProgram(bounds.program);
    const bu = bounds.uniforms;
    gl.bindTexture(gl.TEXTURE_2D, write.texture);
    gl.uniform1i(bu.uState ?? null, 0);
    gl.uniform2f(bu.uGridOrigin ?? null, grid.originX, grid.originY);
    gl.uniform1f(bu.uCell ?? null, CELL);
    gl.uniform2f(bu.uStateSize ?? null, grid.width, grid.height);
    gl.uniform1f(bu.uBoundCell ?? null, BOUND_CELL);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, view.width, view.height);
    gl.useProgram(render.program);
    const ru = render.uniforms;
    gl.bindTexture(gl.TEXTURE_2D, write.texture);
    gl.uniform1i(ru.uField ?? null, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, boundTarget.texture);
    gl.uniform1i(ru.uBound ?? null, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform2f(ru.uGridOrigin ?? null, grid.originX, grid.originY);
    gl.uniform2f(ru.uGridSpan ?? null, grid.width * CELL, grid.height * CELL);
    gl.uniform2f(
      ru.uBoundSpan ?? null,
      grid.boundWidth * BOUND_CELL,
      grid.boundHeight * BOUND_CELL,
    );
    gl.uniform1f(ru.uCellSize ?? null, CELL);
    gl.uniform2f(ru.uResolution ?? null, view.width, view.height);
    gl.uniform3f(ru.uCamera ?? null, camera.x, camera.y, camera.z);
    gl.uniform3fv(ru.uForward ?? null, camera.forward);
    gl.uniform3fv(ru.uUpward ?? null, camera.upward);
    gl.uniform1f(ru.uTanHalf ?? null, tanHalf);
    gl.uniform1f(ru.uPixelAngle ?? null, (2 * tanHalf) / view.height);
    gl.uniform1f(ru.uFar ?? null, camera.far);
    gl.uniform1f(ru.uFogStart ?? null, camera.distance * 0.95);
    gl.uniform1f(ru.uTop ?? null, fullHeight * 1.6 + 0.6 * 3 + 0.1);
    gl.uniform1f(ru.uBottom ?? null, -0.05);
    gl.uniform1f(ru.uTime ?? null, wander * 2);
    gl.uniform4f(
      ru.uCursor ?? null,
      cursor.x,
      cursor.y,
      cursor.strength,
      radius,
    );
    gl.uniform1f(ru.uMound ?? null, 0.6);
    gl.uniform1f(ru.uRound ?? null, shape.round);
    gl.uniform1f(ru.uSpan ?? null, shape.span);
    gl.uniform1f(ru.uExponent ?? null, shape.exponent);
    gl.uniform1f(ru.uWarp ?? null, 0.06 * s.turbulence);
    const lights = s.colors.map((value) => parse(value, WHITE));
    const key = lights[0] ?? WHITE;
    const strip = lights[1] ?? key;
    const fill = lights[2] ?? strip;
    gl.uniform3fv(ru.uKey ?? null, key);
    gl.uniform3fv(ru.uStrip ?? null, strip);
    gl.uniform3fv(ru.uFill ?? null, fill);
    gl.uniform1f(ru.uExposure ?? null, 3 * s.brightness);
    gl.uniform1f(ru.uLight ?? null, s.lightMode ? 1 : 0);
    gl.uniform1f(ru.uOpaque ?? null, s.transparent ? 0 : 1);
    gl.uniform3fv(
      ru.uBase ?? null,
      parse(s.color, s.lightMode ? WHITE : DARK_BASE),
    );
    gl.uniform1f(ru.uOpacity ?? null, s.opacity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    raf = 0;
    if (destroyed || !visible || document.hidden) return;
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    step(dt);
    draw(dt);
    raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (!destroyed && !raf && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  };

  const resize = () => {
    if (destroyed) return;
    layout();
    draw(0);
    wake();
  };

  const locate = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    [pointer.x, pointer.y] = toWorld(event.clientX, event.clientY);
  };

  const pointerMove = (event: PointerEvent) => {
    const wasInside = pointer.inside;
    locate(event);
    if (pointer.inside && !wasInside && cursor.strength < 0.05) {
      cursor.x = pointer.x;
      cursor.y = pointer.y;
    }
    wake();
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
      wake();
    },
    setVisible(next: boolean) {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    pointerMove,
    pointerDown(event: PointerEvent) {
      pointerMove(event);
      const s = getSettings();
      if (!pointer.inside || !s.clickPulse || s.reduce) return;
      pulse.x = pointer.x;
      pulse.y = pointer.y;
      pulse.age = 0;
    },
    pointerUp(event: PointerEvent) {
      if (event.pointerType !== 'mouse') pointer.inside = false;
    },
    pointerLeave() {
      pointer.inside = false;
    },
    visibilityChange() {
      last = 0;
      wake();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      states.forEach(dropTarget);
      dropTarget(boundTarget);
      states = [];
      boundTarget = null;
      gl.deleteProgram(sim.program);
      gl.deleteProgram(bounds.program);
      gl.deleteProgram(render.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
