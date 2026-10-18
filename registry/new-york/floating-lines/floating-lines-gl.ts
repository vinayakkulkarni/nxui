import {
  INTRO_SECONDS,
  MAX_CLICKS,
  MAX_LINES,
  MAX_STOPS,
  WAVE_DEFAULTS,
  WAVE_SHAPE,
  WAVES,
} from './floating-lines-constants';
import {
  FLOATING_LINES_FRAGMENT,
  FLOATING_LINES_VERTEX,
} from './floating-lines-shaders';
import type {
  FloatingLinesEngine,
  FloatingLinesProps,
  FloatingLinesSettings,
  FloatingLinesWave,
} from './types';

type Vec3 = [number, number, number];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function warp(x: number, y: number, rotate: number, flip: number) {
  const angle = rotate * Math.log(Math.hypot(x, y) + 1);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rx = x * cos + y * sin;
  return [flip > 0.5 ? -rx : rx, y * cos - x * sin];
}

function perWave(
  value: number | number[] | undefined,
  waves: FloatingLinesWave[],
  wave: FloatingLinesWave,
  fallback: number,
) {
  if (typeof value === 'number') return value;
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const index = waves.indexOf(wave);
  return value[index] ?? value[value.length - 1] ?? fallback;
}

function isWave(value: string): value is FloatingLinesWave {
  return value === 'top' || value === 'middle' || value === 'bottom';
}

export function normalizeFloatingLines(
  props: FloatingLinesProps,
  reduce: boolean,
): FloatingLinesSettings {
  const waves = Array.isArray(props.enabledWaves)
    ? props.enabledWaves.filter(isWave)
    : [...WAVES];
  const gradient = props.linesGradient;
  const lineStyle = props.lineStyle ?? 'solid';
  return {
    stops:
      Array.isArray(gradient) && gradient.length
        ? gradient.slice(0, MAX_STOPS)
        : ['#ffffff'],
    waves: WAVES.map((wave) => {
      const on = waves.includes(wave);
      const custom =
        wave === 'top'
          ? props.topWavePosition
          : wave === 'middle'
            ? props.middleWavePosition
            : props.bottomWavePosition;
      return {
        count: on
          ? clamp(
              Math.round(perWave(props.lineCount ?? 10, waves, wave, 10)),
              0,
              MAX_LINES,
            )
          : 0,
        distance: perWave(props.lineDistance ?? 6, waves, wave, 6) * 0.01,
        position: { ...WAVE_DEFAULTS[wave], ...custom },
      };
    }),
    animationSpeed: Math.max(0, props.animationSpeed ?? 1),
    amplitude: Math.max(0, props.amplitude ?? 1),
    lineWidth: Math.max(0.1, props.lineWidth ?? 1),
    style: lineStyle === 'dashed' ? 2 : lineStyle === 'dotted' ? 1 : 0,
    glow: Math.max(0, props.glow ?? 1),
    brightness: Math.max(0, props.brightness ?? 1),
    depthOfField: clamp(props.depthOfField ?? 0.5, 0, 1),
    edgeFade: clamp(props.edgeFade ?? 0, 0, 1),
    interactive: props.interactive ?? true,
    bendRadius: Math.max(0.1, props.bendRadius ?? 5),
    bendStrength: props.bendStrength ?? -0.5,
    mouseDamping: clamp(props.mouseDamping ?? 0.05, 0, 1),
    parallax: props.parallax ?? true,
    parallaxStrength: Math.max(0, props.parallaxStrength ?? 0.2),
    clickSwirl: props.clickSwirl ?? true,
    intro: props.intro ?? true,
    backgroundColor: props.backgroundColor || undefined,
    lightMode: props.lightMode ?? false,
    opacity: clamp(props.opacity ?? 1, 0, 1),
    dpr: props.dpr,
    reduce,
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
  const vertex = compile(gl, gl.VERTEX_SHADER, FLOATING_LINES_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FLOATING_LINES_FRAGMENT);
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
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      uniforms.set(
        info.name.replace('[0]', ''),
        gl.getUniformLocation(program, info.name),
      );
    }
  }
  return { program, uniforms };
}

interface Click {
  x: number;
  y: number;
  age: number;
  spin: number;
}

