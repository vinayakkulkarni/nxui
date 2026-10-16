import {
  LIQUID_CHROME_FRAGMENT,
  LIQUID_CHROME_SIM,
  LIQUID_CHROME_SLOPE,
  LIQUID_CHROME_VERTEX,
} from './liquid-chrome-shaders';
import type {
  LiquidChromeEngine,
  LiquidChromeSettings,
  LiquidChromeSpot,
  LiquidChromeStroke,
} from './types';

const PIXEL_BUDGET = 2.4e6;
const SIM_CELL = 4;
const SIM_STEP = 1 / 120;

type Uniforms = Record<string, WebGLUniformLocation | null>;

interface Linked {
  program: WebGLProgram;
  uniforms: Uniforms;
}

interface Target {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function parseChromeColor(value: string): [number, number, number] {
  const text = value.trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex?.[1]) {
    const full =
      hex[1].length === 3
        ? hex[1].replace(/./g, (digit) => digit + digit)
        : hex[1];
    return [
      Number.parseInt(full.slice(0, 2), 16) / 255,
      Number.parseInt(full.slice(2, 4), 16) / 255,
      Number.parseInt(full.slice(4, 6), 16) / 255,
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) {
    return [
      clamp(Number.parseFloat(rgb[1] ?? '255') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[2] ?? '255') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[3] ?? '255') / 255, 0, 1),
    ];
  }
  return [1, 1, 1];
}

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

function link(gl: WebGL2RenderingContext, source: string): Linked | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, LIQUID_CHROME_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
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
  const uniforms: Uniforms = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

/**
 * Port of the React Bits LiquidChrome renderer: an analytic chrome surface lit
 * by a virtual studio, plus a half-float wave simulation for the cursor wake
 * and click ripples.
 */
