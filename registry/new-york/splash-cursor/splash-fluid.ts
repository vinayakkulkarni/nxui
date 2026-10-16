import { HEADER, SHADERS, VERTEX } from './splash-cursor-shaders';
import type {
  DoubleTarget,
  FluidPoint,
  FluidPointer,
  ProgramInfo,
  QualityLevel,
  RenderTarget,
  RGB,
  ShaderName,
  SplashCursorQuality,
  SplashFluid,
  SplashSettings,
  TextureFormat,
  Uniforms,
} from './types';

export const QUALITY: Record<SplashCursorQuality, QualityLevel> = {
  low: { sim: 64, dye: 512, iterations: 10 },
  medium: { sim: 96, dye: 1024, iterations: 16 },
  high: { sim: 128, dye: 1440, iterations: 20 },
};
const BLOOM_RESOLUTION = 256;
const BLOOM_ITERATIONS = 4;
const BLOOM_THRESHOLD = 0.3;
const BLOOM_KNEE = 0.7;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function parseColor(value: string): RGB {
  let hex = String(value).replace('#', '').trim();
  if (hex.length === 3) hex = [...hex].map((char) => char + char).join('');
  const number = Number.parseInt(hex.slice(0, 6), 16);
  if (Number.isNaN(number)) return [1, 1, 1];
  return [
    ((number >> 16) & 255) / 255,
    ((number >> 8) & 255) / 255,
    (number & 255) / 255,
  ];
}

function hsv(h: number, s: number, v: number): RGB {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const sector = ((i % 6) + 6) % 6;
  if (sector === 0) return [v, t, p];
  if (sector === 1) return [q, v, p];
  if (sector === 2) return [p, v, t];
  if (sector === 3) return [p, q, v];
  if (sector === 4) return [t, p, v];
  return [v, p, q];
}

function newPointer(): FluidPointer {
  return {
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    ready: false,
    moved: false,
    offset: Math.random(),
  };
}

/**
 * WebGL2 stable-fluids simulation behind SplashCursor. Returns null when
 * WebGL2 or half-float render targets are unavailable.
 */
