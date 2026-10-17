import type {
  Ball,
  CursorBlob,
  Deformable,
  MetaBallsEngine,
  MetaBallsSettings,
  MetaBallsVariant,
  Presence,
  Vec3Tuple,
} from './types';

const MAX_BALLS = 50;
const SLOTS = MAX_BALLS + 1;
const VARIANTS: Record<MetaBallsVariant, number> = {
  solid: 0,
  outline: 1,
  contour: 2,
};
const VISIBLE = 0.877;

const fract = (x: number) => x - Math.floor(x);

const hash31 = (p: number): Vec3Tuple => {
  const r0 = fract(p * 0.1031);
  const r1 = fract(p * 0.103);
  const r2 = fract(p * 0.0973);
  const dot = r0 * (r1 + 33.33) + r1 * (r2 + 33.33) + r2 * (r0 + 33.33);
  return [fract(r0 + dot), fract(r1 + dot), fract(r2 + dot)];
};

const hash33 = (v: Vec3Tuple): Vec3Tuple => {
  const p0 = fract(v[0] * 0.1031);
  const p1 = fract(v[1] * 0.103);
  const p2 = fract(v[2] * 0.0973);
  const dot = p0 * (p1 + 33.33) + p1 * (p0 + 33.33) + p2 * (p2 + 33.33);
  const q0 = fract(p0 + dot);
  const q1 = fract(p1 + dot);
  const q2 = fract(p2 + dot);
  return [fract((q0 + q1) * q2), fract((q0 + q0) * q1), fract((q1 + q0) * q0)];
};

const toRgb = (color: string): Vec3Tuple => {
  let hex = String(color || '')
    .trim()
    .replace('#', '');
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}/i.test(hex)) return [1, 1, 1];
  return [
    Number.parseInt(hex.slice(0, 2), 16) / 255,
    Number.parseInt(hex.slice(2, 4), 16) / 255,
    Number.parseInt(hex.slice(4, 6), 16) / 255,
  ];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOut = (t: number) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const VERTEX = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uScale;
uniform vec4 uBalls[${SLOTS}];
uniform vec4 uShapes[${SLOTS}];
uniform int uCount;
uniform float uGamma;
uniform float uThreshold;
uniform vec3 uColor;
uniform vec3 uCursorColor;
uniform int uVariant;
uniform float uLine;
uniform float uSpacing;
uniform float uRings;
uniform float uOpaque;

