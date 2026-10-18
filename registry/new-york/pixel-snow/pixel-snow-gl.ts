import {
  CELL,
  COMPOSITE,
  DOWN,
  FLAKE_FRAGMENT,
  FLAKE_VERTEX,
  LEVELS,
  PILE,
  QUAD_VERTEX,
  SLOTS,
  UP,
} from './pixel-snow-shaders';
import type {
  PixelSnowEngine,
  PixelSnowProps,
  PixelSnowSettings,
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

interface Flake {
  level: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  rate: number;
  sparkle: number;
  drift: number;
  alt: boolean;
  reveal: number;
  levelSize: number;
}

const SPRITES: Record<string, string[][]> = {
  square: [
    ['@'],
    ['oo', 'oo'],
    ['xox', 'o@o', 'xox'],
    ['xoox', 'o@@o', 'o@@o', 'xoox'],
    ['xooox', 'oo@oo', 'o@@@o', 'oo@oo', 'xooox'],
    ['xox', 'o@o', 'xox'],
    ['xoox', 'o@@o', 'o@@o', 'xoox'],
    ['xooox', 'oo@oo', 'o@@@o', 'oo@oo', 'xooox'],
  ],
  round: [
    ['@'],
    ['.x.', 'x@x', '.x.'],
    ['.xx.', 'x@@x', 'x@@x', '.xx.'],
    ['.xxx.', 'xo@ox', 'x@@@x', 'xo@ox', '.xxx.'],
    [
      '..xxx..',
      '.xooox.',
      'xoo@oox',
      'xo@@@ox',
      'xoo@oox',
      '.xooox.',
      '..xxx..',
    ],
    ['.xx.', 'x@@x', 'x@@x', '.xx.'],
    ['.xxx.', 'xo@ox', 'x@@@x', 'xo@ox', '.xxx.'],
    [
      '..xxx..',
      '.xooox.',
      'xoo@oox',
      'xo@@@ox',
      'xoo@oox',
      '.xooox.',
      '..xxx..',
    ],
  ],
  snowflake: [
    ['@'],
    ['.x.', 'x@x', '.x.'],
    ['..x..', 'x.o.x', '.o@o.', 'x.o.x', '..x..'],
    [
      '...x...',
      '.x.o.x.',
      '..ooo..',
      'xoo@oox',
      '..ooo..',
      '.x.o.x.',
      '...x...',
    ],
    [
      '....x....',
      '.x..o..x.',
      '..o.o.o..',
      '...ooo...',
      'xooo@ooox',
      '...ooo...',
      '..o.o.o..',
      '.x..o..x.',
      '....x....',
    ],
    ['x...x', '.o.o.', '..@..', '.o.o.', 'x...x'],
    [
      'x..x..x',
      '.o.o.o.',
      '..ooo..',
      'xoo@oox',
      '..ooo..',
      '.o.o.o.',
      'x..x..x',
    ],
    [
      'x...x...x',
      '.o..o..o.',
      '..o.o.o..',
      '...ooo...',
      'xooo@ooox',
      '...ooo...',
      '..o.o.o..',
      '.o..o..o.',
      'x...x...x',
    ],
  ],
};

const VARIANTS = ['square', 'round', 'snowflake'];
const MAX_FLAKES = 4000;
const LEVEL_WEIGHTS = [0.46, 0.27, 0.15, 0.08, 0.04];
const LEVEL_FALL = [16, 24, 34, 48, 66];
const LEVEL_LIGHT = [0.42, 0.58, 0.76, 0.92, 1];
const INTRO_SECONDS = 1.4;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function normalizePixelSnow(
  p: PixelSnowProps,
  reduce: boolean,
): PixelSnowSettings {
  return {
    color: String(p.color ?? '#ffffff'),
    variant: Math.max(0, VARIANTS.indexOf(p.variant ?? 'snowflake')),
    density: clamp(p.density ?? 0.5, 0, 1),
    speed: p.speed ?? 1,
    wind: clamp(p.wind ?? 0.25, -2, 2),
    sway: Math.max(0, p.sway ?? 0.5),
    flakeSize: clamp(p.flakeSize ?? 1, 0, 2),
    pixelSize: Math.round(clamp(p.pixelSize ?? 3, 1, 12)),
    depth: clamp(p.depth ?? 0.6, 0, 1),
    brightness: Math.max(0, p.brightness ?? 1),
    glow: Math.max(0, p.glow ?? 0.8),
    twinkle: clamp(p.twinkle ?? 0.35, 0, 1),
    accumulate: p.accumulate ?? false,
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

const seeded = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 1831565813) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  attributes: string[],
): LinkedProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  attributes.forEach((name, index) =>
    gl.bindAttribLocation(program, index, name),
  );
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

function buildAtlas() {
  const width = CELL * SLOTS;
  const height = CELL * VARIANTS.length;
  const data = new Uint8Array(width * height * 4);
  VARIANTS.forEach((variant, row) => {
    (SPRITES[variant] ?? []).forEach((rows, level) => {
      rows.forEach((line, y) => {
        for (let x = 0; x < line.length; x++) {
          const mark = line[x];
          if (mark === '.') continue;
          const offset = ((row * CELL + y) * width + level * CELL + x) * 4;
          data[offset] = 255;
          data[offset + 1] = mark === '@' ? 255 : mark === 'o' ? 128 : 0;
          data[offset + 3] = 255;
        }
      });
    });
  });
  return { data, width, height };
}

function blankFlake(): Flake {
  return {
    level: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    phase: 0,
    rate: 1,
    sparkle: 0,
    drift: 1,
    alt: false,
    reveal: 0,
    levelSize: 1,
  };
}

/**
 * Raw WebGL2 pixel-art snow: flakes are stamped from a sprite atlas into a
 * low-resolution grid, blurred into a glow with a dual-kawase chain and
 * composited at full resolution. Returns null when WebGL2 is unavailable.
 */
export function createPixelSnow(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => PixelSnowSettings,
): PixelSnowEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const flakeProgram = link(gl, FLAKE_VERTEX, FLAKE_FRAGMENT, [
    'aCorner',
    'aFlake',
  ]);
  const pileProgram = link(gl, QUAD_VERTEX, PILE, ['aPosition']);
  const downProgram = link(gl, QUAD_VERTEX, DOWN, ['aPosition']);
  const upProgram = link(gl, QUAD_VERTEX, UP, ['aPosition']);
  const compositeProgram = link(gl, QUAD_VERTEX, COMPOSITE, ['aPosition']);
  const programs = [
    flakeProgram,
    pileProgram,
    downProgram,
    upProgram,
    compositeProgram,
  ];
  if (
    !flakeProgram ||
    !pileProgram ||
    !downProgram ||
    !upProgram ||
    !compositeProgram
  ) {
    for (const entry of programs) if (entry) gl.deleteProgram(entry.program);
    return null;
  }

  const atlas = buildAtlas();
  const atlasTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    atlas.width,
    atlas.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    atlas.data,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const quadBuffer = gl.createBuffer();
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const cornerBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  const flakeVao = gl.createVertexArray();
  gl.bindVertexArray(flakeVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.bindVertexArray(null);

  const createTarget = (filter: number): Target => {
    const target: Target = {
      texture: gl.createTexture(),
      framebuffer: gl.createFramebuffer(),
      width: 0,
      height: 0,
    };
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return target;
  };
  const sizeTarget = (target: Target, width: number, height: number) => {
    if (target.width === width && target.height === height) return;
    target.width = width;
    target.height = height;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      target.texture,
      0,
    );
  };
  const snow = createTarget(gl.NEAREST);
  const pileTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pileTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  let pile = new Float32Array(0);
  let pileWidth = 0;
  const down = [
    createTarget(gl.LINEAR),
    createTarget(gl.LINEAR),
    createTarget(gl.LINEAR),
  ];
  const up = [createTarget(gl.LINEAR), createTarget(gl.LINEAR)];
  const lastDown = down[down.length - 1]!;
  const firstUp = up[0]!;

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, number[]>();
  const toRgb = (value: string): number[] => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const pixel = probe.getImageData(0, 0, 1, 1).data;
      rgb = [
        (pixel[0] ?? 255) / 255,
        (pixel[1] ?? 255) / 255,
        (pixel[2] ?? 255) / 255,
      ];
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const rng = seeded(4271);
  const flakes: Flake[] = [];
  const view = {
    width: 1,
    height: 1,
    ratio: 1,
    pixel: 1,
    gridWidth: 1,
    gridHeight: 1,
  };
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, inside: false, time: 0 };
  const initial = getSettings();
  const state = {
    time: 0,
    intro: initial.intro && !initial.reduce ? 0 : 1,
    push: 0,
  };
  const instances = new Float32Array(MAX_FLAKES * 4);
  let raf = 0;
  let last = 0;
  let visible = true;
  let lastPixel = initial.pixelSize;
  let lastDpr = initial.dpr;

  const pickLevel = (r: number, s: PixelSnowSettings): number => {
    const shift = s.flakeSize - 1;
    let total = 0;
    const weights = LEVEL_WEIGHTS.map(
      (weight, level) => weight * Math.pow(2.2, shift * (level - 1.5)),
    );
    const sum = weights.reduce((a, b) => a + b, 0);
    for (let level = 0; level < LEVELS; level++) {
      total += weights[level]! / sum;
      if (r <= total) return level;
    }
    return LEVELS - 1;
  };

  const spawn = (flake: Flake, s: PixelSnowSettings, top: boolean) => {
    flake.level = pickLevel(rng(), s);
    flake.x = rng() * (view.width + 40) - 20;
    flake.y = top ? -10 - rng() * 30 : rng() * view.height;
    flake.vx = 0;
    flake.vy = LEVEL_FALL[flake.level]!;
    flake.phase = rng() * Math.PI * 2;
    flake.rate = 0.6 + rng() * 0.9;
    flake.sparkle = rng() * 100;
    flake.drift = 0.7 + rng() * 0.6;
    flake.alt = rng() < 0.5;
    flake.reveal = rng();
    flake.levelSize = s.flakeSize;
  };

  const populate = (s: PixelSnowSettings) => {
    const target = Math.round(
      clamp((view.width * view.height * s.density) / 1100, 0, MAX_FLAKES),
    );
    while (flakes.length < target) {
      const flake = blankFlake();
      spawn(flake, s, false);
      flakes.push(flake);
    }
    if (flakes.length > target) flakes.length = target;
  };

  const simulate = (s: PixelSnowSettings, dt: number) => {
    const fall = s.speed;
    const windSpeed = s.wind * 46;
    const radius = 120;
    const pushing = state.push > 0.001 && pointer.inside;
    const margin = 24;
    const settle = s.accumulate && fall > 0 && pile.length > 0;
    for (const flake of flakes) {
      if (flake.levelSize !== s.flakeSize) {
        flake.level = pickLevel(rng(), s);
        flake.levelSize = s.flakeSize;
      }
      const level = flake.level;
      const parallax = 1 - s.depth * (1 - (level + 1) / LEVELS) * 0.75;
      const swing =
        Math.sin(state.time * flake.rate + flake.phase) *
        s.sway *
        (6 + level * 7);
      const targetX = (windSpeed * parallax + swing) * flake.drift;
      const targetY = LEVEL_FALL[level]! * parallax * fall * flake.drift;
      const ease = 1 - Math.exp(-dt * 2.2);
      flake.vx += (targetX - flake.vx) * ease;
      flake.vy += (targetY - flake.vy) * ease;
      if (pushing) {
        const dx = flake.x - pointer.x;
        const dy = flake.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < radius && distance > 0.001) {
          const near = 1 - distance / radius;
          const repel = near * near * near * state.push * 1500 * dt;
          const carry = near * near * state.push * dt * 5;
          flake.vx += (dx / distance) * repel + pointer.vx * carry;
          flake.vy += (dy / distance) * repel + pointer.vy * carry;
        }
      }
      flake.x += flake.vx * dt;
      flake.y += flake.vy * dt;
      if (settle) {
        const column = Math.floor(flake.x / view.pixel);
        if (column >= 0 && column < pile.length) {
          const height = pile[column] ?? 0;
          const surface = view.height - height * view.pixel;
          if (flake.y >= surface && height > 0.5) {
            const reach = level;
            for (let k = -reach; k <= reach; k++) {
              const index = column + k;
              if (index >= 0 && index < pile.length)
                pile[index] =
                  (pile[index] ?? 0) +
                  (0.35 + level * 0.15) * (1 - Math.abs(k) / (reach + 1));
            }
            spawn(flake, s, true);
            flake.reveal = -1;
            continue;
          }
        }
      }
      if (fall >= 0 ? flake.y > view.height + margin : flake.y < -margin) {
        spawn(flake, s, true);
        flake.reveal = -1;
        if (fall < 0) flake.y = view.height + 10 + rng() * 30;
      }
      if (flake.x < -margin) flake.x += view.width + margin * 2;
      else if (flake.x > view.width + margin)
        flake.x -= view.width + margin * 2;
    }
  };

  const settlePile = (s: PixelSnowSettings, dt: number) => {
    if (!pile.length) return;
    const cap = Math.max(4, view.gridHeight * 0.08);
    if (s.accumulate && s.speed > 0) {
      const grow = (0.25 + s.density * 0.9) * dt * Math.min(1, s.speed);
      for (let i = 0; i < pile.length; i++) {
        const dune =
          0.55 +
          0.45 *
            Math.sin(i * 0.045 + Math.sin(i * 0.013) * 2.1) *
            Math.sin(i * 0.021 + 1.3);
        if ((pile[i] ?? 0) < cap * dune)
          pile[i] = (pile[i] ?? 0) + grow * (0.6 + 0.8 * dune);
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      const forward = pass === 0;
      for (let k = 0; k < pile.length - 1; k++) {
        const i = forward ? k : pile.length - 2 - k;
        const a = pile[i] ?? 0;
        const b = pile[i + 1] ?? 0;
        const difference = a - b;
        if (Math.abs(difference) > 1.2) {
          const move =
            (Math.abs(difference) - 1.2) * 0.5 * Math.sign(difference);
          pile[i] = a - move;
          pile[i + 1] = b + move;
        }
      }
    }
    for (let i = 0; i < pile.length; i++) {
      const height = pile[i] ?? 0;
      const excess = Math.max(0, height - cap);
      const rate =
        s.accumulate && s.speed > 0 ? excess * 0.8 : 2 + height * 0.6;
      pile[i] = Math.max(0, height - rate * dt);
    }
  };

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

  const u = (entry: LinkedProgram, name: string) =>
    entry.uniforms[name] ?? null;

  const render = () => {
    const s = getSettings();
    sizeTarget(snow, view.gridWidth, view.gridHeight);
    let count = 0;
    const sizes = (SPRITES[VARIANTS[s.variant] ?? 'snowflake'] ?? []).map(
      (rows) => rows.length,
    );
    const sweep = state.intro * 1.75;
    for (const flake of flakes) {
      const level = flake.level;
      const depthLight = 1 - s.depth * (1 - LEVEL_LIGHT[level]!);
      const spark =
        Math.pow(Math.max(0, Math.sin(state.time * 0.9 + flake.sparkle)), 60) *
        s.twinkle;
      const reveal =
        flake.reveal < 0 || state.intro >= 1
          ? 1
          : clamp(
              (sweep - flake.y / view.height - flake.reveal * 0.25) / 0.35,
              0,
              1,
            );
      if (reveal <= 0) continue;
      const slot = level >= 2 && flake.alt ? level + 3 : level;
      const o = count * 4;
      instances[o] = flake.x / view.pixel;
      instances[o + 1] = flake.y / view.pixel;
      instances[o + 2] = s.variant * SLOTS + slot;
      instances[o + 3] =
        Math.min(1, depthLight * (0.85 + spark * 0.6)) * reveal * reveal;
      count++;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, snow.framebuffer);
    gl.viewport(0, 0, snow.width, snow.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (pile.length && pile.some((height) => height > 0.4)) {
      gl.bindTexture(gl.TEXTURE_2D, pileTexture);
      if (pileWidth !== pile.length) {
        pileWidth = pile.length;
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.R32F,
          pileWidth,
          1,
          0,
          gl.RED,
          gl.FLOAT,
          pile,
        );
      } else {
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          pileWidth,
          1,
          gl.RED,
          gl.FLOAT,
          pile,
        );
      }
      gl.useProgram(pileProgram.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pileTexture);
      gl.uniform1i(u(pileProgram, 'uPile'), 0);
      gl.uniform1f(u(pileProgram, 'uTime'), state.time);
      gl.uniform1f(u(pileProgram, 'uLight'), 1 - s.depth * 0.1);
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (count > 0) {
      gl.useProgram(flakeProgram.program);
      gl.uniform2f(u(flakeProgram, 'uGrid'), snow.width, snow.height);
      gl.uniform4f(
        u(flakeProgram, 'uSizes'),
        sizes[1] ?? 1,
        sizes[2] ?? 1,
        sizes[3] ?? 1,
        0,
      );
      gl.uniform1f(u(flakeProgram, 'uLargest'), sizes[4] ?? 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
      gl.uniform1i(u(flakeProgram, 'uAtlas'), 0);
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.MAX);
      gl.bindVertexArray(flakeVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        instances.subarray(0, count * 4),
        gl.DYNAMIC_DRAW,
      );
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      gl.blendEquation(gl.FUNC_ADD);
      gl.disable(gl.BLEND);
    }

    gl.bindVertexArray(quadVao);
    let source = snow;
    for (const target of down) {
      sizeTarget(
        target,
        Math.max(1, Math.ceil(source.width / 2)),
        Math.max(1, Math.ceil(source.height / 2)),
      );
      gl.useProgram(downProgram.program);
      gl.uniform2f(
        u(downProgram, 'uTexel'),
        1 / source.width,
        1 / source.height,
      );
      gl.uniform2f(u(downProgram, 'uTarget'), target.width, target.height);
      bindTexture(downProgram, 'uSource', 0, source.texture);
      run(downProgram, target, target.width, target.height);
      source = target;
    }
    for (let level = up.length - 1; level >= 0; level--) {
      const from = level === up.length - 1 ? lastDown : up[level + 1]!;
      const target = up[level]!;
      const base = down[level]!;
      sizeTarget(target, base.width, base.height);
      gl.useProgram(upProgram.program);
      gl.uniform2f(u(upProgram, 'uTexel'), 1 / from.width, 1 / from.height);
      gl.uniform2f(u(upProgram, 'uTarget'), target.width, target.height);
      bindTexture(upProgram, 'uSource', 0, from.texture);
      bindTexture(upProgram, 'uBase', 1, base.texture);
      run(upProgram, target, target.width, target.height);
    }

    const c = compositeProgram;
    gl.useProgram(c.program);
    gl.uniform2f(u(c, 'uResolution'), canvas.width, canvas.height);
    gl.uniform2f(u(c, 'uGrid'), snow.width, snow.height);
    gl.uniform1f(u(c, 'uPixel'), view.pixel * view.ratio);
    gl.uniform3fv(u(c, 'uColor'), toRgb(s.color));
    gl.uniform1f(u(c, 'uBrightness'), s.brightness);
    gl.uniform1f(u(c, 'uGlow'), s.glow);
    gl.uniform1f(u(c, 'uFade'), s.fade);
    gl.uniform1f(u(c, 'uOpacity'), s.opacity);
    gl.uniform1f(u(c, 'uLightMode'), s.lightMode ? 1 : 0);
    bindTexture(c, 'uSnow', 0, snow.texture);
    bindTexture(c, 'uGlowMap', 1, firstUp.texture);
    run(c, null, canvas.width, canvas.height);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !s.reduce;
    if (!s.intro || s.reduce) state.intro = 1;
    else if (state.intro < 1)
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    const goal = s.mouseInteraction && pointer.inside && !s.reduce ? 1 : 0;
    state.push += (goal - state.push) * (1 - Math.exp(-dt * (goal ? 6 : 3)));
    pointer.vx *= Math.exp(-dt * 6);
    pointer.vy *= Math.exp(-dt * 6);
    populate(s);
    if (moving) {
      state.time += dt;
      simulate(s, dt);
      settlePile(s, dt);
    }
    render();
    if (moving || Math.abs(goal - state.push) > 0.001)
      raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    view.width = width;
    view.height = height;
    view.ratio = ratio;
    view.pixel = Math.max(1, Math.round(s.pixelSize * ratio)) / ratio;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    view.gridWidth = Math.max(1, Math.ceil(width / view.pixel));
    view.gridHeight = Math.max(1, Math.ceil(height / view.pixel));
    if (pile.length !== view.gridWidth) pile = new Float32Array(view.gridWidth);
    populate(s);
    if (!raf) render();
    wake();
  };

  return {
    resize,
    wake() {
      const s = getSettings();
      if (s.pixelSize !== lastPixel || s.dpr !== lastDpr) {
        lastPixel = s.pixelSize;
        lastDpr = s.dpr;
        resize();
        return;
      }
      populate(s);
      if (!raf) render();
      wake();
    },
    setVisible(next: boolean) {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    pointerMove(event: PointerEvent) {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const now = performance.now();
      if (pointer.inside && pointer.time) {
        const elapsed = Math.max(1, now - pointer.time) / 1000;
        pointer.vx = clamp((x - pointer.x) / elapsed, -3000, 3000);
        pointer.vy = clamp((y - pointer.y) / elapsed, -3000, 3000);
      }
      pointer.x = x;
      pointer.y = y;
      pointer.time = now;
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      wake();
    },
    pointerLeave() {
      pointer.inside = false;
      wake();
    },
    visibilityChange() {
      last = 0;
      wake();
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      for (const target of [snow, ...down, ...up]) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      for (const entry of programs) if (entry) gl.deleteProgram(entry.program);
      gl.deleteTexture(atlasTexture);
      gl.deleteTexture(pileTexture);
      gl.deleteBuffer(quadBuffer);
      gl.deleteBuffer(cornerBuffer);
      gl.deleteBuffer(instanceBuffer);
      gl.deleteVertexArray(quadVao);
      gl.deleteVertexArray(flakeVao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