export function createLiquidChromeEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => LiquidChromeSettings,
  options: { reduced: boolean; rise: boolean; ratio: () => number },
): LiquidChromeEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  const chrome = gl ? link(gl, LIQUID_CHROME_FRAGMENT) : null;
  if (!gl || !chrome) return null;
  const fluid = Boolean(gl.getExtension('EXT_color_buffer_float'));
  const sim = fluid ? link(gl, LIQUID_CHROME_SIM) : null;
  const slope = fluid ? link(gl, LIQUID_CHROME_SLOPE) : null;

  const { reduced } = options;
  const vao = gl.createVertexArray();
  const grid = { width: 1, height: 1 };
  const targets: Target[] = [];
  let slopeTarget: Target | null = null;
  let current = 0;
  let unit = 1;
  const pointer = { x: 0, y: 0, inside: false, ready: false, nx: 0, ny: 0 };
  const view = { yaw: 0, pitch: 0, vyaw: 0, vpitch: 0 };
  const strokes: LiquidChromeStroke[] = [];
  let time = Math.random() * 40;
  let presence = options.rise && !reduced ? 0 : 1;
  let energy = 0;
  let accumulator = 0;
  let last = 0;

  const makeTarget = (width: number, height: number): Target => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RG16F,
      width,
      height,
      0,
      gl.RG,
      gl.HALF_FLOAT,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer };
  };

  const dropTarget = (target: Target | null) => {
    if (!target) return;
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.framebuffer);
  };

  const resize = (cssW: number, cssH: number) => {
    const s = getSettings();
    const cssWidth = Math.max(1, cssW);
    const cssHeight = Math.max(1, cssH);
    const ratio = Math.min(
      options.ratio(),
      s.maxRatio,
      Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight)),
    );
    const width = Math.max(1, Math.round(cssWidth * ratio));
    const height = Math.max(1, Math.round(cssHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    unit = Math.min(width, height);
    if (!fluid || !sim || !slope) return;
    const gridWidth = clamp(Math.round(cssWidth / SIM_CELL), 16, 512);
    const gridHeight = clamp(Math.round(cssHeight / SIM_CELL), 16, 512);
    if (
      gridWidth === grid.width &&
      gridHeight === grid.height &&
      targets.length
    ) {
      return;
    }
    targets.forEach(dropTarget);
    targets.length = 0;
    dropTarget(slopeTarget);
    grid.width = gridWidth;
    grid.height = gridHeight;
    targets.push(
      makeTarget(gridWidth, gridHeight),
      makeTarget(gridWidth, gridHeight),
    );
    slopeTarget = makeTarget(gridWidth, gridHeight);
  };

  const simulate = (steps: number) => {
    if (!sim || !slope || !slopeTarget) return;
    gl.useProgram(sim.program);
    gl.viewport(0, 0, grid.width, grid.height);
    gl.uniform2f(sim.uniforms.uSize ?? null, grid.width, grid.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(sim.uniforms.uState ?? null, 0);
    for (let step = 0; step < steps; step++) {
      const stroke = step === 0 ? strokes.shift() : undefined;
      if (stroke) {
        gl.uniform4f(
          sim.uniforms.uStroke ?? null,
          stroke.ax,
          stroke.ay,
          stroke.bx,
          stroke.by,
        );
        gl.uniform2f(
          sim.uniforms.uImpulse ?? null,
          stroke.strength,
          stroke.radius,
        );
      } else {
        gl.uniform2f(sim.uniforms.uImpulse ?? null, 0, 1);
      }
      const source = targets[current]!;
      const destination = targets[1 - current]!;
      gl.bindTexture(gl.TEXTURE_2D, source.texture);
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      current = 1 - current;
    }
    gl.useProgram(slope.program);
    gl.uniform2f(slope.uniforms.uSize ?? null, grid.width, grid.height);
    gl.uniform1i(slope.uniforms.uState ?? null, 0);
    gl.bindTexture(gl.TEXTURE_2D, targets[current]!.texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, slopeTarget.framebuffer);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const render = (s: LiquidChromeSettings) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const u = chrome.uniforms;
    const at = (name: string) => u[name] ?? null;
    gl.useProgram(chrome.program);
    gl.uniform2f(at('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(at('uUnit'), unit);
    gl.uniform1f(at('uTime'), time);
    gl.uniform1f(at('uAmplitude'), s.amplitude);
    gl.uniform2f(at('uFrequency'), s.frequency[0], s.frequency[1]);
    gl.uniform1f(at('uDepth'), s.depth);
    gl.uniform1f(at('uDetail'), s.detail);
    gl.uniform1f(at('uSharpness'), 5 / (3 * s.thickness));
    gl.uniform1f(at('uPresence'), 1 - Math.pow(1 - presence, 3));
    gl.uniform3fv(at('uTint'), s.tint);
    gl.uniform2f(at('uShift'), view.yaw, view.pitch);
    gl.uniform1f(at('uRoughness'), s.roughness);
    gl.uniform1f(at('uExposure'), s.exposure);
    gl.uniform1f(at('uLight'), s.light ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, slopeTarget ? slopeTarget.texture : null);
    gl.uniform1i(at('uSlope'), 0);
    gl.uniform2f(at('uSlopeSize'), grid.width, grid.height);
    gl.uniform1f(at('uRipple'), slopeTarget ? s.rippleStrength * 2.2 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    const s = getSettings();
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    time += dt * s.speed * (reduced ? 0.25 : 1);
    presence = Math.min(1, presence + dt / 1.8);

    const hovering = s.interactive && pointer.inside;
    const reach = reduced ? 0 : s.tilt;
    const targetYaw =
      (hovering ? pointer.nx * 0.35 : 0.22 * Math.sin(time * 1.3)) * reach;
    const targetPitch =
      (hovering ? -pointer.ny * 0.28 : 0.16 * Math.sin(time * 0.9 + 1.7)) *
      reach;
    const stiffness = 36;
    const damping = 2 * Math.sqrt(stiffness) * 0.95;
    view.vyaw +=
      ((targetYaw - view.yaw) * stiffness - view.vyaw * damping) * dt;
    view.vpitch +=
      ((targetPitch - view.pitch) * stiffness - view.vpitch * damping) * dt;
    view.yaw += view.vyaw * dt;
    view.pitch += view.vpitch * dt;

    gl.bindVertexArray(vao);
    if (slopeTarget) {
      accumulator += dt;
      const steps = Math.min(4, Math.floor(accumulator / SIM_STEP));
      accumulator -= steps * SIM_STEP;
      if (steps > 0) {
        simulate(steps);
        energy = Math.max(0, energy * Math.pow(0.982, steps));
      }
    }
    render(s);

    const settling =
      Math.abs(view.vyaw) + Math.abs(view.vpitch) > 1e-4 ||
      Math.abs(targetYaw - view.yaw) + Math.abs(targetPitch - view.pitch) >
        1e-4;
    return (
      s.speed > 0 ||
      presence < 1 ||
      settling ||
      energy > 0.002 ||
      strokes.length > 0
    );
  };

  const toGrid = (spot: LiquidChromeSpot) => ({
    x: spot.u * grid.width,
    y: (1 - spot.v) * grid.height,
    nx: spot.u * 2 - 1,
    ny: spot.v * 2 - 1,
    inside: spot.inside,
  });

  const push = (stroke: LiquidChromeStroke, s: LiquidChromeSettings) => {
    if (!slopeTarget || !s.interactive || reduced) return;
    strokes.push(stroke);
    if (strokes.length > 6) strokes.shift();
    energy = 1;
  };

  return {
    frame,
    resize,
    move(input) {
      const s = getSettings();
      const spot = toGrid(input);
      pointer.nx = clamp(spot.nx, -1, 1);
      pointer.ny = clamp(spot.ny, -1, 1);
      pointer.inside = spot.inside;
      if (spot.inside && pointer.ready) {
        const travel = Math.hypot(spot.x - pointer.x, spot.y - pointer.y);
        if (travel > 0.25) {
          push(
            {
              ax: pointer.x,
              ay: pointer.y,
              bx: spot.x,
              by: spot.y,
              strength: -Math.min(0.45, 0.04 + travel * 0.045) * s.rippleSize,
              radius: 4 * s.rippleSize,
            },
            s,
          );
        }
      }
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.ready = spot.inside;
    },
    press(input) {
      const s = getSettings();
      const spot = toGrid(input);
      if (!spot.inside) return;
      push(
        {
          ax: spot.x,
          ay: spot.y,
          bx: spot.x,
          by: spot.y,
          strength: -1.6 * s.rippleSize,
          radius: 6 * s.rippleSize,
        },
        s,
      );
    },
    leave() {
      pointer.inside = false;
      pointer.ready = false;
    },
    resetClock() {
      last = performance.now();
    },
    destroy() {
      if (gl.isContextLost()) return;
      targets.forEach(dropTarget);
      dropTarget(slopeTarget);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(chrome.program);
      if (sim) gl.deleteProgram(sim.program);
      if (slope) gl.deleteProgram(slope.program);
    },
  };
}
