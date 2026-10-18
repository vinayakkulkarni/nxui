import {
  clamp,
  cross,
  dot,
  normalize,
  quatAxisAngle,
  quatMultiply,
  quatNormalize,
  rotate,
  sphere,
} from './infinite-menu-math';
import {
  INFINITE_MENU_FRAGMENT,
  INFINITE_MENU_UNIFORMS,
  INFINITE_MENU_VERTEX,
} from './infinite-menu-shaders';
import type {
  InfiniteMenuCallbacks,
  InfiniteMenuEngine,
  InfiniteMenuLayout,
  InfiniteMenuSettings,
  InfiniteMenuState,
  MenuItem,
  Vec2,
  Vec3,
} from './types';

const GRID = 12;
const RADIUS = 2;
const FOV = (30 * Math.PI) / 180;
const FRONT: Vec3 = [0, 0, 1];

type UniformName = (typeof INFINITE_MENU_UNIFORMS)[number];

const compile = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

/**
 * Instanced WebGL2 sphere of image tiles. Renders on demand: the rAF loop
 * stops once everything settles and a timer wakes it for the next autoplay step.
 */
export function createInfiniteMenuEngine(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => InfiniteMenuSettings,
  getItems: () => MenuItem[],
  callbacks: InfiniteMenuCallbacks,
): InfiniteMenuEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, INFINITE_MENU_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, INFINITE_MENU_FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const locations = new Map<UniformName, WebGLUniformLocation | null>();
  for (const name of INFINITE_MENU_UNIFORMS) {
    locations.set(name, gl.getUniformLocation(program, name));
  }
  const u = (name: UniformName) => locations.get(name) ?? null;

  const corners: number[] = [];
  const indices: number[] = [];
  for (let y = 0; y <= GRID; y++) {
    for (let x = 0; x <= GRID; x++) {
      corners.push((x / GRID) * 2 - 1, (y / GRID) * 2 - 1);
    }
  }
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const i = y * (GRID + 1) + x;
      indices.push(i, i + 1, i + GRID + 1, i + 1, i + GRID + 2, i + GRID + 1);
    }
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const cornerBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), gl.STATIC_DRAW);
  const cornerLocation = gl.getAttribLocation(program, 'aCorner');
  gl.enableVertexAttribArray(cornerLocation);
  gl.vertexAttribPointer(cornerLocation, 2, gl.FLOAT, false, 0, 0);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );
  const tileBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tileBuffer);
  const tileLocation = gl.getAttribLocation(program, 'aTile');
  gl.enableVertexAttribArray(tileLocation);
  gl.vertexAttribPointer(tileLocation, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(tileLocation, 1);
  gl.bindVertexArray(null);

  const atlasTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );
  gl.uniform1i(u('uAtlas'), 0);

  const initial = getSettings();
  const atlas = {
    canvas: document.createElement('canvas'),
    cells: 1,
    cell: 512,
    request: 0,
    dirty: false,
  };
  const drag = {
    active: false,
    id: -1,
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    moved: 0,
    start: 0,
  };
  const state: InfiniteMenuState = {
    width: 1,
    height: 1,
    tiles: [],
    assign: [],
    count: 0,
    orientation: quatNormalize([0.08, -0.3, 0, 1]),
    axis: [0, 1, 0],
    speed: initial.intro && !initial.reduce ? 3.2 : 0,
    camera: 0,
    target: -1,
    front: 0,
    moving: true,
    reveal: 0,
    hovered: false,
    focused: false,
    idle: 0,
    settle: 0,
    tilePx: 0,
    layout: 'side',
    shift: 0,
    started: false,
  };
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = 0;
  let sleptAt = 0;
  let visible = true;
  let alive = true;

  const layout = () => {
    const s = getSettings();
    if (s.count === state.count) return;
    state.count = s.count;
    state.tiles = sphere(s.count);
    const items = Math.max(1, getItems().length);
    const usage = Array.from({ length: items }, () => 0);
    state.assign = state.tiles.map(() => -1);
    state.tiles.forEach((tile, i) => {
      // Avoid repeating an item next to itself among the 6 nearest tiles.
      const near = state.tiles
        .map((other, j): Vec2 => [j === i ? -2 : dot(tile, other), j])
        .sort((a, b) => b[0] - a[0])
        .slice(0, 6)
        .map(([, j]) => state.assign[j]);
      let pick = -1;
      for (let k = 0; k < items; k++) {
        const candidate = (i + k) % items;
        if (near.includes(candidate)) continue;
        if (pick < 0 || usage[candidate]! < usage[pick]!) pick = candidate;
      }
      if (pick < 0) pick = i % items;
      state.assign[i] = pick;
      usage[pick]! += 1;
    });
    const data = new Float32Array(s.count * 4);
    state.tiles.forEach((tile, i) =>
      data.set([tile[0], tile[1], tile[2], state.assign[i]!], i * 4),
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, tileBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    let first = -1;
    let firstZ = -2;
    state.tiles.forEach((tile, i) => {
      const z = rotate(state.orientation, tile)[2];
      if (state.assign[i] === 0 && z > firstZ) {
        firstZ = z;
        first = i;
      }
    });
    state.target = first;
  };

  const uploadAtlas = () => {
    atlas.dirty = false;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      atlas.canvas,
    );
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  const loadItems = (list: MenuItem[]) => {
    const request = ++atlas.request;
    const total = Math.max(1, list.length);
    atlas.cells = Math.ceil(Math.sqrt(total));
    atlas.cell = clamp(Math.floor(4096 / atlas.cells), 64, 512);
    atlas.canvas.width = atlas.cells * atlas.cell;
    atlas.canvas.height = atlas.cells * atlas.cell;
    const ctx = atlas.canvas.getContext('2d');
    ctx?.clearRect(0, 0, atlas.canvas.width, atlas.canvas.height);
    uploadAtlas();
    state.count = 0;
    layout();
    let pending = list.length;
    if (!pending) state.started = true;
    list.forEach((item, index) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      const done = () => {
        pending -= 1;
        if (pending <= 0) state.started = true;
        wake();
      };
      image.onload = () => {
        if (!alive || request !== atlas.request || !ctx) return;
        const size = atlas.cell;
        const scale = Math.max(
          size / image.naturalWidth,
          size / image.naturalHeight,
        );
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        const x = (index % atlas.cells) * size;
        const y = Math.floor(index / atlas.cells) * size;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, size, size);
        ctx.clip();
        ctx.drawImage(
          image,
          x + (size - width) / 2,
          y + (size - height) / 2,
          width,
          height,
        );
        ctx.restore();
        atlas.dirty = true;
        done();
      };
      image.onerror = () => {
        if (!alive || request !== atlas.request) return;
        done();
      };
      image.src = item.image;
    });
  };

  const tileRadius = () =>
    0.5 *
    RADIUS *
    Math.sqrt((4 * Math.PI) / Math.max(1, state.count)) *
    getSettings().tileSize;

  const restDistance = () => {
    const aspect = state.width / state.height;
    const span = Math.tan(FOV / 2) * Math.min(1, aspect);
    return RADIUS + tileRadius() / (0.46 * getSettings().zoom * span);
  };

  const measure = () => {
    const rest = restDistance();
    const radius =
      (tileRadius() / ((rest - RADIUS) * Math.tan(FOV / 2))) *
      (state.height / 2);
    const rounded = Math.round(radius);
    if (rounded !== state.tilePx) {
      state.tilePx = rounded;
      root.style.setProperty('--infinite-menu-tile', `${rounded}px`);
    }
    const mode: InfiniteMenuLayout =
      state.width / 2 - radius < 120 ? 'stacked' : 'side';
    if (mode !== state.layout) {
      state.layout = mode;
      callbacks.onLayout(mode);
    }
  };

  const tileAt = (index: number): Vec3 =>
    rotate(state.orientation, state.tiles[index] ?? FRONT);

  const nearest = () => {
    let best = 0;
    let bestZ = -2;
    for (let i = 0; i < state.tiles.length; i++) {
      const z = tileAt(i)[2];
      if (z > bestZ) {
        bestZ = z;
        best = i;
      }
    }
    return best;
  };

  const neighbor = (from: number, direction: Vec2) => {
    const origin = tileAt(from);
    let best = -1;
    let bestScore = Infinity;
    for (let i = 0; i < state.tiles.length; i++) {
      if (i === from) continue;
      const c = tileAt(i);
      if (c[2] < 0) continue;
      const dx = c[0] - origin[0];
      const dy = c[1] - origin[1];
      const length = Math.hypot(dx, dy);
      if (length < 0.0001) continue;
      const align = (dx * direction[0] + dy * direction[1]) / length;
      if (align < 0.55) continue;
      const score = length * (2.2 - align);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  };

  const goTo = (index: number) => {
    if (index < 0) return;
    state.target = index;
    state.speed = 0;
    state.idle = 0;
    wake();
  };

  const pick = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    const span = Math.tan(FOV / 2);
    const x = (((clientX - rect.left) / rect.width) * 2 - 1) * aspect;
    const y = 1 - ((clientY - rect.top) / rect.height) * 2 - state.shift;
    const radius = tileRadius();
    let best = -1;
    let bestDistance = Infinity;
    for (let i = 0; i < state.tiles.length; i++) {
      const c = tileAt(i);
      if (c[2] < 0.2) continue;
      const depth = state.camera - c[2] * RADIUS;
      const sx = (c[0] * RADIUS) / (depth * span);
      const sy = (c[1] * RADIUS) / (depth * span);
      const reach = (radius * (0.5 + 0.5 * c[2])) / (depth * span);
      const distance = Math.hypot(sx - x, sy - y);
      if (distance < reach && distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    return best;
  };

  const itemForTile = (tile: number) => {
    const length = getItems().length;
    return length ? (state.assign[tile] ?? 0) % length : 0;
  };

  const render = () => {
    const s = getSettings();
    const aspect = state.width / state.height;
    const f = 1 / Math.tan(FOV / 2);
    const near = 0.05;
    const far = 50;
    const projection = new Float32Array([
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
      (2 * far * near) / (near - far),
      0,
    ]);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    const [qx, qy, qz, qw] = state.orientation;
    gl.uniform4f(u('uOrientation'), qx, qy, qz, qw);
    gl.uniformMatrix4fv(u('uProjection'), false, projection);
    gl.uniform1f(u('uCamera'), state.camera);
    gl.uniform1f(u('uRadius'), RADIUS);
    gl.uniform1f(u('uTileRadius'), tileRadius());
    gl.uniform4f(
      u('uSpin'),
      state.axis[0],
      state.axis[1],
      state.axis[2],
      s.reduce ? 0 : state.speed,
    );
    gl.uniform1f(u('uStretch'), s.stretch);
    gl.uniform1f(u('uShift'), state.shift);
    gl.uniform1f(u('uCells'), atlas.cells);
    gl.uniform1f(u('uInset'), 2 / atlas.cell);
    gl.uniform1f(u('uRoundness'), s.roundness);
    gl.uniform1f(u('uGrayscale'), s.grayscale ? 1 : 0);
    gl.uniform1f(u('uDim'), s.dim * (0.45 + 0.55 * state.settle));
    gl.uniform1f(u('uReveal'), state.reveal);
    if (s.theme === 'light') {
      gl.uniform3f(u('uPlaceholder'), 0.9, 0.9, 0.91);
      gl.uniform3f(u('uTone'), 1, 1, 1);
    } else {
      gl.uniform3f(u('uPlaceholder'), 0.13, 0.12, 0.15);
      gl.uniform3f(u('uTone'), 0.04, 0.035, 0.05);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.bindVertexArray(vao);
    gl.drawElementsInstanced(
      gl.TRIANGLES,
      indices.length,
      gl.UNSIGNED_SHORT,
      0,
      state.tiles.length,
    );
    gl.bindVertexArray(null);
  };

  const stackedShift = () =>
    state.layout === 'stacked' ? Math.min(0.3, 72 / state.height) : 0;

  const frame = (now: number) => {
    raf = 0;
    if (!alive || !visible) return;
    const s = getSettings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    // Idle time that passed while the loop slept counts toward autoplay.
    const slept = sleptAt ? Math.max(0, (now - sleptAt) / 1000) : 0;
    sleptAt = 0;
    last = now;
    layout();
    if (atlas.dirty) uploadAtlas();
    if (state.started) {
      state.reveal = Math.min(1, state.reveal + dt / (s.reduce ? 0.01 : 0.7));
    }
    const minSide = Math.min(state.width, state.height);

    if (drag.active) {
      if (drag.dx || drag.dy) {
        const length = Math.hypot(drag.dx, drag.dy);
        const angle = (length / minSide) * 2.6;
        const axis = normalize([drag.dy, drag.dx, 0]);
        state.orientation = quatNormalize(
          quatMultiply(quatAxisAngle(axis, angle), state.orientation),
        );
        const blend = 1 - Math.exp(-dt * 30);
        state.axis = normalize([
          state.axis[0] + (axis[0] - state.axis[0]) * blend,
          state.axis[1] + (axis[1] - state.axis[1]) * blend,
          state.axis[2] + (axis[2] - state.axis[2]) * blend,
        ]);
        state.speed += (angle / dt - state.speed) * blend;
        drag.dx = 0;
        drag.dy = 0;
      } else {
        state.speed *= Math.exp(-dt * 14);
      }
    } else {
      if (state.speed > 0.0005) {
        state.orientation = quatNormalize(
          quatMultiply(
            quatAxisAngle(state.axis, state.speed * dt),
            state.orientation,
          ),
        );
        state.speed *= Math.exp(-dt * (6 - 5 * s.inertia));
      } else {
        state.speed = 0;
      }
      const goal = state.target >= 0 ? state.target : nearest();
      const current = tileAt(goal);
      const angle = Math.acos(clamp(dot(current, FRONT), -1, 1));
      const pull = clamp(1 - state.speed / 1.4, 0, 1);
      if (angle > 0.0002 && pull > 0) {
        const axis = cross(current, FRONT);
        const step =
          angle * (1 - Math.exp(-dt * (state.target >= 0 ? 6 : 8))) * pull;
        if (Math.hypot(axis[0], axis[1], axis[2]) > 1e-6) {
          state.orientation = quatNormalize(
            quatMultiply(
              quatAxisAngle(normalize(axis), step),
              state.orientation,
            ),
          );
        }
      } else if (state.target >= 0 && state.speed === 0) {
        state.target = -1;
      }
      state.front = goal;
    }

    const settledAngle = Math.acos(clamp(tileAt(state.front)[2], -1, 1));
    const moving = drag.active || state.speed > 0.08 || settledAngle > 0.01;
    if (moving !== state.moving) {
      state.moving = moving;
      callbacks.onMoving(moving);
    }
    state.settle +=
      ((moving ? 0 : 1) - state.settle) *
      (1 - Math.exp(-dt * (moving ? 10 : 3)));
    if (!moving) callbacks.onActive(itemForTile(state.front));

    const rest = restDistance();
    const pullAmount = clamp(drag.active ? 1 : state.speed / 2.2, 0, 1);
    const target =
      rest +
      s.pullBack * pullAmount * RADIUS * 1.25 +
      (1 - state.reveal) * RADIUS * 1.5;
    if (!state.camera) state.camera = target + RADIUS;
    state.camera += (target - state.camera) * (1 - Math.exp(-dt * 4.5));

    const canAutoplay =
      s.autoplay > 0 && !state.hovered && !state.focused && !s.reduce;
    if (canAutoplay && !moving) {
      state.idle += slept || dt;
      if (state.idle >= s.autoplay) {
        state.idle = 0;
        goTo(neighbor(state.front, [1, 0]));
      }
    } else {
      state.idle = 0;
    }

    measure();
    state.shift += (stackedShift() - state.shift) * (1 - Math.exp(-dt * 6));
    render();

    const busy =
      moving ||
      Math.abs(target - state.camera) > 0.001 ||
      Math.abs(stackedShift() - state.shift) > 0.0005 ||
      Math.abs((moving ? 0 : 1) - state.settle) > 0.002 ||
      state.reveal < 1 ||
      atlas.dirty ||
      !state.started;
    if (busy) raf = requestAnimationFrame(frame);
    else {
      last = 0;
      sleptAt = now;
      if (canAutoplay) {
        clearTimeout(timer);
        timer = setTimeout(
          wake,
          Math.max(16, (s.autoplay - state.idle) * 1000),
        );
      }
    }
  };

  function wake() {
    clearTimeout(timer);
    if (raf || !alive || !visible) return;
    raf = requestAnimationFrame(frame);
  }

  const pointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    canvas.setPointerCapture?.(event.pointerId);
    drag.active = true;
    drag.id = event.pointerId;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.dx = 0;
    drag.dy = 0;
    drag.moved = 0;
    drag.start = performance.now();
    state.target = -1;
    wake();
  };

  const pointerMove = (event: PointerEvent) => {
    if (!drag.active || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.dx += dx;
    drag.dy += dy;
    drag.moved += Math.hypot(dx, dy);
    wake();
  };

  const pointerUp = (event: PointerEvent) => {
    if (!drag.active || event.pointerId !== drag.id) return;
    drag.active = false;
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    if (drag.moved < 6 && performance.now() - drag.start < 450) {
      const index = pick(event.clientX, event.clientY);
      if (index >= 0 && index === state.front) callbacks.onActivate(index);
      else if (index >= 0) goTo(index);
    }
    wake();
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = Math.max(1, root.clientWidth);
    state.height = Math.max(1, root.clientHeight);
    canvas.width = Math.round(state.width * dpr);
    canvas.height = Math.round(state.height * dpr);
    if (!raf) render();
    wake();
  };

  layout();

  return {
    loadItems,
    wake,
    resize,
    setVisible: (value) => {
      visible = value;
      if (value) {
        last = 0;
        sleptAt = 0;
        wake();
      }
    },
    setHovered: (value) => {
      state.hovered = value;
      if (!value) wake();
    },
    setFocused: (value) => {
      state.focused = value;
      if (!value) wake();
    },
    pointerDown,
    pointerMove,
    pointerUp,
    step: (direction) =>
      goTo(neighbor(state.target >= 0 ? state.target : state.front, direction)),
    itemForTile,
    frontTile: () => state.front,
    destroy: () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      gl.deleteTexture(atlasTexture);
      gl.deleteBuffer(cornerBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteBuffer(tileBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
