import {
  SOFT_AURORA_FRAGMENT,
  SOFT_AURORA_MAX_PULSES,
  SOFT_AURORA_VERTEX,
} from './soft-aurora-shaders';
import type {
  SoftAuroraEngine,
  SoftAuroraProps,
  SoftAuroraSettings,
} from './types';

type Rgb = [number, number, number];

interface Pulse {
  x: number;
  y: number;
  age: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoother = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** Parses `#rgb`, `#rrggbb` and `rgb()` colors into 0..1 channels. */
function parseSoftAuroraColor(value: string | undefined): Rgb | null {
  const text = String(value ?? '').trim();
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
      clamp(Number.parseFloat(rgb[1] ?? '0') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[2] ?? '0') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[3] ?? '0') / 255, 0, 1),
    ];
  }
  return null;
}

/** Resolves props into the clamped settings the renderer reads. */
export function toSoftAuroraSettings(
  props: SoftAuroraProps,
): SoftAuroraSettings {
  return {
    speed: Math.max(0, props.speed ?? 0.6),
    scale: Math.max(0.01, props.scale ?? 1.5),
    brightness: Math.max(0, props.brightness ?? 1),
    color1: parseSoftAuroraColor(props.color1) ?? [0.969, 0.969, 0.969],
    color2: parseSoftAuroraColor(props.color2) ?? [0.882, 0, 1],
    noiseFrequency: Math.max(0.01, props.noiseFrequency ?? 2.5),
    noiseAmplitude: Math.max(0, props.noiseAmplitude ?? 1),
    bandHeight: props.bandHeight ?? 0.5,
    bandSpread: Math.max(0, props.bandSpread ?? 1),
    octaveDecay: Math.max(0, props.octaveDecay ?? 0.1),
    layerOffset: props.layerOffset ?? 0,
    colorSpeed: props.colorSpeed ?? 1,
    spectrum: clamp(props.spectrum ?? 1, 0, 1),
    tilt: (clamp(props.tilt ?? 0, -90, 90) * Math.PI) / 180,
    mouse: props.enableMouseInteraction ?? true,
    influence: Math.max(0, props.mouseInfluence ?? 0.25),
    clickPulse: props.clickPulse ?? true,
    intro: props.intro ?? true,
    light: props.lightMode ?? false,
    opacity: clamp(props.opacity ?? 1, 0, 1),
  };
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
  const vertex = compile(gl, gl.VERTEX_SHADER, SOFT_AURORA_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, SOFT_AURORA_FRAGMENT);
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
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) {
      uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(
        program,
        info.name,
      );
    }
  }
  return { program, uniforms };
}

/**
 * One full-screen WebGL2 pass: two layers of 3D Perlin noise shape a band
 * that reaches toward the cursor and carries click pulses along it.
 */
