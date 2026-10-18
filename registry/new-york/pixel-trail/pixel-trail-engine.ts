import { AGE_SIZE, FRAGMENT, TRAIL_SIZE, VERTEX } from './pixel-trail-shaders';
import type {
  PixelTrailEngine,
  PixelTrailEngineOptions,
  PixelTrailPoint,
  PixelTrailPointerSample,
  PixelTrailRgb,
} from './types';

let colorContext: CanvasRenderingContext2D | null = null;

export function parseColor(
  value: string,
  fallback: PixelTrailRgb,
): PixelTrailRgb {
  if (typeof document === 'undefined') return fallback;
  if (!colorContext) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    colorContext = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!colorContext) return fallback;
  colorContext.clearRect(0, 0, 1, 1);
  colorContext.fillStyle = '#000';
  colorContext.fillStyle = value;
  colorContext.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = colorContext.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
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

export function createPixelTrailEngine(
  options: PixelTrailEngineOptions,
): PixelTrailEngine | null {
  const { container, canvas, getSettings } = options;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const uniformCount: number = gl.getProgramParameter(
    program,
    gl.ACTIVE_UNIFORMS,
  );
  for (let i = 0; i < uniformCount; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info)
      uniforms.set(info.name, gl.getUniformLocation(program, info.name));
  }
  const u = (name: string) => uniforms.get(name) ?? null;

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const makeTexture = (unit: number) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );
    return texture;
  };
  const trailTexture = makeTexture(0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const imageTexture = makeTexture(1);
  const ageTexture = makeTexture(2);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(u('u_trail'), 0);
  gl.uniform1i(u('u_image'), 1);
  gl.uniform1i(u('u_age'), 2);

  const trailCanvas = document.createElement('canvas');
  trailCanvas.width = TRAIL_SIZE;
  trailCanvas.height = TRAIL_SIZE;
  const ctx = trailCanvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, TRAIL_SIZE, TRAIL_SIZE);

  const ageCanvas = document.createElement('canvas');
  ageCanvas.width = AGE_SIZE;
  ageCanvas.height = AGE_SIZE;
  const ageCtx = ageCanvas.getContext('2d');
  if (!ageCtx) return null;

  const state = {
    alive: true,
    raf: 0,
    last: 0,
    time: 0,
    visible: true,
    width: 1,
    height: 1,
    ratio: 1,
    points: [] as PixelTrailPoint[],
    force: 0,
    image: null as HTMLImageElement | null,
    imageReady: false,
    imageCells: 0,
    imageWidth: 0,
    imageHeight: 0,
    pointer: { x: 0, y: 0, at: 0, vx: 0, vy: 0, inside: false },
  };

  function addTouch(x: number, y: number, vx: number, vy: number) {
    const s = getSettings();
    const { points } = state;
    const last = points[points.length - 1];
    if (last) {
      const dx = last.x - x;
      const dy = last.y - y;
      const dd = dx * dx + dy * dy;
      const force = Math.max(0.3, Math.min(dd * 10000, 1));
      state.force = force;
      if (s.interpolate) {
        const lines = Math.ceil(
          dd / Math.pow((s.trailSize * 0.5) / s.interpolate, 2),
        );
        if (lines > 1) {
          for (let i = 1; i < lines; i++) {
            points.push({
              x: last.x - (dx / lines) * i,
              y: last.y - (dy / lines) * i,
              age: 0,
              force,
              vx,
              vy,
            });
          }
        }
      }
    }
    points.push({ x, y, age: 0, force: state.force, vx, vy });
  }

  function drawTouch(point: PixelTrailPoint) {
    if (!ctx || !ageCtx) return;
    const s = getSettings();
    const x = point.x * TRAIL_SIZE;
    const y = (1 - point.y) * TRAIL_SIZE;
    let intensity: number;
    if (point.age < s.maxAge * 0.3) {
      intensity = s.ease(point.age / (s.maxAge * 0.3));
    } else {
      intensity = s.ease(1 - (point.age - s.maxAge * 0.3) / (s.maxAge * 0.7));
    }
    intensity *= point.force;
    ctx.globalCompositeOperation = 'screen';
    const radius = TRAIL_SIZE * s.trailSize * intensity;
    const gradient = ctx.createRadialGradient(
      x,
      y,
      Math.max(0, radius * 0.25),
      x,
      y,
      Math.max(0, radius),
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x, y, Math.max(0, radius), 0, Math.PI * 2);
    ctx.fill();
    if (!s.trailColor || radius <= 0) return;
    const scale = AGE_SIZE / TRAIL_SIZE;
    const fresh = Math.round(
      255 * Math.min(Math.max(1 - point.age / s.maxAge, 0), 1),
    );
    const glaze = ageCtx.createRadialGradient(
      x * scale,
      y * scale,
      0,
      x * scale,
      y * scale,
      radius * scale,
    );
    glaze.addColorStop(0, `rgb(${fresh}, ${fresh}, ${fresh})`);
    glaze.addColorStop(0.75, `rgb(${fresh}, ${fresh}, ${fresh})`);
    glaze.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ageCtx.globalCompositeOperation = 'lighten';
    ageCtx.beginPath();
    ageCtx.fillStyle = glaze;
    ageCtx.arc(x * scale, y * scale, radius * scale, 0, Math.PI * 2);
    ageCtx.fill();
  }

  function updateTrail(delta: number) {
    if (!ctx || !ageCtx) return;
    const s = getSettings();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, TRAIL_SIZE, TRAIL_SIZE);
    if (s.trailColor) {
      ageCtx.globalCompositeOperation = 'source-over';
      ageCtx.fillStyle = 'black';
      ageCtx.fillRect(0, 0, AGE_SIZE, AGE_SIZE);
    }
    for (const point of state.points) point.age += delta * 1000;
    state.points = state.points.filter((point) => point.age <= s.maxAge);
    if (!state.points.length) state.force = 0;
    if (s.flow > 0 || s.gravity !== 0) {
      const drag = Math.exp(-3 * delta);
      for (const point of state.points) {
        point.vx *= drag;
        point.vy = point.vy * drag - s.gravity * 1.6 * delta;
        point.x += point.vx * delta;
        point.y += point.vy * delta;
      }
    }
    state.points.forEach(drawTouch);
  }

  function burst(x: number, y: number) {
    const count = 14;
    for (let k = 0; k < count; k++) {
      const angle = (k / count) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 0.35 + Math.random() * 0.25;
      state.points.push({
        x,
        y,
        age: 0,
        force: 1,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
  }

  function uploadImage() {
    if (!gl) return;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    const image = state.image;
    if (!image) {
      state.imageReady = false;
      return;
    }
    const s = getSettings();
    const cells = Math.max(1, Math.round(s.gridSize));
    const sample = document.createElement('canvas');
    sample.width = cells;
    sample.height = cells;
    const sampleCtx = sample.getContext('2d');
    if (!sampleCtx) return;
    const side = Math.max(state.width, state.height);
    const scale = Math.max(
      state.width / image.naturalWidth,
      state.height / image.naturalHeight,
    );
    const sourceSide = side / scale;
    sampleCtx.imageSmoothingQuality = 'high';
    sampleCtx.drawImage(
      image,
      (image.naturalWidth - sourceSide) / 2,
      (image.naturalHeight - sourceSide) / 2,
      sourceSide,
      sourceSide,
      0,
      0,
      cells,
      cells,
    );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sample);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    state.imageReady = true;
    state.imageCells = cells;
    state.imageWidth = state.width;
    state.imageHeight = state.height;
  }

  function resize() {
    const s = getSettings();
    const ratio = s.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    state.width = width;
    state.height = height;
    state.ratio = ratio;
    const pixelWidth = Math.max(1, Math.floor(width * ratio));
    const pixelHeight = Math.max(1, Math.floor(height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    if (
      state.image &&
      (state.imageCells !== Math.max(1, Math.round(s.gridSize)) ||
        state.imageWidth !== width ||
        state.imageHeight !== height)
    ) {
      uploadImage();
    }
  }

  function draw() {
    if (!gl) return;
    const s = getSettings();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, trailTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      trailCanvas,
    );
    if (s.trailColor) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, ageTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        ageCanvas,
      );
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.uniform2f(
      u('u_resolution'),
      state.width * state.ratio,
      state.height * state.ratio,
    );
    gl.uniform1f(u('u_gridSize'), s.gridSize);
    gl.uniform3fv(u('u_color'), s.color);
    gl.uniform3fv(u('u_trailColor'), s.trailColor ?? s.color);
    gl.uniform1f(u('u_ramp'), s.trailColor ? 1 : 0);
    gl.uniform1f(u('u_sigma'), s.goo * state.ratio);
    gl.uniform1f(u('u_shine'), s.shine);
    gl.uniform1f(u('u_glow'), s.glow);
    gl.uniform1i(u('u_shape'), s.shape);
    gl.uniform1i(u('u_decay'), s.decay);
    gl.uniform1f(u('u_gap'), s.gap);
    gl.uniform1f(u('u_sparkle'), s.sparkle);
    gl.uniform1f(u('u_time'), state.time);
    gl.uniform1f(u('u_hasImage'), state.imageReady ? 1 : 0);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function frame(now: number) {
    state.raf = 0;
    if (!state.alive) return;
    const delta = state.last ? (now - state.last) / 1000 : 1 / 60;
    state.last = now;
    state.time += delta;
    resize();
    updateTrail(delta);
    draw();
    if (state.points.length && state.visible)
      state.raf = requestAnimationFrame(frame);
    else state.last = 0;
  }

  function wake() {
    if (!state.raf && state.alive && state.visible)
      state.raf = requestAnimationFrame(frame);
  }

  function toUv(event: PixelTrailPointerSample) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const side = Math.max(rect.width, rect.height);
    return {
      x: (x - rect.width / 2) / side + 0.5,
      y: (rect.height / 2 - y) / side + 0.5,
      inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
    };
  }

  function onMove(event: PixelTrailPointerSample) {
    const { x, y, inside } = toUv(event);
    const pointer = state.pointer;
    const now = performance.now();
    if (inside) {
      const s = getSettings();
      const elapsed = Math.max(0.008, (now - pointer.at) / 1000);
      if (pointer.inside) {
        pointer.vx += ((x - pointer.x) / elapsed - pointer.vx) * 0.5;
        pointer.vy += ((y - pointer.y) / elapsed - pointer.vy) * 0.5;
      } else {
        pointer.vx = 0;
        pointer.vy = 0;
      }
      addTouch(x, y, pointer.vx * s.flow * 0.3, pointer.vy * s.flow * 0.3);
      wake();
    }
    pointer.x = x;
    pointer.y = y;
    pointer.at = now;
    pointer.inside = inside;
  }

  function onDown(event: PixelTrailPointerSample) {
    const { x, y, inside } = toUv(event);
    if (!inside || !getSettings().clickBurst) return;
    burst(x, y);
    wake();
  }

  function onLeave() {
    state.pointer.inside = false;
  }

  function onLost(event: Event) {
    event.preventDefault();
    state.alive = false;
    cancelAnimationFrame(state.raf);
  }
  canvas.addEventListener('webglcontextlost', onLost);

  resize();
  draw();

  return {
    setImage(image) {
      state.image = image;
      uploadImage();
      draw();
    },
    redraw() {
      resize();
      draw();
    },
    setVisible(visible) {
      state.visible = visible;
      if (visible) wake();
    },
    onMove,
    onDown,
    onLeave,
    dispose() {
      state.alive = false;
      cancelAnimationFrame(state.raf);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteTexture(trailTexture);
      gl.deleteTexture(imageTexture);
      gl.deleteTexture(ageTexture);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
