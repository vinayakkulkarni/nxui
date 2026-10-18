import type {
  FlyingPostersAxis,
  FlyingPostersEntry,
  FlyingPostersItem,
  PosterEngine,
  PosterEngineOptions,
} from './types';

const VERTEX = `#version 300 es
in vec2 aPosition;
in vec4 aPoster;
uniform mat4 uProjection;
uniform float uCamera;
uniform vec2 uPoster;
uniform float uDepth;
uniform float uSpacing;
uniform float uLoop;
uniform float uColumnGap;
uniform float uColumns;
uniform float uScroll;
uniform float uAlternate;
uniform float uViewHeight;
uniform float uRotation;
uniform float uDistortion;
uniform vec3 uAxis;
uniform float uLean;
out vec2 vUv;
out float vItem;
out float vFacing;
out float vScreenY;

mat4 rotationMatrix(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat4(
    oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0,
    oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0,
    oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  return (rotationMatrix(axis, angle) * vec4(v, 1.0)).xyz;
}

float qinticInOut(float t) {
  return t < 0.5 ? 16.0 * pow(t, 5.0) : -0.5 * abs(pow(2.0 * t - 2.0, 5.0)) + 1.0;
}

void main() {
  float column = aPoster.x;
  float direction = uAlternate > 0.5 && mod(column, 2.0) > 0.5 ? -1.0 : 1.0;
  float base = -uLoop * 0.5 + (aPoster.y + 0.5) * uSpacing + column * 0.41 * uSpacing;
  float y = mod(base - uScroll * direction + uLoop * 0.5, uLoop) - uLoop * 0.5;
  float x = (column - (uColumns - 1.0) * 0.5) * uColumnGap;
  float position = 5.0 + (y + uViewHeight) / (2.0 * uViewHeight) * 10.0;
  float offset = (dot(vec2(1.0, 1.0), aPosition) + 0.25) / 0.5;
  float progress = clamp(
    (clamp(position * 0.05, 0.0, 1.0) - 0.01 * uDistortion * offset) / (1.0 - 0.01 * uDistortion),
    0.0,
    2.0
  );
  float angle = qinticInOut(progress) * uRotation;
  vec3 local = rotate(vec3(aPosition, 0.0), uAxis, angle);
  vec3 normal = rotate(vec3(0.0, 0.0, 1.0), uAxis, angle);
  local = rotate(local * vec3(uPoster, uDepth), vec3(1.0, 0.0, 0.0), uLean * direction);
  normal = rotate(normal, vec3(1.0, 0.0, 0.0), uLean * direction);
  vec3 world = local + vec3(x, y, 0.0);
  gl_Position = uProjection * vec4(world.xy, world.z - uCamera, 1.0);
  vUv = aPosition + 0.5;
  vItem = aPoster.z;
  vFacing = normal.z;
  vScreenY = gl_Position.y / gl_Position.w;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
uniform float uCells;
uniform float uInset;
uniform vec2 uPoster;
uniform float uRadius;
uniform float uFade;
uniform float uShading;
uniform float uReveal;
in vec2 vUv;
in float vItem;
in float vFacing;
in float vScreenY;
out vec4 outColor;

void main() {
  vec2 p = (vUv - 0.5) * uPoster;
  float r = min(uRadius, 0.5 * min(uPoster.x, uPoster.y));
  vec2 q = abs(p) - (0.5 * uPoster - r);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float aa = max(fwidth(d), 0.0001);
  float mask = r > 0.0 ? 1.0 - smoothstep(-aa, aa, d) : 1.0;
  vec2 cell = vec2(mod(vItem, uCells), floor(vItem / uCells));
  vec2 local = vec2(vUv.x, 1.0 - vUv.y);
  vec4 sampled = texture(uAtlas, (cell + uInset + local * (1.0 - 2.0 * uInset)) / uCells);
  vec3 color = sampled.rgb;
  color *= mix(1.0, 0.4 + 0.6 * abs(vFacing), uShading);
  float t = clamp((1.0 - abs(vScreenY)) / max(uFade, 0.0001), 0.0, 1.0);
  float fade = uFade > 0.0 ? t * t * t * (t * (t * 6.0 - 15.0) + 10.0) : 1.0;
  float alpha = sampled.a * mask * fade * uReveal;
  if (alpha < 0.002) discard;
  outColor = vec4(color * alpha, alpha);
}`;