out vec4 outColor;

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) * uScale;
  float field = 0.0;
  float tint = 0.0;
  float mass = 0.0;
  vec2 grad = vec2(0.0);
  bool classic = abs(uGamma - 1.0) < 0.001;
  for (int i = 0; i < ${SLOTS}; i++) {
    if (i >= uCount) break;
    vec4 ball = uBalls[i];
    vec4 shape = uShapes[i];
    vec2 d = p - ball.xy;
    vec2 q = vec2(shape.x * d.x + shape.y * d.y, shape.y * d.x + shape.z * d.y);
    float qq = max(dot(q, q), ball.z * 1e-4 + 1e-12);
    float v = ball.z / qq;
    float w = classic ? v : pow(v, uGamma);
    field += w;
    float weight = w / (1.0 + w / uThreshold);
    mass += weight;
    tint += weight * ball.w;
    grad -= 2.0 * uGamma * w / qq * vec2(shape.x * q.x + shape.y * q.y, shape.y * q.x + shape.z * q.y);
  }
  float slope = max(length(grad) * uScale, 1e-8);
  vec3 color = mix(uColor, uCursorColor, mass > 0.0 ? clamp(tint / mass, 0.0, 1.0) : 0.0);
  float alpha;
  if (uVariant == 0) {
    alpha = field > 3.0 * uThreshold ? 1.0 : clamp((field - uThreshold) / slope + 0.5, 0.0, 1.0);
  } else if (uVariant == 1) {
    alpha = field > 3.0 * uThreshold ? 0.0 : clamp(0.5 * uLine + 0.5 - abs((field - uThreshold) / slope), 0.0, 1.0);
  } else {
    float rho = pow(max(field / uThreshold, 1e-6), -0.5 / uGamma);
    float rate = rho * slope / (2.0 * uGamma * max(field, 1e-8));
    float u = (rho - 1.0) / uSpacing;
    float ring = floor(u + 0.5);
    float gap = (u - ring) * uSpacing / max(rate, 1e-8);
    alpha = clamp(0.5 * uLine + 0.5 - abs(gap), 0.0, 1.0);
    alpha *= ring < -0.5 || ring > uRings + 0.5 ? 0.0 : 1.0 - ring / (uRings + 1.0);
    if (ring > 0.5) alpha *= smoothstep(uLine * 6.0, uLine * 12.0, uSpacing / max(rate, 1e-8));
  }
  outColor = vec4(color * alpha, uOpaque > 0.5 ? 1.0 : alpha);
}
`;

const compile = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const createBall = (index: number): Ball => {
  const h1 = hash31(index + 1);
  const h2 = hash33(h1);
  return {
    start: h1[0] * Math.PI * 2,
    rate: 0.1 * Math.PI + h1[1] * 0.3 * Math.PI,
    reach: 5 + h1[1] * 5,
    toggle: Math.floor(h2[0] * 2),
    radius: 0.5 + h2[2] * 1.5,
    lane: h2[1] * 2 - 1,
    rise: 0.55 + h1[2] * 0.7,
    sway: h2[0] * Math.PI * 2,
    delay: 0.1 + fract(h1[2] * 7.31 + h2[1] * 3.17) * 0.55,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    fx: 0,
    fy: 0,
    ax: 0,
    ay: 0,
    avx: 0,
    avy: 0,
    a: 0,
    b: 0,
    va: 0,
    vb: 0,
  };
};

/**
 * Metaball field rendered in one WebGL2 full-screen pass, with a small
 * spring/cohesion simulation driving the blobs. Returns null without WebGL2.
 */
export function createMetaBalls(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => MetaBallsSettings,
  intro: boolean,
): MetaBallsEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const loc = {
    resolution: uniform('uResolution'),
    scale: uniform('uScale'),
    balls: uniform('uBalls'),
    shapes: uniform('uShapes'),
    count: uniform('uCount'),
    gamma: uniform('uGamma'),
    threshold: uniform('uThreshold'),
    color: uniform('uColor'),
    cursorColor: uniform('uCursorColor'),
    variant: uniform('uVariant'),
    line: uniform('uLine'),
    spacing: uniform('uSpacing'),
    rings: uniform('uRings'),
    opaque: uniform('uOpaque'),
  };

  const ballData = new Float32Array(SLOTS * 4);
  const shapeData = new Float32Array(SLOTS * 4);
  const balls = Array.from({ length: MAX_BALLS }, (_, index) =>
    createBall(index),
  );
  const idle = createBall(MAX_BALLS + 7);
  const cursor: CursorBlob = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    a: 0,
    b: 0,
    va: 0,
    vb: 0,
    pulse: 0,
    pulseVelocity: 0,
    ready: false,
  };
  const pointer = { x: 0, y: 0, inside: false };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const view = { width: 1, height: 1, ratio: 1 };
  const colors = new Map<string, Vec3Tuple>();
  const rgb = (value: string): Vec3Tuple => {
    const cached = colors.get(value);
    if (cached) return cached;
    const parsed = toRgb(value);
    colors.set(value, parsed);
    return parsed;
  };
  let phase = 0;
  let clock = 0;
  const introAt = intro && !reduced ? 0 : -1;
  let visible = true;
  let raf = 0;
  let last = 0;
  let dirty = true;

  const resize = () => {
    const rect = container.getBoundingClientRect();
    const s = getSettings();
    const ratio = Math.max(
      0.5,
      Math.min(s.dpr ?? window.devicePixelRatio ?? 1, 2),
    );
    view.width = Math.max(1, rect.width);
    view.height = Math.max(1, rect.height);
    view.ratio = ratio;
    canvas.width = Math.max(1, Math.round(view.width * ratio));
    canvas.height = Math.max(1, Math.round(view.height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    dirty = true;
  };

  const toWorld = (clientX: number, clientY: number) => {
    const rect = container.getBoundingClientRect();
    const scale = getSettings().animationSize / Math.max(1, rect.height);
    return {
      x: (clientX - rect.left - rect.width / 2) * scale,
      y: (rect.top + rect.height / 2 - clientY) * scale,
      inside:
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom,
    };
  };

  const presence = (): Presence => {
    if (introAt < 0) return { size: 1, time: Infinity };
    const t = clock - introAt;
    return { size: easeOut(t / 0.5), time: t };
  };

  const release = (ball: Ball, look: Presence) =>
    look.time === Infinity ? 1 : easeInOut((look.time - ball.delay) / 1.15);

  const anchor = (
    ball: Ball,
    s: MetaBallsSettings,
    spread: number,
  ): [number, number] => {
    const halfWidth = (s.animationSize * view.width) / view.height / 2;
    const halfHeight = s.animationSize / 2;
    const clump = Math.min(1.25, s.clumpFactor);
    if (s.motion === 'lava') {
      const cycle = Math.sin(phase * ball.rise * 1.6 + ball.start);
      const x =
        ball.lane * halfWidth * 0.8 * clump +
        Math.sin(phase * 0.5 * ball.rise + ball.sway) * halfWidth * 0.06;
      const y =
        Math.sign(cycle) * Math.pow(Math.abs(cycle), 0.55) * halfHeight * 0.9;
      return [x * spread, y * spread];
    }
    if (s.motion === 'drift') {
      const x =
        Math.sin(phase * ball.rise * 0.9 + ball.start) *
        halfWidth *
        0.84 *
        clump;
      const y =
        Math.sin(phase * ball.rate * 1.3 + ball.sway) *
        halfHeight *
        0.78 *
        clump;
      return [x * spread, y * spread];
    }
    const t = phase * ball.rate;
    const angle = ball.start + t;
    return [
      Math.cos(angle) * ball.reach * s.clumpFactor * spread,
      Math.sin(angle + t * ball.toggle) * ball.reach * s.clumpFactor * spread,
    ];
  };

  const deform = (body: Deformable, h: number, s: MetaBallsSettings) => {
    const speed = Math.hypot(body.vx, body.vy);
    const amount = 0.6 * s.stretch * Math.tanh(speed / 14);
    let ta = 0;
    let tb = 0;
    if (speed > 1e-4) {
      ta = (amount * (body.vx * body.vx - body.vy * body.vy)) / (speed * speed);
      tb = (amount * 2 * body.vx * body.vy) / (speed * speed);
    }
    const omega = 13;
    const zeta = 0.85 - 0.68 * clamp(s.wobble, 0, 1);
    body.va += (omega * omega * (ta - body.a) - 2 * zeta * omega * body.va) * h;
    body.vb += (omega * omega * (tb - body.b) - 2 * zeta * omega * body.vb) * h;
    body.a += body.va * h;
    body.b += body.vb * h;
  };

  const bridge = (s: MetaBallsSettings) => {
    const goo = clamp(s.gooeyness, 0, 1);
    const gamma = goo < 0.5 ? 1 + (0.5 - goo) * 1.2 : 1 - (goo - 0.5) * 0.5;
    return {
      gamma,
      threshold: Math.pow(1.3, gamma),
      reach: Math.pow(2, 0.5 / gamma),
    };
  };

  const step = (
    h: number,
    s: MetaBallsSettings,
    count: number,
    look: Presence,
  ) => {
    const { reach } = bridge(s);
    const pull = 36 * clamp(s.stickiness, 0, 1);
    const cursorRadius =
      s.cursorBallSize * VISIBLE * look.size * (1 + cursor.pulse);
    phase += h * s.speed;
    const active = balls.slice(0, count);

    active.forEach((ball) => {
      const [x, y] = anchor(ball, s, release(ball, look));
      ball.avx = clamp((x - ball.ax) / h, -40, 40);
      ball.avy = clamp((y - ball.ay) / h, -40, 40);
      ball.ax = x;
      ball.ay = y;
      ball.fx = 20 * (x - ball.x) - 5.4 * (ball.vx - ball.avx);
      ball.fy = 20 * (y - ball.y) - 5.4 * (ball.vy - ball.avy);
    });

    active.forEach((p, i) => {
      const rp = p.radius * VISIBLE * look.size;
      for (let j = i + 1; j < count; j++) {
        const q = active[j];
        if (!q) continue;
        const rq = q.radius * VISIBLE * look.size;
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const distance = Math.hypot(dx, dy) || 1e-4;
        const far = (rp + rq) * reach;
        if (distance >= far) continue;
        const core = (rp + rq) * 0.62;
        let force: number;
        if (distance < core) force = -60 * (core - distance);
        else {
          const t = (distance - core) / (far - core);
          force =
            pull *
            Math.min(rp, rq) *
            smoothstep(0, 0.6, t) *
            (1 - smoothstep(0.82, 1, t));
        }
        const nx = dx / distance;
        const ny = dy / distance;
        const mp = rp * rp + 0.05;
        const mq = rq * rq + 0.05;
        p.fx += (nx * force) / mp;
        p.fy += (ny * force) / mp;
        q.fx -= (nx * force) / mq;
        q.fy -= (ny * force) / mq;
      }
      const dx = cursor.x - p.x;
      const dy = cursor.y - p.y;
      const distance = Math.hypot(dx, dy) || 1e-4;
      const far = (rp + cursorRadius) * reach;
      if (distance < far) {
        const core = (rp + cursorRadius) * 0.62;
        let force: number;
        if (distance < core) force = -140 * (core - distance);
        else {
          const t = (distance - core) / (far - core);
          force =
            pull *
            0.6 *
            rp *
            smoothstep(0, 0.6, t) *
            (1 - smoothstep(0.82, 1, t));
        }
        p.fx += ((dx / distance) * force) / (rp * rp + 0.05);
        p.fy += ((dy / distance) * force) / (rp * rp + 0.05);
      }
    });

    active.forEach((ball) => {
      ball.vx += ball.fx * h;
      ball.vy += ball.fy * h;
      ball.x += ball.vx * h;
      ball.y += ball.vy * h;
      deform(ball, h, s);
      if (
        !Number.isFinite(
          ball.x +
            ball.y +
            ball.vx +
            ball.vy +
            ball.a +
            ball.b +
            ball.va +
            ball.vb,
        )
      ) {
        Object.assign(ball, {
          x: ball.ax,
          y: ball.ay,
          vx: 0,
          vy: 0,
          a: 0,
          b: 0,
          va: 0,
          vb: 0,
        });
      }
    });
  };

  const moveCursor = (dt: number, s: MetaBallsSettings, look: Presence) => {
    let tx: number;
    let ty: number;
    if (pointer.inside && s.enableMouseInteraction) {
      tx = pointer.x;
      ty = pointer.y;
    } else {
      const out =
        look.time === Infinity ? 1 : easeInOut((look.time - 0.75) / 1.3);
      if (s.motion === 'lava' || s.motion === 'drift') {
        [tx, ty] = anchor(idle, s, out);
      } else {
        const halfWidth = (s.animationSize * view.width) / view.height / 2;
        const halfHeight = s.animationSize / 2;
        tx = Math.cos(clock * s.speed) * halfWidth * 0.3 * out;
        ty = Math.sin(clock * s.speed) * halfHeight * 0.3 * out;
      }
    }
    if (!cursor.ready) {
      cursor.x = tx;
      cursor.y = ty;
      cursor.ready = true;
    }
    const follow =
      1 - Math.pow(1 - clamp(s.hoverSmoothness, 0.001, 1), dt * 60);
    const nx = cursor.x + (tx - cursor.x) * follow;
    const ny = cursor.y + (ty - cursor.y) * follow;
    const blend = 1 - Math.exp(-dt / 0.05);
    cursor.vx += ((nx - cursor.x) / Math.max(dt, 1e-4) - cursor.vx) * blend;
    cursor.vy += ((ny - cursor.y) / Math.max(dt, 1e-4) - cursor.vy) * blend;
    cursor.x = nx;
    cursor.y = ny;
  };

  const burst = (x: number, y: number) => {
    const s = getSettings();
    const count = clamp(Math.round(s.ballCount), 0, MAX_BALLS);
    const radius = s.animationSize * 0.45;
    balls.slice(0, count).forEach((ball) => {
      const dx = ball.x - x;
      const dy = ball.y - y;
      const distance = Math.hypot(dx, dy) || 1e-4;
      if (distance > radius) return;
      const falloff = Math.pow(1 - distance / radius, 1.2);
      const kick = 72 * falloff;
      ball.vx += (dx / distance) * kick - (dy / distance) * kick * 0.3;
      ball.vy += (dy / distance) * kick + (dx / distance) * kick * 0.3;
    });
    cursor.pulseVelocity += 9;
  };

  const shapeOf = (body: Deformable, out: Float32Array, offset: number) => {
    const m = Math.hypot(body.a, body.b);
    const c = Math.cosh(m);
    const k = m > 1e-6 ? Math.sinh(m) / m : 1;
    out[offset] = c - k * body.a;
    out[offset + 1] = -k * body.b;
    out[offset + 2] = c + k * body.a;
    out[offset + 3] = 0;
  };

  const draw = () => {
    const s = getSettings();
    const count = clamp(Math.round(s.ballCount), 0, MAX_BALLS);
    const look = presence();
    const { gamma, threshold } = bridge(s);
    balls.slice(0, count).forEach((ball, i) => {
      const radius = ball.radius * look.size;
      ballData[i * 4] = ball.x;
      ballData[i * 4 + 1] = ball.y;
      ballData[i * 4 + 2] = radius * radius;
      ballData[i * 4 + 3] = 0;
      shapeOf(ball, shapeData, i * 4);
    });
    const cursorRadius = s.cursorBallSize * look.size * (1 + cursor.pulse);
    ballData[count * 4] = cursor.x;
    ballData[count * 4 + 1] = cursor.y;
    ballData[count * 4 + 2] = cursorRadius * cursorRadius;
    ballData[count * 4 + 3] = 1;
    shapeOf(cursor, shapeData, count * 4);

    gl.uniform2f(loc.resolution, canvas.width, canvas.height);
    gl.uniform1f(loc.scale, s.animationSize / canvas.height);
    gl.uniform4fv(loc.balls, ballData);
    gl.uniform4fv(loc.shapes, shapeData);
    gl.uniform1i(loc.count, count + 1);
    gl.uniform1f(loc.gamma, gamma);
    gl.uniform1f(loc.threshold, threshold);
    gl.uniform3fv(loc.color, rgb(s.color));
    gl.uniform3fv(loc.cursorColor, rgb(s.cursorBallColor));
    gl.uniform1i(loc.variant, VARIANTS[s.variant] ?? 0);
    gl.uniform1f(loc.line, Math.max(0.25, s.lineWidth) * view.ratio);
    gl.uniform1f(loc.spacing, 0.28);
    gl.uniform1f(loc.rings, clamp(Math.round(s.rings), 0, 12));
    gl.uniform1f(loc.opaque, s.enableTransparency ? 0 : 1);
    gl.clearColor(0, 0, 0, s.enableTransparency ? 0 : 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    dirty = false;
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    const s = getSettings();
    if (!s.paused && dt > 1e-4) {
      clock += dt;
      const count = clamp(Math.round(s.ballCount), 0, MAX_BALLS);
      const look = presence();
      moveCursor(dt, s, look);
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      for (let i = 0; i < steps; i++) step(dt / steps, s, count, look);
      deform(cursor, dt, s);
      cursor.pulseVelocity +=
        (-170 * cursor.pulse - 2 * 0.42 * 13 * cursor.pulseVelocity) * dt;
      cursor.pulse = Math.max(-0.4, cursor.pulse + cursor.pulseVelocity * dt);
      dirty = true;
    }
    if (dirty) draw();
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (raf || !visible) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };

  resize();
  start();

  return {
    resize,
    setVisible: (next) => {
      visible = next;
      if (visible) start();
    },
    move: (clientX, clientY) => {
      const point = toWorld(clientX, clientY);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = point.inside;
    },
    leave: () => {
      pointer.inside = false;
    },
    press: (clientX, clientY) => {
      const s = getSettings();
      if (!s.clickBurst || !s.enableMouseInteraction || s.paused) return;
      const point = toWorld(clientX, clientY);
      if (point.inside) burst(point.x, point.y);
    },
    refresh: () => {
      dirty = true;
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
