import {
  BLUR_SHADER,
  COMPOSITE_SHADER,
  SHAPE_SHADER,
  VERTEX_SHADER,
} from './shape-blur-shaders';
import { FIELD, PAD, buildField } from './shape-blur-field';
import type { ShapeBlurRenderer, ShapeBlurSettings } from './types';

type ImageState = 'none' | 'loading' | 'ready' | 'failed';

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
  vertex: WebGLShader,
  source: string,
): WebGLProgram | null {
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
  const program = gl.createProgram();
  if (!fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

function locate<K extends string>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: readonly K[],
): (name: K) => WebGLUniformLocation | null {
  const map = new Map<K, WebGLUniformLocation | null>();
  for (const name of names) map.set(name, gl.getUniformLocation(program, name));
  return (name) => map.get(name) ?? null;
}

const SHAPE_UNIFORMS = [
  'uResolution',
  'uDpr',
  'uShape',
  'uSides',
  'uHalf',
  'uRadius',
  'uRound',
  'uFieldTexture',
  'uField',
  'uThickness',
  'uFill',
  'uEchoes',
  'uSpacing',
  'uAngle',
] as const;

const BLUR_UNIFORMS = ['uSource', 'uLod', 'uStep', 'uScale'] as const;

const COMPOSITE_UNIFORMS = [
  'uPyramid',
  'uMaxLod',
  'uResolution',
  'uDpr',
  'uThickness',
  'uFill',
  'uEchoes',
  'uSpacing',
  'uColor',
  'uBackdrop',
  'uBlur',
  'uLens',
  'uLensShape',
  'uFocus',
  'uChroma',
] as const;

/**
 * WebGL2 lens-blur renderer. The shape is drawn crisp into a texture, a
 * separable-Gaussian mip pyramid is built from it only when the shape changes,
 * and each frame the composite pass samples the pyramid with a per-pixel blur
 * radius driven by the lens around the pointer.
 */
export function createShapeBlurRenderer(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => ShapeBlurSettings,
  initialReduced: boolean,
): ShapeBlurRenderer | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  if (!vertex) return null;
  const shapeProgram = link(gl, vertex, SHAPE_SHADER);
  const blurProgram = link(gl, vertex, BLUR_SHADER);
  const compositeProgram = link(gl, vertex, COMPOSITE_SHADER);
  if (!shapeProgram || !blurProgram || !compositeProgram) {
    if (shapeProgram) gl.deleteProgram(shapeProgram);
    if (blurProgram) gl.deleteProgram(blurProgram);
    if (compositeProgram) gl.deleteProgram(compositeProgram);
    gl.deleteShader(vertex);
    return null;
  }

  const su = locate(gl, shapeProgram, SHAPE_UNIFORMS);
  const bu = locate(gl, blurProgram, BLUR_UNIFORMS);
  const cu = locate(gl, compositeProgram, COMPOSITE_UNIFORMS);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const precise = Boolean(gl.getExtension('EXT_color_buffer_float'));
  const format = precise ? gl.R16F : gl.R8;
  const framebuffer = gl.createFramebuffer();

  const fieldTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R16F,
    1,
    1,
    0,
    gl.RED,
    gl.FLOAT,
    new Float32Array([1e4]),
  );

  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const probe = doc.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const probeCtx = probe.getContext('2d', { willReadFrequently: true });
  let reduce = initialReduced;
  const pointer = { x: 0, y: 0, active: false };
  const lens = { x: 0, y: 0, power: 0, placed: false };
  const pyramid = {
    texture: null as WebGLTexture | null,
    temps: [] as (WebGLTexture | null)[],
    sizes: [] as [number, number][],
    levels: 0,
    key: '',
  };
  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    time: 0,
    angle: 0,
    color: [1, 1, 1] as [number, number, number],
    backdrop: 0,
    colorKey: '',
    image: 'none' as ImageState,
    request: 0,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = true;

  const sizeAt = (k: number): [number, number] => pyramid.sizes[k] ?? [1, 1];

  const allocate = () => {
    if (pyramid.texture) gl.deleteTexture(pyramid.texture);
    pyramid.temps.forEach((texture) => texture && gl.deleteTexture(texture));
    const width = canvas.width;
    const height = canvas.height;
    pyramid.levels = Math.min(
      10,
      Math.floor(Math.log2(Math.max(width, height))) + 1,
    );
    pyramid.sizes = [];
    for (let k = 0; k < pyramid.levels; k++) {
      pyramid.sizes.push([Math.max(1, width >> k), Math.max(1, height >> k)]);
    }
    const configure = () => {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    pyramid.texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pyramid.texture);
    gl.texStorage2D(gl.TEXTURE_2D, pyramid.levels, format, width, height);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_NEAREST,
    );
    configure();
    pyramid.temps = [null];
    for (let k = 1; k < pyramid.levels; k++) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, format, sizeAt(k)[0], sizeAt(k - 1)[1]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      configure();
      pyramid.temps.push(texture);
    }
    pyramid.key = '';
  };

  const resolveColor = (value: string) => {
    if (value === state.colorKey) return;
    state.colorKey = value;
    canvas.style.color = value;
    const computed = view ? view.getComputedStyle(canvas).color : value;
    canvas.style.color = '';
    if (!probeCtx) return;
    probeCtx.clearRect(0, 0, 1, 1);
    probeCtx.fillStyle = computed;
    probeCtx.fillRect(0, 0, 1, 1);
    const data = probeCtx.getImageData(0, 0, 1, 1).data;
    state.color = [
      (data[0] ?? 255) / 255,
      (data[1] ?? 255) / 255,
      (data[2] ?? 255) / 255,
    ];
    const [r, g, b] = state.color;
    state.backdrop = 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5 ? 1 : 0;
  };

  const wander = (t: number): [number, number] => {
    const s = getSettings();
    const minHalf = Math.min(state.width, state.height) / 2;
    const inset = (1 - s.size) * minHalf;
    const frame = s.shape === 0 && !s.src;
    const reachX = frame ? state.width / 2 - inset : s.size * minHalf;
    const reachY = frame ? state.height / 2 - inset : s.size * minHalf;
    return [
      reachX * (0.75 * Math.sin(t * 0.37) + 0.2 * Math.sin(t * 1.13 + 1.7)),
      reachY *
        (0.7 * Math.sin(t * 0.53 + 0.9) + 0.2 * Math.cos(t * 0.91 + 0.4)),
    ];
  };

  const drawShape = (s: ShapeBlurSettings) => {
    const { width, height } = state;
    const minHalf = Math.min(width, height) / 2;
    const inset = (1 - s.size) * minHalf;
    const halfX = Math.max(1, width / 2 - inset);
    const halfY = Math.max(1, height / 2 - inset);
    const radius = s.size * minHalf;
    const fieldHalf = radius * (1 + PAD);
    let shapeIndex = s.shape;
    if (s.src)
      shapeIndex =
        state.image === 'ready' ? 4 : state.image === 'failed' ? s.shape : -1;
    const round =
      shapeIndex === 0
        ? s.roundness * Math.min(halfX, halfY)
        : s.roundness * radius * (shapeIndex === 3 ? 0.12 : 0.3);
    const angle = ((s.rotation + state.angle) * Math.PI) / 180;
    const key = [
      canvas.width,
      canvas.height,
      shapeIndex,
      s.sides,
      halfX,
      halfY,
      radius,
      round,
      s.thickness,
      s.fill,
      s.echoes,
      s.spacing,
      angle.toFixed(5),
    ].join('|');
    if (key === pyramid.key) return;
    pyramid.key = key;

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      pyramid.texture,
      0,
    );
    gl.viewport(0, 0, sizeAt(0)[0], sizeAt(0)[1]);
    gl.useProgram(shapeProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
    gl.uniform1i(su('uFieldTexture'), 0);
    gl.uniform2f(su('uResolution'), width, height);
    gl.uniform1f(su('uDpr'), state.dpr);
    gl.uniform1i(su('uShape'), shapeIndex);
    gl.uniform1f(su('uSides'), s.sides);
    gl.uniform2f(su('uHalf'), halfX, halfY);
    gl.uniform1f(su('uRadius'), radius);
    gl.uniform1f(su('uRound'), round);
    gl.uniform2f(su('uField'), fieldHalf, (2 * fieldHalf) / FIELD);
    gl.uniform1f(su('uThickness'), s.thickness);
    gl.uniform1f(su('uFill'), s.fill ? 1 : 0);
    gl.uniform1f(su('uEchoes'), s.echoes);
    gl.uniform1f(su('uSpacing'), s.spacing);
    gl.uniform1f(su('uAngle'), angle);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.useProgram(blurProgram);
    gl.uniform1i(bu('uSource'), 0);
    for (let k = 1; k < pyramid.levels; k++) {
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        pyramid.temps[k] ?? null,
        0,
      );
      gl.viewport(0, 0, sizeAt(k)[0], sizeAt(k - 1)[1]);
      gl.bindTexture(gl.TEXTURE_2D, pyramid.texture);
      gl.uniform1f(bu('uLod'), k - 1);
      gl.uniform2f(bu('uStep'), 1, 0);
      gl.uniform2f(bu('uScale'), 2, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        pyramid.texture,
        k,
      );
      gl.viewport(0, 0, sizeAt(k)[0], sizeAt(k)[1]);
      gl.bindTexture(gl.TEXTURE_2D, pyramid.temps[k] ?? null);
      gl.uniform1f(bu('uLod'), 0);
      gl.uniform2f(bu('uStep'), 0, 1);
      gl.uniform2f(bu('uScale'), 1, 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const render = () => {
    const s = getSettings();
    if (!pyramid.texture) return;
    resolveColor(s.color);
    gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);
    drawShape(s);

    const { width, height } = state;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(compositeProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pyramid.texture);
    gl.uniform1i(cu('uPyramid'), 0);
    gl.uniform1f(cu('uMaxLod'), pyramid.levels - 1);
    gl.uniform2f(cu('uResolution'), width, height);
    gl.uniform1f(cu('uDpr'), state.dpr);
    gl.uniform1f(cu('uThickness'), s.thickness);
    gl.uniform1f(cu('uFill'), s.fill ? 1 : 0);
    gl.uniform1f(cu('uEchoes'), s.echoes);
    gl.uniform1f(cu('uSpacing'), s.spacing);
    gl.uniform3f(cu('uColor'), ...state.color);
    gl.uniform1f(cu('uBackdrop'), state.backdrop);
    gl.uniform1f(cu('uBlur'), s.blur);
    gl.uniform3f(cu('uLens'), lens.x, lens.y, lens.power);
    gl.uniform2f(
      cu('uLensShape'),
      s.lensSize * Math.min(width, height),
      s.lensSoftness,
    );
    gl.uniform1f(cu('uFocus'), s.focus ? 1 : 0);
    gl.uniform1f(cu('uChroma'), s.chroma);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive || !visible) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    state.time += dt;
    if (!reduce) state.angle = (state.angle + s.spin * dt) % 360;

    const drifting = !pointer.active && s.idle && !reduce;
    let targetX = lens.x;
    let targetY = lens.y;
    let targetPower = 0;
    if (pointer.active) {
      targetX = pointer.x;
      targetY = pointer.y;
      targetPower = 1;
    } else if (drifting) {
      [targetX, targetY] = wander(state.time);
      targetPower = 0.85;
    }
    if (!lens.placed) {
      lens.x = targetX;
      lens.y = targetY;
      lens.placed = true;
    }
    const follow = 1 - Math.exp(-dt * (pointer.active ? 10 : 3));
    lens.x += (targetX - lens.x) * follow;
    lens.y += (targetY - lens.y) * follow;
    lens.power += (targetPower - lens.power) * (1 - Math.exp(-dt * 4));

    render();

    const settled =
      Math.abs(targetX - lens.x) < 0.1 &&
      Math.abs(targetY - lens.y) < 0.1 &&
      Math.abs(targetPower - lens.power) < 0.002;
    if (!settled || drifting || (s.spin && !reduce))
      raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (raf || !alive || !visible) return;
    raf = requestAnimationFrame(frame);
  };

  const load = (value: string) => {
    const request = ++state.request;
    state.image = value ? 'loading' : 'none';
    wake();
    if (!value) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!alive || request !== state.request) return;
      let field: Float32Array | null;
      try {
        field = buildField(image);
      } catch {
        field = null;
      }
      if (!field) {
        state.image = 'failed';
        wake();
        return;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R16F,
        FIELD,
        FIELD,
        0,
        gl.RED,
        gl.FLOAT,
        field,
      );
      state.image = 'ready';
      pyramid.key = '';
      wake();
    };
    image.onerror = () => {
      if (!alive || request !== state.request) return;
      state.image = 'failed';
      wake();
    };
    image.src = value;
  };

  const onPointerMove = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    const margin = getSettings().lensSize * Math.min(rect.width, rect.height);
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointer.active =
      x > -margin &&
      y > -margin &&
      x < rect.width + margin &&
      y < rect.height + margin;
    pointer.x = x - rect.width / 2;
    pointer.y = rect.height / 2 - y;
    wake();
  };

  const onPointerLeave = () => {
    pointer.active = false;
    wake();
  };

  const resize = () => {
    state.dpr = Math.min(view?.devicePixelRatio || 1, 2);
    state.width = Math.max(1, root.clientWidth);
    state.height = Math.max(1, root.clientHeight);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    allocate();
    render();
    wake();
  };

  const setVisible = (value: boolean) => {
    visible = value;
    if (visible) {
      last = 0;
      wake();
    }
  };

  const setReduced = (value: boolean) => {
    reduce = value;
    wake();
  };

  const destroy = () => {
    alive = false;
    cancelAnimationFrame(raf);
    if (pyramid.texture) gl.deleteTexture(pyramid.texture);
    pyramid.temps.forEach((texture) => texture && gl.deleteTexture(texture));
    gl.deleteTexture(fieldTexture);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
    gl.deleteProgram(shapeProgram);
    gl.deleteProgram(blurProgram);
    gl.deleteProgram(compositeProgram);
    gl.deleteShader(vertex);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  resize();

  return {
    load,
    wake,
    resize,
    setVisible,
    setReduced,
    onPointerMove,
    onPointerLeave,
    destroy,
  };
}
