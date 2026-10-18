<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
  import { cn } from '~/lib/utils';
  import { generateNoiseTexture, hexToVec3 } from './evil-eye-noise';
  import { EVIL_EYE_FRAGMENT, EVIL_EYE_VERTEX } from './evil-eye-shaders';
  import type { EvilEyeProps } from './types';

  const props = withDefaults(defineProps<EvilEyeProps>(), {
    eyeColor: '#FF6F37',
    intensity: 1.5,
    pupilSize: 0.6,
    irisWidth: 0.25,
    glowIntensity: 0.35,
    scale: 0.8,
    noiseScale: 1,
    pupilFollow: 1,
    flameSpeed: 1,
    backgroundColor: '#000000',
    lightMode: false,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let renderer: Renderer | null = null;
  let program: Program | null = null;
  let mesh: Mesh | null = null;
  let inView = true;
  let time = 0;

  function applyProps() {
    if (!program) return;
    const u = program.uniforms;
    u.uPupilSize.value = props.pupilSize;
    u.uIrisWidth.value = props.irisWidth;
    u.uGlowIntensity.value = props.glowIntensity;
    u.uIntensity.value = props.intensity;
    u.uScale.value = props.scale;
    u.uNoiseScale.value = props.noiseScale;
    u.uPupilFollow.value = props.pupilFollow;
    u.uFlameSpeed.value = props.flameSpeed;
    u.uEyeColor.value = hexToVec3(props.eyeColor);
    u.uBgColor.value = hexToVec3(props.backgroundColor);
    u.uLightMode.value = props.lightMode;
  }

  function draw() {
    if (!renderer || !program || !mesh) return;
    program.uniforms.uMouse.value = [mouse.x, mouse.y];
    program.uniforms.uTime.value = time;
    renderer.render({ scene: mesh });
  }

  const { pause, resume } = useRafFn(
    ({ timestamp }) => {
      if (reducedMotion.value !== 'reduce') {
        time = timestamp * 0.001;
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
      }
      draw();
    },
    { immediate: false },
  );

  function sync() {
    const running =
      !!renderer &&
      inView &&
      visibility.value !== 'hidden' &&
      reducedMotion.value !== 'reduce';
    if (running) resume();
    else {
      pause();
      draw();
    }
  }

  function resize() {
    const el = containerRef.value;
    if (!renderer || !program || !el) return;
    renderer.setSize(el.clientWidth, el.clientHeight);
    const { width, height } = renderer.gl.canvas;
    program.uniforms.uResolution.value = [width, height, width / height];
    draw();
  }

  useResizeObserver(containerRef, resize);

  useIntersectionObserver(containerRef, (entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    sync();
  });

  watch([visibility, reducedMotion], sync);

  watch(
    [
      () => props.eyeColor,
      () => props.intensity,
      () => props.pupilSize,
      () => props.irisWidth,
      () => props.glowIntensity,
      () => props.scale,
      () => props.noiseScale,
      () => props.pupilFollow,
      () => props.flameSpeed,
      () => props.backgroundColor,
      () => props.lightMode,
    ],
    () => {
      applyProps();
      draw();
    },
  );

  function onMouseMove(event: MouseEvent) {
    const el = containerRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouse.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.ty = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function onMouseLeave() {
    mouse.tx = 0;
    mouse.ty = 0;
  }

  useEventListener(containerRef, 'mousemove', onMouseMove, { passive: true });
  useEventListener(containerRef, 'mouseleave', onMouseLeave);

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    renderer = new Renderer({ canvas, alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const noiseTexture = new Texture(gl, {
      image: generateNoiseTexture(256),
      width: 256,
      height: 256,
      generateMipmaps: false,
      flipY: false,
    });
    noiseTexture.minFilter = gl.LINEAR;
    noiseTexture.magFilter = gl.LINEAR;
    noiseTexture.wrapS = gl.REPEAT;
    noiseTexture.wrapT = gl.REPEAT;

    program = new Program(gl, {
      vertex: EVIL_EYE_VERTEX,
      fragment: EVIL_EYE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1, 1] },
        uNoiseTexture: { value: noiseTexture },
        uPupilSize: { value: props.pupilSize },
        uIrisWidth: { value: props.irisWidth },
        uGlowIntensity: { value: props.glowIntensity },
        uIntensity: { value: props.intensity },
        uScale: { value: props.scale },
        uNoiseScale: { value: props.noiseScale },
        uMouse: { value: [0, 0] },
        uPupilFollow: { value: props.pupilFollow },
        uFlameSpeed: { value: props.flameSpeed },
        uEyeColor: { value: hexToVec3(props.eyeColor) },
        uBgColor: { value: hexToVec3(props.backgroundColor) },
        uLightMode: { value: props.lightMode },
      },
    });
    mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    resize();
    sync();
  });

  onBeforeUnmount(() => {
    pause();
    if (renderer) {
      mesh?.geometry.remove();
      program?.remove();
      renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    renderer = null;
    program = null;
    mesh = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
