import { CUBES_FRAGMENT, CUBES_VERTEX } from './cubes-shaders';
import type {
  CubesEdgeStyle,
  CubesEngine,
  CubesEngineOptions,
  CubesRing,
} from './types';

const FACES = [
  [0, 0, 1, 1, 0, 0, 0, 1, 0],
  [0, 0, -1, -1, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, -1, 0, 1, 0],
  [-1, 0, 0, 0, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, -1],
  [0, -1, 0, 1, 0, 0, 0, 0, 1],
] as const;

const CORNERS = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
] as const;

const STYLES: Record<CubesEdgeStyle, number> = {
  solid: 0,
  dashed: 1,
  dotted: 2,
  none: 3,
};

const INTRO_SECONDS = 1.1;
const LIGHT = [-0.42, 0.55, 0.72] as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildCube() {
  const vertices: number[] = [];
  const indices: number[] = [];
  FACES.forEach(([nx, ny, nz, ux, uy, uz, vx, vy, vz], face) => {
    for (const [u, v] of CORNERS) {
      vertices.push(
        nx * 0.5 + (u - 0.5) * ux + (v - 0.5) * vx,
        ny * 0.5 + (u - 0.5) * uy + (v - 0.5) * vy,
        nz * 0.5 + (u - 0.5) * uz + (v - 0.5) * vz,
        nx,
        ny,
        nz,
        u,
        v,
      );
    }
    const base = face * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
  };
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
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, CUBES_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, CUBES_FRAGMENT);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  ['aPosition', 'aNormal', 'aUv', 'aCenter', 'aRotation', 'aState'].forEach(
    (name, index) => gl.bindAttribLocation(program, index, name),
  );
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return {
    program,
    u: (name: string): WebGLUniformLocation | null => uniforms[name] ?? null,
  };
}

/** Writes the quaternion for a rotation of |(rx, ry)| radians around (rx, ry, 0). */
function toRotation(rx: number, ry: number, out: Float32Array) {
  const angle = Math.hypot(rx, ry);
  if (angle < 0.000001) {
    out.set([0, 0, 0, 1]);
    return;
  }
  const s = Math.sin(angle / 2) / angle;
  out.set([rx * s, ry * s, 0, Math.cos(angle / 2)]);
}

/** Hamilton product of tilt (a) and a pure X-axis turn of `tumble` radians. */
function multiplyTurn(
  a: Float32Array,
  tumble: number,
  out: Float32Array,
  offset: number,
) {
  const ax = a[0] ?? 0;
  const ay = a[1] ?? 0;
  const az = a[2] ?? 0;
  const aw = a[3] ?? 1;
  const bx = Math.sin(tumble / 2);
  const bw = Math.cos(tumble / 2);
  out[offset] = aw * bx + ax * bw;
  out[offset + 1] = ay * bw + az * bx;
  out[offset + 2] = az * bw - ay * bx;
  out[offset + 3] = aw * bw - ax * bx;
}

function projection(
  width: number,
  height: number,
  scale: number,
  perspective: number,
): Float32Array {
  const halfWidth = width / 2 / scale;
  const halfHeight = height / 2 / scale;
  const depth = Math.max(halfWidth, halfHeight) * 4 + 4;
  if (perspective <= 0.001) {
    return new Float32Array([
      1 / halfWidth,
      0,
      0,
      0,
      0,
      1 / halfHeight,
      0,
      0,
      0,
      0,
      -1 / depth,
      0,
      0,
      0,
      0,
      1,
    ]);
  }
  const fov = ((8 + perspective * 52) * Math.PI) / 180;
  const distance = halfHeight / Math.tan(fov / 2);
  const near = Math.max(0.1, distance - depth);
  const far = distance + depth;
  const f = 1 / Math.tan(fov / 2);
  const aspect = halfWidth / halfHeight;
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) / (near - far),
    -1,
    0,
    0,
    (2 * far * near) / (near - far) - ((far + near) / (near - far)) * distance,
    distance,
  ]);
}

/**
 * Instanced WebGL2 cube grid: spring-driven tilt toward the cursor, sweep spin,
 * click ripples and a center-out tumble intro. Returns null without WebGL2.
 */
