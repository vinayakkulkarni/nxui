import {
  LINE_WAVES_FRAGMENT,
  LINE_WAVES_MAX_RIPPLES,
  LINE_WAVES_VERTEX,
} from './line-waves-shaders';
import type {
  LineWavesEngine,
  LineWavesProps,
  LineWavesSettings,
} from './types';

const PIXEL_BUDGET = 2.4e6;

interface LinkedProgram {
  program: WebGLProgram;
  uniform: (name: string) => WebGLUniformLocation | null;
}

interface Ripple {
  x: number;
  y: number;
  age: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function parseColor(value: string): number[] {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text)?.[1];
  if (hex) {
    const full =
      hex.length === 3 ? hex.replace(/./g, (digit) => digit + digit) : hex;
    return [0, 2, 4].map(
      (index) => Number.parseInt(full.slice(index, index + 2), 16) / 255,
    );
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) {
    return [rgb[1], rgb[2], rgb[3]].map((channel) =>
      clamp(Number.parseFloat(channel ?? '0') / 255, 0, 1),
    );
  }
  return [1, 1, 1];
}

export function toLineWavesSettings(props: LineWavesProps): LineWavesSettings {
  return {
    color1: parseColor(props.color1 ?? '#ffffff'),
    color2: parseColor(props.color2 ?? '#ffffff'),
    color3: parseColor(props.color3 ?? '#ffffff'),
    cycleSpeed: props.colorCycleSpeed ?? 1,
    speed: Math.max(0, props.speed ?? 0.3),
    lines: clamp(props.lineCount ?? 72, 2, 400),
    width: clamp(props.lineWidth ?? 1.3, 0.25, 12),
    glow: Math.max(0, props.glow ?? 0.6),
    brightness: Math.max(0, props.brightness ?? 1),
    highlight: clamp(props.highlight ?? 1, 0, 1),
    highlightWidth: clamp(props.highlightWidth ?? 1, 0.2, 5),
    warp: clamp(props.warpIntensity ?? 1, 0, 3),
    scale: clamp(props.warpScale ?? 1, 0.2, 4),
    rotation: ((props.rotation ?? -33) * Math.PI) / 180,
    edge: clamp(props.edgeFade ?? 0, 0, 1),
    mouse: props.enableMouseInteraction ?? true,
    influence: clamp(props.mouseInfluence ?? 2, 0, 3),
    clickRipple: props.clickRipple ?? true,
    intro: props.intro ?? true,
    light: props.lightMode ?? false,
    opacity: clamp(props.opacity ?? 1, 0, 1),
    maxRatio: clamp(props.maxDevicePixelRatio ?? 2, 0.5, 3),
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

function link(gl: WebGL2RenderingContext): LinkedProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, LINE_WAVES_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, LINE_WAVES_FRAGMENT);
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
  const locations = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      locations.set(
        info.name.replace(/\[0\]$/, ''),
        gl.getUniformLocation(program, info.name),
      );
    }
  }
  return { program, uniform: (name) => locations.get(name) ?? null };
}

/**
 * Raw WebGL2 renderer for the line field. `playIntro` is false after a
 * context restore so the lines do not draw in a second time.
 */
