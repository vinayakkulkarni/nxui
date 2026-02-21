<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
  import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      url: string;
      width?: number | string;
      height?: number | string;
      defaultRotationX?: number;
      defaultRotationY?: number;
      defaultZoom?: number;
      minZoomDistance?: number;
      maxZoomDistance?: number;
      enableMouseParallax?: boolean;
      enableManualRotation?: boolean;
      enableHoverRotation?: boolean;
      enableManualZoom?: boolean;
      ambientIntensity?: number;
      keyLightIntensity?: number;
      fillLightIntensity?: number;
      rimLightIntensity?: number;
      autoFrame?: boolean;
      fadeIn?: boolean;
      autoRotate?: boolean;
      autoRotateSpeed?: number;
      showScreenshotButton?: boolean;
      backgroundColor?: string;
      class?: string;
    }>(),
    {
      width: 400,
      height: 400,
      defaultRotationX: -50,
      defaultRotationY: 20,
      defaultZoom: 0.5,
      minZoomDistance: 0.5,
      maxZoomDistance: 10,
      enableMouseParallax: true,
      enableManualRotation: true,
      enableHoverRotation: true,
      enableManualZoom: true,
      ambientIntensity: 0.3,
      keyLightIntensity: 1,
      fillLightIntensity: 0.5,
      rimLightIntensity: 0.8,
      autoFrame: false,
      fadeIn: false,
      autoRotate: false,
      autoRotateSpeed: 0.35,
      showScreenshotButton: true,
      backgroundColor: '',
      class: '',
    },
  );

  const emit = defineEmits<{
    loaded: [];
  }>();

  const containerRef = ref<HTMLDivElement>();
  const loadingProgress = ref(0);
  const isLoading = ref(true);
  let renderer: THREE.WebGLRenderer | undefined;
  let scene: THREE.Scene | undefined;
  let camera: THREE.PerspectiveCamera | undefined;
  let controls: OrbitControls | undefined;
  let animationId = 0;
  let outerGroup: THREE.Group | undefined;
  let innerGroup: THREE.Group | undefined;

  // Interaction state
  const ROTATE_SPEED = 0.005;
  const INERTIA = 0.925;
  const PARALLAX_MAG = 0.05;
  const PARALLAX_EASE = 0.12;
  const HOVER_MAG = (6 * Math.PI) / 180;
  const HOVER_EASE = 0.15;

  let velocity = { x: 0, y: 0 };
  let targetParallax = { x: 0, y: 0 };
  const currentParallax = { x: 0, y: 0 };
  let targetHover = { x: 0, y: 0 };
  const currentHover = { x: 0, y: 0 };
  let dragActive = false;
  let lastPointer = { x: 0, y: 0 };

  function deg2rad(d: number): number {
    return (d * Math.PI) / 180;
  }

  function getExtension(url: string): string {
    return url.split('.').pop()?.toLowerCase() || '';
  }

  async function loadModel(url: string): Promise<THREE.Object3D | null> {
    const ext = getExtension(url);
    return new Promise((resolve, reject) => {
      if (ext === 'glb' || ext === 'gltf') {
        const loader = new GLTFLoader();
        loader.load(
          url,
          (gltf) => resolve(gltf.scene.clone()),
          (progress) => {
            if (progress.total > 0) {
              loadingProgress.value = Math.round((progress.loaded / progress.total) * 100);
            }
          },
          reject,
        );
      } else if (ext === 'fbx') {
        const loader = new FBXLoader();
        loader.load(
          url,
          (fbx) => resolve(fbx.clone()),
          (progress) => {
            if (progress.total > 0) {
              loadingProgress.value = Math.round((progress.loaded / progress.total) * 100);
            }
          },
          reject,
        );
      } else if (ext === 'obj') {
        const loader = new OBJLoader();
        loader.load(
          url,
          (obj) => resolve(obj.clone()),
          (progress) => {
            if (progress.total > 0) {
              loadingProgress.value = Math.round((progress.loaded / progress.total) * 100);
            }
          },
          reject,
        );
      } else {
        reject(new Error(`Unsupported format: ${ext}`));
      }
    });
  }

  function setupModel(content: THREE.Object3D): void {
    if (!innerGroup || !outerGroup || !camera) return;

    innerGroup.add(content);
    innerGroup.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(innerGroup);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const s = 1 / (sphere.radius * 2);

    innerGroup.position.set(-sphere.center.x, -sphere.center.y, -sphere.center.z);
    innerGroup.scale.setScalar(s);

    innerGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (props.fadeIn) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = 0;
        }
      }
    });

    outerGroup.rotation.set(deg2rad(props.defaultRotationY), deg2rad(props.defaultRotationX), 0);

    if (props.autoFrame && camera.isPerspectiveCamera) {
      const fitR = sphere.radius * s;
      const d = (fitR * 1.2) / Math.sin((camera.fov * Math.PI) / 180 / 2);
      camera.position.set(0, 0, d);
      camera.near = d / 10;
      camera.far = d * 10;
      camera.updateProjectionMatrix();
    }

    if (props.fadeIn) {
      let t = 0;
      const fadeInterval = setInterval(() => {
        t += 0.05;
        const v = Math.min(t, 1);
        innerGroup?.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            mat.opacity = v;
          }
        });
        if (v >= 1) {
          clearInterval(fadeInterval);
          isLoading.value = false;
          emit('loaded');
        }
      }, 16);
    } else {
      isLoading.value = false;
      emit('loaded');
    }
  }

  function onCanvasPointerDown(e: PointerEvent): void {
    if (!props.enableManualRotation) return;
    dragActive = true;
    lastPointer = { x: e.clientX, y: e.clientY };
  }

  function onCanvasPointerMove(e: PointerEvent): void {
    if (!containerRef.value) return;

    if (dragActive && outerGroup) {
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      lastPointer = { x: e.clientX, y: e.clientY };
      outerGroup.rotation.y += dx * ROTATE_SPEED;
      outerGroup.rotation.x += dy * ROTATE_SPEED;
      velocity = { x: dx * ROTATE_SPEED, y: dy * ROTATE_SPEED };
    }

    // Parallax and hover
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    if (props.enableMouseParallax) {
      targetParallax = { x: -nx * PARALLAX_MAG, y: -ny * PARALLAX_MAG };
    }
    if (props.enableHoverRotation) {
      targetHover = { x: ny * HOVER_MAG, y: nx * HOVER_MAG };
    }
  }

  function onCanvasPointerUp(): void {
    dragActive = false;
  }

  function captureScreenshot(): void {
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'model.png';
    link.href = dataUrl;
    link.click();
  }

  function init(): void {
    if (!containerRef.value) return;
    const container = containerRef.value;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: !props.backgroundColor,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    if (props.backgroundColor) {
      renderer.setClearColor(new THREE.Color(props.backgroundColor), 1);
    }
    container.appendChild(renderer.domElement);

    // Camera
    const camZ = Math.min(Math.max(props.defaultZoom, props.minZoomDistance), props.maxZoomDistance);
    camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100);
    camera.position.set(0, 0, camZ);

    // Scene
    scene = new THREE.Scene();

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, props.ambientIntensity);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, props.keyLightIntensity);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, props.fillLightIntensity);
    fillLight.position.set(-5, 2, 5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, props.rimLightIntensity);
    rimLight.position.set(0, 4, -5);
    scene.add(rimLight);

    // Contact shadow (ground plane)
    const shadowGeom = new THREE.PlaneGeometry(10, 10);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowGeom, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.5;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Groups
    outerGroup = new THREE.Group();
    innerGroup = new THREE.Group();
    outerGroup.add(innerGroup);
    scene.add(outerGroup);

    // Zoom controls
    if (props.enableManualZoom) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableRotate = false;
      controls.enableZoom = true;
      controls.minDistance = props.minZoomDistance;
      controls.maxDistance = props.maxZoomDistance;
    }

    // Load model
    loadModel(props.url)
      .then((content) => {
        if (content) setupModel(content);
      })
      .catch((err) => {
        console.error('Failed to load model:', err);
        isLoading.value = false;
      });

    // Events
    renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown);
    window.addEventListener('pointermove', onCanvasPointerMove);
    window.addEventListener('pointerup', onCanvasPointerUp);

    // Animation loop
    function animate(): void {
      animationId = requestAnimationFrame(animate);

      if (controls) controls.update();

      // Parallax lerp
      currentParallax.x += (targetParallax.x - currentParallax.x) * PARALLAX_EASE;
      currentParallax.y += (targetParallax.y - currentParallax.y) * PARALLAX_EASE;

      // Hover lerp
      const phx = currentHover.x;
      const phy = currentHover.y;
      currentHover.x += (targetHover.x - currentHover.x) * HOVER_EASE;
      currentHover.y += (targetHover.y - currentHover.y) * HOVER_EASE;

      if (outerGroup) {
        outerGroup.rotation.x += currentHover.x - phx;
        outerGroup.rotation.y += currentHover.y - phy;

        if (props.autoRotate) {
          outerGroup.rotation.y += props.autoRotateSpeed * 0.016;
        }

        // Inertia
        outerGroup.rotation.y += velocity.x;
        outerGroup.rotation.x += velocity.y;
        velocity.x *= INERTIA;
        velocity.y *= INERTIA;
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    }

    animate();
  }

  function resize(): void {
    if (!containerRef.value || !renderer || !camera) return;
    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function dispose(): void {
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer) {
      renderer.domElement.removeEventListener('pointerdown', onCanvasPointerDown);
    }
    window.removeEventListener('pointermove', onCanvasPointerMove);
    window.removeEventListener('pointerup', onCanvasPointerUp);
    controls?.dispose();
    renderer?.dispose();
    renderer?.domElement.remove();
    scene?.clear();
    renderer = undefined;
    scene = undefined;
    camera = undefined;
    controls = undefined;
    outerGroup = undefined;
    innerGroup = undefined;
  }

  useResizeObserver(containerRef, () => resize());

  onMounted(() => init());
  onBeforeUnmount(() => dispose());
</script>

<template>
  <div
    :class="cn('relative', $props.class)"
    :style="{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      touchAction: 'pan-y pinch-zoom',
    }"
  >
    <button
      v-if="showScreenshotButton"
      class="absolute right-4 top-4 z-10 cursor-pointer rounded-lg border border-white/30 px-4 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/10"
      @click="captureScreenshot"
    >
      Screenshot
    </button>
    <div
      v-if="isLoading"
      class="absolute inset-0 z-10 flex items-center justify-center text-sm text-white/70"
    >
      {{ loadingProgress }}%
    </div>
    <div
      ref="containerRef"
      class="size-full"
      :style="{ touchAction: 'pan-y pinch-zoom' }"
    ></div>
  </div>
</template>
