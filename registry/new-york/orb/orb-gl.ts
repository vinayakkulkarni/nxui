import {
  ORB_FOCAL,
  ORB_FRAGMENT,
  ORB_INTRO_SECONDS,
  ORB_VERTEX,
} from './orb-shaders';
import type {
  OrbColor,
  OrbEngine,
  OrbEngineOptions,
  OrbProgram,
} from './types';

export const ORB_DEFAULT_COLORS = ['#9c43fe', '#4cc2e9', '#101499'];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

function link(gl: WebGL2RenderingContext): OrbProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, ORB_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, ORB_FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
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

// Rotates a color around the luma axis in YIQ space, keeping brightness.
function shiftHue(rgb: OrbColor, degrees: number): OrbColor {
  if (!degrees) return rgb;
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const [r, g, b] = rgb;
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const i = 0.596 * r - 0.274 * g - 0.322 * b;
  const q = 0.211 * r - 0.523 * g + 0.312 * b;
  const ni = i * cos - q * sin;
  const nq = i * sin + q * cos;
  return [
    y + 0.956 * ni + 0.621 * nq,
    y - 0.272 * ni - 0.647 * nq,
    y - 1.106 * ni + 1.703 * nq,
  ];
}

export function createOrbEngine(options: OrbEngineOptions): OrbEngine | null {
  const { container, canvas, getSettings, reduce, onRestored } = options;
  const context = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;
  const linked = link(gl);
  if (!linked) return null;
  const program: OrbProgram = linked;
  const u = program.uniforms;

  function onContextLost(event: Event) {
    event.preventDefault();
  }
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Any CSS color string resolves through a 1×1 2D canvas.
  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const cache = new Map<string, OrbColor>();
  function parse(value: string): OrbColor {
    const hit = cache.get(value);
    if (hit) return hit;
    let rgb: OrbColor = [0, 0, 0];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = data[3]
        ? [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255]
        : [0, 0, 0];
    }
    cache.set(value, rgb);
    return rgb;
  }

  const view = { width: 1, height: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const introOn = getSettings().intro && !reduce;
  const state = {
    time: 0,
    swirl: 0,
    orbit: 0,
    echo: 1,
    rotation: 0,
    hover: 0,
    near: 0,
    reachX: 0,
    reachY: 0,
    reachSpeedX: 0,
    reachSpeedY: 0,
    pulse: 0,
    pulseSpeed: 0,
    kick: introOn ? 2.5 : 0,
    reveal: introOn ? 0 : 1,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let disposed = false;
  let lastDpr = getSettings().dpr;

  // Maps a container point into the orb's own (tilted, rotated) plane.
  function toOrb(x: number, y: number): [number, number] {
    const s = getSettings();
    const side = Math.min(view.width, view.height);
    const scale = 1 / (s.size * (1 + state.pulse));
    let ux = ((x - view.width / 2) / side) * 2 * scale;
    let uy = ((view.height / 2 - y) / side) * 2 * scale;
    if (s.tiltX || s.tiltY) {
      const ax = (-s.tiltX * Math.PI) / 180;
      const ay = (s.tiltY * Math.PI) / 180;
      const cx = Math.cos(ax);
      const sx = Math.sin(ax);
      const cy = Math.cos(ay);
      const sy = Math.sin(ay);
      const nx = sy * cx;
      const ny = -sx;
      const nz = cy * cx;
      const rx = ux;
      const ry = uy;
      const rz = -ORB_FOCAL;
      const denom = nx * rx + ny * ry + nz * rz;
      const t =
        -(nz * ORB_FOCAL) / (Math.abs(denom) > 0.00001 ? denom : -0.00001);
      if (t <= 0) return [99, 99];
      const qx = rx * t;
      const qy = ry * t;
      const qz = ORB_FOCAL + rz * t;
      ux = qx * cy - qz * sy;
      uy = qx * sy * sx + qy * cx + qz * cy * sx;
    }
    const sin = Math.sin(state.rotation);
    const cos = Math.cos(state.rotation);
    return [cos * ux - sin * uy, sin * ux + cos * uy];
  }

  function render() {
    const s = getSettings();
    const c1 = shiftHue(parse(s.colors[0]), s.hue);
    const c2 = shiftHue(parse(s.colors[1]), s.hue);
    const c3 = shiftHue(parse(s.colors[2]), s.hue);
    const reveal = state.reveal;
    const back = reveal - 1;
    const grow = 1 + 2.2 * back * back * back + 1.2 * back * back;
    const fade = Math.min(1, reveal / 0.55);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program.program);
    gl.bindVertexArray(vao);
    gl.uniform2f(u.uResolution ?? null, canvas.width, canvas.height);
    gl.uniform1f(u.uTime ?? null, state.time);
    gl.uniform2f(u.uReach ?? null, state.reachX, state.reachY);
    gl.uniform1f(u.uNear ?? null, state.near);
    gl.uniform1f(u.uAwake ?? null, state.hover * s.hoverIntensity * 0.18);
    gl.uniform1f(u.uRotation ?? null, state.rotation);
    gl.uniform3fv(u.uBackground ?? null, parse(s.backgroundColor));
    gl.uniform3fv(u.uColor1 ?? null, c1);
    gl.uniform3fv(u.uColor2 ?? null, c2);
    gl.uniform3fv(u.uColor3 ?? null, c3);
    gl.uniform1f(
      u.uScale ?? null,
      1 / (s.size * (1 + state.pulse) * (0.62 + 0.38 * grow)),
    );
    gl.uniform1f(u.uWobble ?? null, s.wobble);
    gl.uniform1f(u.uGlow ?? null, s.glow);
    gl.uniform1f(u.uBleed ?? null, s.bleed);
    gl.uniform1f(u.uHighlight ?? null, s.highlight);
    gl.uniform2f(
      u.uEcho ?? null,
      state.echo * 0.55,
      state.echo < 1 ? (1 - state.echo) * (1 - state.echo) : 0,
    );
    gl.uniform1f(u.uSwirl ?? null, state.swirl);
    gl.uniform1f(u.uOrbit ?? null, state.orbit);
    gl.uniform1f(u.uReveal ?? null, fade * fade * (3 - 2 * fade));
    gl.uniform1f(u.uOpacity ?? null, s.opacity);
    gl.uniform1f(u.uTrail ?? null, s.trail);
    gl.uniform2f(
      u.uTilt ?? null,
      (-s.tiltX * Math.PI) / 180,
      (s.tiltY * Math.PI) / 180,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now: number) {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    if (s.paused) {
      state.reveal = 1;
      render();
      last = 0;
      return;
    }
    const motion = reduce ? 0 : 1;
    const [px, py] = toOrb(pointer.x, pointer.y);
    const distance = Math.hypot(px, py);
    const region =
      pointer.inside && motion ? clamp((1.45 - distance) / 0.4, 0, 1) : 0;
    const zone = region * region * (3 - 2 * region);
    const aimed = zone * clamp((distance - 0.15) / 0.45, 0, 1);
    const near = zone > 0.5;
    const target = s.forceHoverState ? 1 : zone;
    state.hover += (target - state.hover) * (1 - Math.exp(-dt / 0.16));
    const reach = 0.075 * s.hoverIntensity * aimed;
    const goalX = distance > 0.0001 ? (px / distance) * reach : 0;
    const goalY = distance > 0.0001 ? (py / distance) * reach : 0;
    state.reachSpeedX +=
      (70 * (goalX - state.reachX) - 7 * state.reachSpeedX) * dt;
    state.reachSpeedY +=
      (70 * (goalY - state.reachY) - 7 * state.reachSpeedY) * dt;
    state.reachX += state.reachSpeedX * dt;
    state.reachY += state.reachSpeedY * dt;
    state.near +=
      (aimed * s.hoverIntensity - state.near) * (1 - Math.exp(-dt / 0.12));

    const step = dt * s.speed * motion;
    state.time += step;
    state.swirl += step * 2 * (1 + state.kick);
    state.echo = Math.min(1, state.echo + dt / 1.2);
    if (s.rotateOnHover) state.rotation += dt * 0.3 * state.hover * motion;

    const aim = Math.atan2(py, px);
    if (s.followCursor && near && motion) {
      const delta = Math.atan2(
        Math.sin(aim - state.orbit),
        Math.cos(aim - state.orbit),
      );
      state.orbit += delta * (1 - Math.exp(-dt * 6));
    } else {
      state.orbit -= step;
    }
    state.orbit = Math.atan2(Math.sin(state.orbit), Math.cos(state.orbit));

    state.pulseSpeed += (-170 * state.pulse - 11 * state.pulseSpeed) * dt;
    state.pulse += state.pulseSpeed * dt;
    state.kick *= Math.exp(-dt * 2.5);

    if (!s.intro || reduce) state.reveal = 1;
    else if (state.reveal < 1) {
      state.reveal = Math.min(1, state.reveal + dt / ORB_INTRO_SECONDS);
    }

    render();
    raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (!raf && !disposed && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  }

  function resize() {
    if (disposed) return;
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    view.width = width;
    view.height = height;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    render();
    wake();
  }

  function locate(clientX: number, clientY: number) {
    const rect = container.getBoundingClientRect();
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
    pointer.inside =
      pointer.x >= 0 &&
      pointer.y >= 0 &&
      pointer.x <= rect.width &&
      pointer.y <= rect.height;
  }

  resize();

  return {
    refresh() {
      if (disposed) return;
      const s = getSettings();
      if (s.dpr !== lastDpr) {
        lastDpr = s.dpr;
        resize();
        return;
      }
      if (!raf) render();
      wake();
    },
    resize,
    pointerMove(clientX, clientY) {
      locate(clientX, clientY);
      if (!getSettings().paused) wake();
    },
    pointerDown(clientX, clientY) {
      const s = getSettings();
      locate(clientX, clientY);
      if (!pointer.inside || !s.clickPulse || s.paused || reduce) return;
      const [px, py] = toOrb(pointer.x, pointer.y);
      if (Math.hypot(px, py) > 1) return;
      state.pulseSpeed += 0.9;
      state.kick = 2.2;
      state.echo = 0;
      wake();
    },
    pointerUp(pointerType) {
      if (pointerType !== 'mouse') pointer.inside = false;
    },
    pointerLeave() {
      pointer.inside = false;
    },
    setVisible(next) {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    visibilityChanged() {
      last = 0;
      wake();
    },
    dispose(loseContext) {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      gl.deleteProgram(program.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      if (loseContext) gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