export function createSoftAuroraEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => SoftAuroraSettings,
  isReduced: () => boolean,
  skipIntro: boolean,
): SoftAuroraEngine | null {
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
  const pointer = { x: 0.5, y: 0.5, inside: false };
  const mouse = { x: 0.5, y: 0.5, presence: 0 };
  const pulses: Pulse[] = [];
  const pulseData = new Float32Array(SOFT_AURORA_MAX_PULSES * 4);
  let flow = 0;
  let hue = 0;
  let opening = getSettings().intro && !isReduced() && !skipIntro ? 0 : 1;
  let last = 0;
  const u = (name: string) => shader.uniforms[name] ?? null;

  const resize = (cssWidth: number, cssHeight: number) => {
    const s = getSettings();
    const width = Math.max(1, cssWidth);
    const height = Math.max(1, cssHeight);
    const ratio = clamp(0.35 + 0.04 * s.noiseFrequency * s.scale, 0.5, 1);
    const w = Math.max(1, Math.round(width * ratio));
    const h = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    size.width = width;
    size.height = height;
  };

  const frame = (now: number) => {
    if (gl.isContextLost()) return false;
    const s = getSettings();
    const dt = last ? clamp((now - last) / 1000, 0, 0.05) : 0;
    last = Math.max(last, now);
    const pace = isReduced() ? 0.35 : 1;
    flow += dt * s.speed * pace;
    hue += dt * s.speed * s.colorSpeed * pace;
    if (opening < 1) opening = Math.min(1, opening + dt / 2);

    const tracking = s.mouse && pointer.inside;
    const follow = 1 - Math.exp(-dt / 0.325);
    mouse.x += ((tracking ? pointer.x : 0.5) - mouse.x) * follow;
    mouse.y += ((tracking ? pointer.y : 0.5) - mouse.y) * follow;
    mouse.presence +=
      ((tracking ? 1 : 0) - mouse.presence) *
      (1 - Math.exp(-dt / (tracking ? 0.45 : 0.8)));

    for (let index = pulses.length - 1; index >= 0; index--) {
      const pulse = pulses[index];
      if (!pulse) continue;
      pulse.age += dt;
      if (pulse.age >= 2.6) pulses.splice(index, 1);
    }
    pulseData.fill(0);
    pulses.forEach((pulse, index) => {
      pulseData[index * 4] = pulse.x;
      pulseData[index * 4 + 1] = pulse.y;
      pulseData[index * 4 + 2] =
        smoother(pulse.age / 0.18) * (1 - smoother((pulse.age - 0.18) / 2.42));
      pulseData[index * 4 + 3] = pulse.age;
    });

    const eased = 1 - Math.pow(1 - opening, 3);
    const aspect = size.width / size.height;
    const strength = Math.min(1, s.influence * 4) * mouse.presence;
    const drift = s.mouse ? s.influence : 0;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shader.program);
    gl.bindVertexArray(vao);
    gl.uniform2f(u('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(u('uFlow'), flow);
    gl.uniform1f(u('uHue'), hue);
    gl.uniform1f(u('uScale'), s.scale);
    gl.uniform1f(u('uBrightness'), s.brightness);
    gl.uniform3f(u('uColor1'), s.color1[0], s.color1[1], s.color1[2]);
    gl.uniform3f(u('uColor2'), s.color2[0], s.color2[1], s.color2[2]);
    gl.uniform1f(u('uNoiseFreq'), s.noiseFrequency);
    gl.uniform1f(u('uNoiseAmp'), s.noiseAmplitude);
    gl.uniform1f(u('uBandHeight'), s.bandHeight);
    gl.uniform1f(u('uBandSpread'), s.bandSpread);
    gl.uniform1f(u('uOctaveDecay'), s.octaveDecay);
    gl.uniform1f(u('uLayerOffset'), s.layerOffset);
    gl.uniform2f(u('uShift'), (mouse.x - 0.5) * drift, (mouse.y - 0.5) * drift);
    gl.uniform4f(u('uCursor'), mouse.x * aspect, mouse.y, strength, 0);
    gl.uniform4fv(u('uPulses'), pulseData);
    gl.uniform1f(u('uSpectrum'), s.spectrum);
    gl.uniform1f(u('uTilt'), s.tilt);
    gl.uniform3f(
      u('uIntro'),
      smoother(opening / 0.7),
      1 + 3 * (1 - eased) * (1 - eased),
      0.25 + 0.75 * eased,
    );
    gl.uniform1f(u('uLightMode'), s.light ? 1 : 0);
    gl.uniform1f(u('uOpacity'), s.opacity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const settling =
      Math.abs(mouse.x - (tracking ? pointer.x : 0.5)) > 1e-4 ||
      Math.abs(mouse.y - (tracking ? pointer.y : 0.5)) > 1e-4 ||
      Math.abs((tracking ? 1 : 0) - mouse.presence) > 1e-3 ||
      pulses.length > 0;
    return s.speed > 0 || opening < 1 || settling;
  };

  const pointerMove = (x: number, y: number, inside: boolean) => {
    pointer.x = x / Math.max(1, size.width);
    pointer.y = 1 - y / Math.max(1, size.height);
    pointer.inside = inside;
  };

  const pulse = (x: number, y: number) => {
    if (!getSettings().clickPulse || isReduced()) return false;
    const aspect = size.width / size.height;
    pulses.push({
      x: (x / Math.max(1, size.width)) * aspect,
      y: 1 - y / Math.max(1, size.height),
      age: 0,
    });
    if (pulses.length > SOFT_AURORA_MAX_PULSES) pulses.shift();
    return true;
  };

  const dispose = () => {
    if (gl.isContextLost()) return;
    gl.deleteVertexArray(vao);
    gl.deleteProgram(shader.program);
  };

  return {
    frame,
    resize,
    pointerMove,
    pulse,
    pointerLeave: () => {
      pointer.inside = false;
    },
    resetClock: () => {
      last = 0;
    },
    dispose,
  };
}
