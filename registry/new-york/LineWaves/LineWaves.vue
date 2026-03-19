<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { Renderer, Program, Mesh, Triangle } from 'ogl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      speed?: number;
      innerLineCount?: number;
      outerLineCount?: number;
      warpIntensity?: number;
      rotation?: number;
      edgeFadeWidth?: number;
      colorCycleSpeed?: number;
      brightness?: number;
      color1?: string;
      color2?: string;
      color3?: string;
      enableMouseInteraction?: boolean;
      mouseInfluence?: number;
      class?: string;
    }>(),
    {
      speed: 0.3,
      innerLineCount: 32,
      outerLineCount: 36,
      warpIntensity: 1.0,
      rotation: -45,
      edgeFadeWidth: 0.0,
      colorCycleSpeed: 1.0,
      brightness: 0.2,
      color1: '#ffffff',
      color2: '#ffffff',
      color3: '#ffffff',
      enableMouseInteraction: true,
      mouseInfluence: 2.0,
      class: '',
    },
  );

  function hexToVec3(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      Number.parseInt(h.slice(0, 2), 16) / 255,
      Number.parseInt(h.slice(2, 4), 16) / 255,
      Number.parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  const containerRef = ref<HTMLDivElement>();
  let renderer: Renderer | null = null;
  let program: Program | null = null;
  let animId = 0;
  const currentMouse = [0.5, 0.5];
  const targetMouse = [0.5, 0.5];

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
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uInnerLines;
uniform float uOuterLines;
uniform float uWarpIntensity;
uniform float uRotation;
uniform float uEdgeFadeWidth;
uniform float uColorCycleSpeed;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define HALF_PI 1.5707963

float hashF(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

float smoothNoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hashF(i), hashF(i + 1.0), u);
}

float displaceA(float coord, float t) {
  float result = sin(coord * 2.123) * 0.2;
  result += sin(coord * 3.234 + t * 4.345) * 0.1;
  result += sin(coord * 0.589 + t * 0.934) * 0.5;
  return result;
}

float displaceB(float coord, float t) {
  float result = sin(coord * 1.345) * 0.3;
  result += sin(coord * 2.734 + t * 3.345) * 0.2;
  result += sin(coord * 0.189 + t * 0.934) * 0.3;
  return result;
}

vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  vec2 coords = gl_FragCoord.xy / uResolution.xy;
  coords = coords * 2.0 - 1.0;
  coords = rotate2D(coords, uRotation);

  float halfT = uTime * uSpeed * 0.5;
  float fullT = uTime * uSpeed;

  float mouseWarp = 0.0;
  if (uEnableMouse) {
    vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
    float mDist = length(coords - mPos);
    mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
  }

  float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
  float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;

  vec2 fieldA = vec2(warpAx, warpAy);
  vec2 fieldB = vec2(warpBx, warpBy);
  vec2 blended = mix(fieldA, fieldB, mix(fieldA, fieldB, 0.5));

  float fadeTop = smoothstep(uEdgeFadeWidth, uEdgeFadeWidth + 0.4, blended.y);
  float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
  float vMask = 1.0 - max(fadeTop, fadeBottom);

  float tileCount = mix(uOuterLines, uInnerLines, vMask);
  float scaledY = blended.y * tileCount;
  float nY = smoothNoise(abs(scaledY));

  float ridge = pow(
    step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)),
    5.0
  );

  float lines = 0.0;
  for (float i = 1.0; i < 3.0; i += 1.0) {
    lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
  }

  float pattern = vMask * lines;

  float cycleT = fullT * uColorCycleSpeed;
  float rChannel = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.234) * 0.5 + 1.0);
  float gChannel = (pattern + vMask * ridge) * (sin(blended.x + cycleT * 1.745) * 0.5 + 1.0);
  float bChannel = (pattern + lines * ridge) * (cos(blended.x + cycleT * 0.534) * 0.5 + 1.0);

  vec3 col = (rChannel * uColor1 + gChannel * uColor2 + bChannel * uColor3) * uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}`;

  function resize() {
    const container = containerRef.value;
    if (!container || !renderer || !program) return;
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    const gl = renderer.gl;
    program.uniforms.uResolution.value = [
      gl.canvas.width,
      gl.canvas.height,
      gl.canvas.width / gl.canvas.height,
    ];
  }

  useResizeObserver(containerRef, resize);

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    renderer.setSize(container.offsetWidth, container.offsetHeight);

    const geometry = new Triangle(gl);
    const rotationRad = (props.rotation * Math.PI) / 180;

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: [
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height,
          ],
        },
        uSpeed: { value: props.speed },
        uInnerLines: { value: props.innerLineCount },
        uOuterLines: { value: props.outerLineCount },
        uWarpIntensity: { value: props.warpIntensity },
        uRotation: { value: rotationRad },
        uEdgeFadeWidth: { value: props.edgeFadeWidth },
        uColorCycleSpeed: { value: props.colorCycleSpeed },
        uBrightness: { value: props.brightness },
        uColor1: { value: hexToVec3(props.color1) },
        uColor2: { value: hexToVec3(props.color2) },
        uColor3: { value: hexToVec3(props.color3) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseInfluence: { value: props.mouseInfluence },
        uEnableMouse: { value: props.enableMouseInteraction },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    if (props.enableMouseInteraction) {
      useEventListener(gl.canvas, 'mousemove', (e: MouseEvent) => {
        const rect = gl.canvas.getBoundingClientRect();
        targetMouse[0] = (e.clientX - rect.left) / rect.width;
        targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
      });
      useEventListener(gl.canvas, 'mouseleave', () => {
        targetMouse[0] = 0.5;
        targetMouse[1] = 0.5;
      });
    }

    function update(time: number) {
      animId = requestAnimationFrame(update);
      if (!program) return;
      program.uniforms.uTime.value = time * 0.001;

      if (props.enableMouseInteraction) {
        currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
        currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
        program.uniforms.uMouse.value[0] = currentMouse[0];
        program.uniforms.uMouse.value[1] = currentMouse[1];
      }

      renderer!.render({ scene: mesh });
    }
    animId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animId);
    if (renderer) {
      const gl = renderer.gl;
      const canvas = gl.canvas;
      canvas.parentElement?.removeChild(canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    renderer = null;
    program = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('size-full', props.class)"
  ></div>
</template>
