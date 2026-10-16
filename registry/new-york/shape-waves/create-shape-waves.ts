import {
  BLUR_FRAG,
  BLUR_SIGMA,
  COMPOSITE_FRAG,
  FULLSCREEN_VERT,
  INTRO_END,
  MAX_DPR,
  MAX_MASK_SIZE,
  NOISE_CELLS,
  SCENE_FRAG,
  SETTLED_THRESHOLD,
  SHAPE_MODES,
  SIMULATION_STEP,
  TIME_RATE,
  WAVE_DECAY,
  WAVE_FRICTION,
  WAVE_SPEED,
  parseColor,
} from './shape-waves-shaders';
import type { ShapeWavesEngine, ShapeWavesEngineOptions } from './types';

interface GlProgram {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}

interface RenderTarget {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
}

interface GlResources {
  gl: WebGL2RenderingContext;
  vao: WebGLVertexArrayObject;
  buffer: WebGLBuffer;
  scene: GlProgram;
  blur: GlProgram;
  composite: GlProgram;
  maskTexture: WebGLTexture;
  chargeTexture: WebGLTexture;
  sceneTarget: RenderTarget;
  glowA: RenderTarget;
  glowB: RenderTarget;
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('ShapeWaves: could not create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? '';
    gl.deleteShader(shader);
    throw new Error(`ShapeWaves: shader compile failed\n${log}`);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  fragment: string,
  names: string[],
): GlProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERT);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!program) throw new Error('ShapeWaves: could not create program');
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? '';
    gl.deleteProgram(program);
    throw new Error(`ShapeWaves: program link failed\n${log}`);
  }
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  names.forEach((name) =>
    uniforms.set(name, gl.getUniformLocation(program, name)),
  );
  return { program, uniforms };
}

function createTexture(
  gl: WebGL2RenderingContext,
  filter: number,
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) throw new Error('ShapeWaves: could not create texture');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

function createTarget(gl: WebGL2RenderingContext): RenderTarget {
  const texture = createTexture(gl, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) throw new Error('ShapeWaves: could not create framebuffer');
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texture, framebuffer, width: 1, height: 1 };
}

function resizeTarget(
  gl: WebGL2RenderingContext,
  target: RenderTarget,
  width: number,
  height: number,
) {
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
}

const SCENE_UNIFORMS = [
  'uResolution',
  'uPlacement',
  'uGrid',
  'uField',
  'uMotion',
  'uColor',
  'uHover',
  'uBackground',
  'uMask',
  'uCharges',
];
const BLUR_UNIFORMS = ['uDirection', 'uSize', 'uSource'];
const COMPOSITE_UNIFORMS = ['uStrength', 'uSize', 'uScene', 'uGlow'];

function createResources(canvas: HTMLCanvasElement): GlResources {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) throw new Error('ShapeWaves: WebGL2 is not available');
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) throw new Error('ShapeWaves: could not create geometry');
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

  const maskTexture = createTexture(gl, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(4),
  );
  const chargeTexture = createTexture(gl, gl.NEAREST);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R32F,
    1,
    1,
    0,
    gl.RED,
    gl.FLOAT,
    new Float32Array(1),
  );

  return {
    gl,
    vao,
    buffer,
    scene: createProgram(gl, SCENE_FRAG, SCENE_UNIFORMS),
    blur: createProgram(gl, BLUR_FRAG, BLUR_UNIFORMS),
    composite: createProgram(gl, COMPOSITE_FRAG, COMPOSITE_UNIFORMS),
    maskTexture,
    chargeTexture,
    sceneTarget: createTarget(gl),
    glowA: createTarget(gl),
    glowB: createTarget(gl),
  };
}

function destroyResources(res: GlResources) {
  const { gl } = res;
  if (gl.isContextLost()) return;
  gl.deleteProgram(res.scene.program);
  gl.deleteProgram(res.blur.program);
  gl.deleteProgram(res.composite.program);
  gl.deleteTexture(res.maskTexture);
  gl.deleteTexture(res.chargeTexture);
  [res.sceneTarget, res.glowA, res.glowB].forEach((target) => {
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.framebuffer);
  });
  gl.deleteBuffer(res.buffer);
  gl.deleteVertexArray(res.vao);
}

