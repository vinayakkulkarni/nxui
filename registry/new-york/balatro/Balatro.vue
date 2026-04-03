<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Mesh, Triangle } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      spinRotation?: number;
      spinSpeed?: number;
      offset?: [number, number];
      color1?: string;
      color2?: string;
      color3?: string;
      contrast?: number;
      lighting?: number;
      spinAmount?: number;
      pixelFilter?: number;
      spinEase?: number;
      isRotate?: boolean;
      mouseInteraction?: boolean;
      class?: string;
    }>(),
    {
      spinRotation: -2.0,
      spinSpeed: 7.0,
      offset: () => [0.0, 0.0] as [number, number],
      color1: '#DE443B',
      color2: '#006BB4',
      color3: '#162325',
      contrast: 3.5,
      lighting: 0.4,
      spinAmount: 0.25,
      pixelFilter: 745.0,
      spinEase: 1.0,
      isRotate: false,
      mouseInteraction: true,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement | null>(null);
  let animationId = 0;
  let renderer: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGLRenderingContext | null = null;
  let programRef: InstanceType<typeof Program> | null = null;

  function hexToVec4(hex: string): [number, number, number, number] {
    const h = hex.replace('#', '');
    const r = Number.parseInt(h.slice(0, 2), 16) / 255;
    const g = Number.parseInt(h.slice(2, 4), 16) / 255;
    const b = Number.parseInt(h.slice(4, 6), 16) / 255;
    const a = h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [r, g, b, a];
  }

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
#define PI 3.14159265359
uniform float iTime;
uniform vec3 iResolution;
uniform float uSpinRotation;
uniform float uSpinSpeed;
uniform vec2 uOffset;
uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;
uniform float uContrast;
uniform float uLighting;
uniform float uSpinAmount;
uniform float uPixelFilter;
uniform float uSpinEase;
uniform bool uIsRotate;
uniform vec2 uMouse;
varying vec2 vUv;

vec4 effect(vec2 screenSize, vec2 screen_coords) {
  float pixel_size = length(screenSize.xy) / uPixelFilter;
  vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy) - uOffset;
  float uv_len = length(uv);
  float speed = (uSpinRotation * uSpinEase * 0.2);
  if(uIsRotate) speed = iTime * speed;
  speed += 302.2;
  float mouseInfluence = (uMouse.x * 2.0 - 1.0);
  speed += mouseInfluence * 0.1;
  float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase * 20.0 * (uSpinAmount * uv_len + (1.0 - uSpinAmount));
  vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
  uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);
  uv *= 30.0;
  float baseSpeed = iTime * uSpinSpeed;
  speed = baseSpeed + mouseInfluence * 2.0;
  vec2 uv2 = vec2(uv.x + uv.y);
  for(int i = 0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121), sin(uv2.x - 0.113 * speed));
    uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
  }
  float contrast_mod = (0.25 * uContrast + 0.5 * uSpinAmount + 1.2);
  float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
  float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
  float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
  float c3p = 1.0 - min(1.0, c1p + c2p);
  float light = (uLighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + uLighting * max(c2p * 5.0 - 4.0, 0.0);
  return (0.3 / uContrast) * uColor1 + (1.0 - 0.3 / uContrast) * (uColor1 * c1p + uColor2 * c2p + vec4(c3p * uColor3.rgb, c3p * uColor1.a)) + light;
}

void main() {
  vec2 uv = vUv * iResolution.xy;
  gl_FragColor = effect(iResolution.xy, uv);
}`;

  useResizeObserver(containerRef, () => {
    if (!renderer || !programRef || !containerRef.value) return;
    const w = containerRef.value.offsetWidth;
    const h = containerRef.value.offsetHeight;
    renderer.setSize(w, h);
    const gl = renderer.gl;
    programRef.uniforms.iResolution.value = [
      (gl.canvas as HTMLCanvasElement).width,
      (gl.canvas as HTMLCanvasElement).height,
      (gl.canvas as HTMLCanvasElement).width /
        (gl.canvas as HTMLCanvasElement).height,
    ];
  });

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    if (!props.mouseInteraction || !containerRef.value || !programRef) return;
    const rect = containerRef.value.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    programRef.uniforms.uMouse.value = [x, y];
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    renderer = new Renderer();
    const gl = renderer.gl;
    glContext = gl;
    gl.clearColor(0, 0, 0, 1);
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    const geometry = new Triangle(gl);
    programRef = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: [
            (gl.canvas as HTMLCanvasElement).width,
            (gl.canvas as HTMLCanvasElement).height,
            (gl.canvas as HTMLCanvasElement).width /
              (gl.canvas as HTMLCanvasElement).height,
          ],
        },
        uSpinRotation: { value: props.spinRotation },
        uSpinSpeed: { value: props.spinSpeed },
        uOffset: { value: props.offset },
        uColor1: { value: hexToVec4(props.color1) },
        uColor2: { value: hexToVec4(props.color2) },
        uColor3: { value: hexToVec4(props.color3) },
        uContrast: { value: props.contrast },
        uLighting: { value: props.lighting },
        uSpinAmount: { value: props.spinAmount },
        uPixelFilter: { value: props.pixelFilter },
        uSpinEase: { value: props.spinEase },
        uIsRotate: { value: props.isRotate },
        uMouse: { value: [0.5, 0.5] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program: programRef });
    container.appendChild(gl.canvas as HTMLCanvasElement);

    function update(t: number) {
      animationId = requestAnimationFrame(update);
      if (programRef) programRef.uniforms.iTime.value = t * 0.001;
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