export function createLineWavesEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => LineWavesSettings,
  isReduced: () => boolean,
  playIntro: boolean,
): LineWavesEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  const shader = gl ? link(gl) : null;
  const vao = gl?.createVertexArray() ?? null;
  if (!gl || !shader || !vao) return null;

  const size = { width: 1, height: 1, ratio: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const lens = { x: 0, y: 0, presence: 0, ready: false };
  const ripples: Ripple[] = [];
  const rippleData = new Float32Array(LINE_WAVES_MAX_RIPPLES * 4);
  let time = Math.random() * 60;
  let cycle = 0;
  let reveal = getSettings().intro && !isReduced() && playIntro ? 0 : 1;
  let last = 0;

  const toField = (x: number, y: number): [number, number] => [
    (x - size.width / 2) / size.height,
    (size.height / 2 - y) / size.height,
  ];

  const frame = (now: number) => {
    if (gl.isContextLost()) return false;
    const s = getSettings();
    const reduced = isReduced();
    const dt = last ? clamp((now - last) / 1000, 0, 0.05) : 0;
    last = now;
    time += dt * s.speed * 2.5 * (reduced ? 0.25 : 1);
    cycle += dt * s.speed * s.cycleSpeed * 0.05;
    if (reveal < 1) reveal = Math.min(1, reveal + dt / 1.8);

    const tracking = s.mouse && pointer.inside && !reduced;
    if (tracking) {
      const [x, y] = toField(pointer.x, pointer.y);
      if (!lens.ready) {
        lens.x = x;
        lens.y = y;
        lens.ready = true;
      }
      const follow = 1 - Math.exp(-dt * 10);
      lens.x += (x - lens.x) * follow;
      lens.y += (y - lens.y) * follow;
    }
    const presence = tracking ? 1 : 0;
    lens.presence += (presence - lens.presence) * (1 - Math.exp(-dt * 5));
    if (lens.presence < 0.002 && !tracking) lens.ready = false;

    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      if (!ripple) continue;
      ripple.age += dt;
      if (ripple.age > 2.6) ripples.splice(i, 1);
    }
    rippleData.fill(0);
    ripples.forEach((ripple, index) => {
      rippleData.set([ripple.x, ripple.y, ripple.age, 1], index * 4);
    });

    const eased = 1 - Math.pow(1 - reveal, 3);
    const u = shader.uniform;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(shader.program);
    gl.bindVertexArray(vao);
    gl.uniform2f(u('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(u('uPixel'), size.ratio);
    gl.uniform1f(u('uTime'), time);
    gl.uniform1f(u('uLines'), s.lines);
    gl.uniform1f(u('uWidth'), s.width);
    gl.uniform1f(u('uGlow'), s.glow);
    gl.uniform1f(u('uBrightness'), s.brightness);
    gl.uniform1f(u('uHighlight'), s.highlight);
    gl.uniform1f(u('uHighlightWidth'), s.highlightWidth);
    gl.uniform1f(u('uWarp'), s.warp * (0.25 + 0.75 * eased));
    gl.uniform1f(u('uScale'), s.scale);
    gl.uniform1f(u('uRotation'), s.rotation);
    gl.uniform3fv(u('uColor1'), s.color1);
    gl.uniform3fv(u('uColor2'), s.color2);
    gl.uniform3fv(u('uColor3'), s.color3);
    gl.uniform1f(u('uCycle'), cycle);
    gl.uniform1f(u('uEdge'), s.edge);
    gl.uniform4f(
      u('uMouse'),
      lens.x,
      lens.y,
      lens.presence * s.influence * 0.16,
      0.2,
    );
    gl.uniform4fv(u('uRipples'), rippleData);
    gl.uniform1f(u('uReveal'), eased);
    gl.uniform1f(u('uLight'), s.light ? 1 : 0);
    gl.uniform1f(u('uOpacity'), s.opacity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const settling = Math.abs(presence - lens.presence) > 0.002;
    const busy =
      (s.speed > 0 && !reduced) ||
      reveal < 1 ||
      settling ||
      ripples.length > 0 ||
      tracking;
    if (!busy) last = 0;
    return busy;
  };

  return {
    frame,
    resize(cssWidth, cssHeight) {
      const width = Math.max(1, cssWidth);
      const height = Math.max(1, cssHeight);
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        getSettings().maxRatio,
        Math.sqrt(PIXEL_BUDGET / (width * height)),
      );
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      size.width = width;
      size.height = height;
      size.ratio = pixelWidth / width;
    },
    pointerMove(x, y, inside) {
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
    },
    pointerDown(x, y, inside) {
      if (!inside || !getSettings().clickRipple || isReduced()) return;
      const [fx, fy] = toField(x, y);
      ripples.push({ x: fx, y: fy, age: 0 });
      if (ripples.length > LINE_WAVES_MAX_RIPPLES) ripples.shift();
    },
    pointerLeave() {
      pointer.inside = false;
    },
    resetClock() {
      last = 0;
    },
    dispose() {
      if (gl.isContextLost()) return;
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
    },
  };
}
