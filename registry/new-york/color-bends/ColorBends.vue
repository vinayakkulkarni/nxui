<script setup lang="ts">
  import { onBeforeUnmount, onMounted, shallowRef } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    Mesh,
    OrthographicCamera,
    PlaneGeometry,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    Timer,
    Vector2,
    Vector3,
    WebGLRenderer,
  } from 'three';
  import { cn } from '~/lib/utils';
  import {
    COLOR_BENDS_FRAGMENT,
    COLOR_BENDS_VERTEX,
    MAX_COLORS,
  } from './color-bends-shaders';
  import type { ColorBendsProps } from './types';

  const props = withDefaults(defineProps<ColorBendsProps>(), {
    rotation: 90,
    speed: 0.2,
    colors: () => [],
    transparent: true,
    autoRotate: 0,
    scale: 1,
    frequency: 1,
    warpStrength: 1,
    mouseInfluence: 1,
    parallax: 0.5,
    noise: 0.15,
    iterations: 1,
    intensity: 1.5,
    bandWidth: 6,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const pointerTarget = new Vector2(0, 0);
  const pointerCurrent = new Vector2(0, 0);
  const colorVectors = Array.from(
    { length: MAX_COLORS },
    () => new Vector3(0, 0, 0),
  );

  const uniforms = {
    uCanvas: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uSpeed: { value: props.speed },
    uRot: { value: new Vector2(1, 0) },
    uColorCount: { value: 0 },
    uColors: { value: colorVectors },
    uTransparent: { value: props.transparent ? 1 : 0 },
    uScale: { value: props.scale },
    uFrequency: { value: props.frequency },
    uWarpStrength: { value: props.warpStrength },
    uPointer: { value: new Vector2(0, 0) },
    uMouseInfluence: { value: props.mouseInfluence },
    uParallax: { value: props.parallax },
    uNoise: { value: props.noise },
    uIterations: { value: props.iterations },
    uIntensity: { value: props.intensity },
    uBandWidth: { value: props.bandWidth },
  };

  let renderer: WebGLRenderer | null = null;
  let material: ShaderMaterial | null = null;
  let geometry: PlaneGeometry | null = null;
  let scene: Scene | null = null;
  let camera: OrthographicCamera | null = null;
  let timer: Timer | null = null;
  let rafId = 0;
  let visible = true;
  let elapsed = 0;

  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '').trim();
    const full =
      h.length === 3
        ? `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
        : h.slice(0, 6);
    const channel = (index: number) =>
      (Number.parseInt(full.slice(index, index + 2), 16) || 0) / 255;
    return [channel(0), channel(2), channel(4)];
  }

  function syncUniforms() {
    if (!material || !renderer) return;
    const u = uniforms;
    u.uSpeed.value = props.speed;
    u.uScale.value = props.scale;
    u.uFrequency.value = props.frequency;
    u.uWarpStrength.value = props.warpStrength;
    u.uMouseInfluence.value = props.mouseInfluence;
    u.uParallax.value = props.parallax;
    u.uNoise.value = props.noise;
    u.uIterations.value = props.iterations;
    u.uIntensity.value = props.intensity;
    u.uBandWidth.value = props.bandWidth;
    u.uTransparent.value = props.transparent ? 1 : 0;
    renderer.setClearColor(0x000000, props.transparent ? 0 : 1);

    const list = (props.colors ?? []).filter(Boolean).slice(0, MAX_COLORS);
    colorVectors.forEach((vector, index) => {
      const hex = list[index];
      if (hex) vector.set(...hexToRgb(hex));
      else vector.set(0, 0, 0);
    });
    u.uColorCount.value = list.length;

    const deg = (props.rotation % 360) + props.autoRotate * elapsed;
    const rad = (deg * Math.PI) / 180;
    u.uRot.value.set(Math.cos(rad), Math.sin(rad));
  }

  function resize() {
    const container = containerRef.value;
    if (!container || !renderer || !material) return;
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    uniforms.uCanvas.value.set(w, h);
    if (!rafId) draw();
  }

  function draw() {
    if (!renderer || !scene || !camera) return;
    syncUniforms();
    renderer.render(scene, camera);
  }

  function loop(now: number) {
    rafId = 0;
    if (!renderer || !material || !timer || !visible) return;
    timer.update(now);
    const dt = timer.getDelta();
    if (reducedMotion.value !== 'reduce') elapsed += dt;
    uniforms.uTime.value = elapsed;
    pointerCurrent.lerp(pointerTarget, Math.min(1, dt * 8));
    uniforms.uPointer.value.copy(pointerCurrent);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (!rafId && visible && renderer) rafId = requestAnimationFrame(loop);
  }

  function onPointerMove(event: PointerEvent) {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    pointerTarget.set(
      ((event.clientX - rect.left) / (rect.width || 1)) * 2 - 1,
      -(((event.clientY - rect.top) / (rect.height || 1)) * 2 - 1),
    );
  }

  useEventListener(containerRef, 'pointermove', onPointerMove);
  useResizeObserver(containerRef, resize);
  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      timer?.reset();
      start();
    }
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;
    scene = new Scene();
    camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    geometry = new PlaneGeometry(2, 2);
    material = new ShaderMaterial({
      vertexShader: COLOR_BENDS_VERTEX,
      fragmentShader: COLOR_BENDS_FRAGMENT,
      uniforms,
      premultipliedAlpha: true,
      transparent: true,
    });
    scene.add(new Mesh(geometry, material));

    renderer = new WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    timer = new Timer();
    resize();
    start();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    rafId = 0;
    geometry?.dispose();
    material?.dispose();
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
    renderer = null;
    material = null;
    geometry = null;
    scene = null;
    camera = null;
    timer = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  />
</template>
