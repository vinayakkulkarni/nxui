<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    GRAIN_GRADIENT_FRAGMENT,
    GRAIN_GRADIENT_UNIFORMS,
    GRAIN_GRADIENT_VERTEX,
    bounded,
    hexToRgb,
  } from './grain-gradient-shader';
  import type { GrainGradientUniform } from './grain-gradient-shader';
  import type { GrainGradientProps } from './types';

  const props = withDefaults(defineProps<GrainGradientProps>(), {
    colorLight: '#dce5df',
    colorMid: '#83b9ad',
    colorDark: '#031419',
    angle: 0,
    position: 0,
    curve: 0.48,
    softness: 0.13,
    scale: 1,
    grain: 0.32,
    grainSize: 1,
    seed: 1,
    speed: 1,
    class: '',
  });

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const ready = ref(false);
  const visible = ref(true);
  const reducedMotion = usePreferredReducedMotion();
  const documentVisibility = useDocumentVisibility();

  // CSS fallback shown until the first WebGL frame (and when WebGL is unavailable).
  const fallbackBackground = computed(
    () =>
      `linear-gradient(${120 + props.angle}deg, ${props.colorMid} 0%, ${props.colorLight} 35%, ${props.colorDark} 75%)`,
  );

  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let shaders: WebGLShader[] = [];
  const uniforms = new Map<GrainGradientUniform, WebGLUniformLocation | null>();
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let ratio = 1;
  let unmounted = false;

  function canAnimate(): boolean {
    return visible.value && documentVisibility.value !== 'hidden';
  }

  function release(): void {
    cancelAnimationFrame(frame);
    frame = 0;
    if (gl) {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      for (const shader of shaders) gl.deleteShader(shader);
    }
    buffer = null;
    program = null;
    shaders = [];
    uniforms.clear();
  }

  function compile(
    context: WebGLRenderingContext,
    type: number,
    source: string,
  ) {
    const shader = context.createShader(type);
    if (!shader) return null;
    shaders.push(shader);
    context.shaderSource(shader, source);
    context.compileShader(shader);
    return context.getShaderParameter(shader, context.COMPILE_STATUS)
      ? shader
      : null;
  }

  function scalar(name: GrainGradientUniform, value: number): void {
    gl?.uniform1f(uniforms.get(name) ?? null, value);
  }

  function draw(now: number): void {
    frame = 0;
    const canvas = canvasRef.value;
    if (!gl || !program || !canvas) return;
    const rate = bounded(props.speed, 0, 2, 1);
    const still = reducedMotion.value === 'reduce';
    if (previous && !still)
      elapsed += Math.min((now - previous) / 1000, 0.05) * rate;
    previous = now;
    gl.uniform2f(
      uniforms.get('resolution') ?? null,
      canvas.width,
      canvas.height,
    );
    scalar('ratio', ratio);
    scalar('time', elapsed);
    scalar('angle', (bounded(props.angle, -360, 360, 0) * Math.PI) / 180);
    scalar('position', bounded(props.position, -1, 1, 0));
    scalar('curve', bounded(props.curve, -1, 1, 0.48));
    scalar('softness', bounded(props.softness, 0.01, 1, 0.13));
    scalar('scale', bounded(props.scale, 0.25, 3, 1));
    scalar('grain', bounded(props.grain, 0, 1, 0.32));
    scalar('grainSize', bounded(props.grainSize, 0.5, 4, 1));
    scalar('seed', bounded(props.seed, 0, 100000, 1));
    gl.uniform3fv(
      uniforms.get('light') ?? null,
      hexToRgb(props.colorLight, '#dce5df'),
    );
    gl.uniform3fv(
      uniforms.get('mid') ?? null,
      hexToRgb(props.colorMid, '#83b9ad'),
    );
    gl.uniform3fv(
      uniforms.get('dark') ?? null,
      hexToRgb(props.colorDark, '#031419'),
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    ready.value = true;
    if (rate > 0 && !still && canAnimate()) frame = requestAnimationFrame(draw);
  }

  function refresh(): void {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (program && canAnimate()) frame = requestAnimationFrame(draw);
  }

  function resize(): void {
    const canvas = canvasRef.value;
    if (!canvas || !gl) return;
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    refresh();
  }

  function initialize(): void {
    const context = gl;
    if (!context || unmounted) return;
    release();
    const vs = compile(context, context.VERTEX_SHADER, GRAIN_GRADIENT_VERTEX);
    const fs = compile(
      context,
      context.FRAGMENT_SHADER,
      GRAIN_GRADIENT_FRAGMENT,
    );
    program = context.createProgram();
    buffer = context.createBuffer();
    if (!vs || !fs || !program || !buffer) {
      release();
      return;
    }
    context.attachShader(program, vs);
    context.attachShader(program, fs);
    context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS)) {
      release();
      return;
    }
    context.useProgram(program);
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(
      context.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      context.STATIC_DRAW,
    );
    const attribute = context.getAttribLocation(program, 'a_position');
    context.enableVertexAttribArray(attribute);
    context.vertexAttribPointer(attribute, 2, context.FLOAT, false, 0, 0);
    for (const name of GRAIN_GRADIENT_UNIFORMS)
      uniforms.set(name, context.getUniformLocation(program, `u_${name}`));
    resize();
  }

  function onContextLost(event: Event): void {
    event.preventDefault();
    release();
    ready.value = false;
  }

  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', initialize);
  useResizeObserver(canvasRef, resize);
  useIntersectionObserver(canvasRef, ([entry]) => {
    visible.value = entry?.isIntersecting ?? false;
    refresh();
  });

  watch([documentVisibility, reducedMotion], refresh);
  watch(
    [
      () => props.colorLight,
      () => props.colorMid,
      () => props.colorDark,
      () => props.angle,
      () => props.position,
      () => props.curve,
      () => props.softness,
      () => props.scale,
      () => props.grain,
      () => props.grainSize,
      () => props.seed,
      () => props.speed,
    ],
    refresh,
  );

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
    });
    initialize();
  });

  onBeforeUnmount(() => {
    unmounted = true;
    release();
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    gl = null;
  });
</script>

<template>
  <div
    aria-hidden="true"
    :class="
      cn('pointer-events-none relative size-full overflow-hidden', props.class)
    "
    :style="{ background: fallbackBackground }"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      :style="{ opacity: ready ? 1 : 0 }"
    />
  </div>
</template>
