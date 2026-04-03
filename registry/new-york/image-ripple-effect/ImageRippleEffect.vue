<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import { useResizeObserver, useRafFn } from '@vueuse/core';
  import * as THREE from 'three';
  import type { ImageRippleEffectProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const DEFAULT_BRUSH = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><radialGradient id="g"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/></svg>`)}`;

  const props = withDefaults(defineProps<ImageRippleEffectProps>(), {
    brushTextureUrl: '',
    distortionStrength: 0.075,
    waveCount: 100,
    waveSize: 60,
    waveRotationSpeed: 0.025,
    waveFadeMultiplier: 0.95,
    waveGrowth: 0.155,
    waveSpawnThreshold: 0.1,
    class: '',
  });

  const containerRef = ref<HTMLElement | null>(null);

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform sampler2D uDisplacement;
    uniform float uDistortionStrength;
    varying vec2 vUv;

    void main() {
      vec4 disp = texture2D(uDisplacement, vUv);
      float angle = disp.r * 2.0 * 3.14159265;
      vec2 distortedUv = vUv + vec2(sin(angle), cos(angle)) * disp.r * uDistortionStrength;
      gl_FragColor = texture2D(uTexture, distortedUv);
    }
  `;

  let renderer: THREE.WebGLRenderer | null = null;
  let mainScene: THREE.Scene | null = null;
  let waveScene: THREE.Scene | null = null;
  let camera: THREE.OrthographicCamera | null = null;
  let fboA: THREE.WebGLRenderTarget | null = null;
  let fboB: THREE.WebGLRenderTarget | null = null;
  let compositeMaterial: THREE.ShaderMaterial | null = null;
  let compositeMesh: THREE.Mesh | null = null;
  let compositeGeometry: THREE.PlaneGeometry | null = null;
  let brushTexture: THREE.Texture | null = null;
  let imageTexture: THREE.Texture | null = null;

  interface WaveMesh {
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    active: boolean;
    age: number;
  }

  let waves: WaveMesh[] = [];
  let waveIndex = 0;
  let lastSpawnPos = { x: -9999, y: -9999 };
  let currentImageIndex = 0;

  function initScene() {
    if (!containerRef.value) return;
    const container = containerRef.value;
    const { width, height } = container.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;

    // Renderer
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;';

    // Orthographic camera covering [0,1] range
    camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);

    // Scenes
    mainScene = new THREE.Scene();
    waveScene = new THREE.Scene();

    // FBOs
    const fboOpts: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    };
    fboA = new THREE.WebGLRenderTarget(width, height, fboOpts);
    fboB = new THREE.WebGLRenderTarget(width, height, fboOpts);

    // Brush texture
    const loader = new THREE.TextureLoader();
    const brushUrl = props.brushTextureUrl || DEFAULT_BRUSH;
    brushTexture = loader.load(brushUrl);

    // Wave mesh pool
    const waveGeo = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < props.waveCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: brushTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(waveGeo, mat);
      mesh.visible = false;
      waveScene.add(mesh);
      waves.push({ mesh, material: mat, active: false, age: 0 });
    }

    // Load image texture
    loadImage(currentImageIndex);

    // Composite quad
    compositeGeometry = new THREE.PlaneGeometry(1, 1);
    compositeMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uDisplacement: { value: null },
        uDistortionStrength: { value: props.distortionStrength },
      },
      transparent: true,
    });
    compositeMesh = new THREE.Mesh(compositeGeometry, compositeMaterial);
    compositeMesh.position.set(0.5, 0.5, 0);
    mainScene.add(compositeMesh);

    // Mouse events
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('touchmove', onTouchMove, { passive: true });
  }

  function loadImage(index: number) {
    if (!props.images.length) return;
    const safeIndex = index % props.images.length;
    const loader = new THREE.TextureLoader();
    loader.load(props.images[safeIndex]!.src, (tex) => {
      if (imageTexture) imageTexture.dispose();
      imageTexture = tex;
      imageTexture.minFilter = THREE.LinearFilter;
      imageTexture.magFilter = THREE.LinearFilter;
      if (compositeMaterial) {
        compositeMaterial.uniforms.uTexture.value = imageTexture;
      }
    });
  }

  function onMouseMove(e: MouseEvent) {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    spawnWave(x, y, rect.width, rect.height);
  }

  function onTouchMove(e: TouchEvent) {
    if (!containerRef.value || e.touches.length === 0) return;
    const rect = containerRef.value.getBoundingClientRect();
    const touch = e.touches[0]!;
    const x = (touch.clientX - rect.left) / rect.width;
    const y = 1.0 - (touch.clientY - rect.top) / rect.height;
    spawnWave(x, y, rect.width, rect.height);
  }

  function spawnWave(
    normX: number,
    normY: number,
    containerW: number,
    containerH: number,
  ) {
    const dx = normX - lastSpawnPos.x;
    const dy = normY - lastSpawnPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < props.waveSpawnThreshold) return;

    lastSpawnPos = { x: normX, y: normY };

    const wave = waves[waveIndex % props.waveCount]!;
    waveIndex++;

    const sizeX = props.waveSize / containerW;
    const sizeY = props.waveSize / containerH;

    wave.mesh.position.set(normX, normY, 0);
    wave.mesh.scale.set(sizeX, sizeY, 1);
    wave.mesh.rotation.z = Math.random() * Math.PI * 2;
    wave.material.opacity = 1.0;
    wave.mesh.visible = true;
    wave.active = true;
    wave.age = 0;
  }

  function updateWaves() {
    for (const wave of waves) {
      if (!wave.active) continue;

      wave.age++;
      wave.material.opacity *= props.waveFadeMultiplier;
      wave.mesh.scale.x += props.waveGrowth * 0.01;
      wave.mesh.scale.y += props.waveGrowth * 0.01;
      wave.mesh.rotation.z += props.waveRotationSpeed;

      if (wave.material.opacity < 0.002) {
        wave.active = false;
        wave.mesh.visible = false;
      }
    }
  }

  function renderFrame() {
    if (!renderer || !camera || !waveScene || !mainScene || !fboA || !fboB)
      return;
    if (!compositeMaterial) return;

    // Update waves
    updateWaves();

    // Render waves to fboA
    renderer.setRenderTarget(fboA);
    renderer.clear();
    renderer.render(waveScene, camera);

    // Use fboA as displacement for final composite
    compositeMaterial.uniforms.uDisplacement.value = fboA.texture;

    // Render final composite to screen
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(mainScene, camera);

    // Swap FBOs
    const temp = fboA;
    fboA = fboB;
    fboB = temp;
  }

  function handleResize(width: number, height: number) {
    if (!renderer || !fboA || !fboB) return;
    renderer.setSize(width, height);
    fboA.setSize(width, height);
    fboB.setSize(width, height);
  }

  function cleanup() {
    containerRef.value?.removeEventListener('mousemove', onMouseMove);
    containerRef.value?.removeEventListener('touchmove', onTouchMove);

    // Dispose waves
    if (waves.length > 0) {
      // All waves share same geometry — dispose once
      waves[0]!.mesh.geometry.dispose();
      for (const wave of waves) {
        wave.material.dispose();
      }
    }
    waves = [];
    waveIndex = 0;

    if (brushTexture) brushTexture.dispose();
    if (imageTexture) imageTexture.dispose();
    if (compositeMaterial) compositeMaterial.dispose();
    if (compositeGeometry) compositeGeometry.dispose();
    if (fboA) fboA.dispose();
    if (fboB) fboB.dispose();

    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
    }

    mainScene = null;
    waveScene = null;
    camera = null;
    fboA = null;
    fboB = null;
    compositeMaterial = null;
    compositeMesh = null;
    compositeGeometry = null;
    brushTexture = null;
    imageTexture = null;
    renderer = null;
  }

  const { pause, resume } = useRafFn(renderFrame, { immediate: false });

  useResizeObserver(containerRef, (entries) => {
    const { width, height } = entries[0]!.contentRect;
    if (width > 0 && height > 0) {
      handleResize(width, height);
    }
  });

  watch(
    () => props.images,
    () => {
      currentImageIndex = 0;
      loadImage(currentImageIndex);
    },
    { deep: true },
  );

  watch(
    () => props.distortionStrength,
    (val) => {
      if (compositeMaterial) {
        compositeMaterial.uniforms.uDistortionStrength.value = val;
      }
    },
  );

  onMounted(() => {
    initScene();
    resume();
  });

  onBeforeUnmount(() => {
    pause();
    cleanup();
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('image-ripple-container', $props.class)"
  ></div>
</template>

<style scoped>
  .image-ripple-container {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
</style>
