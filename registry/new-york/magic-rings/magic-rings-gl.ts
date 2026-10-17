import {
  MAX_BURSTS,
  SEGMENTS,
  SLOTS,
  fragmentFor,
  shaderSource,
  vertexFor,
} from './magic-rings-shaders';
import type {
  MagicRingsBurst,
  MagicRingsEngine,
  MagicRingsMat3,
  MagicRingsMotion,
  MagicRingsPointer,
  MagicRingsProgram,
  MagicRingsRgb,
  MagicRingsRingState,
  MagicRingsSettings,
  MagicRingsShaderName,
  MagicRingsUniforms,
  MagicRingsVec3,
} from './types';

const MOTIONS: MagicRingsMotion[] = ['pulse', 'ripple', 'breathe'];
const CYCLE = 3.45;
const STAGGER = 0.5;
const DEPTH = 2.6;
const BURST_LIFE = 1.1;
const BURST_SPEED = 0.9;
const FALLBACK_COLOR: MagicRingsRgb = [0.66, 0.33, 0.97];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(from: number, to: number, value: number): number {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
}

function pulseLife(t: number): number {
  return Math.min(smoothstep(0, 0.7, t), 1 - smoothstep(0.5, 3.25, t));
}

function toLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function parseColor(value: string): MagicRingsRgb {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex?.[1]) {
    const digits = hex[1];
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
    return [
      clamp(Number.parseFloat(rgb[1] ?? '0') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[2] ?? '0') / 255, 0, 1),
      clamp(Number.parseFloat(rgb[3] ?? '0') / 255, 0, 1),
    ];
  }
  if (typeof document !== 'undefined') {
    const context = document.createElement('canvas').getContext('2d');
    if (context) {
      context.fillStyle = '#000000';
      context.fillStyle = text;
      const normal = String(context.fillStyle);
      if (normal !== '#000000' || /^(?:#0{3}|#0{6}|black)$/i.test(text)) {
        return parseColor(normal);
      }
    }
  }
  return FALLBACK_COLOR;
}

export function linearRgb(rgb: MagicRingsRgb): MagicRingsRgb {
  return [toLinear(rgb[0]), toLinear(rgb[1]), toLinear(rgb[2])];
}

export function normalizeMotion(motion: string): MagicRingsMotion {
  return MOTIONS.find((entry) => entry === motion) ?? 'pulse';
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

function link(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): MagicRingsProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
  const uniforms: MagicRingsUniforms = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (!info) continue;
    const location = gl.getUniformLocation(program, info.name);
    if (location) uniforms[info.name.replace(/\[0\]$/, '')] = location;
  }
  return { program, uniforms };
}

function invert(m: MagicRingsMat3): MagicRingsMat3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    A / det,
    (c * h - b * i) / det,
    (b * f - c * e) / det,
    B / det,
    (a * i - c * g) / det,
    (c * d - a * f) / det,
    C / det,
    (b * g - a * h) / det,
    (a * e - b * d) / det,
  ];
}

function planeFor(
  tiltX: number,
  tiltY: number,
): { forward: MagicRingsMat3; inverse: MagicRingsMat3 } {
  const ax = (tiltX * Math.PI) / 180;
  const ay = (tiltY * Math.PI) / 180;
  const cx = Math.cos(ax);
  const sx = Math.sin(ax);
  const cy = Math.cos(ay);
  const sy = Math.sin(ay);
  const forward: MagicRingsMat3 = [
    cy,
    sy * sx,
    0,
    0,
    cx,
    0,
    (sy * cx) / DEPTH,
    -sx / DEPTH,
    1,
  ];
  return { forward, inverse: invert(forward) };
}

function project(m: MagicRingsMat3, x: number, y: number): MagicRingsVec3 {
  const w = m[6] * x + m[7] * y + m[8];
  return [
    (m[0] * x + m[1] * y + m[2]) / w,
    (m[3] * x + m[4] * y + m[5]) / w,
    w,
  ];
}

