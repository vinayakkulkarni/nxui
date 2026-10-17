import { MAX_PULSES, PIXEL_BUDGET, clamp, smoother } from './light-rays-config';
import { FRAGMENT, VERTEX } from './light-rays-shaders';
import type { LightRaysEngine, LightRaysEngineOptions } from './types';

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
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

function link(gl: WebGL2RenderingContext) {
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
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) {
      uniforms.set(
        info.name.replace(/\[0\]$/, ''),
        gl.getUniformLocation(program, info.name),
      );
    }
  }
  return { program, uniforms };
}

/**
 * Draws the volumetric rays into `canvas` with raw WebGL2.
 * Returns null when WebGL2 or the shader is unavailable.
 */
export function createLightRaysEngine(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  { getSettings, reducedMotion, playIntro }: LightRaysEngineOptions,
): LightRaysEngine | null {
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
  const loc = (name: string) => shader.uniforms.get(name) ?? null;

  const vao = gl.createVertexArray();
  const size = { width: 1, height: 1, ratio: 1 };
  const pointer = { x: 0.5, y: 0.5, inside: false, seen: false };
  const aim = { x: 0.5, y: 0.5 };
  const shade = { x: 0.5, y: 0.5, presence: 0 };
  const pulses: { age: number }[] = [];
  const pulseData = new Float32Array(MAX_PULSES * 4);
  let time = 0;
  let opening = getSettings().intro && !reducedMotion && playIntro ? 0 : 1;
  let raf = 0;
  let last = 0;
  let visible = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let lost = false;

  const resize = () => {
    const s = getSettings();
    const rect = container.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const detail = s.density * (0.35 + 0.65 * s.sharpness);
    const sampling = Math.max(
      clamp(0.35 + 0.3 * detail, 0.5, 2),
      s.noise > 0 ? 1 : 0,
    );
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      s.maxRatio,
      sampling,
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
    size.ratio = width / cssWidth;
  };

  const frame = (now: number) => {
    raf = 0;
    if (lost) return;
    const s = getSettings();
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    time += dt * s.speed * (reducedMotion ? 0.35 : 1);
    if (opening < 1) opening = Math.min(1, opening + dt / 1.8);

    const steer = 1 - Math.exp(-dt / 0.2);
    const aimX = s.follow && pointer.seen ? pointer.x : 0.5;
    const aimY = s.follow && pointer.seen ? pointer.y : 0.5;
    aim.x += (aimX - aim.x) * steer;
    aim.y += (aimY - aim.y) * steer;
    const glide = 1 - Math.exp(-dt / 0.08);
    shade.x += (pointer.x - shade.x) * glide;
    shade.y += (pointer.y - shade.y) * glide;
    const shading = pointer.inside && s.cursorShadow && !reducedMotion;
    shade.presence +=
      ((shading ? 1 : 0) - shade.presence) *
      (1 - Math.exp(-dt / (shading ? 0.25 : 0.5)));

    for (let index = pulses.length - 1; index >= 0; index--) {
      const pulse = pulses[index]!;
      pulse.age += dt;
      if (pulse.age >= 2) pulses.splice(index, 1);
    }
    pulseData.fill(0);
    for (const [index, pulse] of pulses.entries()) {
      const t = pulse.age;
      pulseData[index * 4] = 0.05 + t * 1.05;
      pulseData[index * 4 + 1] = 0.14 + t * 0.14;
      pulseData[index * 4 + 2] =
        0.9 * smoother(t / 0.15) * (1 - smoother(t / 2));
    }

    const width = size.width;
    const height = size.height;
    const sourceX = s.origin.anchor[0] * width;
    const sourceY = s.origin.anchor[1] * height;
    const cos = Math.cos(s.tilt);
    const sin = Math.sin(s.tilt);
    let dirX = s.origin.dir[0] * cos - s.origin.dir[1] * sin;
    let dirY = s.origin.dir[0] * sin + s.origin.dir[1] * cos;
    if (s.follow && s.influence > 0) {
      const mx = aim.x * width - sourceX;
      const my = aim.y * height - sourceY;
      const ml = Math.hypot(mx, my) || 1;
      const bx = dirX + (mx / ml - dirX) * s.influence;
      const by = dirY + (my / ml - dirY) * s.influence;
      const bl = Math.hypot(bx, by) || 1;
      dirX = bx / bl;
      dirY = by / bl;
    }
    const eased = 1 - Math.pow(1 - opening, 3);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shader.program);
    gl.bindVertexArray(vao);
    gl.uniform2f(loc('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(loc('uScale'), size.ratio);
    gl.uniform1f(loc('uTime'), time);
    gl.uniform2f(loc('uSource'), sourceX, sourceY);
    gl.uniform2f(loc('uAim'), dirX, dirY);
    gl.uniform1f(loc('uReach'), Math.max(width, height));
    gl.uniform3f(loc('uColor'), s.color[0], s.color[1], s.color[2]);
    gl.uniform1f(loc('uSpread'), s.spread);
    gl.uniform1f(loc('uLength'), s.length);
    gl.uniform1f(loc('uFade'), s.fade);
    gl.uniform1f(loc('uSaturation'), s.saturation);
    gl.uniform1f(loc('uPulsating'), s.pulsating ? 1 : 0);
    gl.uniform1f(loc('uNoise'), s.noise);
    gl.uniform1f(loc('uDistortion'), s.distortion);
    gl.uniform1f(loc('uDensity'), s.density);
    gl.uniform1f(loc('uSharpness'), s.sharpness);
    gl.uniform1f(loc('uGlow'), s.glow);
    gl.uniform1f(loc('uHaze'), s.haze);
    gl.uniform1f(loc('uAtmosphere'), s.atmosphere);
    gl.uniform1f(loc('uIntensity'), s.intensity);
    gl.uniform4f(
      loc('uShadow'),
      shade.x * width,
      shade.y * height,
      shade.presence,
      16,
    );
    gl.uniform4fv(loc('uPulses'), pulseData);
    gl.uniform2f(loc('uIntro'), eased * 2.6, smoother(opening / 0.5));
    gl.uniform1f(loc('uLight'), s.light ? 1 : 0);
    gl.uniform1f(loc('uOpacity'), s.opacity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const settling =
      Math.abs(aim.x - aimX) > 1e-4 ||
      Math.abs(aim.y - aimY) > 1e-4 ||
      (shade.presence > 1e-3 &&
        Math.abs(shade.x - pointer.x) + Math.abs(shade.y - pointer.y) > 1e-4) ||
      Math.abs((shading ? 1 : 0) - shade.presence) > 1e-3 ||
      pulses.length > 0;
    const busy = s.speed > 0 || opening < 1 || settling;
    if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf || lost || !visible || !pageVisible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const locate = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / Math.max(1, rect.width),
      y: (event.clientY - rect.top) / Math.max(1, rect.height),
      inside:
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom,
    };
  };

  const leave = () => {
    pointer.inside = false;
    wake();
  };

  resize();
  wake();

  return {
    refresh() {
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
      const spot = locate(event);
      if (!pointer.inside && spot.inside) {
        shade.x = spot.x;
        shade.y = spot.y;
      }
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = spot.inside;
      pointer.seen = true;
      wake();
    },
    pointerDown(event) {
      const spot = locate(event);
      if (!spot.inside || !getSettings().clickPulse || reducedMotion) return;
      pulses.push({ age: 0 });
      if (pulses.length > MAX_PULSES) pulses.shift();
      wake();
    },
    pointerUp(event) {
      if (event.pointerType !== 'mouse') leave();
    },
    leave,
    dispose() {
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
      if (!gl.isContextLost()) {
        gl.deleteVertexArray(vao);
        gl.deleteProgram(shader.program);
      }
    },
  };
}
