import {
  MAGNET_LINES_FRAGMENT,
  MAGNET_LINES_VERTEX,
} from './magnet-lines-shaders';
import type {
  MagnetLinesCandidate,
  MagnetLinesEngine,
  MagnetLinesEngineOptions,
  MagnetLinesField,
  MagnetLinesMat3,
  MagnetLinesMode,
  MagnetLinesPulse,
  MagnetLinesRange,
  MagnetLinesRgb,
  MagnetLinesSettings,
  MagnetLinesShape,
  MagnetLinesView,
} from './types';

export const MAGNET_LINES_MODES: MagnetLinesMode[] = [
  'orbit',
  'attract',
  'spiral',
  'dipole',
];

const MAGNET_LINES_SHAPES: Record<MagnetLinesShape, number> = {
  line: 0,
  arrow: 1,
  needle: 2,
};

const TAU = Math.PI * 2;
const PULSE_SPEED = 520;
const PULSE_SPIN = 0.34;
const INTRO_SPEED = 700;
const INTRO_TIME = 1.1;
const INTRO_SPIN = 0.65;
const FAR = 4;
const MAX_LINES = 30000;
const FALLBACK: MagnetLinesRgb = [0.94, 0.94, 0.94];

const UNIFORMS = [
  'uView',
  'uCanvas',
  'uOffset',
  'uLine',
  'uStretch',
  'uHead',
  'uPad',
  'uFar',
  'uColor',
  'uAccent',
  'uAccentMix',
  'uOpacity',
  'uFade',
  'uShape',
  'uRainbow',
  'uTone',
  'uPeriod',
  'uPixels',
  'uEdge',
] as const;

type UniformName = (typeof UNIFORMS)[number];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function wrap(value: number, period: number): number {
  const half = period / 2;
  return ((((value + half) % period) + period) % period) - half;
}

function seedFor(column: number, row: number): number {
  let hash =
    Math.imul(column + 40503, 2246822519) ^ Math.imul(row + 9973, 3266489917);
  hash = Math.imul(hash ^ (hash >>> 15), 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 374761393);
  return (((hash ^ (hash >>> 16)) >>> 0) / 4294967296) * 2 - 1;
}

function channel(full: string, index: number): number {
  return Number.parseInt(full.slice(index, index + 2), 16) / 255;
}

