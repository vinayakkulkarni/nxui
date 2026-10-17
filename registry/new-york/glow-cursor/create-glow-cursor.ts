import {
  ADVECT,
  BLOOM_LEVELS,
  DISPLAY,
  DIVERGENCE,
  DOWN,
  FLOW,
  GRADIENT,
  MACCORMACK,
  PREFILTER,
  PRESSURE,
  PRESSURE_STEPS,
  QUALITY,
  SCALE,
  SPLAT,
  UP,
  VERTEX,
} from './glow-shaders';
import type { GlowCursorEngine, GlowCursorSettings } from './types';

type Rgb = [number, number, number];

interface GlTarget {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texel: [number, number];
}

interface GlPair {
  readonly read: GlTarget;
  readonly write: GlTarget;
  swap: () => void;
  targets: () => GlTarget[];
}

interface GlTargets {
  velocity: GlPair;
  dye: GlPair;
  forward: GlTarget;
  back: GlTarget;
  pressure: GlPair;
  divergence: GlTarget;
  bloom: GlTarget[];
}

interface GlPass {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}

interface GlPasses {
  splat: GlPass;
  advect: GlPass;
  maccormack: GlPass;
  divergence: GlPass;
  scale: GlPass;
  pressure: GlPass;
  gradient: GlPass;
  prefilter: GlPass;
  down: GlPass;
  up: GlPass;
  display: GlPass;
}

type Uniform = (name: string) => WebGLUniformLocation | null;

const DEFAULT_COLOR: Rgb = [0.37, 0.55, 1];

const toHsv = ([r, g, b]: Rgb): Rgb => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return [(hue * 60 + 360) % 360, max > 0 ? delta / max : 0, max];
};

