<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      color?: [number, number, number];
      speed?: number;
      amplitude?: number;
      mouseReact?: boolean;
      class?: string;
    }>(),
    {
      color: () => [1, 1, 1] as [number, number, number],
      speed: 1.0,
      amplitude: 0.1,
      mouseReact: true,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement | null>(null);
  let animationId = 0;
  let renderer: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGLRenderingContext | null = null;
  let programRef: InstanceType<typeof Program> | null = null;
  const mousePos = { x: 0.5, y: 0.5 };

  const VERT = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}`;

  const FRAG = `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;
  uv += (uMouse - vec2(0.5)) * uAmplitude;
  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}`;

  useResizeObserver(containerRef, (entries) => {
    if (!renderer || !programRef) return;
    const { width, height } = entries[0]!.contentRect;
    renderer.setSize(width, height);
    programRef.uniforms.uResolution.value = new Color(
      (renderer.gl.canvas as HTMLCanvasElement).width,
      (renderer.gl.canvas as HTMLCanvasElement).height,
      (renderer.gl.canvas as HTMLCanvasElement).width /
        (renderer.gl.canvas as HTMLCanvasElement).height,
    );
  });

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    if (!props.mouseReact || !containerRef.value || !programRef) return;
    const rect = containerRef.value.getBoundingClientRect();
    mousePos.x = (e.clientX - rect.left) / rect.width;
    mousePos.y = 1.0 - (e.clientY - rect.top) / rect.height;
    programRef.uniforms.uMouse.value[0] = mousePos.x;
    programRef.uniforms.uMouse.value[1] = mousePos.y;
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    renderer = new Renderer();
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
        uColor: { value: new Color(...props.color) },
        uResolution: {
          value: new Color(
            (gl.canvas as HTMLCanvasElement).width,
            (gl.canvas as HTMLCanvasElement).height,
            (gl.canvas as HTMLCanvasElement).width /
              (gl.canvas as HTMLCanvasElement).height,
          ),
        },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uAmplitude: { value: props.amplitude },
        uSpeed: { value: props.speed },
      },
    });

    const mesh = new Mesh(gl, { geometry, program: programRef });
    container.appendChild(gl.canvas as HTMLCanvasElement);

    function update(t: number) {
      animationId = requestAnimationFrame(update);
      if (programRef) {
        programRef.uniforms.uTime.value = t * 0.001;
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
  <div ref="containerRef" :class="cn('size-full', $props.class)"></div>
</template>
