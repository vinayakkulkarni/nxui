import type {
  Brush,
  Burst,
  HalftoneRevealEngine,
  HalftoneRevealProps,
  HalftoneRevealSettings,
  HalftoneState,
  MaskTarget,
  Pointer,
  Rgb,
} from './types';
import {
  BURST_SECONDS,
  INTRO_SECONDS,
  MASK,
  MASK_SCALE,
  MAX_BURSTS,
  MODES,
  SHAPES,
  VERTEX,
  VIEW,
  clamp,
  wanderAt,
} from './shaders';

export const DEFAULT_SRC =
  'https://images.unsplash.com/photo-1693250707557-a846a014b321?q=80&w=1400&auto=format&fit=crop';

const MASK_UNIFORMS = [
  'uPrevious',
  'uTexture',
  'uView',
  'uFrom',
  'uTo',
  'uRadius',
  'uSoftness',
  'uStrength',
  'uFade',
] as const;

const VIEW_UNIFORMS = [
  'uImage',
  'uMask',
  'uResolution',
  'uView',
  'uDpr',
  'uFrame',
  'uTexels',
  'uMode',
  'uShape',
  'uCell',
  'uAngle',
  'uScale',
  'uInk',
  'uAccent',
  'uPaper',
  'uContrast',
  'uBrightness',
  'uInvert',
  'uRough',
  'uShift',
  'uMatte',
  'uKey',
  'uReverse',
  'uIntro',
  'uBursts',
  'uBurstWidth',
] as const;

export function buildSettings(
  props: HalftoneRevealProps,
): HalftoneRevealSettings {
  return {
    fit: props.fit ?? 'cover',
    mode: MODES[props.mode ?? 'mono'] ?? 0,
    shape: SHAPES[props.shape ?? 'dot'] ?? 0,
    cellSize: clamp(props.cellSize ?? 6, 2, 80),
    angle: props.angle ?? 45,
    dotScale: clamp(props.dotScale ?? 1, 0.2, 2),
    inkColor: String(props.inkColor ?? '#120f17'),
    accentColor: String(props.accentColor ?? '#ff4f2a'),
    paperColor: String(props.paperColor ?? '#ffffff'),
    contrast: props.contrast ?? 1.1,
    brightness: props.brightness ?? 0,
    invert: props.invert ?? false,
    roughness: clamp(props.roughness ?? 0, 0, 1),
    misregistration: clamp(props.misregistration ?? 0, 0, 1),
    revealRadius: Math.max(0, props.revealRadius ?? 160),
    softness: clamp(props.softness ?? 0.6, 0, 1),
    linger: Math.max(0, props.linger ?? 1.2),
    reverse: props.reverse ?? false,
    wander: props.wander ?? false,
    clickBurst: props.clickBurst ?? true,
    intro: props.intro ?? true,
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

function link(gl: WebGL2RenderingContext, fragmentSource: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

function locate<K extends string>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: readonly K[],
) {
  const result = new Map<K, WebGLUniformLocation | null>();
  for (const name of names)
    result.set(name, gl.getUniformLocation(program, name));
  return (name: K) => result.get(name) ?? null;
}

function measureEdge(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
): { matte: Rgb; plain: boolean } {
  const size = 32;
  context.canvas.width = size;
  context.canvas.height = size;
  context.clearRect(0, 0, size, size);
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  const sum: Rgb = [0, 0, 0];
  const squares: Rgb = [0, 0, 0];
  let count = 0;
  let clear = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (x > 0 && y > 0 && x < size - 1 && y < size - 1) continue;
      const i = (y * size + x) * 4;
      if ((data[i + 3] ?? 0) < 250) clear += 1;
      for (let c = 0; c < 3; c += 1) {
        const v = (data[i + c] ?? 0) / 255;
        sum[c] = (sum[c] ?? 0) + v;
        squares[c] = (squares[c] ?? 0) + v * v;
      }
      count += 1;
    }
  }
  const matte: Rgb = [sum[0] / count, sum[1] / count, sum[2] / count];
  const spread =
    matte.reduce(
      (total, mean, c) =>
        total + Math.sqrt(Math.max(0, (squares[c] ?? 0) / count - mean * mean)),
      0,
    ) / 3;
  return { matte, plain: clear < count * 0.5 && spread < 0.06 };
}

/**
 * Creates the two-pass WebGL2 renderer: a ping-pong mask that records the
 * cursor trail, and a view pass that prints the image as a halftone screen and
 * swells the dots into the real photo wherever the mask is lit.
 */
