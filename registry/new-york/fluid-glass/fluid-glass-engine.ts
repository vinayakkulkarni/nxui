import {
  BASE,
  EXTENT,
  PIXEL_BUDGET,
  SHADOW_SIZE,
  SPIN,
  VIDEO,
  clamp,
  compile,
  driftAt,
  isShape,
  multiply,
  quaternion,
  slerp,
  smoother,
  toMatrix,
} from './fluid-glass-math';
import { CONTENT, VERTEX, fragmentFor } from './fluid-glass-shaders';
import type {
  FluidGlassEngine,
  FluidGlassEngineOptions,
  FluidGlassMat3,
  FluidGlassProgram,
  FluidGlassSettings,
  FluidGlassShape,
  FluidGlassUniforms,
} from './types';

type SpringKey = 'stretch' | 'tiltX' | 'tiltY' | 'scale';

const LIGHT = [-0.42, 0.55, 1] as const;

/**
 * Ray-marched glass renderer. Pointer, resize, visibility and theme events are wired by
 * the Vue component and forwarded here; this module owns the WebGL2 state and the rAF loop.
 */
export function createFluidGlassEngine(
  options: FluidGlassEngineOptions,
): FluidGlassEngine | null {
  const { container, canvas, handle, getSettings, reduced, onShapeChange } =
    options;
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
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const programs = new Map<string, FluidGlassProgram>();
  const view = { width: 1, height: 1, ratio: 1 };

  const request = (name: string): FluidGlassProgram => {
    const key =
      name === 'content' ? name : `${name}>${view.ratio < 1.75 ? 1 : 0}`;
    const existing = programs.get(key);
    if (existing) return existing;
    const [a, b, sampled] = key.split('>');
    const source =
      key === 'content'
        ? CONTENT
        : fragmentFor(
            isShape(a) ? a : 'torus',
            isShape(b) ? b : 'torus',
            sampled === '1',
          );
    const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
    const program = gl.createProgram();
    const entry: FluidGlassProgram = {
      program,
      fragment,
      uniforms: null,
      failed: !fragment || !vertex,
    };
    if (vertex && fragment) {
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
    }
    programs.set(key, entry);
    return entry;
  };

  const ready = (entry: FluidGlassProgram): boolean => {
    if (entry.failed) return false;
    if (entry.uniforms) return true;
    if (
      parallel &&
      !gl.getProgramParameter(entry.program, parallel.COMPLETION_STATUS_KHR)
    )
      return false;
    if (!gl.getProgramParameter(entry.program, gl.LINK_STATUS)) {
      const log = entry.fragment ? gl.getShaderInfoLog(entry.fragment) : null;
      console.error(log || gl.getProgramInfoLog(entry.program));
      entry.failed = true;
      return false;
    }
    const uniforms: FluidGlassUniforms = {};
    const count: number = gl.getProgramParameter(
      entry.program,
      gl.ACTIVE_UNIFORMS,
    );
    for (let index = 0; index < count; index++) {
      const info = gl.getActiveUniform(entry.program, index);
      if (info)
        uniforms[info.name] = gl.getUniformLocation(entry.program, info.name);
    }
    entry.uniforms = uniforms;
    return true;
  };

  const vao = gl.createVertexArray();
  const makeTexture = (): WebGLTexture => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(4),
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
  };
  const mediaTexture = makeTexture();
  const textTexture = makeTexture();
  const shadowMap = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, shadowMap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    SHADOW_SIZE,
    SHADOW_SIZE,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  const shadowTarget = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowTarget);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    shadowMap,
    0,
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const textCanvas = document.createElement('canvas');
  const media: {
    src: string | undefined;
    clip: HTMLVideoElement | null;
    image: HTMLImageElement | null;
    ready: boolean;
    width: number;
    height: number;
  } = {
    src: undefined,
    clip: null,
    image: null,
    ready: false,
    width: 1,
    height: 1,
  };
  const textState = { key: '', ready: false };

  const pointer = {
    x: 0,
    y: 0,
    inside: false,
    down: false,
    grabbed: false,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
  };
  const body = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    spin: 0,
    ripple: 0,
    dirX: 1,
    dirY: 0,
    anchorX: 0,
    anchorY: 0,
  };
  const spring: Record<SpringKey, number> = {
    stretch: 1,
    tiltX: 0,
    tiltY: 0,
    scale: 0,
  };
  const velocity: Record<SpringKey, number> = {
    stretch: 0,
    tiltX: 0,
    tiltY: 0,
    scale: 0,
  };
  let placed = false;
  let flying = false;
  const initial = getSettings();
  const morph: {
    from: FluidGlassShape;
    to: FluidGlassShape;
    t: number;
    pending: FluidGlassShape | null;
  } = { from: initial.shape, to: initial.shape, t: 1, pending: null };
  let requested = initial.shape;
  let presence = initial.intro && !reduced && options.firstRun ? 0 : 1;
  if (presence === 1) spring.scale = 1;
  let time = 0;
  let idleClock = Math.random() * 20;
  let raf = 0;
  let last = 0;
  let tick = 0;
  let pace = 1000 / 60;
  let skipped = 0;
  let calm = false;
  let visible = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let lost = false;
  let current: FluidGlassProgram | null = null;

  const drawText = () => {
    const s = getSettings();
    const computed = getComputedStyle(container);
    const family = s.fontFamily || computed.fontFamily || 'sans-serif';
    const fill = s.textColor || computed.color || '#ffffff';
    const width = canvas.width;
    const height = canvas.height;
    const key = [
      s.text,
      family,
      fill,
      s.fontWeight,
      s.fontSize,
      width,
      height,
    ].join('|');
    if (key === textState.key) return;
    textState.key = key;
    textCanvas.width = width;
    textCanvas.height = height;
    const ctx = textCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const lines = s.text.split('\n');
    if (s.text.trim()) {
      const font = (px: number) => `${s.fontWeight} ${px}px ${family}`;
      let px = s.fontSize ? s.fontSize * view.ratio : height * 0.36;
      if (!s.fontSize) {
        ctx.font = font(100);
        const widest = Math.max(
          ...lines.map((line) => ctx.measureText(line).width),
          1,
        );
        px = Math.min(
          (width * 0.84 * 100) / widest,
          (height * 0.64) / (lines.length * 1.02),
        );
      }
      ctx.font = font(px);
      ctx.fillStyle = fill;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${-0.03 * px}px`;
      const metrics = ctx.measureText('Hg');
      const ascent = metrics.actualBoundingBoxAscent || px * 0.72;
      const descent = metrics.actualBoundingBoxDescent || px * 0.2;
      const lineHeight = px * 1.02;
      const total = lineHeight * (lines.length - 1) + ascent + descent;
      let y = (height - total) / 2 + ascent;
      for (const line of lines) {
        ctx.fillText(line, width / 2, y);
        y += lineHeight;
      }
    }
    gl.bindTexture(gl.TEXTURE_2D, textTexture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      textCanvas,
    );
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    textState.ready = Boolean(s.text.trim());
  };

  const releaseClip = () => {
    if (!media.clip) return;
    media.clip.pause();
    media.clip.removeAttribute('src');
    media.clip.load();
    media.clip = null;
  };

  const loadMedia = () => {
    const s = getSettings();
    if (s.src === media.src) return;
    releaseClip();
    media.src = s.src;
    media.ready = false;
    media.image = null;
    if (!s.src) return;
    if (VIDEO.test(s.src)) {
      const clip = document.createElement('video');
      clip.crossOrigin = 'anonymous';
      clip.muted = true;
      clip.loop = true;
      clip.playsInline = true;
      clip.autoplay = true;
      clip.preload = 'auto';
      clip.src = s.src;
      clip.addEventListener('loadeddata', () => {
        if (media.clip !== clip) return;
        media.width = clip.videoWidth || 1;
        media.height = clip.videoHeight || 1;
        media.ready = true;
        wake();
      });
      clip.play().catch(() => {});
      media.clip = clip;
    } else {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        if (media.image !== image || lost) return;
        media.width = image.naturalWidth || 1;
        media.height = image.naturalHeight || 1;
        gl.bindTexture(gl.TEXTURE_2D, mediaTexture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image,
        );
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.generateMipmap(gl.TEXTURE_2D);
        media.ready = true;
        wake();
      };
      image.src = s.src;
      media.image = image;
    }
  };

  const radius = () => {
    const s = getSettings();
    return Math.min(s.size / 2, Math.min(view.width, view.height) * 0.36);
  };

  const resize = () => {
    const s = getSettings();
    const rect = container.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      s.maxRatio,
      Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight)),
    );
    const width = Math.max(1, Math.round(cssWidth * ratio));
    const height = Math.max(1, Math.round(cssHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    view.width = cssWidth;
    view.height = cssHeight;
    view.ratio = width / cssWidth;
    if (!placed) {
      body.x = s.position[0] * cssWidth;
      body.y = s.position[1] * cssHeight;
      body.anchorX = body.x;
      body.anchorY = body.y;
      placed = true;
    } else if (s.interaction === 'drag') {
      const edge = radius() * 1.08;
      body.anchorX = clamp(body.anchorX, edge, Math.max(edge, cssWidth - edge));
      body.anchorY = clamp(
        body.anchorY,
        edge,
        Math.max(edge, cssHeight - edge),
      );
    }
    drawText();
  };

  const bindContent = (u: FluidGlassUniforms, s: FluidGlassSettings) => {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mediaTexture);
    gl.uniform1i(u.uMedia ?? null, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textTexture);
    gl.uniform1i(u.uText ?? null, 1);
    gl.uniform2f(u.uView ?? null, view.width, view.height);
    gl.uniform1f(u.uRatio ?? null, view.ratio);
    let rect: [number, number, number, number] = [0, 0, 1, 1];
    if (media.ready) {
      const boxRatio = view.width / view.height;
      const mediaRatio = media.width / media.height;
      if (mediaRatio > boxRatio === (s.fit !== 'contain')) {
        const w = mediaRatio / boxRatio;
        rect = [(1 - w) / 2, 0, w, 1];
      } else {
        const h = boxRatio / mediaRatio;
        rect = [0, (1 - h) / 2, 1, h];
      }
    }
    gl.uniform4f(u.uMediaRect ?? null, rect[0], rect[1], rect[2], rect[3]);
    gl.uniform1f(u.uMediaOn ?? null, media.ready ? 1 : 0);
    gl.uniform1f(u.uTextOn ?? null, textState.ready ? 1 : 0);
    const bg = s.background;
    gl.uniform4f(
      u.uBackground ?? null,
      bg[0] * bg[3],
      bg[1] * bg[3],
      bg[2] * bg[3],
      bg[3],
    );
  };

  const settle = () => {
    const s = getSettings();
    const size = radius();
    const drift = s.idle && !reduced ? driftAt(idleClock, size) : [0, 0];
    const edge = size * 1.08;
    body.anchorX =
      clamp(body.x, edge, Math.max(edge, view.width - edge)) - (drift[0] ?? 0);
    body.anchorY =
      clamp(body.y, edge, Math.max(edge, view.height - edge)) - (drift[1] ?? 0);
  };

  const step = (
    key: SpringKey,
    target: number,
    omega: number,
    zeta: number,
    dt: number,
  ) => {
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let index = 0; index < steps; index++) {
      velocity[key] +=
        (omega * omega * (target - spring[key]) -
          2 * zeta * omega * velocity[key]) *
        h;
      spring[key] += velocity[key] * h;
    }
    const settled =
      Math.abs(target - spring[key]) < 0.0005 &&
      Math.abs(velocity[key]) < 0.002;
    if (settled) {
      spring[key] = target;
      velocity[key] = 0;
    }
    return !settled;
  };

  const frame = (now: number) => {
    raf = 0;
    if (lost) return;
    const gap = now - tick;
    tick = now;
    if (gap > 2 && gap < 100) pace += (gap - pace) * 0.1;
    if (calm && skipped < Math.round(12 / pace) - 1) {
      skipped += 1;
      if (visible && pageVisible) raf = requestAnimationFrame(frame);
      return;
    }
    skipped = 0;
    const s = getSettings();
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    time += dt;
    let busy = false;

    if (s.shape !== requested) {
      requested = s.shape;
      morph.pending = s.shape;
    }
    if (morph.pending && morph.t >= 1) {
      const entry = request(`${morph.to}>${morph.pending}`);
      if (ready(entry)) {
        request(`${morph.pending}>${morph.pending}`);
        morph.from = morph.to;
        morph.to = morph.pending;
        morph.pending = null;
        morph.t = 0;
        velocity.stretch -= 2.5 * s.wobble;
        if (morph.to !== morph.from) onShapeChange(morph.to);
      }
      busy = true;
    }
    if (morph.t < 1) {
      morph.t = Math.min(1, morph.t + dt / (reduced ? 0.35 : 0.85));
      busy = true;
    }
    if (s.morphOnClick && s.cycle.length > 1 && !morph.pending) {
      const index = s.cycle.indexOf(morph.to);
      const next = s.cycle[(index + 1) % s.cycle.length];
      if (next) request(`${morph.to}>${next}`);
    }

    const size = radius();
    if (!pointer.grabbed && s.interaction !== 'drag') {
      body.anchorX = s.position[0] * view.width;
      body.anchorY = s.position[1] * view.height;
    }
    const drifting = s.idle && !reduced;
    if (drifting && !pointer.grabbed) {
      idleClock += dt;
      busy = true;
    }
    const drift = drifting ? driftAt(idleClock, size) : [0, 0];
    let goalX = body.anchorX + (drift[0] ?? 0);
    let goalY = body.anchorY + (drift[1] ?? 0);
    if (s.interaction === 'follow' && pointer.inside) {
      goalX = pointer.x;
      goalY = pointer.y;
    }
    const omega =
      (pointer.grabbed ? 34 : 24) *
      Math.pow(0.18, s.smoothness) *
      (reduced ? 1.6 : 1);
    const substeps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / substeps;
    if (pointer.grabbed) {
      goalX = pointer.x - pointer.offsetX;
      goalY = pointer.y - pointer.offsetY;
      flying = false;
    }
    if (flying) {
      const edge = size * 1.08;
      for (let index = 0; index < substeps; index++) {
        body.x += body.vx * h;
        body.y += body.vy * h;
        const friction = Math.exp(-h * 1.4);
        body.vx *= friction;
        body.vy *= friction;
        if (body.x < edge || body.x > view.width - edge) {
          body.x = clamp(body.x, edge, Math.max(edge, view.width - edge));
          velocity.stretch -=
            Math.min(4, Math.abs(body.vx) * 0.0016) * s.wobble;
          body.vx *= -0.62;
        }
        if (body.y < edge || body.y > view.height - edge) {
          body.y = clamp(body.y, edge, Math.max(edge, view.height - edge));
          velocity.stretch -=
            Math.min(4, Math.abs(body.vy) * 0.0016) * s.wobble;
          body.vy *= -0.62;
        }
      }
      if (Math.hypot(body.vx, body.vy) < 30) {
        flying = false;
        settle();
      }
      busy = true;
    } else {
      for (let index = 0; index < substeps; index++) {
        body.vx +=
          (omega * omega * (goalX - body.x) - 2 * 0.86 * omega * body.vx) * h;
        body.vy +=
          (omega * omega * (goalY - body.y) - 2 * 0.86 * omega * body.vy) * h;
        body.x += body.vx * h;
        body.y += body.vy * h;
      }
      if (
        Math.abs(goalX - body.x) + Math.abs(goalY - body.y) > 0.05 ||
        Math.hypot(body.vx, body.vy) > 0.5
      )
        busy = true;
    }

    const speed = Math.hypot(body.vx, body.vy);
    if (speed > 1) {
      body.dirX = body.vx / speed;
      body.dirY = body.vy / speed;
    }
    const stretchTarget =
      1 + clamp(speed / 1800, 0, 0.55) * s.wobble * (reduced ? 0 : 1);
    busy = step('stretch', stretchTarget, 13, 0.32, dt) || busy;
    const tiltGain = reduced ? 0 : 0.00045;
    busy =
      step('tiltX', clamp(body.vy * tiltGain, -0.7, 0.7), 9, 0.5, dt) || busy;
    busy =
      step('tiltY', clamp(body.vx * tiltGain, -0.7, 0.7), 9, 0.5, dt) || busy;
    if (
      !reduced &&
      (morph.to === 'blob' || (morph.from === 'blob' && morph.t < 1))
    )
      busy = true;
    if (!reduced && s.spin) {
      body.spin += dt * s.spin;
      busy = true;
    }
    const key =
      morph.t < 1 ? `${morph.from}>${morph.to}` : `${morph.to}>${morph.to}`;
    const entry = request(key);
    if (ready(entry)) current = entry;
    else busy = true;
    if (current) {
      if (presence < 1) {
        presence = Math.min(1, presence + dt / 0.5);
        busy = true;
      }
      busy = step('scale', 1, 11, 0.52, dt) || busy;
    }
    body.ripple +=
      ((morph.t < 1 ? 0.05 * s.wobble * Math.sin(Math.PI * morph.t) : 0) -
        body.ripple) *
      (1 - Math.exp(-dt / 0.08));

    if (media.clip && media.ready && !media.clip.paused) {
      gl.bindTexture(gl.TEXTURE_2D, mediaTexture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        media.clip,
      );
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      busy = true;
    }

    if (!current?.uniforms) {
      const fallback = request('content');
      if (ready(fallback) && fallback.uniforms) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(fallback.program);
        gl.bindVertexArray(vao);
        bindContent(fallback.uniforms, s);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      if (visible && pageVisible) raf = requestAnimationFrame(frame);
      return;
    }

    const eased = smoother(morph.t);
    const extent =
      EXTENT[morph.from] + (EXTENT[morph.to] - EXTENT[morph.from]) * eased;
    const unit = size / extent;
    const scale = Math.max(0.001, spring.scale);
    const qa = quaternion(...BASE[morph.from]);
    const qb = quaternion(...BASE[morph.to]);
    let orientation = slerp(qa, qb, eased);
    const tumble =
      SPIN[morph.from][0] + (SPIN[morph.to][0] - SPIN[morph.from][0]) * eased;
    const sway =
      SPIN[morph.from][1] + (SPIN[morph.to][1] - SPIN[morph.from][1]) * eased;
    const angle = body.spin % (Math.PI * 2);
    const turnY = slerp([0, 0, 0, 1], quaternion(0, angle, 0), tumble);
    const turnZ = slerp([0, 0, 0, 1], quaternion(0, 0, angle), sway);
    orientation = multiply(
      multiply(
        quaternion(Math.sin(body.spin * 0.6) * 0.18 * tumble, 0, 0),
        turnY,
      ),
      orientation,
    );
    orientation = multiply(turnZ, orientation);
    orientation = multiply(
      quaternion(spring.tiltX, spring.tiltY, 0),
      orientation,
    );
    const r = toMatrix(orientation);
    const sx = Math.max(0.2, spring.stretch);
    const q = 1 / Math.sqrt(sx);
    const ux = body.dirX;
    const uy = -body.dirY;
    const inv: FluidGlassMat3 = [
      1 / q + (1 / sx - 1 / q) * ux * ux,
      (1 / sx - 1 / q) * ux * uy,
      0,
      (1 / sx - 1 / q) * ux * uy,
      1 / q + (1 / sx - 1 / q) * uy * uy,
      0,
      0,
      0,
      1 / q,
    ];
    const transposeR: FluidGlassMat3 = [
      r[0],
      r[3],
      r[6],
      r[1],
      r[4],
      r[7],
      r[2],
      r[5],
      r[8],
    ];
    const combined = new Float32Array(9);
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        let sum = 0;
        for (let k = 0; k < 3; k++)
          sum += (transposeR[k * 3 + row] ?? 0) * (inv[col * 3 + k] ?? 0);
        combined[col * 3 + row] = sum / (unit * scale);
      }
    }
    const minScale = Math.min(sx, q);
    const maxScale = Math.max(sx, q);
    const focal = Math.max(view.width, view.height) * 1.6;
    const height = unit * (0.35 + s.elevation);
    const worldY = view.height - body.y;
    const cx =
      view.width / 2 + (body.x - view.width / 2) * ((focal - height) / focal);
    const cy =
      view.height / 2 + (worldY - view.height / 2) * ((focal - height) / focal);

    if (handle) {
      const reach = size * scale * 2;
      handle.style.width = `${reach.toFixed(1)}px`;
      handle.style.height = `${reach.toFixed(1)}px`;
      handle.style.transform = `translate3d(${(body.x - reach / 2).toFixed(1)}px, ${(body.y - reach / 2).toFixed(1)}px, 0)`;
    }

    const u = current.uniforms;
    const at = (name: string) => u[name] ?? null;
    gl.useProgram(current.program);
    gl.bindVertexArray(vao);
    bindContent(u, s);
    gl.uniform1f(at('uFocal'), focal);
    gl.uniform3f(at('uCenter'), cx, cy, height);
    gl.uniformMatrix3fv(at('uInverse'), false, combined);
    gl.uniform1f(at('uScale'), unit * scale * minScale);
    const bound = size * scale * maxScale * 1.08 + 2;
    gl.uniform1f(at('uBound'), bound);
    gl.uniform1f(at('uMorph'), eased);
    gl.uniform1f(at('uRipple'), body.ripple);
    gl.uniform1f(at('uTime'), reduced ? 0 : time);
    gl.uniform1f(at('uIor'), s.ior);
    gl.uniform1f(at('uDispersion'), s.dispersion);
    gl.uniform1f(at('uReflection'), s.reflection);
    gl.uniform1f(at('uFrost'), s.frost);
    gl.uniform4f(at('uTint'), s.color[0], s.color[1], s.color[2], s.tint * 1.6);
    gl.uniform1f(at('uShadow'), s.shadow);
    const length = Math.hypot(...LIGHT);
    gl.uniform3f(
      at('uLight'),
      LIGHT[0] / length,
      LIGHT[1] / length,
      LIGHT[2] / length,
    );
    gl.uniform1f(at('uPresence'), presence);
    const footprint = bound * 1.6 * (SHADOW_SIZE / (SHADOW_SIZE - 6)) + 1;
    const footX = cx + (LIGHT[0] / LIGHT[2]) * height;
    const footY = cy + (LIGHT[1] / LIGHT[2]) * height;
    gl.uniform4f(
      at('uShadowBox'),
      footX - footprint,
      footY - footprint,
      footprint * 2,
      footprint * 2,
    );
    gl.uniform2f(at('uShadowSize'), SHADOW_SIZE, SHADOW_SIZE);
    gl.uniform1i(at('uShadowMap'), 2);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (s.shadow > 0) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, shadowTarget);
      gl.viewport(0, 0, SHADOW_SIZE, SHADOW_SIZE);
      gl.uniform1f(at('uPass'), 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, shadowMap);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(at('uPass'), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    calm =
      !pointer.grabbed &&
      !flying &&
      morph.t >= 1 &&
      !morph.pending &&
      presence >= 1 &&
      Math.abs(s.spin) <= 1 &&
      Math.hypot(body.vx, body.vy) < 120 &&
      Math.abs(velocity.stretch) +
        Math.abs(velocity.tiltX) +
        Math.abs(velocity.tiltY) +
        Math.abs(velocity.scale) <
        0.05;
    if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
  };

  function wake() {
    if (raf || lost || !visible || !pageVisible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const locate = (event: PointerEvent) => {
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

  const playback = () => {
    if (!media.clip) return;
    if (visible && pageVisible) media.clip.play().catch(() => {});
    else media.clip.pause();
  };

  resize();
  request('content');
  request(`${initial.shape}>${initial.shape}`);
  loadMedia();
  wake();

  return {
    refresh() {
      calm = false;
      loadMedia();
      resize();
      wake();
    },
    redrawText() {
      drawText();
      wake();
    },
    resetText() {
      textState.key = '';
      drawText();
      wake();
    },
    setVisible(value) {
      visible = value;
      playback();
      wake();
    },
    setPageVisible(value) {
      pageVisible = value;
      playback();
      wake();
    },
    pointerMove(event) {
      const spot = locate(event);
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = spot.inside;
      if (spot.inside || pointer.grabbed) calm = false;
      wake();
    },
    pointerDown(event) {
      const s = getSettings();
      const spot = locate(event);
      if (!spot.inside) return;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = true;
      pointer.down = true;
      const near =
        Math.hypot(spot.x - body.x, spot.y - body.y) < radius() * 1.1;
      if (s.interaction === 'drag' && near) {
        pointer.grabbed = true;
        container.setAttribute('data-grabbing', '');
        flying = false;
        pointer.offsetX = spot.x - body.x;
        pointer.offsetY = spot.y - body.y;
      }
      pointer.startX = spot.x;
      pointer.startY = spot.y;
      calm = false;
      wake();
    },
    pointerUp(event) {
      const s = getSettings();
      if (!pointer.down) return;
      pointer.down = false;
      const spot = locate(event);
      const moved =
        Math.hypot(spot.x - pointer.startX, spot.y - pointer.startY) > 6;
      const near =
        Math.hypot(spot.x - body.x, spot.y - body.y) < radius() * 1.1;
      if (pointer.grabbed) {
        pointer.grabbed = false;
        container.removeAttribute('data-grabbing');
        flying = Math.hypot(body.vx, body.vy) > 60;
        if (!flying) settle();
      }
      if (!moved && near && spot.inside) {
        velocity.stretch -= 3 * s.wobble;
        if (s.morphOnClick && s.cycle.length > 1) {
          const index = s.cycle.indexOf(morph.pending || morph.to);
          morph.pending = s.cycle[(index + 1) % s.cycle.length] ?? null;
        }
      }
      if (event.pointerType !== 'mouse') pointer.inside = false;
      calm = false;
      wake();
    },
    leave() {
      calm = false;
      pointer.inside = false;
      pointer.down = false;
      if (pointer.grabbed) {
        pointer.grabbed = false;
        container.removeAttribute('data-grabbing');
        settle();
      }
      wake();
    },
    destroy() {
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
      releaseClip();
      if (gl.isContextLost()) return;
      programs.forEach((entry) => {
        gl.deleteProgram(entry.program);
        gl.deleteShader(entry.fragment);
      });
      gl.deleteShader(vertex);
      gl.deleteTexture(mediaTexture);
      gl.deleteTexture(textTexture);
      gl.deleteTexture(shadowMap);
      gl.deleteFramebuffer(shadowTarget);
      gl.deleteVertexArray(vao);
    },
  };
}
