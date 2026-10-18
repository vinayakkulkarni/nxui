import { SPECULAR_FRAGMENT, SPECULAR_VERTEX } from './specular-shaders';
import type { SpecularAim, SpecularSettings } from './types';

/** Canvas bleed around the button (px) so the glow is not clipped. */
const SPECULAR_PAD = 24;

const TAU = Math.PI * 2;

const UNIFORMS = [
  'uCenter',
  'uHalf',
  'uRadius',
  'uPx',
  'uSpot',
  'uEntry',
  'uLineColor',
  'uBaseColor',
  'uIntensity',
  'uWindow',
  'uThickness',
  'uGlow',
] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const wrap = (value: number) => value - Math.floor(value);

/** Normalised 0–1 position along the rounded-rect rim (CCW from +x axis). */
function loopPosition(
  x: number,
  y: number,
  halfX: number,
  halfY: number,
  r: number,
): number {
  const innerX = halfX - r;
  const innerY = halfY - r;
  const arc = (Math.PI / 2) * r;
  const quarter = innerX + innerY + arc;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const qx = ax - innerX;
  const qy = ay - innerY;
  let s: number;
  if (qx > 0 && qy > 0) s = innerY + Math.atan2(qy, qx) * r;
  else if (qx > qy) s = Math.min(ay, innerY);
  else s = innerY + arc + innerX - Math.min(ax, innerX);
  if (x < 0) s = y >= 0 ? 2 * quarter - s : 2 * quarter + s;
  else if (y < 0) s = 4 * quarter - s;
  return wrap(s / Math.max(4 * quarter, 0.0001));
}

