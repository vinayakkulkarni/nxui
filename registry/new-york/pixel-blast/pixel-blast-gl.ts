import {
  CELL_FRAGMENT,
  MAIN_FRAGMENT,
  MAX_CLICKS,
  VERTEX,
} from './pixel-blast-shaders';
import type {
  PixelBlastEngine,
  PixelBlastProps,
  PixelBlastSettings,
} from './types';

type Mat3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
type Rgb = [number, number, number];

interface CellTarget {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
}

interface LinkedProgram {
  program: WebGLProgram;
  loc: (name: string) => WebGLUniformLocation | null;
}

const INTRO_SECONDS = 1.8;
const SHAPES: Record<string, number> = {
  square: 0,
  circle: 1,
  triangle: 2,
  diamond: 3,
  cross: 4,
  ring: 5,
};
const HOVERS: Record<string, number> = { none: 0, grow: 1, reveal: 2 };

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function normalizePixelBlast(
  p: PixelBlastProps,
  reduce: boolean,
): PixelBlastSettings {
  const color = p.color ?? '#B497CF';
  return {
    variant: SHAPES[p.variant ?? 'square'] ?? 0,
    pixelSize: Math.max(0.5, p.pixelSize ?? 3),
    color,
    accentColor: p.accentColor || color,
    patternScale: p.patternScale ?? 2,
    patternDensity: p.patternDensity ?? 1,
    pixelSizeJitter: p.pixelSizeJitter ?? 0,
    enableRipples: p.enableRipples ?? true,
    rippleIntensityScale: p.rippleIntensityScale ?? 1,
    rippleThickness: Math.max(0.001, p.rippleThickness ?? 0.1),
    rippleSpeed: p.rippleSpeed ?? 0.3,
    autoPauseOffscreen: p.autoPauseOffscreen ?? true,
    speed: p.speed ?? 0.5,
    transparent: p.transparent ?? true,
    edgeFade: clamp(p.edgeFade ?? 0.5, 0, 1),
    noiseAmount: p.noiseAmount ?? 0,
    softness: clamp(p.softness ?? 0.6, 0, 1),
    smoothing: clamp(p.smoothing ?? 1, 0, 1),
    glow: clamp(p.glow ?? 0.4, 0, 2),
    twinkle: clamp(p.twinkle ?? 0.25, 0, 1),
    drift: p.drift ?? 0.2,
    driftAngle: p.driftAngle ?? 30,
    hoverEffect: HOVERS[p.hoverEffect ?? 'reveal'] ?? 0,
    hoverRadius: Math.max(10, p.hoverRadius ?? 140),
    autoRipple: Math.max(0, p.autoRipple ?? 0),
    tiltX: clamp(p.tiltX ?? 0, -70, 70),
    tiltY: clamp(p.tiltY ?? 0, -70, 70),
    intro: p.intro ?? true,
    variation: p.variation,
    lightMode: p.lightMode ?? false,
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
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms.set(name, gl.getUniformLocation(program, name));
  }
  return { program, loc: (name) => uniforms.get(name) ?? null };
}

const colorCache = new Map<string, Rgb>();

