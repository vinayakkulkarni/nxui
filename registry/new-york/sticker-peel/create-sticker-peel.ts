import { effectScope } from 'vue';
import {
  useEventListener,
  useIntersectionObserver,
  useResizeObserver,
} from '@vueuse/core';
import { VERTEX, FRAGMENT, POST_VERTEX, POST_FRAGMENT } from './shaders';
import type {
  StickerEngine,
  StickerHullPoint,
  StickerMesh,
  StickerSettings,
  StickerSpringKey,
  StickerState,
  StickerTarget,
} from './types';

const GRID = 96;
const PAD = 0.18;
const MAX_TEXTURE = 1024;
const MASK_SIZE = 96;
const LIGHT_HEIGHT = 260;
let stack = 1;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const wrapAngle = (angle: number) =>
  Math.atan2(Math.sin(angle), Math.cos(angle));

const spring = (
  state: StickerState,
  key: StickerSpringKey,
  velocity: StickerSpringKey,
  target: number,
  frequency: number,
  damping: number,
  dt: number,
) => {
  const omega = 2 * Math.PI * frequency;
  state[velocity] +=
    (omega * omega * (target - state[key]) -
      2 * damping * omega * state[velocity]) *
    dt;
  state[key] += state[velocity] * dt;
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aGrid');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const locations = new Map<string, WebGLUniformLocation | null>();
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info)
      locations.set(info.name, gl.getUniformLocation(program, info.name));
  }
  const uniform = (name: string) => locations.get(name) ?? null;
  return { program, uniform };
};

