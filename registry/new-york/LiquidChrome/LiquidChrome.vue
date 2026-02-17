<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Mesh, Triangle } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      baseColor?: [number, number, number];
      speed?: number;
      amplitude?: number;
      frequencyX?: number;
      frequencyY?: number;
      interactive?: boolean;
      class?: string;
    }>(),
    {
      baseColor: () => [0.1, 0.1, 0.1] as [number, number, number],
      speed: 0.2,
      amplitude: 0.3,
      frequencyX: 3,
      frequencyY: 3,
      interactive: true,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement | null>(null);
  let animationId = 0;
  let renderer: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGLRenderingContext | null = null;
  let programRef: InstanceType<typeof Program> | null = null;

  const VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const FRAG = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec3 uBaseColor;
uniform float uAmplitude;
uniform float uFrequencyX;
uniform float uFrequencyY;
uniform vec2 uMouse;
varying vec2 vUv;

vec4 renderImage(vec2 uvCoord) {
  vec2 fragCoord = uvCoord * uResolution.xy;
  vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);
  for (float i = 1.0; i < 10.0; i++) {
    uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime + uMouse.x * 3.14159);
    uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime + uMouse.y * 3.14159);
  }
  vec2 diff = (uvCoord - uMouse);
  float dist = length(diff);
  float falloff = exp(-dist * 20.0);
  float ripple = sin(10.0 * dist - uTime * 2.0) * 0.03;
  uv += (diff / (dist + 0.0001)) * ripple * falloff;
  vec3 color = uBaseColor / abs(sin(uTime - uv.y - uv.x));
  return vec4(color, 1.0);
}

void main() {
  vec4 col = vec4(0.0);
  int samples = 0;
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      vec2 offset = vec2(float(i), float(j)) * (1.0 / min(uResolution.x, uResolution.y));
      col += renderImage(vUv + offset);
      samples++;
    }
  }
  gl_FragColor = col / float(samples);
}`;

  useResizeObserver(containerRef, (entries) => {
    if (!renderer || !programRef) return;
    const { width, height } = entries[0].contentRect;
    renderer.setSize(width, height);
    const gl = renderer.gl;
    const resUniform = programRef.uniforms.uResolution.value as Float32Array;
    resUniform[0] = (gl.canvas as HTMLCanvasElement).width;
    resUniform[1] = (gl.canvas as HTMLCanvasElement).height;
    resUniform[2] = (gl.canvas as HTMLCanvasElement).width / (gl.canvas as HTMLCanvasElement).height;
  });

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    if (!props.interactive || !containerRef.value || !programRef) return;
    const rect = containerRef.value.getBoundingClientRect();
    const mouseUniform = programRef.uniforms.uMouse.value as Float32Array;
    mouseUniform[0] = (e.clientX - rect.left) / rect.width;
    mouseUniform[1] = 1 - (e.clientY - rect.top) / rect.height;
  });

  useEventListener(containerRef, 'touchmove', (e: TouchEvent) => {
    if (!props.interactive || !containerRef.value || !programRef || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = containerRef.value.getBoundingClientRect();
    const mouseUniform = programRef.uniforms.uMouse.value as Float32Array;
    mouseUniform[0] = (touch.clientX - rect.left) / rect.width;
    mouseUniform[1] = 1 - (touch.clientY - rect.top) / rect.height;
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    renderer = new Renderer({ antialias: true });
    const gl = renderer.gl;
    glContext = gl;
    gl.clearColor(1, 1, 1, 1);
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    const geometry = new Triangle(gl);
    programRef = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Float32Array([
            (gl.canvas as HTMLCanvasElement).width,
            (gl.canvas as HTMLCanvasElement).height,
            (gl.canvas as HTMLCanvasElement).width / (gl.canvas as HTMLCanvasElement).height,
          ]),
        },
        uBaseColor: { value: new Float32Array(props.baseColor) },
        uAmplitude: { value: props.amplitude },
        uFrequencyX: { value: props.frequencyX },
        uFrequencyY: { value: props.frequencyY },
        uMouse: { value: new Float32Array([0, 0]) },
      },
    });

    const mesh = new Mesh(gl, { geometry, program: programRef });
    container.appendChild(gl.canvas as HTMLCanvasElement);

    function update(t: number) {
      animationId = requestAnimationFrame(update);
      if (programRef) {
        programRef.uniforms.uTime.value = t * 0.001 * props.speed;
      }
      if (renderer) renderer.render({ scene: mesh });
    }
    animationId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    if (glContext) {
      const canvas = glContext.canvas as HTMLCanvasElement;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      glContext.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('size-full', $props.class)" />
</template>
