<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import {
    Scene,
    OrthographicCamera,
    WebGLRenderer,
    PlaneGeometry,
    Mesh,
    ShaderMaterial,
    Color,
  } from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      speed?: number;
      scale?: number;
      color?: string;
      noiseIntensity?: number;
      rotation?: number;
      class?: string;
    }>(),
    {
      speed: 5,
      scale: 1,
      color: '#7B7481',
      noiseIntensity: 1.5,
      rotation: 0,
      class: '',
    },
  );

  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      Number.parseInt(h.slice(0, 2), 16) / 255,
      Number.parseInt(h.slice(2, 4), 16) / 255,
      Number.parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  const containerRef = ref<HTMLDivElement>();
  let renderer: WebGLRenderer | null = null;
  let material: ShaderMaterial | null = null;
  let rafId = 0;

  const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

  const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2 r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle); float s = sin(angle);
  return mat2(c, -s, s, c) * uv;
}

void main() {
  float rnd = noise(gl_FragCoord.xy);
  vec2 uv = rotateUvs(vUv * uScale, uRotation);
  vec2 tex = uv * uScale;
  float tOffset = uSpeed * uTime;
  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);
  float pattern = 0.6 + 0.4 * sin(5.0 * (tex.x + tex.y + cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * tOffset) + sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));
  vec4 col = vec4(uColor, 1.0) * vec4(vec3(pattern), 1.0) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}`;

  function resize() {
    if (!containerRef.value || !renderer) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    renderer.setSize(w, h, false);
  }

  useResizeObserver(containerRef, resize);

  onMounted(() => {
    if (!containerRef.value) return;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    containerRef.value.appendChild(renderer.domElement);

    material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: props.speed },
        uScale: { value: props.scale },
        uNoiseIntensity: { value: props.noiseIntensity },
        uColor: { value: new Color(...hexToRgb(props.color)) },
        uRotation: { value: props.rotation },
      },
      vertexShader,
      fragmentShader,
    });

    const geometry = new PlaneGeometry(2, 2);
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);
    resize();

    function update() {
      if (!renderer || !material) return;
      material.uniforms.uTime.value += 0.004;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (renderer && containerRef.value) {
      renderer.dispose();
      if (containerRef.value.contains(renderer.domElement)) {
        containerRef.value.removeChild(renderer.domElement);
      }
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('size-full', $props.class)"></div>
</template>