/** Inverse of loopPosition: the rim point for a normalised position. */
function rimPoint(
  position: number,
  halfX: number,
  halfY: number,
  r: number,
): [number, number] {
  const innerX = halfX - r;
  const innerY = halfY - r;
  const arc = (Math.PI / 2) * r;
  const quarter = innerX + innerY + arc;
  let s = wrap(position) * 4 * quarter;
  let signX = 1;
  let signY = 1;
  if (s > 3 * quarter) {
    s = 4 * quarter - s;
    signY = -1;
  } else if (s > 2 * quarter) {
    s -= 2 * quarter;
    signX = -1;
    signY = -1;
  } else if (s > quarter) {
    s = 2 * quarter - s;
    signX = -1;
  }
  let x = innerX - (s - innerY - arc);
  let y = halfY;
  if (s <= innerY) {
    x = halfX;
    y = s;
  } else if (s <= innerY + arc) {
    const angle = (s - innerY) / Math.max(r, 0.0001);
    x = innerX + Math.cos(angle) * r;
    y = innerY + Math.sin(angle) * r;
  }
  return [x * signX, y * signY];
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

function link(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, SPECULAR_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, SPECULAR_FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

/**
 * WebGL2 rim light for SpecularButton. Renders on demand: the rAF loop only
 * runs while the highlight is settling, spinning or a press flash decays.
 */
export class SpecularLight {
  private button: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private uniforms = new Map<string, WebGLUniformLocation | null>();
  private getSettings: () => SpecularSettings;
  private probe: CanvasRenderingContext2D | null;
  private colors = new Map<string, number[]>();
  private view = { width: 1, height: 1, ratio: 1 };
  private pointer = { x: 0, y: 0, known: false };
  private state = { spot: 0, level: 0, press: 0, ready: false };
  private raf = 0;
  private last = 0;
  private visible = true;

  private constructor(
    button: HTMLElement,
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    getSettings: () => SpecularSettings,
  ) {
    this.button = button;
    this.canvas = canvas;
    this.gl = gl;
    this.program = program;
    this.getSettings = getSettings;
    for (const name of UNIFORMS) {
      this.uniforms.set(name, gl.getUniformLocation(program, name));
    }
    this.buffer = gl.createBuffer();
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.probe = document
      .createElement('canvas')
      .getContext('2d', { willReadFrequently: true });
  }

  static create(
    button: HTMLElement,
    canvas: HTMLCanvasElement,
    getSettings: () => SpecularSettings,
  ): SpecularLight | null {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return null;
    const program = link(gl);
    if (!program) return null;
    return new SpecularLight(button, canvas, gl, program, getSettings);
  }

  private u(name: (typeof UNIFORMS)[number]) {
    return this.uniforms.get(name) ?? null;
  }

  private toRgb(value: string): number[] {
    const cached = this.colors.get(value);
    if (cached) return cached;
    let rgb = [1, 1, 1];
    const probe = this.probe;
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const [r = 255, g = 255, b = 255] = probe.getImageData(0, 0, 1, 1).data;
      rgb = [r / 255, g / 255, b / 255];
    }
    this.colors.set(value, rgb);
    return rgb;
  }

  private cornerRadius(s: SpecularSettings) {
    return Math.min(s.radius, this.view.width / 2, this.view.height / 2);
  }

  private restSpot(s: SpecularSettings) {
    const { width, height } = this.view;
    const r = this.cornerRadius(s);
    const inset = r * (1 - Math.SQRT1_2);
    return loopPosition(
      inset - width / 2,
      height / 2 - inset,
      width / 2,
      height / 2,
      r,
    );
  }

  private aim(s: SpecularSettings): SpecularAim | null {
    if (!s.followMouse || s.disabled || !this.pointer.known) return null;
    const rect = this.button.getBoundingClientRect();
    const scale = rect.width / this.view.width || 1;
    const halfX = this.view.width / 2;
    const halfY = this.view.height / 2;
    const x = (this.pointer.x - rect.left - rect.width / 2) / scale;
    const y = (rect.top + rect.height / 2 - this.pointer.y) / scale;
    const distance = Math.hypot(
      Math.max(Math.abs(x) - halfX, 0),
      Math.max(Math.abs(y) - halfY, 0),
    );
    const t = clamp(1 - distance / s.proximity, 0, 1);
    const near = t * t * (3 - 2 * t);
    const nearest = loopPosition(x, y, halfX, halfY, this.cornerRadius(s));
    if (distance > 0) return { spot: nearest, near };
    const depth = clamp(
      Math.min(halfX - Math.abs(x), halfY - Math.abs(y)) / (halfY * 0.8),
      0,
      1,
    );
    const sway = this.restSpot(s) - (x / halfX) * 0.06 - (y / halfY) * 0.02;
    const offset = sway - nearest - Math.round(sway - nearest);
    return {
      spot: wrap(nearest + offset * depth * depth * (3 - 2 * depth)),
      near,
    };
  }

  private draw(s: SpecularSettings) {
    const { gl, canvas, state } = this;
    const { width, height } = this.view;
    const scaleX = canvas.width / (width + SPECULAR_PAD * 2);
    const scaleY = canvas.height / (height + SPECULAR_PAD * 2);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniform2f(
      this.u('uCenter'),
      (SPECULAR_PAD + width / 2) * scaleX,
      (SPECULAR_PAD + height / 2) * scaleY,
    );
    gl.uniform2f(this.u('uHalf'), (width / 2) * scaleX, (height / 2) * scaleY);
    const r = Math.min(s.radius, width / 2, height / 2);
    gl.uniform1f(this.u('uRadius'), r * scaleX);
    gl.uniform1f(this.u('uPx'), this.view.ratio);
    const [rimX, rimY] = rimPoint(state.spot, width / 2, height / 2, r);
    const len = Math.hypot(rimX, rimY);
    const pull = 1 - Math.min(0.35 * (height / 2), len) / Math.max(len, 0.0001);
    gl.uniform1f(this.u('uSpot'), state.spot);
    gl.uniform2f(this.u('uEntry'), rimX * pull * scaleX, rimY * pull * scaleY);
    gl.uniform3fv(this.u('uLineColor'), this.toRgb(s.lineColor));
    gl.uniform3fv(this.u('uBaseColor'), this.toRgb(s.baseColor));
    gl.uniform1f(
      this.u('uIntensity'),
      s.intensity * (state.level + state.press * 0.8),
    );
    gl.uniform2f(
      this.u('uWindow'),
      s.shineSize / 360 + state.press * 0.06,
      s.shineFade / 360 + 0.0001,
    );
    gl.uniform1f(this.u('uThickness'), s.thickness);
    gl.uniform1f(this.u('uGlow'), s.glow);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (!this.visible) return;
    const s = this.getSettings();
    const state = this.state;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    const target = this.aim(s);
    const spinning = s.autoAnimate && !s.reduceMotion;
    const steering = !!target && target.near > 0;
    if (!state.ready) {
      state.spot = this.restSpot(s);
      state.level = s.autoAnimate ? 1 : s.idleIntensity;
      state.ready = true;
    }
    let diff = 0;
    if (spinning && !steering) {
      state.spot = wrap(state.spot + (s.speed / TAU) * dt);
    } else {
      diff = (target && steering ? target.spot : this.restSpot(s)) - state.spot;
      diff -= Math.round(diff);
      state.spot = wrap(state.spot + diff * (1 - Math.exp(-dt * 8)));
    }
    const level = s.autoAnimate
      ? 1
      : s.idleIntensity + (1 - s.idleIntensity) * (target ? target.near : 0);
    state.level += (level - state.level) * (1 - Math.exp(-dt * 7));
    state.press *= Math.exp(-dt * 5);
    this.draw(s);
    const settling =
      Math.abs(diff) > 0.0002 ||
      Math.abs(level - state.level) > 0.001 ||
      state.press > 0.002;
    if (settling || (spinning && !steering)) {
      this.raf = requestAnimationFrame(this.frame);
    } else {
      this.last = 0;
    }
  };

  /** Schedule a frame if none is pending (cheap; call on any change). */
  wake() {
    if (!this.raf && this.visible) this.raf = requestAnimationFrame(this.frame);
  }

  measure(entry?: ResizeObserverEntry) {
    const box = entry?.borderBoxSize?.[0];
    const view = this.view;
    view.width = Math.max(1, box ? box.inlineSize : this.button.offsetWidth);
    view.height = Math.max(1, box ? box.blockSize : this.button.offsetHeight);
    view.ratio = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.width = Math.max(
      1,
      Math.round((view.width + SPECULAR_PAD * 2) * view.ratio),
    );
    this.canvas.height = Math.max(
      1,
      Math.round((view.height + SPECULAR_PAD * 2) * view.ratio),
    );
    if (this.state.ready) this.draw(this.getSettings());
    this.wake();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (visible) {
      this.last = 0;
      this.wake();
    }
  }

  setPointer(x: number, y: number) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.known = true;
    this.wake();
  }

  clearPointer() {
    this.pointer.known = false;
    this.wake();
  }

  press(x: number, y: number) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.known = true;
    if (!this.getSettings().disabled) this.state.press = 1;
    this.wake();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    const gl = this.gl;
    gl.deleteBuffer(this.buffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