export function createSplashFluid(
  canvas: HTMLCanvasElement,
  getSettings: () => SplashSettings,
  intro: boolean,
  onRestored: () => void,
): SplashFluid | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;
  gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('EXT_color_buffer_half_float');

  const renderable = (internal: number, format: number) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internal,
      4,
      4,
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
    const complete =
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    return complete;
  };
  const rgba: TextureFormat = { internal: gl.RGBA16F, format: gl.RGBA };
  if (!renderable(rgba.internal, rgba.format)) return null;
  const rg: TextureFormat = renderable(gl.RG16F, gl.RG)
    ? { internal: gl.RG16F, format: gl.RG }
    : rgba;
  const r: TextureFormat = renderable(gl.R16F, gl.RED)
    ? { internal: gl.R16F, format: gl.RED }
    : rg;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const programs = new Map<ShaderName, ProgramInfo>();
  let broken = !vertex;
  (Object.keys(SHADERS) as ShaderName[]).forEach((name) => {
    const fragment = compile(gl.FRAGMENT_SHADER, HEADER + SHADERS[name]);
    const program = gl.createProgram();
    if (!vertex || !fragment) {
      broken = true;
      if (fragment) gl.deleteShader(fragment);
      programs.set(name, { program, uniforms: {} });
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) broken = true;
    const uniforms: Uniforms = {};
    const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    programs.set(name, { program, uniforms });
  });
  if (vertex) gl.deleteShader(vertex);

  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const targets = new Set<RenderTarget>();
  let disposed = false;
  let lost = false;

  const releaseGl = () => {
    if (gl.isContextLost()) return;
    targets.forEach((target) => {
      gl.deleteFramebuffer(target.fbo);
      gl.deleteTexture(target.texture);
    });
    targets.clear();
    programs.forEach((item) => gl.deleteProgram(item.program));
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
  };

  if (broken) {
    releaseGl();
    return null;
  }

  const use = (name: ShaderName): Uniforms => {
    const item = programs.get(name);
    if (!item) return {};
    gl.useProgram(item.program);
    return item.uniforms;
  };
  const loc = (u: Uniforms, name: string) => u[name] ?? null;

  const blit = (target: RenderTarget | null) => {
    if (target) {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const createTarget = (
    width: number,
    height: number,
    format: TextureFormat,
    filter: number,
  ): RenderTarget => {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      format.internal,
      width,
      height,
      0,
      format.format,
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
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const target: RenderTarget = {
      texture,
      fbo,
      width,
      height,
      texelX: 1 / width,
      texelY: 1 / height,
      attach: (unit) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return unit;
      },
    };
    targets.add(target);
    return target;
  };

  const destroyTarget = (target: RenderTarget | null) => {
    if (!target) return;
    gl.deleteFramebuffer(target.fbo);
    gl.deleteTexture(target.texture);
    targets.delete(target);
  };

  const reshape = (
    target: RenderTarget,
    width: number,
    height: number,
    format: TextureFormat,
  ) => {
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      format.internal,
      width,
      height,
      0,
      format.format,
      gl.HALF_FLOAT,
      null,
    );
    target.width = width;
    target.height = height;
    target.texelX = 1 / width;
    target.texelY = 1 / height;
  };

  const createDouble = (
    width: number,
    height: number,
    format: TextureFormat,
    filter: number,
  ): DoubleTarget => {
    const pair: DoubleTarget = {
      read: createTarget(width, height, format, filter),
      write: createTarget(width, height, format, filter),
      width,
      height,
      texelX: 1 / width,
      texelY: 1 / height,
      swap: () => {
        const current = pair.read;
        pair.read = pair.write;
        pair.write = current;
      },
    };
    return pair;
  };

  const resizeDouble = (
    pair: DoubleTarget,
    width: number,
    height: number,
    format: TextureFormat,
    filter: number,
    keep: boolean,
  ) => {
    if (keep) {
      const next = createTarget(width, height, format, filter);
      const u = use('copy');
      gl.uniform1i(loc(u, 'uTexture'), pair.read.attach(0));
      blit(next);
      destroyTarget(pair.read);
      pair.read = next;
    } else {
      reshape(pair.read, width, height, format);
    }
    reshape(pair.write, width, height, format);
    pair.width = width;
    pair.height = height;
    pair.texelX = 1 / width;
    pair.texelY = 1 / height;
  };

  const resolution = (base: number) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const aspect =
      Math.max(width, height) / Math.max(1, Math.min(width, height));
    const short = Math.round(base);
    const long = Math.round(base * aspect);
    return width > height
      ? { width: long, height: short }
      : { width: short, height: long };
  };

  const fit = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
  };

  const sizes = () => {
    const q = QUALITY[getSettings().quality];
    const shortSide = Math.min(gl.drawingBufferWidth, gl.drawingBufferHeight);
    return {
      sim: resolution(q.sim),
      ink: resolution(Math.max(q.sim, Math.min(q.dye, shortSide))),
    };
  };

  fit();
  const initial = sizes();
  const dye = createDouble(
    initial.ink.width,
    initial.ink.height,
    rgba,
    gl.LINEAR,
  );
  const velocity = createDouble(
    initial.sim.width,
    initial.sim.height,
    rg,
    gl.LINEAR,
  );
  const pressure = createDouble(
    initial.sim.width,
    initial.sim.height,
    r,
    gl.NEAREST,
  );
  const divergence = createTarget(
    initial.sim.width,
    initial.sim.height,
    r,
    gl.NEAREST,
  );
  const curl = createTarget(
    initial.sim.width,
    initial.sim.height,
    r,
    gl.NEAREST,
  );
  let bloom: RenderTarget | null = null;
  let bloomChain: RenderTarget[] = [];

  const dropBloom = () => {
    destroyTarget(bloom);
    bloomChain.forEach(destroyTarget);
    bloom = null;
    bloomChain = [];
  };

  const ensureBloom = (): RenderTarget => {
    if (bloom) return bloom;
    const size = resolution(BLOOM_RESOLUTION);
    const created = createTarget(size.width, size.height, rgba, gl.LINEAR);
    for (let i = 0; i < BLOOM_ITERATIONS; i++) {
      const width = size.width >> (i + 1);
      const height = size.height >> (i + 1);
      if (width < 2 || height < 2) break;
      bloomChain.push(createTarget(width, height, rgba, gl.LINEAR));
    }
    bloom = created;
    return created;
  };

  const resize = () => {
    fit();
    const next = sizes();
    if (dye.width !== next.ink.width || dye.height !== next.ink.height) {
      resizeDouble(dye, next.ink.width, next.ink.height, rgba, gl.LINEAR, true);
    }
    if (
      velocity.width !== next.sim.width ||
      velocity.height !== next.sim.height
    ) {
      resizeDouble(
        velocity,
        next.sim.width,
        next.sim.height,
        rg,
        gl.LINEAR,
        true,
      );
      resizeDouble(
        pressure,
        next.sim.width,
        next.sim.height,
        r,
        gl.NEAREST,
        false,
      );
      reshape(divergence, next.sim.width, next.sim.height, r);
      reshape(curl, next.sim.width, next.sim.height, r);
    }
    const glowSize = resolution(BLOOM_RESOLUTION);
    if (
      bloom &&
      (bloom.width !== glowSize.width || bloom.height !== glowSize.height)
    )
      dropBloom();
  };

  const radiusFor = (scale: number) => {
    const aspect = canvas.width / canvas.height;
    return (
      ((0.2 * getSettings().size * scale) / 100) * (aspect > 1 ? aspect : 1)
    );
  };

  const splat = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    vx: number,
    vy: number,
    color: RGB,
    radius: number,
  ) => {
    const u = use('splat');
    gl.uniform1i(loc(u, 'uTarget'), velocity.read.attach(0));
    gl.uniform1f(loc(u, 'aspectRatio'), canvas.width / canvas.height);
    gl.uniform2f(loc(u, 'pointA'), ax, ay);
    gl.uniform2f(loc(u, 'pointB'), bx, by);
    gl.uniform3f(loc(u, 'color'), vx, vy, 0);
    gl.uniform1f(loc(u, 'radius'), radius);
    blit(velocity.write);
    velocity.swap();
    gl.uniform1i(loc(u, 'uTarget'), dye.read.attach(0));
    gl.uniform3f(loc(u, 'color'), color[0], color[1], color[2]);
    blit(dye.write);
    dye.swap();
  };

  const colorAt = (offset: number, now: number): RGB => {
    const s = getSettings();
    const phase = (((offset + (now / 1000) * s.colorSpeed * 0.6) % 1) + 1) % 1;
    if (s.rainbow) return hsv(phase, 1, 1);
    const palette = s.palette;
    const first = palette[0];
    if (!first) return [1, 1, 1];
    if (palette.length === 1) return first;
    const position = phase * palette.length;
    const from = palette[Math.floor(position) % palette.length] ?? first;
    const to = palette[(Math.floor(position) + 1) % palette.length] ?? first;
    const t = position - Math.floor(position);
    const blend = t * t * (3 - 2 * t);
    return [
      from[0] + (to[0] - from[0]) * blend,
      from[1] + (to[1] - from[1]) * blend,
      from[2] + (to[2] - from[2]) * blend,
    ];
  };

  const inkFor = (color: RGB, amount: number): RGB => {
    const light = getSettings().light;
    const channel = (value: number) => (light ? 1 - value : value) * amount;
    return [channel(color[0]), channel(color[1]), channel(color[2])];
  };

  const flush = (pointer: FluidPointer, dt: number, now: number) => {
    const s = getSettings();
    const aspect = canvas.width / canvas.height;
    const length = Math.hypot(
      (pointer.x - pointer.px) * aspect,
      pointer.y - pointer.py,
    );
    if (length > 0.35) {
      pointer.px = pointer.x;
      pointer.py = pointer.y;
      return;
    }
    let dx = pointer.x - pointer.px;
    let dy = pointer.y - pointer.py;
    if (aspect < 1) dx *= aspect;
    else dy /= aspect;
    const radius = radiusFor(1);
    const spread = 1 + length / (1.77 * Math.sqrt(radius));
    const push = (6000 * s.force) / Math.sqrt(spread);
    const amount =
      (0.15 * s.intensity * Math.min(dt * 60, 1)) / Math.sqrt(spread);
    const color = inkFor(colorAt(pointer.offset, now), amount);
    splat(
      pointer.px,
      pointer.py,
      pointer.x,
      pointer.y,
      dx * push,
      dy * push,
      color,
      radius,
    );
    pointer.px = pointer.x;
    pointer.py = pointer.y;
  };

  const burst = (x: number, y: number, now: number) => {
    const s = getSettings();
    const seed = Math.random() * Math.PI * 2;
    const aspect = canvas.width / canvas.height;
    let u = use('burst');
    gl.uniform1i(loc(u, 'uTarget'), velocity.read.attach(0));
    gl.uniform1f(loc(u, 'aspectRatio'), aspect);
    gl.uniform2f(loc(u, 'point'), x, y);
    gl.uniform1f(loc(u, 'radius'), radiusFor(3));
    gl.uniform1f(loc(u, 'strength'), 1100 * s.force);
    gl.uniform1f(loc(u, 'seed'), seed);
    blit(velocity.write);
    velocity.swap();
    const offset = Math.random();
    const amount = 1.6 * s.intensity;
    const first = inkFor(colorAt(offset, now), amount);
    const second = inkFor(colorAt(offset + 0.3, now), amount);
    u = use('crown');
    gl.uniform1i(loc(u, 'uTarget'), dye.read.attach(0));
    gl.uniform1f(loc(u, 'aspectRatio'), aspect);
    gl.uniform2f(loc(u, 'point'), x, y);
    gl.uniform1f(loc(u, 'radius'), radiusFor(1.6));
    gl.uniform3f(loc(u, 'colorA'), first[0], first[1], first[2]);
    gl.uniform3f(loc(u, 'colorB'), second[0], second[1], second[2]);
    gl.uniform1f(loc(u, 'seed'), seed);
    blit(dye.write);
    dye.swap();
  };

  const step = (dt: number) => {
    const s = getSettings();
    const iterations = QUALITY[s.quality].iterations;
    gl.disable(gl.BLEND);

    let u = use('curl');
    gl.uniform2f(loc(u, 'texelSize'), velocity.texelX, velocity.texelY);
    gl.uniform1i(loc(u, 'uVelocity'), velocity.read.attach(0));
    blit(curl);

    u = use('vorticity');
    gl.uniform2f(loc(u, 'texelSize'), velocity.texelX, velocity.texelY);
    gl.uniform1i(loc(u, 'uVelocity'), velocity.read.attach(0));
    gl.uniform1i(loc(u, 'uCurl'), curl.attach(1));
    gl.uniform1f(loc(u, 'curl'), s.swirl);
    gl.uniform1f(loc(u, 'dt'), dt);
    blit(velocity.write);
    velocity.swap();

    u = use('divergence');
    gl.uniform2f(loc(u, 'texelSize'), velocity.texelX, velocity.texelY);
    gl.uniform1i(loc(u, 'uVelocity'), velocity.read.attach(0));
    blit(divergence);

    u = use('clear');
    gl.uniform1i(loc(u, 'uTexture'), pressure.read.attach(0));
    gl.uniform1f(loc(u, 'value'), 0.1);
    blit(pressure.write);
    pressure.swap();

    u = use('pressure');
    gl.uniform2f(loc(u, 'texelSize'), velocity.texelX, velocity.texelY);
    gl.uniform1i(loc(u, 'uDivergence'), divergence.attach(0));
    for (let i = 0; i < iterations; i++) {
      gl.uniform1i(loc(u, 'uPressure'), pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    u = use('gradient');
    gl.uniform2f(loc(u, 'texelSize'), velocity.texelX, velocity.texelY);
    gl.uniform1i(loc(u, 'uPressure'), pressure.read.attach(0));
    gl.uniform1i(loc(u, 'uVelocity'), velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    u = use('advection');
    gl.uniform2f(loc(u, 'texelSize'), velocity.texelX, velocity.texelY);
    gl.uniform1i(loc(u, 'uVelocity'), velocity.read.attach(0));
    gl.uniform1i(loc(u, 'uSource'), velocity.read.attach(0));
    gl.uniform1f(loc(u, 'dt'), dt);
    gl.uniform1f(loc(u, 'dissipation'), 2 / s.momentum);
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(loc(u, 'uVelocity'), velocity.read.attach(0));
    gl.uniform1i(loc(u, 'uSource'), dye.read.attach(1));
    gl.uniform1f(loc(u, 'dissipation'), 3.5 / s.trail);
    blit(dye.write);
    dye.swap();
  };

  const applyBloom = (amount: number) => {
    const base = ensureBloom();
    if (!bloomChain.length) return;
    gl.disable(gl.BLEND);
    let u = use('prefilter');
    const knee = BLOOM_THRESHOLD * BLOOM_KNEE + 0.0001;
    gl.uniform3f(
      loc(u, 'curve'),
      BLOOM_THRESHOLD - knee,
      knee * 2,
      0.25 / knee,
    );
    gl.uniform1f(loc(u, 'threshold'), BLOOM_THRESHOLD);
    gl.uniform1i(loc(u, 'uTexture'), dye.read.attach(0));
    blit(base);
    u = use('blur');
    gl.uniform1f(loc(u, 'intensity'), 1);
    let last = base;
    bloomChain.forEach((target) => {
      gl.uniform2f(loc(u, 'texelSize'), last.texelX, last.texelY);
      gl.uniform1i(loc(u, 'uTexture'), last.attach(0));
      blit(target);
      last = target;
    });
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);
    for (let i = bloomChain.length - 2; i >= 0; i--) {
      const target = bloomChain[i];
      if (!target) continue;
      gl.uniform2f(loc(u, 'texelSize'), last.texelX, last.texelY);
      gl.uniform1i(loc(u, 'uTexture'), last.attach(0));
      blit(target);
      last = target;
    }
    gl.disable(gl.BLEND);
    gl.uniform1f(loc(u, 'intensity'), amount);
    gl.uniform2f(loc(u, 'texelSize'), last.texelX, last.texelY);
    gl.uniform1i(loc(u, 'uTexture'), last.attach(0));
    blit(base);
  };

  const render = () => {
    const s = getSettings();
    if (s.glow > 0) applyBloom(2 * s.glow);
    gl.disable(gl.BLEND);
    const u = use('display');
    gl.uniform2f(
      loc(u, 'texelSize'),
      1 / gl.drawingBufferWidth,
      1 / gl.drawingBufferHeight,
    );
    gl.uniform1i(loc(u, 'uTexture'), dye.read.attach(0));
    gl.uniform1i(loc(u, 'uBloom'), (bloom ?? dye.read).attach(1));
    gl.uniform1f(loc(u, 'shading'), s.shading);
    gl.uniform1f(loc(u, 'bloom'), s.glow > 0 ? 1 : 0);
    gl.uniform1f(loc(u, 'light'), s.light ? 1 : 0);
    blit(null);
  };

  const clearScreen = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const pointers = new Map<string, FluidPointer>();
  const bursts: FluidPoint[] = [];
  const reduced =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const introPointer = newPointer();
  let introStart = intro && !reduced ? performance.now() + 150 : -1;
  let raf = 0;
  let last = 0;
  let lastActivity = performance.now();

  const advanceIntro = (now: number) => {
    if (introStart < 0) return;
    const progress = (now - introStart) / 1100;
    if (progress < 0) return;
    const t = Math.min(progress, 1);
    const eased = t * t * (3 - 2 * t);
    const x = 0.2 + 0.6 * eased;
    const y = 0.5 + 0.12 * Math.sin(eased * Math.PI * 2);
    if (!introPointer.ready) {
      introPointer.x = introPointer.px = x;
      introPointer.y = introPointer.py = y;
      introPointer.ready = true;
    } else {
      introPointer.x = x;
      introPointer.y = y;
      introPointer.moved = true;
    }
    if (t >= 1) introStart = -1;
    lastActivity = now;
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed || lost) return;
    const s = getSettings();
    const dt = clamp((now - last) / 1000, 0, 1 / 60);
    last = now;
    resize();
    advanceIntro(now);
    if (introPointer.moved) {
      introPointer.moved = false;
      flush(introPointer, dt, now);
    }
    pointers.forEach((pointer) => {
      if (!pointer.moved) return;
      pointer.moved = false;
      flush(pointer, dt, now);
    });
    bursts.splice(0).forEach((point) => burst(point.x, point.y, now));
    step(dt);
    render();
    const quiet = (2.2 * s.trail + 0.4) * 1000;
    if (introStart >= 0 || now - lastActivity < quiet)
      raf = requestAnimationFrame(frame);
    else clearScreen();
  };

  const wake = () => {
    lastActivity = performance.now();
    if (raf || disposed || lost) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const locate = (clientX: number, clientY: number): FluidPoint | null => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = (clientX - rect.left) / rect.width;
    const y = 1 - (clientY - rect.top) / rect.height;
    if (getSettings().contained && (x < 0 || x > 1 || y < 0 || y > 1))
      return null;
    return { x, y };
  };

  const track = (id: string, clientX: number, clientY: number) => {
    const point = locate(clientX, clientY);
    let pointer = pointers.get(id);
    if (!point) {
      if (pointer) pointer.ready = false;
      return;
    }
    if (!pointer) {
      pointer = newPointer();
      pointers.set(id, pointer);
    }
    if (!pointer.ready) {
      pointer.x = pointer.px = point.x;
      pointer.y = pointer.py = point.y;
      pointer.ready = true;
      return;
    }
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.moved = true;
    wake();
  };

  const press = (clientX: number, clientY: number) => {
    if (!getSettings().clickSplash) return;
    const point = locate(clientX, clientY);
    if (!point) return;
    bursts.push(point);
    wake();
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  resize();
  if (introStart >= 0) wake();

  return {
    track,
    press,
    release: (id) => {
      pointers.delete(id);
    },
    leave: () => {
      pointers.forEach((pointer) => {
        pointer.ready = false;
      });
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      releaseGl();
    },
  };
}
