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
    WebThreadsProps,
    WebThreadsRgb,
    WebThreadsSettings,
    WebThreadsSurge,
  } from './types';
  import {
    FRAGMENT,
    MAX_COLORS,
    MAX_SURGES,
    MAX_THREADS,
    STROKE_SECONDS,
    SURGE_SECONDS,
    SURGE_STAGGER,
    UNIFORMS,
    VERTEX,
  } from './web-threads-shader';
  import {
    clamp,
    compileShader,
    parseColor,
    staggerFor,
    threadY,
    toThreadSpace,
  } from './web-threads-math';

  const props = withDefaults(defineProps<WebThreadsProps>(), {
    colors: () => ['#5227FF', '#FF9FFC'],
    coreColor: '#FFFFFF',
    backgroundColor: 'transparent',
    lightMode: false,
    threadCount: 6,
    speed: 0.2,
    frequency: 5,
    spread: 0.18,
    taper: 1,
    position: 0.5,
    pinch: 0.5,
    nodes: 1,
    angle: 0,
    glow: 0.02,
    falloff: 0.6,
    thickness: 1.1,
    brightness: 0.6,
    opacity: 1,
    depth: 0,
    pulses: 0,
    mirror: true,
    shimmer: false,
    fade: 0,
    grain: 0.05,
    intro: true,
    mouseInteraction: true,
    mouseStrength: 0.5,
    pulseOnClick: true,
    paused: false,
    dpr: 2,
    class: '',
  });

  const WHITE: WebThreadsRgb = [1, 1, 1];
  const INTERACTIVE =
    'a, button, input, textarea, select, label, [role="button"]';

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = ref<HTMLElement | null>(null);
  const motion = usePreferredReducedMotion();

  const palette = computed(() =>
    props.colors
      .slice(0, MAX_COLORS)
      .map((value): WebThreadsRgb => parseColor(value, WHITE) ?? WHITE),
  );
  const core = computed(
    (): WebThreadsRgb => parseColor(props.coreColor, WHITE) ?? WHITE,
  );
  const paper = computed(() => parseColor(props.backgroundColor, null));

  const settings = computed((): WebThreadsSettings => ({
    palette: palette.value.length ? palette.value : [WHITE],
    core: core.value,
    paper: paper.value,
    lightMode: props.lightMode,
    count: clamp(Math.round(props.threadCount), 1, MAX_THREADS),
    speed: props.speed,
    frequency: props.frequency,
    spread: props.spread,
    taper: props.taper,
    position: props.position,
    pinch: props.pinch,
    nodes: clamp(Math.round(props.nodes), 1, 6),
    angle: (props.angle * Math.PI) / 180,
    glow: Math.max(0, props.glow),
    falloff: Math.max(0.05, props.falloff),
    thickness: Math.max(0.05, props.thickness),
    brightness: Math.max(0, props.brightness),
    opacity: clamp(props.opacity, 0, 1),
    depth: clamp(props.depth, 0, 1),
    pulses: Math.max(0, props.pulses),
    mirror: props.mirror,
    shimmer: props.shimmer,
    fade: clamp(props.fade, 0, 1),
    grain: Math.max(0, props.grain),
    intro: props.intro,
    mouseInteraction: props.mouseInteraction,
    mouseStrength: clamp(props.mouseStrength, 0, 1),
    pulseOnClick: props.pulseOnClick,
    paused: props.paused,
    dpr: Math.max(0.5, props.dpr),
  }));

  const colorData = new Float32Array(MAX_COLORS * 3);
  const surgeData = new Float32Array(MAX_SURGES * 4);
  const focus = new Float32Array(MAX_THREADS);
  const state = {
    width: 1,
    height: 1,
    phase: 0,
    clock: 0,
    last: 0,
    visible: false,
    introAt: -1,
    pointerX: 0.5,
    pointerY: 0.5,
    inside: false,
    presence: 0,
    settle: 0,
    target: -1,
    surges: [] as WebThreadsSurge[],
    quiet: 0,
    seen: null as WebThreadsSettings | null,
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

  const introLength = (s: WebThreadsSettings) =>
    (s.count - 1) * staggerFor(s.count) + STROKE_SECONDS;

  function updateFocus(s: WebThreadsSettings, dt: number, reduced: boolean) {
    const wanted = s.mouseInteraction && state.inside;
    if (wanted) {
      const aspect = state.width / Math.max(state.height, 1);
      const [cx, cy] = toThreadSpace(
        state.pointerX,
        state.pointerY,
        aspect,
        s.angle,
      );
      let best = -1;
      let bestDistance = Infinity;
      for (let index = 0; index < s.count; index++) {
        const distance = Math.abs(
          threadY(s, cx, index, state.phase, reduced ? 0 : state.clock) - cy,
        );
        const reach = index === state.target ? 0.11 : 0.085;
        if (distance < reach && distance < bestDistance) {
          best = index;
          bestDistance = distance;
        }
      }
      state.target = best;
    } else {
      state.target = -1;
    }
    const ease = 1 - Math.exp(-dt / 0.22);
    let strongest = 0;
    for (let index = 0; index < MAX_THREADS; index++) {
      const goal = index === state.target ? 1 : 0;
      const current = focus[index] ?? 0;
      const next = current + (goal - current) * ease;
      focus[index] = next;
      strongest = Math.max(strongest, next);
    }
    state.presence +=
      ((wanted ? 1 : 0) - state.presence) * (1 - Math.exp(-dt / 0.3));
    const settleGoal = s.mouseStrength * 0.65 * strongest * state.presence;
    state.settle += (settleGoal - state.settle) * (1 - Math.exp(-dt / 0.3));
    return strongest > 0.002 || state.presence > 0.002 || state.settle > 0.002;
  }

  function render(ctx: WebGL2RenderingContext, reduced: boolean) {
    const s = settings.value;
    const introClock = state.introAt < 0 ? 0 : state.clock - state.introAt;
    const introRunning = s.intro && !reduced && introClock < introLength(s);
    ctx.viewport(0, 0, state.width, state.height);
    ctx.uniform2f(u.uResolution ?? null, state.width, state.height);
    ctx.uniform1f(u.uPhase ?? null, state.phase);
    ctx.uniform1f(u.uClock ?? null, reduced ? 0 : state.clock);
    ctx.uniform1i(u.uCount ?? null, s.count);
    ctx.uniform1f(u.uFrequency ?? null, s.frequency);
    ctx.uniform1f(u.uSpread ?? null, s.spread);
    ctx.uniform1f(u.uTaper ?? null, s.taper);
    ctx.uniform1f(u.uPosition ?? null, s.position);
    ctx.uniform1f(u.uPinch ?? null, s.pinch);
    ctx.uniform1f(u.uNodes ?? null, s.nodes);
    ctx.uniform2f(u.uAngle ?? null, Math.cos(s.angle), Math.sin(s.angle));
    ctx.uniform1f(
      u.uGlow ?? null,
      s.glow * Math.sqrt(6 / Math.max(s.count, 6)),
    );
    ctx.uniform1f(u.uFalloff ?? null, s.falloff);
    ctx.uniform1f(u.uThickness ?? null, s.thickness);
    ctx.uniform1f(u.uBrightness ?? null, s.brightness);
    ctx.uniform1f(u.uOpacity ?? null, s.opacity);
    ctx.uniform1f(u.uMirror ?? null, s.mirror ? 1 : 0);
    ctx.uniform1f(u.uShimmer ?? null, s.shimmer && !reduced ? 1 : 0);
    ctx.uniform1f(u.uDepth ?? null, s.depth);
    ctx.uniform1f(u.uPulses ?? null, s.pulses);
    ctx.uniform1f(u.uFade ?? null, s.fade);
    ctx.uniform1f(u.uGrain ?? null, s.grain);
    colorData.fill(0);
    s.palette.slice(0, MAX_COLORS).forEach((rgb, index) => {
      colorData.set(rgb, index * 3);
    });
    ctx.uniform3fv(u.uColors ?? null, colorData);
    ctx.uniform1i(
      u.uColorCount ?? null,
      Math.min(s.palette.length, MAX_COLORS),
    );
    ctx.uniform3f(u.uCore ?? null, s.core[0], s.core[1], s.core[2]);
    const paperColor = s.paper ?? [0, 0, 0];
    ctx.uniform3f(
      u.uBackground ?? null,
      paperColor[0],
      paperColor[1],
      paperColor[2],
    );
    ctx.uniform1f(u.uOpaque ?? null, s.paper ? 1 : 0);
    ctx.uniform1f(u.uLight ?? null, s.lightMode ? 1 : 0);
    ctx.uniform4f(
      u.uIntro ?? null,
      introClock,
      staggerFor(s.count),
      STROKE_SECONDS,
      introRunning ? 1 : 0,
    );
    ctx.uniform1fv(u.uFocus ?? null, focus);
    ctx.uniform2f(
      u.uFocusState ?? null,
      state.presence * (0.4 + 0.6 * s.mouseStrength),
      state.settle,
    );
    surgeData.fill(0);
    state.surges.slice(-MAX_SURGES).forEach((surge, index) => {
      surgeData.set(
        [surge.x, state.clock - surge.at, surge.direction, 1],
        index * 4,
      );
    });
    ctx.uniform4fv(u.uSurges ?? null, surgeData);
    ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
    ctx.clearColor(0, 0, 0, 0);
    ctx.clear(ctx.COLOR_BUFFER_BIT);
    ctx.drawArrays(ctx.TRIANGLES, 0, 3);
  }

  function tick(now: number) {
    if (!gl) return;
    if (!state.visible || document.hidden) {
      state.last = now;
      return;
    }
    const s = settings.value;
    const dt = state.last ? Math.min((now - state.last) / 1000, 0.1) : 1 / 60;
    state.last = now;
    const reduced = isReduced();
    state.clock += dt;
    if (state.introAt < 0) state.introAt = state.clock;
    if (!s.paused && !reduced) state.phase += dt * s.speed;
    const focusing = updateFocus(s, dt, reduced);
    state.surges = state.surges.filter(
      (surge) =>
        state.clock - surge.at < SURGE_SECONDS + (s.count - 1) * SURGE_STAGGER,
    );

    const still = s.paused || reduced;
    const transient =
      state.surges.length > 0 ||
      (s.intro && !reduced && state.clock - state.introAt < introLength(s)) ||
      focusing;
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
    if (!s.pulseOnClick || event.button !== 0 || isReduced()) return;
    if (event.target instanceof Element && event.target.closest(INTERACTIVE))
      return;
    const point = local(event);
    if (!point.inside) return;
    const aspect = state.width / Math.max(state.height, 1);
    const [x] = toThreadSpace(point.x, point.y, aspect, s.angle);
    const direction = x <= s.pinch ? 1 : -1;
    state.surges.push({ x, direction, at: state.clock });
    if (state.surges.length > MAX_SURGES) state.surges.shift();
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
  <div ref="containerRef" :class="['web-threads-container', props.class]">
    <canvas ref="canvasRef" class="web-threads-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .web-threads-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .web-threads-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
