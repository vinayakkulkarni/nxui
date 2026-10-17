import {
  GLASS_ICONS_PLATE_CODES,
  GLASS_ICONS_STAGGER,
  clamp,
  createMotion,
  drive,
  parseGradient,
  poseOf,
} from './glass-icons-math';
import {
  GLASS_ICONS_FRAGMENT,
  GLASS_ICONS_UNIFORMS,
  GLASS_ICONS_VERTEX,
} from './glass-icons-shaders';
import type {
  GlassIconsEngine,
  GlassIconsEngineOptions,
  GlassIconsGradient,
  GlassIconsMotion,
} from './types';

type UniformName = (typeof GLASS_ICONS_UNIFORMS)[number];
type MotionKey = 'h' | 'p' | 'x' | 'y' | 'e';

const SPRINGS: Array<[MotionKey, number, number]> = [
  ['h', 170, 24],
  ['p', 420, 40],
  ['x', 90, 19],
  ['y', 90, 19],
  ['e', 60, 15.5],
];

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

function step(
  state: GlassIconsMotion,
  key: MotionKey,
  k: number,
  d: number,
  h: number,
) {
  const vKey = `${key}v` as const;
  const tKey = `${key}t` as const;
  const [value, velocity] = drive(
    state[key],
    state[vKey],
    state[tKey],
    k,
    d,
    h,
  );
  state[key] = value;
  state[vKey] = velocity;
}

function settle(state: GlassIconsMotion, key: MotionKey): boolean {
  const vKey = `${key}v` as const;
  const tKey = `${key}t` as const;
  if (
    Math.abs(state[tKey] - state[key]) < 0.0005 &&
    Math.abs(state[vKey]) < 0.001
  ) {
    state[key] = state[tKey];
    state[vKey] = 0;
    return false;
  }
  return true;
}

/**
 * Spring-driven renderer for GlassIcons. Draws every glass tile into one
 * WebGL2 canvas (refracting the colored plate behind it) and drives the DOM
 * layers (glass, face, label, fallback plate) from the same pose. The rAF loop
 * only runs while something is still moving.
 */
