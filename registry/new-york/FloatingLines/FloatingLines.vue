<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import {
    Scene,
    OrthographicCamera,
    WebGLRenderer,
    PlaneGeometry,
    Mesh,
    ShaderMaterial,
    Vector3,
    Vector2,
    Timer,
  } from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      linesGradient?: string[];
      animationSpeed?: number;
      interactive?: boolean;
      bendRadius?: number;
      bendStrength?: number;
      class?: string;
    }>(),
    {
      linesGradient: () => ['#e233f5', '#2f4ba2'],
      animationSpeed: 1,
      interactive: true,
      bendRadius: 5.0,
      bendStrength: -0.5,
      class: '',
    },
  );

  function hexToVec3(hex: string): Vector3 {
    const h = hex.replace('#', '');
    return new Vector3(
      Number.parseInt(h.slice(0, 2), 16) / 255,
      Number.parseInt(h.slice(2, 4), 16) / 255,
      Number.parseInt(h.slice(4, 6), 16) / 255,
    );
  }

  const containerRef = ref<HTMLDivElement>();
  let renderer: WebGLRenderer | null = null;
  let rafId = 0;
  const targetMouse = new Vector2(-1000, -1000);
  const currentMouse = new Vector2(-1000, -1000);
  let targetInfluence = 0;
  let currentInfluence = 0;
  const damping = 0.05;

  const vertexShader = `
precision highp float;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

  const fragmentShader = `
precision highp float;
uniform float iTime;
uniform vec3 iResolution;
uniform float animationSpeed;
uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;
uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK = vec3(0.914, 0.278, 0.961);
const vec3 BLUE = vec3(0.184, 0.294, 0.635);

mat2 rotate(float r) { return mat2(cos(r), sin(r), -sin(r), cos(r)); }

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);
  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;
  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) return baseColor;
  if (lineGradientCount == 1) return lineGradient[0];
  float clampedT = clamp(t, 0.0, 0.9999);
  float scaled = clampedT * float(lineGradientCount - 1);
  int idx = int(floor(scaled));
  float f = fract(scaled);
  int idx2 = min(idx + 1, lineGradientCount - 1);
  return mix(lineGradient[idx], lineGradient[idx2], f) * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;
  float x_movement = time * 0.1;
  float amp = sin(offset + time * 0.2) * 0.3;
  float y = sin(uv.x + offset + x_movement) * amp;
  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    y += (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
  }
  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void main() {
  vec2 baseUv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  vec3 col = vec3(0.0);
  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);
  vec2 mouseUv = interactive ? (2.0 * iMouse - iResolution.xy) / iResolution.y * vec2(1.0, -1.0) : vec2(0.0);

  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float t = fi / 5.0;
    vec3 lineCol = getLineColor(t, b);
    float angle = -1.0 * log(length(baseUv) + 1.0);
    vec2 ruv = baseUv * rotate(angle);
    col += lineCol * wave(ruv + vec2(0.05 * fi + 2.0, -0.7), 1.5 + 0.2 * fi, baseUv, mouseUv, interactive) * 0.2;
  }

  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float t = fi / 5.0;
    vec3 lineCol = getLineColor(t, b);
    float angle = 0.2 * log(length(baseUv) + 1.0);
    vec2 ruv = baseUv * rotate(angle);
    col += lineCol * wave(ruv + vec2(0.05 * fi + 5.0, 0.0), 2.0 + 0.15 * fi, baseUv, mouseUv, interactive);
  }

  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float t = fi / 5.0;
    vec3 lineCol = getLineColor(t, b);
    float angle = -0.4 * log(length(baseUv) + 1.0);
    vec2 ruv = baseUv * rotate(angle);
    ruv.x *= -1.0;
    col += lineCol * wave(ruv + vec2(0.05 * fi + 10.0, 0.5), 1.0 + 0.2 * fi, baseUv, mouseUv, interactive) * 0.1;
  }

  gl_FragColor = vec4(col, 1.0);
}`;

  function resize() {
    if (!containerRef.value || !renderer) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    renderer.setSize(w, h, false);
  }

  useResizeObserver(containerRef, resize);

  function onPointerMove(e: PointerEvent) {
    if (!renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const dpr = renderer.getPixelRatio();
    targetMouse.set(
      (e.clientX - rect.left) * dpr,
      (rect.height - (e.clientY - rect.top)) * dpr,
    );
    targetInfluence = 1.0;
  }

  function onPointerLeave() {
    targetInfluence = 0.0;
  }

  useEventListener(containerRef, 'pointermove', onPointerMove);
  useEventListener(containerRef, 'pointerleave', onPointerLeave);

  onMounted(() => {
    if (!containerRef.value) return;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    containerRef.value.appendChild(renderer.domElement);

    const gradientValues = Array.from(
      { length: 8 },
      () => new Vector3(1, 1, 1),
    );
    const stops = (props.linesGradient ?? []).slice(0, 8);
    stops.forEach((hex, i) => {
      const c = hexToVec3(hex);
      gradientValues[i].set(c.x, c.y, c.z);
    });

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3(1, 1, 1) },
      animationSpeed: { value: props.animationSpeed },
      iMouse: { value: new Vector2(-1000, -1000) },
      interactive: { value: props.interactive },
      bendRadius: { value: props.bendRadius },
      bendStrength: { value: props.bendStrength },
      bendInfluence: { value: 0 },
      lineGradient: { value: gradientValues },
      lineGradientCount: { value: stops.length },
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });
    const geometry = new PlaneGeometry(2, 2);
    scene.add(new Mesh(geometry, material));

    const timer = new Timer();
    resize();

    function update() {
      timer.update();
      uniforms.iTime.value = timer.getElapsed();
      if (props.interactive) {
        currentMouse.lerp(targetMouse, damping);
        uniforms.iMouse.value.copy(currentMouse);
        currentInfluence += (targetInfluence - currentInfluence) * damping;
        uniforms.bendInfluence.value = currentInfluence;
      }
      const w = renderer!.domElement.width;
      const h = renderer!.domElement.height;
      uniforms.iResolution.value.set(w, h, 1);
      renderer!.render(scene, camera);
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
  <div
    ref="containerRef"
    :class="cn('size-full', $props.class)"
    style="mix-blend-mode: screen"
  ></div>
</template>
