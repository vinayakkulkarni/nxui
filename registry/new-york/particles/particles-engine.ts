import {
  BURST_SECONDS,
  BURST_SPEED,
  BURST_WIDTH,
  DEPTH,
  FAR,
  FOCAL,
  INTRO_SECONDS,
  LINE_FRAGMENT,
  LINE_VERTEX,
  MAX_BURSTS,
  MAX_COUNT,
  MAX_LINES,
  MAX_LINKED,
  NEAR,
  PARTICLE_FRAGMENT,
  PARTICLE_VERTEX,
} from './particles-shaders';
import type {
  ParticlesEngine,
  ParticlesProps,
  ParticlesSettings,
} from './types';

const SHAPES: Record<string, number> = {
  circle: 0,
  square: 1,
  ring: 2,
  sparkle: 3,
};
const EFFECTS: Record<string, number> = { parallax: 0, repel: 1, attract: 2 };
const DRIFTS: Record<string, number> = { none: 0, up: 1, down: 2, forward: 3 };
const WHITE = ['#ffffff'];
const WHITE_RGB = [1, 1, 1];

type Uniform = (name: string) => WebGLUniformLocation | null;

interface Linked {
  program: WebGLProgram;
  uniform: Uniform;
}

interface Burst {
  x: number;
  y: number;
  age: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

const wrap = (value: number, span: number) => ((value % span) + span) % span;

const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    // mulberry32 increment (0x6D2B79F5).
    state = (state + 1831565813) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Rejection-samples a direction inside the unit sphere, same draw order as upstream.
function insideSphere(next: () => number): [number, number, number] {
  for (;;) {
    const x = next() * 2 - 1;
    const y = next() * 2 - 1;
    const z = next() * 2 - 1;
    const len = x * x + y * y + z * z;
    if (len <= 1 && len !== 0) return [x, y, z];
  }
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
  vertexSource: string,
  fragmentSource: string,
): Linked | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
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
  const locations = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      locations.set(
        info.name.replace('[0]', ''),
        gl.getUniformLocation(program, info.name),
      );
    }
  }
  return { program, uniform: (name) => locations.get(name) ?? null };
}

export function toParticlesSettings(props: ParticlesProps): ParticlesSettings {
  const palette = (props.particleColors ?? WHITE).filter(Boolean).map(String);
  return {
    count: clamp(Math.round(props.particleCount ?? 200), 1, MAX_COUNT),
    spread: Math.max(0.1, props.particleSpread ?? 10),
    speed: props.speed ?? 0.1,
    colors: palette.length ? palette : WHITE,
    mouse: props.moveParticlesOnHover ?? true,
    hoverFactor: Math.max(0, props.particleHoverFactor ?? 1),
    soft: props.alphaParticles ?? false,
    size: Math.max(0, props.particleBaseSize ?? 100),
    randomness: Math.max(0, props.sizeRandomness ?? 1),
    camera: Math.max(1, props.cameraDistance ?? 20),
    rotate: !(props.disableRotation ?? false),
    dpr: props.pixelRatio,
    shape: SHAPES[props.shape ?? 'circle'] ?? 0,
    glow: Math.max(0, props.glow ?? 0.5),
    twinkle: clamp(props.twinkle ?? 0.3, 0, 1),
    depthOfField: Math.max(0, props.depthOfField ?? 0),
    connections: props.connections ?? false,
    connectionDistance: Math.max(10, props.connectionDistance ?? 110),
    hoverEffect: EFFECTS[props.hoverEffect ?? 'parallax'] ?? 0,
    hoverRadius: Math.max(20, props.hoverRadius ?? 140),
    clickBurst: props.clickBurst ?? true,
    drift: DRIFTS[props.drift ?? 'none'] ?? 0,
    driftSpeed: props.driftSpeed ?? 1,
    variation: Math.max(0, Math.round(props.variation ?? 0)),
    intro: props.intro ?? true,
    opacity: clamp(props.opacity ?? 1, 0, 1),
    lightMode: props.lightMode ?? false,
    paused: props.paused ?? false,
  };
}

