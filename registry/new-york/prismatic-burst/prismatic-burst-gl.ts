import {
  PRISMATIC_BURST_BLUR,
  PRISMATIC_BURST_COMPOSITE,
  PRISMATIC_BURST_DOWNSAMPLE,
  PRISMATIC_BURST_SCENE,
  PRISMATIC_BURST_VERTEX,
} from './prismatic-burst-shaders';
import type {
  PrismaticBurstAnimationType,
  PrismaticBurstEngine,
  PrismaticBurstEngineOptions,
  PrismaticBurstProgram,
  PrismaticBurstQuality,
  PrismaticBurstTarget,
} from './types';

export const PRISMATIC_BURST_QUALITY: Record<PrismaticBurstQuality, number> = {
  low: 0.35,
  medium: 0.5,
  high: 0.7,
};

export const PRISMATIC_BURST_ANIMATIONS: Record<
  PrismaticBurstAnimationType,
  number
> = { rotate: 0, rotate3d: 1, hover: 2 };

export const PRISMATIC_BURST_MIN_SCALE = 0.2;

const BLOOM_LEVELS = 4;
const MAX_PULSES = 4;
const INTRO_SECONDS = 2.4;
const PULSE_LIFE = 1.5;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function toPx(value: number | string | undefined | null): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value.trim().replace('px', ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function rotX(a: number): number[] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}

function rotY(a: number): number[] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

function rotZ(a: number): number[] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function multiply(a: ArrayLike<number>, b: ArrayLike<number>): Float32Array {
  const out = new Float32Array(9);
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      out[col * 3 + row] =
        (a[row] ?? 0) * (b[col * 3] ?? 0) +
        (a[3 + row] ?? 0) * (b[col * 3 + 1] ?? 0) +
        (a[6 + row] ?? 0) * (b[col * 3 + 2] ?? 0);
    }
  }
  return out;
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

function link(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
): PrismaticBurstProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, PRISMATIC_BURST_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
    if (info) {
      uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(
        program,
        info.name,
      );
    }
  }
  return { program, uniforms };
}

