<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Triangle, Mesh } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      enableRainbow?: boolean;
      gridColor?: string;
      rippleIntensity?: number;
      gridSize?: number;
      gridThickness?: number;
      fadeDistance?: number;
      vignetteStrength?: number;
      glowIntensity?: number;
      opacity?: number;
      gridRotation?: number;
      mouseInteraction?: boolean;
      mouseInteractionRadius?: number;
      class?: string;
    }>(),
    {
      enableRainbow: false,
      gridColor: '#ffffff',
      rippleIntensity: 0.05,
      gridSize: 10.0,
      gridThickness: 15.0,
      fadeDistance: 1.5,
      vignetteStrength: 2.0,
      glowIntensity: 0.1,
      opacity: 1.0,
      gridRotation: 0,
      mouseInteraction: true,
      mouseInteractionRadius: 1,
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

  const containerRef = ref<HTMLDivElement>();
  let renderer: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGLRenderingContext | null = null;
  let programRef: InstanceType<typeof Program> | null = null;
  let meshRef: InstanceType<typeof Mesh> | null = null;
  let animationId = 0;
  const mousePosition = { x: 0.5, y: 0.5 };
  const targetMouse = { x: 0.5, y: 0.5 };
  let mouseInfluence = 0;

  const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const FRAG = `precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform bool enableRainbow;
uniform vec3 gridColor;
uniform float rippleIntensity;
uniform float gridSize;
uniform float gridThickness;
uniform float fadeDistance;
uniform float vignetteStrength;
uniform float glowIntensity;
uniform float opacity;
uniform float gridRotation;
uniform bool mouseInteraction;
uniform vec2 mousePosition;
uniform float mouseInfluence;
uniform float mouseInteractionRadius;
varying vec2 vUv;

float pi = 3.141592;

mat2 rotate(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= iResolution.x / iResolution.y;

  if (gridRotation != 0.0) {
    uv = rotate(gridRotation * pi / 180.0) * uv;
  }

  float dist = length(uv);
  float func = sin(pi * (iTime - dist));
  vec2 rippleUv = uv + uv * func * rippleIntensity;

  if (mouseInteraction && mouseInfluence > 0.0) {
    vec2 mouseUv = (mousePosition * 2.0 - 1.0);
    mouseUv.x *= iResolution.x / iResolution.y;
    float mouseDist = length(uv - mouseUv);
    float influence = mouseInfluence * exp(-mouseDist * mouseDist / (mouseInteractionRadius * mouseInteractionRadius));
    float mouseWave = sin(pi * (iTime * 2.0 - mouseDist * 3.0)) * influence;
    rippleUv += normalize(uv - mouseUv) * mouseWave * rippleIntensity * 0.3;
  }

  vec2 a = sin(gridSize * 0.5 * pi * rippleUv - pi / 2.0);
  vec2 b = abs(a);
  float aaWidth = 0.5;
  vec2 smoothB = vec2(
    smoothstep(0.0, aaWidth, b.x),
    smoothstep(0.0, aaWidth, b.y)
  );

  vec3 color = vec3(0.0);
  color += exp(-gridThickness * smoothB.x * (0.8 + 0.5 * sin(pi * iTime)));
  color += exp(-gridThickness * smoothB.y);
  color += 0.5 * exp(-(gridThickness / 4.0) * sin(smoothB.x));
  color += 0.5 * exp(-(gridThickness / 3.0) * smoothB.y);

  if (glowIntensity > 0.0) {
    color += glowIntensity * exp(-gridThickness * 0.5 * smoothB.x);
    color += glowIntensity * exp(-gridThickness * 0.5 * smoothB.y);
  }

  float ddd = exp(-2.0 * clamp(pow(dist, fadeDistance), 0.0, 1.0));

  vec2 vignetteCoords = vUv - 0.5;
  float vignetteDistance = length(vignetteCoords);
  float vignette = 1.0 - pow(vignetteDistance * 2.0, vignetteStrength);
  vignette = clamp(vignette, 0.0, 1.0);

  vec3 t;
  if (enableRainbow) {
    t = vec3(
      uv.x * 0.5 + 0.5 * sin(iTime),
      uv.y * 0.5 + 0.5 * cos(iTime),
      pow(cos(iTime), 4.0)
    ) + 0.5;
  } else {
    t = gridColor;
  }

  float finalFade = ddd * vignette;
  float alpha = length(color) * finalFade * opacity;
  gl_FragColor = vec4(color * t * finalFade * opacity, alpha);
}`;

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    if (!props.mouseInteraction || !containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    targetMouse.x = (e.clientX - rect.left) / rect.width;
    targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
  });

  useEventListener(containerRef, 'mouseenter', () => {
    if (props.mouseInteraction) mouseInfluence = 1.0;
  });

  useEventListener(containerRef, 'mouseleave', () => {
    if (props.mouseInteraction) mouseInfluence = 0.0;
  });

  useResizeObserver(containerRef, () => {
    if (!renderer || !programRef || !containerRef.value) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    renderer.setSize(w, h);
    programRef.uniforms.iResolution.value = [w, h];
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
    });
    const gl = renderer.gl;
    glContext = gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(gl.canvas as HTMLCanvasElement);

    const geometry = new Triangle(gl);
    programRef = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: [container.clientWidth, container.clientHeight] },
        enableRainbow: { value: props.enableRainbow },
        gridColor: { value: hexToRgb(props.gridColor) },
        rippleIntensity: { value: props.rippleIntensity },
        gridSize: { value: props.gridSize },
        gridThickness: { value: props.gridThickness },
        fadeDistance: { value: props.fadeDistance },
        vignetteStrength: { value: props.vignetteStrength },
        glowIntensity: { value: props.glowIntensity },
        opacity: { value: props.opacity },
        gridRotation: { value: props.gridRotation },
        mouseInteraction: { value: props.mouseInteraction },
        mousePosition: { value: [0.5, 0.5] },
        mouseInfluence: { value: 0 },
        mouseInteractionRadius: { value: props.mouseInteractionRadius },
      },
    });

    meshRef = new Mesh(gl, { geometry, program: programRef });

    function update(t: number) {
      animationId = requestAnimationFrame(update);
      if (!programRef || !renderer || !meshRef) return;

      programRef.uniforms.iTime.value = t * 0.001;
      programRef.uniforms.enableRainbow.value = props.enableRainbow;
      programRef.uniforms.gridColor.value = hexToRgb(props.gridColor);
      programRef.uniforms.rippleIntensity.value = props.rippleIntensity;
      programRef.uniforms.gridSize.value = props.gridSize;
      programRef.uniforms.gridThickness.value = props.gridThickness;
      programRef.uniforms.fadeDistance.value = props.fadeDistance;
      programRef.uniforms.vignetteStrength.value = props.vignetteStrength;
      programRef.uniforms.glowIntensity.value = props.glowIntensity;
      programRef.uniforms.opacity.value = props.opacity;
      programRef.uniforms.gridRotation.value = props.gridRotation;
      programRef.uniforms.mouseInteraction.value = props.mouseInteraction;
      programRef.uniforms.mouseInteractionRadius.value =
        props.mouseInteractionRadius;

      const lerpFactor = 0.1;
      mousePosition.x += (targetMouse.x - mousePosition.x) * lerpFactor;
      mousePosition.y += (targetMouse.y - mousePosition.y) * lerpFactor;
      const currentInfluence = programRef.uniforms.mouseInfluence
        .value as number;
      programRef.uniforms.mouseInfluence.value =
        currentInfluence + (mouseInfluence - currentInfluence) * 0.05;
      programRef.uniforms.mousePosition.value = [
        mousePosition.x,
        mousePosition.y,
      ];

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
  <div ref="containerRef" :class="cn('size-full', $props.class)"></div>
</template>
