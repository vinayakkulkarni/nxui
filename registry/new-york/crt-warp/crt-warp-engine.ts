import {
  CRT_BLUR,
  CRT_CONTENT,
  CRT_DISPLAY,
  CRT_GLOW,
} from './crt-warp-shaders';
import {
  CELL_ASPECT,
  FLIP_SECONDS,
  INTRO_SECONDS,
  TAU,
  clamp,
  createProgram,
  createTarget,
  deleteTarget,
  easeInOut,
  introAt,
  seedFor,
} from './crt-warp-gl';
import type { CrtWarpEngine, CrtWarpSettings, CrtWarpTarget } from './types';

const CONTENT_UNIFORMS = [
  'uGrid',
  'uTime',
  'uAmplitude',
  'uFrequency',
  'uLevels',
  'uDecay',
  'uReveal',
  'uRise',
  'uSeed',
  'uPrevious',
];

const DISPLAY_UNIFORMS = [
  'uContent',
  'uGlow',
  'uGrid',
  'uResolution',
  'uPixel',
  'uTime',
  'uColor',
  'uBackground',
  'uOpaque',
  'uLight',
  'uLines',
  'uScanline',
  'uCurve',
  'uCorners',
  'uMaskType',
  'uMask',
  'uBloom',
  'uBrightness',
  'uNoise',
  'uFlicker',
  'uInterference',
  'uVignette',
  'uShift',
  'uWarm',
  'uFocus',
  'uStatic',
  'uRoll',
  'uTear',
  'uGain',
  'uMagnet',
  'uPurity',
];

/**
 * Builds the CRT renderer on a canvas. Returns null when WebGL2 or a shader
 * is unavailable. `getSettings` must return the same object until a prop
 * changes, so the idle detector can stop drawing a frozen picture.
 */
