<script setup lang="ts">
  import { ref, watch, onBeforeUnmount } from 'vue';
  import { useIntersectionObserver, useResizeObserver } from '@vueuse/core';
  import { Renderer, Program, Triangle, Mesh } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      speed?: number;
      rayColor1?: string;
      rayColor2?: string;
      intensity?: number;
      spread?: number;
      origin?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      tilt?: number;
      saturation?: number;
      blend?: number;
      falloff?: number;
      opacity?: number;
      class?: string;
    }>(),
    {
      speed: 2.5,
      rayColor1: '#EAB308',
      rayColor2: '#96c8ff',
      intensity: 2,
      spread: 2,
      origin: 'top-right',
      tilt: 0,
      saturation: 1.5,
      blend: 0.75,
      falloff: 1.6,
      opacity: 1.0,
      class: '',
    },
  );

  function hexToRgb(hex: string): [number, number, number] {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? [
          Number.parseInt(m[1], 16) / 255,
          Number.parseInt(m[2], 16) / 255,
          Number.parseInt(m[3], 16) / 255,
        ]
      : [1, 1, 1];
  }

  function originToFlip(origin: string): [number, number] {
    switch (origin) {
      case 'top-left':
        return [1, 0];
      case 'bottom-right':
        return [0, 1];
      case 'bottom-left':
        return [1, 1];
      default:
        return [0, 0];
    }
  }

  const VERT = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const FRAG = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`;

  const containerRef = ref<HTMLDivElement>();
  let renderer: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGLRenderingContext | null = null;
  let programRef: InstanceType<typeof Program> | null = null;
  let meshRef: InstanceType<typeof Mesh> | null = null;
  let animationId = 0;
  const isVisible = ref(false);

  const { stop: stopIntersectionObserver } = useIntersectionObserver(
    containerRef,
    ([entry]) => {
      isVisible.value = entry?.isIntersecting ?? false;
    },
    { threshold: 0.1 },
  );

  const { stop: stopResizeObserver } = useResizeObserver(containerRef, () => {
    if (!renderer || !programRef || !containerRef.value) return;
    renderer.dpr = Math.min(window.devicePixelRatio, 2);
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    renderer.setSize(w, h);
    programRef.uniforms.iResolution.value = [
      w * renderer.dpr,
      h * renderer.dpr,
    ];
  });

  function cleanup() {
    cancelAnimationFrame(animationId);
    animationId = 0;

    if (glContext) {
      const canvas = glContext.canvas as HTMLCanvasElement;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      glContext.getExtension('WEBGL_lose_context')?.loseContext();
    }

    renderer = null;
    glContext = null;
    programRef = null;
    meshRef = null;
  }

  async function initializeWebGL() {
    const container = containerRef.value;
    if (!container) return;

    if (renderer) cleanup();

    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    if (!containerRef.value) return;

    renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
    });
    glContext = renderer.gl;
    const gl = renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(gl.canvas as HTMLCanvasElement);

    const [flipX, flipY] = originToFlip(props.origin);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      iSpeed: { value: props.speed },
      iRayColor1: { value: hexToRgb(props.rayColor1) },
      iRayColor2: { value: hexToRgb(props.rayColor2) },
      iIntensity: { value: props.intensity },
      iSpread: { value: props.spread },
      iFlipX: { value: flipX },
      iFlipY: { value: flipY },
      iTilt: { value: props.tilt },
      iSaturation: { value: props.saturation },
      iBlend: { value: props.blend },
      iFalloff: { value: props.falloff },
      iOpacity: { value: props.opacity },
    };

    programRef = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms,
    });

    const geometry = new Triangle(gl);
    meshRef = new Mesh(gl, { geometry, program: programRef });

    function updateSize() {
      if (!containerRef.value || !renderer || !programRef) return;
      renderer.dpr = Math.min(window.devicePixelRatio, 2);
      const w = containerRef.value.clientWidth;
      const h = containerRef.value.clientHeight;
      renderer.setSize(w, h);
      programRef.uniforms.iResolution.value = [
        w * renderer.dpr,
        h * renderer.dpr,
      ];
    }

    updateSize();

    function loop(t: number) {
      if (!renderer || !programRef || !meshRef) return;

      const [fx, fy] = originToFlip(props.origin);

      programRef.uniforms.iTime.value = t * 0.001;
      programRef.uniforms.iSpeed.value = props.speed;
      programRef.uniforms.iRayColor1.value = hexToRgb(props.rayColor1);
      programRef.uniforms.iRayColor2.value = hexToRgb(props.rayColor2);
      programRef.uniforms.iIntensity.value = props.intensity;
      programRef.uniforms.iSpread.value = props.spread;
      programRef.uniforms.iFlipX.value = fx;
      programRef.uniforms.iFlipY.value = fy;
      programRef.uniforms.iTilt.value = props.tilt;
      programRef.uniforms.iSaturation.value = props.saturation;
      programRef.uniforms.iBlend.value = props.blend;
      programRef.uniforms.iFalloff.value = props.falloff;
      programRef.uniforms.iOpacity.value = props.opacity;

      try {
        renderer.render({ scene: meshRef });
        animationId = requestAnimationFrame(loop);
      } catch {
        return;
      }
    }

    animationId = requestAnimationFrame(loop);
  }

  watch(isVisible, (visible) => {
    if (visible) {
      initializeWebGL();
    } else {
      cleanup();
    }
  });

  onBeforeUnmount(() => {
    cleanup();
    stopIntersectionObserver();
    stopResizeObserver();
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', $props.class)"
  ></div>
</template>
