import {
  LIGHT_PILLAR_COMPOSITE,
  LIGHT_PILLAR_MARCH,
  LIGHT_PILLAR_VERTEX,
} from './light-pillar-shaders';
import type {
  LightPillarEngine,
  LightPillarEngineOptions,
  LightPillarPulse,
  LightPillarQuality,
  LightPillarRgb,
} from './types';

export const LIGHT_PILLAR_QUALITY: Record<LightPillarQuality, number> = {
  low: 0.35,
  medium: 0.5,
  high: 0.6,
};

const INTRO_SECONDS = 2.1;
const PULSE_LIFE = 1.4;
export const LIGHT_PILLAR_MIN_SCALE = 0.25;
const WHITE: LightPillarRgb = [1, 1, 1];

const MARCH_UNIFORMS = [
  'uTime',
  'uResolution',
  'uTarget',
  'uRot',
  'uPillarRot',
  'uWave',
  'uShift',
  'uPillarWidth',
  'uPillarHeight',
  'uDetail',
  'uTopColor',
  'uBottomColor',
  'uGlowAmount',
  'uWidthNorm',
];

const COMPOSITE_UNIFORMS = [
  'uField',
  'uFieldSize',
  'uView',
  'uAspect',
  'uPillarRot',
  'uShift',
  'uIntensity',
  'uNoiseIntensity',
  'uLightMode',
  'uNeutral',
  'uBloom',
  'uFade',
  'uReveal',
  'uFlare',
  'uPulses',
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function ease(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function chroma(rgb: LightPillarRgb): number {
  return Math.max(...rgb) - Math.min(...rgb);
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

function link(gl: WebGL2RenderingContext, source: string, names: string[]) {
  const vertex = compile(gl, gl.VERTEX_SHADER, LIGHT_PILLAR_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
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
  for (const name of names) {
    uniforms.set(name, gl.getUniformLocation(program, name));
  }
  const at = (name: string) => uniforms.get(name) ?? null;
  return { program, at };
}

export function createLightPillarEngine(
  options: LightPillarEngineOptions,
): LightPillarEngine | null {
  const { container, canvas, getSettings, reduce, onRestored } = options;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const floatTargets = Boolean(gl.getExtension('EXT_color_buffer_float'));
  const march = link(gl, LIGHT_PILLAR_MARCH, MARCH_UNIFORMS);
  const composite = link(gl, LIGHT_PILLAR_COMPOSITE, COMPOSITE_UNIFORMS);
  if (!march || !composite) return null;
  const glx = gl;

  const onContextLost = (event: Event) => {
    event.preventDefault();
  };
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

  let texture: WebGLTexture | null = null;
  const framebuffer = gl.createFramebuffer();
  const target = { width: 0, height: 0 };
  const sizeTarget = (width: number, height: number) => {
    if (target.width === width && target.height === height) return;
    target.width = width;
    target.height = height;
    if (texture) glx.deleteTexture(texture);
    texture = glx.createTexture();
    glx.bindTexture(glx.TEXTURE_2D, texture);
    const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;
    glx.texStorage2D(
      glx.TEXTURE_2D,
      levels,
      floatTargets ? glx.RGBA16F : glx.RGBA8,
      width,
      height,
    );
    glx.texParameteri(
      glx.TEXTURE_2D,
      glx.TEXTURE_MIN_FILTER,
      glx.LINEAR_MIPMAP_LINEAR,
    );
    glx.texParameteri(glx.TEXTURE_2D, glx.TEXTURE_MAG_FILTER, glx.LINEAR);
    glx.texParameteri(glx.TEXTURE_2D, glx.TEXTURE_WRAP_S, glx.CLAMP_TO_EDGE);
    glx.texParameteri(glx.TEXTURE_2D, glx.TEXTURE_WRAP_T, glx.CLAMP_TO_EDGE);
    glx.bindFramebuffer(glx.FRAMEBUFFER, framebuffer);
    glx.framebufferTexture2D(
      glx.FRAMEBUFFER,
      glx.COLOR_ATTACHMENT0,
      glx.TEXTURE_2D,
      texture,
      0,
    );
  };

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, LightPillarRgb>();
  const toRgb = (value: string): LightPillarRgb => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb = WHITE;
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [
        (data[0] ?? 255) / 255,
        (data[1] ?? 255) / 255,
        (data[2] ?? 255) / 255,
      ];
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const view = { width: 1, height: 1, ratio: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const pulses: LightPillarPulse[] = [];
  const pulseData = new Float32Array(12);
  const state = {
    clock: 0,
    intro: getSettings().intro && !reduce ? 0 : 1,
    touch: 0,
    spin: 0,
    lean: 0,
    shift: 0,
    governor: 1,
    slow: 0,
    quick: 0,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let disposed = false;

  const axisAt = (x: number, y: number, angle: number) => {
    const aspect = view.width / view.height;
    const px = ((x / view.width) * 2 - 1) * aspect - state.shift;
    const py = 1 - (y / view.height) * 2;
    return Math.sin(angle) * px + Math.cos(angle) * py;
  };

  const render = () => {
    const s = getSettings();
    const scale = Math.max(LIGHT_PILLAR_MIN_SCALE, s.scale * state.governor);
    const fieldWidth = Math.max(1, Math.round(view.width * scale));
    const fieldHeight = Math.max(1, Math.round(view.height * scale));
    sizeTarget(fieldWidth, fieldHeight);

    const grow = ease(state.intro);
    const rise = easeOut(state.intro);
    const tilt = ((s.pillarRotation + state.lean) * Math.PI) / 180;
    const angle = state.clock * 0.3 + state.spin;
    const width = s.pillarWidth * (0.3 + 0.7 * grow);

    glx.bindVertexArray(vao);
    const m = march.at;
    glx.bindFramebuffer(glx.FRAMEBUFFER, framebuffer);
    glx.viewport(0, 0, target.width, target.height);
    glx.useProgram(march.program);
    glx.uniform1f(m('uTime'), state.clock * s.flow);
    glx.uniform2f(m('uResolution'), view.width, view.height);
    glx.uniform2f(m('uTarget'), target.width, target.height);
    glx.uniform2f(m('uRot'), Math.cos(angle), Math.sin(angle));
    glx.uniform2f(m('uPillarRot'), Math.cos(tilt), Math.sin(tilt));
    glx.uniform2f(m('uWave'), Math.sin(s.twist), Math.cos(s.twist));
    glx.uniform1f(m('uShift'), state.shift);
    glx.uniform1f(m('uPillarWidth'), width);
    glx.uniform1f(m('uPillarHeight'), s.pillarHeight);
    glx.uniform1i(m('uDetail'), s.detail);
    glx.uniform3fv(m('uTopColor'), toRgb(s.topColor));
    glx.uniform3fv(m('uBottomColor'), toRgb(s.bottomColor));
    glx.uniform1f(m('uGlowAmount'), s.glowAmount);
    glx.uniform1f(m('uWidthNorm'), width / 3);
    glx.drawArrays(glx.TRIANGLES, 0, 3);
    glx.bindTexture(glx.TEXTURE_2D, texture);
    if (s.bloom > 0) glx.generateMipmap(glx.TEXTURE_2D);

    pulseData.fill(0);
    pulses.forEach((pulse, index) => {
      pulseData.set(
        [
          pulse.axis + pulse.age * 1.7,
          Math.exp(-pulse.age / (PULSE_LIFE * 0.45)),
          0,
          0,
        ],
        index * 4,
      );
    });

    const c = composite.at;
    glx.bindFramebuffer(glx.FRAMEBUFFER, null);
    glx.viewport(0, 0, canvas.width, canvas.height);
    glx.useProgram(composite.program);
    glx.activeTexture(glx.TEXTURE0);
    glx.bindTexture(glx.TEXTURE_2D, texture);
    glx.uniform1i(c('uField'), 0);
    glx.uniform2f(c('uFieldSize'), target.width, target.height);
    glx.uniform2f(c('uView'), canvas.width, canvas.height);
    glx.uniform2f(c('uAspect'), view.width / view.height, 1);
    glx.uniform2f(c('uPillarRot'), Math.cos(tilt), Math.sin(tilt));
    glx.uniform1f(c('uShift'), state.shift);
    glx.uniform1f(
      c('uIntensity'),
      s.intensity * (0.15 + 0.85 * rise) * (1 + 0.12 * state.touch),
    );
    glx.uniform1f(c('uNoiseIntensity'), s.noiseIntensity);
    glx.uniform1f(c('uLightMode'), s.lightMode ? 1 : 0);
    const vivid = Math.max(
      chroma(toRgb(s.topColor)),
      chroma(toRgb(s.bottomColor)),
    );
    glx.uniform1f(c('uNeutral'), 1 - clamp((vivid - 0.08) / 0.12, 0, 1));
    glx.uniform1f(c('uBloom'), s.bloom);
    glx.uniform1f(c('uFade'), s.fade);
    const span = view.width / view.height + 1.2;
    glx.uniform1f(
      c('uReveal'),
      state.intro >= 1 ? 1e4 : -span + rise * (span * 2 + 1.2),
    );
    glx.uniform1f(
      c('uFlare'),
      state.intro >= 1 ? 0 : (1 - rise) * 1.3 * Math.min(1, state.intro * 8),
    );
    glx.uniform4fv(c('uPulses'), pulseData);
    glx.drawArrays(glx.TRIANGLES, 0, 3);
  };

  // Adaptive resolution: drop the render scale when frames run long, recover when fast.
  const tune = (dt: number) => {
    if (dt > 1 / 40) {
      state.slow += 1;
      state.quick = 0;
    } else if (dt < 1 / 55) {
      state.quick += 1;
      state.slow = 0;
    }
    if (state.slow > 20) {
      state.governor = Math.max(0.5, state.governor * 0.85);
      state.slow = 0;
    } else if (state.quick > 180 && state.governor < 1) {
      state.governor = Math.min(1, state.governor * 1.1);
      state.quick = 0;
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    if (last) tune((now - last) / 1000);
    last = now;
    const running = !s.paused && !reduce && s.rotationSpeed !== 0;
    if (running) state.clock += dt * 0.96 * s.rotationSpeed;
    if (!s.intro || reduce) state.intro = 1;
    else if (state.intro < 1) {
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    }

    const engaged = s.interactive && pointer.inside && !reduce;
    const aim = engaged ? pointer.x / view.width - 0.5 : 0;
    const follow = 1 - Math.exp(-dt * 2.4);
    state.spin += (aim * 1.4 - state.spin) * follow;
    state.lean += (aim * 9 - state.lean) * follow;
    state.shift +=
      (aim * 0.35 * (view.width / view.height) - state.shift) * follow;
    state.touch += ((engaged ? 1 : 0) - state.touch) * (1 - Math.exp(-dt * 3));

    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i];
      if (!pulse) continue;
      pulse.age += dt;
      if (pulse.age > PULSE_LIFE * 2.2) pulses.splice(i, 1);
    }

    render();

    const settling =
      state.intro < 1 ||
      pulses.length > 0 ||
      Math.abs(aim * 1.4 - state.spin) > 0.0005 ||
      Math.abs((engaged ? 1 : 0) - state.touch) > 0.002;
    if (running || settling) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!raf && !disposed && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  };

  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    view.width = width;
    view.height = height;
    view.ratio = ratio;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    if (!raf) render();
    wake();
  };

  const locate = (clientX: number, clientY: number) => {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
      x,
      y,
      inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
    };
  };

  resize();

  return {
    refresh() {
      if (disposed) return;
      if (!raf) render();
      wake();
    },
    resize,
    pointerMove(clientX: number, clientY: number) {
      const point = locate(clientX, clientY);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = point.inside;
      wake();
    },
    pointerDown(clientX: number, clientY: number) {
      const s = getSettings();
      if (!s.clickPulse || reduce) return;
      const point = locate(clientX, clientY);
      if (!point.inside) return;
      const tilt = ((s.pillarRotation + state.lean) * Math.PI) / 180;
      pulses.push({ axis: axisAt(point.x, point.y, tilt), age: 0 });
      if (pulses.length > 3) pulses.shift();
      wake();
    },
    pointerLeave() {
      pointer.inside = false;
      wake();
    },
    setVisible(next: boolean) {
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
    dispose(loseContext: boolean) {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (texture) glx.deleteTexture(texture);
      glx.deleteFramebuffer(framebuffer);
      glx.deleteProgram(march.program);
      glx.deleteProgram(composite.program);
      glx.deleteBuffer(buffer);
      glx.deleteVertexArray(vao);
      if (loseContext && !glx.isContextLost()) {
        glx.getExtension('WEBGL_lose_context')?.loseContext();
      }
    },
  };
}
