import {
  LIGHTNING_FRAGMENT,
  LIGHTNING_MAX_BOLTS,
  LIGHTNING_MAX_STRIKES,
  LIGHTNING_VERTEX,
} from './lightning-shaders';
import type {
  LightningEngine,
  LightningProps,
  LightningSettings,
  LightningStrike,
} from './types';

type Vec2 = [number, number];
type Vec3 = [number, number, number];

const LEADER = 0.11;
const LIFE = 1.3;
const FALLBACK_RGB: Vec3 = [0.5, 0.6, 1];

const UNIFORMS = [
  'uResolution',
  'uPhase',
  'uColor',
  'uIntensity',
  'uSize',
  'uThickness',
  'uGlow',
  'uFlicker',
  'uBranches',
  'uXOffset',
  'uAngle',
  'uSpread',
  'uBolts',
  'uPointer',
  'uStrikes',
  'uStrikeInfo',
  'uFlash',
  'uIntro',
  'uLight',
  'uFade',
  'uOpacity',
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function normalizeLightning(
  props: LightningProps,
  reduce: boolean,
): LightningSettings {
  return {
    color: props.color ?? '#4d6bff',
    bolts: props.bolts ?? 1,
    spread: props.spread ?? 0.6,
    branches: props.branches ?? 0.5,
    xOffset: props.xOffset ?? 0,
    angle: props.angle ?? 0,
    size: props.size ?? 1,
    thickness: props.thickness ?? 1,
    glow: props.glow ?? 1,
    intensity: props.intensity ?? 1,
    speed: props.speed ?? 1,
    flicker: props.flicker ?? 0.6,
    mouseInteraction: props.mouseInteraction ?? true,
    mouseStrength: props.mouseStrength ?? 1,
    clickStrike: props.clickStrike ?? true,
    intro: props.intro ?? true,
    fade: props.fade ?? 0,
    opacity: props.opacity ?? 1,
    lightMode: props.lightMode ?? false,
    paused: props.paused ?? false,
    dpr: props.dpr,
    reduce,
  };
}

function toRgb(color: string): Vec3 {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color).trim());
  const raw = match?.[1];
  if (!raw) return FALLBACK_RGB;
  const hex =
    raw.length === 3 ? raw.replace(/./g, (digit) => digit + digit) : raw;
  return [
    Number.parseInt(hex.slice(0, 2), 16) / 255,
    Number.parseInt(hex.slice(2, 4), 16) / 255,
    Number.parseInt(hex.slice(4, 6), 16) / 255,
  ];
}