export function createParticlesEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => ParticlesSettings,
  isReduced: () => boolean,
  wake: () => void,
): ParticlesEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const dots = link(gl, PARTICLE_VERTEX, PARTICLE_FRAGMENT);
  const lines = link(gl, LINE_VERTEX, LINE_FRAGMENT);
  const corners = gl.createBuffer();
  const positionBuffer = gl.createBuffer();
  const randomBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();
  const lineBuffer = gl.createBuffer();
  const dotVao = gl.createVertexArray();
  const lineVao = gl.createVertexArray();
  if (
    !dots ||
    !lines ||
    !corners ||
    !positionBuffer ||
    !randomBuffer ||
    !colorBuffer ||
    !lineBuffer ||
    !dotVao ||
    !lineVao
  ) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, corners);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );

  gl.bindVertexArray(dotVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, corners);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const attach = (buffer: WebGLBuffer, location: number, width: number) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, width, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(location, 1);
  };
  attach(positionBuffer, 1, 3);
  attach(randomBuffer, 2, 4);
  attach(colorBuffer, 3, 3);

  const lineData = new Float32Array(MAX_LINES * 8);
  gl.bindVertexArray(lineVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, corners);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, lineData.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16);
  gl.vertexAttribDivisor(2, 1);
  gl.bindVertexArray(null);

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, number[]>();
  const parse = (value: string): number[] => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb = [1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [
        (data[0] ?? 255) / 255,
        (data[1] ?? 255) / 255,
        (data[2] ?? 255) / 255,
      ];
    }
    colorCache.set(value, rgb);
    return rgb;
  };
  // Darkens a color to ink so it reads on light backgrounds.
  const ink = (rgb: number[]) => {
    const linear = rgb.map((v) => Math.pow(v, 2.2));
    const tone =
      0.2126 * (linear[0] ?? 0) +
      0.7152 * (linear[1] ?? 0) +
      0.0722 * (linear[2] ?? 0);
    const depth = Math.min(1, 0.06 / Math.max(tone, 0.0001));
    return linear.map((v) => Math.pow(v * depth, 1 / 2.2));
  };

  const view = { width: 1, height: 1, ratio: 1 };
  const pointer = {
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    nx: 0,
    ny: 0,
    inside: false,
    active: 0,
  };
  const state = {
    clock: 0,
    spin: 0,
    travel: 0,
    offsetX: 0,
    offsetY: 0,
    reveal: getSettings().intro && !isReduced() ? 0 : 1,
  };
  const bursts: Burst[] = [];
  const packedBursts = new Float32Array(MAX_BURSTS * 4);
  const cloud = {
    key: '',
    count: 0,
    positions: new Float32Array(0),
    randoms: new Float32Array(0),
    colors: new Float32Array(0),
  };
  const screen = {
    x: new Float32Array(0),
    y: new Float32Array(0),
    ahead: new Float32Array(0),
    alpha: new Float32Array(0),
  };
  const buckets = new Map<number, number[]>();
  let last = 0;
  let visible = true;
  let lastDpr = getSettings().dpr;

  const rebuild = (s: ParticlesSettings) => {
    const key = `${s.count}|${s.variation}|${s.colors.join(',')}|${s.lightMode ? 1 : 0}`;
    if (key === cloud.key) return;
    cloud.key = key;
    const next = seeded(s.variation * 7919 + 1);
    const total = s.count;
    const positions = new Float32Array(total * 3);
    const randoms = new Float32Array(total * 4);
    const tints = new Float32Array(total * 3);
    const swatches = s.colors.map((value) =>
      s.lightMode ? ink(parse(value)) : parse(value),
    );
    for (let i = 0; i < total; i++) {
      const [x, y, z] = insideSphere(next);
      const r = Math.cbrt(next());
      positions.set([x * r, y * r, z * r], i * 3);
      randoms.set([next(), next(), next(), next()], i * 4);
      tints.set(
        swatches[Math.floor(next() * swatches.length)] ?? WHITE_RGB,
        i * 3,
      );
    }
    cloud.count = total;
    cloud.positions = positions;
    cloud.randoms = randoms;
    cloud.colors = tints;
    const linked = Math.min(total, MAX_LINKED);
    screen.x = new Float32Array(linked);
    screen.y = new Float32Array(linked);
    screen.ahead = new Float32Array(linked);
    screen.alpha = new Float32Array(linked);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, randomBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, randoms, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, tints, gl.STATIC_DRAW);
  };

  const rotationOf = (s: ParticlesSettings) => {
    const elapsed = state.clock * 1000;
    const x = s.rotate ? Math.sin(elapsed * 0.0002) * 0.1 : 0;
    const y = s.rotate ? Math.cos(elapsed * 0.0005) * 0.15 : 0;
    const z = s.rotate ? state.spin : 0;
    const sx = Math.sin(x);
    const cx = Math.cos(x);
    const sy = Math.sin(y);
    const cy = Math.cos(y);
    const sz = Math.sin(z);
    const cz = Math.cos(z);
    return [
      cy * cz + sy * sx * sz,
      cx * sz,
      -sy * cz + cy * sx * sz,
      -cy * sz + sy * sx * cz,
      cx * cz,
      sy * sz + cy * sx * cz,
      sy * cx,
      -sx,
      cy * cx,
    ];
  };

  const offsetZ = () => -(1 - easeOut(state.reveal)) * 70;

  // CPU mirror of the vertex shader for the first MAX_LINKED particles, so lines meet the dots.
  const project = (s: ParticlesSettings, m: number[]) => {
    const total = Math.min(cloud.count, MAX_LINKED);
    const ox = state.offsetX;
    const oy = state.offsetY;
    const oz = offsetZ();
    const aspect = view.width / view.height;
    const time = state.clock;
    const radius = s.hoverRadius;
    const active = s.hoverEffect !== 0 ? pointer.active : 0;
    const spanY = s.spread * 2 + 3;
    const spanZ = s.spread * DEPTH * 2 + 3;
    const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = m;
    const P = cloud.positions;
    const R = cloud.randoms;
    for (let i = 0; i < total; i++) {
      const px = (P[i * 3] ?? 0) * s.spread;
      const py = (P[i * 3 + 1] ?? 0) * s.spread;
      const pz = (P[i * 3 + 2] ?? 0) * s.spread * DEPTH;
      const r0 = R[i * 4] ?? 0;
      const r1 = R[i * 4 + 1] ?? 0;
      const r2 = R[i * 4 + 2] ?? 0;
      const r3 = R[i * 4 + 3] ?? 0;
      const bobX = Math.sin(time * r2 + 6.28 * r3) * (0.1 + 1.4 * r0);
      const bobY = Math.sin(time * r1 + 6.28 * r0) * (0.1 + 1.4 * r3);
      const bobZ = Math.sin(time * r3 + 6.28 * r1) * (0.1 + 1.4 * r2);
      const wx = (m0 ?? 0) * px + (m3 ?? 0) * py + (m6 ?? 0) * pz + ox + bobX;
      let wy = (m1 ?? 0) * px + (m4 ?? 0) * py + (m7 ?? 0) * pz + oy + bobY;
      let wz = (m2 ?? 0) * px + (m5 ?? 0) * py + (m8 ?? 0) * pz + oz + bobZ;
      let edge = 1;
      if (s.drift === 1 || s.drift === 2) {
        const k = wrap(
          r3 * spanY +
            oy +
            bobY +
            (s.drift === 1 ? state.travel : -state.travel),
          spanY,
        );
        wy = k - spanY / 2;
        const low = clamp(k / (spanY * 0.12), 0, 1);
        const high = clamp((spanY - k) / (spanY * 0.12), 0, 1);
        edge = low * low * (3 - 2 * low) * high * high * (3 - 2 * high);
      } else if (s.drift === 3) {
        const k = wrap(r1 * spanZ + oz + bobZ + state.travel, spanZ);
        wz = k - spanZ / 2;
        const fresh = clamp(k / (spanZ * 0.1), 0, 1);
        edge = fresh * fresh * (3 - 2 * fresh);
      }
      const ahead = s.camera - wz;
      if (ahead < NEAR || ahead > FAR) {
        screen.alpha[i] = 0;
        continue;
      }
      const close = clamp((ahead - 1) / 3, 0, 1);
      edge *= close * close * (3 - 2 * close);
      let sx =
        ((wx * FOCAL) / aspect / ahead) * 0.5 * view.width + view.width / 2;
      let sy = ((wy * FOCAL) / ahead) * 0.5 * view.height + view.height / 2;
      let dx = 0;
      let dy = 0;
      if (active > 0.001) {
        const ex = sx - pointer.sx;
        const ey = sy - pointer.sy;
        const reach = Math.hypot(ex, ey);
        const falloff =
          Math.exp(-(ex * ex + ey * ey) / (radius * radius)) *
          s.hoverFactor *
          active;
        if (s.hoverEffect === 1 && reach > 0.001) {
          dx += (ex / reach) * radius * 0.5 * falloff;
          dy += (ey / reach) * radius * 0.5 * falloff;
        } else if (s.hoverEffect === 2) {
          dx -= ex * 0.6 * falloff;
          dy -= ey * 0.6 * falloff;
        }
      }
      for (const burst of bursts) {
        const progress = burst.age / BURST_SECONDS;
        const ex = sx - burst.x;
        const ey = sy - burst.y;
        const reach = Math.hypot(ex, ey);
        if (reach < 0.001) continue;
        const wave = Math.exp(
          -Math.pow((reach - progress * BURST_SPEED) / BURST_WIDTH, 2),
        );
        const ramp = clamp(reach / 30, 0, 1);
        const push =
          wave *
          (1 - progress) *
          (1 - progress) *
          56 *
          ramp *
          ramp *
          (3 - 2 * ramp);
        dx += (ex / reach) * push;
        dy += (ey / reach) * push;
      }
      sx += dx;
      sy += dy;
      const far = clamp((FAR - ahead) / (FAR - FAR * 0.9), 0, 1);
      const reveal = clamp(state.reveal * 1.6 - r2 * 0.6, 0, 1);
      screen.x[i] = sx;
      screen.y[i] = sy;
      screen.ahead[i] = ahead;
      screen.alpha[i] = far * far * (3 - 2 * far) * edge * reveal * reveal;
    }
    return total;
  };

  const buildLines = (s: ParticlesSettings, m: number[]) => {
    const total = project(s, m);
    const reach = s.connectionDistance;
    const columns = Math.max(1, Math.ceil(view.width / reach) + 2);
    const SX = screen.x;
    const SY = screen.y;
    const SA = screen.ahead;
    const AL = screen.alpha;
    const C = cloud.colors;
    buckets.clear();
    for (let i = 0; i < total; i++) {
      if ((AL[i] ?? 0) < 0.02) continue;
      const key =
        (Math.floor((SY[i] ?? 0) / reach) + 1) * columns +
        Math.floor((SX[i] ?? 0) / reach) +
        1;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(i);
      else buckets.set(key, [i]);
    }
    let lineCount = 0;
    const limit = reach * reach;
    const neighbours = [0, 1, columns - 1, columns, columns + 1];
    for (const [key, members] of buckets) {
      for (const offset of neighbours) {
        const others = offset === 0 ? members : buckets.get(key + offset);
        if (!others) continue;
        for (let a = 0; a < members.length; a++) {
          const i = members[a] ?? 0;
          for (let b = offset === 0 ? a + 1 : 0; b < others.length; b++) {
            const j = others[b] ?? 0;
            const dx = (SX[i] ?? 0) - (SX[j] ?? 0);
            const dy = (SY[i] ?? 0) - (SY[j] ?? 0);
            const gap = dx * dx + dy * dy;
            if (gap > limit) continue;
            const layer = clamp(
              1 - Math.abs((SA[i] ?? 0) - (SA[j] ?? 0)) / 18,
              0,
              1,
            );
            if (layer <= 0) continue;
            if (lineCount >= MAX_LINES) return lineCount;
            const fade = 1 - Math.sqrt(gap) / reach;
            const base = lineCount * 8;
            lineData[base] = SX[i] ?? 0;
            lineData[base + 1] = SY[i] ?? 0;
            lineData[base + 2] = SX[j] ?? 0;
            lineData[base + 3] = SY[j] ?? 0;
            lineData[base + 4] = ((C[i * 3] ?? 0) + (C[j * 3] ?? 0)) / 2;
            lineData[base + 5] =
              ((C[i * 3 + 1] ?? 0) + (C[j * 3 + 1] ?? 0)) / 2;
            lineData[base + 6] =
              ((C[i * 3 + 2] ?? 0) + (C[j * 3 + 2] ?? 0)) / 2;
            lineData[base + 7] =
              fade * fade * layer * 0.7 * Math.min(AL[i] ?? 0, AL[j] ?? 0);
            lineCount++;
          }
        }
      }
    }
    return lineCount;
  };

  const render = () => {
    const s = getSettings();
    rebuild(s);
    const matrix = rotationOf(s);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    if (s.connections) {
      const lineCount = buildLines(s, matrix);
      if (lineCount) {
        const lu = lines.uniform;
        gl.useProgram(lines.program);
        gl.bindVertexArray(lineVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
        gl.bufferSubData(
          gl.ARRAY_BUFFER,
          0,
          lineData.subarray(0, lineCount * 8),
        );
        gl.uniform2f(lu('uView'), view.width, view.height);
        gl.uniform1f(lu('uRatio'), view.ratio);
        gl.uniform1f(lu('uWidth'), 1);
        gl.uniform1f(lu('uOpacity'), s.opacity);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, lineCount);
      }
    }

    let burstCount = 0;
    for (let i = bursts.length - 1; i >= 0 && burstCount < MAX_BURSTS; i--) {
      const burst = bursts[i];
      if (!burst) continue;
      packedBursts.set(
        [burst.x, burst.y, burst.age / BURST_SECONDS, 1],
        burstCount * 4,
      );
      burstCount++;
    }
    const u = dots.uniform;
    gl.useProgram(dots.program);
    gl.bindVertexArray(dotVao);
    gl.uniformMatrix3fv(u('uRotation'), false, matrix);
    gl.uniform3f(u('uOffset'), state.offsetX, state.offsetY, offsetZ());
    gl.uniform1f(u('uSpread'), s.spread);
    gl.uniform1f(u('uTime'), state.clock);
    gl.uniform1f(u('uCamera'), s.camera);
    gl.uniform1f(u('uAspect'), view.width / view.height);
    gl.uniform2f(u('uView'), view.width, view.height);
    gl.uniform1f(u('uRatio'), view.ratio);
    gl.uniform1f(u('uSize'), s.size);
    gl.uniform1f(u('uRandomness'), s.randomness);
    gl.uniform1f(u('uBlur'), s.depthOfField * 14);
    gl.uniform1f(u('uFocus'), s.camera + 14);
    gl.uniform1f(u('uGlow'), s.lightMode ? s.glow * 0.3 : s.glow);
    gl.uniform1f(u('uTwinkle'), s.twinkle);
    gl.uniform1i(u('uShape'), s.shape);
    gl.uniform1i(u('uDrift'), s.drift);
    gl.uniform1f(u('uTravel'), state.travel);
    gl.uniform4f(
      u('uPointer'),
      pointer.sx,
      pointer.sy,
      pointer.active,
      s.hoverRadius,
    );
    gl.uniform1i(u('uEffect'), s.hoverEffect);
    gl.uniform1f(u('uStrength'), s.hoverFactor);
    gl.uniform4fv(u('uBursts'), packedBursts);
    gl.uniform1i(u('uBurstCount'), burstCount);
    gl.uniform1f(u('uReveal'), state.reveal);
    gl.uniform1f(u('uSoft'), s.soft ? 0.2 : 0);
    gl.uniform1f(u('uShimmer'), s.lightMode ? 0 : 1);
    gl.uniform1f(u('uOpacity'), s.opacity);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, cloud.count);
    gl.bindVertexArray(null);
  };

  const frame = (now: number) => {
    if (!visible) return false;
    const s = getSettings();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    if (s.paused) {
      state.reveal = 1;
      render();
      last = 0;
      return false;
    }
    const reduce = isReduced();
    const motion = reduce ? 0 : 1;
    const pace = dt * s.speed * motion;
    state.clock += pace;
    if (s.rotate) state.spin += pace * 0.6;
    state.travel += dt * s.driftSpeed * motion * (s.drift === 3 ? 6 : 0.9);

    const engaged = s.mouse && pointer.inside && !reduce;
    const follow = 1 - Math.exp(-dt / 0.35);
    const parallax = engaged && s.hoverEffect === 0 ? s.hoverFactor : 0;
    state.offsetX += (-pointer.nx * parallax - state.offsetX) * follow;
    state.offsetY += (-pointer.ny * parallax - state.offsetY) * follow;
    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt / 0.06));
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt / 0.06));
    pointer.active +=
      ((engaged ? 1 : 0) - pointer.active) * (1 - Math.exp(-dt / 0.2));

    for (let i = bursts.length - 1; i >= 0; i--) {
      const burst = bursts[i];
      if (!burst) continue;
      burst.age += dt;
      if (burst.age >= BURST_SECONDS) bursts.splice(i, 1);
    }

    if (!s.intro || reduce) state.reveal = 1;
    else if (state.reveal < 1)
      state.reveal = Math.min(1, state.reveal + dt / INTRO_SECONDS);

    render();
    return true;
  };

  const resize = (width: number, height: number) => {
    const s = getSettings();
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    view.width = w;
    view.height = h;
    canvas.width = Math.max(1, Math.round(w * ratio));
    canvas.height = Math.max(1, Math.round(h * ratio));
    view.ratio = canvas.width / w;
    render();
    wake();
  };

  const locate = (x: number, y: number, inside: boolean) => {
    const wasInside = pointer.inside;
    pointer.inside = inside;
    pointer.x = x;
    pointer.y = view.height - y;
    pointer.nx = (x / Math.max(1, view.width)) * 2 - 1;
    pointer.ny = -((y / Math.max(1, view.height)) * 2 - 1);
    if (pointer.inside && !wasInside) {
      pointer.sx = pointer.x;
      pointer.sy = pointer.y;
    }
  };

  return {
    frame,
    update(idle) {
      const s = getSettings();
      if (s.dpr !== lastDpr) {
        lastDpr = s.dpr;
        resize(view.width, view.height);
        return;
      }
      if (idle) render();
      wake();
    },
    resize,
    setVisible(next) {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    pointerMove(x, y, inside) {
      locate(x, y, inside);
      if (!getSettings().paused) wake();
    },
    pointerDown(x, y, inside) {
      const s = getSettings();
      locate(x, y, inside);
      if (!pointer.inside || !s.clickBurst || s.paused || isReduced()) return;
      bursts.push({ x: pointer.x, y: pointer.y, age: 0 });
      if (bursts.length > MAX_BURSTS) bursts.shift();
      wake();
    },
    pointerUp(isMouse) {
      if (!isMouse) pointer.inside = false;
    },
    pointerLeave() {
      pointer.inside = false;
    },
    resetClock() {
      last = 0;
    },
    dispose() {
      gl.deleteProgram(dots.program);
      gl.deleteProgram(lines.program);
      for (const buffer of [
        corners,
        positionBuffer,
        randomBuffer,
        colorBuffer,
        lineBuffer,
      ]) {
        gl.deleteBuffer(buffer);
      }
      gl.deleteVertexArray(dotVao);
      gl.deleteVertexArray(lineVao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