export const POSTER_AXES: Record<FlyingPostersAxis, [number, number, number]> =
  {
    vertical: [0, 1, 0],
    horizontal: [1, 0, 0],
    diagonal: [1, 1, 0],
  };

const UNIFORMS = [
  'uProjection',
  'uCamera',
  'uPoster',
  'uDepth',
  'uSpacing',
  'uLoop',
  'uColumnGap',
  'uColumns',
  'uScroll',
  'uAlternate',
  'uViewHeight',
  'uRotation',
  'uDistortion',
  'uAxis',
  'uLean',
  'uAtlas',
  'uCells',
  'uInset',
  'uRadius',
  'uFade',
  'uShading',
  'uReveal',
];
const REFERENCE_FOV = (45 * Math.PI) / 180;
const REFERENCE_Z = 20;
const GRID_X = 100;
const GRID_Y = 1;

export const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function toPosterItem(item: FlyingPostersEntry | undefined): FlyingPostersItem {
  if (typeof item === 'string') return { image: item };
  return item ?? { image: '' };
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

export function createPosterEngine(
  options: PosterEngineOptions,
): PosterEngine | null {
  const { root, canvas, reduced, settings, items, onItemClick } = options;
  const context = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
  });
  if (!context) return null;
  const gl = context;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);

  const locations = Object.fromEntries(
    UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
  );
  const u = (name: string) => locations[name] ?? null;

  const positions: number[] = [];
  const indices: number[] = [];
  for (let y = 0; y <= GRID_Y; y++) {
    for (let x = 0; x <= GRID_X; x++)
      positions.push(x / GRID_X - 0.5, y / GRID_Y - 0.5);
  }
  for (let y = 0; y < GRID_Y; y++) {
    for (let x = 0; x < GRID_X; x++) {
      const i = y * (GRID_X + 1) + x;
      indices.push(i + GRID_X + 1, i, i + GRID_X + 2, i, i + 1, i + GRID_X + 2);
    }
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );
  const posterBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posterBuffer);
  const posterLocation = gl.getAttribLocation(program, 'aPoster');
  gl.enableVertexAttribArray(posterLocation);
  gl.vertexAttribPointer(posterLocation, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(posterLocation, 1);
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

  const atlasCanvas = document.createElement('canvas');
  const atlas = {
    cells: 1,
    cell: 512,
    images: [] as (HTMLImageElement | null)[],
    aspect: 0,
    dirty: false,
  };
  const pointer = {
    active: false,
    id: -1,
    origin: 0,
    startY: 0,
    startX: 0,
    start: 0,
  };
  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    scroll: 0,
    target: 0,
    velocity: 0,
    lean: 0,
    reveal: 0,
    slots: 0,
    count: 0,
    layoutKey: '',
    pageY: window.scrollY,
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = true;
  let request = 0;

  function metrics() {
    const s = settings();
    const fov = (s.cameraFov * Math.PI) / 180;
    const unit = state.height / (2 * Math.tan(REFERENCE_FOV / 2) * REFERENCE_Z);
    const distance = s.cameraZ * unit;
    const spacing = s.planeHeight + (s.gap ?? 5 * unit);
    const scale = (2 * distance * Math.tan(fov / 2)) / state.height;
    return { fov, unit, spacing, distance, scale };
  }

  function layout() {
    const s = settings();
    const list = items();
    const { spacing, scale } = metrics();
    const slots = Math.max(
      list.length,
      Math.ceil((state.height * scale + s.planeHeight) / spacing) + 1,
    );
    const key = [slots, s.columns, list.length].join('|');
    if (key === state.layoutKey) return;
    state.layoutKey = key;
    state.slots = slots;
    state.count = slots * s.columns;
    const total = Math.max(1, list.length);
    const data = new Float32Array(state.count * 4);
    for (let column = 0; column < s.columns; column++) {
      for (let slot = 0; slot < slots; slot++) {
        data.set(
          [column, slot, (slot + column * 2) % total, 0],
          (column * slots + slot) * 4,
        );
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, posterBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }

  function paintAtlas() {
    const s = settings();
    const aspect = s.planeWidth / s.planeHeight;
    const ctx = atlasCanvas.getContext('2d');
    if (!ctx) return;
    atlas.aspect = aspect;
    ctx.clearRect(0, 0, atlasCanvas.width, atlasCanvas.height);
    atlas.images.forEach((image, index) => {
      if (!image) return;
      const size = atlas.cell;
      let sw = image.naturalWidth;
      let sh = image.naturalHeight;
      if (sw / sh > aspect) sw = sh * aspect;
      else sh = sw / aspect;
      const x = (index % atlas.cells) * size;
      const y = Math.floor(index / atlas.cells) * size;
      ctx.drawImage(
        image,
        (image.naturalWidth - sw) / 2,
        (image.naturalHeight - sh) / 2,
        sw,
        sh,
        x,
        y,
        size,
        size,
      );
    });
    atlas.dirty = true;
  }

  function uploadAtlas() {
    atlas.dirty = false;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      atlasCanvas,
    );
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  function loadItems(list: FlyingPostersEntry[]) {
    const current = ++request;
    const entries = list.map(toPosterItem);
    const total = Math.max(1, entries.length);
    atlas.cells = Math.ceil(Math.sqrt(total));
    atlas.cell = clampValue(Math.floor(4096 / atlas.cells), 128, 1024);
    atlasCanvas.width = atlas.cells * atlas.cell;
    atlasCanvas.height = atlas.cells * atlas.cell;
    atlas.images = entries.map(() => null);
    paintAtlas();
    state.layoutKey = '';
    entries.forEach((entry, index) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        if (!alive || current !== request) return;
        atlas.images[index] = image;
        paintAtlas();
        wake();
      };
      image.src = entry.image || '';
    });
    wake();
  }

  function posterAt(clientX: number, clientY: number) {
    const s = settings();
    const rect = canvas.getBoundingClientRect();
    const { spacing, scale } = metrics();
    const x = (clientX - rect.left - rect.width / 2) * scale;
    const y = (rect.height / 2 - (clientY - rect.top)) * scale;
    const loop = state.slots * spacing;
    for (let column = 0; column < s.columns; column++) {
      const direction = s.alternate && column % 2 === 1 ? -1 : 1;
      const cx = (column - (s.columns - 1) / 2) * (s.planeWidth + s.columnGap);
      if (Math.abs(x - cx) > s.planeWidth / 2) continue;
      for (let slot = 0; slot < state.slots; slot++) {
        const base =
          -loop / 2 + (slot + 0.5) * spacing + column * 0.41 * spacing;
        const raw = base - state.scroll * direction + loop / 2;
        const cy = (((raw % loop) + loop) % loop) - loop / 2;
        if (Math.abs(y - cy) <= s.planeHeight / 2) {
          return (slot + column * 2) % Math.max(1, items().length);
        }
      }
    }
    return -1;
  }

  const projection = new Float32Array(16);

  function render() {
    const g = gl;
    const s = settings();
    const { fov, unit, spacing, distance } = metrics();
    const aspect = state.width / state.height;
    const f = 1 / Math.tan(fov / 2);
    const near = Math.max(0.5, distance * 0.02);
    const far = distance * 4;
    projection.fill(0);
    projection[0] = f / aspect;
    projection[5] = f;
    projection[10] = (far + near) / (near - far);
    projection[11] = -1;
    projection[14] = (2 * far * near) / (near - far);
    const axis = POSTER_AXES[s.axis];
    g.viewport(0, 0, canvas.width, canvas.height);
    g.clearColor(0, 0, 0, 0);
    g.clear(g.COLOR_BUFFER_BIT);
    g.disable(g.DEPTH_TEST);
    g.enable(g.BLEND);
    g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
    g.useProgram(program);
    g.uniformMatrix4fv(u('uProjection'), false, projection);
    g.uniform1f(u('uCamera'), distance);
    g.uniform2f(u('uPoster'), s.planeWidth, s.planeHeight);
    g.uniform1f(u('uDepth'), unit);
    g.uniform1f(u('uSpacing'), spacing);
    g.uniform1f(u('uLoop'), state.slots * spacing);
    g.uniform1f(u('uColumnGap'), s.planeWidth + s.columnGap);
    g.uniform1f(u('uColumns'), s.columns);
    g.uniform1f(u('uScroll'), state.scroll);
    g.uniform1f(u('uAlternate'), s.alternate ? 1 : 0);
    g.uniform1f(u('uViewHeight'), state.height);
    g.uniform1f(u('uRotation'), (s.rotation * Math.PI) / 180);
    g.uniform1f(u('uDistortion'), s.distortion);
    g.uniform3f(u('uAxis'), axis[0], axis[1], axis[2]);
    g.uniform1f(u('uLean'), state.lean);
    g.uniform1f(u('uCells'), atlas.cells);
    g.uniform1f(u('uInset'), 1.5 / atlas.cell);
    g.uniform1f(u('uRadius'), s.radius);
    g.uniform1f(u('uFade'), s.fade);
    g.uniform1f(u('uShading'), s.shading);
    g.uniform1f(u('uReveal'), state.reveal);
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, atlasTexture);
    g.bindVertexArray(vao);
    g.drawElementsInstanced(
      g.TRIANGLES,
      indices.length,
      g.UNSIGNED_SHORT,
      0,
      state.count,
    );
    g.bindVertexArray(null);
  }

  function frame(now: number) {
    raf = 0;
    if (!alive || !visible) return;
    const s = settings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    layout();
    if (atlas.aspect !== s.planeWidth / s.planeHeight) paintAtlas();
    if (atlas.dirty) uploadAtlas();
    state.reveal = Math.min(1, state.reveal + dt / (reduced ? 0.01 : 0.6));
    if (!pointer.active && !reduced) state.target -= s.speed * dt;
    const previous = state.scroll;
    state.scroll +=
      (state.target - state.scroll) * (1 - (1 - s.scrollEase) ** (dt * 60));
    state.velocity +=
      ((state.scroll - previous) / dt - state.velocity) *
      (1 - Math.exp(-dt * 8));
    const leanTarget = reduced
      ? 0
      : clampValue(-state.velocity * s.lean * 0.0006, -0.5, 0.5);
    state.lean += (leanTarget - state.lean) * (1 - Math.exp(-dt * 6));
    render();
    const busy =
      (s.speed !== 0 && !reduced) ||
      Math.abs(state.target - state.scroll) > 0.05 ||
      Math.abs(state.lean) > 0.0005 ||
      state.reveal < 1 ||
      atlas.dirty;
    if (busy) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  function wake() {
    if (raf || !alive || !visible) return;
    raf = requestAnimationFrame(frame);
  }

  return {
    loadItems,
    wake,
    resize() {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.width = Math.max(1, root.clientWidth);
      state.height = Math.max(1, root.clientHeight);
      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      state.layoutKey = '';
      layout();
      render();
      wake();
    },
    setVisible(value) {
      visible = value;
      if (visible) {
        last = 0;
        wake();
      }
    },
    wheel(event) {
      if (!settings().wheel) return;
      event.preventDefault();
      const lines =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? state.height : 1;
      state.target += event.deltaY * lines * 0.01 * metrics().unit;
      wake();
    },
    pointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointer.startX = event.clientX;
      pointer.startY = event.clientY;
      pointer.start = performance.now();
      if (!settings().drag) return;
      canvas.setPointerCapture?.(event.pointerId);
      pointer.active = true;
      pointer.id = event.pointerId;
      pointer.origin = state.scroll;
      wake();
    },
    pointerMove(event) {
      if (!pointer.active || event.pointerId !== pointer.id) return;
      state.target =
        pointer.origin +
        (pointer.startY - event.clientY) * 0.1 * metrics().unit;
      wake();
    },
    pointerUp(event) {
      const tap =
        Math.hypot(
          event.clientX - pointer.startX,
          event.clientY - pointer.startY,
        ) < 6 && performance.now() - pointer.start < 450;
      if (pointer.active && event.pointerId === pointer.id) {
        pointer.active = false;
        if (canvas.hasPointerCapture?.(event.pointerId))
          canvas.releasePointerCapture(event.pointerId);
      }
      if (tap) {
        const index = posterAt(event.clientX, event.clientY);
        if (index >= 0) onItemClick(toPosterItem(items()[index]), index);
      }
      wake();
    },
    pageScroll() {
      const factor = settings().pageScroll;
      const y = window.scrollY;
      if (factor) {
        state.target += (y - state.pageY) * factor;
        wake();
      }
      state.pageY = y;
    },
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      gl.deleteTexture(atlasTexture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteBuffer(posterBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
