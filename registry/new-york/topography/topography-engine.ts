import {
  BLOOM_LEVELS,
  FAR,
  FREQUENCY,
  HEIGHT,
  INTRO_SECONDS,
  MARKER_SPACING,
  MAX_CELLS,
  MAX_PULSES,
  NEAR,
  ORBIT,
  SCULPT_SIZE,
  SUN,
} from './topography-constants';
import {
  clamp,
  fineDetail,
  lens,
  orient,
  relief,
  smoother,
  toRgb,
  viewProjection,
} from './topography-math';
import {
  BLUR,
  COMPOSITE,
  DOWNSAMPLE,
  FIELD,
  FULLSCREEN,
  MARKER_FRAGMENT,
  MARKER_VERTEX,
  SCULPT,
  terrainFragment,
  terrainVertex,
} from './topography-shaders';
import type {
  TopographyBox,
  TopographyCamera,
  TopographyEngine,
  TopographyField,
  TopographyGrid,
  TopographyHit,
  TopographyProgram,
  TopographyState,
  TopographyPulse,
  TopographySettings,
  TopographyTarget,
  Vec3,
} from './types';

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
): TopographyProgram | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const total: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < total; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info)
      uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(
        program,
        info.name,
      );
  }
  return { program, uniforms };
};

const uniform = (p: TopographyProgram) => (name: string) =>
  p.uniforms[name] ?? null;

/**
 * Builds the WebGL2 terrain renderer on `canvas`, sized from `container`.
 * Faithful port of the React Bits Topography effect body.
 */