/**
 * Creates the WebGL2 ring renderer. Returns null when WebGL2 or the shaders
 * are unavailable. `firstRun` enables the intro (it is skipped after a
 * context restore).
 */
export function createMagicRingsEngine(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => MagicRingsSettings,
  reduced: boolean,
  firstRun: boolean,
  onRestored: () => void,
): MagicRingsEngine | null {
  const context = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'default',
  });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;

  const programs = new Map<string, MagicRingsProgram | null>();
  const programFor = (
    name: MagicRingsShaderName,
    flags: string[],
  ): MagicRingsProgram | null => {
    const key = `${name}|${flags.join(',')}`;
    const cached = programs.get(key);
    if (cached !== undefined) return cached;
    const linked = link(
      gl,
      shaderSource(vertexFor(name), flags),
      shaderSource(fragmentFor(name), flags),
    );
    programs.set(key, linked);
    return linked;
  };
  if (
    !programFor('glow', []) ||
    !programFor('compose', []) ||
    !programFor('line', [])
  ) {
    programs.forEach((entry) => entry && gl.deleteProgram(entry.program));
    return null;
  }

  const u = (uniforms: MagicRingsUniforms, name: string) =>
    uniforms[name] ?? null;

  const vao = gl.createVertexArray();
  const stripVao = gl.createVertexArray();
  const stripBuffer = gl.createBuffer();
  const strip = new Float32Array((SEGMENTS + 1) * 4);
  for (let index = 0; index <= SEGMENTS; index++) {
    strip.set([index / SEGMENTS, -1, index / SEGMENTS, 1], index * 4);
  }
  gl.bindVertexArray(stripVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, stripBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, strip, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  const glowTexture = gl.createTexture();
  const glowBuffer = gl.createFramebuffer();
  const glowSize = { width: 0, height: 0 };
  let floatGlow = Boolean(gl.getExtension('EXT_color_buffer_float'));
  const shape = new Float32Array(SLOTS * 4);
  const frameData = new Float32Array(SLOTS * 4);
  const tints = new Float32Array(SLOTS * 4);
  const size = { width: 1, height: 1, ratio: 1, unit: 1 };
  const pointer = { x: 0, y: 0, inside: false, touch: false };
  const spring = { x: 0, y: 0, vx: 0, vy: 0, hover: 0, hoverVelocity: 0 };
  const bursts: MagicRingsBurst[] = [];
  const initial = getSettings();
  let introLive = initial.intro && initial.speed > 0 && !reduced && firstRun;
  let time = introLive ? 0 : 1.6;
  let clock = 0;
  let raf = 0;
  let last = 0;
  let visible = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let lost = false;

  const allocate = (useFloat: boolean, width: number, height: number) => {
    gl.bindTexture(gl.TEXTURE_2D, glowTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      useFloat ? gl.RGBA16F : gl.RGBA8,
      width,
      height,
      0,
      gl.RGBA,
      useFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, glowBuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      glowTexture,
      0,
    );
    const complete =
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return complete;
  };

  const resize = () => {
    if (lost) return;
    const s = getSettings();
    const rect = container.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, s.maxRatio);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    Object.assign(size, {
      width,
      height,
      ratio,
      unit: Math.max(1, Math.min(width, height)),
    });
    const glowWidth = Math.max(1, Math.ceil(width / 2));
    const glowHeight = Math.max(1, Math.ceil(height / 2));
    if (glowSize.width === glowWidth && glowSize.height === glowHeight) return;
    Object.assign(glowSize, { width: glowWidth, height: glowHeight });
    if (!allocate(floatGlow, glowWidth, glowHeight)) {
      floatGlow = false;
      allocate(false, glowWidth, glowHeight);
    }
  };

  const ringState = (
    s: MagicRingsSettings,
    index: number,
    count: number,
  ): MagicRingsRingState => {
    const mix = count > 1 ? index / (count - 1) : 0;
    if (s.motion === 'ripple') {
      const span = count * s.radiusStep + s.expansion;
      const period = CYCLE * Math.max(1, count) * 0.32;
      const phase = time / period + index / count;
      const progress = phase - Math.floor(phase);
      const born = time - progress * period >= -1e-4 || !introLive;
      const life = born
        ? smoothstep(0, 0.12, progress) * (1 - smoothstep(0.62, 1, progress))
        : 0;
      const position = progress * Math.max(1, count - 1);
      return {
        radius: s.baseRadius + progress * span,
        life,
        virtual: position,
        mix: progress,
        opening: 1,
      };
    }
    if (s.motion === 'breathe') {
      const wave = Math.sin((time / 4) * Math.PI * 2 - index * 0.55);
      const rise = introLive
        ? smoothstep(index * 0.12, index * 0.12 + 0.9, time)
        : 1;
      return {
        radius:
          s.baseRadius + index * s.radiusStep + s.expansion * 0.5 * (1 + wave),
        life: (0.78 + 0.22 * wave) * rise,
        virtual: index,
        mix,
        opening: 1,
      };
    }
    const local = time - index * STAGGER;
    const t = ((local % CYCLE) + CYCLE) % CYCLE;
    const life = introLive && local < 0 ? 0 : pulseLife(t);
    return {
      radius:
        s.baseRadius +
        index * s.radiusStep +
        (1 - Math.pow(1 - t / CYCLE, 2)) * s.expansion,
      life,
      virtual: index,
      mix,
      opening: introLive && local < CYCLE ? smoothstep(0, 0.9, local) : 1,
    };
  };

  const render = () => {
    const s = getSettings();
    const count = s.ringCount;
    const hover = spring.hover;
    const still = reduced ? 0 : 1;
    const scale = 1 + (s.hoverScale - 1) * hover * still;
    const mouseX = spring.x * still;
    const mouseY = spring.y * still;
    const leanX = s.tilt - mouseY * s.parallax * 260;
    const leanY = mouseX * s.parallax * 260;
    const view = planeFor(leanX, leanY);
    const center = s.followMouse
      ? [mouseX * s.mouseInfluence, mouseY * s.mouseInfluence]
      : [0, 0];
    const centerX = center[0] ?? 0;
    const centerY = center[1] ?? 0;
    const spinBase = s.spin * time * 0.6;

    let slots = 0;
    let lowest = Infinity;
    let highest = 0;
    let shiftMax = 0;
    const place = (
      radius: number,
      life: number,
      cut: number,
      angle: number,
      shiftX: number,
      shiftY: number,
      mix: number,
      width: number,
    ) => {
      if (life <= 0.002 || slots >= SLOTS) return;
      const gain = 10 * radius * cut * cut * cut;
      shape.set(
        [radius, life, gain, gain > 6.2 ? Math.cbrt(6.2 / gain) : 2],
        slots * 4,
      );
      frameData.set(
        [shiftX, shiftY, Math.cos(angle), Math.sin(angle)],
        slots * 4,
      );
      tints.set(
        [
          s.color[0] + (s.colorTwo[0] - s.color[0]) * mix,
          s.color[1] + (s.colorTwo[1] - s.color[1]) * mix,
          s.color[2] + (s.colorTwo[2] - s.color[2]) * mix,
          width,
        ],
        slots * 4,
      );
      lowest = Math.min(lowest, radius);
      highest = Math.max(highest, radius);
      shiftMax = Math.max(shiftMax, Math.hypot(shiftX, shiftY));
      slots++;
    };

    for (let index = 0; index < count; index++) {
      const state = ringState(s, index, count);
      let radius = state.radius * scale;
      let life = state.life;
      for (const burst of bursts) {
        const age = clock - burst.start;
        const wave = (burst.radius + age * BURST_SPEED) * scale;
        const fade = Math.pow(Math.max(0, 1 - age / BURST_LIFE), 1.5);
        const gap = (wave - radius) / 0.08;
        radius += 0.04 * Math.exp(-gap * gap) * fade;
        life = Math.min(1.6, life + 0.9 * Math.exp(-gap * gap * 1.6) * fade);
      }
      const cut =
        Math.pow(s.taper, state.virtual) / Math.max(0.08, state.opening);
      const angle =
        s.rotation + spinBase * (index % 2 ? -1 : 1) * (1 + index * 0.15);
      place(
        radius,
        life,
        cut,
        angle,
        index * s.parallax * mouseX,
        index * s.parallax * mouseY,
        state.mix,
        1,
      );
    }
    for (const burst of bursts) {
      const age = clock - burst.start;
      const fade = Math.pow(Math.max(0, 1 - age / BURST_LIFE), 1.5);
      const radius = (burst.radius + age * BURST_SPEED) * scale;
      place(
        radius,
        1.5 * fade,
        0.85,
        s.rotation,
        0,
        0,
        clamp(age / BURST_LIFE, 0, 1),
        1.15,
      );
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!slots) return;

    const flags: string[] = [];
    if (s.light) flags.push('LIGHT');
    if (s.dispersion > 0) flags.push('PRISM');
    if (!floatGlow) flags.push('PACKED');
    const glowProgram = programFor('glow', flags);
    const composeProgram = programFor('compose', flags);
    const lineProgram = programFor('line', flags);
    if (!glowProgram || !composeProgram || !lineProgram) return;

    const glowScale = (s.light ? 0.3 : 1) * (1 - s.dispersion * 0.45);
    const outer = 0.012 + 0.033 * s.glow;
    const innerAmount = 0.5 * Math.min(1, s.glow) * glowScale;
    const outerAmount = 0.9 * s.glow * glowScale;
    const range = outer * 4.5 + 0.008;
    const split = s.dispersion * 0.03;
    const margin = range + split * highest + shiftMax + 0.01;
    const width = s.lineThickness * size.ratio;
    const reach = width * (1 + 0.45 * s.hoverIntensity) * 1.15 + 1.5;
    const cursor = project(view.inverse, pointer.x, pointer.y);

    const shared = (entry: MagicRingsProgram): MagicRingsUniforms => {
      const uniforms = entry.uniforms;
      gl.useProgram(entry.program);
      gl.uniform2f(u(uniforms, 'uResolution'), canvas.width, canvas.height);
      gl.uniform1f(u(uniforms, 'uUnit'), size.unit);
      gl.uniform2f(u(uniforms, 'uCenter'), centerX, centerY);
      gl.uniform1i(u(uniforms, 'uCount'), slots);
      gl.uniform4fv(u(uniforms, 'uShape'), shape);
      gl.uniform4fv(u(uniforms, 'uFrame'), frameData);
      gl.uniform4fv(u(uniforms, 'uTint'), tints);
      gl.uniform4f(
        u(uniforms, 'uHover'),
        cursor[0] - centerX,
        cursor[1] - centerY,
        hover * s.hoverIntensity,
        1 / 0.03,
      );
      gl.uniform1f(u(uniforms, 'uSplit'), split);
      gl.uniform1f(u(uniforms, 'uOpacity'), s.opacity);
      return uniforms;
    };

    gl.bindVertexArray(vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, glowBuffer);
    gl.viewport(0, 0, glowSize.width, glowSize.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const glowUniforms = shared(glowProgram);
    gl.uniform2f(
      u(glowUniforms, 'uScale'),
      canvas.width / glowSize.width,
      canvas.height / glowSize.height,
    );
    gl.uniformMatrix3fv(u(glowUniforms, 'uInverse'), true, view.inverse);
    gl.uniform2f(
      u(glowUniforms, 'uBounds'),
      Math.max(0, lowest - margin),
      highest + margin,
    );
    gl.uniform4f(
      u(glowUniforms, 'uHalo'),
      0,
      1 / outer,
      innerAmount,
      outerAmount,
    );
    gl.uniform3f(
      u(glowUniforms, 'uRange'),
      range * 0.45,
      1 / (range * 0.55),
      range,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const composeUniforms = shared(composeProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glowTexture);
    gl.uniform1i(u(composeUniforms, 'uGlow'), 0);
    gl.uniform1f(u(composeUniforms, 'uGrain'), s.grain);
    gl.uniform1f(u(composeUniforms, 'uTime'), clock);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const lineUniforms = shared(lineProgram);
    gl.uniformMatrix3fv(u(lineUniforms, 'uForward'), true, view.forward);
    gl.uniform1f(u(lineUniforms, 'uReach'), reach);
    gl.uniform1f(u(lineUniforms, 'uWidth'), width);
    gl.enable(gl.BLEND);
    if (s.light) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    else {
      gl.blendFuncSeparate(
        gl.ONE,
        gl.ONE_MINUS_SRC_COLOR,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA,
      );
    }
    gl.bindVertexArray(stripVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (SEGMENTS + 1) * 2, slots);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  };

  const frame = (now: number) => {
    raf = 0;
    if (lost) return;
    const s = getSettings();
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    clock += dt;
    if (!reduced) time += dt * s.speed;

    const targetX = pointer.inside
      ? pointer.x / Math.max(1e-6, size.width / size.unit)
      : 0;
    const targetY = pointer.inside
      ? pointer.y / Math.max(1e-6, size.height / size.unit)
      : 0;
    const stiffness = 70;
    const damping = 2 * Math.sqrt(stiffness) * 0.9;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let step = 0; step < steps; step++) {
      spring.vx += (stiffness * (targetX - spring.x) - damping * spring.vx) * h;
      spring.vy += (stiffness * (targetY - spring.y) - damping * spring.vy) * h;
      spring.x += spring.vx * h;
      spring.y += spring.vy * h;
      const hoverTarget = pointer.inside ? 1 : 0;
      spring.hoverVelocity +=
        (40 * (hoverTarget - spring.hover) -
          2 * Math.sqrt(40) * spring.hoverVelocity) *
        h;
      spring.hover += spring.hoverVelocity * h;
    }

    for (let index = bursts.length - 1; index >= 0; index--) {
      const burst = bursts[index];
      if (burst && clock - burst.start > BURST_LIFE) bursts.splice(index, 1);
    }
    if (introLive && time > (s.ringCount + 2) * STAGGER + CYCLE) {
      introLive = false;
    }

    render();

    const settling =
      Math.abs(spring.vx) +
        Math.abs(spring.vy) +
        Math.abs(spring.hoverVelocity) >
        1e-4 || Math.abs((pointer.inside ? 1 : 0) - spring.hover) > 1e-3;
    const busy =
      (s.speed > 0 && !reduced) || settling || bursts.length > 0 || introLive;
    if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf || lost || !visible || !pageVisible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const locate = (event: MagicRingsPointer) => {
    const rect = container.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    const unit = Math.max(1, Math.min(rect.width, rect.height));
    return {
      x: (event.clientX - rect.left - rect.width / 2) / unit,
      y: (rect.top + rect.height / 2 - event.clientY) / unit,
      inside,
    };
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  resize();
  wake();

  return {
    resize,
    wake,
    pointerMove(event) {
      if (event.pointerType === 'touch' && !pointer.touch) return;
      const spot = locate(event);
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = spot.inside;
      wake();
    },
    pointerDown(event) {
      const spot = locate(event);
      if (!spot.inside) return;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = true;
      pointer.touch = event.pointerType === 'touch';
      const s = getSettings();
      if (s.clickBurst && !reduced) {
        bursts.push({
          start: clock,
          radius: Math.max(0.04, s.baseRadius * 0.45),
        });
        if (bursts.length > MAX_BURSTS) bursts.shift();
      }
      wake();
    },
    pointerUp(event) {
      if (event.pointerType !== 'touch') return;
      pointer.touch = false;
      pointer.inside = false;
      wake();
    },
    leave() {
      pointer.inside = false;
      wake();
    },
    setVisible(value) {
      visible = value;
      wake();
    },
    setPageVisible(value) {
      pageVisible = value;
      wake();
    },
    loseContext() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        gl.deleteVertexArray(vao);
        gl.deleteTexture(glowTexture);
        gl.deleteFramebuffer(glowBuffer);
        programs.forEach((entry) => entry && gl.deleteProgram(entry.program));
        gl.deleteVertexArray(stripVao);
        gl.deleteBuffer(stripBuffer);
      }
    },
  };
}
