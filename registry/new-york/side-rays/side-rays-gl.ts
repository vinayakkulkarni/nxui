import { FRAGMENT, VERTEX } from './side-rays-shaders';
import type {
  SideRaysEngine,
  SideRaysFrame,
  SideRaysOrigin,
  SideRaysProps,
  SideRaysSettings,
} from './types';

interface LinkedProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

type Rgb = [number, number, number];

const PIXEL_BUDGET = 2.4e6;
const TAU = Math.PI * 2;

const ORIGINS: Record<SideRaysOrigin, SideRaysFrame> = {
  'top-right': { flipX: 0, flipY: 0, side: 0 },
  'top-left': { flipX: 1, flipY: 0, side: 0 },
  'bottom-right': { flipX: 0, flipY: 1, side: 0 },
  'bottom-left': { flipX: 1, flipY: 1, side: 0 },
  right: { flipX: 0, flipY: 0, side: 1 },
  left: { flipX: 1, flipY: 0, side: 1 },
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const wrapAngle = (angle: number): number =>
  ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

function parseColor(value: string | undefined): Rgb {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  const digits = hex?.[1];
  if (digits) {
    const full =
      digits.length === 3
        ? digits.replace(/./g, (digit) => digit + digit)
        : digits;
    return [
      Number.parseInt(full.slice(0, 2), 16) / 255,
      Number.parseInt(full.slice(2, 4), 16) / 255,
      Number.parseInt(full.slice(4, 6), 16) / 255,
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) {
    const channel = (part: string | undefined) =>
      clamp(Number.parseFloat(part ?? '255') / 255, 0, 1);
    return [channel(rgb[1]), channel(rgb[2]), channel(rgb[3])];
  }
  return [1, 1, 1];
}

export function normalizeSideRays(
  p: SideRaysProps,
  reduce: boolean,
): SideRaysSettings {
  return {
    colorA: parseColor(p.rayColor1 ?? '#FFC46B'),
    colorB: parseColor(p.rayColor2 ?? '#96c8ff'),
    blend: clamp(p.blend ?? 0.6, 0, 1),
    frame: ORIGINS[p.origin ?? 'top-right'] ?? ORIGINS['top-right'],
    speed: Math.max(0, p.speed ?? 2.5) * 0.4,
    intensity: Math.max(0, p.intensity ?? 2) * 0.75,
    spread: clamp(p.spread ?? 2, 0.1, 8) * 0.225,
    density: clamp(p.density ?? 5, 1, 40),
    sharpness: clamp(p.sharpness ?? 0.5, 0, 1),
    tilt: (clamp(p.tilt ?? 0, -180, 180) * Math.PI) / 180,
    falloff: clamp(p.falloff ?? 1.6, 0.2, 6),
    glow: Math.max(0, p.glow ?? 1) * 1.2,
    saturation: Math.max(0, p.saturation ?? 1),
    dust: clamp(p.dust ?? 0, 0, 1),
    followMouse: p.followMouse ?? true,
    mouseInfluence: clamp(p.mouseInfluence ?? 0.5, 0, 1),
    intro: p.intro ?? true,
    light: p.lightMode ?? false,
    opacity: clamp(p.opacity ?? 1, 0, 1),
    maxRatio: clamp(p.maxDevicePixelRatio ?? 2, 0.5, 3),
    reduce,
  };
}

function geometryFor(
  frame: SideRaysFrame,
  aspect: number,
): { source: [number, number]; heading: number } {
  return {
    source: frame.side
      ? [aspect * 0.5 + 0.42, 0.3]
      : [aspect * 0.5 + 0.1, 0.62],
    heading: frame.side ? 3.42 : -2.48,
  };
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
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGL2RenderingContext): LinkedProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

export function createSideRays(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  read: () => SideRaysSettings,
  options: { reveal: boolean; seed: number; pageVisible: boolean },
): SideRaysEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  const shader = gl ? link(gl) : null;
  if (!gl || !shader) return null;

  const vao = gl.createVertexArray();
  const size = { width: 1, height: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const aim = { value: 0, velocity: 0 };
  const focus = { angle: 0, strength: 0 };
  const initial = read();
  let time = options.seed * 100;
  let reveal = options.reveal && initial.intro && !initial.reduce ? 0 : 1;
  let raf = 0;
  let last = 0;
  let visible = true;
  let pageVisible = options.pageVisible;
  let lost = false;

  const resize = () => {
    const s = read();
    const rect = container.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      s.maxRatio,
      Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight)),
    );
    const width = Math.max(1, Math.round(cssWidth * ratio));
    const height = Math.max(1, Math.round(cssHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    size.width = cssWidth;
    size.height = cssHeight;
  };

  const pointerAngle = (s: SideRaysSettings): number => {
    let x = (pointer.x - size.width / 2) / size.height;
    let y = (size.height / 2 - pointer.y) / size.height;
    if (s.frame.flipX) x = -x;
    if (s.frame.flipY) y = -y;
    const { source, heading } = geometryFor(s.frame, size.width / size.height);
    return wrapAngle(
      Math.atan2(y - source[1], x - source[0]) - heading - s.tilt,
    );
  };

  const frame = (now: number) => {
    raf = 0;
    if (lost) return;
    const s = read();
    const reduced = s.reduce;
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    time += dt * s.speed * (reduced ? 0.3 : 1);
    if (reveal < 1) reveal = Math.min(1, reveal + dt / 1.6);

    const tracking = s.followMouse && pointer.inside && !reduced;
    const pointed = tracking ? pointerAngle(s) : 0;
    const target = tracking
      ? clamp(pointed, -s.spread, s.spread) * s.mouseInfluence
      : 0;
    const focusTarget = tracking ? s.mouseInfluence : 0;
    const ease = 1 - Math.exp(-dt * 6);
    if (tracking) {
      focus.angle +=
        (clamp(pointed - aim.value, -s.spread * 1.5, s.spread * 1.5) -
          focus.angle) *
        ease;
    }
    focus.strength += (focusTarget - focus.strength) * ease;
    const stiffness = 18;
    const damping = 2 * Math.sqrt(stiffness);
    aim.velocity +=
      ((target - aim.value) * stiffness - aim.velocity * damping) * dt;
    aim.value += aim.velocity * dt;

    const u = shader.uniforms;
    const at = (name: string) => u[name] ?? null;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(shader.program);
    gl.bindVertexArray(vao);
    gl.uniform2f(at('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(at('uTime'), time);
    gl.uniform3f(at('uColorA'), s.colorA[0], s.colorA[1], s.colorA[2]);
    gl.uniform3f(at('uColorB'), s.colorB[0], s.colorB[1], s.colorB[2]);
    gl.uniform1f(at('uBlend'), s.blend);
    gl.uniform1f(at('uIntensity'), s.intensity);
    gl.uniform1f(at('uSpread'), s.spread);
    gl.uniform1f(at('uDensity'), s.density);
    gl.uniform1f(at('uSharpness'), s.sharpness);
    gl.uniform1f(at('uFalloff'), s.falloff);
    gl.uniform1f(at('uGlow'), s.glow);
    gl.uniform1f(at('uSaturation'), s.saturation);
    gl.uniform1f(at('uDust'), s.dust);
    gl.uniform1f(at('uOpacity'), s.opacity);
    gl.uniform1f(at('uReveal'), 1 - Math.pow(1 - reveal, 3));
    gl.uniform1f(at('uLight'), s.light ? 1 : 0);
    gl.uniform3f(at('uFrame'), s.frame.flipX, s.frame.flipY, s.frame.side);
    gl.uniform1f(at('uAim'), s.tilt + aim.value);
    gl.uniform3f(
      at('uFocus'),
      focus.angle,
      Math.max(0.06, s.spread * 0.25),
      focus.strength * 1.4,
    );
    gl.uniform1f(at('uSway'), reduced ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const settling =
      Math.abs(target - aim.value) > 1e-4 ||
      Math.abs(aim.velocity) > 1e-4 ||
      Math.abs(focusTarget - focus.strength) > 1e-3;
    const busy = (s.speed > 0 && !reduced) || reveal < 1 || settling;
    if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf || lost || !visible || !pageVisible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const leave = () => {
    pointer.inside = false;
    wake();
  };

  return {
    resize,
    wake() {
      resize();
      wake();
    },
    setVisible(next) {
      visible = next;
      wake();
    },
    setPageVisible(next) {
      pageVisible = next;
      wake();
    },
    pointerMove(event) {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      wake();
    },
    pointerUp(event) {
      if (event.pointerType !== 'mouse') leave();
    },
    pointerLeave: leave,
    contextLost() {
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!gl.isContextLost()) {
        gl.deleteVertexArray(vao);
        gl.deleteProgram(shader.program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    },
  };
}
