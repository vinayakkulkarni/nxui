import {
  BLOOM_LEVELS,
  FOCAL,
  HISTORY,
  INTRO_SECONDS,
  MAX_RENDER_DIM,
  MAX_TARGETS,
  TAU,
  clamp,
  seeded,
  spawnTarget,
} from './radar-config';
import {
  COMPOSITE,
  DOWN,
  QUAD_VERTEX,
  SCENE,
  SPRITE_FRAGMENT,
  SPRITE_VERTEX,
  UP,
} from './radar-shaders';
import type {
  RadarContact,
  RadarEcho,
  RadarEngine,
  RadarEngineOptions,
  RadarProgram,
  RadarSettings,
  RadarTarget,
} from './types';

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function link(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  attributes: string[],
): RadarProgram | null {
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
  attributes.forEach((name, index) =>
    gl.bindAttribLocation(program, index, name),
  );
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
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

/**
 * Radar scope on raw WebGL2: scene pass (grid, sweep, clutter), instanced
 * contact sprites, a dual-filter bloom chain and a tone-mapped composite.
 * Returns null when WebGL2 or a shader is unavailable.
 */
export function createRadarEngine(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  { getSettings, reducedMotion: reduce }: RadarEngineOptions,
): RadarEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
  const range = floatTargets ? 1 : 0.25;
  const sceneProgram = link(gl, QUAD_VERTEX, SCENE, ['aPosition']);
  const spriteProgram = link(gl, SPRITE_VERTEX, SPRITE_FRAGMENT, [
    'aCorner',
    'aSprite',
    'aStyle',
  ]);
  const downProgram = link(gl, QUAD_VERTEX, DOWN, ['aPosition']);
  const upProgram = link(gl, QUAD_VERTEX, UP, ['aPosition']);
  const compositeProgram = link(gl, QUAD_VERTEX, COMPOSITE, ['aPosition']);
  const allPrograms = [
    sceneProgram,
    spriteProgram,
    downProgram,
    upProgram,
    compositeProgram,
  ];
  if (
    !sceneProgram ||
    !spriteProgram ||
    !downProgram ||
    !upProgram ||
    !compositeProgram
  ) {
    for (const entry of allPrograms) {
      if (entry) gl.deleteProgram(entry.program);
    }
    return null;
  }

  const quadBuffer = gl.createBuffer();
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const cornerBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  const spriteVao = gl.createVertexArray();
  gl.bindVertexArray(spriteVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  for (let attribute = 1; attribute <= 2; attribute++) {
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(
      attribute,
      4,
      gl.FLOAT,
      false,
      32,
      (attribute - 1) * 16,
    );
    gl.vertexAttribDivisor(attribute, 1);
  }
  gl.bindVertexArray(null);

  const createTarget = (): RadarTarget => ({
    texture: gl.createTexture(),
    framebuffer: gl.createFramebuffer(),
    width: 0,
    height: 0,
  });
  const sizeTarget = (target: RadarTarget, width: number, height: number) => {
    if (target.width === width && target.height === height) return;
    target.width = width;
    target.height = height;
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    if (floatTargets) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA16F,
        width,
        height,
        0,
        gl.RGBA,
        gl.HALF_FLOAT,
        null,
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    }
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
  };
  const scene = createTarget();
  const down = Array.from({ length: BLOOM_LEVELS + 1 }, createTarget);
  const up = Array.from({ length: BLOOM_LEVELS }, createTarget);

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, number[]>();
  const parseColor = (value: string): number[] => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgba = [1, 1, 1, 1];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = 'rgba(0, 0, 0, 0)';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0, a = 0] = probe.getImageData(0, 0, 1, 1).data;
      rgba = a ? [r / a, g / a, b / a, a / 255] : [0, 0, 0, 0];
    }
    colorCache.set(value, rgba);
    return rgba;
  };
  const toLinear = (value: string) =>
    parseColor(value)
      .slice(0, 3)
      .map((v) => Math.pow(v, 2.2));

  const rng = seeded(7919);
  const contacts: RadarContact[] = Array.from({ length: MAX_TARGETS }, () => ({
    ...spawnTarget(rng, false),
    echoes: [],
  }));
  const cursor = { x: 0, y: 0, inside: false, echoes: [] as RadarEcho[] };
  const pointer = { x: 0, y: 0, inside: false };
  const view = { width: 1, height: 1, ratio: 1 };
  const state = {
    time: 0,
    sweep: 0,
    swept: 0,
    cycle: 0,
    intro: getSettings().intro && !reduce ? 0 : 1,
    heat: 0,
    heatVelocity: 0,
    heatX: 0,
    heatY: 0,
  };
  const instances = new Float32Array(8 * 160);
  let raf = 0;
  let last = 0;
  let visible = true;
  let disposed = false;
  let lastDpr = getSettings().dpr;

  const fit = (s: RadarSettings) =>
    (s.scale * Math.min(view.width, view.height)) / view.height;

  const camera = (s: RadarSettings) => ({
    distance: (2 * FOCAL) / fit(s),
    focal: FOCAL,
    tilt: s.tilt,
  });

  const toPlane = (
    s: RadarSettings,
    x: number,
    y: number,
  ): [number, number] | null => {
    const { distance, focal, tilt } = camera(s);
    const sx = (x - s.centerX * view.width) / view.height;
    const sy = (s.centerY * view.height - y) / view.height;
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const dx = sx;
    const dy = focal * st + sy * ct;
    const dz = -focal * ct + sy * st;
    if (dz > -0.0001) return null;
    const ey = -distance * st;
    const ez = distance * ct;
    const t = -ez / dz;
    return [dx * t, ey + dy * t];
  };

  const period = (s: RadarSettings) => (s.mode === 'pulse' ? 3.2 : 6);

  const record = (contact: { x: number; y: number; echoes: RadarEcho[] }) => {
    contact.echoes.unshift({ x: contact.x, y: contact.y, time: state.time });
    if (contact.echoes.length > HISTORY) contact.echoes.length = HISTORY;
  };

  const advance = (s: RadarSettings, dt: number) => {
    const step = dt * Math.abs(s.speed);
    const pulse = s.mode === 'pulse';
    const span = pulse ? 1.15 : TAU;
    const delta = (step / period(s)) * span;
    const direction = s.speed < 0 && !pulse ? -1 : 1;
    const previous = state.sweep;
    state.swept += delta;
    const passed = (x: number, y: number) => {
      if (pulse) {
        const radius = Math.hypot(x, y);
        const from = previous;
        const to = previous + delta;
        return (
          (radius > from && radius <= to) || (to > span && radius <= to - span)
        );
      }
      const bearing = Math.atan2(x, y);
      const gap = (((direction * (bearing - previous)) % TAU) + TAU) % TAU;
      return gap > 0 && gap <= delta;
    };
    for (let i = 0; i < s.targets; i++) {
      const contact = contacts[i]!;
      contact.heading += contact.turn * step;
      contact.x += Math.sin(contact.heading) * contact.velocity * step;
      contact.y += Math.cos(contact.heading) * contact.velocity * step;
      if (Math.hypot(contact.x, contact.y) > 0.96) {
        Object.assign(contact, spawnTarget(rng, true));
      }
      if (passed(contact.x, contact.y)) record(contact);
    }
    if (cursor.inside && passed(cursor.x, cursor.y)) record(cursor);
    state.sweep += direction * delta;
    while (state.sweep >= span) {
      state.sweep -= span;
      state.cycle += 1;
    }
    while (state.sweep < 0) {
      state.sweep += span;
      state.cycle += 1;
    }
  };

  const buildSprites = (s: RadarSettings) => {
    const unit = 2 / (fit(s) * view.height);
    const persist = (period(s) / Math.max(Math.abs(s.speed), 0.05)) * 1.1;
    let count = 0;
    const push = (
      x: number,
      y: number,
      radius: number,
      kind: number,
      intensity: number,
      core: number,
      angle: number,
    ) => {
      if (count * 8 + 8 > instances.length) return;
      instances.set([x, y, radius, kind, intensity, core, 0, angle], count * 8);
      count++;
    };
    const emit = (contact: { echoes: RadarEcho[] }, strength: number) => {
      contact.echoes.forEach((echo, index) => {
        const age = state.time - echo.time;
        const fade = Math.exp(-age / persist) * (index === 0 ? 1 : 0.8);
        if (fade < 0.01) return;
        const angle = -Math.atan2(echo.x, echo.y);
        push(
          echo.x,
          echo.y,
          unit * (index === 0 ? 3.4 : 2.4),
          0,
          fade * strength * 2.2,
          index === 0 ? 1 : 0.3,
          angle,
        );
        if (index === 0 && age < 1.4) {
          const progress = age / 1.4;
          const eased = 1 - Math.pow(1 - progress, 3);
          push(
            echo.x,
            echo.y,
            unit * (4 + 26 * eased),
            1,
            (1 - progress) * (1 - progress) * strength * 1.4,
            0,
            0,
          );
        }
      });
    };
    for (let i = 0; i < s.targets; i++) emit(contacts[i]!, 1);
    emit(cursor, 1.3);
    return count;
  };

  const run = (
    entry: RadarProgram,
    target: RadarTarget | null,
    width: number,
    height: number,
  ) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(entry.program);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const bindTexture = (
    entry: RadarProgram,
    name: string,
    unit: number,
    texture: WebGLTexture | null,
  ) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(entry.uniforms[name] ?? null, unit);
  };

  const setCamera = (entry: RadarProgram, s: RadarSettings) => {
    const u = entry.uniforms;
    const { distance, focal, tilt } = camera(s);
    gl.uniform2f(u.uResolution ?? null, canvas.width, canvas.height);
    gl.uniform2f(
      u.uCenter ?? null,
      s.centerX * canvas.width,
      (1 - s.centerY) * canvas.height,
    );
    gl.uniform1f(u.uViewHeight ?? null, canvas.height);
    gl.uniform1f(u.uFocal ?? null, focal);
    gl.uniform1f(u.uDistance ?? null, distance);
    gl.uniform1f(u.uTilt ?? null, tilt);
  };

  const render = () => {
    const s = getSettings();
    const accent = toLinear(s.color);
    const presence = state.intro;
    sizeTarget(scene, canvas.width, canvas.height);

    const u = sceneProgram.uniforms;
    const at = (name: string) => u[name] ?? null;
    gl.useProgram(sceneProgram.program);
    setCamera(sceneProgram, s);
    gl.uniform1f(at('uMode'), s.mode === 'pulse' ? 1 : 0);
    gl.uniform1f(at('uSweep'), state.sweep);
    gl.uniform1f(at('uSwept'), Math.min(state.swept, TAU + 1));
    gl.uniform1f(at('uDirection'), s.speed < 0 && s.mode !== 'pulse' ? -1 : 1);
    gl.uniform1f(at('uCycle'), state.cycle);
    gl.uniform1f(
      at('uTrail'),
      s.mode === 'pulse' ? s.trail * 0.22 : s.trail * TAU * 0.5,
    );
    gl.uniform1f(at('uRings'), s.ringCount);
    gl.uniform1f(at('uSpokes'), s.spokeCount);
    gl.uniform1f(at('uTicks'), s.ticks ? 1 : 0);
    gl.uniform1f(at('uGrid'), s.gridOpacity);
    gl.uniform1f(at('uLine'), s.lineWidth * view.ratio);
    gl.uniform1f(at('uClutter'), s.clutter * (s.lightMode ? 0.6 : 1));
    gl.uniform1f(at('uTime'), state.time);
    gl.uniform3fv(at('uAccent'), accent);
    gl.uniform3f(at('uHeat'), state.heatX, state.heatY, state.heat);
    gl.uniform1f(at('uIntro'), presence);
    gl.uniform1f(at('uRange'), range);
    gl.uniform1f(at('uPixel'), view.ratio);
    gl.bindVertexArray(quadVao);
    run(sceneProgram, scene, canvas.width, canvas.height);

    const count = buildSprites(s);
    if (count > 0) {
      gl.useProgram(spriteProgram.program);
      setCamera(spriteProgram, s);
      gl.uniform3fv(spriteProgram.uniforms.uAccent ?? null, accent);
      gl.uniform1f(
        spriteProgram.uniforms.uRange ?? null,
        range * Math.min(1, presence * 2),
      );
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.bindVertexArray(spriteVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        instances.subarray(0, count * 8),
        gl.DYNAMIC_DRAW,
      );
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      gl.disable(gl.BLEND);
    }

    gl.bindVertexArray(quadVao);
    let source = scene;
    for (let level = 0; floatTargets && level <= BLOOM_LEVELS; level++) {
      const target = down[level]!;
      const width =
        level === 0 ? Math.round(view.width / 2) : source.width >> 1;
      const height =
        level === 0 ? Math.round(view.height / 2) : source.height >> 1;
      sizeTarget(target, Math.max(1, width), Math.max(1, height));
      gl.useProgram(downProgram.program);
      gl.uniform2f(
        downProgram.uniforms.uTexel ?? null,
        1 / source.width,
        1 / source.height,
      );
      gl.uniform2f(
        downProgram.uniforms.uTarget ?? null,
        target.width,
        target.height,
      );
      bindTexture(downProgram, 'uSource', 0, source.texture);
      run(downProgram, target, target.width, target.height);
      source = target;
    }
    for (let level = BLOOM_LEVELS - 1; floatTargets && level >= 0; level--) {
      const from =
        level === BLOOM_LEVELS - 1 ? down[BLOOM_LEVELS]! : up[level + 1]!;
      const target = up[level]!;
      const base = down[level]!;
      sizeTarget(target, base.width, base.height);
      gl.useProgram(upProgram.program);
      gl.uniform2f(
        upProgram.uniforms.uTexel ?? null,
        1 / from.width,
        1 / from.height,
      );
      gl.uniform2f(
        upProgram.uniforms.uTarget ?? null,
        target.width,
        target.height,
      );
      bindTexture(upProgram, 'uSource', 0, from.texture);
      bindTexture(upProgram, 'uBase', 1, base.texture);
      run(upProgram, target, target.width, target.height);
    }

    const c = compositeProgram.uniforms;
    const cAt = (name: string) => c[name] ?? null;
    gl.useProgram(compositeProgram.program);
    gl.uniform2f(cAt('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(cAt('uExposure'), (1.5 * s.brightness) / range);
    gl.uniform1f(cAt('uGlow'), floatTargets ? s.glow : 0);
    gl.uniform1f(cAt('uGrain'), s.grain);
    gl.uniform1f(cAt('uFade'), s.fade);
    gl.uniform1f(cAt('uOpacity'), s.opacity);
    gl.uniform1f(cAt('uTime'), state.time % 1000);
    gl.uniform1f(cAt('uLightMode'), s.lightMode ? 1 : 0);
    const back = parseColor(s.backgroundColor);
    gl.uniform4f(
      cAt('uBackground'),
      back[0] ?? 0,
      back[1] ?? 0,
      back[2] ?? 0,
      back[3] ?? 0,
    );
    bindTexture(compositeProgram, 'uScene', 0, scene.texture);
    bindTexture(compositeProgram, 'uBloom', 1, up[0]!.texture);
    run(compositeProgram, null, canvas.width, canvas.height);
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !reduce;
    if (!s.intro || reduce) state.intro = 1;
    else if (state.intro < 1) {
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    }
    const plane =
      s.mouseInteraction && pointer.inside && !reduce
        ? toPlane(s, pointer.x, pointer.y)
        : null;
    cursor.inside = !!plane && Math.hypot(plane[0], plane[1]) < 0.98;
    if (plane) {
      cursor.x = plane[0];
      cursor.y = plane[1];
      state.heatX += (plane[0] - state.heatX) * (1 - Math.exp(-dt * 10));
      state.heatY += (plane[1] - state.heatY) * (1 - Math.exp(-dt * 10));
    }
    const goal = cursor.inside ? 1 : 0;
    state.heatVelocity +=
      (120 * (goal - state.heat) - 19 * state.heatVelocity) * dt;
    state.heat = clamp(state.heat + state.heatVelocity * dt, 0, 1.2);
    if (moving) {
      state.time += dt;
      const ramp = 0.25 + 0.75 * clamp((state.intro - 0.35) / 0.65, 0, 1);
      advance(s, dt * ramp);
    }
    render();
    const settling =
      state.intro < 1 ||
      state.heat > 0.001 ||
      Math.abs(state.heatVelocity) > 0.001;
    if (moving || settling) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!disposed && !raf && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  };

  const resize = () => {
    if (disposed) return;
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const base = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    const longest = Math.max(width, height) * base;
    const ratio =
      longest > MAX_RENDER_DIM ? (base * MAX_RENDER_DIM) / longest : base;
    view.width = width;
    view.height = height;
    view.ratio = ratio;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    if (!raf) render();
    wake();
  };

  resize();

  return {
    pointerMove(event) {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside =
        pointer.x >= 0 &&
        pointer.y >= 0 &&
        pointer.x <= rect.width &&
        pointer.y <= rect.height;
      wake();
    },
    leave() {
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
    pageVisibilityChanged() {
      last = 0;
      wake();
    },
    resize,
    refresh() {
      if (disposed) return;
      const dpr = getSettings().dpr;
      if (dpr !== lastDpr) {
        lastDpr = dpr;
        resize();
        return;
      }
      if (!raf) render();
      wake();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      for (const target of [scene, ...down, ...up]) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      for (const entry of allPrograms) {
        if (entry) gl.deleteProgram(entry.program);
      }
      gl.deleteBuffer(quadBuffer);
      gl.deleteBuffer(cornerBuffer);
      gl.deleteBuffer(instanceBuffer);
      gl.deleteVertexArray(quadVao);
      gl.deleteVertexArray(spriteVao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
