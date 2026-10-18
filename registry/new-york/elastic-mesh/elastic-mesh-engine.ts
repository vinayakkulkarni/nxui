import {
  ELASTIC_MESH_SHADOW,
  ELASTIC_MESH_SURFACE,
  ELASTIC_MESH_VERTEX,
} from './elastic-mesh-shaders';
import {
  at,
  blurField,
  clamp,
  distanceField,
  inflateField,
  nearestLabels,
} from './elastic-mesh-field';
import type {
  ElasticMeshEngine,
  ElasticMeshPart,
  ElasticMeshPointerInput,
  ElasticMeshSettings,
} from './types';

const MAX_FIELD = 720;
const MAX_NODES = 5200;
const STEP = 1 / 480;

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

const SURFACE_UNIFORMS = [
  'uViewport',
  'uOffset',
  'uField',
  'uPaint',
  'uSlope',
  'uColor',
  'uPaintMix',
  'uMaterial',
  'uLight',
  'uInflate',
  'uTurn',
  'uClock',
  'uParts',
] as const;

const SHADOW_UNIFORMS = [
  'uViewport',
  'uOffset',
  'uField',
  'uShadowColor',
  'uShadow',
  'uClock',
  'uParts',
] as const;

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (gl: WebGL2RenderingContext, fragmentSource: string) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, ELASTIC_MESH_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.bindAttribLocation(program, 1, 'aRest');
  gl.bindAttribLocation(program, 2, 'aStrain');
  gl.bindAttribLocation(program, 3, 'aDent');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
};

const locate = <T extends string>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: readonly T[],
) => {
  const result = {} as Record<T, WebGLUniformLocation | null>;
  for (const name of names) result[name] = gl.getUniformLocation(program, name);
  return result;
};

