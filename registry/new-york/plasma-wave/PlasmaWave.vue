<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { Renderer, Program, Mesh, Geometry } from 'ogl';
  import { cn } from '~/lib/utils';
  import type { PlasmaWaveProps } from '~/types/components';

  const props = withDefaults(defineProps<PlasmaWaveProps>(), {
    xOffset: 0,
    yOffset: 0,
    rotationDeg: 0,
    focalLength: 0.8,
    speed1: 0.05,
    speed2: 0.05,
    dir2: 1.0,
    bend1: 1,
    bend2: 0.5,
    colors: () => ['#A855F7', '#06B6D4'],
    class: '',
  });

  function hexToRgb(hex: string): [number, number, number] {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  }

  const containerRef = ref<HTMLDivElement | null>(null);
  let renderer: Renderer | null = null;
  let program: Program | null = null;
  let mesh: Mesh | null = null;
  let rafId = 0;
  let startTime = 0;

  const VERT = /* glsl */ `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const FRAG = /* glsl */ `
precision mediump float;
uniform float iTime;
uniform vec2  iResolution;
uniform vec2  uOffset;
uniform float uRotation;
uniform float uFocalLength;
uniform float uSpeed1;
uniform float uSpeed2;
uniform float uDir2;
uniform float uBend1;
uniform float uBend2;
uniform vec3  uColor1;
uniform vec3  uColor2;

const float lt   = 0.3;
const float pi   = 3.14159;
const float pi2  = 6.28318;
const float pi_2 = 1.5708;
#define MAX_STEPS 14

void mainImage(out vec4 C, in vec2 U) {
  float t = iTime * pi;
  float s = 1.0;
  float d = 0.0;
  vec2  R = iResolution;

  vec3 o = vec3(0.0, 0.0, -7.0);
  vec3 u = normalize(vec3((U - 0.5 * R) / R.y, uFocalLength));
  vec2 k = vec2(0.0);
  vec3 p;

  float t1 = t * 0.7;
  float t2 = t * 0.9;
  float tSpeed1 = t * uSpeed1;
  float tSpeed2 = t * uSpeed2 * uDir2;
  for (int i = 0; i < MAX_STEPS; ++i) {
    p = o + u * d;
    p.x -= 15.0;

    float px = p.x;
    float wob1 = uBend1 + sin(t1 + px * 0.8) * 0.1;
    float wob2 = uBend2 + cos(t2 + px * 1.1) * 0.1;
    float px2 = px + pi_2;
    vec2 sinOffset = sin(vec2(px, px2) + tSpeed1) * wob1;
    vec2 cosOffset = cos(vec2(px, px2) + tSpeed2) * wob2;
    vec2 yz = p.yz;
    float pxLt = px + lt;
    k.x = max(pxLt, length(yz - sinOffset) - lt);
    k.y = max(pxLt, length(yz - cosOffset) - lt);

    float current = min(k.x, k.y);
    s = min(s, current);
    if (s < 0.001 || d > 300.0) break;
    d += s * 0.7;
  }

  float sqrtD = sqrt(d);
  vec3 raw = max(cos(d * pi2) - s * sqrtD - vec3(k, 0.0), 0.0);
  raw.gb += 0.1;
  float maxC = max(raw.r, max(raw.g, raw.b));
  if (maxC < 0.15) discard;
  raw = raw * 0.4 + raw.brg * 0.6 + raw * raw;

  float w1 = 0.5 + 0.5 * cos(d * 0.5);
  float w2 = 0.5 + 0.5 * sin(d * 0.5);
  float wt = w1 + w2;
  float lum = exp(-d * 0.015);
  vec3 c = (uColor1 * w1 + uColor2 * w2) / wt * lum * 3.5;
  C = vec4(c, 1.0);
}

void main() {
  vec2 coord = gl_FragCoord.xy + uOffset;
  coord -= 0.5 * iResolution;
  float c = cos(uRotation), s = sin(uRotation);
  coord = mat2(c, -s, s, c) * coord;
  coord += 0.5 * iResolution;
  mainImage(gl_FragColor, coord);
}
`;

  function resize() {
    if (!containerRef.value || !renderer || !program) return;
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const { width, height } = containerRef.value.getBoundingClientRect();
    renderer.setSize(width * dpr, height * dpr);
    const gl = renderer.gl;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    const res = program.uniforms.iResolution.value as Float32Array;
    res[0] = gl.drawingBufferWidth;
    res[1] = gl.drawingBufferHeight;
  }

  useResizeObserver(containerRef, resize);

  onMounted(() => {
    if (!containerRef.value) return;

    renderer = new Renderer({
      alpha: true,
      dpr: Math.min(window.devicePixelRatio, 1.5),
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    containerRef.value.appendChild(gl.canvas);

    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
    });

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([0, 0]) },
        uOffset: { value: new Float32Array([0, 0]) },
        uRotation: { value: 0 },
        uFocalLength: { value: props.focalLength },
        uSpeed1: { value: props.speed1 },
        uSpeed2: { value: props.speed2 },
        uDir2: { value: props.dir2 },
        uBend1: { value: props.bend1 },
        uBend2: { value: props.bend2 },
        uColor1: { value: new Float32Array(hexToRgb(props.colors[0])) },
        uColor2: { value: new Float32Array(hexToRgb(props.colors[1])) },
      },
    });

    mesh = new Mesh(gl, { geometry, program });
    resize();

    function update(t: number) {
      if (!program || !renderer || !mesh) return;
      program.uniforms.iTime.value = (t - startTime) * 0.001;
      renderer.render({ scene: mesh });
      rafId = requestAnimationFrame(update);
    }

    startTime = performance.now();
    rafId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (renderer && containerRef.value) {
      const gl = renderer.gl;
      if (containerRef.value.contains(gl.canvas))
        containerRef.value.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('size-full', props.class)"></div>
</template>
