<script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    SPECTRAL_RIBBON_FRAGMENT,
    SPECTRAL_RIBBON_VERTEX,
    bounded,
  } from './spectral-ribbon-shader';
  import type { SpectralRibbonProps, SpectralRibbonUniforms } from './types';

  const props = withDefaults(defineProps<SpectralRibbonProps>(), {
    speed: 1,
    intensity: 1,
    thickness: 1,
    grain: 0.45,
    class: '',
  });

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const ready = ref(false);
  const visible = ref(true);

  const documentVisibility = useDocumentVisibility();
  const reducedMotion = usePreferredReducedMotion();

  let gl: WebGLRenderingContext | null = null;
  let uniforms: SpectralRibbonUniforms | null = null;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let dispose: (() => void) | null = null;

  function isMotionReduced(): boolean {
    return reducedMotion.value === 'reduce';
  }

  function canRun(): boolean {
    return visible.value && documentVisibility.value !== 'hidden';
  }

  function draw(now: number): void {
    frame = 0;
    const canvas = canvasRef.value;
    if (!gl || !uniforms || !canvas) return;

    const rate = bounded(props.speed, 0, 2, 1);
    if (previous && !isMotionReduced()) {
      elapsed += Math.min((now - previous) / 1000, 0.05) * rate;
    }
    previous = now;

    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, elapsed);
    gl.uniform1f(uniforms.intensity, bounded(props.intensity, 0.25, 2, 1));
    gl.uniform1f(uniforms.thickness, bounded(props.thickness, 0.5, 2, 1));
    gl.uniform1f(uniforms.grain, bounded(props.grain, 0, 1, 0.45));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    ready.value = true;

    if (rate > 0 && !isMotionReduced() && canRun()) {
      frame = requestAnimationFrame(draw);
    }
  }

  function refresh(): void {
    if (!gl) return;
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (canRun()) frame = requestAnimationFrame(draw);
  }

  function resize(): void {
    const canvas = canvasRef.value;
    if (!gl || !canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    refresh();
  }

  function initialize(): void {
    dispose?.();
    dispose = null;
    const canvas = canvasRef.value;
    if (!canvas) return;

    const context = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
    });
    if (!context) return;

    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string): WebGLShader | null => {
      const shader = context.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      context.shaderSource(shader, source);
      context.compileShader(shader);
      return context.getShaderParameter(shader, context.COMPILE_STATUS)
        ? shader
        : null;
    };

    const vs = compile(context.VERTEX_SHADER, SPECTRAL_RIBBON_VERTEX);
    const fs = compile(context.FRAGMENT_SHADER, SPECTRAL_RIBBON_FRAGMENT);
    const program = context.createProgram();
    const buffer = context.createBuffer();
    const release = (): void => {
      context.deleteBuffer(buffer);
      context.deleteProgram(program);
      shaders.forEach((shader) => context.deleteShader(shader));
    };

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

    uniforms = {
      resolution: context.getUniformLocation(program, 'u_resolution'),
      time: context.getUniformLocation(program, 'u_time'),
      intensity: context.getUniformLocation(program, 'u_intensity'),
      thickness: context.getUniformLocation(program, 'u_thickness'),
      grain: context.getUniformLocation(program, 'u_grain'),
    };
    gl = context;

    dispose = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      gl = null;
      uniforms = null;
      release();
    };

    resize();
  }

  function handleContextLost(event: Event): void {
    event.preventDefault();
    dispose?.();
    dispose = null;
    ready.value = false;
  }

  function handleContextRestored(): void {
    initialize();
  }

  useResizeObserver(canvasRef, resize);
  useIntersectionObserver(canvasRef, (entries) => {
    visible.value = entries[0]?.isIntersecting ?? false;
  });
  useEventListener(canvasRef, 'webglcontextlost', handleContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', handleContextRestored);

  watch(
    [
      () => props.speed,
      () => props.intensity,
      () => props.thickness,
      () => props.grain,
      visible,
      documentVisibility,
      reducedMotion,
    ],
    refresh,
  );

  onMounted(initialize);

  onBeforeUnmount(() => {
    const context = gl;
    dispose?.();
    dispose = null;
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  });
</script>

<template>
  <div
    :class="
      cn('relative size-full min-h-0 overflow-hidden bg-black', props.class)
    "
  >
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 block size-full"
      :class="ready ? 'opacity-100' : 'opacity-0'"
    />
    <div v-if="$slots.default" class="relative z-10 size-full min-h-0">
      <slot />
    </div>
  </div>
</template>
