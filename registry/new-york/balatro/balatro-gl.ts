import {
  FIELD,
  FIELD_SCALE,
  MAX_TWIRLS,
  PAINT,
  PIXEL_BUDGET,
  SCREEN,
  STIR_RADIUS,
  VERTEX,
} from './balatro-shaders';
import type {
  BalatroEngine,
  BalatroPointer,
  BalatroProgram,
  BalatroRgb,
  BalatroSettings,
  BalatroTarget,
  BalatroTwirl,
  BalatroUniforms,
} from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseColor(value: string): BalatroRgb | null {
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
  return null;
}

function smoother(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
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
  source: string,
): BalatroProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
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
  const uniforms: BalatroUniforms = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (!info) continue;
    const location = gl.getUniformLocation(program, info.name);
    if (location) uniforms[info.name.replace(/\[0\]$/, '')] = location;
  }
  return { program, uniforms };
}

function u(uniforms: BalatroUniforms, name: string) {
  return uniforms[name] ?? null;
}

/**
 * Creates the WebGL2 paint renderer. Returns null when WebGL2 or the shaders
 * are unavailable. `firstRun` enables the intro (it is skipped after a
 * context restore).
 */
export function createBalatroEngine(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => BalatroSettings,
  reduced: boolean,
  firstRun: boolean,
  onRestored: () => void,
): BalatroEngine | null {
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
  const paintProgram = link(gl, PAINT);
  const screenProgram = link(gl, SCREEN);
  if (!paintProgram || !screenProgram) {
    if (paintProgram) gl.deleteProgram(paintProgram.program);
    if (screenProgram) gl.deleteProgram(screenProgram.program);
    return null;
  }
  const floatTargets = Boolean(
    gl.getExtension('EXT_color_buffer_float') ||
    gl.getExtension('EXT_color_buffer_half_float'),
  );
  const fieldProgram = floatTargets ? link(gl, FIELD) : null;

  const vao = gl.createVertexArray();
  const view = {
    cssWidth: 1,
    cssHeight: 1,
    block: 1,
    device: 1,
    width: 1,
    height: 1,
    crt: false,
  };
  const paintTarget = {
    texture: gl.createTexture(),
    framebuffer: gl.createFramebuffer(),
    width: 0,
    height: 0,
  };
  let fieldTargets: BalatroTarget[] = [];
  const field = { width: 0, height: 0, energy: 0 };
  const pointer = {
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    vx: 0,
    inside: false,
    ready: false,
  };
  const steer = { value: 0 };
  const twirls: BalatroTwirl[] = [];
  const twirlData = new Float32Array(MAX_TWIRLS * 4);
  let flow = 14;
  let spin = 0;
  let opening = getSettings().intro && !reduced && firstRun ? 0 : 1;
  let raf = 0;
  let last = 0;
  let visible = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let lost = false;

  const makeTarget = (width: number, height: number): BalatroTarget => {
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
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer };
  };

  const dropField = () => {
    fieldTargets.forEach((target) => {
      gl.deleteTexture(target.texture);
      gl.deleteFramebuffer(target.framebuffer);
    });
    fieldTargets = [];
    field.width = 0;
    field.height = 0;
    field.energy = 0;
  };

  const resize = () => {
    if (lost) return;
    const s = getSettings();
    const rect = container.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, s.maxRatio);
    const budget = Math.ceil(
      Math.sqrt((cssWidth * cssHeight * dpr * dpr) / PIXEL_BUDGET) - 0.05,
    );
    const device = Math.max(
      s.pixelSize > 0 ? Math.round(s.pixelSize * dpr) : 1,
      budget,
      1,
    );
    const width = Math.max(1, Math.ceil((cssWidth * dpr) / device));
    const height = Math.max(1, Math.ceil((cssHeight * dpr) / device));
    const crt = s.crt > 0;
    const canvasWidth = crt ? width * device : width;
    const canvasHeight = crt ? height * device : height;
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
    canvas.style.width = `${(width * device) / dpr}px`;
    canvas.style.height = `${(height * device) / dpr}px`;
    canvas.style.imageRendering =
      !crt && s.pixelSize > 0 && device >= 2 ? 'pixelated' : 'auto';
    if (crt && (paintTarget.width !== width || paintTarget.height !== height)) {
      gl.bindTexture(gl.TEXTURE_2D, paintTarget.texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, paintTarget.framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        paintTarget.texture,
        0,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      paintTarget.width = width;
      paintTarget.height = height;
    }
    view.cssWidth = cssWidth;
    view.cssHeight = cssHeight;
    view.block = device / dpr;
    view.device = device;
    view.width = width;
    view.height = height;
    view.crt = crt;
    if (!fieldProgram) return;
    const fieldWidth = clamp(Math.ceil(cssWidth / FIELD_SCALE), 8, 320);
    const fieldHeight = clamp(Math.ceil(cssHeight / FIELD_SCALE), 8, 320);
    if (fieldWidth === field.width && fieldHeight === field.height) return;
    dropField();
    field.width = fieldWidth;
    field.height = fieldHeight;
    fieldTargets = [
      makeTarget(fieldWidth, fieldHeight),
      makeTarget(fieldWidth, fieldHeight),
    ];
  };

  const stir = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    pushX: number,
    pushY: number,
    decay: number,
  ) => {
    const read = fieldTargets[0];
    const write = fieldTargets[1];
    if (!fieldProgram || !read || !write) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
    gl.viewport(0, 0, field.width, field.height);
    gl.useProgram(fieldProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.texture);
    const uniforms = fieldProgram.uniforms;
    gl.uniform1i(u(uniforms, 'uPrev'), 0);
    gl.uniform2f(u(uniforms, 'uSize'), field.width, field.height);
    gl.uniform2f(u(uniforms, 'uCss'), view.cssWidth, view.cssHeight);
    gl.uniform2f(u(uniforms, 'uFrom'), fromX, fromY);
    gl.uniform2f(u(uniforms, 'uTo'), toX, toY);
    gl.uniform2f(u(uniforms, 'uPush'), pushX, pushY);
    gl.uniform1f(u(uniforms, 'uRadius'), STIR_RADIUS);
    gl.uniform1f(u(uniforms, 'uDecay'), decay);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    fieldTargets = [write, read];
  };

  const frame = (now: number) => {
    raf = 0;
    if (lost) return;
    const s = getSettings();
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    const pace = reduced ? 0.2 : 1;
    flow += dt * s.speed * 7 * pace;
    spin += dt * s.rotation * 0.2 * pace;
    if (opening < 1) opening = Math.min(1, opening + dt / 2.2);

    const tracking = s.mouse && pointer.inside;
    const steerTarget = tracking
      ? (pointer.x / view.cssWidth - 0.5) * 0.35 * s.strength
      : 0;
    steer.value += (steerTarget - steer.value) * (1 - Math.exp(-dt / 0.8));

    gl.bindVertexArray(vao);
    if (fieldProgram && fieldTargets.length) {
      const dx = pointer.x - pointer.lastX;
      const dy = pointer.y - pointer.lastY;
      const moved = tracking && pointer.ready && (dx !== 0 || dy !== 0);
      const decay = Math.exp(-dt / 1.6);
      if (moved || field.energy > 0.05) {
        const amount = 0.85 * s.strength * (reduced ? 0.4 : 1);
        const travel = moved ? Math.hypot(dx, dy) * amount : 0;
        const steps = Math.max(1, Math.ceil(travel / (STIR_RADIUS * 0.3)));
        for (let step = 0; step < steps; step++) {
          const a = step / steps;
          const b = (step + 1) / steps;
          stir(
            pointer.lastX + dx * a,
            pointer.lastY + dy * a,
            pointer.lastX + dx * b,
            pointer.lastY + dy * b,
            moved ? dx * (b - a) * amount : 0,
            moved ? dy * (b - a) * amount : 0,
            step === steps - 1 ? decay : 1,
          );
        }
        field.energy = field.energy * decay + travel;
        if (field.energy <= 0.05) {
          fieldTargets.forEach((target) => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
          });
        }
      }
    }
    pointer.lastX = pointer.x;
    pointer.lastY = pointer.y;

    for (let index = twirls.length - 1; index >= 0; index--) {
      const twirl = twirls[index];
      if (!twirl) continue;
      twirl.age += dt;
      if (twirl.age >= 3.2) twirls.splice(index, 1);
    }
    twirlData.fill(0);
    twirls.forEach((twirl, index) => {
      const t = twirl.age;
      const rise = smoother(t / 0.25);
      const fall = 1 - smoother((t - 0.25) / 2.95);
      twirlData[index * 4] = twirl.x;
      twirlData[index * 4 + 1] = twirl.y;
      twirlData[index * 4 + 2] = twirl.direction * 1.9 * rise * fall;
      twirlData[index * 4 + 3] = 150 * (1 + 0.6 * smoother(t / 3.2));
    });

    const eased = 1 - Math.pow(1 - opening, 3);
    const unwind = 1 - eased;
    const fieldTexture = fieldTargets[0]?.texture ?? null;
    gl.bindFramebuffer(
      gl.FRAMEBUFFER,
      view.crt ? paintTarget.framebuffer : null,
    );
    gl.viewport(0, 0, view.width, view.height);
    gl.useProgram(paintProgram.program);
    const p = paintProgram.uniforms;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
    gl.uniform1i(u(p, 'uField'), 0);
    gl.uniform1f(
      u(p, 'uFieldOn'),
      fieldTargets.length && field.energy > 0.05 ? 1 : 0,
    );
    gl.uniform2f(u(p, 'uCss'), view.cssWidth, view.cssHeight);
    gl.uniform2f(u(p, 'uCanvas'), view.width, view.height);
    gl.uniform1f(u(p, 'uBlock'), view.block);
    gl.uniform1f(u(p, 'uFlow'), flow);
    gl.uniform1f(
      u(p, 'uSpin'),
      -0.4 + spin + steer.value + 2.6 * unwind * unwind,
    );
    gl.uniform2f(u(p, 'uOffset'), s.offset[0], s.offset[1]);
    gl.uniform3f(u(p, 'uColor1'), s.color1[0], s.color1[1], s.color1[2]);
    gl.uniform3f(u(p, 'uColor2'), s.color2[0], s.color2[1], s.color2[2]);
    gl.uniform3f(u(p, 'uColor3'), s.color3[0], s.color3[1], s.color3[2]);
    gl.uniform1f(u(p, 'uContrast'), s.contrast);
    gl.uniform1f(u(p, 'uLighting'), s.lighting);
    gl.uniform1f(u(p, 'uSwirl'), Math.min(1, s.swirl + 0.55 * unwind));
    gl.uniform1f(u(p, 'uScale'), s.scale);
    gl.uniform1i(u(p, 'uDetail'), s.detail);
    gl.uniform4fv(u(p, 'uTwirls'), twirlData);
    gl.uniform1f(u(p, 'uReveal'), smoother(opening / 0.45));
    gl.uniform1f(u(p, 'uLight'), s.light ? 1 : 0);
    gl.uniform1f(u(p, 'uOpacity'), s.opacity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (view.crt) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(screenProgram.program);
      const v = screenProgram.uniforms;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, paintTarget.texture);
      gl.uniform1i(u(v, 'uPaint'), 0);
      gl.uniform2f(u(v, 'uCanvas'), canvas.width, canvas.height);
      gl.uniform2f(u(v, 'uSource'), view.width, view.height);
      gl.uniform1f(u(v, 'uDevice'), view.device);
      gl.uniform1f(u(v, 'uCrt'), s.crt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    const settling =
      Math.abs(steerTarget - steer.value) > 0.0005 ||
      field.energy > 0.05 ||
      twirls.length > 0;
    const busy = s.speed > 0 || s.rotation !== 0 || opening < 1 || settling;
    if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf || lost || !visible || !pageVisible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const locate = (event: BalatroPointer) => {
    const rect = container.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
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
      const spot = locate(event);
      if (!pointer.ready || !pointer.inside) {
        pointer.lastX = spot.x;
        pointer.lastY = spot.y;
      }
      pointer.vx = spot.x - pointer.x;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = spot.inside;
      pointer.ready = true;
      wake();
    },
    pointerDown(event) {
      const s = getSettings();
      const spot = locate(event);
      if (!spot.inside || !s.clickSwirl || reduced) return;
      twirls.push({
        x: spot.x,
        y: spot.y,
        age: 0,
        direction: pointer.vx < 0 ? 1 : -1,
      });
      if (twirls.length > MAX_TWIRLS) twirls.shift();
      wake();
    },
    pointerUp(event) {
      if (event.pointerType !== 'mouse') leave();
    },
    leave,
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
        dropField();
        gl.deleteTexture(paintTarget.texture);
        gl.deleteFramebuffer(paintTarget.framebuffer);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(paintProgram.program);
        gl.deleteProgram(screenProgram.program);
        if (fieldProgram) gl.deleteProgram(fieldProgram.program);
      }
    },
  };
}