export function createFloatingLines(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => FloatingLinesSettings,
): FloatingLinesEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const linked = link(gl);
  if (!linked) return null;
  const program = linked.program;
  const u = (name: string) => linked.uniforms.get(name) ?? null;

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

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const cache = new Map<string, Vec3>();
  const parse = (value: string | undefined, fallback: Vec3): Vec3 => {
    if (!value) return fallback;
    const key = String(value);
    const cached = cache.get(key);
    if (cached) return cached;
    let rgb = fallback;
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = key;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255];
    }
    cache.set(key, rgb);
    return rgb;
  };

  const initial = getSettings();
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, vx: 0, inside: false };
  const mouse = { x: 0, y: 0, influence: 0, px: 0, py: 0 };
  const clicks: Click[] = [];
  const waveData = new Float32Array(12);
  const shapeData = new Float32Array(12);
  const parallaxData = new Float32Array(12);
  const countData = new Int32Array(3);
  const lineData = new Float32Array(MAX_LINES * 3 * 4);
  const colorData = new Float32Array(MAX_LINES * 3 * 3);
  const mouseData = new Float32Array(6);
  const clickData = new Float32Array(MAX_CLICKS * 4);
  let time = 0;
  let reveal = initial.intro && !initial.reduce ? 0 : 1;
  let raf = 0;
  let last = 0;
  let visible = true;
  let disposed = false;
  let lastDpr = initial.dpr;

  const render = () => {
    const s = getSettings();
    const width = canvas.width;
    const height = canvas.height;
    const eased = reveal * reveal * (3 - 2 * reveal);
    const ratio = width / Math.max(1, container.clientWidth);
    const stops = s.stops.map((value) =>
      parse(value, [1, 1, 1]).map((channel) => Math.pow(channel, 2.2)),
    );
    const mouseX = (2 * mouse.x - width) / height;
    const mouseY = -(2 * mouse.y - height) / height;
    s.waves.forEach((wave, index) => {
      const shape = WAVE_SHAPE[WAVES[index] ?? 'middle'];
      const { x: shift, y: lift, rotate } = wave.position;
      const px = mouse.px * shape.drift;
      const py = -mouse.py * shape.drift;
      waveData.set([shift, lift, rotate, 0], index * 4);
      shapeData.set(
        [shape.offset, shape.step, shape.light, shape.flip],
        index * 4,
      );
      parallaxData.set([px, py, shape.depth, 0], index * 4);
      mouseData.set(
        warp(mouseX + px, mouseY + py, rotate, shape.flip),
        index * 2,
      );
      countData[index] = wave.count;
      for (let line = 0; line < wave.count; line++) {
        const offset = shape.offset + shape.step * line;
        const along = wave.distance * line + shift;
        const phase = along + offset + time * 0.1;
        const amp = Math.sin(offset + time * 0.2) * 0.3 * s.amplitude * eased;
        const slot = index * MAX_LINES + line;
        lineData.set([Math.cos(phase), Math.sin(phase), amp, along], slot * 4);
        const t = wave.count > 1 ? line / (wave.count - 1) : 0;
        const scaled = t * Math.max(stops.length - 1, 0);
        const from = Math.min(
          Math.floor(scaled),
          Math.max(stops.length - 2, 0),
        );
        const to = Math.min(from + 1, stops.length - 1);
        const f = clamp(scaled - from, 0, 1);
        const e = f * f * (3 - 2 * f);
        const a = stops[from] ?? [1, 1, 1];
        const b = stops[to] ?? a;
        for (let c = 0; c < 3; c++) {
          const start = a[c] ?? 1;
          colorData[slot * 3 + c] = start + ((b[c] ?? start) - start) * e;
        }
      }
    });
    clickData.fill(0);
    clicks.forEach((click, index) =>
      clickData.set([click.x, click.y, click.age, click.spin], index * 4),
    );

    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(u('uResolution'), width, height);
    gl.uniform1f(u('uRatio'), ratio);
    gl.uniform4fv(u('uWave'), waveData);
    gl.uniform4fv(u('uShape'), shapeData);
    gl.uniform4fv(u('uParallax'), parallaxData);
    gl.uniform1iv(u('uCount'), countData);
    gl.uniform4fv(u('uLine'), lineData);
    gl.uniform3fv(u('uLineColor'), colorData);
    gl.uniform2fv(u('uMouseWarp'), mouseData);
    gl.uniform1f(u('uHaloReach'), 11 * ratio * Math.log(160 * s.glow + 1));
    gl.uniform1f(u('uWidth'), s.lineWidth * 0.5 * ratio);
    gl.uniform1f(u('uGlow'), s.glow);
    gl.uniform1f(u('uBrightness'), s.brightness * eased);
    gl.uniform1f(u('uFocus'), s.depthOfField);
    gl.uniform1f(u('uEdgeFade'), s.edgeFade);
    gl.uniform4f(u('uMouse'), mouse.x, mouse.y, mouse.influence, 0);
    gl.uniform1f(u('uBendRadius'), s.bendRadius * 0.09);
    gl.uniform1f(u('uBendStrength'), s.bendStrength * 2.5);
    gl.uniform4fv(u('uClicks'), clickData);
    gl.uniform1f(u('uLight'), s.lightMode ? 1 : 0);
    gl.uniform1f(u('uOpaque'), s.backgroundColor ? 1 : 0);
    gl.uniform3fv(
      u('uBackground'),
      parse(s.backgroundColor, s.lightMode ? [1, 1, 1] : [0, 0, 0]),
    );
    gl.uniform1f(u('uOpacity'), s.opacity * eased);
    gl.uniform1f(u('uStyle'), s.style);
    gl.uniform1f(u('uSpacing'), (s.style === 2 ? 22 : 9) * ratio);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    const motion = s.reduce ? 0 : 1;
    time += dt * s.animationSpeed * motion;
    if (s.intro && !s.reduce && reveal < 1) {
      reveal = Math.min(1, reveal + dt / INTRO_SECONDS);
    } else if (!s.intro || s.reduce) reveal = 1;

    const follow = 1 - Math.pow(1 - s.mouseDamping, dt * 60);
    const engaged = s.interactive && pointer.inside && !s.reduce;
    if (engaged) {
      mouse.x += (pointer.x - mouse.x) * follow;
      mouse.y += (pointer.y - mouse.y) * follow;
    }
    mouse.influence += ((engaged ? 1 : 0) - mouse.influence) * follow;
    const tx = s.parallax && engaged ? pointer.nx * s.parallaxStrength : 0;
    const ty = s.parallax && engaged ? pointer.ny * s.parallaxStrength : 0;
    mouse.px += (tx - mouse.px) * follow;
    mouse.py += (ty - mouse.py) * follow;
    for (let i = clicks.length - 1; i >= 0; i--) {
      const click = clicks[i]!;
      click.age += dt;
      if (click.age > 4) clicks.splice(i, 1);
    }

    render();
    raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (!raf && !disposed && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  };

  const resize = () => {
    if (disposed) return;
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    render();
    wake();
  };

  const locate = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const ratio = canvas.width / Math.max(1, rect.width);
    pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    const nextX = x * ratio;
    if (Math.abs(nextX - pointer.x) > 0.5) pointer.vx = nextX - pointer.x;
    pointer.x = nextX;
    pointer.y = (rect.height - y) * ratio;
    pointer.nx = x / Math.max(1, rect.width) - 0.5;
    pointer.ny = 0.5 - y / Math.max(1, rect.height);
  };

  resize();

  return {
    resize,
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
    setVisible(nextVisible: boolean) {
      visible = nextVisible;
      if (visible) {
        last = 0;
        wake();
      }
    },
    visibilityChange() {
      last = 0;
      wake();
    },
    pointerMove(event: PointerEvent) {
      const wasInside = pointer.inside;
      locate(event);
      if (pointer.inside && !wasInside && mouse.influence < 0.05) {
        mouse.x = pointer.x;
        mouse.y = pointer.y;
      }
      wake();
    },
    pointerDown(event: PointerEvent) {
      locate(event);
      const s = getSettings();
      if (!pointer.inside || !s.clickSwirl || s.reduce) return;
      const x = (2 * pointer.x - canvas.width) / canvas.height;
      const y = -(2 * pointer.y - canvas.height) / canvas.height;
      clicks.unshift({ x, y, age: 0, spin: pointer.vx < 0 ? -1 : 1 });
      if (clicks.length > MAX_CLICKS) clicks.pop();
      wake();
    },
    pointerUp(event: PointerEvent) {
      if (event.pointerType !== 'mouse') pointer.inside = false;
    },
    pointerLeave() {
      pointer.inside = false;
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
