<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    FLOW,
    INTRO_SECONDS,
    MAX_COLORS,
    clamp,
    link,
  } from './flux-lines-gl';
  import type { FluxLinesProps } from './types';

  const props = withDefaults(defineProps<FluxLinesProps>(), {
    colors: () => ['#ffffff', '#ffffff', '#ffffff'],
    speed: 0.5,
    scale: 1.6,
    turbulence: 1,
    fluidity: 0.1,
    rimWidth: 0.2,
    sharpness: 2.5,
    shimmer: 1.5,
    glow: 2,
    lineWidth: 1,
    flowDirection: 'down',
    opacity: 1,
    mouseInteraction: true,
    mouseStrength: 1,
    mouseRadius: 0.35,
    mouseDampening: 0.15,
    clickSwirl: true,
    intro: true,
    lightMode: false,
    transparent: true,
    backgroundColor: undefined,
    paused: false,
    dpr: undefined,
    mixBlendMode: undefined,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const docRef = shallowRef<Document | null>(null);
  const rootRef = shallowRef<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const rootStyle = computed(() =>
    props.mixBlendMode ? { mixBlendMode: props.mixBlendMode } : undefined,
  );

  const pointer = { x: 0, y: 0, inside: false };
  const magnet = { x: 0, y: 0, active: 0 };
  const swirl = { x: 0, y: 0, age: 10 };
  let gl: WebGL2RenderingContext | null = null;
  let program: ReturnType<typeof link> = null;
  let buffer: WebGLBuffer | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let probe: CanvasRenderingContext2D | null = null;
  const colorCache = new Map<string, number[]>();
  const palette = new Float32Array(MAX_COLORS * 3);
  let time = 0;
  let reveal = 1;
  let raf = 0;
  let last = 0;
  let visible = true;
  let lastDpr: number | undefined;

  const isReduced = () => reducedMotion.value === 'reduce';
  const isHidden = () => docRef.value?.hidden ?? false;

  function parseColor(value: string | undefined, fallback: number[]): number[] {
    if (!value) return fallback;
    const cached = colorCache.get(value);
    if (cached) return cached;
    let rgb = fallback;
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000000';
      probe.fillStyle = value;
      probe.fillRect(0, 0, 1, 1);
      const data = probe.getImageData(0, 0, 1, 1).data;
      rgb = [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255];
    }
    colorCache.set(value, rgb);
    return rgb;
  }

  function activeColors(): string[] {
    return props.colors.length
      ? props.colors.slice(0, MAX_COLORS)
      : ['#ffffff'];
  }

  function render() {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!gl || !program || !canvas || !container) return;
    const u = program.uniforms;
    const ratio = canvas.width / Math.max(1, container.clientWidth);
    const colors = activeColors();
    colors.forEach((value, index) =>
      palette.set(parseColor(value, [1, 1, 1]), index * 3),
    );
    const flow = FLOW[props.flowDirection] ?? FLOW.down;
    const intro = Math.min(1, reveal);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program.program);
    gl.bindVertexArray(vao);
    gl.uniform2f(u.uResolution ?? null, canvas.width, canvas.height);
    gl.uniform1f(u.uTime ?? null, time);
    gl.uniform2f(u.uFlow ?? null, flow[0], flow[1]);
    gl.uniform1f(u.uSpeed ?? null, props.speed);
    gl.uniform1f(u.uScale ?? null, Math.max(0.05, props.scale));
    gl.uniform1f(u.uTurbulence ?? null, props.turbulence);
    gl.uniform1f(u.uFluidity ?? null, Math.max(0.001, props.fluidity));
    gl.uniform1f(u.uRimWidth ?? null, Math.max(0.001, props.rimWidth));
    gl.uniform1f(u.uSharpness ?? null, Math.max(0.1, props.sharpness));
    gl.uniform1f(u.uShimmer ?? null, Math.max(0, props.shimmer));
    gl.uniform1f(u.uGlow ?? null, Math.max(0, props.glow));
    gl.uniform1f(u.uLine ?? null, Math.max(0, props.lineWidth) * ratio * 0.5);
    gl.uniform1f(u.uMaxHalf ?? null, 28 * ratio);
    gl.uniform3fv(u.uColors ?? null, palette);
    gl.uniform1i(u.uColorCount ?? null, colors.length);
    gl.uniform4f(
      u.uMagnet ?? null,
      magnet.x,
      magnet.y,
      magnet.active * Math.max(0, props.mouseStrength),
      Math.max(0.01, props.mouseRadius),
    );
    const age = swirl.age;
    const twist =
      1.9 * Math.min(1, age / 0.23) * Math.exp(-Math.max(0, age - 0.23) * 1.1);
    gl.uniform4f(
      u.uSwirl ?? null,
      swirl.x,
      swirl.y,
      canvas.height * 0.22 * (1 + age * 0.5),
      age < 6 ? twist : 0,
    );
    gl.uniform1f(u.uReveal ?? null, intro * intro * (3 - 2 * intro));
    gl.uniform1f(u.uLight ?? null, props.lightMode ? 1 : 0);
    gl.uniform1f(u.uOpaque ?? null, props.transparent ? 0 : 1);
    gl.uniform3fv(
      u.uBackground ?? null,
      parseColor(
        props.backgroundColor,
        props.lightMode ? [1, 1, 1] : [0.0706, 0.0588, 0.0902],
      ),
    );
    gl.uniform1f(u.uOpacity ?? null, clamp(props.opacity, 0, 1));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now: number) {
    raf = 0;
    if (!visible || isHidden()) return;
    const reduce = isReduced();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    const motion = props.paused || reduce ? 0 : 1;
    time += dt * motion;
    swirl.age += dt;
    if (props.intro && !reduce && reveal < 1)
      reveal = Math.min(1, reveal + dt / INTRO_SECONDS);
    else if (!props.intro || reduce) reveal = 1;

    const engaged = props.mouseInteraction && pointer.inside;
    const dampening = Math.max(0, props.mouseDampening);
    const follow = dampening > 0 ? 1 - Math.exp(-dt / dampening) : 1;
    if (engaged) {
      magnet.x += (pointer.x - magnet.x) * follow;
      magnet.y += (pointer.y - magnet.y) * follow;
    }
    const target = engaged ? 1 : 0;
    magnet.active += (target - magnet.active) * (1 - Math.exp(-dt / 0.3));
    if (Math.abs(target - magnet.active) < 0.001) magnet.active = target;

    render();
    const busy =
      motion > 0 || magnet.active !== target || reveal < 1 || swirl.age < 6;
    if (busy) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  function wake() {
    if (!raf && gl && visible && !isHidden())
      raf = requestAnimationFrame(frame);
  }

  function resize() {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const ratio = Math.min(props.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    render();
    wake();
  }

  function locate(event: PointerEvent) {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const ratio = canvas.width / Math.max(1, rect.width);
    pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    pointer.x = x * ratio;
    pointer.y = (rect.height - y) * ratio;
  }

  function onPointerMove(event: PointerEvent) {
    const wasInside = pointer.inside;
    locate(event);
    if (pointer.inside && !wasInside && magnet.active < 0.05) {
      magnet.x = pointer.x;
      magnet.y = pointer.y;
    }
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    onPointerMove(event);
    if (!pointer.inside || !props.clickSwirl || isReduced()) return;
    swirl.x = pointer.x;
    swirl.y = pointer.y;
    swirl.age = 0;
    wake();
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerType !== 'mouse') pointer.inside = false;
  }

  function onPointerLeave() {
    pointer.inside = false;
  }

  function onVisibility() {
    last = 0;
    wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootRef, 'pointerleave', onPointerLeave);
  useEventListener(docRef, 'visibilitychange', onVisibility);
  useResizeObserver(containerRef, resize);
  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      last = 0;
      wake();
    }
  });

  watch(
    props,
    () => {
      if (props.dpr !== lastDpr) {
        lastDpr = props.dpr;
        resize();
        return;
      }
      if (!raf) render();
      wake();
    },
    { deep: true },
  );

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    docRef.value = document;
    rootRef.value = document.documentElement;
    gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return;
    program = link(gl);
    if (!program) return;
    buffer = gl.createBuffer();
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    probe = document
      .createElement('canvas')
      .getContext('2d', { willReadFrequently: true });
    reveal = props.intro && !isReduced() ? 0 : 1;
    lastDpr = props.dpr;
    resize();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (gl) {
      if (program) gl.deleteProgram(program.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    gl = null;
    program = null;
    probe = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="['flux-lines-container', props.class]"
    :style="rootStyle"
  >
    <canvas ref="canvasRef" class="flux-lines-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .flux-lines-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .flux-lines-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