export function createGlassIconsEngine(
  options: GlassIconsEngineOptions,
): GlassIconsEngine {
  const { root, canvas, getSettings, plates, glasses, faces, labels, onGpu } =
    options;
  const reduce =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const states: GlassIconsMotion[] = [];
  const layout = { width: 1, height: 1, margin: 0, dpr: 1 };
  let centers: Array<[number, number]> = [];
  const paint = document.createElement('canvas');
  const paintContext = paint.getContext('2d', { willReadFrequently: true });
  let gl: WebGL2RenderingContext | null = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  let vertex: WebGLShader | null = null;
  let fragment: WebGLShader | null = null;
  const uniforms = new Map<UniformName, WebGLUniformLocation | null>();
  let gradientKey = '';
  let gradients: GlassIconsGradient[] = [];
  let tintKey = '';
  let tintColor: [number, number, number] = [1, 1, 1];
  let raf = 0;
  let last = 0;
  let alive = true;
  let entered = false;

  if (gl) {
    vertex = compile(gl, gl.VERTEX_SHADER, GLASS_ICONS_VERTEX);
    fragment = compile(gl, gl.FRAGMENT_SHADER, GLASS_ICONS_FRAGMENT);
    program = gl.createProgram();
    if (vertex && fragment && program) {
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
    }
    if (
      !program ||
      !vertex ||
      !fragment ||
      !gl.getProgramParameter(program, gl.LINK_STATUS)
    ) {
      gl = null;
    } else {
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const corner = gl.getAttribLocation(program, 'aCorner');
      gl.enableVertexAttribArray(corner);
      gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
      for (const name of GLASS_ICONS_UNIFORMS) {
        uniforms.set(name, gl.getUniformLocation(program, name));
      }
      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(uniforms.get('uGradients') ?? null, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
  }
  onGpu(Boolean(gl));

  const u = (name: UniformName) => uniforms.get(name) ?? null;

  const stateOf = (index: number): GlassIconsMotion => {
    while (states.length <= index) {
      states.push(createMotion(getSettings().intro && !reduce ? 0 : 1));
    }
    return states[index]!;
  };

  const refreshTextures = () => {
    const s = getSettings();
    if (paintContext && s.tint !== tintKey) {
      tintKey = s.tint;
      paint.width = 1;
      paint.height = 1;
      paintContext.fillStyle = '#ffffff';
      paintContext.fillStyle = s.tint;
      paintContext.fillRect(0, 0, 1, 1);
      const [r = 255, g = 255, b = 255] = paintContext.getImageData(
        0,
        0,
        1,
        1,
      ).data;
      tintColor = [r / 255, g / 255, b / 255];
    }
    if (!gl || !paintContext || s.colorKey === gradientKey) return;
    gradientKey = s.colorKey;
    gradients = s.colors.map(parseGradient);
    paint.width = 256;
    paint.height = Math.max(1, gradients.length);
    gradients.forEach((gradient, row) => {
      const fill = paintContext.createLinearGradient(0, 0, 256, 0);
      gradient.stops.forEach(([at, color]) => {
        try {
          fill.addColorStop(clamp(at, 0, 1), color);
        } catch {
          fill.addColorStop(clamp(at, 0, 1), '#ffffff');
        }
      });
      paintContext.fillStyle = fill;
      paintContext.fillRect(0, row, 256, 1);
    });
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paint);
  };

  const measure = () => {
    const s = getSettings();
    const margin = Math.ceil(s.tile * 0.7);
    layout.margin = margin;
    layout.width = Math.max(1, root.clientWidth + margin * 2);
    layout.height = Math.max(1, root.clientHeight + margin * 2);
    layout.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.left = `${-margin}px`;
    canvas.style.top = `${-margin}px`;
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
    const width = Math.round(layout.width * layout.dpr);
    const height = Math.round(layout.height * layout.dpr);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    centers = Array.from(
      root.querySelectorAll<HTMLElement>('[data-glass-icon]'),
    ).map((icon): [number, number] => [
      icon.offsetLeft + icon.offsetWidth / 2 + margin,
      icon.offsetTop + icon.offsetHeight / 2 + margin,
    ]);
  };

  const applyDom = () => {
    const s = getSettings();
    for (let i = 0; i < s.count; i++) {
      const pose = poseOf(stateOf(i), s);
      const glass = glasses[i];
      if (glass) {
        glass.style.transform = `translate3d(0, ${pose.liftY.toFixed(2)}px, 0) scale(${pose.domScale.toFixed(4)})`;
        glass.style.opacity = pose.glassAlpha.toFixed(3);
      }
      const face = faces[i];
      if (face) {
        face.style.transform = `translate3d(0, ${pose.faceY.toFixed(2)}px, 0) scale(${pose.faceScale.toFixed(4)})`;
        face.style.opacity = pose.faceAlpha.toFixed(3);
      }
      const label = labels[i];
      if (label && s.labels === 'always') {
        label.style.opacity = pose.faceAlpha.toFixed(3);
      }
      const card = plates[i];
      if (card) {
        const [sx, sy] = pose.shift;
        const [ox, oy] = pose.offset;
        card.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${pose.plateScale.toFixed(4)}) rotate(${pose.angle.toFixed(3)}deg) translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px)`;
        card.style.opacity = pose.plateAlpha.toFixed(3);
      }
    }
  };

  const draw = () => {
    if (!gl) return;
    const s = getSettings();
    refreshTextures();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!s.count) return;
    const size = s.tile;
    gl.uniform2f(u('uCanvas'), layout.width, layout.height);
    gl.uniform1f(u('uExtent'), size * 1.08);
    gl.uniform1f(u('uSize'), size);
    gl.uniform1f(u('uRadius'), Math.min(s.radius, size / 2));
    gl.uniform1f(u('uBevel'), s.edge);
    gl.uniform1f(u('uSoft'), s.soft);
    gl.uniform1f(u('uShade'), s.shade);
    gl.uniform4f(
      u('uTint'),
      tintColor[0],
      tintColor[1],
      tintColor[2],
      s.tintOpacity,
    );
    gl.uniform1i(u('uPlate'), GLASS_ICONS_PLATE_CODES[s.plate]);
    gl.uniform1f(u('uDisc'), size * 0.41);
    gl.uniform1f(u('uPixel'), 1 / layout.dpr);
    const origin = s.plate === 'tilt' ? size / 2 : 0;
    gl.uniform2f(u('uOrigin'), origin, origin);
    for (let i = 0; i < s.count; i++) {
      const center = centers[i];
      if (!center) continue;
      const pose = poseOf(stateOf(i), s);
      const angleDeg = gradients[i]?.angle ?? 180;
      const turn = (-pose.angle * Math.PI) / 180;
      const box = s.plate === 'circle' ? size * 0.82 : size;
      const direction = (angleDeg * Math.PI) / 180;
      const dx = Math.sin(direction);
      const dy = -Math.cos(direction);
      gl.uniform2f(u('uCenter'), center[0], center[1]);
      gl.uniform1f(u('uStrength'), s.strength * pose.bend);
      gl.uniform1f(u('uSplit'), s.split * pose.bend);
      gl.uniform1f(u('uShine'), s.shine * pose.glow);
      gl.uniform2f(u('uLight'), pose.light[0], pose.light[1]);
      gl.uniformMatrix2fv(u('uTurn'), false, [
        Math.cos(turn),
        Math.sin(turn),
        -Math.sin(turn),
        Math.cos(turn),
      ]);
      gl.uniform2f(u('uShift'), pose.shift[0], pose.shift[1]);
      gl.uniform2f(u('uOffset'), pose.offset[0], pose.offset[1]);
      gl.uniform1f(u('uScale'), pose.plateScale);
      gl.uniform1f(u('uRow'), (i + 0.5) / Math.max(1, gradients.length));
      gl.uniform2f(u('uDirection'), dx, dy);
      gl.uniform1f(
        u('uSpan'),
        Math.max(1, Math.abs(box * dx) + Math.abs(box * dy)),
      );
      gl.uniform2f(u('uLift'), 0, pose.liftY);
      gl.uniform1f(u('uGlassScale'), pose.glassScale);
      gl.uniform1f(u('uGlassAlpha'), pose.glassAlpha);
      gl.uniform1f(u('uPlateAlpha'), pose.plateAlpha);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  };

  const tick = (now: number) => {
    raf = 0;
    if (!alive) return;
    const s = getSettings();
    const time = now / 1000;
    const dt = last ? Math.min(1 / 30, time - last) : 1 / 60;
    last = time;
    const steps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / steps;
    let moving = false;
    for (let i = 0; i < s.count; i++) {
      const state = stateOf(i);
      if (state.et === 0) {
        if (entered && time >= state.at) state.et = 1;
        else moving = moving || entered;
      }
      if (reduce) {
        state.h = state.ht;
        state.p = state.pt;
        state.x = state.xt;
        state.y = state.yt;
        state.e = state.et;
        continue;
      }
      for (let k = 0; k < steps; k++) {
        for (const [key, stiffness, damping] of SPRINGS) {
          step(state, key, stiffness, damping, h);
        }
      }
      for (const [key] of SPRINGS) {
        if (settle(state, key)) moving = true;
      }
    }
    applyDom();
    draw();
    if (moving) raf = requestAnimationFrame(tick);
    else last = 0;
  };

  const wake = () => {
    if (!raf && alive) raf = requestAnimationFrame(tick);
  };

  const visibility = new IntersectionObserver(
    (entries) => {
      if (entered || !entries.some((entry) => entry.isIntersecting)) return;
      entered = true;
      const time = performance.now() / 1000;
      for (let i = 0; i < getSettings().count; i++) {
        stateOf(i).at = time + i * GLASS_ICONS_STAGGER;
      }
      wake();
    },
    { threshold: 0.15 },
  );
  visibility.observe(root);

  const resizeObserver = new ResizeObserver(() => {
    measure();
    applyDom();
    draw();
  });
  resizeObserver.observe(root);

  const onContextLost = (event: Event) => {
    event.preventDefault();
    gl = null;
    onGpu(false);
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  const sync = () => {
    measure();
    applyDom();
    draw();
    wake();
  };

  sync();

  return {
    hover(index, on) {
      const state = stateOf(index);
      state.ht = on ? 1 : 0;
      if (!on) {
        state.xt = 0;
        state.yt = 0;
        state.pt = 0;
      }
      wake();
    },
    aim(index, x, y) {
      const state = stateOf(index);
      state.xt = x;
      state.yt = y;
      wake();
    },
    press(index, on) {
      stateOf(index).pt = on ? 1 : 0;
      wake();
    },
    sync,
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      visibility.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (gl) {
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
      }
    },
  };
}
