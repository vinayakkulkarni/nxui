import type {
  SlicedWavesBar,
  SlicedWavesRenderer,
  SlicedWavesRgb,
  SlicedWavesSettings,
  SlicedWavesView,
} from './types';
import {
  BAR_FRAGMENT,
  BAR_VERTEX,
  COMPOSITE,
  DISTANCE,
  FOCAL,
  INTRO_SECONDS,
  MAX_RENDER_DIM,
  QUAD_VERTEX,
  TAU,
  clamp,
  link,
  locate,
  noise,
} from './sliced-waves-gl';

const WHITE: SlicedWavesRgb = [1, 1, 1];

export function createSlicedWavesRenderer(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => SlicedWavesSettings,
  isReduced: () => boolean,
): SlicedWavesRenderer | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const floatTarget = !!gl.getExtension('EXT_color_buffer_float');
  const lightScale = floatTarget ? 1 : 0.25;
  const barProgram = link(gl, BAR_VERTEX, BAR_FRAGMENT, [
    'aCorner',
    'aShape',
    'aTop',
    'aBottom',
  ]);
  const compositeProgram = link(gl, QUAD_VERTEX, COMPOSITE, ['aCorner']);
  if (!barProgram || !compositeProgram) return null;
  const bar = locate(gl, barProgram, [
    'uView',
    'uAngle',
    'uGlow',
    'uSlices',
    'uBase',
    'uHalfBar',
    'uScale',
  ]);
  const composite = locate(gl, compositeProgram, [
    'uLight',
    'uResolution',
    'uScale',
    'uExposure',
    'uGrain',
    'uTime',
    'uFade',
    'uOpacity',
    'uLightMode',
  ]);

  const cornerBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const instanceBuffer = gl.createBuffer();
  const barVao = gl.createVertexArray();
  gl.bindVertexArray(barVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  for (let attribute = 1; attribute <= 3; attribute++) {
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(
      attribute,
      4,
      gl.FLOAT,
      false,
      48,
      (attribute - 1) * 16,
    );
    gl.vertexAttribDivisor(attribute, 1);
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
  gl.bindVertexArray(null);

  const lightTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, lightTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const framebuffer = gl.createFramebuffer();

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, SlicedWavesRgb>();
  let instances = new Float32Array(0);
  const pointer = { x: 0, y: 0, inside: false };
  const state = {
    width: 1,
    height: 1,
    targetWidth: 0,
    targetHeight: 0,
    time: 0,
    intro: getSettings().intro && !isReduced() ? 0 : 1,
    focus: DISTANCE,
    focusVelocity: 0,
    lift: 0,
    liftX: 0,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = true;

  const toLinear = (value: string): SlicedWavesRgb => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb = WHITE;
    if (probe && value) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [
        Math.pow((data[0] ?? 255) / 255, 2.2),
        Math.pow((data[1] ?? 255) / 255, 2.2),
        Math.pow((data[2] ?? 255) / 255, 2.2),
      ];
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const writePalette = (
    palette: SlicedWavesRgb[],
    x: number,
    offset: number,
  ) => {
    const n = palette.length;
    const f = ((x % n) + n) % n;
    const i = Math.floor(f);
    let m = f - i;
    m = m * m * (3 - 2 * m);
    const a = palette[i] ?? WHITE;
    const b = palette[(i + 1) % n] ?? WHITE;
    for (let c = 0; c < 3; c++)
      instances[offset + c] = a[c]! + (b[c]! - a[c]!) * m;
  };

  const ensureTarget = () => {
    if (
      state.targetWidth === canvas.width &&
      state.targetHeight === canvas.height
    )
      return;
    state.targetWidth = canvas.width;
    state.targetHeight = canvas.height;
    gl.bindTexture(gl.TEXTURE_2D, lightTexture);
    if (floatTarget) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA16F,
        canvas.width,
        canvas.height,
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
        canvas.width,
        canvas.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      lightTexture,
      0,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const layout = (s: SlicedWavesSettings): SlicedWavesView => {
    const w = state.width;
    const h = state.height;
    const F = h * FOCAL;
    const centerScale = F / DISTANCE;
    const pitch = s.spacing / centerScale;
    const halfBar = pitch * s.barWidth * 0.5;
    const yaw = s.perspective * 0.66;
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const bend = s.curve * 0.6;
    const angle = (s.rotation * Math.PI) / 180;
    const span =
      Math.abs(Math.cos(angle)) * w * 0.5 + Math.abs(Math.sin(angle)) * h * 0.5;
    const reach = Math.ceil(((Math.max(w, h) / F) * DISTANCE * 2.4) / pitch);
    const bars: SlicedWavesBar[] = [];
    for (let i = -reach; i <= reach; i++) {
      const x = i * pitch;
      const local = bend * Math.sin(x * 0.9 + 0.8);
      const X = x * cosYaw - local * sinYaw;
      const Z = x * sinYaw + local * cosYaw + DISTANCE;
      if (Z < 0.45) continue;
      const scale = F / Z;
      const sx = w * 0.5 + X * scale;
      if (Math.abs(sx - w * 0.5) > span + halfBar * scale + 80) continue;
      bars.push({ i, x, Z, sx, scale });
    }
    return { bars, halfBar, centerScale };
  };

  const build = (s: SlicedWavesSettings, view: SlicedWavesView) => {
    const w = state.width;
    const h = state.height;
    const { bars, halfBar, centerScale } = view;
    const palette = [s.color1, s.color2, s.color3].map(toLinear);
    const t = state.time;
    const thickness = (s.ribbonHeight * h * 0.5) / centerScale;
    const separation = (s.spread * h) / centerScale;
    const amplitude = (s.amplitude * h) / centerScale;
    const frequency = 0.22 * s.frequency;
    const base = h * s.position;
    const focus = state.focus;
    const blurScale = s.blur * 16;
    const sweep = 1.6 + 0.04 * (s.ribbons - 1);
    const needed = bars.length * s.ribbons * 12;
    if (needed > instances.length) instances = new Float32Array(needed + 1200);
    let count = 0;
    for (const b of bars) {
      const hw = halfBar * b.scale;
      const across = b.sx / Math.max(w, 1);
      const lift =
        state.lift *
        Math.exp(-Math.pow((b.sx - state.liftX) / Math.max(w * 0.12, 60), 2));
      const blurPx =
        (0.5 + s.blur * 0.6 + blurScale * Math.abs(focus / b.Z - 1)) *
        (s.lightMode ? 0.55 : 1);
      for (let r = 0; r < s.ribbons; r++) {
        const offset = (r - (s.ribbons - 1) / 2) * separation;
        const wave =
          0.62 * Math.sin(TAU * frequency * b.x - t * 1.6 + r * 2.1) +
          0.38 * Math.sin(TAU * frequency * 1.9 * b.x + t * 2.25 + r * 1.3);
        const yc = offset + wave * amplitude;
        const swell =
          0.5 + 0.5 * Math.sin(TAU * frequency * 0.7 * b.x + t * 1.1 + r * 2.7);
        const grow = clamp(
          (state.intro * sweep - across - r * 0.04) / 0.6,
          0,
          1,
        );
        const eased = grow * grow * (3 - 2 * grow);
        const th = thickness * (0.6 + 0.4 * swell) * eased;
        const hh = th * b.scale;
        if (hh < 0.4) continue;
        const tone = r * 1.15 + b.x * 0.3 + t * 0.12;
        const o = count * 12;
        instances[o] = b.sx;
        instances[o + 1] = base - yc * b.scale;
        instances[o + 2] = hw;
        instances[o + 3] = hh;
        writePalette(palette, tone - 0.22, o + 4);
        instances[o + 7] = blurPx;
        writePalette(palette, tone + 0.22, o + 8);
        instances[o + 11] =
          (0.75 + 0.25 * noise(b.i * 0.9 + r * 7.7 - t * 1.2)) *
          (1 + lift * 0.6) *
          (0.4 + 0.6 * eased);
        count++;
      }
    }
    return { count, halfBar, base };
  };

  const render = (
    s: SlicedWavesSettings,
    view: SlicedWavesView = layout(s),
  ) => {
    ensureTarget();
    const { count, halfBar, base } = build(s, view);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (count > 0) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(barProgram);
      gl.uniform2f(bar('uView'), state.width, state.height);
      gl.uniform1f(bar('uAngle'), (s.rotation * Math.PI) / 180);
      gl.uniform1f(bar('uGlow'), s.lightMode ? s.glow * 0.4 : s.glow);
      gl.uniform1f(bar('uSlices'), s.slices);
      gl.uniform1f(bar('uBase'), base);
      gl.uniform1f(bar('uHalfBar'), halfBar);
      gl.uniform1f(bar('uScale'), lightScale);
      gl.bindVertexArray(barVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        instances.subarray(0, count * 12),
        gl.DYNAMIC_DRAW,
      );
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      gl.disable(gl.BLEND);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(compositeProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lightTexture);
    gl.uniform1i(composite('uLight'), 0);
    gl.uniform2f(composite('uResolution'), canvas.width, canvas.height);
    gl.uniform1f(composite('uScale'), lightScale);
    gl.uniform1f(composite('uExposure'), 1.6 * s.brightness);
    gl.uniform1f(composite('uGrain'), s.grain);
    gl.uniform1f(composite('uTime'), state.time % 1000);
    gl.uniform1f(composite('uFade'), s.fade);
    gl.uniform1f(composite('uOpacity'), s.opacity);
    gl.uniform1f(composite('uLightMode'), s.lightMode ? 1 : 0);
    gl.bindVertexArray(quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  const focusTarget = (view: SlicedWavesView, x: number) => {
    let best: SlicedWavesBar | null = null;
    for (const b of view.bars) {
      if (!best || Math.abs(b.sx - x) < Math.abs(best.sx - x)) best = b;
    }
    return best ? best.Z : DISTANCE;
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive || !visible || document.hidden) return;
    const s = getSettings();
    const reduce = isReduced();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !reduce;
    if (moving) state.time += dt * s.speed;
    if (!s.intro || reduce) state.intro = 1;
    else if (state.intro < 1)
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

    const engaged = s.mouseInteraction && pointer.inside && !reduce;
    const angle = (s.rotation * Math.PI) / 180;
    const localX =
      Math.cos(angle) * (pointer.x - state.width * 0.5) +
      Math.sin(angle) * (pointer.y - state.height * 0.5) +
      state.width * 0.5;
    const view = layout(s);
    const target = engaged ? focusTarget(view, localX) : DISTANCE;
    state.focusVelocity +=
      (36 * (target - state.focus) - 11 * state.focusVelocity) * dt;
    state.focus += state.focusVelocity * dt;
    state.lift +=
      ((engaged ? 1 : 0) - state.lift) *
      (1 - Math.exp(-dt / (engaged ? 0.25 : 0.6)));
    state.liftX += (localX - state.liftX) * (1 - Math.exp(-dt / 0.12));

    render(s, view);
    const settling =
      state.intro < 1 ||
      Math.abs(target - state.focus) > 0.001 ||
      Math.abs(state.focusVelocity) > 0.001 ||
      state.lift > 0.002 ||
      engaged;
    if (moving || settling) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!raf && alive && visible && !document.hidden)
      raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const base = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    const longest = Math.max(width, height) * base;
    const ratio =
      longest > MAX_RENDER_DIM ? (base * MAX_RENDER_DIM) / longest : base;
    state.width = width;
    state.height = height;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    if (!raf) render(s);
    wake();
  };

  resize();

  return {
    refresh: () => {
      if (!raf) render(getSettings());
      wake();
    },
    resize,
    pointerMove: (event: PointerEvent) => {
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
    pointerLeave: () => {
      pointer.inside = false;
      wake();
    },
    visibilityChange: () => {
      last = 0;
      wake();
    },
    setVisible: (next: boolean) => {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    dispose: () => {
      alive = false;
      cancelAnimationFrame(raf);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(lightTexture);
      gl.deleteBuffer(cornerBuffer);
      gl.deleteBuffer(instanceBuffer);
      gl.deleteBuffer(quadBuffer);
      gl.deleteVertexArray(barVao);
      gl.deleteVertexArray(quadVao);
      gl.deleteProgram(barProgram);
      gl.deleteProgram(compositeProgram);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