export const createElasticMeshEngine = (
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => ElasticMeshSettings,
): ElasticMeshEngine | null => {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const surfaceProgram = link(gl, ELASTIC_MESH_SURFACE);
  const shadowProgram = link(gl, ELASTIC_MESH_SHADOW);
  if (!surfaceProgram || !shadowProgram) {
    if (surfaceProgram) gl.deleteProgram(surfaceProgram);
    if (shadowProgram) gl.deleteProgram(shadowProgram);
    return null;
  }
  const surface = locate(gl, surfaceProgram, SURFACE_UNIFORMS);
  const shade = locate(gl, shadowProgram, SHADOW_UNIFORMS);

  const fieldTexture = gl.createTexture();
  const paintTexture = gl.createTexture();
  const slopeTexture = gl.createTexture();
  for (const texture of [fieldTexture, paintTexture, slopeTexture]) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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
  }

  const vao = gl.createVertexArray();
  const restBuffer = gl.createBuffer();
  const dynamicBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, restBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, dynamicBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 36, 0);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 8);
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 36, 24);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bindVertexArray(null);

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const partData = new Float32Array(256);
  const turnMatrix = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  const shortIndex: number = gl.UNSIGNED_SHORT;
  const noParts: ElasticMeshPart[] = [];
  const baseColor: [number, number, number] = [0.31, 0.42, 1];
  const mesh = {
    cols: 0,
    rows: 0,
    spacing: 1,
    count: 0,
    indices: 0,
    restX: new Float32Array(0),
    restY: new Float32Array(0),
    x: new Float32Array(0),
    y: new Float32Array(0),
    vx: new Float32Array(0),
    vy: new Float32Array(0),
    dent: new Float32Array(0),
    dentV: new Float32Array(0),
    grip: new Float32Array(0),
    gripX: new Float32Array(0),
    gripY: new Float32Array(0),
    active: new Uint8Array(0),
    neighbors: new Int32Array(0),
    dynamic: new Float32Array(0),
    anchorX: new Float32Array(0),
    anchorY: new Float32Array(0),
    indexType: shortIndex,
    activeCount: 0,
    width: 1,
    height: 1,
  };
  const initial = getSettings();
  const state = {
    width: 1,
    height: 1,
    ready: false,
    fieldWidth: 1,
    fieldHeight: 1,
    fieldScale: 1,
    sdf: new Float32Array(0),
    parts: noParts,
    clock: initial.intro && !initial.reduce ? 0 : 10,
    colorKey: '',
    color: baseColor,
    pointer: {
      x: 0,
      y: 0,
      inside: false,
      down: false,
      startX: 0,
      startY: 0,
      startTime: 0,
      dragging: false,
    },
    hover: { x: 0, y: 0, vx: 0, vy: 0, power: 0 },
    turn: { x: 0, y: 0, vx: 0, vy: 0 },
    accumulator: 0,
    buildToken: 0,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = true;
  let resizeTimer = 0;

  const toRgb = (value: string): [number, number, number] => {
    if (!probe || !value) return [0.31, 0.42, 1];
    probe.fillStyle = '#000000';
    probe.fillStyle = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
    probe.fillRect(0, 0, 1, 1);
    const data = probe.getImageData(0, 0, 1, 1).data;
    return [at(data, 0) / 255, at(data, 1) / 255, at(data, 2) / 255];
  };

  const sampleSdf = (px: number, py: number) => {
    const fx = clamp(
      Math.round(px * state.fieldScale),
      0,
      state.fieldWidth - 1,
    );
    const fy = clamp(
      Math.round(py * state.fieldScale),
      0,
      state.fieldHeight - 1,
    );
    return state.sdf[fy * state.fieldWidth + fx] || -1e6;
  };

  const writeDynamic = () => {
    const { cols, rows, x, y, dent, dynamic, spacing } = mesh;
    const sx = mesh.width / Math.max(1, cols - 1);
    const sy = mesh.height / Math.max(1, rows - 1);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const l = i > 0 ? k - 1 : k;
        const r = i < cols - 1 ? k + 1 : k;
        const u = j > 0 ? k - cols : k;
        const d = j < rows - 1 ? k + cols : k;
        const spanX = (r - l) * sx || spacing;
        const spanY = ((d - u) / cols) * sy || spacing;
        const o = k * 9;
        dynamic[o] = at(x, k);
        dynamic[o + 1] = at(y, k);
        dynamic[o + 2] = (at(x, r) - at(x, l)) / spanX;
        dynamic[o + 3] = (at(y, r) - at(y, l)) / spanX;
        dynamic[o + 4] = (at(x, d) - at(x, u)) / spanY;
        dynamic[o + 5] = (at(y, d) - at(y, u)) / spanY;
        dynamic[o + 6] = at(dent, k);
        dynamic[o + 7] = (at(dent, r) - at(dent, l)) / spanX;
        dynamic[o + 8] = (at(dent, d) - at(dent, u)) / spanY;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, dynamicBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, dynamic, gl.DYNAMIC_DRAW);
  };

  const buildMesh = () => {
    const { width, height } = state;
    const spacing = Math.max(7, Math.sqrt((width * height) / MAX_NODES));
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    const count = cols * rows;
    const sx = width / (cols - 1);
    const sy = height / (rows - 1);
    mesh.cols = cols;
    mesh.rows = rows;
    mesh.width = width;
    mesh.height = height;
    mesh.spacing = (sx + sy) / 2;
    mesh.count = count;
    mesh.restX = new Float32Array(count);
    mesh.restY = new Float32Array(count);
    mesh.x = new Float32Array(count);
    mesh.y = new Float32Array(count);
    mesh.vx = new Float32Array(count);
    mesh.vy = new Float32Array(count);
    mesh.dent = new Float32Array(count);
    mesh.dentV = new Float32Array(count);
    mesh.grip = new Float32Array(count);
    mesh.gripX = new Float32Array(count);
    mesh.gripY = new Float32Array(count);
    mesh.active = new Uint8Array(count);
    mesh.dynamic = new Float32Array(count * 9);
    const rest = new Float32Array(count * 2);
    const reach = -2.5 * mesh.spacing;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const px = i * sx;
        const py = j * sy;
        mesh.restX[k] = px;
        mesh.restY[k] = py;
        mesh.x[k] = px;
        mesh.y[k] = py;
        rest[k * 2] = px / width;
        rest[k * 2 + 1] = py / height;
        mesh.active[k] = state.ready && sampleSdf(px, py) > reach ? 1 : 0;
      }
    }
    const neighbors = new Int32Array(count * 8).fill(-1);
    let activeCount = 0;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        if (!mesh.active[k]) continue;
        activeCount++;
        NEIGHBOR_OFFSETS.forEach(([di, dj], n) => {
          const ni = i + di;
          const nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) return;
          const nk = nj * cols + ni;
          if (mesh.active[nk]) neighbors[k * 8 + n] = nk;
        });
      }
    }
    mesh.neighbors = neighbors;
    mesh.activeCount = activeCount;
    const margin = -(Math.min(width, height) * 0.14 + mesh.spacing * 3);
    const near = new Uint8Array(count);
    for (let k = 0; k < count; k++)
      near[k] =
        state.ready && sampleSdf(at(mesh.restX, k), at(mesh.restY, k)) > margin
          ? 1
          : 0;
    const quads: number[] = [];
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = j * cols + i;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        if (near[a] || near[b] || near[c] || near[d])
          quads.push(a, c, b, b, c, d);
      }
    }
    const indexData =
      count > 65535 ? new Uint32Array(quads) : new Uint16Array(quads);
    mesh.indexType = count > 65535 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    mesh.indices = quads.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, restBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rest, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
    writeDynamic();
  };

  const drawShape = async (
    ctx: CanvasRenderingContext2D,
    fw: number,
    fh: number,
    s: ElasticMeshSettings,
    token: number,
  ) => {
    if (s.src) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.src = s.src;
      try {
        await image.decode();
      } catch {
        return false;
      }
      if (token !== state.buildToken) return false;
      const fit = Math.min(
        (fw * 0.78) / image.naturalWidth,
        (fh * 0.74) / image.naturalHeight,
      );
      const w = image.naturalWidth * fit;
      const h = image.naturalHeight * fit;
      ctx.drawImage(image, (fw - w) / 2, (fh - h) / 2, w, h);
      return true;
    }
    const family = s.fontFamily;
    const weight = s.fontWeight;
    await document.fonts?.load(`${weight} 100px ${family}`).catch(() => null);
    if (token !== state.buildToken) return false;
    const lines = s.text.split('\n');
    ctx.font = `${weight} 100px ${family}`;
    let widest = 1;
    let ascent = 0;
    let descent = 0;
    for (const line of lines) {
      const m = ctx.measureText(line || ' ');
      widest = Math.max(
        widest,
        m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      );
      ascent = Math.max(ascent, m.actualBoundingBoxAscent);
      descent = Math.max(descent, m.actualBoundingBoxDescent);
    }
    const lineHeight = 100 * 1.02;
    const blockHeight = ascent + descent + lineHeight * (lines.length - 1);
    const size = Math.min((fw * 0.8) / widest, (fh * 0.7) / blockHeight) * 100;
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const k = size / 100;
    const top = (fh - blockHeight * k) / 2 + ascent * k;
    lines.forEach((line, index) => {
      const m = ctx.measureText(line || ' ');
      const shift = (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
      ctx.fillText(line, fw / 2 + shift, top + index * lineHeight * k);
    });
    return true;
  };

  const rasterize = async () => {
    const s = getSettings();
    const token = ++state.buildToken;
    const { width, height } = state;
    const scale = Math.min(1, MAX_FIELD / Math.max(width, height));
    const fw = Math.max(8, Math.round(width * scale));
    const fh = Math.max(8, Math.round(height * scale));
    const canvas2d = document.createElement('canvas');
    canvas2d.width = fw;
    canvas2d.height = fh;
    const ctx = canvas2d.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const drawn = await drawShape(ctx, fw, fh, s, token);
    if (!drawn || token !== state.buildToken || !alive) return;

    const pixels = ctx.getImageData(0, 0, fw, fh).data;
    const count = fw * fh;
    const mask = new Float32Array(count);
    const inside = new Float64Array(count);
    const outside = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      const a = at(pixels, i * 4 + 3) / 255;
      mask[i] = a;
      inside[i] = a > 0.5 ? 1e10 : 0;
      outside[i] = a > 0.5 ? 0 : 1e10;
    }
    distanceField(inside, fw, fh);
    distanceField(outside, fw, fh);
    const binary = new Float32Array(count);
    const signed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const m = at(mask, i);
      binary[i] = m > 0.5 ? 1 : 0;
      const din = at(inside, i);
      signed[i] =
        m > 0.02 && m < 0.98
          ? m - 0.5
          : din > 0
            ? din - 0.5
            : 0.5 - at(outside, i);
    }
    const labels = new Int32Array(count);
    const parts: ElasticMeshPart[] = [];
    const queue = new Int32Array(count);
    const visit = (j: number, id: number, tail: number) => {
      if (at(binary, j) && !at(labels, j)) {
        labels[j] = id;
        queue[tail] = j;
        return tail + 1;
      }
      return tail;
    };
    for (let start = 0; start < count; start++) {
      if (!at(binary, start) || at(labels, start)) continue;
      const id = parts.length + 1;
      let head = 0;
      let tail = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = Infinity;
      queue[tail++] = start;
      labels[start] = id;
      while (head < tail) {
        const i = at(queue, head++);
        const x = i % fw;
        const y = (i - x) / fw;
        sumX += x;
        sumY += y;
        if (x < minX) minX = x;
        if (x > 0) tail = visit(i - 1, id, tail);
        if (x < fw - 1) tail = visit(i + 1, id, tail);
        if (y > 0) tail = visit(i - fw, id, tail);
        if (y < fh - 1) tail = visit(i + fw, id, tail);
      }
      parts.push({
        x: sumX / tail / scale,
        y: sumY / tail / scale,
        left: minX,
        size: tail,
        delay: 0,
      });
    }
    const order = [...parts].sort((a, b) => a.left - b.left);
    const gap = order.length > 1 ? Math.min(0.07, 0.5 / (order.length - 1)) : 0;
    order.forEach((part, rank) => {
      part.delay = rank * gap;
    });
    const owners =
      parts.length <= 64
        ? nearestLabels(labels, fw, fh)
        : new Float32Array(count);
    const solution = blurField(inflateField(binary, fw, fh), fw, fh, 2);
    const edges = blurField(signed, fw, fh, 2);
    const shadowMask = blurField(
      binary,
      fw,
      fh,
      Math.max(4, Math.min(fw, fh) * 0.045),
    );
    const field = new Float32Array(count * 4);
    const sdf = new Float32Array(count);
    const heights = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const distance = at(edges, i) / scale;
      const h = Math.sqrt(Math.max(0, 2 * at(solution, i))) / scale;
      sdf[i] = distance;
      heights[i] = h;
      field[i * 4] = h;
      field[i * 4 + 1] = distance;
      field[i * 4 + 2] = at(shadowMask, i);
      field[i * 4 + 3] = at(owners, i);
    }
    const slopes = new Float32Array(count * 2);
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        const i = y * fw + x;
        let gx =
          (at(heights, y * fw + Math.min(fw - 1, x + 1)) -
            at(heights, y * fw + Math.max(0, x - 1))) *
          0.5 *
          scale;
        let gy =
          (at(heights, Math.min(fh - 1, y + 1) * fw + x) -
            at(heights, Math.max(0, y - 1) * fw + x)) *
          0.5 *
          scale;
        const steep = Math.hypot(gx, gy);
        if (steep > 7) {
          gx *= 7 / steep;
          gy *= 7 / steep;
        }
        slopes[i * 2] = gx;
        slopes[i * 2 + 1] = gy;
      }
    }
    gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      fw,
      fh,
      0,
      gl.RGBA,
      gl.FLOAT,
      field,
    );
    gl.bindTexture(gl.TEXTURE_2D, slopeTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RG16F,
      fw,
      fh,
      0,
      gl.RG,
      gl.FLOAT,
      slopes,
    );
    gl.bindTexture(gl.TEXTURE_2D, paintTexture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      canvas2d,
    );
    state.fieldWidth = fw;
    state.fieldHeight = fh;
    state.fieldScale = scale;
    state.sdf = sdf;
    state.parts = parts;
    partData.fill(0);
    parts.slice(0, 64).forEach((part, index) => {
      partData[index * 4] = part.x / width;
      partData[index * 4 + 1] = part.y / height;
      partData[index * 4 + 2] = part.delay;
    });
    state.ready = true;
    buildMesh();
    wake();
  };

  const solve = (dt: number, s: ElasticMeshSettings) => {
    const {
      count,
      x,
      y,
      vx,
      vy,
      restX,
      restY,
      dent,
      dentV,
      active,
      neighbors,
      grip,
      gripX,
      gripY,
      spacing,
    } = mesh;
    const firm = 0.4 + s.stiffness * 1.2;
    const anchor = 350 * firm * firm;
    const couple = anchor * (52 / Math.sqrt(firm) / spacing) ** 2;
    const ratio = s.reduce ? 0.8 : 0.5 - s.wobble * 0.42;
    const damping = 2 * ratio * Math.sqrt(anchor);
    const dentAnchor = anchor * 1.4;
    const dentCouple = dentAnchor * (18 / spacing) ** 2;
    const dentDamping = 2 * (ratio + 0.06) * Math.sqrt(dentAnchor);
    const gripStiffness = anchor * 30;
    const gripDamping = 1.2 * Math.sqrt(gripStiffness);
    const brush = state.pointer.dragging ? 0 : 10;
    const hover = state.hover;
    const pressRadius = s.grabRadius * 0.32;
    const pressInv = 1 / (2 * pressRadius * pressRadius);
    const pressPower = hover.power * s.press;
    const pressDepth = state.pointer.dragging ? 1.6 : 1;
    let energy = 0;
    for (let k = 0; k < count; k++) {
      if (!active[k]) continue;
      const xk = at(x, k);
      const yk = at(y, k);
      const vxk = at(vx, k);
      const vyk = at(vy, k);
      const dk = at(dent, k);
      const ux = xk - at(restX, k);
      const uy = yk - at(restY, k);
      let ax = -anchor * ux - damping * vxk;
      let ay = -anchor * uy - damping * vyk;
      let ad = -dentAnchor * dk - dentDamping * at(dentV, k);
      const base = k * 8;
      for (let n = 0; n < 8; n++) {
        const m = at(neighbors, base + n);
        if (m < 0) continue;
        const weight = n < 4 ? 1 : 0.5;
        ax += couple * weight * (at(x, m) - at(restX, m) - ux);
        ay += couple * weight * (at(y, m) - at(restY, m) - uy);
        ad += dentCouple * weight * (at(dent, m) - dk);
      }
      if (pressPower > 0.001) {
        const dx = xk - hover.x;
        const dy = yk - hover.y;
        const falloff = Math.exp(-(dx * dx + dy * dy) * pressInv);
        ad += dentAnchor * 2.6 * pressDepth * pressPower * falloff;
        ax += (anchor * 0.3 * dx + brush * hover.vx) * pressPower * falloff;
        ay += (anchor * 0.3 * dy + brush * hover.vy) * pressPower * falloff;
      }
      const g = at(grip, k);
      if (g > 0) {
        ax += g * (gripStiffness * (at(gripX, k) - xk) - gripDamping * vxk);
        ay += g * (gripStiffness * (at(gripY, k) - yk) - gripDamping * vyk);
      }
      const nvx = vxk + ax * dt;
      const nvy = vyk + ay * dt;
      const ndv = at(dentV, k) + ad * dt;
      vx[k] = nvx;
      vy[k] = nvy;
      dentV[k] = ndv;
      energy += Math.abs(nvx) + Math.abs(nvy) + Math.abs(ndv) * spacing;
    }
    for (let k = 0; k < count; k++) {
      if (!active[k]) continue;
      x[k] = at(x, k) + at(vx, k) * dt;
      y[k] = at(y, k) + at(vy, k) * dt;
      dent[k] = clamp(at(dent, k) + at(dentV, k) * dt, -0.6, 0.85);
    }
    return energy;
  };

  const updateGrip = (s: ElasticMeshSettings) => {
    const { pointer } = state;
    const { count, grip, gripX, gripY } = mesh;
    if (!pointer.dragging) return;
    const limit = Math.max(
      20,
      Math.min(state.width, state.height) * (0.08 + s.stretch * 0.32),
    );
    const dx = pointer.x - pointer.startX;
    const dy = pointer.y - pointer.startY;
    const length = Math.hypot(dx, dy);
    const eased = length > 0 ? (limit * Math.tanh(length / limit)) / length : 0;
    for (let k = 0; k < count; k++) {
      if (at(grip, k) <= 0) continue;
      gripX[k] = at(mesh.anchorX, k) + dx * eased;
      gripY[k] = at(mesh.anchorY, k) + dy * eased;
    }
  };

  const grab = (px: number, py: number, s: ElasticMeshSettings) => {
    const { count, x, y, grip, active } = mesh;
    const radius = s.grabRadius * 0.3;
    const inv = 1 / (2 * radius * radius);
    mesh.anchorX = new Float32Array(count);
    mesh.anchorY = new Float32Array(count);
    let total = 0;
    for (let k = 0; k < count; k++) {
      if (!active[k]) continue;
      const dx = at(x, k) - px;
      const dy = at(y, k) - py;
      const weight = Math.exp(-(dx * dx + dy * dy) * inv);
      const g = weight > 0.03 ? weight : 0;
      grip[k] = g;
      mesh.anchorX[k] = at(x, k);
      mesh.anchorY[k] = at(y, k);
      total += g;
    }
    return total > 0;
  };

  const release = () => {
    mesh.grip.fill(0);
    state.pointer.dragging = false;
  };

  const poke = (px: number, py: number, s: ElasticMeshSettings) => {
    const { count, x, y, vx, vy, dentV, active } = mesh;
    const radius = s.grabRadius;
    const inv = 1 / (2 * radius * radius);
    const strength = 0.4 + s.press;
    for (let k = 0; k < count; k++) {
      if (!active[k]) continue;
      const dx = at(x, k) - px;
      const dy = at(y, k) - py;
      const falloff = Math.exp(-(dx * dx + dy * dy) * inv);
      dentV[k] = at(dentV, k) + 9 * strength * falloff;
      vx[k] = at(vx, k) + dx * 9 * strength * falloff;
      vy[k] = at(vy, k) + dy * 9 * strength * falloff;
    }
  };

  const onSurface = (px: number, py: number) => {
    const { cols, rows, x, y, active, spacing } = mesh;
    let best = Infinity;
    let bestK = -1;
    const range = Math.ceil(80 / spacing);
    const ci = clamp(
      Math.round(px / (mesh.width / Math.max(1, cols - 1))),
      0,
      cols - 1,
    );
    const cj = clamp(
      Math.round(py / (mesh.height / Math.max(1, rows - 1))),
      0,
      rows - 1,
    );
    for (
      let j = Math.max(0, cj - range);
      j <= Math.min(rows - 1, cj + range);
      j++
    ) {
      for (
        let i = Math.max(0, ci - range);
        i <= Math.min(cols - 1, ci + range);
        i++
      ) {
        const k = j * cols + i;
        if (!active[k]) continue;
        const d = Math.hypot(at(x, k) - px, at(y, k) - py);
        if (d < best) {
          best = d;
          bestK = k;
        }
      }
    }
    if (bestK < 0) return false;
    return (
      sampleSdf(
        at(mesh.restX, bestK) + (px - at(x, bestK)),
        at(mesh.restY, bestK) + (py - at(y, bestK)),
      ) > -4
    );
  };

  const resize = () => {
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    if (width !== state.width || height !== state.height) {
      const first = !state.ready && !state.buildToken;
      state.width = width;
      state.height = height;
      window.clearTimeout(resizeTimer);
      if (first) void rasterize();
      else resizeTimer = window.setTimeout(() => void rasterize(), 160);
    }
    wake();
  };

  const render = () => {
    const s = getSettings();
    if (s.color !== state.colorKey) {
      state.colorKey = s.color;
      state.color = toRgb(s.color);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!state.ready || !mesh.indices) return;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, paintTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, slopeTexture);

    if (s.shadow > 0) {
      gl.useProgram(shadowProgram);
      gl.uniform2f(shade.uViewport, mesh.width, mesh.height);
      const drop = Math.min(mesh.width, mesh.height) * 0.035 * s.inflate;
      gl.uniform2f(shade.uOffset, drop * 0.25, drop);
      gl.uniform1i(shade.uField, 0);
      if (s.light) gl.uniform3f(shade.uShadowColor, 0.08, 0.08, 0.14);
      else gl.uniform3f(shade.uShadowColor, 0, 0, 0);
      gl.uniform1f(shade.uShadow, s.shadow * (s.light ? 0.35 : 0.7));
      gl.uniform1f(shade.uClock, state.clock);
      gl.uniform4fv(shade.uParts, partData);
      gl.drawElements(gl.TRIANGLES, mesh.indices, mesh.indexType, 0);
    }

    gl.useProgram(surfaceProgram);
    gl.uniform2f(surface.uViewport, mesh.width, mesh.height);
    gl.uniform2f(surface.uOffset, 0, 0);
    gl.uniform1i(surface.uField, 0);
    gl.uniform1i(surface.uPaint, 1);
    gl.uniform1i(surface.uSlope, 2);
    const yaw = state.turn.x;
    const pitch = state.turn.y;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    turnMatrix[0] = cy;
    turnMatrix[1] = sy * sp;
    turnMatrix[2] = -sy * cp;
    turnMatrix[3] = 0;
    turnMatrix[4] = cp;
    turnMatrix[5] = sp;
    turnMatrix[6] = sy;
    turnMatrix[7] = -cy * sp;
    turnMatrix[8] = cy * cp;
    gl.uniformMatrix3fv(surface.uTurn, false, turnMatrix);
    gl.uniform3f(
      surface.uColor,
      state.color[0],
      state.color[1],
      state.color[2],
    );
    gl.uniform1f(surface.uPaintMix, s.src && s.imageColors ? 1 : 0);
    gl.uniform1f(surface.uMaterial, s.material);
    gl.uniform1f(surface.uLight, s.light ? 1 : 0);
    gl.uniform1f(surface.uInflate, s.inflate);
    gl.uniform1f(surface.uClock, state.clock);
    gl.uniform4fv(surface.uParts, partData);
    gl.drawElements(gl.TRIANGLES, mesh.indices, mesh.indexType, 0);
    gl.bindVertexArray(null);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive || !visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;

    if (s.reduce || !s.intro) state.clock = 10;
    else if (state.ready && state.clock < 10)
      state.clock = state.clock + dt > 1.8 ? 10 : state.clock + dt;

    const hover = state.hover;
    const pointer = state.pointer;
    const pressing =
      state.ready &&
      (pointer.dragging ||
        (pointer.inside && !pointer.down && onSurface(pointer.x, pointer.y)));
    const follow = 1 - Math.exp(-dt / 0.05);
    const nextX = hover.x + (pointer.x - hover.x) * follow;
    const nextY = hover.y + (pointer.y - hover.y) * follow;
    const blend = 1 - Math.exp(-dt / 0.04);
    hover.vx += ((nextX - hover.x) / Math.max(dt, 0.001) - hover.vx) * blend;
    hover.vy += ((nextY - hover.y) / Math.max(dt, 0.001) - hover.vy) * blend;
    hover.x = nextX;
    hover.y = nextY;
    const goal = pressing ? 1 : 0;
    hover.power +=
      (goal - hover.power) * (1 - Math.exp(-dt / (pressing ? 0.12 : 0.25)));

    const turn = state.turn;
    const aimX =
      pointer.inside && !s.reduce
        ? (pointer.x / Math.max(1, mesh.width) - 0.5) * 0.7
        : 0;
    const aimY =
      pointer.inside && !s.reduce
        ? (pointer.y / Math.max(1, mesh.height) - 0.5) * 0.4
        : 0;
    turn.vx += (28 * (aimX - turn.x) - 10 * turn.vx) * dt;
    turn.vy += (28 * (aimY - turn.y) - 10 * turn.vy) * dt;
    turn.x += turn.vx * dt;
    turn.y += turn.vy * dt;
    const turning =
      Math.abs(aimX - turn.x) > 0.0005 ||
      Math.abs(aimY - turn.y) > 0.0005 ||
      Math.abs(turn.vx) > 0.001 ||
      Math.abs(turn.vy) > 0.001;

    let energy = 0;
    if (state.ready) {
      updateGrip(s);
      state.accumulator += dt;
      let steps = 0;
      while (state.accumulator >= STEP && steps < 40) {
        energy = solve(STEP, s);
        state.accumulator -= STEP;
        steps++;
      }
      if (steps === 40) state.accumulator = 0;
      writeDynamic();
    }
    render();

    const settling =
      !state.ready ||
      state.clock < 10 ||
      Math.abs(goal - hover.power) > 0.002 ||
      turning ||
      Math.hypot(pointer.x - hover.x, pointer.y - hover.y) > 0.1 ||
      pointer.dragging ||
      energy > 0.05 * Math.max(1, mesh.activeCount);
    if (settling) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  function wake() {
    if (!raf && alive && visible && !document.hidden)
      raf = requestAnimationFrame(frame);
  }

  const locatePointer = (event: ElasticMeshPointerInput) => {
    const rect = container.getBoundingClientRect();
    state.pointer.x = event.clientX - rect.left;
    state.pointer.y = event.clientY - rect.top;
    state.pointer.inside =
      state.pointer.x >= 0 &&
      state.pointer.y >= 0 &&
      state.pointer.x <= rect.width &&
      state.pointer.y <= rect.height;
  };

  resize();

  return {
    resize,
    rebuild: () => {
      const s = getSettings();
      state.ready = false;
      state.clock = s.intro && !s.reduce ? 0 : 10;
      void rasterize();
    },
    wake: () => {
      if (!raf) render();
      wake();
    },
    setVisible: (value) => {
      visible = value;
      if (visible) {
        last = 0;
        wake();
      }
    },
    resume: () => {
      last = 0;
      wake();
    },
    pointerMove: (event) => {
      locatePointer(event);
      wake();
    },
    pointerDown: (event) => {
      locatePointer(event);
      if (!state.ready || !onSurface(state.pointer.x, state.pointer.y))
        return false;
      const s = getSettings();
      state.pointer.down = true;
      state.pointer.startX = state.pointer.x;
      state.pointer.startY = state.pointer.y;
      state.pointer.startTime = performance.now();
      state.pointer.dragging = grab(state.pointer.x, state.pointer.y, s);
      if (event.pointerId !== undefined)
        container.setPointerCapture?.(event.pointerId);
      wake();
      return true;
    },
    pointerUp: (event) => {
      if (!state.pointer.down) return;
      locatePointer(event);
      const s = getSettings();
      const moved = Math.hypot(
        state.pointer.x - state.pointer.startX,
        state.pointer.y - state.pointer.startY,
      );
      const quick = performance.now() - state.pointer.startTime < 260;
      release();
      if (moved < 8 && quick) poke(state.pointer.x, state.pointer.y, s);
      state.pointer.down = false;
      wake();
    },
    pointerLeave: () => {
      state.pointer.inside = false;
      wake();
    },
    pokePart: (index) => {
      if (!state.ready || !state.parts.length) return -1;
      const order = [...state.parts].sort((a, b) => a.left - b.left);
      const slot = ((index % order.length) + order.length) % order.length;
      const part = order[slot]!;
      poke(part.x, part.y, getSettings());
      wake();
      return slot;
    },
    destroy: () => {
      alive = false;
      state.buildToken++;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      gl.deleteBuffer(restBuffer);
      gl.deleteBuffer(dynamicBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteTexture(fieldTexture);
      gl.deleteTexture(paintTexture);
      gl.deleteTexture(slopeTexture);
      gl.deleteProgram(surfaceProgram);
      gl.deleteProgram(shadowProgram);
    },
  };
};