const convexHull = (points: StickerHullPoint[]): StickerHullPoint[] => {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross = (
    o: StickerHullPoint,
    a: StickerHullPoint,
    b: StickerHullPoint,
  ) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: StickerHullPoint[] = [];
  sorted.forEach((point) => {
    while (lower.length >= 2) {
      const a = lower[lower.length - 2];
      const b = lower[lower.length - 1];
      if (!a || !b) break;
      if (cross(a, b, point) <= 0) lower.pop();
      else break;
    }
    lower.push(point);
  });
  const upper: StickerHullPoint[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const point = sorted[i]!;
    while (upper.length >= 2) {
      const a = upper[upper.length - 2];
      const b = upper[upper.length - 1];
      if (!a || !b) break;
      if (cross(a, b, point) <= 0) upper.pop();
      else break;
    }
    upper.push(point);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
};

const noop: StickerEngine = { wake: () => {}, destroy: () => {} };

export function createStickerPeel(
  root: HTMLDivElement,
  canvas: HTMLCanvasElement,
  hit: HTMLDivElement,
  getSettings: () => StickerSettings,
): StickerEngine {
  const parent = root.parentElement;
  if (!parent) return noop;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
    depth: true,
    stencil: false,
  });
  if (!gl) return noop;

  const program = link(gl, VERTEX, FRAGMENT);
  const post = link(gl, POST_VERTEX, POST_FRAGMENT);
  if (!program || !post) return noop;
  const u = program.uniform;
  const pu = post.uniform;
  const targets: StickerTarget[] = [];
  for (let i = 0; i < 2; i++) {
    const texture = gl.createTexture();
    const buffer = gl.createFramebuffer();
    if (!texture || !buffer) return noop;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    targets.push({ texture, buffer, width: 0, height: 0 });
  }
  const sizeTargets = () => {
    const width = Math.max(1, Math.round(view.size / 2));
    const height = width;
    targets.forEach((target) => {
      if (target.width === width && target.height === height) return;
      target.width = width;
      target.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
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
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.buffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        target.texture,
        0,
      );
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // Re-allocating a target rebinds TEXTURE0, so restore the sticker art.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  };

  const vertices = new Float32Array((GRID + 1) * (GRID + 1) * 2);
  for (let y = 0; y <= GRID; y++) {
    for (let x = 0; x <= GRID; x++) {
      const i = (y * (GRID + 1) + x) * 2;
      vertices[i] = x / GRID;
      vertices[i + 1] = y / GRID;
    }
  }
  const indices = new Uint16Array(GRID * GRID * 6);
  let cursor = 0;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const a = y * (GRID + 1) + x;
      const b = a + 1;
      const c = a + GRID + 1;
      const d = c + 1;
      indices.set([a, b, d, a, d, c], cursor);
      cursor += 6;
    }
  }
  const vao = gl.createVertexArray();
  if (!vao) return noop;
  gl.bindVertexArray(vao);
  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) return noop;
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const indexBuffer = gl.createBuffer();
  if (!indexBuffer) return noop;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const texture = gl.createTexture();
  if (!texture) return noop;
  const scratch = document.createElement('canvas');
  const scratchContext = scratch.getContext('2d', { willReadFrequently: true });
  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, number[]>();
  const parse = (value: string): number[] => {
    const key = String(value);
    const cached = colorCache.get(key);
    if (cached) return cached;
    let rgb = [0.83, 0.83, 0.85];
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#d4d4d8';
      probe.fillStyle = key;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255];
    }
    colorCache.set(key, rgb);
    return rgb;
  };

  const settingsRef = { current: getSettings() };
  const reduce = settingsRef.current.reducedMotion;
  const sticker: StickerMesh = {
    ready: false,
    aspect: 1,
    meshX: 1,
    meshY: 1,
    texel: 1,
    mask: null,
    maskW: 1,
    maskH: 1,
    hull: [],
  };
  const view = { ratio: 1, size: 1, density: 0 };
  const bounds = { width: 1, height: 1 };
  const state: StickerState = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    placed: false,
    swing: 0,
    swingV: 0,
    peel: 0,
    peelV: 0,
    lift: 0,
    liftV: 0,
    dir: settingsRef.current.peelDirection,
    hover: false,
    local: { x: 0, y: 0 },
    press: null,
    pivotV: { x: 0, y: 0 },
    light: { x: 0, y: 0, z: LIGHT_HEIGHT },
    pointer: { x: 0, y: 0, inside: false },
    intro: settingsRef.current.intro && !reduce ? 0 : 1,
  };
  if (state.intro < 1) {
    state.lift = 1.5;
    state.peel = 0.3;
    state.swing = 0.1;
    state.dir += 0.6;
  }
  let raf = 0;
  let last = 0;
  let visible = true;
  let loadedSrc: string | null = null;
  let alive = true;

  const height = () => settingsRef.current.width * sticker.aspect;

  const extentAlong = (dx: number, dy: number): [number, number] => {
    const s = settingsRef.current;
    const w = s.width;
    const h = height();
    if (!sticker.hull.length) {
      const half = (Math.abs(dx) * w + Math.abs(dy) * h) / 2;
      return [-half, half];
    }
    let min = Infinity;
    let max = -Infinity;
    sticker.hull.forEach(([px, py]) => {
      const value = px * w * dx + py * h * dy;
      if (value < min) min = value;
      if (value > max) max = value;
    });
    return [min, max];
  };

  const load = (src: string) => {
    loadedSrc = src;
    sticker.ready = false;
    if (!src) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      if (!alive || loadedSrc !== src || !scratchContext) return;
      const iw = image.naturalWidth || 1;
      const ih = image.naturalHeight || 1;
      const fit = Math.min(1, MAX_TEXTURE / (Math.max(iw, ih) * (1 + 2 * PAD)));
      const w = Math.max(1, Math.round(iw * fit));
      const h = Math.max(1, Math.round(ih * fit));
      const padX = Math.round(w * PAD);
      const padY = Math.round(h * PAD);
      scratch.width = w + padX * 2;
      scratch.height = h + padY * 2;
      scratchContext.clearRect(0, 0, scratch.width, scratch.height);
      scratchContext.drawImage(image, padX, padY, w, h);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        scratch,
      );
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      sticker.aspect = ih / iw;
      sticker.meshX = scratch.width / w;
      sticker.meshY = scratch.height / h;
      sticker.texel = scratch.width;
      const maskW = Math.max(8, Math.round(MASK_SIZE * Math.min(1, iw / ih)));
      const maskH = Math.max(8, Math.round(MASK_SIZE * Math.min(1, ih / iw)));
      scratch.width = maskW;
      scratch.height = maskH;
      scratchContext.clearRect(0, 0, maskW, maskH);
      scratchContext.drawImage(image, 0, 0, maskW, maskH);
      const pixels = scratchContext.getImageData(0, 0, maskW, maskH).data;
      const mask = new Uint8Array(maskW * maskH).fill(255);
      const queue: number[] = [];
      const visit = (x: number, y: number) => {
        const i = y * maskW + x;
        if (mask[i] === 0 || (pixels[i * 4 + 3] ?? 0) > 100) return;
        mask[i] = 0;
        queue.push(i);
      };
      for (let x = 0; x < maskW; x++) {
        visit(x, 0);
        visit(x, maskH - 1);
      }
      for (let y = 0; y < maskH; y++) {
        visit(0, y);
        visit(maskW - 1, y);
      }
      while (queue.length) {
        const i = queue.pop()!;
        const x = i % maskW;
        const y = (i - x) / maskW;
        if (x > 0) visit(x - 1, y);
        if (x < maskW - 1) visit(x + 1, y);
        if (y > 0) visit(x, y - 1);
        if (y < maskH - 1) visit(x, y + 1);
      }
      const points: StickerHullPoint[] = [];
      for (let y = 0; y < maskH; y++) {
        for (let x = 0; x < maskW; x++) {
          if ((pixels[(y * maskW + x) * 4 + 3] ?? 0) > 127)
            points.push([(x + 0.5) / maskW - 0.5, (y + 0.5) / maskH - 0.5]);
        }
      }
      sticker.mask = mask;
      sticker.maskW = maskW;
      sticker.maskH = maskH;
      sticker.hull = convexHull(points);
      sticker.ready = true;
      layout();
      wake();
    };
    image.src = src;
  };

  const layout = () => {
    const s = settingsRef.current;
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    bounds.width = Math.max(1, parent.clientWidth);
    bounds.height = Math.max(1, parent.clientHeight);
    const h = height();
    const size = Math.ceil(
      Math.hypot(s.width, h) * 1.16 + 2 * (36 + s.curlRadius),
    );
    if (size !== view.size || view.ratio !== view.density) {
      view.size = size;
      view.density = view.ratio;
      root.style.width = `${size}px`;
      root.style.height = `${size}px`;
      canvas.width = Math.round(size * view.ratio);
      canvas.height = Math.round(size * view.ratio);
    }
    hit.style.width = `${s.width}px`;
    hit.style.height = `${h}px`;
    if (!state.placed) {
      const start = s.initialPosition;
      const offset =
        start && typeof start === 'object' ? start : { x: 0, y: 0 };
      state.x = bounds.width / 2 + (offset.x || 0);
      state.y = bounds.height / 2 + (offset.y || 0);
      state.light = {
        x: state.x - s.width * 0.45,
        y: state.y - h * 0.9,
        z: LIGHT_HEIGHT * 1.6,
      };
      state.placed = true;
    }
    confine();
  };

  const reach = () => {
    const s = settingsRef.current;
    const angle = s.rotate + state.swing;
    const grow = 1 + 0.07 * Math.max(0, state.lift);
    const w = (s.width / 2) * grow;
    const h = (height() / 2) * grow;
    const c = Math.abs(Math.cos(angle));
    const sn = Math.abs(Math.sin(angle));
    return { x: w * c + h * sn, y: w * sn + h * c };
  };

  const confine = () => {
    const s = settingsRef.current;
    const half = reach();
    const minX = Math.min(half.x, bounds.width / 2);
    const maxX = Math.max(bounds.width - half.x, bounds.width / 2);
    const minY = Math.min(half.y, bounds.height / 2);
    const maxY = Math.max(bounds.height - half.y, bounds.height / 2);
    if (state.x < minX) {
      state.x = minX;
      if (state.vx < 0) state.vx = -state.vx * s.bounce;
    } else if (state.x > maxX) {
      state.x = maxX;
      if (state.vx > 0) state.vx = -state.vx * s.bounce;
    }
    if (state.y < minY) {
      state.y = minY;
      if (state.vy < 0) state.vy = -state.vy * s.bounce;
    } else if (state.y > maxY) {
      state.y = maxY;
      if (state.vy > 0) state.vy = -state.vy * s.bounce;
    }
  };

  const toParent = (event: PointerEvent): { x: number; y: number } => {
    const rect = parent.getBoundingClientRect();
    return {
      x: event.clientX - rect.left - parent.clientLeft,
      y: event.clientY - rect.top - parent.clientTop,
    };
  };

  const toLocal = (point: {
    x: number;
    y: number;
  }): { x: number; y: number } => {
    const s = settingsRef.current;
    const angle = -(s.rotate + state.swing);
    const scale = 1 + 0.07 * Math.max(0, state.lift);
    const dx = point.x - state.x;
    const dy = point.y - state.y;
    return {
      x: (Math.cos(angle) * dx - Math.sin(angle) * dy) / scale,
      y: (Math.sin(angle) * dx + Math.cos(angle) * dy) / scale,
    };
  };

  const solid = (local: { x: number; y: number }) => {
    if (!sticker.mask) return false;
    const s = settingsRef.current;
    const mx = Math.floor((local.x / s.width + 0.5) * sticker.maskW);
    const my = Math.floor((local.y / height() + 0.5) * sticker.maskH);
    if (mx < 0 || my < 0 || mx >= sticker.maskW || my >= sticker.maskH)
      return false;
    return (sticker.mask[my * sticker.maskW + mx] ?? 0) > 100;
  };

  const draw = () => {
    const s = settingsRef.current;
    const size = view.size;
    root.style.transform = `translate3d(${state.x - size / 2}px, ${state.y - size / 2}px, 0)`;
    const angle = s.rotate + state.swing;
    const scale = 1 + 0.07 * Math.max(0, state.lift);
    hit.style.transform = `translate(-50%, -50%) rotate(${angle}rad) scale(${scale})`;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!sticker.ready) return;
    const w = s.width;
    const h = height();
    const dx = -Math.sin(state.dir);
    const dy = Math.cos(state.dir);
    const [start, end] = extentAlong(dx, dy);
    const peel = clamp(state.peel, 0, 1);
    const fold = start + peel * (end - start);
    const lift = Math.max(0, state.lift);
    const center = size / 2;
    const count = GRID * GRID * 6;
    const peeled = peel > 0.001;
    gl.useProgram(program.program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(u('uImage'), 0);
    gl.uniform2f(u('uCanvas'), size, size);
    gl.uniform2f(u('uMesh'), w * sticker.meshX, h * sticker.meshY);
    gl.uniform2f(u('uCenter'), center, center);
    gl.uniform2f(u('uDir'), dx, dy);
    gl.uniform1f(u('uFold'), fold);
    gl.uniform1f(u('uRadius'), s.curlRadius);
    gl.uniform1f(u('uAngle'), angle);
    gl.uniform1f(u('uScale'), scale);
    gl.uniform1f(u('uLift'), lift * 26);
    gl.uniform2f(u('uShadowOffset'), 1.2, 2.4);
    gl.uniform2f(u('uShadowSlope'), 0.28, 0.55);
    gl.uniform1i(u('uFinish'), s.finish);
    gl.uniform3fv(u('uBack'), parse(s.backColor));
    gl.uniform3f(
      u('uLight'),
      state.light.x - (state.x - center),
      state.light.y - (state.y - center),
      state.light.z,
    );
    gl.uniform1f(u('uShine'), s.lighting);
    gl.uniform1f(u('uShadow'), s.shadow * 0.55);
    gl.uniform1f(u('uTexel'), sticker.texel / (w * sticker.meshX));
    gl.uniform1f(
      u('uLod'),
      Math.max(
        0,
        Math.log2(sticker.texel / (w * sticker.meshX * scale * view.ratio)),
      ),
    );
    const glint = toLocal(state.light);
    gl.uniform2f(
      u('uGlint'),
      glint.x / (w * sticker.meshX) + 0.5,
      glint.y / (h * sticker.meshY) + 0.5,
    );
    gl.disable(gl.DEPTH_TEST);
    if (peeled) {
      sizeTargets();
      const [first, second] = targets;
      if (!first || !second) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, first.buffer);
      gl.viewport(0, 0, first.width, first.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.BLEND);
      gl.uniform1i(u('uPass'), 2);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      gl.useProgram(post.program);
      gl.uniform1i(pu('uSource'), 1);
      gl.uniform1i(pu('uMode'), 0);
      gl.uniform1f(pu('uSigma'), Math.min(4, (2.5 + s.curlRadius * 0.15) / 2));
      gl.activeTexture(gl.TEXTURE1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, second.buffer);
      gl.bindTexture(gl.TEXTURE_2D, first.texture);
      gl.uniform2f(pu('uStep'), 1 / first.width, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, first.buffer);
      gl.bindTexture(gl.TEXTURE_2D, second.texture);
      gl.uniform2f(pu('uStep'), 0, 1 / first.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program.program);
      gl.activeTexture(gl.TEXTURE0);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(u('uPass'), 0);
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    gl.uniform1i(u('uPass'), 1);
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    if (peeled) {
      gl.useProgram(post.program);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, targets[0]?.texture ?? null);
      gl.uniform1i(pu('uMode'), 1);
      gl.uniform1f(pu('uStrength'), s.shadow * 0.6);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.useProgram(program.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LESS);
      gl.uniform1i(u('uPass'), 3);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      gl.disable(gl.DEPTH_TEST);
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    settingsRef.current = getSettings();
    const s = settingsRef.current;
    const dt = last ? clamp((now - last) / 1000, 0.001, 1 / 30) : 1 / 60;
    last = now;
    if (s.imageSrc !== loadedSrc) load(s.imageSrc);
    const h = height();
    if (state.intro < 1 && sticker.ready)
      state.intro = Math.min(1, state.intro + dt / 1.1);
    const press = state.press;
    const drag = press && press.moving ? press : null;
    if (drag) {
      const target = drag.pointer;
      const prev = drag.pivot;
      const smoothing = 1 - Math.exp(-dt / 0.045);
      const vx =
        state.pivotV.x +
        ((target.x - prev.x) / dt - state.pivotV.x) * smoothing;
      const vy =
        state.pivotV.y +
        ((target.y - prev.y) / dt - state.pivotV.y) * smoothing;
      const ax = (vx - state.pivotV.x) / dt;
      const ay = (vy - state.pivotV.y) / dt;
      state.pivotV.x = vx;
      state.pivotV.y = vy;
      drag.pivot = { x: target.x, y: target.y };
      const turned = s.rotate + state.swing;
      const rx = -(
        Math.cos(turned) * drag.grab.x -
        Math.sin(turned) * drag.grab.y
      );
      const ry = -(
        Math.sin(turned) * drag.grab.x +
        Math.cos(turned) * drag.grab.y
      );
      const inertia = (s.width * s.width + h * h) / 12 + rx * rx + ry * ry;
      const torque =
        (rx * -clamp(ay, -24000, 24000) - ry * -clamp(ax, -24000, 24000)) /
        inertia;
      const omega = 2 * Math.PI * 1.5;
      state.swingV +=
        (torque * 1.1 * s.swing -
          omega * omega * state.swing -
          2 * 0.45 * omega * state.swingV) *
        dt;
      state.swing = clamp(state.swing + state.swingV * dt, -1.2, 1.2);
      const grip = 1 + 0.07 * Math.max(0, state.lift);
      state.x =
        target.x -
        (Math.cos(turned) * drag.grab.x - Math.sin(turned) * drag.grab.y) *
          grip;
      state.y =
        target.y -
        (Math.sin(turned) * drag.grab.x + Math.cos(turned) * drag.grab.y) *
          grip;
      confine();
    } else {
      spring(state, 'swing', 'swingV', 0, 1.4, 0.32, dt);
      const decay = Math.exp(-dt * (1.5 + 9 * s.friction));
      state.vx *= decay;
      state.vy *= decay;
      if (Math.hypot(state.vx, state.vy) < 4) {
        state.vx = 0;
        state.vy = 0;
      }
      state.x += state.vx * dt;
      state.y += state.vy * dt;
      confine();
    }
    const introHold = state.intro < 0.2;
    const peelTarget = introHold
      ? 0.3
      : press
        ? s.activePeel
        : state.hover
          ? s.hoverPeel
          : 0;
    spring(
      state,
      'peel',
      'peelV',
      peelTarget,
      press || state.hover ? 3 : 3.6,
      press || state.hover ? 0.7 : 0.62,
      dt,
    );
    spring(state, 'lift', 'liftV', drag ? 1 : 0, 3.2, 0.55, dt);
    let dirTarget = s.peelDirection;
    if (
      press &&
      Math.hypot(press.grab.x, press.grab.y) > Math.min(s.width, h) * 0.12
    ) {
      dirTarget = Math.atan2(press.grab.x, -press.grab.y);
    } else if (
      s.followPointer &&
      state.hover &&
      Math.hypot(state.local.x, state.local.y) > Math.min(s.width, h) * 0.12
    ) {
      dirTarget = Math.atan2(state.local.x, -state.local.y);
    }
    if (!introHold)
      state.dir +=
        wrapAngle(dirTarget - state.dir) * (1 - Math.exp(-dt / 0.12));
    const lightTarget = state.pointer.inside
      ? { x: state.pointer.x, y: state.pointer.y, z: LIGHT_HEIGHT }
      : {
          x: state.x - s.width * 0.45,
          y: state.y - h * 0.9,
          z: LIGHT_HEIGHT * 1.6,
        };
    const follow = 1 - Math.exp(-dt / 0.08);
    state.light.x += (lightTarget.x - state.light.x) * follow;
    state.light.y += (lightTarget.y - state.light.y) * follow;
    state.light.z += (lightTarget.z - state.light.z) * follow;
    canvas.style.opacity = String(clamp(state.intro / 0.12, 0, 1));
    draw();
    const moving =
      (state.intro < 1 && sticker.ready) ||
      press ||
      Math.abs(state.peel - peelTarget) > 0.0005 ||
      Math.abs(state.peelV) > 0.0005 ||
      Math.abs(state.lift - (drag ? 1 : 0)) > 0.0005 ||
      Math.abs(state.liftV) > 0.0005 ||
      Math.abs(state.swing) > 0.0005 ||
      Math.abs(state.swingV) > 0.0005 ||
      state.vx !== 0 ||
      state.vy !== 0 ||
      Math.abs(wrapAngle(dirTarget - state.dir)) > 0.002 ||
      Math.hypot(
        lightTarget.x - state.light.x,
        lightTarget.y - state.light.y,
        lightTarget.z - state.light.z,
      ) > 0.5;
    if (moving) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  function wake() {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  const updateHover = (event: PointerEvent) => {
    const point = toParent(event);
    state.local = toLocal(point);
    const over = solid(state.local);
    if (over !== state.hover) state.hover = over;
    hit.style.cursor =
      over && settingsRef.current.draggable
        ? state.press
          ? 'grabbing'
          : 'grab'
        : '';
  };

  const onPointerMove = (event: PointerEvent) => {
    const point = toParent(event);
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.inside =
      point.x >= 0 &&
      point.y >= 0 &&
      point.x <= bounds.width &&
      point.y <= bounds.height;
    wake();
  };

  const onHitMove = (event: PointerEvent) => {
    const press = state.press;
    if (!press) {
      updateHover(event);
    } else if (press.id === event.pointerId) {
      const point = toParent(event);
      press.pointer = point;
      if (
        !press.moving &&
        Math.hypot(point.x - press.origin.x, point.y - press.origin.y) > 3
      ) {
        press.moving = settingsRef.current.draggable;
        if (press.moving) settingsRef.current.onDragStart?.();
      }
      press.samples.push({ x: point.x, y: point.y, t: performance.now() });
      if (press.samples.length > 8) press.samples.shift();
    }
    wake();
  };

  const onHitLeave = () => {
    if (state.press) return;
    state.hover = false;
    hit.style.cursor = '';
    wake();
  };

  const onHitDown = (event: PointerEvent) => {
    const s = settingsRef.current;
    if (event.button !== 0 || !sticker.ready) return;
    updateHover(event);
    if (!state.hover) return;
    const point = toParent(event);
    state.press = {
      id: event.pointerId,
      grab: toLocal(point),
      origin: point,
      pointer: point,
      pivot: point,
      moving: false,
      samples: [],
    };
    state.pivotV = { x: 0, y: 0 };
    state.vx = 0;
    state.vy = 0;
    hit.setPointerCapture?.(event.pointerId);
    if (s.draggable) {
      hit.style.cursor = 'grabbing';
      stack += 1;
      root.style.zIndex = String(stack);
    }
    event.preventDefault();
    wake();
  };

  const onHitUp = (event: PointerEvent) => {
    const press = state.press;
    if (!press || press.id !== event.pointerId) return;
    state.press = null;
    if (hit.hasPointerCapture?.(event.pointerId))
      hit.releasePointerCapture(event.pointerId);
    const now = performance.now();
    const recent = press.samples.filter((sample) => now - sample.t < 90);
    if (press.moving && recent.length > 1 && !reduce) {
      const a = recent[0];
      const b = recent[recent.length - 1];
      if (a && b) {
        const span = Math.max(b.t - a.t, 16) / 1000;
        const speed = 2600;
        state.vx = clamp((b.x - a.x) / span, -speed, speed);
        state.vy = clamp((b.y - a.y) / span, -speed, speed);
      }
    }
    updateHover(event);
    if (event.pointerType !== 'mouse') state.hover = false;
    if (press.moving) settingsRef.current.onDragEnd?.();
    wake();
  };

  const onLeaveWindow = () => {
    state.pointer.inside = false;
    wake();
  };

  const onVisibility = () => {
    last = 0;
    wake();
  };

  const scope = effectScope();
  scope.run(() => {
    useResizeObserver(parent, () => {
      layout();
      wake();
    });
    useIntersectionObserver(parent, (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    useEventListener('pointermove', onPointerMove, { passive: true });
    useEventListener(document.documentElement, 'pointerleave', onLeaveWindow);
    useEventListener(document, 'visibilitychange', onVisibility);
    useEventListener(hit, 'pointermove', onHitMove);
    useEventListener(hit, 'pointerleave', onHitLeave);
    useEventListener(hit, 'pointerdown', onHitDown);
    useEventListener(hit, 'pointerup', onHitUp);
    useEventListener(hit, 'pointercancel', onHitUp);
  });
  load(settingsRef.current.imageSrc);
  layout();
  wake();

  return {
    wake: () => {
      settingsRef.current = getSettings();
      layout();
      wake();
    },
    destroy: () => {
      alive = false;
      scope.stop();
      cancelAnimationFrame(raf);
      gl.deleteTexture(texture);
      targets.forEach((target) => {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.buffer);
      });
      gl.deleteProgram(post.program);
      gl.deleteBuffer(vertexBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program.program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