export function parseColor(value: string | undefined): MagnetLinesRgb {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  const digits = hex?.[1];
  if (digits) {
    const full =
      digits.length === 3
        ? digits.replace(/./g, (digit) => digit + digit)
        : digits;
    return [channel(full, 0), channel(full, 2), channel(full, 4)];
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
  return FALLBACK;
}

export function lightness(rgb: MagnetLinesRgb): number {
  return (Math.max(...rgb) + Math.min(...rgb)) / 2;
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

function link(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, MAGNET_LINES_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, MAGNET_LINES_FRAGMENT);
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
  const uniforms = new Map<UniformName, WebGLUniformLocation | null>();
  for (const name of UNIFORMS) {
    uniforms.set(name, gl.getUniformLocation(program, name));
  }
  return { program, uniforms };
}

function multiply(a: MagnetLinesMat3, b: MagnetLinesMat3): MagnetLinesMat3 {
  const [a0, a1, a2, a3, a4, a5, a6, a7, a8] = a;
  const [b0, b1, b2, b3, b4, b5, b6, b7, b8] = b;
  return [
    a0 * b0 + a1 * b3 + a2 * b6,
    a0 * b1 + a1 * b4 + a2 * b7,
    a0 * b2 + a1 * b5 + a2 * b8,
    a3 * b0 + a4 * b3 + a5 * b6,
    a3 * b1 + a4 * b4 + a5 * b7,
    a3 * b2 + a4 * b5 + a5 * b8,
    a6 * b0 + a7 * b3 + a8 * b6,
    a6 * b1 + a7 * b4 + a8 * b7,
    a6 * b2 + a7 * b5 + a8 * b8,
  ];
}

function invert(m: MagnetLinesMat3): MagnetLinesMat3 {
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

function apply(
  m: MagnetLinesMat3,
  x: number,
  y: number,
): [number, number, number] {
  const w = m[6] * x + m[7] * y + m[8];
  return [
    (m[0] * x + m[1] * y + m[2]) / w,
    (m[3] * x + m[4] * y + m[5]) / w,
    w,
  ];
}

function viewFor(
  tiltX: number,
  tiltY: number,
  width: number,
  height: number,
  fill: boolean,
): MagnetLinesView {
  const ax = (tiltX * Math.PI) / 180;
  const ay = (tiltY * Math.PI) / 180;
  const depth = Math.max(width, height) * 1.25;
  const tilt: MagnetLinesMat3 = [
    Math.cos(ay),
    0,
    0,
    Math.sin(ax) * Math.sin(ay),
    Math.cos(ax),
    0,
    (Math.sin(ay) * Math.cos(ax)) / depth,
    -Math.sin(ax) / depth,
    1,
  ];
  if (fill) {
    const forward = multiply(
      [1, 0, width / 2, 0, 1, height / 2, 0, 0, 1],
      tilt,
    );
    return { forward, inverse: invert(forward), minScale: 1, maxScale: 1 };
  }
  const corners = [
    apply(tilt, -width / 2, -height / 2),
    apply(tilt, width / 2, -height / 2),
    apply(tilt, width / 2, height / 2),
    apply(tilt, -width / 2, height / 2),
  ];
  const xs = corners.map((point) => point[0]);
  const ys = corners.map((point) => point[1]);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const fit = Math.min(
    1,
    width / Math.max(1, spanX),
    height / Math.max(1, spanY),
  );
  const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
  const midY = (Math.max(...ys) + Math.min(...ys)) / 2;
  const place: MagnetLinesMat3 = [
    fit,
    0,
    width / 2 - midX * fit,
    0,
    fit,
    height / 2 - midY * fit,
    0,
    0,
    1,
  ];
  const forward = multiply(place, tilt);
  const scales = corners.map((point) => fit / Math.abs(point[2]));
  return {
    forward,
    inverse: invert(forward),
    minScale: Math.min(...scales),
    maxScale: Math.max(...scales),
  };
}

function visibleRange(
  view: MagnetLinesView,
  width: number,
  height: number,
  cellX: number,
  cellY: number,
): MagnetLinesRange | null {
  const inverse = view.inverse;
  const edge = Math.max(cellX, cellY) * 2;
  const corners: [number, number][] = [
    [-edge, -edge],
    [width + edge, -edge],
    [width + edge, height + edge],
    [-edge, height + edge],
  ];
  const depthOf = ([x, y]: [number, number]) =>
    inverse[6] * x + inverse[7] * y + inverse[8] - 1 / FAR;
  const hull: [number, number][] = [];
  corners.forEach((from, index) => {
    const to = corners[(index + 1) % corners.length] ?? from;
    const a = depthOf(from);
    const b = depthOf(to);
    if (a >= 0) hull.push(from);
    if (a >= 0 !== b >= 0) {
      const t = a / (a - b);
      hull.push([
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
      ]);
    }
  });
  if (hull.length < 3) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of hull) {
    const point = apply(inverse, x, y);
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  }
  return {
    fromColumn: Math.floor((minX + width / 2) / cellX - 0.5) - 1,
    toColumn: Math.ceil((maxX + width / 2) / cellX - 0.5) + 1,
    fromRow: Math.floor((minY + height / 2) / cellY - 0.5) - 1,
    toRow: Math.ceil((maxY + height / 2) / cellY - 0.5) + 1,
  };
}

export function createMagnetLinesEngine(
  options: MagnetLinesEngineOptions,
): MagnetLinesEngine | null {
  const { container, canvas, probe, getSettings, reduce, onRestored } = options;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'default',
  });
  const program = gl ? link(gl) : null;
  if (!gl || !program) return null;
  const glx = gl;
  const prog = program;
  const uniform = (name: UniformName) => prog.uniforms.get(name) ?? null;

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const cornerBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const centerBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, centerBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);
  const stateBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, stateBuffer);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const field: MagnetLinesField = {
    width: 1,
    height: 1,
    pad: 0,
    ratio: 1,
    view: null,
    length: 20,
    thickness: 2,
    fill: true,
    edgePad: 1,
    minScale: 1,
    maxScale: 1,
    introSpeed: INTRO_SPEED,
    bounds: [0, 0, 0, 0],
    key: '',
  };
  const pointer = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    time: 0,
    seen: false,
    inside: false,
    away: 0,
  };
  const target = { x: 0, y: 0, heading: 0 };
  const pulses: MagnetLinesPulse[] = [];
  let count = 0;
  let centers = new Float32Array(0);
  let cells = new Int32Array(0);
  let reveal = new Float32Array(0);
  let rests = new Float32Array(0);
  let seeds = new Float32Array(0);
  let angles = new Float32Array(0);
  let speeds = new Float32Array(0);
  let seenX = new Float32Array(0);
  let seenY = new Float32Array(0);
  let pending = new Uint8Array(0);
  let state = new Float32Array(0);
  let introStart = -1;
  let introLive = options.intro && !reduce;
  let raf = 0;
  let last = 0;
  let clock = 0;
  let visible = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let lost = false;
  let dirty = true;

  const measure = (value: number | string) => {
    if (typeof value === 'number') return value;
    probe.style.width = String(value);
    return probe.getBoundingClientRect().width;
  };

  const layout = (
    width: number,
    height: number,
    view: MagnetLinesView,
    columnCount: number,
    rowCount: number,
    tiled: boolean,
  ) => {
    const cellX = width / columnCount;
    const cellY = height / rowCount;
    const range = tiled
      ? visibleRange(view, width, height, cellX, cellY)
      : {
          fromColumn: 0,
          toColumn: columnCount - 1,
          fromRow: 0,
          toRow: rowCount - 1,
        };
    const origin = apply(view.forward, 0, 0);
    const found: MagnetLinesCandidate[] = [];
    if (range) {
      for (let row = range.fromRow; row <= range.toRow; row++) {
        const y = (row + 0.5) * cellY - height / 2;
        for (
          let column = range.fromColumn;
          column <= range.toColumn;
          column++
        ) {
          const x = (column + 0.5) * cellX - width / 2;
          const [screenX, screenY, w] = apply(view.forward, x, y);
          if (tiled) {
            if (w <= 0 || w > FAR) continue;
            const margin = (0.49 * Math.min(cellX, cellY)) / w;
            if (
              screenX < -margin ||
              screenX > width + margin ||
              screenY < -margin ||
              screenY > height + margin
            )
              continue;
          }
          found.push({
            x,
            y,
            column,
            row,
            w,
            distance: Math.hypot(screenX - origin[0], screenY - origin[1]),
          });
        }
      }
    }
    if (found.length > MAX_LINES) {
      found.sort((a, b) => a.w - b.w);
      found.length = MAX_LINES;
    }

    const previous = new Map<number, number>();
    for (let index = 0; index < count; index++) {
      previous.set(
        (cells[index * 2] ?? 0) * 65536 + (cells[index * 2 + 1] ?? 0),
        index,
      );
    }
    const total = found.length;
    const next = {
      centers: new Float32Array(total * 2),
      cells: new Int32Array(total * 2),
      reveal: new Float32Array(total),
      seeds: new Float32Array(total),
      rests: new Float32Array(total),
      angles: new Float32Array(total),
      speeds: new Float32Array(total),
      seenX: new Float32Array(total),
      seenY: new Float32Array(total),
      pending: new Uint8Array(total),
    };
    let farthest = 0;
    let nearest = Infinity;
    let deepest = 0;
    const bounds: [number, number, number, number] = [
      Infinity,
      Infinity,
      -Infinity,
      -Infinity,
    ];
    found.forEach((item, index) => {
      next.centers[index * 2] = item.x;
      next.centers[index * 2 + 1] = item.y;
      next.cells[index * 2] = item.column;
      next.cells[index * 2 + 1] = item.row;
      next.reveal[index] = item.distance;
      next.seeds[index] = seedFor(item.column, item.row);
      farthest = Math.max(farthest, item.distance);
      nearest = Math.min(nearest, item.w);
      deepest = Math.max(deepest, item.w);
      bounds[0] = Math.min(bounds[0], item.x);
      bounds[1] = Math.min(bounds[1], item.y);
      bounds[2] = Math.max(bounds[2], item.x);
      bounds[3] = Math.max(bounds[3], item.y);
      const old = previous.get(item.column * 65536 + item.row);
      if (old === undefined) {
        next.pending[index] = 1;
        return;
      }
      next.angles[index] = angles[old] ?? 0;
      next.speeds[index] = speeds[old] ?? 0;
      next.seenX[index] = seenX[old] ?? 0;
      next.seenY[index] = seenY[old] ?? 0;
    });

    count = total;
    ({
      centers,
      cells,
      reveal,
      seeds,
      rests,
      angles,
      speeds,
      seenX,
      seenY,
      pending,
    } = next);
    state = new Float32Array(total * 4);
    field.introSpeed = Math.max(INTRO_SPEED, farthest / INTRO_TIME);
    field.bounds = total ? bounds : [0, 0, 0, 0];
    field.minScale = total ? 1 / deepest : 1;
    field.maxScale = total ? 1 / nearest : 1;
    glx.bindBuffer(glx.ARRAY_BUFFER, centerBuffer);
    glx.bufferData(glx.ARRAY_BUFFER, centers, glx.STATIC_DRAW);
    glx.bindBuffer(glx.ARRAY_BUFFER, stateBuffer);
    glx.bufferData(glx.ARRAY_BUFFER, state.byteLength || 16, glx.DYNAMIC_DRAW);
  };

  const rebuild = () => {
    const s = getSettings();
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const length = Math.max(1, measure(s.lineHeight));
    const thickness = Math.max(0.25, measure(s.lineWidth));
    const fill = !s.square;
    const tiled = fill && (s.tiltX !== 0 || s.tiltY !== 0);
    const view = viewFor(s.tiltX, s.tiltY, width, height, fill);
    const ratio = Math.min(window.devicePixelRatio || 1, s.maxRatio);

    let columnCount = Math.max(
      1,
      Math.round(
        s.columns || (s.rows ? (s.rows * width) / height : width / s.spacing),
      ),
    );
    let rowCount = Math.max(
      1,
      Math.round(
        s.rows ||
          (s.columns ? (s.columns * height) / width : height / s.spacing),
      ),
    );
    if (columnCount * rowCount > MAX_LINES) {
      const shrink = Math.sqrt((columnCount * rowCount) / MAX_LINES);
      columnCount = Math.max(1, Math.floor(columnCount / shrink));
      rowCount = Math.max(1, Math.floor(rowCount / shrink));
    }

    const key = [
      fill,
      columnCount,
      rowCount,
      width.toFixed(1),
      height.toFixed(1),
      tiled ? `${s.tiltX},${s.tiltY}` : '',
    ].join('|');
    if (key !== field.key) {
      field.key = key;
      layout(width, height, view, columnCount, rowCount, tiled);
    }

    const minScale = fill ? field.minScale : view.minScale;
    const maxScale = fill ? field.maxScale : view.maxScale;
    const pad = fill
      ? 0
      : Math.ceil(
          (length * (1 + s.stretch) + thickness * 2) * Math.max(1, maxScale) +
            8,
        );
    const canvasWidth = width + pad * 2;
    const canvasHeight = height + pad * 2;
    canvas.style.left = `${-pad}px`;
    canvas.style.top = `${-pad}px`;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    const pixelWidth = Math.max(1, Math.round(canvasWidth * ratio));
    const pixelHeight = Math.max(1, Math.round(canvasHeight * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    Object.assign(field, {
      width,
      height,
      pad,
      ratio,
      view,
      length,
      thickness,
      fill,
      edgePad: 2 / (ratio * Math.max(0.05, minScale)),
    });
  };

  const fieldAngle = (
    s: MagnetLinesSettings,
    index: number,
    px: number,
    py: number,
  ) => {
    const dx = px - (centers[index * 2] ?? 0);
    const dy = py - (centers[index * 2 + 1] ?? 0);
    if (s.mode === 'dipole') {
      const distance = Math.hypot(dx, dy) || 1;
      const rx = -dx / distance;
      const ry = -dy / distance;
      const mx = Math.cos(target.heading);
      const my = Math.sin(target.heading);
      const dot = mx * rx + my * ry;
      return Math.atan2(3 * dot * ry - my, 3 * dot * rx - mx);
    }
    const toward = Math.atan2(dy, dx);
    if (s.mode === 'attract') return toward;
    if (s.mode === 'spiral') return toward + Math.PI / 4;
    return toward + Math.PI / 2;
  };

  const draw = (s: MagnetLinesSettings, period: number) => {
    glx.bindFramebuffer(glx.FRAMEBUFFER, null);
    glx.viewport(0, 0, canvas.width, canvas.height);
    glx.clearColor(0, 0, 0, 0);
    glx.clear(glx.COLOR_BUFFER_BIT);
    if (!count || !field.view) return;
    glx.useProgram(prog.program);
    glx.uniformMatrix3fv(uniform('uView'), true, field.view.forward);
    glx.uniform2f(
      uniform('uCanvas'),
      field.width + field.pad * 2,
      field.height + field.pad * 2,
    );
    glx.uniform2f(uniform('uOffset'), field.pad, field.pad);
    glx.uniform2f(uniform('uLine'), field.length / 2, field.thickness / 2);
    glx.uniform1f(uniform('uStretch'), s.stretch);
    glx.uniform1f(
      uniform('uHead'),
      s.shape === 'needle' ? 0.16 : s.shape === 'arrow' ? 0.32 : 0,
    );
    glx.uniform1f(uniform('uPad'), field.edgePad);
    glx.uniform1f(uniform('uFar'), field.fill ? FAR : 1e6);
    glx.uniform3fv(uniform('uColor'), s.color);
    glx.uniform3fv(uniform('uAccent'), s.accent);
    glx.uniform1f(uniform('uAccentMix'), s.accentMix);
    glx.uniform1f(uniform('uOpacity'), 1);
    glx.uniform1f(uniform('uFade'), s.fade);
    glx.uniform1i(uniform('uShape'), MAGNET_LINES_SHAPES[s.shape]);
    glx.uniform1f(uniform('uRainbow'), s.rainbow ? 1 : 0);
    glx.uniform1f(uniform('uTone'), s.tone);
    glx.uniform1f(uniform('uPeriod'), period);
    glx.uniform2f(uniform('uPixels'), canvas.width, canvas.height);
    glx.uniform2f(
      uniform('uEdge'),
      s.edgeFade * 0.34 * field.width,
      s.edgeFade * 0.44 * field.height,
    );
    glx.bindVertexArray(vao);
    glx.bindBuffer(glx.ARRAY_BUFFER, stateBuffer);
    glx.bufferSubData(glx.ARRAY_BUFFER, 0, state);
    glx.drawArraysInstanced(glx.TRIANGLE_STRIP, 0, 4, count);
  };

  const frame = (now: number) => {
    raf = 0;
    if (lost) return;
    const s = getSettings();
    const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
    last = Math.max(last, now);
    clock += dt;
    if (dirty) rebuild();
    dirty = false;

    const period = s.shape === 'line' ? Math.PI : TAU;
    const spread = s.scatter * Math.PI * 0.5;
    for (let index = 0; index < count; index++) {
      rests[index] = s.baseAngle + Math.PI / 2 + (seeds[index] ?? 0) * spread;
    }

    const wandering =
      s.idle && !reduce && (!pointer.seen || pointer.away > 1.2);
    if (pointer.seen && !pointer.inside) pointer.away += dt;
    let px = pointer.seen ? pointer.x : 0;
    let py = pointer.seen ? pointer.y : 0;
    if (wandering) {
      const amount = Math.min(field.width, field.height) * 0.32;
      px =
        Math.cos(clock * 0.37) * amount +
        Math.sin(clock * 0.21) * amount * 0.35;
      py = Math.sin(clock * 0.53 + 1.3) * amount * 0.8;
    }
    const follow =
      1 - Math.exp(-dt / (pointer.seen && !wandering ? 0.035 : 0.6));
    target.x += (px - target.x) * follow;
    target.y += (py - target.y) * follow;
    const speed = Math.hypot(pointer.vx, pointer.vy);
    if (speed > 40) {
      const turn = wrap(
        Math.atan2(pointer.vy, pointer.vx) - target.heading,
        TAU,
      );
      target.heading += turn * (1 - Math.exp(-dt / 0.25));
    }
    pointer.vx *= Math.exp(-dt / 0.12);
    pointer.vy *= Math.exp(-dt / 0.12);

    if (introLive && introStart < 0) introStart = clock;
    const introTime = introLive ? clock - introStart : Infinity;
    let introBusy = false;

    const stiffness =
      s.inertia <= 0 || reduce
        ? 0
        : Math.pow(6 + 42 * Math.pow(1 - s.inertia, 2), 2);
    const damping = stiffness
      ? 2 * Math.sqrt(stiffness) * (1 - 0.75 * s.bounce)
      : 0;
    const steps = stiffness ? Math.max(1, Math.ceil(dt / (1 / 240))) : 0;
    const h = steps ? dt / steps : 0;
    const lag = reduce ? 0 : s.ripple / 900;
    const radius = s.radius;
    const reachIn = s.reach * 0.55;
    const reachOut = s.reach;

    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i];
      if (pulse && clock - pulse.start > pulse.life) pulses.splice(i, 1);
    }

    let moving = false;
    for (let index = 0; index < count; index++) {
      const cx = centers[index * 2] ?? 0;
      const cy = centers[index * 2 + 1] ?? 0;
      const born = pending[index] === 1;
      if (born) {
        seenX[index] = target.x;
        seenY[index] = target.y;
      } else {
        const lastX = seenX[index] ?? 0;
        const lastY = seenY[index] ?? 0;
        const distance = Math.hypot(target.x - cx, target.y - cy);
        const tau = lag * distance;
        const k = tau > 0 ? 1 - Math.exp(-dt / tau) : 1;
        seenX[index] = lastX + (target.x - lastX) * k;
        seenY[index] = lastY + (target.y - lastY) * k;
        if (
          Math.abs(target.x - (seenX[index] ?? 0)) +
            Math.abs(target.y - (seenY[index] ?? 0)) >
          0.05
        )
          moving = true;
      }
      const sx = seenX[index] ?? 0;
      const sy = seenY[index] ?? 0;
      const near = Math.hypot(sx - cx, sy - cy);
      let goal = fieldAngle(s, index, sx, sy);
      const rest = rests[index] ?? 0;
      if (reachOut > 0) {
        const t = clamp(
          (reachOut - near) / Math.max(1, reachOut - reachIn),
          0,
          1,
        );
        goal = rest + wrap(goal - rest, period) * smootherstep(t);
      }
      let shown = 1;
      if (introLive) {
        const local =
          (introTime - (reveal[index] ?? 0) / field.introSpeed) / INTRO_SPIN;
        const progress = smootherstep(clamp(local, 0, 1));
        if (local < 1) introBusy = true;
        goal = rest + wrap(goal - rest, period) * progress;
        shown = clamp(local * 2.5, 0, 1);
      }
      if (born) {
        angles[index] = introLive ? rest : goal;
        speeds[index] = 0;
        pending[index] = 0;
      } else if (!stiffness) {
        const current = angles[index] ?? 0;
        angles[index] = current + wrap(goal - current, period);
        speeds[index] = 0;
      } else {
        let angle = angles[index] ?? 0;
        let velocity = speeds[index] ?? 0;
        for (let step = 0; step < steps; step++) {
          velocity +=
            (stiffness * wrap(goal - angle, period) - damping * velocity) * h;
          angle += velocity * h;
        }
        if (
          Math.abs(velocity) < 0.002 &&
          Math.abs(wrap(goal - angle, period)) < 0.0005
        ) {
          angle += wrap(goal - angle, period);
          velocity = 0;
        } else moving = true;
        if (angle > 40 || angle < -40) angle = wrap(angle, TAU);
        angles[index] = angle;
        speeds[index] = velocity;
      }

      let spin = 0;
      let flash = 0;
      for (const pulse of pulses) {
        const travelled = (clock - pulse.start) * PULSE_SPEED;
        const gap = Math.hypot(cx - pulse.x, cy - pulse.y);
        const local = (travelled - gap) / (PULSE_SPEED * PULSE_SPIN);
        if (local > 0 && local < 1) spin += smootherstep(local) * period;
        const band = (travelled - gap - PULSE_SPEED * PULSE_SPIN * 0.5) / 60;
        flash +=
          Math.exp(-band * band) *
          Math.max(0, 1 - (clock - pulse.start) / pulse.life);
      }

      const emphasis = Math.exp(-(near * near) / (radius * radius)) * shown;
      state[index * 4] = (angles[index] ?? 0) + spin;
      state[index * 4 + 1] = emphasis;
      state[index * 4 + 2] = Math.min(1, flash * 0.9) * shown;
      state[index * 4 + 3] = shown;
    }
    if (introLive && !introBusy && clock - introStart > 0.2) introLive = false;
    if (Math.abs(px - target.x) + Math.abs(py - target.y) > 0.05) moving = true;

    draw(s, period);

    const busy = moving || introLive || pulses.length > 0 || wandering;
    if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf || lost || !visible || !pageVisible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const toPlane = (clientX: number, clientY: number) => {
    if (!field.view) return null;
    const rect = container.getBoundingClientRect();
    const [x, y, w] = apply(
      field.view.inverse,
      clientX - rect.left,
      clientY - rect.top,
    );
    if (w <= 0) return null;
    const inside =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;
    return { x, y, inside };
  };

  const pointerMove = (clientX: number, clientY: number) => {
    const spot = toPlane(clientX, clientY);
    if (!spot) return;
    const now = performance.now();
    const dt = Math.max(1, now - pointer.time) / 1000;
    if (pointer.seen && dt < 0.2) {
      pointer.vx = pointer.vx * 0.6 + ((spot.x - pointer.x) / dt) * 0.4;
      pointer.vy = pointer.vy * 0.6 + ((spot.y - pointer.y) / dt) * 0.4;
    }
    pointer.time = now;
    pointer.x = spot.x;
    pointer.y = spot.y;
    pointer.seen = true;
    pointer.inside = spot.inside;
    if (spot.inside) pointer.away = 0;
    wake();
  };

  const pointerDown = (clientX: number, clientY: number) => {
    pointerMove(clientX, clientY);
    const s = getSettings();
    if (!s.clickPulse || reduce || !count) return;
    const spot = toPlane(clientX, clientY);
    if (!spot) return;
    const inside = field.fill
      ? spot.inside
      : Math.abs(spot.x) <= field.width / 2 &&
        Math.abs(spot.y) <= field.height / 2;
    if (!inside) return;
    const [minX, minY, maxX, maxY] = field.bounds;
    const farthest = Math.max(
      Math.hypot(spot.x - minX, spot.y - minY),
      Math.hypot(spot.x - maxX, spot.y - minY),
      Math.hypot(spot.x - minX, spot.y - maxY),
      Math.hypot(spot.x - maxX, spot.y - maxY),
    );
    pulses.push({
      x: spot.x,
      y: spot.y,
      start: clock,
      life: Math.min(6, farthest / PULSE_SPEED + PULSE_SPIN + 0.1),
    });
    if (pulses.length > 6) pulses.shift();
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

  wake();

  return {
    refresh() {
      dirty = true;
      wake();
    },
    pointerMove,
    pointerDown,
    pointerLeave() {
      pointer.inside = false;
      wake();
    },
    setVisible(next: boolean) {
      visible = next;
      wake();
    },
    visibilityChanged() {
      pageVisible = document.visibilityState !== 'hidden';
      wake();
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      lost = true;
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!glx.isContextLost()) {
        glx.deleteBuffer(cornerBuffer);
        glx.deleteBuffer(centerBuffer);
        glx.deleteBuffer(stateBuffer);
        glx.deleteVertexArray(vao);
        glx.deleteProgram(prog.program);
      }
    },
  };
}
