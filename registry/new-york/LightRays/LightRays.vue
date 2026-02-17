<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Triangle, Mesh } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      raysOrigin?: 'top-center' | 'top-left' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
      raysColor?: string;
      raysSpeed?: number;
      lightSpread?: number;
      rayLength?: number;
      pulsating?: boolean;
      fadeDistance?: number;
      saturation?: number;
      followMouse?: boolean;
      mouseInfluence?: number;
      noiseAmount?: number;
      distortion?: number;
      class?: string;
    }>(),
    {
      raysOrigin: 'top-center',
      raysColor: '#ffffff',
      raysSpeed: 1,
      lightSpread: 1,
      rayLength: 2,
      pulsating: false,
      fadeDistance: 1.0,
      saturation: 1.0,
      followMouse: true,
      mouseInfluence: 0.1,
      noiseAmount: 0.0,
      distortion: 0.0,
      class: '',
    },
  );

  function hexToRgb(hex: string): [number, number, number] {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
      : [1, 1, 1];
  }

  function getAnchorAndDir(origin: string, w: number, h: number) {
    const outside = 0.2;
    switch (origin) {
      case 'top-left':
        return { anchor: [0, -outside * h], dir: [0, 1] };
      case 'top-right':
        return { anchor: [w, -outside * h], dir: [0, 1] };
      case 'left':
        return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
      case 'right':
        return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
      case 'bottom-left':
        return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
      case 'bottom-center':
        return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
      case 'bottom-right':
        return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
      default:
        return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
    }
  }

  const containerRef = ref<HTMLDivElement>();
  let renderer: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGLRenderingContext | null = null;
  let programRef: InstanceType<typeof Program> | null = null;
  let meshRef: InstanceType<typeof Mesh> | null = null;
  let animationId = 0;
  const smoothMouse = { x: 0.5, y: 0.5 };
  const targetMouse = { x: 0.5, y: 0.5 };

  const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const FRAG = `precision highp float;

uniform float iTime;
uniform vec2  iResolution;
uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);
  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );
  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void main() {
  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }
  vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
  vec4 fragColor = rays1 * 0.5 + rays2 * 0.4;
  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }
  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;
  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }
  fragColor.rgb *= raysColor;
  gl_FragColor = fragColor;
}`;

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    if (!props.followMouse || !containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    targetMouse.x = (e.clientX - rect.left) / rect.width;
    targetMouse.y = (e.clientY - rect.top) / rect.height;
  });

  useResizeObserver(containerRef, () => {
    if (!renderer || !programRef || !containerRef.value) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    renderer.setSize(w, h);
    const dpr = renderer.dpr;
    programRef.uniforms.iResolution.value = [w * dpr, h * dpr];
    const { anchor, dir } = getAnchorAndDir(props.raysOrigin, w * dpr, h * dpr);
    programRef.uniforms.rayPos.value = anchor;
    programRef.uniforms.rayDir.value = dir;
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
    const gl = renderer.gl;
    glContext = gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(gl.canvas as HTMLCanvasElement);

    const dpr = renderer.dpr;
    const w = container.clientWidth * dpr;
    const h = container.clientHeight * dpr;
    const { anchor, dir } = getAnchorAndDir(props.raysOrigin, w, h);

    const geometry = new Triangle(gl);
    programRef = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: [w, h] },
        rayPos: { value: anchor },
        rayDir: { value: dir },
        raysColor: { value: hexToRgb(props.raysColor) },
        raysSpeed: { value: props.raysSpeed },
        lightSpread: { value: props.lightSpread },
        rayLength: { value: props.rayLength },
        pulsating: { value: props.pulsating ? 1.0 : 0.0 },
        fadeDistance: { value: props.fadeDistance },
        saturation: { value: props.saturation },
        mousePos: { value: [0.5, 0.5] },
        mouseInfluence: { value: props.mouseInfluence },
        noiseAmount: { value: props.noiseAmount },
        distortion: { value: props.distortion },
      },
    });

    meshRef = new Mesh(gl, { geometry, program: programRef });

    function update(t: number) {
      animationId = requestAnimationFrame(update);
      if (!programRef || !renderer || !meshRef) return;

      programRef.uniforms.iTime.value = t * 0.001;
      programRef.uniforms.raysColor.value = hexToRgb(props.raysColor);
      programRef.uniforms.raysSpeed.value = props.raysSpeed;
      programRef.uniforms.lightSpread.value = props.lightSpread;
      programRef.uniforms.rayLength.value = props.rayLength;
      programRef.uniforms.pulsating.value = props.pulsating ? 1.0 : 0.0;
      programRef.uniforms.fadeDistance.value = props.fadeDistance;
      programRef.uniforms.saturation.value = props.saturation;
      programRef.uniforms.mouseInfluence.value = props.mouseInfluence;
      programRef.uniforms.noiseAmount.value = props.noiseAmount;
      programRef.uniforms.distortion.value = props.distortion;

      if (props.followMouse && props.mouseInfluence > 0) {
        const smoothing = 0.92;
        smoothMouse.x = smoothMouse.x * smoothing + targetMouse.x * (1 - smoothing);
        smoothMouse.y = smoothMouse.y * smoothing + targetMouse.y * (1 - smoothing);
        programRef.uniforms.mousePos.value = [smoothMouse.x, smoothMouse.y];
      }

      renderer.render({ scene: meshRef });
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
