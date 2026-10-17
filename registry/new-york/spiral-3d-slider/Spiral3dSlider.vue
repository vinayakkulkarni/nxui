<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    DoubleSide,
    LinearFilter,
    Mesh,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    TextureLoader,
    WebGLRenderer,
  } from 'three';
  import type { Texture } from 'three';
  import type { Spiral3dPlane, Spiral3dSliderProps } from './types';
  import {
    SPIRAL_MIN_PLANES,
    spiralFragmentShader,
    spiralVertexShader,
    textureAspect,
    wrappedPosition,
  } from './spiral-3d-shaders';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<Spiral3dSliderProps>(), {
    radius: 235,
    verticalGap: 64,
    cardWidth: 255,
    cardAspectRatio: 1.5,
    autoRotate: true,
    autoSpeed: 0.13,
    scrollSensitivity: 0.0024,
    smoothing: 0.065,
    blurStrength: 1.65,
    bend: 0.17,
    fov: 44,
    ariaLabel: 'Spiral image gallery',
    class: '',
  });

  const stageRef = ref<HTMLElement | null>(null);
  const canvasHost = ref<HTMLElement | null>(null);
  const webglFailed = ref(false);
  const visible = ref(false);
  const reducedMotion = usePreferredReducedMotion();

  const CAMERA_Z = 10;
  let renderer: WebGLRenderer | null = null;
  let camera: PerspectiveCamera | null = null;
  let scene: Scene | null = null;
  let geometry: PlaneGeometry | null = null;
  const planes = shallowRef<Spiral3dPlane[]>([]);
  let textures = new Map<string, Texture>();
  let loadToken = 0;

  let targetProgress = 0;
  let progress = 0;
  let previousScroll = 0;
  let lastWheelTime = 0;
  let lastInteraction = 0;

  let stageWidth = 1;
  let stageHeight = 1;

  function viewportSize() {
    const width = stageWidth;
    const height = stageHeight;
    const worldHeight =
      2 * Math.tan((props.fov * Math.PI) / 180 / 2) * CAMERA_Z;
    const worldWidth = worldHeight * (width / Math.max(height, 1));
    return { worldWidth, worldHeight, factor: width / worldWidth };
  }

  function disposePlanes() {
    for (const plane of planes.value) {
      scene?.remove(plane);
      plane.material.dispose();
    }
    planes.value = [];
  }

  function disposeTextures() {
    for (const texture of textures.values()) texture.dispose();
    textures = new Map();
  }

  async function buildPlanes() {
    const token = ++loadToken;
    const items = props.items;
    if (!renderer || !scene || !geometry || !items.length) {
      disposePlanes();
      return;
    }
    const loader = new TextureLoader();
    const next = new Map<string, Texture>();
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    await Promise.all(
      [...new Set(items.map((item) => item.src))].map(async (src) => {
        const texture = textures.get(src) ?? (await loader.loadAsync(src));
        texture.colorSpace = SRGBColorSpace;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.anisotropy = anisotropy;
        texture.needsUpdate = true;
        next.set(src, texture);
      }),
    ).catch(() => undefined);
    if (token !== loadToken || !scene || !geometry) {
      for (const [src, texture] of next)
        if (!textures.has(src)) texture.dispose();
      return;
    }
    for (const [src, texture] of textures)
      if (!next.has(src)) texture.dispose();
    textures = next;
    disposePlanes();
    const count = Math.max(items.length, SPIRAL_MIN_PLANES);
    const built: Spiral3dPlane[] = [];
    for (let index = 0; index < count; index++) {
      const texture = textures.get(items[index % items.length]!.src);
      if (!texture) continue;
      const material = new ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
          uImageAspect: { value: textureAspect(texture) },
          uPlaneAspect: { value: props.cardAspectRatio },
          uBlur: { value: 0 },
          uBend: { value: 0 },
        },
        vertexShader: spiralVertexShader,
        fragmentShader: spiralFragmentShader,
        side: DoubleSide,
        depthTest: true,
        depthWrite: true,
      });
      const mesh = new Mesh(geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);
      built.push(mesh);
    }
    planes.value = built;
  }

  function resize() {
    const host = canvasHost.value;
    if (!renderer || !camera || !host) return;
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width <= 0 || height <= 0) return;
    stageWidth = width;
    stageHeight = height;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function frame({ delta }: { delta: number }) {
    if (!renderer || !camera || !scene) return;
    const seconds = Math.min(delta / 1000, 0.25);
    const reduce = reducedMotion.value === 'reduce';
    if (
      props.autoRotate &&
      !reduce &&
      performance.now() - lastInteraction > 450
    ) {
      targetProgress += props.autoSpeed * Math.min(seconds, 0.05);
    }
    const frameScale = Math.min(seconds * 60, 3);
    const ease = reduce ? 1 : 1 - Math.pow(1 - props.smoothing, frameScale);
    progress += (targetProgress - progress) * ease;

    const { worldWidth, worldHeight, factor: rawFactor } = viewportSize();
    const factor = Math.max(rawFactor, 1);
    const planeWidth = Math.min(props.cardWidth / factor, worldWidth * 0.225);
    const planeHeight = planeWidth / props.cardAspectRatio;
    const spiralRadius = Math.min(props.radius / factor, worldWidth * 0.245);
    const gap = Math.min(props.verticalGap / factor, worldHeight * 0.082);
    const count = planes.value.length;

    planes.value.forEach((mesh, index) => {
      const position = wrappedPosition(index - progress, count);
      const angle = position * 0.78;
      const depth = (Math.cos(angle) + 1) / 2;
      const distance = Math.min(Math.abs(position) / (count * 0.43), 1);
      const scale = 0.74 + depth * 0.26;
      mesh.position.set(
        Math.sin(angle) * spiralRadius,
        -position * gap,
        Math.cos(angle) * 2.55,
      );
      mesh.rotation.set(0, Math.sin(angle) * -1.12, 0);
      mesh.scale.set(planeWidth * scale, planeHeight * scale, 1);
      const uniforms = mesh.material.uniforms;
      uniforms.uBlur!.value = Math.pow(distance, 1.28) * props.blurStrength;
      uniforms.uBend!.value = planeWidth * props.bend;
      uniforms.uPlaneAspect!.value = props.cardAspectRatio;
    });
    renderer.render(scene, camera);
  }

  const { pause, resume } = useRafFn(frame, { immediate: false });

  function handleWheel(event: WheelEvent) {
    lastWheelTime = performance.now();
    lastInteraction = lastWheelTime;
    const delta =
      Math.sign(event.deltaY) * Math.min(Math.abs(event.deltaY), 160);
    targetProgress += delta * props.scrollSensitivity;
  }

  function handlePageScroll() {
    const scrollY = window.scrollY;
    const delta = scrollY - previousScroll;
    previousScroll = scrollY;
    if (visible.value && performance.now() - lastWheelTime > 80) {
      lastInteraction = performance.now();
      const bounded = Math.sign(delta) * Math.min(Math.abs(delta), 160);
      targetProgress += bounded * props.scrollSensitivity;
    }
  }

  useEventListener('scroll', handlePageScroll, { passive: true });
  useResizeObserver(canvasHost, resize);
  useIntersectionObserver(
    stageRef,
    (entries) => {
      visible.value = Boolean(entries[0]?.isIntersecting);
    },
    { threshold: 0.08 },
  );

  watch(visible, (isVisible) => {
    if (isVisible && renderer) resume();
    else pause();
  });

  watch(
    () => props.items,
    () => {
      void buildPlanes();
    },
    { deep: true },
  );

  watch(
    () => props.fov,
    (fov) => {
      if (!camera) return;
      camera.fov = fov;
      camera.updateProjectionMatrix();
    },
  );

  onMounted(() => {
    const host = canvasHost.value;
    if (!host) return;
    previousScroll = window.scrollY;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      webglFailed.value = true;
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;';
    host.appendChild(renderer.domElement);
    camera = new PerspectiveCamera(props.fov, 1, 0.1, 100);
    camera.position.set(0, 0, CAMERA_Z);
    scene = new Scene();
    geometry = new PlaneGeometry(1, 1, 48, 2);
    resize();
    void buildPlanes();
    if (visible.value) resume();
  });

  onBeforeUnmount(() => {
    pause();
    loadToken++;
    disposePlanes();
    disposeTextures();
    geometry?.dispose();
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
    renderer = null;
    camera = null;
    scene = null;
    geometry = null;
  });
</script>

<template>
  <div
    v-if="items.length"
    ref="stageRef"
    role="region"
    :aria-label="ariaLabel"
    :class="
      cn(
        'relative min-h-168 w-full overflow-hidden bg-white transition-colors duration-300 dark:bg-black',
        props.class,
      )
    "
    @wheel.passive="handleWheel"
  >
    <div ref="canvasHost" class="absolute inset-0" />
    <div
      v-if="webglFailed"
      class="absolute inset-0 flex size-full items-center justify-center bg-linear-to-br from-zinc-950 via-slate-900 to-zinc-900 px-4 text-center text-sm text-white/75"
      role="status"
      aria-live="polite"
    >
      <p>Interactive WebGL content is unavailable on this device/browser.</p>
    </div>
    <div class="sr-only">
      <p>{{ ariaLabel }}</p>
      <ul>
        <li v-for="(item, index) in items" :key="`${item.src}-${index}`">
          {{ item.alt }}
        </li>
      </ul>
    </div>
  </div>
</template>
