<script setup lang="ts">
  import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
  import {
    useElementVisibility,
    useMediaQuery,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { animate } from 'motion-v';
  import { ACTIVE, CHAOS_KEYS, FRAGMENT, RESTING, VERTEX } from './shader';
  import type { ChaosButtonProps, ChaosState, ChaosUniforms } from './types';

  const props = withDefaults(defineProps<ChaosButtonProps>(), {
    label: 'Chaos Button',
    noise: 'trig',
    resting: () => ({}),
    active: () => ({}),
    activeDuration: 0.5,
    restingDuration: 0.5,
    class: '',
  });

  const emit = defineEmits<{ click: [event: MouseEvent] }>();

  // power2.out
  const EASE = [0.25, 0.46, 0.45, 0.94] as const;

  const button = useTemplateRef<HTMLButtonElement>('button');
  const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
  const visible = useElementVisibility(button);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  let gl: WebGLRenderingContext | null = null;
  let uniforms: ChaosUniforms | null = null;
  let phase = 0;
  let stop: (() => void) | null = null;

  const current: ChaosState = { ...RESTING, ...props.resting };

  function compile(type: number, source: string): WebGLShader | null {
    if (!gl) return null;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function setup(): void {
    const el = canvas.value;
    if (!el) return;
    gl = el.getContext('webgl', { alpha: false, antialias: true });
    if (!gl) return;
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const context = gl;
    const at = (name: string) => context.getUniformLocation(program, name);
    uniforms = {
      resolution: at('u_resolution'),
      time: at('u_time'),
      tap: at('u_tap'),
      speed: at('u_speed'),
      amplitude: at('u_amplitude'),
      pulseMin: at('u_pulseMin'),
      pulseMax: at('u_pulseMax'),
      noiseType: at('u_noiseType'),
    };
    resize();
  }

  function resize(): void {
    const el = canvas.value;
    if (!gl || !uniforms || !el) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = el.getBoundingClientRect();
    el.width = Math.max(1, Math.round(rect.width * dpr));
    el.height = Math.max(1, Math.round(rect.height * dpr));
    gl.viewport(0, 0, el.width, el.height);
    gl.uniform2f(uniforms.resolution, el.width, el.height);
    render();
  }

  function render(): void {
    if (!gl || !uniforms) return;
    gl.uniform1f(uniforms.time, phase);
    gl.uniform1f(uniforms.tap, current.chaos);
    gl.uniform1f(uniforms.speed, 1);
    gl.uniform1f(uniforms.amplitude, current.amplitude);
    gl.uniform1f(uniforms.pulseMin, current.pulseMin);
    gl.uniform1f(uniforms.pulseMax, current.pulseMax);
    gl.uniform1f(uniforms.noiseType, props.noise === 'trig' ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Frozen on the first frame under reduced motion; paused offscreen.
  useRafFn(({ delta }) => {
    if (!visible.value || reduced.value) return;
    phase = (phase + (delta / 1000) * current.speed) % 1000;
    render();
  });

  useResizeObserver(canvas, resize);

  function tweenTo(target: ChaosState, duration: number): void {
    stop?.();
    const from = { ...current };
    const controls = animate(0, 1, {
      duration: reduced.value ? 0 : duration,
      ease: EASE,
      onUpdate: (t: number) => {
        for (const key of CHAOS_KEYS) {
          current[key] = from[key] + (target[key] - from[key]) * t;
        }
        if (reduced.value) render();
      },
    });
    stop = () => controls.stop();
  }

  function press(): void {
    tweenTo({ ...ACTIVE, ...props.active }, props.activeDuration);
  }

  function release(): void {
    tweenTo({ ...RESTING, ...props.resting }, props.restingDuration);
  }

  function onKeydown(event: KeyboardEvent): void {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) press();
  }

  function onKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') release();
  }

  function onClick(event: MouseEvent): void {
    emit('click', event);
  }

  onMounted(setup);
  onBeforeUnmount(() => {
    stop?.();
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  });
</script>

<template>
  <button
    ref="button"
    type="button"
    :class="['chaos-button', props.class]"
    @pointerdown="press"
    @pointerup="release"
    @pointerleave="release"
    @pointercancel="release"
    @keydown="onKeydown"
    @keyup="onKeyup"
    @blur="release"
    @click="onClick"
  >
    <canvas ref="canvas" class="chaos-button__canvas" aria-hidden="true" />
    <span class="chaos-button__label"
      ><slot>{{ props.label }}</slot></span
    >
  </button>
</template>

<style scoped>
  .chaos-button {
    position: relative;
    display: inline-grid;
    place-items: center;
    border: none;
    padding: 0;
    cursor: pointer;
    width: 240px;
    height: 60px;
    border-radius: 150px;
    overflow: hidden;
    transition: transform 0.2s;
    background: linear-gradient(#eee, #555);
    -webkit-tap-highlight-color: transparent;
  }

  .chaos-button:hover {
    transform: scale(1.02);
  }

  .chaos-button:active {
    transform: scale(0.98);
  }

  .chaos-button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }

  .chaos-button__canvas {
    position: absolute;
    inset: 2px;
    display: block;
    width: calc(100% - 4px);
    height: calc(100% - 4px);
    border-radius: inherit;
  }

  .chaos-button__label {
    position: relative;
    z-index: 1;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-shadow: 0 0 10px rgb(0 0 0 / 0.5);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .chaos-button,
    .chaos-button:hover,
    .chaos-button:active {
      transition: none;
      transform: none;
    }
  }
</style>