export function createCrtWarpEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => CrtWarpSettings,
): CrtWarpEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const content = createProgram(gl, CRT_CONTENT, CONTENT_UNIFORMS);
  const glowSource = createProgram(gl, CRT_GLOW, ['uContent', 'uSize']);
  const blur = createProgram(gl, CRT_BLUR, [
    'uSource',
    'uSize',
    'uDirection',
    'uSigma',
  ]);
  const display = createProgram(gl, CRT_DISPLAY, DISPLAY_UNIFORMS);
  if (!content || !glowSource || !blur || !display) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
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

  const state = {
    width: 1,
    height: 1,
    pixel: 1,
    cssWidth: 1,
    cssHeight: 1,
    grid: [0, 0],
    cells: [null, null] as (CrtWarpTarget | null)[],
    glows: [null, null] as (CrtWarpTarget | null)[],
    flip: 0,
    time: 0,
    clock: 0,
    last: 0,
    visible: false,
    introAt: -1,
    flipAt: -1,
    flipped: true,
    channel: 0,
    pointer: [0.5, 0.5],
    magnet: [0.5, 0.5, 0, 0, 0],
    magnetGoal: 0,
    lost: false,
    quiet: 0,
    seen: null as CrtWarpSettings | null,
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    state.lost = true;
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const ensureTargets = () => {
    const s = getSettings();
    const cols = s.columns;
    const rows = clamp(
      Math.round(
        (cols * CELL_ASPECT * state.height) / Math.max(state.width, 1),
      ),
      4,
      300,
    );
    if (cols !== state.grid[0] || rows !== state.grid[1]) {
      state.cells.forEach((target) => deleteTarget(gl, target));
      state.cells = [
        createTarget(gl, cols, rows),
        createTarget(gl, cols, rows),
      ];
      state.grid = [cols, rows];
    }
    const gw = Math.max(1, Math.round(state.width / 4));
    const gh = Math.max(1, Math.round(state.height / 4));
    const glow = state.glows[0];
    if (!glow || glow.width !== gw || glow.height !== gh) {
      state.glows.forEach((target) => deleteTarget(gl, target));
      state.glows = [createTarget(gl, gw, gh), createTarget(gl, gw, gh)];
    }
  };

  const applySize = () => {
    const s = getSettings();
    const ratio = Math.min(window.devicePixelRatio || 1, s.dpr);
    const width = Math.max(1, Math.round(state.cssWidth * ratio));
    const height = Math.max(1, Math.round(state.cssHeight * ratio));
    state.pixel = ratio;
    if (width === state.width && height === state.height) return;
    state.quiet = 0;
    state.width = width;
    state.height = height;
    canvas.width = width;
    canvas.height = height;
  };

  const draw = (
    target: CrtWarpTarget | null,
    width: number,
    height: number,
  ) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, width, height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const bindTexture = (
    unit: number,
    texture: WebGLTexture,
    location: WebGLUniformLocation | null,
  ) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(location, unit);
  };

  const render = (dt: number, reduced: boolean) => {
    const s = getSettings();
    ensureTargets();
    const cols = state.grid[0] ?? 1;
    const rows = state.grid[1] ?? 1;
    const seed = seedFor(s.variation + state.channel);
    const introClock = state.introAt < 0 ? 0 : state.clock - state.introAt;
    const [reveal, warm, focus] =
      s.intro && !reduced ? introAt(introClock) : [1, 1, 1];

    const previous = state.cells[state.flip];
    const next = state.cells[1 - state.flip];
    const glowA = state.glows[0];
    const glowB = state.glows[1];
    if (!previous || !next || !glowA || !glowB) return;

    const c = content.uniforms;
    gl.useProgram(content.program);
    gl.uniform2f(c.uGrid ?? null, cols, rows);
    gl.uniform1f(c.uTime ?? null, state.time);
    gl.uniform1f(c.uAmplitude ?? null, s.amplitude);
    gl.uniform1f(c.uFrequency ?? null, s.frequency);
    gl.uniform1f(c.uLevels ?? null, s.levels);
    gl.uniform1f(c.uDecay ?? null, reduced ? 0 : s.persistence ** (dt * 60));
    gl.uniform1f(c.uReveal ?? null, reveal);
    gl.uniform1f(c.uRise ?? null, reveal < 1 ? dt / 0.22 : 1);
    gl.uniform4f(c.uSeed ?? null, seed[0], seed[1], seed[2], seed[3]);
    bindTexture(0, previous.texture, c.uPrevious ?? null);
    draw(next, cols, rows);
    state.flip = 1 - state.flip;

    gl.useProgram(glowSource.program);
    gl.uniform2f(glowSource.uniforms.uSize ?? null, glowA.width, glowA.height);
    bindTexture(0, next.texture, glowSource.uniforms.uContent ?? null);
    draw(glowA, glowA.width, glowA.height);
    const sigma = Math.max(0.6, (glowA.height / 48) * s.bloomRadius);
    const b = blur.uniforms;
    gl.useProgram(blur.program);
    gl.uniform2f(b.uSize ?? null, glowA.width, glowA.height);
    gl.uniform1f(b.uSigma ?? null, sigma);
    gl.uniform2f(b.uDirection ?? null, 1, 0);
    bindTexture(0, glowA.texture, b.uSource ?? null);
    draw(glowB, glowB.width, glowB.height);
    gl.uniform2f(b.uDirection ?? null, 0, 1);
    bindTexture(0, glowB.texture, b.uSource ?? null);
    draw(glowA, glowA.width, glowA.height);

    let roll = 0;
    let tear = 0;
    let staticNoise = 0;
    let gain = 1;
    if (state.flipAt >= 0) {
      const t = state.clock - state.flipAt;
      if (!state.flipped && t >= 0.22) {
        state.flipped = true;
        state.channel += 1;
      }
      if (t >= FLIP_SECONDS) {
        state.flipAt = -1;
      } else {
        const p = t / FLIP_SECONDS;
        roll = easeInOut(p);
        tear = Math.sin(Math.PI * clamp(t / 0.5, 0, 1)) * 0.6;
        staticNoise = Math.sin(Math.PI * clamp(t / 0.55, 0, 1)) * 0.75;
        gain = 1 - 0.3 * Math.sin(Math.PI * p);
      }
    }

    const u = display.uniforms;
    const at = (name: string) => u[name] ?? null;
    gl.useProgram(display.program);
    bindTexture(0, next.texture, at('uContent'));
    bindTexture(1, glowA.texture, at('uGlow'));
    gl.uniform2f(at('uGrid'), cols, rows);
    gl.uniform2f(at('uResolution'), state.width, state.height);
    gl.uniform1f(at('uPixel'), state.pixel);
    gl.uniform1f(at('uTime'), reduced ? 0 : state.clock);
    gl.uniform3f(at('uColor'), s.ink[0], s.ink[1], s.ink[2]);
    const paper = s.paper ?? [0, 0, 0];
    gl.uniform3f(at('uBackground'), paper[0], paper[1], paper[2]);
    gl.uniform1f(at('uOpaque'), s.paper ? 1 : 0);
    gl.uniform1f(at('uLight'), s.lightMode ? 1 : 0);
    gl.uniform1f(at('uLines'), s.lines);
    gl.uniform1f(at('uScanline'), s.scanline);
    gl.uniform1f(at('uCurve'), s.curve);
    gl.uniform1f(at('uCorners'), s.corners);
    gl.uniform1i(at('uMaskType'), s.mask);
    gl.uniform1f(at('uMask'), s.maskStrength);
    gl.uniform1f(at('uBloom'), s.bloom);
    gl.uniform1f(at('uBrightness'), s.brightness);
    gl.uniform1f(at('uNoise'), s.noise);
    gl.uniform1f(at('uFlicker'), reduced ? 0 : s.flicker);
    gl.uniform1f(at('uInterference'), s.interference);
    gl.uniform1f(at('uVignette'), s.vignette);
    gl.uniform1f(at('uShift'), s.rgbShift);
    gl.uniform1f(at('uWarm'), warm);
    gl.uniform1f(at('uFocus'), focus);
    gl.uniform1f(at('uStatic'), staticNoise);
    gl.uniform1f(at('uRoll'), roll);
    gl.uniform1f(at('uTear'), tear);
    gl.uniform1f(at('uGain'), gain);
    const m = state.magnet;
    gl.uniform4f(
      at('uMagnet'),
      m[0] ?? 0.5,
      1 - (m[1] ?? 0.5),
      (m[4] ?? 0) * s.mouseStrength * 2,
      0.24,
    );
    gl.uniform1f(at('uPurity'), s.mask > 0 ? 1 : 0);
    draw(null, state.width, state.height);
  };

  const stepMagnet = (dt: number, goal: number) => {
    const m = state.magnet;
    const omega = TAU / 0.3;
    for (let i = 0; i < 2; i++) {
      const pos = m[i] ?? 0;
      const vel = m[2 + i] ?? 0;
      const accel =
        -omega * omega * (pos - (state.pointer[i] ?? 0)) - 2 * omega * vel;
      m[2 + i] = vel + accel * dt;
      m[i] = pos + (m[2 + i] ?? 0) * dt;
    }
    m[4] = (m[4] ?? 0) + (goal - (m[4] ?? 0)) * (1 - Math.exp(-dt / 0.18));
  };

  const frame = (now: number, reduced: boolean) => {
    if (!state.visible || state.lost) {
      state.last = now;
      return;
    }
    const s = getSettings();
    const interval = 1000 / s.fps;
    if (state.last && now - state.last < interval - 1) return;
    const dt = state.last ? Math.min((now - state.last) / 1000, 0.1) : 1 / 60;
    state.last = now;
    state.clock += dt;
    if (state.introAt < 0) state.introAt = state.clock;
    if (!s.paused && !reduced) state.time += dt * s.speed;

    const goal = s.mouseReact && !reduced ? state.magnetGoal : 0;
    stepMagnet(dt, goal);

    const m = state.magnet;
    const strength = m[4] ?? 0;
    const still = s.paused || reduced;
    const settling =
      Math.abs(strength - goal) > 0.002 ||
      (strength > 0.002 &&
        (Math.abs(m[2] ?? 0) + Math.abs(m[3] ?? 0) > 0.0005 ||
          Math.abs((m[0] ?? 0) - (state.pointer[0] ?? 0)) > 0.0005));
    const transient =
      state.flipAt >= 0 ||
      (s.intro && !reduced && state.clock - state.introAt < INTRO_SECONDS) ||
      settling;
    if (state.seen !== s || transient || !still) state.quiet = 0;
    else state.quiet += 1;
    state.seen = s;
    if (state.quiet > 90) return;

    applySize();
    render(dt, reduced);
  };

  return {
    frame,
    resize(cssWidth: number, cssHeight: number) {
      state.cssWidth = cssWidth;
      state.cssHeight = cssHeight;
      applySize();
    },
    pointerMove(x: number, y: number, inside: boolean) {
      if (inside) {
        if (state.magnetGoal === 0 && (state.magnet[4] ?? 0) < 0.02) {
          state.magnet[0] = x;
          state.magnet[1] = y;
          state.magnet[2] = 0;
          state.magnet[3] = 0;
        }
        state.pointer = [x, y];
      }
      state.magnetGoal = inside ? 1 : 0;
    },
    pointerLeave() {
      state.magnetGoal = 0;
    },
    flipChannel(reduced: boolean) {
      if (reduced) {
        state.channel += 1;
        state.quiet = 0;
        return;
      }
      if (state.flipAt >= 0) return;
      state.flipAt = state.clock;
      state.flipped = false;
    },
    setVisible(visible: boolean) {
      state.visible = visible;
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      state.cells.forEach((target) => deleteTarget(gl, target));
      state.glows.forEach((target) => deleteTarget(gl, target));
      [content, glowSource, blur, display].forEach((item) =>
        gl.deleteProgram(item.program),
      );
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