export function createTopography(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  getSettings: () => TopographySettings,
): TopographyEngine | null {
  const initial = getSettings();
  const ratio = Math.min(initial.dpr || window.devicePixelRatio || 1, 2);
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: ratio < 1.5,
    depth: true,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
  const terrain = link(
    gl,
    terrainVertex(floatTargets),
    terrainFragment(floatTargets),
  );
  const fieldProgram = floatTargets ? link(gl, FULLSCREEN, FIELD) : null;
  const sculptProgram = floatTargets ? link(gl, FULLSCREEN, SCULPT) : null;
  const downProgram = link(gl, FULLSCREEN, DOWNSAMPLE);
  const blurProgram = link(gl, FULLSCREEN, BLUR);
  const compositeProgram = link(gl, FULLSCREEN, COMPOSITE);
  const markerProgram = link(gl, MARKER_VERTEX, MARKER_FRAGMENT);
  if (
    !terrain ||
    !downProgram ||
    !blurProgram ||
    !compositeProgram ||
    !markerProgram
  )
    return null;

  const vao = gl.createVertexArray();
  const format = floatTargets ? gl.RGBA16F : gl.RGBA8;

  const createTexture = (
    width: number,
    height: number,
    internal: number,
    wrap: number,
  ) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, internal, width, height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return texture;
  };

  const createTarget = (): TopographyTarget => ({
    texture: null,
    framebuffer: gl.createFramebuffer(),
    depth: null,
    width: 0,
    height: 0,
  });

  const allocate = (
    target: TopographyTarget,
    width: number,
    height: number,
    withDepth: boolean,
  ) => {
    if (target.texture && target.width === width && target.height === height)
      return;
    if (target.texture) gl.deleteTexture(target.texture);
    target.texture = createTexture(width, height, format, gl.CLAMP_TO_EDGE);
    target.width = width;
    target.height = height;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      target.texture,
      0,
    );
    if (withDepth) {
      if (!target.depth) target.depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, target.depth);
      gl.renderbufferStorage(
        gl.RENDERBUFFER,
        gl.DEPTH_COMPONENT24,
        width,
        height,
      );
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        target.depth,
      );
    }
  };

  const source = createTarget();
  const levels: [TopographyTarget, TopographyTarget][] = Array.from(
    { length: BLOOM_LEVELS },
    () => [createTarget(), createTarget()],
  );
  const sculpt = sculptProgram
    ? [0, 1].map(() => {
        const texture = createTexture(
          SCULPT_SIZE,
          SCULPT_SIZE,
          gl.RG16F,
          gl.REPEAT,
        );
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return { texture, framebuffer };
      })
    : null;
  const blank = createTexture(1, 1, gl.RGBA8, gl.REPEAT);
  const field: TopographyField = {
    texture: null,
    heights: null,
    framebuffer: gl.createFramebuffer(),
    width: 0,
    height: 0,
  };
  let sculptIndex = 0;
  const sculptTexture = () => (sculpt ? sculpt[sculptIndex]!.texture : blank);

  const reserveField = (width: number, height: number) => {
    if (field.texture && width <= field.width && height <= field.height) return;
    if (field.texture) gl.deleteTexture(field.texture);
    if (field.heights) gl.deleteTexture(field.heights);
    field.width = Math.max(width, Math.ceil(field.width * 1.25), 64);
    field.height = Math.max(height, Math.ceil(field.height * 1.25), 64);
    field.texture = createTexture(
      field.width,
      field.height,
      gl.RGBA16F,
      gl.CLAMP_TO_EDGE,
    );
    field.heights = createTexture(
      field.width,
      field.height,
      gl.R32F,
      gl.CLAMP_TO_EDGE,
    );
    gl.bindTexture(gl.TEXTURE_2D, field.heights);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, field.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      field.texture,
      0,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT1,
      gl.TEXTURE_2D,
      field.heights,
      0,
    );
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
  };

  const bind = (unit: number, texture: WebGLTexture | null) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  };

  const matrix = new Float32Array(16);
  const pulseData = new Float32Array(MAX_PULSES * 4);
  const glitchData = new Float32Array(12);
  const glitch = { until: 0, next: 1.5, roll: 0, seed: 0 };
  let entropy = 7919;
  const random = () => {
    entropy = (entropy * 16807) % 2147483647;
    return (entropy - 1) / 2147483646;
  };
  const pulses: TopographyPulse[] = [];
  const pointer = { x: 0, y: 0, inside: false };
  const view = { width: 1, height: 1, ratio: 1, cell: 0.05, cellKey: '' };
  const state: TopographyState = {
    intro: initial.intro && !initial.reduce ? 0 : 1,
    rise: 1,
    travelX: 0,
    travelZ: 0,
    morph: 0,
    yaw: 0,
    pitch: 0,
    yawVelocity: 0,
    pitchVelocity: 0,
    presence: 0,
    focus: ORBIT,
    hit: null,
    brushFrom: null,
    sculptLife: 0,
    burst: null,
    level: 0,
    trace: 0,
    clock: 0,
    tilt: initial.tilt,
    elevation: initial.elevation,
    scale: initial.scale,
  };
  state.rise = smoother(state.intro);
  let raf = 0;
  let last = 0;
  let visible = true;
  let quiet = 0;

  const camera = (): TopographyCamera => {
    const pitch = Math.min(
      (state.tilt * Math.PI) / 180 + state.pitch,
      Math.PI / 2 - 1e-4,
    );
    const frame = orient(state.yaw, pitch);
    const lift = state.elevation * HEIGHT * state.rise * 0.18;
    const clearance = state.elevation * HEIGHT * state.rise * 1.3 + 0.9;
    const distance = Math.max(ORBIT, (clearance - lift) / Math.sin(pitch));
    return {
      ...frame,
      distance,
      eye: [
        -frame.f[0] * distance,
        lift - frame.f[1] * distance,
        -frame.f[2] * distance,
      ],
    };
  };

  const rayDirection = (
    cam: TopographyCamera,
    nx: number,
    ny: number,
  ): Vec3 => {
    const aspect = view.width / view.height;
    const t = lens(aspect);
    const axis = (i: 0 | 1 | 2) =>
      cam.f[i] + cam.r[i] * nx * t * aspect + cam.u[i] * ny * t;
    const d: Vec3 = [axis(0), axis(1), axis(2)];
    const length = Math.hypot(d[0], d[1], d[2]);
    return [d[0] / length, d[1] / length, d[2] / length];
  };

  const along = (cam: TopographyCamera, d: Vec3) =>
    d[0] * cam.f[0] + d[1] * cam.f[1] + d[2] * cam.f[2];

  const groundDepth = (cam: TopographyCamera, ny: number) => {
    const d = rayDirection(cam, 0, ny);
    if (d[1] > -1e-3) return Infinity;
    return (cam.eye[1] / -d[1]) * along(cam, d);
  };

  const nearRange = (cam: TopographyCamera, s: TopographySettings): Vec3 => [
    groundDepth(cam, -1) * 0.9,
    cam.distance,
    s.foreground,
  ];

  const settleAt = (
    cam: TopographyCamera,
    near: Vec3,
    x: number,
    z: number,
  ) => {
    const depth =
      (x - cam.eye[0]) * cam.f[0] -
      cam.eye[1] * cam.f[1] +
      (z - cam.eye[2]) * cam.f[2];
    return (
      near[2] +
      (1 - near[2]) *
        smoother((depth - near[0]) / Math.max(near[1] - near[0], 1e-3))
    );
  };

  const pick = (
    cam: TopographyCamera,
    s: TopographySettings,
    nx: number,
    ny: number,
  ): TopographyHit | null => {
    const d = rayDirection(cam, nx, ny);
    const height = state.elevation * HEIGHT * state.rise;
    const frequency = FREQUENCY / state.scale;
    const near = nearRange(cam, s);
    const above = (distance: number) => {
      const x = cam.eye[0] + d[0] * distance;
      const z = cam.eye[2] + d[2] * distance;
      const ground = relief(
        state.travelX + x,
        state.travelZ + z,
        frequency,
        state.morph * 0.37,
        state.morph * 0.23,
      );
      return (
        cam.eye[1] +
        d[1] * distance -
        ground * height * settleAt(cam, near, x, z)
      );
    };
    let distance = NEAR;
    let gap = above(distance);
    for (let i = 0; i < 200 && distance < FAR * 0.5; i++) {
      const next = distance + Math.max(0.02, gap * 0.4);
      const value = above(next);
      if (value < 0) {
        let lo = distance;
        let hi = next;
        for (let k = 0; k < 10; k++) {
          const mid = (lo + hi) * 0.5;
          if (above(mid) < 0) hi = mid;
          else lo = mid;
        }
        return {
          x: state.travelX + cam.eye[0] + d[0] * hi,
          y: cam.eye[1] + d[1] * hi,
          z: state.travelZ + cam.eye[2] + d[2] * hi,
          depth: hi * along(cam, d),
        };
      }
      distance = next;
      gap = value;
    }
    return null;
  };

  const footprint = (
    cam: TopographyCamera,
    s: TopographySettings,
    fadeEnd: number,
  ) => {
    const ceiling =
      state.elevation * HEIGHT * state.rise * 1.7 + 0.2 + s.mouseStrength;
    const box: TopographyBox = {
      minX: Infinity,
      maxX: -Infinity,
      minZ: Infinity,
      maxZ: -Infinity,
      near: Infinity,
    };
    const add = (d: Vec3, distance: number) => {
      const x = cam.eye[0] + d[0] * distance;
      const z = cam.eye[2] + d[2] * distance;
      box.minX = Math.min(box.minX, x);
      box.maxX = Math.max(box.maxX, x);
      box.minZ = Math.min(box.minZ, z);
      box.maxZ = Math.max(box.maxZ, z);
    };
    for (const nx of [-1.08, 0, 1.08]) {
      for (const ny of [-1.08, 1.08]) {
        const d = rayDirection(cam, nx, ny);
        const forward = Math.max(along(cam, d), 1e-3);
        let near = NEAR;
        let far = (fadeEnd * 1.05) / forward;
        if (d[1] < -1e-4) {
          near = Math.max(NEAR, (cam.eye[1] - ceiling) / -d[1]);
          far = Math.min(far, cam.eye[1] / -d[1]);
        }
        near = Math.min(near, far);
        add(d, near);
        add(d, far);
        box.near = Math.min(box.near, near * forward);
      }
    }
    return box;
  };

  const grid = (box: TopographyBox, cell: number): TopographyGrid => {
    const camX = Math.floor(state.travelX / cell);
    const camZ = Math.floor(state.travelZ / cell);
    const fracX = state.travelX - camX * cell;
    const fracZ = state.travelZ - camZ * cell;
    const k0 = Math.floor((box.minX + fracX) / cell) - 2;
    const m0 = Math.floor((box.minZ + fracZ) / cell) - 2;
    const columns = clamp(
      Math.ceil((box.maxX + fracX) / cell) + 2 - k0,
      1,
      4000,
    );
    const rows = clamp(
      Math.ceil((box.maxZ + fracZ) / cell) + 2 - m0,
      1,
      Math.floor((MAX_CELLS * 1.5) / columns),
    );
    return { cell, camX, camZ, fracX, fracZ, k0, m0, columns, rows };
  };

  const render = () => {
    const s = getSettings();
    const cam = camera();
    viewProjection(cam, view.width / view.height, matrix);

    const bottom = groundDepth(cam, -1);
    const top = Math.min(groundDepth(cam, 1), cam.distance * 3.2);
    const horizon = Math.max(top, bottom * 1.6, cam.distance * 1.4);
    const fadeEnd = horizon + (bottom * 1.8 - horizon) * s.fog;
    const fadeStart = fadeEnd * 0.7 + (bottom * 0.7 - fadeEnd * 0.7) * s.fog;
    const box = footprint(cam, s, fadeEnd);

    const cellKey = `${view.width}x${view.height}@${view.ratio}|${Math.round(state.tilt / 4)}|${Math.round(state.elevation * 5)}|${s.fog}`;
    if (cellKey !== view.cellKey) {
      view.cellKey = cellKey;
      const focal =
        (view.height * view.ratio * 0.5) / lens(view.width / view.height);
      let cell = clamp((14 * Math.max(box.near, 0.5)) / focal, 0.02, 0.4);
      const cells =
        ((box.maxX - box.minX) * (box.maxZ - box.minZ)) / (cell * cell);
      if (cells > MAX_CELLS) cell *= Math.sqrt(cells / MAX_CELLS);
      view.cell = cell;
    }

    const color = toRgb(s.color);
    const height = state.elevation * HEIGHT * state.rise;
    const layout = grid(box, view.cell);
    const near = nearRange(cam, s);
    const dots = s.markers >= 0 ? grid(box, MARKER_SPACING) : null;
    const touch = state.hit && s.mouseInteraction ? state.presence : 0;
    const heatStrength = touch * (0.35 + 0.5 * s.mouseStrength);
    const focusScale = s.depthOfField * view.height * 0.016;
    const reveal = smoother(state.intro / 0.35);
    const hitX = state.hit ? state.hit.x : 0;
    const hitZ = state.hit ? state.hit.z : 0;
    const frequency = FREQUENCY / state.scale;

    pulseData.fill(0);
    pulses.forEach((p, i) => {
      pulseData.set(
        [
          p.x,
          p.z,
          p.age * 4.2,
          Math.exp(-p.age * 1.1) * smoother(p.age / 0.08),
        ],
        i * 4,
      );
    });

    gl.bindVertexArray(vao);
    if (fieldProgram) {
      const width = layout.columns + 7;
      const height2 = layout.rows + 7;
      reserveField(width, height2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, field.framebuffer);
      gl.viewport(0, 0, width, height2);
      gl.useProgram(fieldProgram.program);
      const f = uniform(fieldProgram);
      bind(0, sculptTexture());
      gl.uniform1i(f('uSculpt'), 0);
      gl.uniform1f(f('uSculptOn'), sculpt ? 1 : 0);
      gl.uniform1f(f('uFrequency'), frequency);
      gl.uniform2f(f('uMorph'), state.morph * 0.37, state.morph * 0.23);
      gl.uniform4fv(f('uPulses'), pulseData);
      gl.uniform2i(
        f('uBase'),
        layout.k0 - 2 + layout.camX,
        layout.m0 - 2 + layout.camZ,
      );
      gl.uniform1f(f('uCell'), layout.cell);
      gl.uniform1f(f('uDetail'), s.detail);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    const drawTerrain = (
      pixel: number,
      width: number,
      targetHeight: number,
      stride: number,
    ) => {
      gl.viewport(0, 0, width, targetHeight);
      gl.useProgram(terrain.program);
      const u = uniform(terrain);
      bind(0, fieldProgram ? field.texture : blank);
      gl.uniform1i(u('uField'), 0);
      bind(1, fieldProgram ? field.heights : blank);
      gl.uniform1i(u('uHeightField'), 1);
      gl.uniform1f(u('uFrequency'), frequency);
      gl.uniform2f(u('uMorph'), state.morph * 0.37, state.morph * 0.23);
      gl.uniform4fv(u('uPulses'), pulseData);
      gl.uniform2i(u('uOrigin'), layout.k0, layout.m0);
      gl.uniform2i(u('uCamCell'), layout.camX, layout.camZ);
      gl.uniform2f(u('uCamFrac'), layout.fracX, layout.fracZ);
      gl.uniform1f(u('uCell'), layout.cell);
      gl.uniform1i(u('uStride'), stride);
      gl.uniform1f(u('uHeight'), height);
      gl.uniform3fv(u('uEye'), cam.eye);
      gl.uniform3fv(u('uForward'), cam.f);
      gl.uniform3fv(u('uNear'), near);
      gl.uniform1f(u('uRefDepth'), cam.distance);
      gl.uniformMatrix4fv(u('uViewProj'), false, matrix);
      gl.uniform1f(u('uDetail'), s.detail);
      gl.uniform1f(u('uLines'), s.lineCount);
      gl.uniform1f(u('uLineWidth'), s.lineWidth * pixel);
      gl.uniform1f(u('uMajor'), s.majorLines ? 1 : 0);
      gl.uniform3fv(u('uColor'), color);
      gl.uniform1f(u('uBrightness'), s.brightness);
      gl.uniform2f(u('uFade'), fadeStart, fadeEnd);
      gl.uniform3f(
        u('uFocus'),
        state.focus,
        focusScale * pixel,
        view.height * 0.03 * pixel,
      );
      gl.uniform4f(u('uHeat'), hitX, hitZ, 0.9 * s.mouseRadius, heatStrength);
      gl.uniform4f(
        u('uLamp'),
        hitX,
        state.hit ? state.hit.y + 1.4 : 0,
        hitZ,
        heatStrength,
      );
      gl.uniform4f(u('uTrace'), state.level, state.trace, hitX, hitZ);
      gl.uniform3fv(u('uSun'), SUN);
      gl.uniform1f(u('uReveal'), reveal);
      gl.uniform1f(u('uLightMode'), s.lightMode ? 1 : 0);
      gl.uniform1f(u('uOpacity'), s.opacity);
      gl.uniform4fv(u('uGlitch'), glitchData);
      gl.uniform1f(u('uGlitchSeed'), glitch.seed);
      gl.uniform1f(u('uPixel'), pixel);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LESS);
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawArraysInstanced(
        gl.TRIANGLE_STRIP,
        0,
        2 * (Math.ceil(layout.columns / stride) + 1),
        Math.ceil(layout.rows / stride),
      );
      if (dots) {
        gl.useProgram(markerProgram.program);
        const m = uniform(markerProgram);
        bind(2, sculptTexture());
        gl.uniform1i(m('uSculpt'), 2);
        gl.uniform1f(m('uSculptOn'), sculpt ? 1 : 0);
        gl.uniform1f(m('uFrequency'), frequency);
        gl.uniform2f(m('uMorph'), state.morph * 0.37, state.morph * 0.23);
        gl.uniform4fv(m('uPulses'), pulseData);
        gl.uniform3fv(m('uEye'), cam.eye);
        gl.uniform3fv(m('uForward'), cam.f);
        gl.uniform3fv(m('uNear'), near);
        gl.uniform2i(m('uOrigin'), dots.k0, dots.m0);
        gl.uniform2i(m('uCamCell'), dots.camX, dots.camZ);
        gl.uniform2f(m('uCamFrac'), dots.fracX, dots.fracZ);
        gl.uniform1f(m('uSpacing'), dots.cell);
        gl.uniform1i(m('uColumns'), dots.columns + 1);
        gl.uniform1f(m('uHeight'), height);
        gl.uniformMatrix4fv(m('uViewProj'), false, matrix);
        gl.uniform2f(m('uView'), width, targetHeight);
        gl.uniform1f(m('uSize'), 4 * pixel);
        gl.uniform1f(m('uRefDepth'), cam.distance);
        gl.uniform4f(m('uHeat'), hitX, hitZ, 1.2 * s.mouseRadius, heatStrength);
        gl.uniform1f(m('uTime'), state.clock);
        gl.uniform4fv(m('uGlitch'), glitchData);
        gl.uniform1f(m('uPixel'), pixel);
        gl.uniform3fv(m('uColor'), color);
        gl.uniform2f(m('uFade'), fadeStart, fadeEnd);
        gl.uniform1f(m('uReveal'), reveal);
        gl.uniform1f(m('uBrightness'), s.brightness);
        gl.uniform1f(m('uLightMode'), s.lightMode ? 1 : 0);
        gl.uniform1f(m('uOpacity'), s.opacity);
        gl.uniform1f(m('uStyle'), s.markers);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArraysInstanced(
          gl.TRIANGLE_STRIP,
          0,
          4,
          (dots.columns + 1) * (dots.rows + 1),
        );
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      }
      gl.disable(gl.DEPTH_TEST);
    };

    const bloom = s.glow > 0.001;
    if (bloom) {
      const width = Math.max(1, Math.round(view.width / 2));
      const targetHeight = Math.max(1, Math.round(view.height / 2));
      allocate(source, width, targetHeight, true);
      levels.forEach((pair, index) => {
        const w = Math.max(1, Math.round(view.width / 2 ** (index + 2)));
        const h = Math.max(1, Math.round(view.height / 2 ** (index + 2)));
        allocate(pair[0], w, h, false);
        allocate(pair[1], w, h, false);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, source.framebuffer);
      drawTerrain(0.5, width, targetHeight, 2);
      const down = uniform(downProgram);
      const blur = uniform(blurProgram);
      let from = source;
      levels.forEach(([front, back]) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, front.framebuffer);
        gl.viewport(0, 0, front.width, front.height);
        gl.useProgram(downProgram.program);
        bind(0, from.texture);
        gl.uniform1i(down('uSource'), 0);
        gl.uniform2f(down('uTarget'), front.width, front.height);
        gl.uniform2f(down('uTexel'), 1 / from.width, 1 / from.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.useProgram(blurProgram.program);
        gl.uniform1i(blur('uSource'), 0);
        gl.uniform2f(blur('uTarget'), back.width, back.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, back.framebuffer);
        bind(0, front.texture);
        gl.uniform2f(blur('uStep'), 1 / front.width, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, front.framebuffer);
        bind(0, back.texture);
        gl.uniform2f(blur('uStep'), 0, 1 / back.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        from = front;
      });
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    drawTerrain(view.ratio, canvas.width, canvas.height, 1);

    if (bloom) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(compositeProgram.program);
      const c = uniform(compositeProgram);
      levels.forEach(([front], index) => {
        bind(index, front.texture);
        gl.uniform1i(c(`uBloom${index}`), index);
      });
      gl.uniform2f(c('uView'), canvas.width, canvas.height);
      gl.uniform1f(c('uGlow'), s.glow * reveal);
      gl.uniform1f(c('uLightMode'), s.lightMode ? 1 : 0);
      gl.enable(gl.BLEND);
      if (s.lightMode) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      else gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.BLEND);
    }
    for (let unit = BLOOM_LEVELS; unit >= 0; unit--) bind(unit, null);
  };

  const updateSculpt = (s: TopographySettings, dt: number) => {
    if (!sculpt || !sculptProgram) return false;
    const brush =
      s.mouseInteraction && s.hoverEffect === 'lift' && state.presence > 0.001
        ? state.hit
        : null;
    const burst = state.burst;
    if (!brush && !burst && state.sculptLife <= 0) return false;
    const from = state.brushFrom || brush;
    const read = sculpt[sculptIndex]!;
    const write = sculpt[1 - sculptIndex]!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
    gl.viewport(0, 0, SCULPT_SIZE, SCULPT_SIZE);
    gl.useProgram(sculptProgram.program);
    const u = uniform(sculptProgram);
    bind(0, read.texture);
    gl.uniform1i(u('uPrevious'), 0);
    if (brush && from)
      gl.uniform4f(u('uSegment'), from.x, from.z, brush.x, brush.z);
    else gl.uniform4f(u('uSegment'), 0, 0, 0, 0);
    gl.uniform4f(
      u('uBrush'),
      1.1 * s.mouseRadius,
      0.9 * s.mouseStrength,
      1 - Math.exp(-dt * 7),
      brush ? state.presence : 0,
    );
    if (burst) {
      const before = smoother(burst.age / 0.7);
      burst.age += dt;
      const amount =
        (smoother(burst.age / 0.7) - before) *
        0.9 *
        Math.max(s.mouseStrength, 0.3);
      gl.uniform4f(u('uBurst'), burst.x, burst.z, 1.6 * s.mouseRadius, amount);
      if (burst.age >= 0.7) state.burst = null;
    } else {
      gl.uniform4f(u('uBurst'), 0, 0, 1, 0);
    }
    const tau = 0.25 + 3 * s.trail * s.trail;
    gl.uniform2f(u('uDecay'), Math.exp(-dt / tau), Math.exp(-dt / 0.7));
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    sculptIndex = 1 - sculptIndex;
    state.brushFrom = brush ? { x: brush.x, z: brush.z } : null;
    if (brush || burst) state.sculptLife = tau * 6;
    else state.sculptLife -= dt;
    return true;
  };

  let sizedDpr = initial.dpr;

  const resize = () => {
    const s = getSettings();
    sizedDpr = s.dpr;
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    render();
    wake();
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const s = getSettings();
    const reduce = s.reduce;
    if (s.dpr !== sizedDpr) resize();
    const dt = last ? clamp((now - last) / 1000, 0, 1 / 20) : 1 / 60;
    last = now;

    if (!s.intro || reduce) state.intro = 1;
    else if (state.intro < 1)
      state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
    state.rise = smoother(state.intro);
    const ease = reduce ? 1 : 1 - Math.exp(-dt / 0.4);
    state.tilt += (s.tilt - state.tilt) * ease;
    state.elevation += (s.elevation - state.elevation) * ease;
    state.scale = s.scale;

    state.clock += dt;
    const glitching = reduce ? 0 : s.glitch;
    if (glitching > 0) {
      if (state.clock >= glitch.next && state.clock >= glitch.until) {
        glitch.until = state.clock + 0.1 + random() * 0.22 * (0.5 + glitching);
        glitch.next =
          glitch.until + (9 - 7.4 * glitching) * (0.45 + random() * 1.1);
        glitch.roll = 0;
      }
      if (state.clock < glitch.until) {
        if (state.clock >= glitch.roll) {
          glitchData.fill(0);
          const count = 1 + Math.floor(random() * 3);
          for (let i = 0; i < count; i++) {
            const band = 3 + random() * random() * view.height * 0.14;
            const y = random() * view.height;
            const shift = (random() - 0.5) * 2 * (10 + 46 * glitching);
            glitchData.set(
              [y, y + band, shift, 1 + random() * 3 * glitching],
              i * 4,
            );
          }
          glitch.seed = random();
          glitch.roll = state.clock + 0.04 + random() * 0.05;
        }
      } else glitchData.fill(0);
    } else glitchData.fill(0);

    if (!reduce) {
      state.travelX += s.direction[0] * s.speed * 0.8 * dt;
      state.travelZ += s.direction[1] * s.speed * 0.8 * dt;
      state.morph += s.morph * 0.12 * dt;
    }

    const engaged = pointer.inside && s.mouseInteraction;
    state.presence +=
      ((engaged ? 1 : 0) - state.presence) *
      (1 - Math.exp(-dt / (engaged ? 0.18 : 0.45)));

    const nx = (pointer.x / view.width) * 2 - 1;
    const ny = 1 - (pointer.y / view.height) * 2;
    const lean = reduce || !engaged ? 0 : s.parallax;
    const targetYaw = nx * lean * 0.09;
    const targetPitch = -ny * lean * 0.045;
    state.yawVelocity +=
      (38 * (targetYaw - state.yaw) - 11 * state.yawVelocity) * dt;
    state.pitchVelocity +=
      (38 * (targetPitch - state.pitch) - 11 * state.pitchVelocity) * dt;
    state.yaw += state.yawVelocity * dt;
    state.pitch += state.pitchVelocity * dt;

    const cam = camera();
    if (engaged) {
      state.hit = pick(cam, s, nx, ny);
      if (state.hit && state.brushFrom) {
        const jump = Math.hypot(
          state.hit.x - state.brushFrom.x,
          state.hit.z - state.brushFrom.z,
        );
        if (jump > 3 * s.mouseRadius) state.brushFrom = null;
      }
    } else if (state.presence < 0.002) {
      state.hit = null;
      state.brushFrom = null;
    }

    const tracing =
      state.hit && s.mouseInteraction && s.hoverEffect === 'trace'
        ? state.presence
        : 0;
    if (state.hit) {
      const frequency = FREQUENCY / state.scale;
      const target =
        relief(
          state.hit.x,
          state.hit.z,
          frequency,
          state.morph * 0.37,
          state.morph * 0.23,
        ) +
        s.detail * 0.1 * fineDetail(state.hit.x, state.hit.z, frequency);
      state.level =
        state.trace < 0.01
          ? target
          : state.level + (target - state.level) * (1 - Math.exp(-dt / 0.09));
    }
    state.trace += (tracing - state.trace) * (1 - Math.exp(-dt / 0.2));

    const focusTarget =
      state.hit && s.depthOfField > 0 ? state.hit.depth : cam.distance;
    state.focus += (focusTarget - state.focus) * (1 - Math.exp(-dt / 0.35));

    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i]!;
      pulse.age += dt;
      if (pulse.age > 4) pulses.splice(i, 1);
    }

    const sculpting = updateSculpt(s, dt);
    render();

    const settling =
      Math.abs(s.tilt - state.tilt) > 0.01 ||
      Math.abs(s.elevation - state.elevation) > 1e-4 ||
      Math.abs(state.yaw - targetYaw) > 1e-4 ||
      Math.abs(state.pitch - targetPitch) > 1e-4 ||
      Math.abs(state.yawVelocity) > 1e-4 ||
      Math.abs(state.pitchVelocity) > 1e-4 ||
      Math.abs(focusTarget - state.focus) > 1e-3 ||
      Math.abs(tracing - state.trace) > 1e-3;
    const busy =
      (!reduce &&
        (s.speed !== 0 || s.morph !== 0 || s.glitch > 0 || s.markers >= 0)) ||
      state.intro < 1 ||
      pulses.length > 0 ||
      sculpting ||
      settling ||
      (state.presence > 0.001 && state.presence < 0.999);
    quiet = busy ? 0 : quiet + dt;
    if (quiet < 0.5) raf = requestAnimationFrame(frame);
  };

  function wake() {
    quiet = 0;
    if (!raf && visible && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  const locate = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return {
      x,
      y,
      inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
    };
  };

  const pointerMove = (event: PointerEvent) => {
    const { x, y, inside } = locate(event);
    const was = pointer.inside;
    pointer.inside = inside;
    if (inside) {
      pointer.x = x;
      pointer.y = y;
    }
    if (inside || was) wake();
  };

  const pointerDown = (event: PointerEvent) => {
    const s = getSettings();
    const { x, y, inside } = locate(event);
    if (!inside) return;
    pointer.x = x;
    pointer.y = y;
    pointer.inside = true;
    wake();
    if (s.glitch > 0 && !s.reduce) {
      glitch.until = state.clock + 0.16;
      glitch.roll = 0;
    }
    if (
      !s.mouseInteraction ||
      (s.clickEffect !== 'pulse' && s.clickEffect !== 'peak')
    )
      return;
    const hit = pick(
      camera(),
      s,
      (x / view.width) * 2 - 1,
      1 - (y / view.height) * 2,
    );
    if (!hit) return;
    if (s.clickEffect === 'peak' && sculpt) {
      state.burst = { x: hit.x, z: hit.z, age: 0 };
    } else if (s.clickEffect === 'pulse') {
      if (pulses.length >= MAX_PULSES) pulses.shift();
      pulses.push({ x: hit.x, z: hit.z, age: 0 });
    }
  };

  const pointerUp = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return;
    pointer.inside = false;
    wake();
  };

  const pointerLeave = () => {
    pointer.inside = false;
    wake();
  };

  const setVisible = (value: boolean) => {
    visible = value;
    if (visible) wake();
  };

  const destroy = (loseContext: boolean) => {
    cancelAnimationFrame(raf);
    raf = 0;
    [source, ...levels.flat()].forEach((target) => {
      if (target.texture) gl.deleteTexture(target.texture);
      if (target.depth) gl.deleteRenderbuffer(target.depth);
      gl.deleteFramebuffer(target.framebuffer);
    });
    sculpt?.forEach((target) => {
      gl.deleteTexture(target.texture);
      gl.deleteFramebuffer(target.framebuffer);
    });
    gl.deleteTexture(blank);
    gl.deleteVertexArray(vao);
    if (field.texture) gl.deleteTexture(field.texture);
    if (field.heights) gl.deleteTexture(field.heights);
    gl.deleteFramebuffer(field.framebuffer);
    [
      terrain,
      fieldProgram,
      sculptProgram,
      downProgram,
      blurProgram,
      compositeProgram,
      markerProgram,
    ].forEach((program) => {
      if (program) gl.deleteProgram(program.program);
    });
    if (loseContext) gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  resize();

  return {
    wake,
    resize,
    setVisible,
    pointerMove,
    pointerDown,
    pointerUp,
    pointerLeave,
    destroy,
  };
}
