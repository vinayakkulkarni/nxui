<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import {
    Scene,
    OrthographicCamera,
    WebGLRenderer,
    ShaderMaterial,
    PlaneGeometry,
    Mesh,
    DataTexture,
    RGBAFormat,
    FloatType,
    LinearFilter,
    ClampToEdgeWrapping,
    TextureLoader,
    DoubleSide,
    Vector4,
  } from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      imageSrc: string;
      grid?: number;
      mouse?: number;
      strength?: number;
      relaxation?: number;
      class?: string;
    }>(),
    {
      grid: 15,
      mouse: 0.1,
      strength: 0.15,
      relaxation: 0.9,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  let renderer: WebGLRenderer | null = null;
  let scene: Scene | null = null;
  let camera: OrthographicCamera | null = null;
  let plane: Mesh | null = null;
  let material: ShaderMaterial | null = null;
  let dataTexture: DataTexture | null = null;
  let animationId = 0;

  const mouseState = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };

  const VERT = `
uniform float time;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

  const FRAG = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  vec4 offset = texture2D(uDataTexture, vUv);
  gl_FragColor = texture2D(uTexture, uv - 0.02 * offset.rg);
}`;

  function handleResize() {
    const container = containerRef.value;
    if (!container || !renderer || !camera || !plane) return;
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const aspect = width / height;
    renderer.setSize(width, height);
    plane.scale.set(aspect, 1, 1);

    const hh = 0.5;
    const hw = hh * aspect;
    camera.left = -hw;
    camera.right = hw;
    camera.top = hh;
    camera.bottom = -hh;
    camera.updateProjectionMatrix();

    if (material) {
      material.uniforms.resolution.value.set(width, height, 1, 1);
    }
  }

  useResizeObserver(containerRef, handleResize);

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    mouseState.vX = x - mouseState.prevX;
    mouseState.vY = y - mouseState.prevY;
    mouseState.x = x;
    mouseState.y = y;
    mouseState.prevX = x;
    mouseState.prevY = y;
  });

  useEventListener(containerRef, 'mouseleave', () => {
    mouseState.x = 0;
    mouseState.y = 0;
    mouseState.prevX = 0;
    mouseState.prevY = 0;
    mouseState.vX = 0;
    mouseState.vY = 0;
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    scene = new Scene();
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    camera = new OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;

    const size = props.grid;
    const data = new Float32Array(4 * size * size);
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = Math.random() * 255 - 125;
      data[i * 4 + 1] = Math.random() * 255 - 125;
    }
    dataTexture = new DataTexture(data, size, size, RGBAFormat, FloatType);
    dataTexture.needsUpdate = true;

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new Vector4() },
      uTexture: {
        value: null as InstanceType<typeof import('three').Texture> | null,
      },
      uDataTexture: { value: dataTexture },
    };

    const loader = new TextureLoader();
    loader.load(props.imageSrc, (texture) => {
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.wrapS = ClampToEdgeWrapping;
      texture.wrapT = ClampToEdgeWrapping;
      uniforms.uTexture.value = texture;
      handleResize();
    });

    material = new ShaderMaterial({
      side: DoubleSide,
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
    });

    const geometry = new PlaneGeometry(1, 1, size - 1, size - 1);
    plane = new Mesh(geometry, material);
    scene.add(plane);

    handleResize();

    function animate() {
      animationId = requestAnimationFrame(animate);
      if (!renderer || !scene || !camera || !material || !dataTexture) return;

      material.uniforms.time.value += 0.05;

      const texData = dataTexture.image.data as Float32Array;
      const relax = props.relaxation;
      for (let i = 0; i < size * size; i++) {
        texData[i * 4] *= relax;
        texData[i * 4 + 1] *= relax;
      }

      const gridMouseX = size * mouseState.x;
      const gridMouseY = size * mouseState.y;
      const maxDist = size * props.mouse;
      const maxDistSq = maxDist * maxDist;

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const distSq = (gridMouseX - i) ** 2 + (gridMouseY - j) ** 2;
          if (distSq < maxDistSq) {
            const index = 4 * (i + size * j);
            const power = Math.min(maxDist / Math.sqrt(distSq), 10);
            texData[index] += props.strength * 100 * mouseState.vX * power;
            texData[index + 1] -= props.strength * 100 * mouseState.vY * power;
          }
        }
      }

      dataTexture.needsUpdate = true;
      renderer.render(scene, camera);
    }
    animationId = requestAnimationFrame(animate);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    if (renderer) {
      renderer.dispose();
      const canvas = renderer.domElement;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
    if (material) material.dispose();
    if (dataTexture) dataTexture.dispose();
    if (plane) {
      plane.geometry.dispose();
    }
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('size-full overflow-hidden', $props.class)"
  ></div>
</template>
