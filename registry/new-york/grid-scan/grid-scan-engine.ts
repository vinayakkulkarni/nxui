import {
  GRID_SCAN_BLUR,
  GRID_SCAN_COMPOSITE,
  GRID_SCAN_DOWN,
  GRID_SCAN_ROOM,
} from './grid-scan-shaders';
import {
  clamp,
  createColorParser,
  createTarget,
  link,
  sizeTarget,
} from './grid-scan-gl';
import type {
  GridScanEngine,
  GridScanPointer,
  GridScanSettings,
} from './types';

const MAX_PINGS = 4;
const PING_LIFE = 2.4;
const INTRO_SECONDS = 2.2;
const EYE_DISTANCE = 1.25;

interface Ping {
  x: number;
  y: number;
  z: number;
  age: number;
}

/**
 * Raw WebGL2 renderer for the grid room: a ray-traced box drawn into a
 * scene + light target, a quarter-res bloom of the light target, then a
 * composite onto the canvas. Ported 1:1 from React Bits GridScan.
 */
export function createGridScanEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => GridScanSettings,
  isReduced: () => boolean,
  wake: () => void,
): GridScanEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const room = link(gl, GRID_SCAN_ROOM);
  const down = link(gl, GRID_SCAN_DOWN);
  const blur = link(gl, GRID_SCAN_BLUR);
  const composite = link(gl, GRID_SCAN_COMPOSITE);
  const vao = gl.createVertexArray();
  const scene = createTarget(gl);
  const light = createTarget(gl);
  const bloomA = createTarget(gl);
  const bloomB = createTarget(gl);
  const sceneBuffer = gl.createFramebuffer();
  const bloomBufferA = gl.createFramebuffer();
  const bloomBufferB = gl.createFramebuffer();
  if (
    !room ||
    !down ||
    !blur ||
    !composite ||
    !vao ||
    !scene ||
    !light ||
    !bloomA ||
    !bloomB ||
    !sceneBuffer ||
    !bloomBufferA ||
    !bloomBufferB
  ) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }

  const parse = createColorParser();
  const view = { width: 1, height: 1, ratio: 1 };
  const eye = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tx: 0,
    ty: 0,
    f: EYE_DISTANCE,
    vf: 0,
    tf: EYE_DISTANCE,
  };
  const pointer = { x: 0, y: 0, inside: false };
  const look = { x: 0, y: 0, held: false };
  const tilt = { gamma: 0, beta: 0, ready: false };
  const hover = { x: 0, y: 0, z: 0, strength: 0, ready: false };
  const scan = { z: 0, dir: 1, alpha: 0, start: 0, sweeps: 0, waiting: false };
  const pings: Ping[] = [];
  const pingData = new Float32Array(MAX_PINGS * 4);
  const pingAlpha = new Float32Array(MAX_PINGS);
  let time = 0;
  let introClock = getSettings().intro && !isReduced() ? 0 : 1;
  let last = 0;
  let visible = true;
  let headActive = false;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;

  const roomSize = () => {
    const s = getSettings();
    const aspect = view.width / view.height;
    const cy = 1 / Math.round(s.cells);
    const cx = aspect / Math.max(1, Math.round(aspect / cy));
    const roomDepth = Math.max(cy, Math.round(s.depth / cy) * cy);
    return { aspect, cx, cy, roomDepth };
  };

  const castRay = (u: number, v: number) => {
    const { aspect, roomDepth } = roomSize();
    const px = (u - 0.5) * aspect;
    const py = v - 0.5;
    const dx = px - eye.x;
    const dy = py - eye.y;
    const dz = eye.f;
    const sx = dx > 0 ? 0.5 * aspect : -0.5 * aspect;
    const sy = dy > 0 ? 0.5 : -0.5;
    let t = roomDepth / dz;
    if (Math.abs(dx) > 1e-6) t = Math.min(t, (sx - px) / dx);
    if (Math.abs(dy) > 1e-6) t = Math.min(t, (sy - py) / dy);
    return { x: px + dx * t, y: py + dy * t, z: dz * t };
  };

  const startSweep = (s: GridScanSettings) => {
    scan.dir =
      s.direction === 'backward' ||
      (s.direction === 'pingpong' && scan.sweeps % 2 === 1)
        ? -1
        : 1;
    scan.start = time;
    scan.waiting = false;
    scan.sweeps += 1;
  };

  const updateScan = (s: GridScanSettings, roomDepth: number) => {
    if (introClock < 1) {
      const k = introClock;
      scan.dir = 1;
      scan.z = k * (roomDepth + 0.4) - 0.2;
      scan.alpha = Math.min(1, k * 6) * (1 - Math.max(0, k - 0.85) / 0.15);
      return;
    }
    if (scan.sweeps === 0 && !scan.waiting) {
      scan.waiting = true;
      scan.start = time;
      scan.alpha = 0;
    }
    if (scan.waiting) {
      scan.alpha = 0;
      if (s.autoScan && !isReduced() && time - scan.start >= s.delay)
        startSweep(s);
      return;
    }
    const k = (time - scan.start) / s.duration;
    if (k >= 1) {
      scan.waiting = true;
      scan.start = time;
      scan.alpha = 0;
      return;
    }
    const travel = k * (roomDepth + 0.3) - 0.15;
    scan.z = scan.dir > 0 ? travel : roomDepth - travel;
    scan.alpha = Math.min(1, k / 0.12) * Math.min(1, (1 - k) / 0.12);
  };

  const updateEye = (dt: number) => {
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      eye.vx += ((eye.tx - eye.x) * 42 - eye.vx * 11) * h;
      eye.vy += ((eye.ty - eye.y) * 42 - eye.vy * 11) * h;
      eye.vf += ((eye.tf - eye.f) * 42 - eye.vf * 11) * h;
      eye.x += eye.vx * h;
      eye.y += eye.vy * h;
      eye.f += eye.vf * h;
    }
  };

  const setLook = (nx: number, ny: number, held: boolean) => {
    look.x = clamp(nx, -1, 1);
    look.y = clamp(ny, -1, 1);
    look.held = held;
  };

  const aimEye = (s: GridScanSettings) => {
    const aspect = view.width / view.height;
    const drift = isReduced() ? 0 : 1;
    const nx = look.held
      ? look.x
      : (Math.sin(time * 0.21) * 0.2 + Math.sin(time * 0.083 + 1.3) * 0.12) *
        drift;
    const ny = look.held ? look.y : Math.sin(time * 0.17 + 2.1) * 0.16 * drift;
    eye.tx = nx * s.parallax * 0.22 * aspect;
    eye.ty = ny * s.parallax * 0.22;
  };

  const draw = () => {
    const s = getSettings();
    const { aspect, cx, cy, roomDepth } = roomSize();
    const lineRgb = parse(s.linesColor);
    const scanRgb = parse(s.scanColor);
    const coreRgb = s.lightMode
      ? scanRgb
      : scanRgb.map((c) => c + (1 - c) * 0.65);
    const ru = room.uniforms;
    gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneBuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(room.program);
    gl.uniform1f(ru.uAspect ?? null, aspect);
    gl.uniform1f(ru.uPixel ?? null, 1 / canvas.height);
    gl.uniform3f(ru.uEye ?? null, eye.x, eye.y, -eye.f);
    gl.uniform1f(ru.uDepth ?? null, roomDepth);
    gl.uniform3f(ru.uCell ?? null, cx, cy, cy);
    gl.uniform1f(ru.uThick ?? null, s.thickness * view.ratio * 0.5);
    gl.uniform1f(ru.uDot ?? null, 1.8 * view.ratio);
    gl.uniform1i(ru.uStyle ?? null, s.style);
    gl.uniform3fv(ru.uLineColor ?? null, lineRgb);
    gl.uniform3fv(ru.uScanColor ?? null, scanRgb);
    gl.uniform3fv(ru.uCoreColor ?? null, coreRgb);
    gl.uniform1f(ru.uFade ?? null, s.depthFade);
    gl.uniform1f(ru.uScanZ ?? null, scan.z);
    gl.uniform1f(ru.uScanDir ?? null, scan.dir);
    gl.uniform1f(ru.uScanAlpha ?? null, scan.alpha);
    gl.uniform1f(ru.uScanWidth ?? null, 0.006 * s.scanWidth);
    gl.uniform1f(ru.uTrail ?? null, 0.04 + s.trail * 1.1);
    gl.uniform1f(ru.uReveal ?? null, introClock < 1 ? scan.z + 0.05 : 1e4);
    gl.uniform1f(ru.uPoints ?? null, s.points ? 1 : 0);
    gl.uniform1f(ru.uReflect ?? null, s.reflection);
    gl.uniform1f(ru.uHaze ?? null, s.lightMode ? 0.03 : 0.05);
    gl.uniform1f(ru.uShade ?? null, s.shading);
    gl.uniform1f(ru.uLight ?? null, s.lightMode ? 1 : 0);
    gl.uniform4fv(ru.uPing ?? null, pingData);
    gl.uniform1fv(ru.uPingAlpha ?? null, pingAlpha);
    gl.uniform4f(ru.uHover ?? null, hover.x, hover.y, hover.z, hover.strength);
    gl.uniform1f(ru.uTime ?? null, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const glowing = s.glow > 0;
    if (glowing) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomBufferA);
      gl.viewport(0, 0, bloomA.width, bloomA.height);
      gl.useProgram(down.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, light.texture);
      gl.uniform1i(down.uniforms.uSource ?? null, 0);
      gl.uniform2f(
        down.uniforms.uTexel ?? null,
        1 / light.width,
        1 / light.height,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const spread = (2.2 * view.ratio) / 2;
      gl.useProgram(blur.program);
      gl.uniform1i(blur.uniforms.uSource ?? null, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomBufferB);
      gl.bindTexture(gl.TEXTURE_2D, bloomA.texture);
      gl.uniform2f(blur.uniforms.uStep ?? null, spread / bloomA.width, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomBufferA);
      gl.bindTexture(gl.TEXTURE_2D, bloomB.texture);
      gl.uniform2f(blur.uniforms.uStep ?? null, 0, spread / bloomA.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(composite.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.texture);
    gl.uniform1i(composite.uniforms.uScene ?? null, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloomA.texture);
    gl.uniform1i(composite.uniforms.uBloom ?? null, 1);
    gl.uniform1f(
      composite.uniforms.uGlow ?? null,
      glowing ? s.glow * (s.lightMode ? 0.8 : 1.6) : 0,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
  };

  const resize = (width: number, height: number) => {
    const s = getSettings();
    view.width = Math.max(1, width);
    view.height = Math.max(1, height);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    sizeTarget(gl, scene, canvas.width, canvas.height);
    sizeTarget(gl, light, canvas.width, canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneBuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      scene.texture,
      0,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT1,
      gl.TEXTURE_2D,
      light.texture,
      0,
    );
    const bw = Math.max(1, Math.round(canvas.width / 4));
    const bh = Math.max(1, Math.round(canvas.height / 4));
    sizeTarget(gl, bloomA, bw, bh);
    sizeTarget(gl, bloomB, bw, bh);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomBufferA);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      bloomA.texture,
      0,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomBufferB);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      bloomB.texture,
      0,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    draw();
    wake();
  };

  const frame = (now: number) => {
    if (!visible) return false;
    const s = getSettings();
    const reduce = isReduced();
    const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
    last = now;
    time += dt;
    if (introClock < 1)
      introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
    const { roomDepth } = roomSize();
    updateScan(s, roomDepth);
    aimEye(s);
    updateEye(dt);

    const aim = s.interactive && pointer.inside && !reduce ? 1 : 0;
    if (aim) {
      const target = castRay(pointer.x, pointer.y);
      if (!hover.ready) Object.assign(hover, target, { ready: true });
      const follow = 1 - Math.exp(-dt / 0.08);
      hover.x += (target.x - hover.x) * follow;
      hover.y += (target.y - hover.y) * follow;
      hover.z += (target.z - hover.z) * follow;
    }
    hover.strength += (aim - hover.strength) * (1 - Math.exp(-dt / 0.25));
    if (!aim && hover.strength < 0.01) hover.ready = false;

    for (let i = pings.length - 1; i >= 0; i--) {
      const ping = pings[i];
      if (!ping) continue;
      ping.age += dt;
      if (ping.age > PING_LIFE) pings.splice(i, 1);
    }
    for (let i = 0; i < MAX_PINGS; i++) {
      const ping = pings[i];
      if (!ping) {
        pingAlpha[i] = 0;
        continue;
      }
      const k = ping.age / PING_LIFE;
      pingData.set([ping.x, ping.y, ping.z, ping.age * 1.15], i * 4);
      pingAlpha[i] = Math.min(1, ping.age / 0.05) * (1 - k) * (1 - k);
    }

    draw();

    const settling =
      Math.abs(eye.tx - eye.x) +
        Math.abs(eye.ty - eye.y) +
        Math.abs(eye.tf - eye.f) >
        1e-4 || Math.abs(eye.vx) + Math.abs(eye.vy) + Math.abs(eye.vf) > 1e-4;
    const busy =
      introClock < 1 ||
      (!reduce && s.autoScan) ||
      !scan.waiting ||
      pings.length > 0 ||
      settling ||
      hover.strength > 0.002 ||
      (!reduce && s.parallax > 0 && !look.held) ||
      (s.points && !reduce && scan.alpha > 0);
    if (!busy) last = 0;
    return busy;
  };

  const pointerMove = ({ u, v, inside }: GridScanPointer) => {
    const s = getSettings();
    pointer.x = u;
    pointer.y = v;
    const was = pointer.inside;
    pointer.inside = inside;
    if (inside) {
      clearTimeout(leaveTimer);
      leaveTimer = undefined;
      if (!headActive && s.interactive && !isReduced())
        setLook(u * 2 - 1, v * 2 - 1, true);
      wake();
    } else if (was && leaveTimer === undefined) {
      leaveTimer = setTimeout(() => {
        leaveTimer = undefined;
        if (!headActive) look.held = false;
        wake();
      }, 220);
      wake();
    }
  };

  const pointerDown = ({ u, v, inside }: GridScanPointer) => {
    const s = getSettings();
    if (!inside || isReduced() || s.clickEffect === 'none') return;
    if (s.clickEffect === 'scan') {
      if (introClock >= 1) startSweep(s);
    } else {
      pings.unshift({ ...castRay(u, v), age: 0 });
      if (pings.length > MAX_PINGS) pings.pop();
    }
    wake();
  };

  const pointerLeave = () => {
    pointer.inside = false;
    if (!headActive) look.held = false;
    wake();
  };

  const orientation = (gamma: number | null, beta: number | null) => {
    const s = getSettings();
    if (!s.enableGyro || headActive || isReduced()) return;
    if (gamma === null || beta === null) return;
    if (!tilt.ready) Object.assign(tilt, { gamma, beta, ready: true });
    setLook((gamma - tilt.gamma) / 25, (beta - tilt.beta) / -25, true);
    wake();
  };

  const headMove = (nx: number, ny: number, near: number) => {
    if (isReduced()) return;
    setLook(nx * 1.3, ny * 1.3, true);
    eye.tf = EYE_DISTANCE * clamp(near, 0.6, 1.6);
    wake();
  };

  const headRelease = () => {
    eye.tf = EYE_DISTANCE;
    look.held = false;
    wake();
  };

  const dispose = () => {
    clearTimeout(leaveTimer);
    for (const target of [scene, light, bloomA, bloomB])
      gl.deleteTexture(target.texture);
    for (const buffer of [sceneBuffer, bloomBufferA, bloomBufferB])
      gl.deleteFramebuffer(buffer);
    gl.deleteVertexArray(vao);
    for (const item of [room, down, blur, composite])
      gl.deleteProgram(item.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  return {
    frame,
    resize,
    setVisible: (value) => {
      visible = value;
      if (value) {
        last = 0;
        wake();
      }
    },
    pointerMove,
    pointerDown,
    pointerLeave,
    orientation,
    headMove,
    headRelease,
    setHeadActive: (value) => {
      headActive = value;
    },
    isHeadActive: () => headActive,
    resetClock: () => {
      last = 0;
    },
    dispose,
  };
}
