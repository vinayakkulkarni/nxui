<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import * as THREE from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text?: string;
      asciiFontSize?: number;
      textFontSize?: number;
      textColor?: string;
      planeBaseHeight?: number;
      enableWaves?: boolean;
      class?: string;
    }>(),
    {
      text: 'Hello!',
      asciiFontSize: 8,
      textFontSize: 200,
      textColor: '#fdf9f3',
      planeBaseHeight: 8,
      enableWaves: true,
      class: '',
    },
  );

  const containerRef = ref<HTMLElement | null>(null);

  const vertexShader = `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uEnableWaves;
    void main() {
      vUv = uv;
      float time = uTime * 5.0;
      float waveFactor = uEnableWaves;
      vec3 transformed = position;
      transformed.x += sin(time + position.y) * 0.5 * waveFactor;
      transformed.y += cos(time + position.z) * 0.15 * waveFactor;
      transformed.z += sin(time + position.x) * waveFactor;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    uniform float uTime;
    uniform sampler2D uTexture;
    void main() {
      float time = uTime;
      vec2 pos = vUv;
      float r = texture2D(uTexture, pos + cos(time * 2.0 - time + pos.x) * 0.01).r;
      float g = texture2D(uTexture, pos + tan(time * 0.5 + pos.x - time) * 0.01).g;
      float b = texture2D(uTexture, pos - cos(time * 2.0 + time + pos.y) * 0.01).b;
      float a = texture2D(uTexture, pos).a;
      gl_FragColor = vec4(r, g, b, a);
    }
  `;

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let mesh: THREE.Mesh | null = null;
  let material: THREE.ShaderMaterial | null = null;
  let texture: THREE.CanvasTexture | null = null;
  let animFrame: number | null = null;
  let preElement: HTMLPreElement | null = null;
  let asciiCanvas: HTMLCanvasElement | null = null;
  let asciiCtx: CanvasRenderingContext2D | null = null;
  let cols = 0;
  let rows = 0;
  let mousePos = { x: 0, y: 0 };
  let centerPos = { x: 0, y: 0 };
  let hueAngle = 0;

  const charset = ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

  function mapRange(n: number, start: number, stop: number, start2: number, stop2: number) {
    return ((n - start) / (stop - start)) * (stop2 - start2) + start2;
  }

  function createTextCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const font = `600 ${props.textFontSize}px monospace`;
    ctx.font = font;
    const metrics = ctx.measureText(props.text);
    const tw = Math.ceil(metrics.width) + 20;
    const th = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + 20;
    canvas.width = tw;
    canvas.height = th;
    ctx.clearRect(0, 0, tw, th);
    ctx.fillStyle = props.textColor;
    ctx.font = font;
    const yPos = 10 + ctx.measureText(props.text).actualBoundingBoxAscent;
    ctx.fillText(props.text, 10, yPos);
    return canvas;
  }

  function init() {
    if (!containerRef.value) return;
    const container = containerRef.value;
    const { width, height } = container.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.z = 30;
    scene = new THREE.Scene();

    const textCanvas = createTextCanvas();
    texture = new THREE.CanvasTexture(textCanvas);
    texture.minFilter = THREE.NearestFilter;

    const textAspect = textCanvas.width / textCanvas.height;
    const planeW = props.planeBaseHeight * textAspect;
    const planeH = props.planeBaseHeight;

    const geometry = new THREE.PlaneGeometry(planeW, planeH, 36, 36);
    material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: texture },
        uEnableWaves: { value: props.enableWaves ? 1.0 : 0.0 },
      },
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);

    // ASCII filter setup
    const filterWrapper = document.createElement('div');
    filterWrapper.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';

    preElement = document.createElement('pre');
    filterWrapper.appendChild(preElement);

    asciiCanvas = document.createElement('canvas');
    asciiCanvas.style.display = 'none';
    asciiCtx = asciiCanvas.getContext('2d');
    filterWrapper.appendChild(asciiCanvas);

    container.appendChild(filterWrapper);

    setSize(width, height);

    centerPos = { x: width / 2, y: height / 2 };
    mousePos = { x: centerPos.x, y: centerPos.y };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('touchmove', onTouchMove);

    animate();
  }

  function setSize(w: number, h: number) {
    if (!renderer || !asciiCanvas || !asciiCtx || !preElement || !camera) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    asciiCtx.font = `${props.asciiFontSize}px monospace`;
    const charWidth = asciiCtx.measureText('A').width;
    cols = Math.floor(w / (props.asciiFontSize * (charWidth / props.asciiFontSize)));
    rows = Math.floor(h / props.asciiFontSize);
    asciiCanvas.width = cols;
    asciiCanvas.height = rows;

    preElement.style.cssText = `font-family:monospace;font-size:${props.asciiFontSize}px;margin:0;padding:0;line-height:1em;position:absolute;left:0;top:0;z-index:9;background-image:radial-gradient(circle,#ff6188 0%,#fc9867 50%,#ffd866 100%);background-attachment:fixed;-webkit-text-fill-color:transparent;-webkit-background-clip:text;mix-blend-mode:difference;user-select:none;`;

    centerPos = { x: w / 2, y: h / 2 };
  }

  function onMouseMove(e: MouseEvent) {
    mousePos = { x: e.clientX, y: e.clientY };
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length > 0) {
      const bounds = containerRef.value?.getBoundingClientRect();
      if (bounds) {
        mousePos = { x: e.touches[0].clientX - bounds.left, y: e.touches[0].clientY - bounds.top };
      }
    }
  }

  function animate() {
    animFrame = requestAnimationFrame(animate);
    render();
  }

  function render() {
    if (!renderer || !scene || !camera || !mesh || !material || !asciiCanvas || !asciiCtx || !preElement) return;

    const time = Date.now() * 0.001;
    material.uniforms.uTime.value = Math.sin(time);

    const { width, height } = containerRef.value?.getBoundingClientRect() ?? { width: 0, height: 0 };
    const mx = mapRange(mousePos.y, 0, height, 0.5, -0.5);
    const my = mapRange(mousePos.x, 0, width, -0.5, 0.5);
    mesh.rotation.x += (mx - mesh.rotation.x) * 0.05;
    mesh.rotation.y += (my - mesh.rotation.y) * 0.05;

    renderer.render(scene, camera);

    const w = asciiCanvas.width;
    const h = asciiCanvas.height;
    asciiCtx.clearRect(0, 0, w, h);
    if (w > 0 && h > 0) {
      asciiCtx.drawImage(renderer.domElement, 0, 0, w, h);
      const imgData = asciiCtx.getImageData(0, 0, w, h).data;
      let str = '';
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (x + y * w) * 4;
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];
          if (a === 0) {
            str += ' ';
            continue;
          }
          const gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255;
          let idx = Math.floor((1 - gray) * (charset.length - 1));
          idx = charset.length - idx - 1;
          str += charset[idx];
        }
        str += '\n';
      }
      preElement.textContent = str;
    }

    const dx = mousePos.x - centerPos.x;
    const dy = mousePos.y - centerPos.y;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    hueAngle += (deg - hueAngle) * 0.075;
    if (containerRef.value?.firstElementChild) {
      (containerRef.value.firstElementChild as HTMLElement).style.filter = `hue-rotate(${hueAngle.toFixed(1)}deg)`;
    }
  }

  function cleanup() {
    if (animFrame !== null) cancelAnimationFrame(animFrame);
    containerRef.value?.removeEventListener('mousemove', onMouseMove);
    containerRef.value?.removeEventListener('touchmove', onTouchMove);
    if (renderer) {
      renderer.dispose();
    }
    if (material) material.dispose();
    if (mesh?.geometry) mesh.geometry.dispose();
    if (texture) texture.dispose();
    scene = null;
    camera = null;
    renderer = null;
    mesh = null;
    material = null;
    texture = null;
  }

  useResizeObserver(containerRef, (entries) => {
    const { width, height } = entries[0].contentRect;
    if (width > 0 && height > 0) {
      setSize(width, height);
    }
  });

  onMounted(() => {
    init();
  });

  onBeforeUnmount(() => {
    cleanup();
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('ascii-text-container', $props.class)"
  ></div>
</template>

<style scoped>
  .ascii-text-container {
    position: absolute;
    inset: 0;
  }

  .ascii-text-container :deep(canvas) {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
</style>