export function createHalftoneReveal(
  canvas: HTMLCanvasElement,
  src: string,
  getSettings: () => HalftoneRevealSettings,
  getReduceMotion: () => boolean,
): HalftoneRevealEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const maskProgram = link(gl, MASK);
  const viewProgram = link(gl, VIEW);
  if (!maskProgram || !viewProgram) return null;
  const maskUniforms = locate(gl, maskProgram, MASK_UNIFORMS);
  const viewUniforms = locate(gl, viewProgram, VIEW_UNIFORMS);

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const floatMask = !!gl.getExtension('EXT_color_buffer_float');
  const imageTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, imageTexture);
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
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const createMask = (width: number, height: number): MaskTarget => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (floatMask) {
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
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer, width, height };
  };

  const destroyMask = (target: MaskTarget) => {
    gl.deleteFramebuffer(target.framebuffer);
    gl.deleteTexture(target.texture);
  };

  // `read` holds the latest trail, `write` receives the next one; they swap every frame.
  let read = createMask(2, 2);
  let write = createMask(2, 2);

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, Rgb>();
  const bursts: Burst[] = [];
  const burstData = new Float32Array(MAX_BURSTS * 4);
  const pointer: Pointer = {
    x: 0,
    y: 0,
    inside: false,
    fresh: true,
    placed: false,
  };
  const brush: Brush = { x: 0, y: 0, px: 0, py: 0 };
  const state: HalftoneState = {
    width: 1,
    height: 1,
    dpr: 1,
    image: null,
    matte: [0, 0, 0],
    key: 0,
    introStart: 0,
    presence: 0,
    drift: 0,
    trailUntil: 0,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = true;

  const toRgb = (value: string): Rgb => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb: Rgb = [0, 0, 0];
    if (probe && value) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
      probe.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
      rgb = [r / 255, g / 255, b / 255];
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const frameRect = (
    s: HalftoneRevealSettings,
  ): [number, number, number, number] => {
    const { image, width, height } = state;
    if (!image) return [0, 0, width, height];
    const sx = width / image.naturalWidth;
    const sy = height / image.naturalHeight;
    const scale = s.fit === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    return [(width - w) / 2, (height - h) / 2, w, h];
  };

  const drawMask = (s: HalftoneRevealSettings, dt: number) => {
    const minimum = floatMask ? 0 : 1.5 / 255;
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
    gl.viewport(0, 0, write.width, write.height);
    gl.useProgram(maskProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.texture);
    gl.uniform1i(maskUniforms('uPrevious'), 0);
    gl.uniform2f(maskUniforms('uTexture'), write.width, write.height);
    gl.uniform2f(maskUniforms('uView'), state.width, state.height);
    gl.uniform2f(maskUniforms('uFrom'), brush.px, brush.py);
    gl.uniform2f(maskUniforms('uTo'), brush.x, brush.y);
    gl.uniform1f(
      maskUniforms('uRadius'),
      s.revealRadius * (0.45 + 0.55 * state.presence),
    );
    gl.uniform1f(maskUniforms('uSoftness'), s.softness);
    gl.uniform1f(maskUniforms('uStrength'), state.presence);
    gl.uniform1f(
      maskUniforms('uFade'),
      Math.max(s.linger > 0 ? dt / s.linger : 1, minimum),
    );
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const swap = read;
    read = write;
    write = swap;
  };

  const drawView = (s: HalftoneRevealSettings, now: number) => {
    const [fx, fy, fw, fh] = frameRect(s);
    const image = state.image;
    let intro = 0;
    if (image) {
      intro =
        !s.intro || getReduceMotion()
          ? 1
          : Math.min(1, (now - state.introStart) / 1000 / INTRO_SECONDS);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(viewProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(viewUniforms('uImage'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, read.texture);
    gl.uniform1i(viewUniforms('uMask'), 1);
    gl.uniform2f(viewUniforms('uResolution'), canvas.width, canvas.height);
    gl.uniform2f(viewUniforms('uView'), state.width, state.height);
    gl.uniform1f(viewUniforms('uDpr'), canvas.width / state.width);
    gl.uniform4f(viewUniforms('uFrame'), fx, fy, fw, fh);
    gl.uniform1f(viewUniforms('uTexels'), image ? image.naturalWidth / fw : 1);
    gl.uniform1f(viewUniforms('uMode'), s.mode);
    gl.uniform1f(viewUniforms('uShape'), s.shape);
    gl.uniform1f(viewUniforms('uCell'), s.cellSize);
    gl.uniform1f(viewUniforms('uAngle'), (s.angle * Math.PI) / 180);
    gl.uniform1f(viewUniforms('uScale'), s.dotScale);
    gl.uniform3fv(viewUniforms('uInk'), toRgb(s.inkColor));
    gl.uniform3fv(viewUniforms('uAccent'), toRgb(s.accentColor));
    gl.uniform3fv(viewUniforms('uPaper'), toRgb(s.paperColor));
    gl.uniform1f(viewUniforms('uContrast'), s.contrast);
    gl.uniform1f(viewUniforms('uBrightness'), s.brightness);
    gl.uniform1f(viewUniforms('uInvert'), s.invert ? 1 : 0);
    gl.uniform1f(viewUniforms('uRough'), s.roughness);
    gl.uniform1f(viewUniforms('uShift'), s.misregistration * s.cellSize * 0.35);
    gl.uniform3fv(viewUniforms('uMatte'), state.matte);
    gl.uniform1f(viewUniforms('uKey'), state.key);
    gl.uniform1f(viewUniforms('uReverse'), s.reverse ? 1 : 0);
    gl.uniform1f(viewUniforms('uIntro'), 1 - (1 - intro) * (1 - intro));
    gl.uniform4fv(viewUniforms('uBursts'), burstData);
    gl.uniform1f(
      viewUniforms('uBurstWidth'),
      Math.max(60, s.revealRadius * 0.9),
    );
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    return intro;
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive || !visible) return;
    const s = getSettings();
    const reduce = getReduceMotion();
    const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 1 / 60;
    last = now;

    const wandering = s.wander && !reduce;
    let targetX = pointer.x;
    let targetY = pointer.y;
    if (!pointer.inside && wandering) {
      state.drift = Math.min(1, state.drift + dt / 1.2);
      const [wx, wy] = wanderAt(now / 1000, state.width, state.height);
      const k = state.drift * state.drift * (3 - 2 * state.drift);
      targetX += (wx - targetX) * k;
      targetY += (wy - targetY) * k;
    } else {
      state.drift = 0;
    }
    const engaged = pointer.inside || wandering;
    state.presence +=
      ((engaged ? 1 : 0) - state.presence) * (1 - Math.exp(-dt / 0.16));
    if (pointer.fresh) {
      brush.x = targetX;
      brush.px = targetX;
      brush.y = targetY;
      brush.py = targetY;
      pointer.fresh = false;
    } else {
      const follow = 1 - Math.exp(-dt / 0.035);
      brush.x += (targetX - brush.x) * follow;
      brush.y += (targetY - brush.y) * follow;
    }

    burstData.fill(0);
    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      const b = bursts[i];
      if (b && (now - b.start) / 1000 >= BURST_SECONDS) bursts.splice(i, 1);
    }
    bursts.forEach((b, i) => {
      const k = Math.max(0, (now - b.start) / 1000 / BURST_SECONDS);
      const reach =
        Math.hypot(
          Math.max(b.x, state.width - b.x),
          Math.max(b.y, state.height - b.y),
        ) + 80;
      burstData[i * 4] = b.x;
      burstData[i * 4 + 1] = b.y;
      burstData[i * 4 + 2] = reach * Math.sin((k * Math.PI) / 2);
      burstData[i * 4 + 3] = 1 - k * k * k;
    });

    if (state.presence > 0.002) state.trailUntil = now + s.linger * 1000 + 200;
    drawMask(s, dt);
    brush.px = brush.x;
    brush.py = brush.y;
    const intro = drawView(s, now);

    const busy =
      engaged ||
      state.presence > 0.002 ||
      bursts.length > 0 ||
      now < state.trailUntil ||
      (state.image !== null && intro < 1);
    if (busy) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!raf && alive && visible) raf = requestAnimationFrame(frame);
  };

  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.addEventListener('load', () => {
    if (!alive) return;
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    const sampler = document
      .createElement('canvas')
      .getContext('2d', { willReadFrequently: true });
    if (sampler) {
      try {
        const edge = measureEdge(sampler, image);
        state.matte = edge.matte;
        state.key = edge.plain ? 1 : 0;
      } catch {
        state.key = 0;
      }
    }
    state.image = image;
    state.introStart = performance.now();
    wake();
  });
  image.src = src;

  const pointerMove = (x: number, y: number) => {
    pointer.x = x;
    pointer.y = y;
    pointer.placed = true;
    if (!pointer.inside) {
      pointer.inside = true;
      pointer.fresh = true;
    }
    wake();
  };

  return {
    resize(width, height) {
      const w = Math.max(1, width);
      const h = Math.max(1, height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.width = w;
      state.height = h;
      state.dpr = dpr;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      const mw = Math.max(2, Math.round(w * MASK_SCALE));
      const mh = Math.max(2, Math.round(h * MASK_SCALE));
      if (mw !== read.width || mh !== read.height) {
        destroyMask(read);
        destroyMask(write);
        read = createMask(mw, mh);
        write = createMask(mw, mh);
      }
      if (!pointer.placed) {
        pointer.x = w / 2;
        pointer.y = h / 2;
      }
      wake();
    },
    pointerMove,
    pointerLeave() {
      pointer.inside = false;
      wake();
    },
    pointerDown(x, y, primary) {
      pointerMove(x, y);
      if (!getSettings().clickBurst || !primary) return;
      bursts.push({ x: pointer.x, y: pointer.y, start: performance.now() });
      if (bursts.length > MAX_BURSTS) bursts.shift();
    },
    setVisible(next) {
      visible = next;
      if (visible) {
        last = 0;
        wake();
      }
    },
    refresh() {
      if (!raf && alive && visible) {
        drawView(getSettings(), performance.now());
        wake();
      }
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      raf = 0;
      destroyMask(read);
      destroyMask(write);
      gl.deleteTexture(imageTexture);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(maskProgram);
      gl.deleteProgram(viewProgram);
    },
  };
}