export function createPrismaticBurstEngine(
  options: PrismaticBurstEngineOptions,
): PrismaticBurstEngine | null {
  const { container, canvas, getSettings, reduce, onRestored } = options;
  const context = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;

  const floatTargets = Boolean(gl.getExtension('EXT_color_buffer_float'));
  const burstProgram = link(gl, PRISMATIC_BURST_SCENE);
  const downProgram = link(gl, PRISMATIC_BURST_DOWNSAMPLE);
  const blurProgram = link(gl, PRISMATIC_BURST_BLUR);
  const compositeProgram = link(gl, PRISMATIC_BURST_COMPOSITE);
  if (!burstProgram || !downProgram || !blurProgram || !compositeProgram) {
    return null;
  }
  const burst: PrismaticBurstProgram = burstProgram;
  const down: PrismaticBurstProgram = downProgram;
  const blur: PrismaticBurstProgram = blurProgram;
  const composite: PrismaticBurstProgram = compositeProgram;

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

  // Without float targets the scene is stored at a quarter of its energy
  // so bright rays survive 8-bit storage, then decoded in the composite.
  const format = floatTargets ? gl.RGBA16F : gl.RGBA8;
  const encode = floatTargets ? 1 : 0.25;

  function createTarget(): PrismaticBurstTarget {
    return {
      texture: null,
      framebuffer: gl.createFramebuffer(),
      width: 0,
      height: 0,
    };
  }
  const scene = createTarget();
  const levels: [PrismaticBurstTarget, PrismaticBurstTarget][] = Array.from(
    { length: BLOOM_LEVELS },
    () => [createTarget(), createTarget()],
  );

  function allocate(target: PrismaticBurstTarget, w: number, h: number) {
    if (target.texture && target.width === w && target.height === h) return;
    if (target.texture) gl.deleteTexture(target.texture);
    target.texture = gl.createTexture();
    target.width = w;
    target.height = h;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, format, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      target.texture,
      0,
    );
  }

  function pass(
    target: PrismaticBurstTarget | null,
    program: PrismaticBurstProgram,
  ): Record<string, WebGLUniformLocation | null> {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(
      0,
      0,
      target ? target.width : canvas.width,
      target ? target.height : canvas.height,
    );
    gl.useProgram(program.program);
    return program.uniforms;
  }

  function bind(unit: number, texture: WebGLTexture | null) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }

  function loc(
    uniforms: Record<string, WebGLUniformLocation | null>,
    name: string,
  ): WebGLUniformLocation | null {
    return uniforms[name] ?? null;
  }

  const gradient = gl.createTexture();
  let gradientKey: string | null = null;
  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });

  function toRgb(value: string): [number, number, number] {
    if (!probe) return [255, 255, 255];
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = '#ffffff';
    probe.fillStyle = value;
    probe.fillRect(0, 0, 1, 1);
    const data = probe.getImageData(0, 0, 1, 1).data;
    return [data[0] ?? 255, data[1] ?? 255, data[2] ?? 255];
  }

  function uploadGradient(list: string[]) {
    const key = list.join('|');
    if (key === gradientKey) return;
    gradientKey = key;
    const count = Math.max(1, list.length);
    const data = new Uint8Array(count * 4).fill(255);
    list.forEach((value, index) => data.set(toRgb(value), index * 4));
    gl.bindTexture(gl.TEXTURE_2D, gradient);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      count,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  const pointer = { x: 0, y: 0, inside: false };
  const state = {
    time: 0,
    phase: 0,
    flow: 0,
    kick: 0,
    intro: getSettings().intro && !reduce ? 0 : 1,
    hoverX: 0.5,
    hoverY: 0.5,
    smoothX: 0,
    smoothY: 0,
    touch: 0,
    governor: 1,
    slow: 0,
    quick: 0,
  };
  const pulses: { age: number }[] = [];
  const pulseData = new Float32Array(MAX_PULSES * 4);
  let raf = 0;
  let last = 0;
  let visible = true;
  let lastDpr = getSettings().dpr;

  function render() {
    const s = getSettings();
    const width = canvas.width;
    const height = canvas.height;
    const cssWidth = Math.max(1, container.clientWidth);
    const cssHeight = Math.max(1, container.clientHeight);
    const scale = Math.max(PRISMATIC_BURST_MIN_SCALE, s.scale * state.governor);
    const sceneWidth = Math.max(1, Math.round(width * scale));
    const sceneHeight = Math.max(1, Math.round(height * scale));
    const exact = sceneWidth === width && sceneHeight === height;
    gl.bindVertexArray(vao);
    allocate(scene, sceneWidth, sceneHeight);
    levels.forEach((pair, index) => {
      const levelWidth = Math.max(1, Math.round(cssWidth / 2 ** (index + 1)));
      const levelHeight = Math.max(1, Math.round(cssHeight / 2 ** (index + 1)));
      allocate(pair[0], levelWidth, levelHeight);
      allocate(pair[1], levelWidth, levelHeight);
    });
    uploadGradient(s.colors);

    const toScene = sceneWidth / cssWidth;
    const engaged = s.mouseInteraction ? state.touch : 0;
    const nx = (state.smoothX / cssWidth) * 2 - 1;
    const ny = (state.smoothY / cssHeight) * 2 - 1;
    const parallax =
      0.06 *
      s.mouseStrength *
      engaged *
      Math.min(sceneWidth, sceneHeight) *
      0.5;
    const offsetX = s.offsetX * toScene + nx * parallax;
    const offsetY = s.offsetY * toScene - ny * parallax;

    const t = state.phase;
    let orient: ArrayLike<number>;
    if (s.animation === 0) {
      const a = t * 0.2;
      const c0 = Math.cos(a);
      orient = [c0, 0, Math.cos(a + 11), 0, 1, 0, Math.cos(a + 33), 0, c0];
    } else if (s.animation === 1) {
      orient = multiply(
        multiply(rotZ(t * 0.17), rotY(t * 0.21)),
        rotX(t * 0.31),
      );
    } else {
      const mx = state.hoverX * 2 - 1;
      const my = state.hoverY * 2 - 1;
      orient = multiply(rotY(mx * 0.6), rotX(my * 0.6));
    }
    if (s.animation !== 2 && engaged > 0) {
      const tilt = 0.3 * s.mouseStrength * engaged;
      orient = multiply(orient, multiply(rotY(nx * tilt), rotX(ny * tilt)));
    }

    pulseData.fill(0);
    pulses.forEach((pulse, index) => {
      const life = pulse.age / PULSE_LIFE;
      pulseData.set(
        [
          pulse.age * 1.7,
          1.6 * Math.pow(1 - life, 1.6),
          0.2 + pulse.age * 0.16,
          0.35 * Math.exp(-pulse.age * 7),
        ],
        index * 4,
      );
    });

    const unit = 0.5 * Math.min(sceneWidth, sceneHeight);
    const reach =
      Math.hypot(
        sceneWidth * 0.5 + Math.abs(offsetX),
        sceneHeight * 0.5 + Math.abs(offsetY),
      ) / Math.max(unit, 1);
    const rise = 1 - Math.pow(1 - state.intro, 3);

    const b = pass(scene, burst);
    bind(0, gradient);
    gl.uniform1i(loc(b, 'uGradient'), 0);
    gl.uniform2f(loc(b, 'uResolution'), sceneWidth, sceneHeight);
    gl.uniform1f(loc(b, 'uTime'), state.time);
    gl.uniform1f(loc(b, 'uPhase'), t);
    gl.uniform1f(loc(b, 'uIntensity'), s.intensity);
    gl.uniformMatrix3fv(loc(b, 'uOrient'), false, Float32Array.from(orient));
    gl.uniform1i(loc(b, 'uColorCount'), s.colors.length);
    gl.uniform1f(loc(b, 'uDistort'), s.distort);
    gl.uniform2f(loc(b, 'uOffset'), offsetX, offsetY);
    gl.uniform1f(loc(b, 'uNoiseAmount'), s.grain);
    gl.uniform1i(loc(b, 'uRayCount'), s.rayCount);
    gl.uniform1f(loc(b, 'uZoom'), s.zoom);
    gl.uniform1f(loc(b, 'uRayWidth'), s.rayWidth);
    gl.uniform1f(loc(b, 'uTwist'), s.twist);
    gl.uniform1f(loc(b, 'uFlow'), state.flow);
    gl.uniform1f(loc(b, 'uCenterFade'), s.centerFade * Math.max(1, s.zoom));
    gl.uniform4f(
      loc(b, 'uPointer'),
      state.smoothX * toScene,
      (cssHeight - state.smoothY) * toScene,
      s.mouseInteraction ? 0.7 * s.mouseStrength * engaged : 0,
      0.45,
    );
    gl.uniform4fv(loc(b, 'uPulses'), pulseData);
    gl.uniform3f(
      loc(b, 'uIntro'),
      (rise * (reach + 0.6)) / 0.7,
      1.6 * (1 - state.intro),
      state.intro < 1 ? 1 : 0,
    );
    gl.uniform1f(loc(b, 'uEncode'), encode);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (s.glow > 0) {
      let source = scene;
      for (const [front, back] of levels) {
        const d = pass(front, down);
        bind(0, source.texture);
        gl.uniform1i(loc(d, 'uSource'), 0);
        gl.uniform2f(loc(d, 'uTarget'), front.width, front.height);
        gl.uniform2f(loc(d, 'uTexel'), 1 / source.width, 1 / source.height);
        gl.uniform1f(loc(d, 'uLimit'), 3 * encode);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        let u = pass(back, blur);
        bind(0, front.texture);
        gl.uniform1i(loc(u, 'uSource'), 0);
        gl.uniform2f(loc(u, 'uTarget'), back.width, back.height);
        gl.uniform2f(loc(u, 'uStep'), 1 / front.width, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        u = pass(front, blur);
        bind(0, back.texture);
        gl.uniform1i(loc(u, 'uSource'), 0);
        gl.uniform2f(loc(u, 'uTarget'), front.width, front.height);
        gl.uniform2f(loc(u, 'uStep'), 0, 1 / back.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        source = front;
      }
    }

    const c = pass(null, composite);
    bind(0, scene.texture);
    gl.uniform1i(loc(c, 'uScene'), 0);
    levels.forEach(([front], index) => {
      bind(index + 1, front.texture);
      gl.uniform1i(loc(c, `uBloom${index}`), index + 1);
    });
    gl.uniform2f(loc(c, 'uSceneSize'), sceneWidth, sceneHeight);
    gl.uniform2f(loc(c, 'uView'), width, height);
    gl.uniform1f(loc(c, 'uExact'), exact ? 1 : 0);
    gl.uniform1f(loc(c, 'uDecode'), 1 / encode);
    gl.uniform1f(loc(c, 'uBloom'), s.glow);
    gl.uniform1f(loc(c, 'uFade'), s.fade);
    gl.uniform1f(loc(c, 'uLightMode'), s.lightMode ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    for (let u = BLOOM_LEVELS; u >= 0; u--) bind(u, null);
  }

  // Drops the render scale when frames run slow, and recovers it slowly.
  function tune(interval: number) {
    if (interval > 1 / 40) {
      state.slow += 1;
      state.quick = 0;
    } else if (interval < 1 / 55) {
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
  }

  function frame(now: number) {
    raf = 0;
    if (!visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    if (last) tune((now - last) / 1000);
    last = now;

    if (!s.intro || reduce) state.intro = 1;
    else if (state.intro < 1) {
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    }
    const rush = 3 * Math.pow(1 - state.intro, 2);
    const running = !s.paused && !reduce;
    if (running) {
      state.time += dt;
      state.phase += dt * s.speed * (1 + rush) + state.kick * dt;
      state.flow += dt * s.flow * 1.2;
    }
    state.kick *= Math.exp(-dt * 3.5);
    if (state.kick < 1e-3) state.kick = 0;

    const engaged = s.mouseInteraction && pointer.inside && !reduce;
    const tau = 0.02 + s.hoverDampness * 0.5;
    const follow = 1 - Math.exp(-dt / tau);
    if (engaged && state.touch < 0.01) {
      state.smoothX = pointer.x;
      state.smoothY = pointer.y;
    }
    state.smoothX += (pointer.x - state.smoothX) * follow;
    state.smoothY += (pointer.y - state.smoothY) * follow;
    state.touch +=
      ((engaged ? 1 : 0) - state.touch) *
      (1 - Math.exp(-dt * (engaged ? 5 : 2.5)));
    if (s.animation === 2 && pointer.inside) {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      state.hoverX += (clamp(pointer.x / width, 0, 1) - state.hoverX) * follow;
      state.hoverY += (clamp(pointer.y / height, 0, 1) - state.hoverY) * follow;
    }

    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i]!;
      pulse.age += dt;
      if (pulse.age > PULSE_LIFE) pulses.splice(i, 1);
    }

    render();

    const settling =
      state.intro < 1 ||
      pulses.length > 0 ||
      state.kick > 0 ||
      Math.abs((engaged ? 1 : 0) - state.touch) > 0.002 ||
      Math.abs(pointer.x - state.smoothX) +
        Math.abs(pointer.y - state.smoothY) >
        0.2;
    if (
      (running && (s.speed !== 0 || s.grain > 0 || s.flow !== 0)) ||
      settling
    ) {
      raf = requestAnimationFrame(frame);
    } else {
      last = 0;
    }
  }

  function wake() {
    if (!raf && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  }

  function resize() {
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    if (!raf) render();
    wake();
  }

  function locate(clientX: number, clientY: number) {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
      x,
      y,
      inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
    };
  }

  resize();

  return {
    refresh() {
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
      const point = locate(clientX, clientY);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = point.inside;
      wake();
    },
    pointerDown(clientX, clientY) {
      const point = locate(clientX, clientY);
      if (!point.inside) return;
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = true;
      const s = getSettings();
      if (s.mouseInteraction && s.clickBurst && !reduce) {
        if (pulses.length >= MAX_PULSES) pulses.shift();
        pulses.push({ age: 0 });
        state.kick = Math.min(5, state.kick + 2.4);
      }
      wake();
    },
    pointerLeave() {
      pointer.inside = false;
      wake();
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
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      for (const target of [scene, ...levels.flat()]) {
        if (target.texture) gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      gl.deleteTexture(gradient);
      for (const item of [burst, down, blur, composite]) {
        gl.deleteProgram(item.program);
      }
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      if (loseContext && !gl.isContextLost()) {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    },
  };
}
