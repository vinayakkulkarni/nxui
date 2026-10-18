import { DOT_GRID_FRAGMENT, DOT_GRID_VERTEX } from './dot-grid-shaders';
import type {
  DotGridEngine,
  DotGridEngineOptions,
  DotGridRgb,
  DotGridShock,
} from './types';

const UNIFORMS = [
  'uResolution',
  'uSize',
  'uSwell',
  'uStretch',
  'uGlow',
  'uBase',
  'uActive',
  'uOpacity',
  'uFade',
  'uShape',
];

const WHITE: DotGridRgb = [1, 1, 1];

function toRgb(color: string): DotGridRgb {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color).trim());
  const digits = match?.[1];
  if (!digits) return WHITE;
  const hex =
    digits.length === 3
      ? digits.replace(/./g, (digit) => digit + digit)
      : digits;
  return [
    Number.parseInt(hex.slice(0, 2), 16) / 255,
    Number.parseInt(hex.slice(2, 4), 16) / 255,
    Number.parseInt(hex.slice(4, 6), 16) / 255,
  ];
}

function smootherstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function backOut(t: number): number {
  const s = 1.9;
  const x = t - 1;
  return 1 + x * x * ((s + 1) * x + s);
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
  return shader;
}

export function createDotGridEngine(
  options: DotGridEngineOptions,
): DotGridEngine | null {
  const { canvas, getSettings, reduce } = options;
  const context = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;

  const vertex = compile(gl, gl.VERTEX_SHADER, DOT_GRID_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, DOT_GRID_FRAGMENT);
  const linked = gl.createProgram();
  if (!vertex || !fragment || !linked) return null;
  gl.attachShader(linked, vertex);
  gl.attachShader(linked, fragment);
  gl.linkProgram(linked);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(linked, gl.LINK_STATUS)) {
    gl.deleteProgram(linked);
    return null;
  }
  const program: WebGLProgram = linked;

  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of UNIFORMS) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  function loc(name: string): WebGLUniformLocation | null {
    return uniforms[name] ?? null;
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const cornerBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const instanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 24, 16);
  gl.vertexAttribDivisor(2, 1);
  gl.bindVertexArray(null);

  const view = { width: 0, height: 0, left: 0, top: 0, ratio: 1 };
  const grid = {
    count: 0,
    cols: 1,
    rows: 1,
    cell: 1,
    centerX: 0,
    centerY: 0,
    reach: 1,
  };
  let rest = new Float32Array(0);
  let offset = new Float32Array(0);
  let velocity = new Float32Array(0);
  let force = new Float32Array(0);
  let next = new Float32Array(0);
  let wave = new Float32Array(0);
  let energy = new Float32Array(0);
  let instances = new Float32Array(0);
  const pointer = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    time: 0,
    inside: false,
    presence: 0,
  };
  const shocks: DotGridShock[] = [];
  // -1 = waiting for the first frame, null = no intro, else start time.
  let introStart: number | null = getSettings().intro && !reduce ? -1 : null;
  let visible = true;
  let raf = 0;
  let last = 0;

  function rebuild() {
    const { dotSize: size, gap: spacing } = getSettings();
    const cell = Math.max(2, size + spacing);
    const cols = Math.max(1, Math.floor((view.width + spacing) / cell));
    const rows = Math.max(1, Math.floor((view.height + spacing) / cell));
    const startX = (view.width - (cols * cell - spacing)) / 2 + size / 2;
    const startY = (view.height - (rows * cell - spacing)) / 2 + size / 2;
    const count = cols * rows;
    rest = new Float32Array(count * 2);
    offset = new Float32Array(count * 2);
    velocity = new Float32Array(count * 2);
    force = new Float32Array(count * 2);
    next = new Float32Array(count * 2);
    wave = new Float32Array(count * 4);
    energy = new Float32Array(count);
    instances = new Float32Array(count * 6);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = (row * cols + col) * 2;
        rest[index] = startX + col * cell;
        rest[index + 1] = startY + row * cell;
      }
    }
    Object.assign(grid, {
      count,
      cols,
      rows,
      cell,
      centerX: view.width / 2,
      centerY: view.height / 2,
      reach: Math.hypot(view.width, view.height) / 2,
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instances.byteLength, gl.DYNAMIC_DRAW);
  }

  function step(dt: number, now: number) {
    const s = getSettings();
    const motion = reduce ? 0 : 1;
    const zeta = 1 - 0.85 * Math.min(1, Math.max(0, s.bounce));
    const omega = 4 / (zeta * Math.max(0.2, s.returnDuration));
    const stiffness = omega * omega;
    const damping = 2 * zeta * omega;
    const radius = Math.max(1, s.proximity);
    const speed = Math.hypot(pointer.vx, pointer.vy);
    const drive =
      s.mouseInteraction && pointer.inside
        ? 6500 * Math.tanh(speed / 900) * s.strength * motion
        : 0;
    const dirX = speed > 0.001 ? pointer.vx / speed : 0;
    const dirY = speed > 0.001 ? pointer.vy / speed : 0;
    const width = grid.cell * 1.4;
    const travel = 650;
    const active = shocks.map((shock) => {
      const front = ((now - shock.start) / 1000) * travel;
      const power = smootherstep(1 - front / Math.max(1, s.shockRadius));
      return {
        x: shock.x,
        y: shock.y,
        front,
        amplitude: power * s.shockStrength * grid.cell * 0.24 * motion,
      };
    });
    const coupling =
      (Math.max(0, s.tension) * 900) ** 2 / (grid.cell * grid.cell);
    const viscosity = Math.sqrt(coupling) * 0.06;
    const limit = Math.sqrt(stiffness + 8 * coupling) + damping + 8 * viscosity;
    const steps = Math.min(
      24,
      Math.max(1, Math.ceil(dt / Math.min(1 / 120, 1.2 / limit))),
    );
    const h = dt / steps;
    for (let i = 0; i < grid.count; i++) {
      const index = i * 2;
      const rx = rest[index]!;
      const ry = rest[index + 1]!;
      let ax = 0;
      let ay = 0;
      if (drive > 0) {
        const ex = rx + offset[index]! - pointer.x;
        const ey = ry + offset[index + 1]! - pointer.y;
        const distance = Math.hypot(ex, ey);
        if (distance < radius) {
          const weight = smootherstep(1 - distance / radius) * drive;
          const nx = distance > 0.001 ? ex / distance : 0;
          const ny = distance > 0.001 ? ey / distance : 0;
          ax += weight * (dirX + nx * 0.6);
          ay += weight * (dirY + ny * 0.6);
        }
      }
      let wx = 0;
      let wy = 0;
      let wvx = 0;
      let wvy = 0;
      for (const shock of active) {
        if (shock.amplitude <= 0) continue;
        const ex = rx - shock.x;
        const ey = ry - shock.y;
        const distance = Math.hypot(ex, ey);
        const u = (distance - shock.front) / width;
        if (Math.abs(u) < 3 && distance > 0.001) {
          const nx = ex / distance;
          const ny = ey / distance;
          const profile = Math.exp(-u * u);
          const push = shock.amplitude * profile;
          const rate = ((shock.amplitude * 2 * u * profile) / width) * travel;
          wx += nx * push;
          wy += ny * push;
          wvx += nx * rate;
          wvy += ny * rate;
          ax += nx * push * stiffness * 0.35;
          ay += ny * push * stiffness * 0.35;
        }
      }
      force[index] = ax;
      force[index + 1] = ay;
      const target = i * 4;
      wave[target] = wx;
      wave[target + 1] = wy;
      wave[target + 2] = wvx;
      wave[target + 3] = wvy;
    }
    const { cols, rows } = grid;
    const stride = cols * 2;
    for (let n = 0; n < steps; n++) {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const index = (row * cols + col) * 2;
          let ax =
            force[index]! -
            stiffness * offset[index]! -
            damping * velocity[index]!;
          let ay =
            force[index + 1]! -
            stiffness * offset[index + 1]! -
            damping * velocity[index + 1]!;
          if (coupling > 0) {
            // Discrete Laplacian of offset and velocity over the 4 neighbours:
            // pushes ripple through the grid like jelly.
            let lx = -4 * offset[index]!;
            let ly = -4 * offset[index + 1]!;
            let mx = -4 * velocity[index]!;
            let my = -4 * velocity[index + 1]!;
            if (col > 0) {
              lx += offset[index - 2]!;
              ly += offset[index - 1]!;
              mx += velocity[index - 2]!;
              my += velocity[index - 1]!;
            }
            if (col < cols - 1) {
              lx += offset[index + 2]!;
              ly += offset[index + 3]!;
              mx += velocity[index + 2]!;
              my += velocity[index + 3]!;
            }
            if (row > 0) {
              lx += offset[index - stride]!;
              ly += offset[index - stride + 1]!;
              mx += velocity[index - stride]!;
              my += velocity[index - stride + 1]!;
            }
            if (row < rows - 1) {
              lx += offset[index + stride]!;
              ly += offset[index + stride + 1]!;
              mx += velocity[index + stride]!;
              my += velocity[index + stride + 1]!;
            }
            ax += coupling * lx + viscosity * mx;
            ay += coupling * ly + viscosity * my;
          }
          next[index] = velocity[index]! + ax * h;
          next[index + 1] = velocity[index + 1]! + ay * h;
        }
      }
      for (let i = 0; i < offset.length; i++) {
        velocity[i] = next[i]!;
        offset[i] = offset[i]! + velocity[i]! * h;
      }
    }
    for (let i = 0; i < grid.count; i++) {
      const index = i * 2;
      const target = i * 4;
      energy[i] = Math.min(
        1,
        (Math.hypot(
          velocity[index]! + wave[target + 2]!,
          velocity[index + 1]! + wave[target + 3]!,
        ) /
          380) *
          0.85 +
          (Math.hypot(
            offset[index]! + wave[target]!,
            offset[index + 1]! + wave[target + 1]!,
          ) /
            (grid.cell * 2.2)) *
            0.35,
      );
    }
    for (let i = shocks.length - 1; i >= 0; i--) {
      if (active[i]!.front > s.shockRadius + width * 3) shocks.splice(i, 1);
    }
    const decay = 1 - Math.exp(-dt / 0.08);
    pointer.vx -= pointer.vx * decay;
    pointer.vy -= pointer.vy * decay;
    const presenceTarget = s.mouseInteraction && pointer.inside ? 1 : 0;
    pointer.presence +=
      (presenceTarget - pointer.presence) * (1 - Math.exp(-dt / 0.2));
  }

  function render(now: number) {
    const s = getSettings();
    const radius = Math.max(1, s.proximity);
    const introAge =
      introStart === null
        ? Infinity
        : introStart < 0
          ? 0
          : (now - introStart) / 1000;
    const introFront = introAge * grid.reach * 1.25;
    const introBand = grid.cell * 4;
    for (let i = 0; i < grid.count; i++) {
      const index = i * 2;
      const source = i * 4;
      const x = rest[index]! + offset[index]! + wave[source]!;
      const y = rest[index + 1]! + offset[index + 1]! + wave[source + 1]!;
      let glowing = energy[i]!;
      if (pointer.presence > 0.001) {
        const distance = Math.hypot(x - pointer.x, y - pointer.y);
        if (distance < radius) {
          glowing = Math.max(
            glowing,
            smootherstep(1 - distance / radius) * 0.4 * pointer.presence,
          );
        }
      }
      let scale = 1;
      if (introStart !== null) {
        const distance = Math.hypot(
          rest[index]! - grid.centerX,
          rest[index + 1]! - grid.centerY,
        );
        const appear = Math.min(
          1,
          Math.max(0, (introFront - distance) / introBand),
        );
        scale = appear >= 1 ? 1 : Math.max(0, backOut(appear));
        glowing = Math.max(glowing, Math.sin(appear * Math.PI) * 0.6);
      }
      const target = i * 6;
      instances[target] = x;
      instances[target + 1] = y;
      instances[target + 2] = velocity[index]! + wave[source + 2]!;
      instances[target + 3] = velocity[index + 1]! + wave[source + 3]!;
      instances[target + 4] = glowing;
      instances[target + 5] = scale;
    }
    const base = toRgb(s.baseColor);
    const accent = toRgb(s.activeColor);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.uniform2f(loc('uResolution'), view.width, view.height);
    gl.uniform1f(loc('uSize'), Math.max(0.5, s.dotSize));
    gl.uniform1f(loc('uSwell'), reduce ? 0 : Math.max(0, s.swell));
    gl.uniform1f(loc('uStretch'), reduce ? 0 : Math.max(0, s.stretch));
    gl.uniform1f(loc('uGlow'), Math.max(0, s.glow));
    gl.uniform3f(loc('uBase'), base[0], base[1], base[2]);
    gl.uniform3f(loc('uActive'), accent[0], accent[1], accent[2]);
    gl.uniform1f(loc('uOpacity'), Math.min(1, Math.max(0, s.opacity)));
    gl.uniform1f(loc('uFade'), Math.min(1, Math.max(0, s.fade)));
    gl.uniform1i(loc('uShape'), s.shape === 'square' ? 1 : 0);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, instances);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, grid.count);
    gl.bindVertexArray(null);
  }

  function settled(now: number): boolean {
    if (shocks.length) return false;
    if (introStart !== null) {
      if (introStart < 0 || (now - introStart) / 1000 < 1.6) return false;
      introStart = null;
    }
    if (Math.abs(pointer.vx) + Math.abs(pointer.vy) > 1) return false;
    const presenceTarget =
      getSettings().mouseInteraction && pointer.inside ? 1 : 0;
    if (Math.abs(presenceTarget - pointer.presence) > 0.002) return false;
    for (let i = 0; i < offset.length; i++) {
      if (Math.abs(offset[i]!) > 0.02 || Math.abs(velocity[i]!) > 0.5) {
        return false;
      }
    }
    return true;
  }

  function frame(now: number) {
    raf = 0;
    if (getSettings().paused || !visible) return;
    if (introStart !== null && introStart < 0) introStart = now;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    step(dt, now);
    render(now);
    if (!settled(now)) raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (raf || getSettings().paused || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(
      getSettings().dpr ?? window.devicePixelRatio ?? 1,
      2,
    );
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    Object.assign(view, {
      width,
      height,
      left: rect.left,
      top: rect.top,
      ratio,
    });
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    rebuild();
    render(performance.now());
  }

  function locate(event: PointerEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    view.left = rect.left;
    view.top = rect.top;
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  function pointerLeave() {
    pointer.inside = false;
    pointer.time = 0;
    wake();
  }

  resize();
  wake();

  return {
    rebuild() {
      rebuild();
      render(performance.now());
      wake();
    },
    refresh() {
      render(performance.now());
      wake();
    },
    resize() {
      resize();
      wake();
    },
    pointerMove(event) {
      if (!getSettings().mouseInteraction) return;
      const [x, y] = locate(event);
      const inside = x >= 0 && y >= 0 && x <= view.width && y <= view.height;
      const time = event.timeStamp || performance.now();
      if (inside && pointer.inside && pointer.time) {
        const elapsed = Math.max(4, time - pointer.time) / 1000;
        const vx = (x - pointer.x) / elapsed;
        const vy = (y - pointer.y) / elapsed;
        pointer.vx += (vx - pointer.vx) * 0.6;
        pointer.vy += (vy - pointer.vy) * 0.6;
      } else {
        pointer.vx = 0;
        pointer.vy = 0;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.time = time;
      if (inside !== pointer.inside || inside) {
        pointer.inside = inside;
        wake();
      }
    },
    pointerDown(event) {
      if (!getSettings().clickShock || reduce) return;
      const [x, y] = locate(event);
      if (x < 0 || y < 0 || x > view.width || y > view.height) return;
      shocks.push({ x, y, start: performance.now() });
      if (shocks.length > 6) shocks.shift();
      wake();
    },
    pointerOut(event) {
      if (!event.relatedTarget) pointerLeave();
    },
    pointerLeave,
    setVisible(isVisible) {
      visible = isVisible;
      if (visible) wake();
    },
    visibilityChanged() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        wake();
      }
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      gl.deleteBuffer(cornerBuffer);
      gl.deleteBuffer(instanceBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