const fromHsv = (hue: number, saturation: number, value: number): Rgb => {
  const h = (((hue % 360) + 360) % 360) / 60;
  const c = value * saturation;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = value - c;
  let rgb: Rgb;
  if (h < 1) rgb = [c, x, 0];
  else if (h < 2) rgb = [x, c, 0];
  else if (h < 3) rgb = [0, c, x];
  else if (h < 4) rgb = [0, x, c];
  else if (h < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return [rgb[0] + m, rgb[1] + m, rgb[2] + m];
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const buildPass = (
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  source: string,
): GlPass | null => {
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
  const program = gl.createProgram();
  if (!fragment || !program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info)
      uniforms.set(info.name, gl.getUniformLocation(program, info.name));
  }
  return { program, uniforms };
};

const buildPasses = (
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
): GlPasses | null => {
  const built: (GlPass | null)[] = [];
  const make = (source: string) => {
    const pass = buildPass(gl, vertexShader, source);
    built.push(pass);
    return pass;
  };
  const splat = make(SPLAT);
  const advect = make(ADVECT);
  const maccormack = make(MACCORMACK);
  const divergence = make(DIVERGENCE);
  const scale = make(SCALE);
  const pressure = make(PRESSURE);
  const gradient = make(GRADIENT);
  const prefilter = make(PREFILTER);
  const down = make(DOWN);
  const up = make(UP);
  const display = make(DISPLAY);
  if (
    !splat ||
    !advect ||
    !maccormack ||
    !divergence ||
    !scale ||
    !pressure ||
    !gradient ||
    !prefilter ||
    !down ||
    !up ||
    !display
  ) {
    for (const pass of built) if (pass) gl.deleteProgram(pass.program);
    return null;
  }
  return {
    splat,
    advect,
    maccormack,
    divergence,
    scale,
    pressure,
    gradient,
    prefilter,
    down,
    up,
    display,
  };
};

/**
 * Raw WebGL2 port of the React Bits GlowCursor fluid simulation: a light
 * emitter follows the pointer on a critically damped spring, splats velocity
 * and dye into a MacCormack-advected fluid, then shades it with a bloom chain.
 */
export function createGlowCursor(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => GlowCursorSettings,
): GlowCursorEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;

  const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX);
  if (!vertexShader) return null;
  const passes = buildPasses(gl, vertexShader);
  if (!passes) {
    gl.deleteShader(vertexShader);
    return null;
  }

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const probeContext = probe.getContext('2d', { willReadFrequently: true });

  const pointer = { x: 0, y: 0, inside: false };
  const emitter = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0 };
  const bursts: [number, number][] = [];
  let width = 1;
  let height = 1;
  let ratio = 1;
  let colorKey = '';
  let color: Rgb = DEFAULT_COLOR;
  let secondary: Rgb = [0.25, 0.3, 1];
  let ready = false;
  let active = -Infinity;
  let time = 0;
  let allocated = '';
  let targets: GlTargets | null = null;
  let raf = 0;
  let last = 0;
  let alive = true;
  let visible = true;

  const toRgb = (value: string, fallback: Rgb): Rgb => {
    if (!probeContext || !value) return fallback;
    const css = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
    probeContext.clearRect(0, 0, 1, 1);
    probeContext.fillStyle = '#000000';
    probeContext.fillStyle = css;
    probeContext.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = probeContext.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255];
  };

  const resolveColors = (s: GlowCursorSettings) => {
    const key = `${s.color}|${s.secondaryColor}`;
    if (key === colorKey) return;
    colorKey = key;
    color = toRgb(s.color, DEFAULT_COLOR);
    if (s.secondaryColor) {
      secondary = toRgb(s.secondaryColor, color);
    } else {
      const [hue, saturation, value] = toHsv(color);
      secondary = fromHsv(hue + 8, Math.min(1, saturation * 1.1 + 0.05), value);
    }
  };

  const createTarget = (
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    filter: number,
  ): GlTarget => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      w,
      h,
      0,
      format,
      gl.HALF_FLOAT,
      null,
    );
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo, width: w, height: h, texel: [1 / w, 1 / h] };
  };

  const createPair = (
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    filter: number,
  ): GlPair => {
    let read = createTarget(w, h, internalFormat, format, filter);
    let write = createTarget(w, h, internalFormat, format, filter);
    return {
      get read() {
        return read;
      },
      get write() {
        return write;
      },
      swap() {
        const next = read;
        read = write;
        write = next;
      },
      targets() {
        return [read, write];
      },
    };
  };

  const destroyTarget = (target: GlTarget) => {
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.fbo);
  };

  const release = () => {
    if (!targets) return;
    [
      ...targets.velocity.targets(),
      ...targets.dye.targets(),
      ...targets.pressure.targets(),
      targets.divergence,
      targets.forward,
      targets.back,
      ...targets.bloom,
    ].forEach(destroyTarget);
    targets = null;
  };

  const clearTargets = (t: GlTargets) => {
    gl.clearColor(0, 0, 0, 0);
    [
      ...t.velocity.targets(),
      ...t.dye.targets(),
      ...t.pressure.targets(),
    ].forEach((target) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
  };

  const allocate = (): GlTargets => {
    const s = getSettings();
    const key = `${s.quality}|${width}|${height}|${canvas.width}|${canvas.height}`;
    if (key === allocated && targets) return targets;
    release();
    allocated = key;
    const preset = QUALITY[s.quality] ?? QUALITY.high;
    const aspect = width / height;
    const dims = (base: number): [number, number] =>
      aspect >= 1
        ? [Math.round(base * aspect), base]
        : [base, Math.round(base / aspect)];
    const [simW, simH] = dims(preset.sim);
    let [dyeW, dyeH] = dims(preset.dye);
    const shrink = Math.min(1, canvas.width / dyeW, canvas.height / dyeH);
    dyeW = Math.max(2, Math.round(dyeW * shrink));
    dyeH = Math.max(2, Math.round(dyeH * shrink));
    const bloom: GlTarget[] = [];
    let bloomW = dyeW >> 1;
    let bloomH = dyeH >> 1;
    for (let i = 0; i < BLOOM_LEVELS; i++) {
      bloom.push(
        createTarget(
          Math.max(1, bloomW),
          Math.max(1, bloomH),
          gl.RGBA16F,
          gl.RGBA,
          gl.LINEAR,
        ),
      );
      bloomW >>= 1;
      bloomH >>= 1;
    }
    const next: GlTargets = {
      velocity: createPair(simW, simH, gl.RG16F, gl.RG, gl.LINEAR),
      dye: createPair(dyeW, dyeH, gl.RGBA16F, gl.RGBA, gl.LINEAR),
      forward: createTarget(dyeW, dyeH, gl.RGBA16F, gl.RGBA, gl.LINEAR),
      back: createTarget(dyeW, dyeH, gl.RGBA16F, gl.RGBA, gl.LINEAR),
      pressure: createPair(simW, simH, gl.R16F, gl.RED, gl.NEAREST),
      divergence: createTarget(simW, simH, gl.R16F, gl.RED, gl.NEAREST),
      bloom,
    };
    targets = next;
    return next;
  };

  const pixelRatio = (s: GlowCursorSettings) =>
    Math.min(
      window.devicePixelRatio || 1,
      Math.max(0.5, s.maxDevicePixelRatio || 2),
    );

  const resize = () => {
    const s = getSettings();
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    const r = pixelRatio(s);
    const pixelWidth = Math.max(1, Math.round(w * r));
    const pixelHeight = Math.max(1, Math.round(h * r));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    width = w;
    height = h;
    ratio = r;
    allocate();
  };

  const draw = (target: GlTarget | null) => {
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const use = (pass: GlPass, texel: [number, number]): Uniform => {
    gl.useProgram(pass.program);
    const u: Uniform = (name) => pass.uniforms.get(name) ?? null;
    const texelLocation = u('uTexel');
    if (texelLocation) gl.uniform2f(texelLocation, texel[0], texel[1]);
    return u;
  };

  const bind = (unit: number, target: GlTarget) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    return unit;
  };

  const splat = (
    pair: GlPair,
    from: [number, number],
    to: [number, number],
    radius: number,
    value: Rgb,
    mode: number,
    strength: number,
    wide = radius,
  ) => {
    const u = use(passes.splat, pair.read.texel);
    gl.uniform1i(u('uTarget'), bind(0, pair.read));
    gl.uniform1f(u('uAspect'), width / height);
    gl.uniform2f(u('uA'), from[0] / width, 1 - from[1] / height);
    gl.uniform2f(u('uB'), to[0] / width, 1 - to[1] / height);
    gl.uniform1f(u('uRadius'), radius / height);
    gl.uniform1f(u('uWide'), wide / height);
    gl.uniform3f(u('uValue'), value[0], value[1], value[2]);
    gl.uniform1f(u('uMode'), mode);
    gl.uniform1f(u('uStrength'), strength);
    draw(pair.write);
    pair.swap();
  };

  const toGrid = (t: GlTargets, vx: number, vy: number): Rgb => [
    (vx * t.velocity.read.width) / width,
    (-vy * t.velocity.read.height) / height,
    0,
  ];

  const lightRadius = (t: GlTargets, s: GlowCursorSettings) =>
    Math.max(s.trailWidth * 0.5, (height / t.dye.read.height) * 0.9);

  const emit = (
    t: GlTargets,
    s: GlowCursorSettings,
    dt: number,
    now: number,
  ) => {
    const reduce = s.reducedMotion;
    emitter.px = emitter.x;
    emitter.py = emitter.y;
    if (reduce || s.followSpeed >= 1) {
      emitter.x = pointer.x;
      emitter.y = pointer.y;
    } else {
      const omega = 10 + s.followSpeed * 50;
      const steps = Math.max(1, Math.ceil(dt / 0.004));
      const h = dt / steps;
      for (let k = 0; k < steps; k++) {
        emitter.vx +=
          (omega * omega * (pointer.x - emitter.x) - 2 * omega * emitter.vx) *
          h;
        emitter.vy +=
          (omega * omega * (pointer.y - emitter.y) - 2 * omega * emitter.vy) *
          h;
        emitter.x += emitter.vx * h;
        emitter.y += emitter.vy * h;
      }
    }
    const dx = emitter.x - emitter.px;
    const dy = emitter.y - emitter.py;
    if (Math.hypot(dx, dy) < 0.05 || !s.enabled) return;
    const radius = lightRadius(t, s);
    const from: [number, number] = [emitter.px, emitter.py];
    const to: [number, number] = [emitter.x, emitter.y];
    if (!reduce) {
      const step = Math.max(dt, 1e-3);
      splat(
        t.velocity,
        from,
        to,
        radius * 4 + 18,
        toGrid(t, dx / step, dy / step),
        3,
        FLOW * 0.6,
      );
    }
    splat(t.dye, from, to, radius, [5.6, 5.6, 0.7], 2, 1, radius * 5 + 6);
    active = now;
  };

  const burst = (
    t: GlTargets,
    s: GlowCursorSettings,
    x: number,
    y: number,
    now: number,
  ) => {
    const radius = lightRadius(t, s);
    const jets = 6;
    const base = Math.random() * Math.PI * 2;
    for (let k = 0; k < jets; k++) {
      const angle =
        base + (k / jets) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const cx = Math.cos(angle);
      const cy = Math.sin(angle);
      const reach = 20 + Math.random() * 14;
      const from: [number, number] = [x + cx * 3, y + cy * 3];
      const to: [number, number] = [x + cx * reach, y + cy * reach];
      if (!s.reducedMotion) {
        const velocity = toGrid(
          t,
          Math.cos(angle + 0.6) * 760,
          Math.sin(angle + 0.6) * 760,
        );
        splat(t.velocity, from, to, 18, velocity, 1, 0.9);
      }
      splat(
        t.dye,
        from,
        to,
        radius * 1.1,
        [2.4, 2.4, 0.3],
        0,
        1,
        radius * 5 + 6,
      );
    }
    splat(
      t.dye,
      [x, y],
      [x + 0.01, y],
      radius * 2.2,
      [1.8, 1.8, 0.4],
      0,
      1,
      radius * 7 + 10,
    );
    active = now;
  };

  const project = (t: GlTargets, dt: number) => {
    const { velocity, pressure, divergence } = t;
    let u = use(passes.divergence, velocity.read.texel);
    gl.uniform1i(u('uVelocity'), bind(0, velocity.read));
    draw(divergence);

    u = use(passes.scale, pressure.read.texel);
    gl.uniform1i(u('uSource'), bind(0, pressure.read));
    gl.uniform1f(u('uValue'), 0.8);
    draw(pressure.write);
    pressure.swap();

    u = use(passes.pressure, pressure.read.texel);
    gl.uniform1i(u('uDivergence'), bind(1, divergence));
    for (let i = 0; i < PRESSURE_STEPS; i++) {
      gl.uniform1i(u('uPressure'), bind(0, pressure.read));
      draw(pressure.write);
      pressure.swap();
    }

    u = use(passes.gradient, velocity.read.texel);
    gl.uniform1i(u('uPressure'), bind(0, pressure.read));
    gl.uniform1i(u('uVelocity'), bind(1, velocity.read));
    draw(velocity.write);
    velocity.swap();

    u = use(passes.advect, velocity.read.texel);
    gl.uniform2f(
      u('uVelocityTexel'),
      velocity.read.texel[0],
      velocity.read.texel[1],
    );
    gl.uniform1i(u('uVelocity'), bind(0, velocity.read));
    gl.uniform1i(u('uSource'), bind(0, velocity.read));
    gl.uniform1f(u('uDt'), dt);
    const calm = Math.exp(-dt * 1.2);
    gl.uniform4f(u('uDecay'), calm, calm, 1, 1);
    draw(velocity.write);
    velocity.swap();
  };

  const step = (t: GlTargets, s: GlowCursorSettings, dt: number) => {
    const { velocity, dye, forward, back } = t;
    if (!s.reducedMotion) project(t, dt);

    const d0 = Math.exp((-dt * 4.6) / (s.linger * 0.8));
    const d1 = Math.exp((-dt * 4.6) / (s.linger * 0.2));
    const d2 = Math.exp((-dt * 4.6) / (s.linger * 1.2));
    const vTexel = velocity.read.texel;

    if (s.reducedMotion) {
      const u = use(passes.advect, dye.read.texel);
      gl.uniform2f(u('uVelocityTexel'), vTexel[0], vTexel[1]);
      gl.uniform1i(u('uVelocity'), bind(0, velocity.read));
      gl.uniform1i(u('uSource'), bind(1, dye.read));
      gl.uniform1f(u('uDt'), 0);
      gl.uniform4f(u('uDecay'), d0, d1, d2, 1);
      draw(dye.write);
      dye.swap();
      return;
    }

    let u = use(passes.advect, dye.read.texel);
    gl.uniform2f(u('uVelocityTexel'), vTexel[0], vTexel[1]);
    gl.uniform1i(u('uVelocity'), bind(0, velocity.read));
    gl.uniform1i(u('uSource'), bind(1, dye.read));
    gl.uniform1f(u('uDt'), dt);
    gl.uniform4f(u('uDecay'), 1, 1, 1, 1);
    draw(forward);
    gl.uniform1i(u('uSource'), bind(1, forward));
    gl.uniform1f(u('uDt'), -dt);
    draw(back);

    u = use(passes.maccormack, dye.read.texel);
    gl.uniform2f(u('uVelocityTexel'), vTexel[0], vTexel[1]);
    gl.uniform2f(u('uSourceTexel'), dye.read.texel[0], dye.read.texel[1]);
    gl.uniform1i(u('uVelocity'), bind(0, velocity.read));
    gl.uniform1i(u('uSource'), bind(1, dye.read));
    gl.uniform1i(u('uForward'), bind(2, forward));
    gl.uniform1i(u('uBack'), bind(3, back));
    gl.uniform1f(u('uDt'), dt);
    gl.uniform4f(u('uDecay'), d0, d1, d2, 1);
    draw(dye.write);
    dye.swap();
  };

  const setShade = (u: Uniform, s: GlowCursorSettings) => {
    gl.uniform3f(u('uColor'), color[0], color[1], color[2]);
    gl.uniform3f(u('uSecondary'), secondary[0], secondary[1], secondary[2]);
    gl.uniform1f(u('uIntensity'), s.intensity);
    gl.uniform1f(u('uHotspot'), s.hotspot);
  };

  const renderBloom = (t: GlTargets, s: GlowCursorSettings) => {
    const { dye, bloom } = t;
    const [first] = bloom;
    if (!first) return;
    let u = use(passes.prefilter, first.texel);
    gl.uniform1i(u('uDye'), bind(0, dye.read));
    gl.uniform2f(u('uDyeTexel'), dye.read.texel[0], dye.read.texel[1]);
    setShade(u, s);
    draw(first);

    u = use(passes.down, first.texel);
    let previous = first;
    for (const level of bloom.slice(1)) {
      gl.uniform1i(u('uSource'), bind(0, previous));
      gl.uniform2f(u('uSourceTexel'), previous.texel[0], previous.texel[1]);
      draw(level);
      previous = level;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    u = use(passes.up, first.texel);
    const reversed = [...bloom].reverse();
    reversed.slice(0, -1).forEach((source, index) => {
      const destination = reversed[index + 1];
      if (!destination) return;
      gl.uniform1i(u('uSource'), bind(0, source));
      gl.uniform2f(u('uSourceTexel'), source.texel[0], source.texel[1]);
      draw(destination);
    });
    gl.disable(gl.BLEND);
  };

  const render = (t: GlTargets, s: GlowCursorSettings) => {
    const [first] = t.bloom;
    if (!first) return;
    if (s.glow > 0) renderBloom(t, s);
    const u = use(passes.display, [1 / canvas.width, 1 / canvas.height]);
    gl.uniform1i(u('uDye'), bind(0, t.dye.read));
    gl.uniform1i(u('uBloom'), bind(1, first));
    setShade(u, s);
    gl.uniform1f(u('uGlow'), s.glow > 0 ? (s.glow * 1.4) / BLOOM_LEVELS : 0);
    gl.uniform1f(u('uGrain'), s.grain);
    gl.uniform1f(u('uTime'), time);
    gl.uniform1f(u('uLight'), s.theme === 'light' ? 1 : 0);
    draw(null);
  };

  const blank = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 1 / 60;
    last = now;
    time += dt;
    if (Math.abs(pixelRatio(s) - ratio) > 0.01) resize();
    const t = allocate();
    resolveColors(s);
    gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);

    if (ready) emit(t, s, dt, now);
    let next = bursts.shift();
    while (next) {
      burst(t, s, next[0], next[1], now);
      next = bursts.shift();
    }
    step(t, s, dt);
    render(t, s);

    const quiet = now - active > s.linger * 1200 + 900;
    const resting = Math.hypot(emitter.vx, emitter.vy) < 1;
    if (quiet && resting) {
      clearTargets(t);
      blank();
      last = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (!raf && alive && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    if (!inside) {
      if (pointer.inside) {
        pointer.inside = false;
        ready = false;
        wake();
      }
      return;
    }
    if (!ready) {
      emitter.x = x;
      emitter.y = y;
      emitter.px = x;
      emitter.py = y;
      emitter.vx = 0;
      emitter.vy = 0;
      ready = true;
    }
    pointer.x = x;
    pointer.y = y;
    pointer.inside = true;
    wake();
  };

  const onPointerDown = (event: PointerEvent) => {
    const s = getSettings();
    if (!s.clickBurst || !s.enabled) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    bursts.push([x, y]);
    wake();
  };

  const onPointerLeave = () => {
    pointer.inside = false;
    ready = false;
    wake();
  };

  const onVisibility = () => {
    last = 0;
    wake();
  };

  const resizeObserver = new ResizeObserver(() => {
    resize();
    wake();
  });
  resizeObserver.observe(container);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      last = 0;
      wake();
    }
  });
  intersection.observe(container);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  document.documentElement.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('visibilitychange', onVisibility);
  resize();
  blank();

  return {
    wake,
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      raf = 0;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener(
        'pointerleave',
        onPointerLeave,
      );
      document.removeEventListener('visibilitychange', onVisibility);
      release();
      Object.values(passes).forEach((pass) => gl.deleteProgram(pass.program));
      gl.deleteShader(vertexShader);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
    },
  };
}
