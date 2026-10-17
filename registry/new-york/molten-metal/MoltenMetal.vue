<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import type {
    MoltenMetalFlare,
    MoltenMetalProps,
    MoltenMetalRgb,
    MoltenMetalSettings,
    MoltenMetalTrailPoint,
  } from './types';
  import {
    BALANCE,
    FLARE_SECONDS,
    FLOW_START,
    FRAGMENT,
    INTRO_SECONDS,
    MAX_COLORS,
    MAX_FLARES,
    SAMPLE_SECONDS,
    TRAIL,
    TRAIL_SECONDS,
    UNIFORMS,
    VERTEX,
  } from './molten-metal-shader';
  import { clamp, compileShader, parseColor } from './molten-metal-math';

  const props = withDefaults(defineProps<MoltenMetalProps>(), {
    colors: () => ['#5227FF', '#FF9FFC'],
    coreColor: '#FFFFFF',
    backgroundColor: 'transparent',
    lightMode: false,
    speed: 0.35,
    scale: 4,
    detail: 3,
    glow: 1.6,
    thickness: 1,
    swirl: 1,
    turbulence: 0.2,
    haze: 0.75,
    brightness: 1.3,
    colorMode: 'molten',
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    drift: 0.3,
    grain: 0.05,
    opacity: 1,
    intro: true,
    mouseInteraction: true,
    mouseStrength: 0.5,
    flareOnClick: true,
    paused: false,
    dpr: 2,
    class: '',
  });

  const WHITE: MoltenMetalRgb = [1, 1, 1];
  const INTERACTIVE =
    'a, button, input, textarea, select, label, [role="button"]';

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = ref<HTMLElement | null>(null);
  const motion = usePreferredReducedMotion();

  const palette = computed(() =>
    [...props.colors.slice(0, MAX_COLORS - 1), props.coreColor].map(
      (value): MoltenMetalRgb => parseColor(value, WHITE) ?? WHITE,
    ),
  );
  const paper = computed(() => parseColor(props.backgroundColor, null));

  const settings = computed((): MoltenMetalSettings => ({
    palette: palette.value,
    paper: paper.value,
    lightMode: props.lightMode,
    speed: props.speed,
    scale: Math.max(0.1, props.scale),
    detail: clamp(props.detail, 1, 8),
    glow: Math.max(0, props.glow),
    thickness: clamp(props.thickness, 0.2, 3),
    swirl: props.swirl,
    fold: -props.turbulence,
    blackPoint: 0.2 * (1 - clamp(props.haze, 0, 1)),
    brightness: Math.max(0, props.brightness),
    balance: BALANCE[props.colorMode] ?? 0.5,
    rotation: (props.rotation * Math.PI) / 180,
    offsetX: props.offsetX,
    offsetY: props.offsetY,
    drift: Math.max(0, props.drift),
    grain: Math.max(0, props.grain),
    opacity: clamp(props.opacity, 0, 1),
    intro: props.intro,
    mouseInteraction: props.mouseInteraction,
    mouseStrength: clamp(props.mouseStrength, 0, 1),
    flareOnClick: props.flareOnClick,
    paused: props.paused,
    dpr: Math.max(0.5, props.dpr),
  }));

  const colorData = new Float32Array(MAX_COLORS * 3);
  const trailData = new Float32Array(TRAIL * 4);
  const weightData = new Float32Array(TRAIL);
  const flareData = new Float32Array(MAX_FLARES * 4);
  const state = {
    width: 1,
    height: 1,
    time: FLOW_START,
    clock: 0,
    last: 0,
    visible: false,
    introAt: -1,
    pointerX: 0.5,
    pointerY: 0.5,
    inside: false,
    presence: 0,
    driftX: 0,
    driftY: 0,
    trail: [] as MoltenMetalTrailPoint[],
    flares: [] as MoltenMetalFlare[],
    quiet: 0,
    seen: null as MoltenMetalSettings | null,
  };

  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  const u: Record<string, WebGLUniformLocation | null> = {};

  const isReduced = () => motion.value === 'reduce';

  function resize() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, settings.value.dpr);
    const width = Math.max(1, Math.round(container.clientWidth * ratio));
    const height = Math.max(1, Math.round(container.clientHeight * ratio));
    if (width === state.width && height === state.height) return;
    state.quiet = 0;
    state.width = width;
    state.height = height;
    canvas.width = width;
    canvas.height = height;
  }

  function toView(x: number, y: number): [number, number] {
    return [(x - 0.5) * (state.width / Math.max(state.height, 1)), 0.5 - y];
  }

  function introProgress(s: MoltenMetalSettings, reduced: boolean) {
    if (!s.intro || reduced || state.introAt < 0) return 1;
    return clamp((state.clock - state.introAt) / INTRO_SECONDS, 0, 1);
  }

  function render(ctx: WebGL2RenderingContext, reduced: boolean) {
    const s = settings.value;
    const progress = introProgress(s, reduced);
    const aspect = state.width / Math.max(state.height, 1);
    ctx.viewport(0, 0, state.width, state.height);
    ctx.uniform2f(u.uResolution ?? null, state.width, state.height);
    ctx.uniform1f(u.uTime ?? null, state.time);
    ctx.uniform1f(u.uClock ?? null, state.clock);
    ctx.uniform1f(u.uScale ?? null, s.scale);
    ctx.uniform1f(u.uDetail ?? null, s.detail);
    ctx.uniform1f(u.uGlow ?? null, s.glow * 0.1);
    ctx.uniform1f(u.uThickness ?? null, s.thickness);
    ctx.uniform1f(u.uSwirl ?? null, s.swirl);
    ctx.uniform1f(u.uFold ?? null, s.fold);
    ctx.uniform1f(u.uBlackPoint ?? null, s.blackPoint);
    ctx.uniform1f(u.uBrightness ?? null, s.brightness);
    ctx.uniform1f(u.uBalance ?? null, s.balance);
    ctx.uniform1f(u.uGrain ?? null, s.grain);
    ctx.uniform1f(u.uOpacity ?? null, s.opacity);
    ctx.uniform2f(u.uOffset ?? null, s.offsetX * aspect, -s.offsetY);
    ctx.uniform2f(
      u.uRotation ?? null,
      Math.cos(s.rotation),
      Math.sin(s.rotation),
    );
    ctx.uniform2f(u.uDrift ?? null, state.driftX, state.driftY);
    colorData.fill(0);
    s.palette.forEach((rgb, index) => {
      colorData.set(rgb, index * 3);
    });
    ctx.uniform3fv(u.uColors ?? null, colorData);
    ctx.uniform1i(u.uColorCount ?? null, s.palette.length);
    const paperColor = s.paper ?? [0, 0, 0];
    ctx.uniform3f(
      u.uBackground ?? null,
      paperColor[0],
      paperColor[1],
      paperColor[2],
    );
    ctx.uniform1f(u.uOpaque ?? null, s.paper ? 1 : 0);
    ctx.uniform1f(u.uLight ?? null, s.lightMode ? 1 : 0);
    ctx.uniform3f(
      u.uReveal ?? null,
      Math.log(1.6) + Math.log(0.01 / 1.6) * progress,
      progress < 1 ? 1 : 0,
      progress,
    );
    trailData.fill(0);
    weightData.fill(0);
    state.trail.forEach((point, index) => {
      const [x, y] = toView(point.x, point.y);
      trailData.set(
        [x, y, state.clock - point.time, state.clock - point.arrive],
        index * 4,
      );
      weightData[index] = point.weight;
    });
    ctx.uniform4fv(u.uTrail ?? null, trailData);
    ctx.uniform1fv(u.uTrailWeight ?? null, weightData);
    ctx.uniform1i(u.uTrailCount ?? null, state.trail.length);
    flareData.fill(0);
    state.flares.forEach((flare, index) => {
      const [x, y] = toView(flare.x, flare.y);
      flareData.set([x, y, state.clock - flare.time, 1], index * 4);
    });
    ctx.uniform4fv(u.uFlares ?? null, flareData);
    ctx.uniform1i(u.uFlareCount ?? null, state.flares.length);
    const heating = state.trail.length > 0 || state.flares.length > 0;
    ctx.uniform4f(
      u.uHeat ?? null,
      s.mouseStrength * 2,
      3.2,
      0.2,
      heating ? 1 : 0,
    );
    ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
    ctx.clearColor(0, 0, 0, 0);
    ctx.clear(ctx.COLOR_BUFFER_BIT);
    ctx.drawArrays(ctx.TRIANGLES, 0, 3);
  }

  function updateTrail(s: MoltenMetalSettings, dt: number) {
    const wanted = s.mouseInteraction && state.inside && s.mouseStrength > 0;
    state.presence +=
      ((wanted ? 1 : 0) - state.presence) * (1 - Math.exp(-dt / 0.25));
    state.trail = state.trail.filter(
      (point) => point.live || state.clock - point.time < TRAIL_SECONDS,
    );
    const head = state.trail[0];
    if (!wanted) {
      if (head?.live) head.live = false;
      return state.trail.length > 0;
    }
    if (!head?.live) {
      state.trail.unshift({
        x: state.pointerX,
        y: state.pointerY,
        time: state.clock,
        arrive: state.clock,
        weight: state.presence,
        live: true,
      });
    } else {
      if (head.x !== state.pointerX || head.y !== state.pointerY) {
        const last = state.trail[1];
        const gap = last
          ? Math.hypot(last.x - head.x, last.y - head.y)
          : Infinity;
        const settled = state.clock - head.arrive > SAMPLE_SECONDS;
        if (
          gap > 0.004 &&
          (!last || settled || state.clock - last.time >= SAMPLE_SECONDS)
        ) {
          state.trail.splice(1, 0, { ...head, time: state.clock, live: false });
        }
        head.x = state.pointerX;
        head.y = state.pointerY;
        head.arrive = state.clock;
      }
      head.time = state.clock;
      head.weight = state.presence;
    }
    if (state.trail.length > TRAIL) state.trail.length = TRAIL;
    return state.trail.length > 0;
  }

  function tick(now: number) {
    if (!gl) return;
    if (!state.visible || document.hidden) {
      state.last = now;
      return;
    }
    const s = settings.value;
    const dt = state.last ? Math.min((now - state.last) / 1000, 0.1) : 0;
    state.last = now;
    const reduced = isReduced();
    state.clock += dt;
    if (state.introAt < 0) state.introAt = state.clock;
    if (!s.paused && !reduced) state.time += dt * s.speed;

    const leaning = s.mouseInteraction && state.inside && !reduced;
    const goalX = leaning ? (state.pointerX - 0.5) * s.drift * 2 : 0;
    const goalY = leaning ? (0.5 - state.pointerY) * s.drift * 2 : 0;
    const ease = 1 - Math.exp(-dt / 0.33);
    state.driftX += (goalX - state.driftX) * ease;
    state.driftY += (goalY - state.driftY) * ease;
    const drifting =
      Math.abs(goalX - state.driftX) + Math.abs(goalY - state.driftY) > 0.0005;

    const heating = updateTrail(s, dt);
    state.flares = state.flares.filter(
      (flare) => state.clock - flare.time < FLARE_SECONDS,
    );

    const still = s.paused || reduced;
    const transient =
      heating ||
      drifting ||
      state.flares.length > 0 ||
      introProgress(s, reduced) < 1;
    if (state.seen !== s || transient || !still) state.quiet = 0;
    else state.quiet += 1;
    state.seen = s;
    if (state.quiet > 3) return;

    resize();
    render(gl, reduced);
  }

  const raf = useRafFn(({ timestamp }) => tick(timestamp), {
    immediate: false,
  });

  function local(event: PointerEvent) {
    const container = containerRef.value;
    if (!container) return { x: 0, y: 0, inside: false };
    const rect = container.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / Math.max(rect.width, 1),
      y: (event.clientY - rect.top) / Math.max(rect.height, 1),
      inside:
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom,
    };
  }

  function onMove(event: PointerEvent) {
    const point = local(event);
    state.inside = point.inside;
    if (point.inside) {
      state.pointerX = point.x;
      state.pointerY = point.y;
    }
  }

  function onLeave() {
    state.inside = false;
  }

  function onDown(event: PointerEvent) {
    const s = settings.value;
    if (!s.flareOnClick || event.button !== 0 || isReduced()) return;
    if (event.target instanceof Element && event.target.closest(INTERACTIVE))
      return;
    const point = local(event);
    if (!point.inside) return;
    state.flares.push({ x: point.x, y: point.y, time: state.clock });
    if (state.flares.length > MAX_FLARES) state.flares.shift();
  }

  useEventListener('pointermove', onMove, { passive: true });
  useEventListener('pointerdown', onDown);
  useEventListener(rootEl, 'pointerleave', onLeave);
  useResizeObserver(containerRef, resize);
  useIntersectionObserver(containerRef, (entries) => {
    state.visible = entries.some((entry) => entry.isIntersecting);
  });

  function init(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    if (!ctx) return;
    const vertex = compileShader(ctx, ctx.VERTEX_SHADER, VERTEX);
    const fragment = compileShader(ctx, ctx.FRAGMENT_SHADER, FRAGMENT);
    const linked = ctx.createProgram();
    if (!vertex || !fragment || !linked) return;
    ctx.attachShader(linked, vertex);
    ctx.attachShader(linked, fragment);
    ctx.bindAttribLocation(linked, 0, 'aPosition');
    ctx.linkProgram(linked);
    ctx.deleteShader(vertex);
    ctx.deleteShader(fragment);
    if (!ctx.getProgramParameter(linked, ctx.LINK_STATUS)) {
      ctx.deleteProgram(linked);
      return;
    }
    UNIFORMS.forEach((name) => {
      u[name] = ctx.getUniformLocation(linked, name);
    });
    vao = ctx.createVertexArray();
    ctx.bindVertexArray(vao);
    buffer = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
    ctx.bufferData(
      ctx.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      ctx.STATIC_DRAW,
    );
    ctx.enableVertexAttribArray(0);
    ctx.vertexAttribPointer(0, 2, ctx.FLOAT, false, 0, 0);
    ctx.useProgram(linked);
    gl = ctx;
    program = linked;
  }

  onMounted(() => {
    rootEl.value = document.documentElement;
    if (!canvasRef.value) return;
    init(canvasRef.value);
    if (!gl) return;
    resize();
    raf.resume();
  });

  onBeforeUnmount(() => {
    raf.pause();
    if (!gl) return;
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    gl = null;
  });
</script>

<template>
  <div ref="containerRef" :class="['molten-metal-container', props.class]">
    <canvas ref="canvasRef" class="molten-metal-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .molten-metal-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .molten-metal-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