export function createCubesEngine(
  options: CubesEngineOptions,
): CubesEngine | null {
  const { container, canvas, getSettings, reduce } = options;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
    depth: true,
    stencil: false,
  });
  if (!gl) return null;
  const shader = link(gl);
  if (!shader) return null;

  const cube = buildCube();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);
  const instanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  for (const [location, size, offset] of [
    [3, 2, 0],
    [4, 4, 8],
    [5, 2, 24],
  ] as const) {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 32, offset);
    gl.vertexAttribDivisor(location, 1);
  }

  const probe = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true });
  const colorCache = new Map<string, Float32Array>();
  const toRgb = (value: string): Float32Array => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb = new Float32Array([1, 1, 1]);
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#ffffff';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = new Float32Array([
        (data[0] ?? 255) / 255,
        (data[1] ?? 255) / 255,
        (data[2] ?? 255) / 255,
      ]);
    }
    colorCache.set(value, rgb);
    return rgb;
  };

  const view = { width: 1, height: 1, ratio: 1, scale: 1 };
  const pointer = { x: 0, y: 0, inside: false, moved: 0 };
  const cursor = { x: 0, y: 0, vx: 0, vy: 0, weight: 0, primed: false };
  const grid = { size: 0, count: 0 };
  let rx = new Float32Array(0);
  let ry = new Float32Array(0);
  let wx = new Float32Array(0);
  let wy = new Float32Array(0);
  let glow = new Float32Array(0);
  let delays = new Float32Array(0);
  let instances = new Float32Array(0);
  const rings: CubesRing[] = [];
  const tilt = new Float32Array(4);
  let clock = 0;
  let introClock = options.intro && !reduce ? 0 : 99;
  let raf = 0;
  let last = 0;
  let visible = true;
  let lastSize = getSettings().gridSize;
  let lastDpr = getSettings().dpr;

  const allocate = (size: number) => {
    if (grid.size === size) return;
    grid.size = size;
    grid.count = size * size;
    rx = new Float32Array(grid.count);
    ry = new Float32Array(grid.count);
    wx = new Float32Array(grid.count);
    wy = new Float32Array(grid.count);
    glow = new Float32Array(grid.count);
    delays = new Float32Array(grid.count);
    instances = new Float32Array(grid.count * 8);
    const center = (size - 1) / 2;
    for (let i = 0; i < grid.count; i++) {
      const col = i % size;
      const row = Math.floor(i / size);
      delays[i] =
        Math.hypot(col - center, row - center) / Math.max(1, size / 2);
    }
  };

  const toWorld = (x: number, y: number): [number, number] => [
    (x - view.width / 2) / view.scale,
    (view.height / 2 - y) / view.scale,
  ];

  const render = () => {
    const s = getSettings();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!grid.count) return;

    const u = shader.u;
    gl.useProgram(shader.program);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instances, gl.DYNAMIC_DRAW);
    gl.uniformMatrix4fv(
      u('uProjection'),
      false,
      projection(view.width, view.height, view.scale, s.perspective),
    );
    gl.uniform1f(u('uSize'), 1 - s.gap);
    gl.uniform3fv(u('uFace'), toRgb(s.faceColor));
    gl.uniform3fv(u('uEdge'), toRgb(s.edgeColor));
    gl.uniform3fv(u('uRipple'), toRgb(s.rippleColor));
    const length = Math.hypot(LIGHT[0], LIGHT[1], LIGHT[2]);
    gl.uniform3f(
      u('uLight'),
      LIGHT[0] / length,
      LIGHT[1] / length,
      LIGHT[2] / length,
    );
    gl.uniform1f(u('uShading'), s.shading);
    gl.uniform1f(u('uEdgeWidth'), s.edgeWidth * view.ratio);
    gl.uniform1f(u('uStyle'), STYLES[s.edgeStyle] ?? 0);
    const cubePixels = (1 - s.gap) * view.scale;
    const spacing =
      s.edgeStyle === 'dotted'
        ? Math.max(4, s.edgeWidth * 4)
        : Math.max(6, s.edgeWidth * 6);
    gl.uniform1f(u('uMarks'), Math.max(1, Math.round(cubePixels / spacing)));
    gl.uniform1f(u('uOpacity'), s.faceOpacity);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    if (s.faceOpacity >= 0.999) {
      gl.depthMask(true);
      gl.cullFace(gl.BACK);
      gl.drawElementsInstanced(
        gl.TRIANGLES,
        36,
        gl.UNSIGNED_SHORT,
        0,
        grid.count,
      );
    } else {
      gl.depthMask(false);
      gl.cullFace(gl.FRONT);
      gl.drawElementsInstanced(
        gl.TRIANGLES,
        36,
        gl.UNSIGNED_SHORT,
        0,
        grid.count,
      );
      gl.cullFace(gl.BACK);
      gl.drawElementsInstanced(
        gl.TRIANGLES,
        36,
        gl.UNSIGNED_SHORT,
        0,
        grid.count,
      );
      gl.depthMask(true);
    }
  };

  const step = (dt: number): boolean => {
    const s = getSettings();
    allocate(s.gridSize);
    clock += dt;
    if (introClock < 99) introClock += dt;

    const live =
      s.autoAnimate &&
      !reduce &&
      (!pointer.inside || clock - pointer.moved > 3);
    let goalX = cursor.x;
    let goalY = cursor.y;
    let engaged = false;
    if (pointer.inside && clock - pointer.moved <= 3) {
      [goalX, goalY] = toWorld(pointer.x, pointer.y);
      engaged = true;
    } else if (live) {
      const reach = grid.size * 0.42;
      goalX = Math.sin(clock * 0.37) * reach * Math.cos(clock * 0.11);
      goalY = Math.sin(clock * 0.53 + 1.2) * reach;
      engaged = true;
    }
    if (!cursor.primed && engaged) {
      cursor.x = goalX;
      cursor.y = goalY;
      cursor.primed = true;
    }
    const follow = 1 - Math.exp(-dt * 18);
    const prevX = cursor.x;
    const prevY = cursor.y;
    cursor.x += (goalX - cursor.x) * follow;
    cursor.y += (goalY - cursor.y) * follow;
    const blend = 1 - Math.exp(-dt * 10);
    cursor.vx += ((cursor.x - prevX) / Math.max(dt, 0.001) - cursor.vx) * blend;
    cursor.vy += ((cursor.y - prevY) / Math.max(dt, 0.001) - cursor.vy) * blend;
    cursor.weight +=
      ((engaged ? 1 : 0) - cursor.weight) *
      (1 - Math.exp(-dt * (engaged ? 6 : 2.5)));

    const stiffness = 160 * s.speed * s.speed;
    const damping = 2 * (1 - 0.82 * s.bounce) * Math.sqrt(stiffness);
    const maxAngle = (s.maxAngle * Math.PI) / 180;
    const lift = 0.8;
    const travel = 8 * s.rippleSpeed;
    const fade = Math.exp(-dt * 3.2);
    const reachLimit = grid.size * 1.5 + 2;
    for (let k = rings.length - 1; k >= 0; k--) {
      const ring = rings[k];
      if (ring && (clock - ring.born) * travel > reachLimit) rings.splice(k, 1);
    }
    const speedNow = Math.hypot(cursor.vx, cursor.vy);
    const sweepX = speedNow > 0.0001 ? -cursor.vy / speedNow : 0;
    const sweepY = speedNow > 0.0001 ? cursor.vx / speedNow : 0;
    const sweep = reduce ? 0 : Math.min(speedNow, 40) * s.brush * 1.6;
    const size = grid.size;
    const center = (size - 1) / 2;
    let moving = false;

    for (let i = 0; i < grid.count; i++) {
      const cx = (i % size) - center;
      const cy = center - Math.floor(i / size);
      let rxi = rx[i] ?? 0;
      let ryi = ry[i] ?? 0;
      let wxi = wx[i] ?? 0;
      let wyi = wy[i] ?? 0;
      let glowi = glow[i] ?? 0;
      const dx = cx - cursor.x;
      const dy = cy - cursor.y;
      const distance = Math.hypot(dx, dy);
      const t = distance / s.radius;
      const falloff = t < 1 ? (1 - t * t) * (1 - t * t) * cursor.weight : 0;
      let targetX = 0;
      let targetY = 0;
      if (falloff > 0 && distance > 0.0001) {
        const angle =
          maxAngle * falloff * (distance / Math.hypot(distance, lift));
        targetX = (dy / distance) * angle;
        targetY = (-dx / distance) * angle;
      }
      if (falloff > 0 && sweep > 0) {
        wxi += sweepX * sweep * falloff * dt * 4;
        wyi += sweepY * sweep * falloff * dt * 4;
      }
      glowi *= fade;
      for (const ring of rings) {
        const ox = cx - ring.x;
        const oy = cy - ring.y;
        const reach = Math.hypot(ox, oy);
        const now = (clock - ring.born) * travel;
        if (reach > now || reach <= now - travel * dt || reach < 0.0001)
          continue;
        const strength = Math.exp(-reach / (grid.size * 0.8));
        wxi -= (oy / reach) * 13 * strength;
        wyi += (ox / reach) * 13 * strength;
        glowi = Math.max(glowi, strength);
      }
      if (glowi > 0.01) moving = true;
      if (reduce) {
        rxi = targetX;
        ryi = targetY;
        wxi = 0;
        wyi = 0;
      } else {
        wxi += (stiffness * (targetX - rxi) - damping * wxi) * dt;
        wyi += (stiffness * (targetY - ryi) - damping * wyi) * dt;
        rxi += wxi * dt;
        ryi += wyi * dt;
      }
      if (
        Math.abs(targetX - rxi) + Math.abs(targetY - ryi) > 0.0005 ||
        Math.abs(wxi) + Math.abs(wyi) > 0.0005
      ) {
        moving = true;
      }

      let grow = 1;
      let tumble = 0;
      if (introClock < 99) {
        const local = clamp(
          (introClock - (delays[i] ?? 0) * 0.55) / INTRO_SECONDS,
          0,
          1,
        );
        const eased = 1 - Math.pow(1 - local, 3);
        grow = eased;
        tumble = (1 - eased) * (Math.PI / 2);
        if (local < 1) moving = true;
      }

      rx[i] = rxi;
      ry[i] = ryi;
      wx[i] = wxi;
      wy[i] = wyi;
      glow[i] = glowi;

      toRotation(rxi, ryi, tilt);
      const base = i * 8;
      instances[base] = cx;
      instances[base + 1] = cy;
      multiplyTurn(tilt, tumble, instances, base + 2);
      instances[base + 6] = glowi;
      instances[base + 7] = grow;
    }
    if (introClock >= INTRO_SECONDS + 0.6 && introClock < 99) introClock = 99;
    return (
      moving ||
      live ||
      rings.length > 0 ||
      (engaged && speedNow > 0.01) ||
      Math.abs((engaged ? 1 : 0) - cursor.weight) > 0.002
    );
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const active = s.paused ? false : step(dt);
    render();
    if (active) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const s = getSettings();
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    view.width = width;
    view.height = height;
    view.scale = Math.min(width, height) / (s.gridSize + 0.9);
    canvas.width = Math.max(1, Math.round(width * view.ratio));
    canvas.height = Math.max(1, Math.round(height * view.ratio));
    allocate(s.gridSize);
    if (!raf) {
      step(0);
      render();
    }
    wake();
  };

  resize();

  return {
    refresh() {
      const s = getSettings();
      if (s.gridSize !== lastSize || s.dpr !== lastDpr) {
        lastSize = s.gridSize;
        lastDpr = s.dpr;
        resize();
        return;
      }
      if (!raf) {
        step(0);
        render();
      }
      wake();
    },
    pointerMove(clientX, clientY) {
      const rect = container.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      pointer.inside =
        pointer.x >= 0 &&
        pointer.y >= 0 &&
        pointer.x <= rect.width &&
        pointer.y <= rect.height;
      if (pointer.inside) pointer.moved = clock;
      wake();
    },
    pointerLeave() {
      pointer.inside = false;
      wake();
    },
    pointerDown(clientX, clientY) {
      const s = getSettings();
      if (!s.rippleOnClick || reduce) return;
      const rect = container.getBoundingClientRect();
      const [ox, oy] = toWorld(clientX - rect.left, clientY - rect.top);
      rings.push({ x: ox, y: oy, born: clock });
      if (rings.length > 6) rings.shift();
      wake();
    },
    resize,
    setVisible(value) {
      visible = value;
      if (visible) {
        last = 0;
        wake();
      }
    },
    visibilityChanged() {
      last = 0;
      wake();
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      gl.deleteBuffer(vertexBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteBuffer(instanceBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
    },
  };
}
