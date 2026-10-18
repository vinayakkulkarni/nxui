<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import type {
    AcidSquaresProps,
    Camera,
    Settings,
    State,
    Surface,
    Vec3,
  } from './types';
  import {
    AREA,
    DEG,
    FRAGMENT,
    HOVER_EFFECTS,
    INTRO_SECONDS,
    LIGHTING,
    MAX_RENDER_DIM,
    MAX_RIPPLES,
    MESH,
    ORIGIN,
    REVEAL_REACH,
    REVEAL_SECONDS,
    VERTEX,
    clamp,
    ease,
    glide,
    invert,
    link,
    lookAt,
    multiply,
    perspective,
    smoothstep,
  } from './acid-squares-gl';

  const props = withDefaults(defineProps<AcidSquaresProps>(), {
    color: '#120f17',
    accentColor: '#ff4fb8',
    secondaryColor: '#3b6bff',
    tileSize: 1,
    gap: 0.12,
    roundness: 0.25,
    softness: 0.5,
    bulge: 0.3,
    rotation: 35,
    gloss: 0.6,
    waves: 1,
    waveScale: 1,
    speed: 0.6,
    shape: 'square',
    pulse: 1,
    pulseSpeed: 0.45,
    pulseSpacing: 1,
    pulseWidth: 1,
    pulseOrigin: 'center',
    brightness: 1,
    lighting: 'split',
    tilt: 0.7,
    zoom: 1,
    depth: 10,
    grain: 0.12,
    fade: 0,
    opacity: 1,
    intro: true,
    mouseInteraction: true,
    hoverEffect: 'press',
    mouseStrength: 1,
    mouseRadius: 0.35,
    pulseOnClick: true,
    detail: 'medium',
    lightMode: false,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const documentVisibility = useDocumentVisibility();

  const settings = computed<Settings>(() => ({
    color: String(props.color),
    accentColor: String(props.accentColor),
    secondaryColor: String(props.secondaryColor),
    tileSize: clamp(props.tileSize, 0.2, 5),
    gap: clamp(props.gap, 0, 0.6),
    roundness: clamp(props.roundness, 0, 1),
    softness: clamp(props.softness, 0, 1),
    bulge: clamp(props.bulge, 0, 1.5),
    rotation: props.rotation * DEG,
    gloss: clamp(props.gloss, 0, 1),
    waves: Math.max(0, props.waves),
    waveScale: clamp(props.waveScale, 0.1, 5),
    speed: Math.max(0, props.speed),
    square: props.shape === 'round' ? 0 : 1,
    pulse: Math.max(0, props.pulse),
    pulseSpeed: Math.max(0, props.pulseSpeed),
    pulseSpacing: clamp(props.pulseSpacing, 0.2, 6),
    pulseWidth: clamp(props.pulseWidth, 0.1, 5),
    randomOrigin: props.pulseOrigin === 'random',
    brightness: Math.max(0, props.brightness),
    lights: LIGHTING[props.lighting] ?? LIGHTING.split,
    tilt: clamp(props.tilt, 0, 1),
    zoom: clamp(props.zoom, 0.3, 4),
    depth: clamp(props.depth, 2, 40),
    grain: Math.max(0, props.grain),
    fade: clamp(props.fade, 0, 1),
    opacity: clamp(props.opacity, 0, 1),
    intro: props.intro,
    mouseInteraction: props.mouseInteraction,
    hover: HOVER_EFFECTS[props.hoverEffect] ?? 1,
    mouseStrength: Math.max(0, props.mouseStrength),
    mouseRadius: clamp(props.mouseRadius, 0.02, 2),
    pulseOnClick: props.pulseOnClick,
    mesh: MESH[props.detail] ?? MESH.medium,
    lightMode: props.lightMode,
    paused: props.paused,
    dpr: props.dpr,
  }));

  const FALLBACK_COLOR: Vec3 = [0.07, 0.06, 0.09];
  const FALLBACK_ACCENT: Vec3 = [1, 0.31, 0.72];
  const FALLBACK_SECOND: Vec3 = [0.23, 0.42, 1];

  let gl: WebGL2RenderingContext | null = null;
  let surface: Surface | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let gridBuffer: WebGLBuffer | null = null;
  let indexBuffer: WebGLBuffer | null = null;
  let probeContext: CanvasRenderingContext2D | null = null;
  let meshSize = 0;
  let indexCount = 0;
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = false;
  let reduce = false;
  const rippleData = new Float32Array(MAX_RIPPLES * 4);

  const state: State = {
    clock: 0,
    swell: 0,
    lights: 0,
    frame: 0,
    nextRipple: 1.2,
    ripples: [],
    intro: 0,
    width: 1,
    height: 1,
    colorKey: '',
    color: [...FALLBACK_COLOR],
    accent: [...FALLBACK_ACCENT],
    second: [...FALLBACK_SECOND],
    pointer: { x: 0, y: 0, inside: false },
    hover: { x: 0, z: 0, vx: 0, vz: 0, presence: 0, placed: false },
    look: { x: 0, y: 0, vx: 0, vy: 0 },
    seed: 1,
    camera: null,
  };

  function buildMesh(size: number) {
    if (!gl || size === meshSize) return;
    meshSize = size;
    const points = new Float32Array((size + 1) * (size + 1) * 2);
    let o = 0;
    for (let j = 0; j <= size; j += 1) {
      for (let i = 0; i <= size; i += 1) {
        points[o] = i / size;
        points[o + 1] = j / size;
        o += 2;
      }
    }
    const indices = new Uint32Array(size * size * 6);
    o = 0;
    for (let j = 0; j < size; j += 1) {
      for (let i = 0; i < size; i += 1) {
        const a = j * (size + 1) + i;
        const b = a + 1;
        const c = a + size + 1;
        const d = c + 1;
        indices[o] = a;
        indices[o + 1] = c;
        indices[o + 2] = b;
        indices[o + 3] = b;
        indices[o + 4] = c;
        indices[o + 5] = d;
        o += 6;
      }
    }
    indexCount = indices.length;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
  }

  function toRgb(value: string, fallback: Vec3): Vec3 {
    if (!probeContext || !value) return fallback;
    const css = /^[0-9a-f]{3,8}$/i.test(value) ? `#${value}` : value;
    probeContext.clearRect(0, 0, 1, 1);
    probeContext.fillStyle = '#000000';
    probeContext.fillStyle = css;
    probeContext.fillRect(0, 0, 1, 1);
    const data = probeContext.getImageData(0, 0, 1, 1).data;
    return [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255];
  }

  function resolveColors(s: Settings) {
    const key = `${s.color}|${s.accentColor}|${s.secondaryColor}`;
    if (key === state.colorKey) return;
    state.colorKey = key;
    state.color = toRgb(s.color, FALLBACK_COLOR);
    state.accent = toRgb(s.accentColor, FALLBACK_ACCENT);
    state.second = toRgb(s.secondaryColor, FALLBACK_SECOND);
  }

  function random() {
    state.seed = (state.seed * 16807) % 2147483647;
    return (state.seed - 1) / 2147483646;
  }

  function cameraFor(s: Settings): Camera {
    const aspect = state.width / Math.max(state.height, 1);
    const distance = 8 / s.zoom;
    const yaw = state.look.x * 0.16;
    const pitch = 1.5 - s.tilt * 1.26 + state.look.y * 0.05;
    const target: Vec3 = [ORIGIN[0], 0, ORIGIN[1]];
    const eye: Vec3 = [
      target[0] + Math.sin(yaw) * Math.cos(pitch) * distance,
      target[1] + Math.sin(pitch) * distance,
      target[2] + Math.cos(yaw) * Math.cos(pitch) * distance,
    ];
    const viewProj = multiply(
      perspective(0.8, aspect, 0.1, 400),
      lookAt(eye, target),
    );
    return { eye, target, viewProj, inverse: invert(viewProj), distance };
  }

  function render() {
    const canvas = canvasRef.value;
    if (!gl || !surface || !canvas) return;
    const uniforms = surface.uniforms;
    const u = (name: string) => uniforms[name] ?? null;
    const s = settings.value;
    buildMesh(s.mesh);
    resolveColors(s);
    const camera = cameraFor(s);
    state.camera = camera;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(surface.program);
    rippleData.fill(0);
    state.ripples.forEach((ripple, index) => {
      rippleData[index * 4] = ripple.x;
      rippleData[index * 4 + 1] = ripple.z;
      rippleData[index * 4 + 2] = ripple.start;
      rippleData[index * 4 + 3] = ripple.strength;
    });
    const introAge = state.intro;
    const revealing = introAge < INTRO_SECONDS;
    const revealRadius = glide(introAge / REVEAL_SECONDS) * REVEAL_REACH;
    const settle = ease(introAge / INTRO_SECONDS);
    gl.uniform4fv(u('uRipples'), rippleData);
    gl.uniform4f(
      u('uWave'),
      0.55 * s.pulse,
      3 * Math.max(s.pulseSpeed, 0.05) + 1.2,
      1.6 * s.pulseWidth,
      46,
    );
    gl.uniform1f(u('uSquare'), s.square);
    gl.uniform1f(u('uClock'), state.clock);
    gl.uniform4f(
      u('uSwell'),
      1.3 * s.waves * (0.25 + 0.75 * settle),
      1.9 / s.waveScale,
      0,
      state.swell,
    );
    gl.uniform4f(
      u('uHover'),
      state.hover.x,
      state.hover.z,
      (3 * s.mouseRadius) / 0.35,
      0.7 * state.hover.presence * s.mouseStrength * s.hover,
    );
    gl.uniform4f(
      u('uIntro'),
      ORIGIN[0],
      ORIGIN[1],
      revealRadius,
      revealing ? 0.9 * (1 - smoothstep(0.55, 1, introAge / INTRO_SECONDS)) : 0,
    );
    gl.uniformMatrix4fv(u('uViewProj'), false, camera.viewProj);
    gl.uniform4f(
      u('uArea'),
      AREA[0] + ORIGIN[0],
      AREA[1] + ORIGIN[1],
      AREA[2],
      AREA[3],
    );
    gl.uniform3f(u('uEye'), camera.eye[0], camera.eye[1], camera.eye[2]);
    gl.uniform3f(u('uColor'), state.color[0], state.color[1], state.color[2]);
    gl.uniform3f(
      u('uAccent'),
      state.accent[0],
      state.accent[1],
      state.accent[2],
    );
    gl.uniform3f(
      u('uSecond'),
      state.second[0],
      state.second[1],
      state.second[2],
    );
    const orbit = state.lights;
    const reach = camera.distance / 8;
    const lightLevel = 0.35 + 0.65 * settle;
    const [first, second] = s.lights;
    gl.uniform3f(
      u('uLightA'),
      camera.target[0] + (first[0] + Math.sin(orbit * 0.7) * first[3]) * reach,
      first[1] * reach * lightLevel + 0.6,
      camera.target[2] + (first[2] + Math.cos(orbit * 0.5) * first[4]) * reach,
    );
    gl.uniform3f(
      u('uLightB'),
      camera.target[0] +
        (second[0] + Math.cos(orbit * 0.6) * second[3]) * reach,
      second[1] * reach * lightLevel + 0.6,
      camera.target[2] +
        (second[2] + Math.sin(orbit * 0.45) * second[4]) * reach,
    );
    gl.uniform1f(u('uTile'), 1.2 * s.tileSize);
    gl.uniform1f(u('uAngle'), s.rotation);
    gl.uniform1f(u('uGap'), s.gap);
    gl.uniform1f(u('uRound'), s.roundness);
    gl.uniform1f(u('uSoftness'), s.softness);
    gl.uniform1f(u('uBulge'), s.bulge);
    gl.uniform1f(u('uGloss'), s.gloss);
    const far = Math.min(s.depth * 3.2 * reach, AREA[3] * 0.62);
    gl.uniform2f(u('uRange'), far * 0.5, far);
    gl.uniform1f(u('uBrightness'), s.brightness);
    const pixelRatio = canvas.height / Math.max(state.height, 1);
    gl.uniform1f(u('uGrain'), s.grain);
    gl.uniform1f(u('uGrainScale'), Math.max(1, pixelRatio));
    gl.uniform1f(u('uLightMode'), s.lightMode ? 1 : 0);
    gl.uniform1f(u('uOpacity'), s.opacity);
    gl.uniform4f(
      u('uReveal'),
      ORIGIN[0],
      ORIGIN[1],
      revealRadius,
      revealing ? 0 : 1,
    );
    gl.uniform2f(u('uView'), canvas.width, canvas.height);
    gl.uniform1f(u('uFade'), s.fade);
    gl.uniform1f(u('uFrame'), state.frame % 977);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
    gl.disable(gl.DEPTH_TEST);
  }

  function resize() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas || !gl) return;
    const s = settings.value;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const baseDpr = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    const longest = Math.max(width, height) * baseDpr;
    const ratio =
      longest > MAX_RENDER_DIM ? (baseDpr * MAX_RENDER_DIM) / longest : baseDpr;
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    state.width = width;
    state.height = height;
    render();
  }

  function groundPoint(px: number, py: number) {
    const camera = state.camera;
    if (!camera) return null;
    const nx = (px / state.width) * 2 - 1;
    const ny = 1 - (py / state.height) * 2;
    const m = camera.inverse;
    const fx = m[0] * nx + m[4] * ny + m[8] + m[12];
    const fy = m[1] * nx + m[5] * ny + m[9] + m[13];
    const fz = m[2] * nx + m[6] * ny + m[10] + m[14];
    const fw = m[3] * nx + m[7] * ny + m[11] + m[15];
    const dx = fx / fw - camera.eye[0];
    const dy = fy / fw - camera.eye[1];
    const dz = fz / fw - camera.eye[2];
    if (dy >= -1e-4) return null;
    const t = -camera.eye[1] / dy;
    return { x: camera.eye[0] + dx * t, z: camera.eye[2] + dz * t };
  }

  function spawn(x: number, z: number, strength: number) {
    state.ripples.push({ x, z, start: state.clock, strength });
    while (state.ripples.length > MAX_RIPPLES) state.ripples.shift();
  }

  function frame(now: number) {
    raf = 0;
    if (!alive || !visible || documentVisibility.value === 'hidden') return;
    const s = settings.value;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !reduce;
    if (moving) {
      state.frame += 1;
      state.clock += dt;
      state.intro += dt;
      state.swell += dt * s.speed;
      state.lights += dt * s.speed * 0.6;
      const travel = 3 * Math.max(s.pulseSpeed, 0.05) + 1.2;
      const interval = (10 * s.pulseSpacing) / travel;
      if (s.pulse > 0 && state.clock >= state.nextRipple) {
        if (s.randomOrigin) {
          const spot = groundPoint(
            (0.15 + random() * 0.7) * state.width,
            (0.25 + random() * 0.6) * state.height,
          );
          if (spot) spawn(spot.x, spot.z, 1);
        } else {
          spawn(ORIGIN[0], ORIGIN[1], 1);
        }
        state.nextRipple = state.clock + interval * (s.randomOrigin ? 0.6 : 1);
      }
      const lifetime = 46 / travel + 1;
      state.ripples = state.ripples.filter(
        (ripple) => state.clock - ripple.start < lifetime,
      );
    } else if (state.intro < INTRO_SECONDS) {
      state.intro = INTRO_SECONDS;
    }

    const { pointer, hover, look } = state;
    const active = s.mouseInteraction && pointer.inside && !reduce;
    const spot =
      active && s.hover !== 0 ? groundPoint(pointer.x, pointer.y) : null;
    if (spot) {
      if (!hover.placed) {
        hover.x = spot.x;
        hover.z = spot.z;
        hover.vx = 0;
        hover.vz = 0;
        hover.placed = true;
      }
      hover.vx += (90 * (spot.x - hover.x) - 19 * hover.vx) * dt;
      hover.vz += (90 * (spot.z - hover.z) - 19 * hover.vz) * dt;
      hover.x += hover.vx * dt;
      hover.z += hover.vz * dt;
    }
    const goal = spot ? 1 : 0;
    hover.presence +=
      (goal - hover.presence) *
      (1 - Math.exp(-dt / (goal > hover.presence ? 0.35 : 0.6)));
    if (!spot && hover.presence < 0.001) hover.placed = false;
    const lookX = active ? (pointer.x / state.width - 0.5) * 0.5 : 0;
    const lookY = active ? (0.5 - pointer.y / state.height) * 0.5 : 0;
    look.vx += (30 * (lookX - look.x) - 11 * look.vx) * dt;
    look.vy += (30 * (lookY - look.y) - 11 * look.vy) * dt;
    look.x += look.vx * dt;
    look.y += look.vy * dt;

    render();
    const settling =
      Math.abs(goal - hover.presence) > 0.002 ||
      Math.hypot(hover.vx, hover.vz) > 0.01 ||
      Math.abs(lookX - look.x) > 0.0002 ||
      Math.abs(lookY - look.y) > 0.0002;
    if (moving || settling) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  function wake() {
    if (!raf && alive && visible && documentVisibility.value !== 'hidden') {
      raf = requestAnimationFrame(frame);
    }
  }

  function onPointerMove(event: PointerEvent) {
    const container = containerRef.value;
    if (!container || !alive) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    state.pointer.x = x;
    state.pointer.y = y;
    state.pointer.inside =
      x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    const container = containerRef.value;
    const s = settings.value;
    if (!container || !alive) return;
    if (!s.mouseInteraction || !s.pulseOnClick || event.button !== 0 || reduce)
      return;
    if (
      event.target instanceof Element &&
      event.target.closest(
        'a, button, input, textarea, select, label, [role="button"]',
      )
    )
      return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    const spot = groundPoint(x, y);
    if (spot) spawn(spot.x, spot.z, 1.15);
    wake();
  }

  function onPointerLeave() {
    state.pointer.inside = false;
    wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown);
  const rootElement = ref<HTMLElement | null>(null);
  useEventListener(rootElement, 'pointerleave', onPointerLeave);

  watch(documentVisibility, () => {
    last = 0;
    wake();
  });

  useResizeObserver(containerRef, resize);

  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      last = 0;
      wake();
    }
  });

  watch(settings, () => {
    if (!raf) render();
    wake();
  });

  watch(reducedMotion, (value) => {
    reduce = value === 'reduce';
    wake();
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      depth: true,
      stencil: false,
    });
    if (!gl) return;
    surface = link(gl, VERTEX, FRAGMENT);
    if (!surface) return;
    vao = gl.createVertexArray();
    gridBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    probeContext = probe.getContext('2d', { willReadFrequently: true });
    rootElement.value = document.documentElement;
    reduce = reducedMotion.value === 'reduce';
    state.intro = settings.value.intro && !reduce ? 0 : INTRO_SECONDS;
    alive = true;
    resize();
    wake();
  });

  onBeforeUnmount(() => {
    alive = false;
    cancelAnimationFrame(raf);
    raf = 0;
    if (gl) {
      gl.deleteBuffer(gridBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteVertexArray(vao);
      if (surface) gl.deleteProgram(surface.program);
    }
    gl = null;
    surface = null;
    probeContext = null;
  });
</script>

<template>
  <div ref="containerRef" :class="['acid-squares-container', props.class]">
    <canvas ref="canvasRef" class="acid-squares-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .acid-squares-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .acid-squares-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