function smootherstep(t: number) {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function createLightning(
  canvas: HTMLCanvasElement,
  getSettings: () => LightningSettings,
): LightningEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) return null;

  const program = gl.createProgram();
  const vertex = compile(gl, gl.VERTEX_SHADER, LIGHTNING_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, LIGHTNING_FRAGMENT);
  if (!program || !vertex || !fragment) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = new Map<string, WebGLUniformLocation | null>(
    UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
  );
  const u = (name: string) => uniforms.get(name) ?? null;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, 'aPosition');

  const view = { width: 1, height: 1 };
  const pointer = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tx: 0,
    ty: 0,
    presence: 0,
    inside: false,
  };
  const strikes: LightningStrike[] = Array.from(
    { length: LIGHTNING_MAX_STRIKES },
    () => ({ x: 0, y: 0, born: -1, seed: 0, reach: 2 }),
  );
  const strikeData = new Float32Array(LIGHTNING_MAX_STRIKES * 4);
  const infoData = new Float32Array(LIGHTNING_MAX_STRIKES * 4);
  const initial = getSettings();
  let next = 0;
  let phase = 0.21;
  let introStart: number | null = initial.intro && !initial.reduce ? -1 : null;
  let visible = true;
  let raf = 0;
  let last = 0;
  let disposed = false;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(
      getSettings().dpr ?? window.devicePixelRatio ?? 1,
      2,
    );
    view.width = Math.max(1, rect.width);
    view.height = Math.max(1, rect.height);
    const width = Math.max(1, Math.round(view.width * ratio));
    const height = Math.max(1, Math.round(view.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const toUv = (x: number, y: number): Vec2 => [
    (2 * x - view.width) / view.height,
    (view.height - 2 * y) / view.height,
  ];

  const draw = (now: number) => {
    if (disposed) return;
    const s = getSettings();
    const rgb = toRgb(s.color);
    let flash = 0;
    strikes.forEach((strike, j) => {
      const age = strike.born < 0 ? -1 : (now - strike.born) / 1000;
      const base = j * 4;
      if (age < 0 || age > LIFE) {
        strikeData.fill(0, base, base + 4);
        infoData.fill(0, base, base + 4);
        return;
      }
      const progress = Math.min(1, age / LEADER);
      const since = age - LEADER;
      let env = 0.45 + 0.35 * progress;
      if (since >= 0) {
        env =
          1.8 * Math.exp(-since * 5.5) * (0.85 + 0.2 * Math.sin(since * 70));
        if (since > 0.17) env += Math.exp(-(since - 0.17) * 9);
        if (since > 0.33) env += 0.7 * Math.exp(-(since - 0.33) * 10);
        flash += 0.5 * Math.exp(-since * 9);
        if (since > 0.17) flash += 0.25 * Math.exp(-(since - 0.17) * 12);
      }
      env *= 1 - smootherstep((age - (LIFE - 0.4)) / 0.4);
      strikeData[base] = strike.x;
      strikeData[base + 1] = strike.y;
      strikeData[base + 2] = strike.reach * (1 - progress ** 1.6);
      strikeData[base + 3] = env;
      infoData[base] = strike.seed;
      infoData[base + 1] = strike.reach;
      infoData[base + 2] = since >= 0 ? 1 : 0;
      infoData[base + 3] = 0;
    });
    const introAmount =
      introStart === null
        ? 1
        : introStart < 0
          ? 0
          : Math.min(1, (now - introStart) / 420);
    const [px, py] = toUv(pointer.x, pointer.y);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(u('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(u('uPhase'), phase);
    gl.uniform3f(u('uColor'), rgb[0], rgb[1], rgb[2]);
    gl.uniform1f(u('uIntensity'), Math.max(0, s.intensity));
    gl.uniform1f(u('uSize'), Math.max(0.05, s.size));
    gl.uniform1f(u('uThickness'), Math.max(0, s.thickness));
    gl.uniform1f(u('uGlow'), Math.max(0.01, s.glow));
    gl.uniform1f(u('uFlicker'), s.reduce ? 0 : clamp01(s.flicker));
    gl.uniform1f(u('uBranches'), clamp01(s.branches));
    gl.uniform1f(u('uXOffset'), s.xOffset);
    gl.uniform1f(u('uAngle'), (s.angle * Math.PI) / 180);
    gl.uniform1f(u('uSpread'), s.spread);
    gl.uniform1i(
      u('uBolts'),
      Math.min(LIGHTNING_MAX_BOLTS, Math.max(1, Math.round(s.bolts))),
    );
    gl.uniform4f(
      u('uPointer'),
      px,
      py,
      pointer.presence,
      Math.max(0, s.mouseStrength),
    );
    gl.uniform4fv(u('uStrikes'), strikeData);
    gl.uniform4fv(u('uStrikeInfo'), infoData);
    gl.uniform1f(u('uFlash'), Math.min(1, flash));
    gl.uniform1f(u('uIntro'), introAmount);
    gl.uniform1f(u('uLight'), s.lightMode ? 1 : 0);
    gl.uniform1f(u('uFade'), clamp01(s.fade));
    gl.uniform1f(u('uOpacity'), clamp01(s.opacity));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const s = getSettings();
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (introStart !== null && introStart < 0) introStart = now;
    if (!s.paused && !s.reduce) {
      phase = (phase + (dt * Math.max(0, s.speed)) / 10) % 1;
    }
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let n = 0; n < steps; n++) {
      pointer.vx += (120 * (pointer.tx - pointer.x) - 19 * pointer.vx) * h;
      pointer.vy += (120 * (pointer.ty - pointer.y) - 19 * pointer.vy) * h;
      pointer.x += pointer.vx * h;
      pointer.y += pointer.vy * h;
    }
    const goal = s.mouseInteraction && pointer.inside && !s.reduce ? 1 : 0;
    pointer.presence +=
      (goal - pointer.presence) *
      (1 - Math.exp(-dt / (goal > pointer.presence ? 0.3 : 0.55)));
    draw(now);
    const striking = strikes.some(
      (strike) => strike.born >= 0 && now - strike.born < LIFE * 1000 + 50,
    );
    const introducing = introStart !== null && now - introStart < 450;
    const moving = !s.paused && !s.reduce && s.speed > 0;
    const settling =
      Math.abs(goal - pointer.presence) > 0.002 ||
      Math.abs(pointer.vx) + Math.abs(pointer.vy) > 0.5;
    if (moving || striking || introducing || settling) {
      raf = requestAnimationFrame(frame);
    }
  };

  const wake = () => {
    if (raf || disposed || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const locate = (event: PointerEvent): [number, number, boolean] => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return [x, y, x >= 0 && y >= 0 && x <= rect.width && y <= rect.height];
  };

  const refresh = () => {
    if (disposed) return;
    resize();
    draw(performance.now());
    wake();
  };

  return {
    refresh,
    setVisible(nextVisible: boolean) {
      visible = nextVisible;
      if (visible) wake();
    },
    visibilityChange() {
      if (!document.hidden) wake();
    },
    pointerMove(event: PointerEvent) {
      const [x, y, inside] = locate(event);
      if (inside && !pointer.inside && pointer.presence < 0.02) {
        pointer.x = x;
        pointer.y = y;
        pointer.vx = 0;
        pointer.vy = 0;
      }
      pointer.tx = x;
      pointer.ty = y;
      pointer.inside = inside;
      if (getSettings().mouseInteraction) wake();
    },
    pointerOut(event: PointerEvent) {
      if (event.relatedTarget) return;
      pointer.inside = false;
      wake();
    },
    pointerDown(event: PointerEvent) {
      const s = getSettings();
      if (!s.clickStrike || s.reduce) return;
      const [x, y, inside] = locate(event);
      if (!inside) return;
      const [ux, uy] = toUv(x, y);
      const radians = (s.angle * Math.PI) / 180;
      const sa = Math.sin(radians);
      const ca = Math.cos(radians);
      const top = (view.width / view.height) * Math.abs(sa) + Math.abs(ca);
      const strike = strikes[next];
      next = (next + 1) % LIGHTNING_MAX_STRIKES;
      if (!strike) return;
      strike.x = ux;
      strike.y = uy;
      strike.reach = top - (-sa * ux + ca * uy) + 0.2;
      strike.born = performance.now();
      strike.seed = Math.random() * 100;
      wake();
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
