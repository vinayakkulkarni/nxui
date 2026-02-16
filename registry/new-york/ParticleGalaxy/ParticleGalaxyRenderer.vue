<script setup lang="ts">
  import { useResizeObserver } from '@vueuse/core';
  import * as THREE from 'three';
  import type { ParticleGalaxyBlendMode } from '~/types/components';
  import { createGalaxyParticles } from './createGalaxyParticles';
  import { useGalaxyInteractions } from './useGalaxyInteractions';

  const props = withDefaults(
    defineProps<{
      particleCount?: number;
      particleSize?: number;
      rotationSpeed?: number;
      spiralArms?: number;
      colors?: [string, string, string];
      mouseInfluence?: number;
      autoRotate?: boolean;
      blendMode?: ParticleGalaxyBlendMode;
      spread?: number;
      density?: number;
      glow?: number;
      cameraMovement?: boolean;
      centerConcentration?: number;
      pulsate?: boolean;
      pulsateSpeed?: number;
      enableZoom?: boolean;
      enableDrag?: boolean;
      enableTouch?: boolean;
      damping?: number;
      minZoom?: number;
      maxZoom?: number;
    }>(),
    {
      particleCount: 10000,
      particleSize: 0.02,
      rotationSpeed: 0.001,
      spiralArms: 3,
      colors: () => ['#4f46e5', '#8b5cf6', '#ec4899'] as [string, string, string],
      mouseInfluence: 0.5,
      autoRotate: true,
      blendMode: 'additive',
      spread: 2.5,
      density: 0.7,
      glow: 60,
      cameraMovement: true,
      centerConcentration: 0.5,
      pulsate: true,
      pulsateSpeed: 1,
      enableZoom: true,
      enableDrag: true,
      enableTouch: true,
      damping: 0.1,
      minZoom: 1.5,
      maxZoom: 10,
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let particles: THREE.Points | null = null;
  let geometry: THREE.BufferGeometry | null = null;
  let material: THREE.ShaderMaterial | null = null;
  let frameId: number | undefined;
  let cleanupInteractions: (() => void) | null = null;

  const state = {
    mouse: { x: 0, y: 0 },
    isDragging: false,
    previousMouse: { x: 0, y: 0 },
    targetRotation: { x: 0, y: 0 },
    currentRotation: { x: 0, y: 0 },
    currentTilt: { x: 0, y: 0 },
    targetZoom: 3,
    currentZoom: 3,
  };

  function initParticles() {
    if (!scene) return;
    const result = createGalaxyParticles(props);
    geometry = result.geometry;
    material = result.material;
    particles = result.points;
    scene.add(particles);
  }

  function animate() {
    const clock = new THREE.Clock();
    const loop = () => {
      const elapsed = clock.getElapsedTime();
      if (material) material.uniforms.uTime.value = elapsed;
      if (particles) {
        state.currentRotation.x += (state.targetRotation.x - state.currentRotation.x) * props.damping;
        state.currentRotation.y += (state.targetRotation.y - state.currentRotation.y) * props.damping;
        if (props.autoRotate && !state.isDragging) state.targetRotation.y += props.rotationSpeed;
        const td = 0.05;
        const tx = !state.isDragging && props.mouseInfluence > 0 ? state.mouse.y * props.mouseInfluence * 0.3 : 0;
        const ty = !state.isDragging && props.mouseInfluence > 0 ? state.mouse.x * props.mouseInfluence * 0.3 : 0;
        state.currentTilt.x += (tx - state.currentTilt.x) * td;
        state.currentTilt.y += (ty - state.currentTilt.y) * td;
        particles.rotation.x = state.currentRotation.x + state.currentTilt.x;
        particles.rotation.y = state.currentRotation.y + state.currentTilt.y;
      }
      if (camera) {
        state.currentZoom += (state.targetZoom - state.currentZoom) * props.damping;
        camera.position.z = state.currentZoom;
        if (props.cameraMovement && !state.isDragging) {
          camera.position.x = Math.sin(elapsed * 0.1) * 0.2;
          camera.position.y = Math.cos(elapsed * 0.15) * 0.2;
        } else if (state.isDragging) {
          camera.position.x += (0 - camera.position.x) * 0.1;
          camera.position.y += (0 - camera.position.y) * 0.1;
        }
        if (scene) camera.lookAt(scene.position);
      }
      if (renderer && scene && camera) renderer.render(scene, camera);
      frameId = requestAnimationFrame(loop);
    };
    loop();
  }

  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (!entry || !renderer || !camera) return;
    const { width, height } = entry.contentRect;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  onMounted(() => {
    if (!canvasRef.value || !containerRef.value) return;
    const { width, height } = containerRef.value.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    initParticles();
    cleanupInteractions = useGalaxyInteractions(containerRef.value, state, {
      enableDrag: props.enableDrag, enableZoom: props.enableZoom,
      enableTouch: props.enableTouch, minZoom: props.minZoom, maxZoom: props.maxZoom,
    });
    animate();
  });

  onUnmounted(() => {
    if (frameId) cancelAnimationFrame(frameId);
    cleanupInteractions?.();
    geometry?.dispose();
    material?.dispose();
    renderer?.dispose();
  });
</script>

<template>
  <div ref="containerRef" class="relative size-full">
    <canvas ref="canvasRef" class="size-full" />
  </div>
</template>