export function createShapeWaves(
  options: ShapeWavesEngineOptions,
): ShapeWavesEngine {
  const { root, canvas, getSettings, isHidden, prefersReducedMotion } = options;

  let res: GlResources | undefined;
  let disposed = false;
  let failed = false;
  let contextLost = false;
  let frameId = 0;
  let lastFrameTime = 0;
  let time = 0;
  let drift: [number, number] = [0, 0];
  let dpr = 1;
  let visible = true;
  let presented = false;
  let width = 1;
  let height = 1;
  let cols = 1;
  let rows = 1;
  let cellPx = 10;
  let gridOrigin: [number, number] = [0, 0];
  let charges = new Float32Array(1);
  let heights = new Float32Array(1);
  let previousHeights = new Float32Array(1);
  let simulationBacklog = 0;
  let introStart = 0;
  let introProgress = INTRO_END;
  let introArmed = false;
  let lastIntro = false;
  let chargesActive = false;
  let hasText = false;
  let bounds: DOMRect | null = null;
  const pointer = { x: 0, y: 0, at: 0, inside: false };
  const maskCanvas = document.createElement('canvas');
  const maskContext = maskCanvas.getContext('2d');

  const glowEnabled = () => getSettings().glow > 0;

  const reportFailure = (error: unknown) => {
    if (disposed || failed) return;
    failed = true;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    if (res) destroyResources(res);
    res = undefined;
    options.onError(error instanceof Error ? error : new Error(String(error)));
  };

  const uploadCharges = () => {
    if (!res) return;
    const { gl } = res;
    gl.bindTexture(gl.TEXTURE_2D, res.chargeTexture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      cols,
      rows,
      gl.RED,
      gl.FLOAT,
      charges,
    );
  };

  const clearCharges = () => {
    heights.fill(0);
    previousHeights.fill(0);
    charges.fill(0);
    chargesActive = false;
  };

  const configureGrid = () => {
    if (!res) return;
    const settings = getSettings();
    const nextCols = Math.max(1, Math.round(width / (settings.cellSize * dpr)));
    cellPx = width / nextCols;
    const nextRows = Math.max(1, Math.floor(height / cellPx));
    gridOrigin = [0, (height - nextRows * cellPx) / 2];
    if (
      nextCols === cols &&
      nextRows === rows &&
      charges.length === cols * rows
    )
      return;
    cols = nextCols;
    rows = nextRows;
    charges = new Float32Array(cols * rows);
    heights = new Float32Array(cols * rows);
    previousHeights = new Float32Array(cols * rows);
    chargesActive = false;
    const { gl } = res;
    gl.bindTexture(gl.TEXTURE_2D, res.chargeTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R32F,
      cols,
      rows,
      0,
      gl.RED,
      gl.FLOAT,
      charges,
    );
  };

  const splash = (x: number, y: number, strength: number) => {
    const settings = getSettings();
    const sigma = Math.max(0.5, ((settings.splashRadius * dpr) / cellPx) * 0.5);
    const reach = Math.ceil(sigma * 2.5);
    const centerCol = (x * dpr - gridOrigin[0]) / cellPx - 0.5;
    const centerRow = (y * dpr - gridOrigin[1]) / cellPx - 0.5;
    const minRow = Math.max(0, Math.floor(centerRow - reach));
    const maxRow = Math.min(rows - 1, Math.ceil(centerRow + reach));
    const minCol = Math.max(0, Math.floor(centerCol - reach));
    const maxCol = Math.min(cols - 1, Math.ceil(centerCol + reach));
    for (let row = minRow; row <= maxRow; row++) {
      const dy = row - centerRow;
      for (let col = minCol; col <= maxCol; col++) {
        const dx = col - centerCol;
        const bump =
          strength * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        const index = row * cols + col;
        heights[index] = Math.min(1.2, (heights[index] ?? 0) + bump);
      }
    }
    chargesActive = true;
  };

  const stepRipples = () => {
    const lastCol = cols - 1;
    const lastRow = rows - 1;
    let peak = 0;
    for (let row = 0; row < rows; row++) {
      const up = (row === 0 ? row : row - 1) * cols;
      const down = (row === lastRow ? row : row + 1) * cols;
      const base = row * cols;
      for (let col = 0; col < cols; col++) {
        const index = base + col;
        const left = base + (col === 0 ? col : col - 1);
        const right = base + (col === lastCol ? col : col + 1);
        const current = heights[index] ?? 0;
        const laplacian =
          (heights[left] ?? 0) +
          (heights[right] ?? 0) +
          (heights[up + col] ?? 0) +
          (heights[down + col] ?? 0) -
          4 * current;
        const velocity =
          (current - (previousHeights[index] ?? 0)) * WAVE_FRICTION;
        const next = (current + velocity + WAVE_SPEED * laplacian) * WAVE_DECAY;
        previousHeights[index] = next;
        const charge = Math.min(1, Math.max(0, next));
        charges[index] = charge;
        if (charge > peak) peak = charge;
      }
    }
    const swap = heights;
    heights = previousHeights;
    previousHeights = swap;
    return peak;
  };

  const updateCharges = (deltaSeconds: number) => {
    if (!chargesActive) return false;
    simulationBacklog = Math.min(
      simulationBacklog + deltaSeconds,
      SIMULATION_STEP * 4,
    );
    let peak = 1;
    while (simulationBacklog >= SIMULATION_STEP) {
      simulationBacklog -= SIMULATION_STEP;
      peak = stepRipples();
    }
    if (peak < SETTLED_THRESHOLD) clearCharges();
    uploadCharges();
    return chargesActive;
  };

  const isAnimating = () => {
    const settings = getSettings();
    return (
      visible &&
      !isHidden() &&
      !settings.paused &&
      settings.speed > 0 &&
      !prefersReducedMotion()
    );
  };

  const drawFullscreen = (gl: WebGL2RenderingContext) => {
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const drawScene = (r: GlResources, toSurface: boolean) => {
    const { gl, scene } = r;
    const settings = getSettings();
    const u = scene.uniforms;
    const color = parseColor(settings.color, '#929292');
    const hover = parseColor(settings.hoverColor, '#ffffff');
    const background = parseColor(settings.backgroundColor, '#000000');
    gl.useProgram(scene.program);
    gl.uniform2f(u.get('uResolution') ?? null, width, height);
    gl.uniform4f(
      u.get('uPlacement') ?? null,
      gridOrigin[0],
      gridOrigin[1],
      rows,
      introProgress,
    );
    gl.uniform4f(
      u.get('uGrid') ?? null,
      cellPx,
      Math.min(1, Math.max(0.1, settings.dotSize)),
      SHAPE_MODES[settings.shapes] ?? 0,
      cols,
    );
    gl.uniform4f(
      u.get('uField') ?? null,
      NOISE_CELLS * cellPx * settings.scale,
      0.5 - (settings.brightness - 0.5) * 0.4,
      2.8 * settings.contrast,
      time,
    );
    gl.uniform4f(
      u.get('uMotion') ?? null,
      drift[0],
      drift[1],
      hasText ? 1 : 0,
      settings.fade,
    );
    gl.uniform3f(u.get('uColor') ?? null, color[0], color[1], color[2]);
    gl.uniform4f(
      u.get('uHover') ?? null,
      hover[0],
      hover[1],
      hover[2],
      toSurface ? 0 : 1,
    );
    gl.uniform3f(
      u.get('uBackground') ?? null,
      background[0],
      background[1],
      background[2],
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.maskTexture);
    gl.uniform1i(u.get('uMask') ?? null, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, r.chargeTexture);
    gl.uniform1i(u.get('uCharges') ?? null, 1);
    drawFullscreen(gl);
  };

  const drawBlur = (
    r: GlResources,
    source: WebGLTexture,
    target: RenderTarget,
    horizontal: boolean,
  ) => {
    const { gl, blur } = r;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.useProgram(blur.program);
    gl.uniform4f(
      blur.uniforms.get('uDirection') ?? null,
      horizontal ? 1 / target.width : 0,
      horizontal ? 0 : 1 / target.height,
      BLUR_SIGMA,
      horizontal ? 1 : 0,
    );
    gl.uniform2f(
      blur.uniforms.get('uSize') ?? null,
      target.width,
      target.height,
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source);
    gl.uniform1i(blur.uniforms.get('uSource') ?? null, 0);
    drawFullscreen(gl);
  };

  const drawFrame = (r: GlResources) => {
    const { gl } = r;
    gl.bindVertexArray(r.vao);
    if (!glowEnabled()) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      drawScene(r, true);
      return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.sceneTarget.framebuffer);
    gl.viewport(0, 0, width, height);
    drawScene(r, false);
    drawBlur(r, r.sceneTarget.texture, r.glowA, true);
    drawBlur(r, r.glowA.texture, r.glowB, false);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    const { composite } = r;
    gl.useProgram(composite.program);
    gl.uniform1f(
      composite.uniforms.get('uStrength') ?? null,
      2 * getSettings().glow,
    );
    gl.uniform2f(composite.uniforms.get('uSize') ?? null, width, height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.sceneTarget.texture);
    gl.uniform1i(composite.uniforms.get('uScene') ?? null, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, r.glowB.texture);
    gl.uniform1i(composite.uniforms.get('uGlow') ?? null, 1);
    drawFullscreen(gl);
  };

  const render = (now: number) => {
    frameId = 0;
    if (disposed || failed || contextLost || !res) return;
    const settings = getSettings();
    const deltaSeconds = lastFrameTime
      ? Math.min(0.1, (now - lastFrameTime) / 1000)
      : 0;
    lastFrameTime = now;
    const animating = isAnimating();
    if (animating) {
      time += deltaSeconds * TIME_RATE * settings.speed;
      const angle = (settings.direction * Math.PI) / 180;
      const distance = settings.flow * cellPx * deltaSeconds;
      drift = [
        drift[0] + Math.cos(angle) * distance,
        drift[1] + Math.sin(angle) * distance,
      ];
    }
    const hovering = visible && !isHidden() && updateCharges(deltaSeconds);
    if (introArmed) {
      introArmed = false;
      introStart = now;
      introProgress = 0;
    }
    const introPlaying = introProgress < INTRO_END;
    if (introPlaying) {
      introProgress = Math.min(
        INTRO_END,
        ((now - introStart) / 1000 / settings.introDuration) * INTRO_END,
      );
    }
    try {
      drawFrame(res);
    } catch (error) {
      reportFailure(error);
      return;
    }
    if (!presented) {
      presented = true;
      options.onReady();
    }
    if (animating || hovering || introPlaying)
      frameId = requestAnimationFrame(render);
    else lastFrameTime = 0;
  };

  const wake = () => {
    if (disposed || failed || contextLost || frameId || !res) return;
    frameId = requestAnimationFrame(render);
  };

  const drawMask = () => {
    if (!res || !maskContext) return;
    const settings = getSettings();
    const content = settings.text.trim();
    hasText = content.length > 0;
    const maskScale = hasText
      ? Math.min(1, MAX_MASK_SIZE / Math.max(width, height))
      : 0;
    const maskWidth = hasText ? Math.max(1, Math.round(width * maskScale)) : 1;
    const maskHeight = hasText
      ? Math.max(1, Math.round(height * maskScale))
      : 1;

    maskCanvas.width = maskWidth;
    maskCanvas.height = maskHeight;
    maskContext.fillStyle = '#000';
    maskContext.fillRect(0, 0, maskWidth, maskHeight);

    if (hasText) {
      let fontPx = Math.max(1, settings.textSize * maskHeight);
      maskContext.font = `${settings.fontWeight} ${fontPx}px ${settings.fontFamily}`;
      const measured = maskContext.measureText(content).width;
      const maxWidth = maskWidth * 0.9;
      if (measured > maxWidth) {
        fontPx = Math.max(1, (fontPx * maxWidth) / measured);
        maskContext.font = `${settings.fontWeight} ${fontPx}px ${settings.fontFamily}`;
      }
      maskContext.textAlign = 'center';
      maskContext.textBaseline = 'alphabetic';
      const metrics = maskContext.measureText(content);
      const x =
        (maskWidth +
          metrics.actualBoundingBoxLeft -
          metrics.actualBoundingBoxRight) /
        2;
      const y =
        (maskHeight +
          metrics.actualBoundingBoxAscent -
          metrics.actualBoundingBoxDescent) /
        2;
      maskContext.fillStyle = '#fff';
      maskContext.fillText(content, x, y);
    }

    const { gl } = res;
    gl.bindTexture(gl.TEXTURE_2D, res.maskTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      maskCanvas,
    );
  };

  const applySettings = () => {
    if (disposed || failed || !res) return;
    const settings = getSettings();
    configureGrid();
    if (settings.intro !== lastIntro) {
      lastIntro = settings.intro;
      if (settings.intro && !prefersReducedMotion()) introArmed = true;
    }
    if (!settings.interactive && chargesActive) {
      clearCharges();
      uploadCharges();
    }
    wake();
  };

  const applyMask = () => {
    if (disposed || failed || !res) return;
    drawMask();
    applySettings();
    const settings = getSettings();
    if (!settings.text.trim() || !document.fonts?.load) return;
    document.fonts
      .load(`${settings.fontWeight} 32px ${settings.fontFamily}`)
      .then(() => {
        if (disposed || failed) return;
        drawMask();
        wake();
      })
      .catch(() => {});
  };

  const resize = () => {
    if (disposed || failed || !res) return;
    bounds = null;
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const { gl } = res;
    resizeTarget(gl, res.sceneTarget, width, height);
    const halfWidth = Math.max(1, Math.ceil(width / 2));
    const halfHeight = Math.max(1, Math.ceil(height / 2));
    resizeTarget(gl, res.glowA, halfWidth, halfHeight);
    resizeTarget(gl, res.glowB, halfWidth, halfHeight);
    drawMask();
    applySettings();
  };

  const setup = () => {
    try {
      res = createResources(canvas);
      cols = 0;
      rows = 0;
      charges = new Float32Array(0);
      resize();
      applyMask();
    } catch (error) {
      reportFailure(error);
    }
  };

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    res = undefined;
  };

  const handleContextRestored = () => {
    if (disposed || failed) return;
    contextLost = false;
    setup();
  };

  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);
  setup();

  return {
    applySettings,
    applyMask,
    resize,
    wake,
    replayIntro() {
      if (disposed || failed || !getSettings().intro || prefersReducedMotion())
        return;
      introArmed = true;
      wake();
    },
    setVisible(next: boolean) {
      visible = next;
      if (visible) wake();
    },
    invalidateBounds() {
      bounds = null;
    },
    pointerMove(clientX: number, clientY: number) {
      if (!getSettings().interactive || !res) return;
      if (!bounds) bounds = root.getBoundingClientRect();
      const now = performance.now();
      const x = clientX - bounds.left;
      const y = clientY - bounds.top;
      const inside =
        x >= 0 && y >= 0 && x <= bounds.width && y <= bounds.height;
      if (inside) {
        const elapsed = pointer.inside ? Math.max(8, now - pointer.at) : 16;
        const travelled = pointer.inside
          ? Math.hypot(x - pointer.x, y - pointer.y)
          : 0;
        const speed = (travelled / elapsed) * 1000;
        splash(
          x,
          y,
          Math.min(1, 0.22 + speed * 0.0006) * getSettings().splashStrength,
        );
        wake();
      }
      pointer.x = x;
      pointer.y = y;
      pointer.at = now;
      pointer.inside = inside;
    },
    dispose() {
      disposed = true;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      if (res) {
        const { gl } = res;
        destroyResources(res);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      res = undefined;
    },
  };
}