function parseHex(hex: string): Rgb {
  let h = String(hex || '#ffffff')
    .replace('#', '')
    .trim();
  if (h.length === 3 || h.length === 4) {
    h = h
      .slice(0, 3)
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = Number.parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(num)) return [1, 1, 1];
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

function hexToRgb(hex: string): Rgb {
  const cached = colorCache.get(hex);
  if (cached) return cached;
  const rgb = parseHex(hex);
  if (colorCache.size > 64) colorCache.clear();
  colorCache.set(hex, rgb);
  return rgb;
}

function randomFloat(): number {
  if (globalThis.crypto?.getRandomValues) {
    const u32 = new Uint32Array(1);
    globalThis.crypto.getRandomValues(u32);
    return (u32[0] ?? 0) / 4_294_967_295;
  }
  return Math.random();
}

function invert3(m: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C || 1;
  return [
    A / det,
    -(b * i - c * h) / det,
    (b * f - c * e) / det,
    B / det,
    (a * i - c * g) / det,
    -(a * f - c * d) / det,
    C / det,
    -(a * h - b * g) / det,
    (a * e - b * d) / det,
  ];
}

function multiply3(x: Mat3, y: Mat3): Mat3 {
  const [a0, a1, a2, a3, a4, a5, a6, a7, a8] = x;
  const [b0, b1, b2, b3, b4, b5, b6, b7, b8] = y;
  return [
    a0 * b0 + a1 * b3 + a2 * b6,
    a0 * b1 + a1 * b4 + a2 * b7,
    a0 * b2 + a1 * b5 + a2 * b8,
    a3 * b0 + a4 * b3 + a5 * b6,
    a3 * b1 + a4 * b4 + a5 * b7,
    a3 * b2 + a4 * b5 + a5 * b8,
    a6 * b0 + a7 * b3 + a8 * b6,
    a6 * b1 + a7 * b4 + a8 * b7,
    a6 * b2 + a7 * b5 + a8 * b8,
  ];
}

function planeFor(
  tiltX: number,
  tiltY: number,
  width: number,
  height: number,
): Mat3 {
  const ax = (tiltX * Math.PI) / 180;
  const ay = (tiltY * Math.PI) / 180;
  const depth = Math.max(width, height) * 1.25;
  const cx = width / 2;
  const cy = height / 2;
  const tilt: Mat3 = [
    Math.cos(ay),
    0,
    0,
    Math.sin(ax) * Math.sin(ay),
    Math.cos(ax),
    0,
    (Math.sin(ay) * Math.cos(ax)) / depth,
    -Math.sin(ax) / depth,
    1,
  ];
  const forward = multiply3(multiply3([1, 0, cx, 0, 1, cy, 0, 0, 1], tilt), [
    1,
    0,
    -cx,
    0,
    1,
    -cy,
    0,
    0,
    1,
  ]);
  return invert3(forward);
}

export function createPixelBlast(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  read: () => PixelBlastSettings,
): PixelBlastEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;
  const cellShader = link(gl, CELL_FRAGMENT);
  const mainShader = link(gl, MAIN_FRAGMENT);
  if (!cellShader || !mainShader) return null;
  const cu = cellShader.loc;
  const mu = mainShader.loc;
  const vao = gl.createVertexArray();

  const makeTarget = (): CellTarget => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    return { texture, framebuffer };
  };
  const targets: [CellTarget, CellTarget] = [makeTarget(), makeTarget()];
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const initial = read();
  const reduce = initial.reduce;
  const view: {
    width: number;
    height: number;
    ratio: number;
    plane: Mat3 | null;
    tiltKey: string;
  } = { width: 1, height: 1, ratio: 1, plane: null, tiltKey: '' };
  const cells = { x: 0, y: 0, w: 1, h: 1, key: '' };
  const pointer = { x: 0, y: 0, inside: false };
  const mouse = { x: 0, y: 0, ready: false };
  const clickPos = new Float32Array(MAX_CLICKS * 2).fill(-1);
  const clickAt = new Float32Array(MAX_CLICKS);
  const clickAge = new Float32Array(MAX_CLICKS);
  const planeClicks = new Float32Array(MAX_CLICKS * 2);
  const timeOffset =
    typeof initial.variation === 'number'
      ? initial.variation * 37
      : randomFloat() * 1000;
  let clickIndex = 0;
  let current: 0 | 1 = 0;
  let fresh = true;
  let elapsed = 0;
  let clock = 0;
  let presence = 0;
  let driftX = 0;
  let driftY = 0;
  let introClock = initial.intro && !reduce ? 0 : 1;
  let nextAuto = 1.2;
  let raf = 0;
  let last = 0;
  let visible = true;
  let quiet = 0;
  let destroyed = false;

  const patternTime = (s: PixelBlastSettings) => timeOffset + elapsed * s.speed;

  const toPlane = (x: number, y: number): [number, number] => {
    const m = view.plane;
    if (!m) return [x, y];
    const h = canvas.height;
    const cy = h - y;
    const z = m[6] * x + m[7] * cy + m[8];
    if (z <= 1e-4) return [-1e6, -1e6];
    return [
      (m[0] * x + m[1] * cy + m[2]) / z,
      h - (m[3] * x + m[4] * cy + m[5]) / z,
    ];
  };

  const layoutCells = (s: PixelBlastSettings) => {
    const cps = 8 * s.pixelSize * view.ratio;
    const w = canvas.width;
    const h = canvas.height;
    let minX = -w / 2;
    let maxX = w / 2;
    let minY = -h / 2;
    let maxY = h / 2;
    if (view.plane) {
      const corners: [number, number][] = [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
        [w / 2, 0],
        [w / 2, h],
        [0, h / 2],
        [w, h / 2],
      ];
      minX = Infinity;
      maxX = -Infinity;
      minY = Infinity;
      maxY = -Infinity;
      for (const [x, y] of corners) {
        const [qx, qy] = toPlane(x, y);
        if (qx < -1e5) continue;
        minX = Math.min(minX, qx - w / 2);
        maxX = Math.max(maxX, qx - w / 2);
        minY = Math.min(minY, qy - h / 2);
        maxY = Math.max(maxY, qy - h / 2);
      }
      if (!Number.isFinite(minX)) {
        minX = -w / 2;
        maxX = w / 2;
        minY = -h / 2;
        maxY = h / 2;
      }
    }
    const x0 = Math.floor((minX - cps) / cps);
    const x1 = Math.floor((maxX + cps) / cps);
    const y0 = Math.floor((minY - cps) / cps);
    const y1 = Math.floor((maxY + cps) / cps);
    const width = Math.max(1, Math.min(2048, x1 - x0 + 1));
    const height = Math.max(1, Math.min(2048, y1 - y0 + 1));
    const key = `${x0}:${y0}:${width}:${height}`;
    if (key === cells.key) return;
    cells.key = key;
    cells.x = x0;
    cells.y = y0;
    cells.w = width;
    cells.h = height;
    for (const target of targets) {
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    }
    fresh = true;
  };

  const stepCells = (s: PixelBlastSettings, decay: number) => {
    for (let k = 0; k < MAX_CLICKS; k++) {
      const cx = clickPos[k * 2] ?? -1;
      if (cx < 0) {
        planeClicks[k * 2] = -1;
        planeClicks[k * 2 + 1] = -1;
        continue;
      }
      const [px, py] = toPlane(cx, clickPos[k * 2 + 1] ?? 0);
      planeClicks[k * 2] = Math.max(px, 0);
      planeClicks[k * 2 + 1] = py;
    }
    const [mx, my] = toPlane(mouse.x, mouse.y);
    const source = targets[current];
    const target = targets[current === 0 ? 1 : 0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, cells.w, cells.h);
    gl.disable(gl.BLEND);
    gl.useProgram(cellShader.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform1i(cu('uPrev'), 0);
    gl.uniform2f(cu('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(cu('uTime'), patternTime(s));
    gl.uniform1f(cu('uPixelSize'), s.pixelSize * view.ratio);
    gl.uniform1f(cu('uScale'), s.patternScale);
    gl.uniform1f(cu('uDensity'), s.patternDensity);
    gl.uniform1i(cu('uEnableRipples'), s.enableRipples ? 1 : 0);
    gl.uniform1f(cu('uRippleSpeed'), s.rippleSpeed);
    gl.uniform1f(cu('uRippleThickness'), s.rippleThickness);
    gl.uniform1f(cu('uRippleIntensity'), s.rippleIntensityScale);
    gl.uniform2fv(cu('uClickPos'), planeClicks);
    gl.uniform1fv(cu('uClickAge'), clickAge);
    gl.uniform2i(cu('uOrigin'), cells.x, cells.y);
    gl.uniform2f(cu('uDrift'), driftX, driftY);
    gl.uniform1i(cu('uHover'), s.hoverEffect);
    gl.uniform2f(cu('uMouse'), mx, my);
    gl.uniform1f(cu('uMouseRadius'), s.hoverRadius * view.ratio);
    gl.uniform1f(cu('uMousePresence'), presence);
    gl.uniform1f(cu('uIntro'), introClock);
    gl.uniform1f(cu('uDecay'), decay);
    gl.uniform1f(cu('uFresh'), fresh ? 1 : 0);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    current = current === 0 ? 1 : 0;
    fresh = false;
  };

  const draw = () => {
    const s = read();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(mainShader.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targets[current].texture);
    gl.uniform1i(mu('uCells'), 0);
    gl.uniform3fv(mu('uColor'), hexToRgb(s.color));
    gl.uniform3fv(mu('uAccent'), hexToRgb(s.accentColor));
    gl.uniform2f(mu('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(mu('uTime'), patternTime(s));
    gl.uniform1f(mu('uClock'), clock);
    gl.uniform1f(mu('uPixelSize'), s.pixelSize * view.ratio);
    gl.uniform1f(mu('uPixelJitter'), s.pixelSizeJitter);
    gl.uniform1f(mu('uEdgeFade'), s.edgeFade);
    gl.uniform1i(mu('uShapeType'), s.variant);
    gl.uniform2i(mu('uOrigin'), cells.x, cells.y);
    gl.uniform2i(mu('uCellCount'), cells.w, cells.h);
    gl.uniform1f(mu('uSoftness'), s.softness);
    gl.uniform1f(mu('uSmoothing'), s.smoothing);
    gl.uniform1f(mu('uGlow'), s.glow);
    gl.uniform1f(mu('uTwinkle'), reduce ? 0 : s.twinkle);
    gl.uniform1f(mu('uLightMode'), s.lightMode ? 1 : 0);
    gl.uniform1f(mu('uTransparent'), s.transparent ? 1 : 0);
    gl.uniform1f(mu('uNoise'), s.noiseAmount);
    gl.uniform1i(mu('uHover'), s.hoverEffect);
    gl.uniform1f(mu('uTilted'), view.plane ? 1 : 0);
    const m = view.plane;
    if (m) {
      gl.uniformMatrix3fv(mu('uPlane'), false, [
        m[0],
        m[3],
        m[6],
        m[1],
        m[4],
        m[7],
        m[2],
        m[5],
        m[8],
      ]);
    }
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  const updatePlane = (s: PixelBlastSettings) => {
    view.plane =
      s.tiltX || s.tiltY
        ? planeFor(s.tiltX, s.tiltY, canvas.width, canvas.height)
        : null;
    view.tiltKey = `${s.tiltX}:${s.tiltY}:${canvas.width}:${canvas.height}`;
  };

  const addRipple = (x: number, y: number) => {
    clickPos[clickIndex * 2] = x * view.ratio;
    clickPos[clickIndex * 2 + 1] = (view.height - y) * view.ratio;
    clickAt[clickIndex] = clock;
    clickIndex = (clickIndex + 1) % MAX_CLICKS;
    wake();
  };

  const frame = (now: number) => {
    raf = 0;
    if (destroyed) return;
    const s = read();
    if (!visible && s.autoPauseOffscreen) return;
    if (document.hidden) return;
    const dt = last ? clamp((now - last) / 1000, 0, 1 / 20) : 0;
    last = now;
    if (!reduce) elapsed += dt;
    clock += dt;
    if (!reduce && s.drift) {
      const angle = (s.driftAngle * Math.PI) / 180;
      driftX += Math.cos(angle) * s.drift * dt * 0.05;
      driftY += Math.sin(angle) * s.drift * dt * 0.05;
    }
    if (!reduce && s.enableRipples && s.autoRipple > 0 && introClock >= 1) {
      nextAuto -= dt;
      if (nextAuto <= 0) {
        nextAuto = s.autoRipple * (0.7 + Math.random() * 0.6);
        addRipple(
          (0.15 + Math.random() * 0.7) * view.width,
          (0.15 + Math.random() * 0.7) * view.height,
        );
      }
    }
    for (let k = 0; k < MAX_CLICKS; k++) {
      clickAge[k] = (clock - (clickAt[k] ?? 0)) * 0.5;
    }
    const targetX = pointer.x * view.ratio;
    const targetY = (view.height - pointer.y) * view.ratio;
    const follow = 1 - Math.exp(-dt / 0.08);
    if (pointer.inside) {
      mouse.x += (targetX - mouse.x) * follow;
      mouse.y += (targetY - mouse.y) * follow;
    }
    presence +=
      ((pointer.inside ? 1 : 0) - presence) * (1 - Math.exp(-dt / 0.25));
    const key = `${s.tiltX}:${s.tiltY}:${canvas.width}:${canvas.height}`;
    if (key !== view.tiltKey) updatePlane(s);
    layoutCells(s);
    stepCells(s, s.hoverEffect ? Math.exp(-dt / 0.45) : 0);
    draw();
    if (introClock < 1) {
      introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
    }
    let busy =
      !reduce &&
      (s.speed !== 0 ||
        s.drift !== 0 ||
        s.twinkle > 0 ||
        (s.autoRipple > 0 && s.enableRipples));
    busy = busy || introClock < 1 || presence > 0.001;
    for (let k = 0; k < MAX_CLICKS; k++) {
      busy = busy || ((clickPos[k * 2] ?? -1) >= 0 && (clickAge[k] ?? 0) < 8);
    }
    quiet = busy ? 0 : quiet + dt;
    if (quiet < 1.5) raf = requestAnimationFrame(frame);
  };

  function wake() {
    quiet = 0;
    if (destroyed) return;
    if (!raf && (visible || !read().autoPauseOffscreen) && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

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

  const resize = () => {
    const s = read();
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    if (!mouse.ready) {
      mouse.ready = true;
      mouse.x = canvas.width / 2;
      mouse.y = canvas.height / 2;
    }
    updatePlane(s);
    layoutCells(s);
    stepCells(s, 0);
    draw();
    wake();
  };

  return {
    resize,
    wake,
    setVisible(next) {
      visible = next;
      if (visible) wake();
    },
    pointerMove(event) {
      const { x, y, inside } = locate(event);
      const was = pointer.inside;
      pointer.inside = inside;
      if (inside) {
        pointer.x = x;
        pointer.y = y;
        if (!was) {
          mouse.x = x * view.ratio;
          mouse.y = (view.height - y) * view.ratio;
        }
      }
      if (inside || was) wake();
    },
    pointerDown(event) {
      const { x, y, inside } = locate(event);
      if (!inside || reduce || !read().enableRipples) return;
      addRipple(x, y);
    },
    pointerLeave() {
      pointer.inside = false;
      wake();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      for (const target of targets) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      gl.deleteVertexArray(vao);
      gl.deleteProgram(cellShader.program);
      gl.deleteProgram(mainShader.program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
