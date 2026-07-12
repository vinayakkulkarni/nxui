<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import * as THREE from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      mode?: 'lens' | 'bar' | 'cube';
      color?: string;
      thickness?: number;
      roughness?: number;
      chromaticAberration?: number;
      anisotropy?: number;
      distortion?: number;
      distortionScale?: number;
      temporalDistortion?: number;
      ior?: number;
      class?: string;
    }>(),
    {
      mode: 'lens',
      color: '#ffffff',
      thickness: 0.2,
      roughness: 0.05,
      chromaticAberration: 0.06,
      anisotropy: 0.1,
      distortion: 0.0,
      distortionScale: 0.3,
      temporalDistortion: 0.5,
      ior: 1.5,
      class: '',
    },
  );

  const containerRef = ref<HTMLElement | null>(null);

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let glassMesh: THREE.Mesh | null = null;
  let bgScene: THREE.Scene | null = null;
  let renderTarget: THREE.WebGLRenderTarget | null = null;
  let animFrame: number | null = null;
  const timer = new THREE.Timer();
  const mouse = new THREE.Vector2(0, 0);
  const targetMouse = new THREE.Vector2(0, 0);

  const GLASS_VERT = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPosition = wp.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const GLASS_FRAG = `
    precision highp float;
    uniform sampler2D uBackground;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uIor;
    uniform float uThickness;
    uniform float uRoughness;
    uniform float uChromatic;
    uniform vec3 uColor;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(.1031, .1030, .0973));
      p3 += dot(p3, p3.yxz + 33.33);
      return fract((p3.xxy + p3.yxx) * p3.zyx);
    }

    void main() {
      vec2 screenUV = gl_FragCoord.xy / uResolution;
      vec3 normal = normalize(vNormal);

      float wave = sin(vUv.x * 10.0 + uTime * 2.0) * 0.02 + cos(vUv.y * 8.0 + uTime * 1.5) * 0.02;
      normal.xy += wave;
      normal = normalize(normal);

      float ior = uIor;
      vec3 refracted = refract(vec3(0.0, 0.0, -1.0), normal, 1.0 / ior);
      vec2 offset = refracted.xy * uThickness;

      float chrR = uChromatic;
      vec3 colR = texture2D(uBackground, screenUV + offset * (1.0 + chrR)).rgb;
      vec3 colG = texture2D(uBackground, screenUV + offset).rgb;
      vec3 colB = texture2D(uBackground, screenUV + offset * (1.0 - chrR)).rgb;
      vec3 refractedColor = vec3(colR.r, colG.g, colB.b);

      float fresnel = pow(1.0 - abs(dot(vec3(0.0, 0.0, 1.0), normal)), 3.0);
      vec3 tint = mix(vec3(1.0), uColor, 0.15);
      vec3 finalColor = refractedColor * tint + fresnel * 0.3;

      float roughNoise = (hash33(vec3(gl_FragCoord.xy * 0.5, uTime)).x - 0.5) * uRoughness * 0.1;
      finalColor += roughNoise;

      float alpha = mix(0.85, 1.0, fresnel);
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  function createGlassGeometry(): THREE.BufferGeometry {
    switch (props.mode) {
      case 'bar':
        return new THREE.BoxGeometry(6, 1, 0.5, 32, 8, 4);
      case 'cube':
        return new THREE.BoxGeometry(2, 2, 2, 16, 16, 16);
      default:
        return new THREE.SphereGeometry(1.5, 64, 64);
    }
  }

  function init() {
    const container = containerRef.value;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(15, w / h, 0.1, 100);
    camera.position.set(0, 0, 20);

    // Background scene with sample content
    bgScene = new THREE.Scene();
    bgScene.background = new THREE.Color(0x0a0a0a);
    const textGroup = new THREE.Group();
    for (let i = 0; i < 20; i++) {
      const geo = new THREE.PlaneGeometry(
        0.5 + Math.random() * 2,
        0.1 + Math.random() * 0.3,
      );
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(
          Math.random(),
          0.3,
          0.5 + Math.random() * 0.3,
        ),
        transparent: true,
        opacity: 0.6 + Math.random() * 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        0,
      );
      textGroup.add(mesh);
    }
    bgScene.add(textGroup);

    renderTarget = new THREE.WebGLRenderTarget(
      w * renderer.getPixelRatio(),
      h * renderer.getPixelRatio(),
    );

    // Glass scene
    scene = new THREE.Scene();
    const glassGeo = createGlassGeometry();
    const glassMat = new THREE.ShaderMaterial({
      vertexShader: GLASS_VERT,
      fragmentShader: GLASS_FRAG,
      transparent: true,
      uniforms: {
        uBackground: { value: renderTarget.texture },
        uResolution: {
          value: new THREE.Vector2(
            w * renderer.getPixelRatio(),
            h * renderer.getPixelRatio(),
          ),
        },
        uTime: { value: 0 },
        uIor: { value: props.ior },
        uThickness: { value: props.thickness },
        uRoughness: { value: props.roughness },
        uChromatic: { value: props.chromaticAberration },
        uColor: { value: new THREE.Color(props.color) },
      },
    });

    glassMesh = new THREE.Mesh(glassGeo, glassMat);
    scene.add(glassMesh);

    container.addEventListener('mousemove', onMouseMove);
    animate();
  }

  function onMouseMove(e: MouseEvent) {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    targetMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    targetMouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function animate() {
    animFrame = requestAnimationFrame(animate);
    if (
      !renderer ||
      !scene ||
      !camera ||
      !glassMesh ||
      !bgScene ||
      !renderTarget
    )
      return;

    timer.update();
    const t = timer.getElapsed();
    mouse.lerp(targetMouse, 0.08);

    // Render background to texture
    renderer.setRenderTarget(renderTarget);
    renderer.render(bgScene, camera);
    renderer.setRenderTarget(null);

    // Animate glass
    glassMesh.position.x = mouse.x * 3;
    glassMesh.position.y = mouse.y * 2;
    glassMesh.rotation.x = mouse.y * 0.3;
    glassMesh.rotation.y = mouse.x * 0.3 + t * 0.1;

    const mat = glassMesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = t;

    renderer.render(scene, camera);
  }

  useResizeObserver(containerRef, (entries) => {
    const { width, height } = entries[0].contentRect;
    if (!renderer || !camera || !renderTarget || width <= 0 || height <= 0)
      return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const pr = renderer.getPixelRatio();
    renderTarget.setSize(width * pr, height * pr);
    if (glassMesh) {
      const mat = glassMesh.material as THREE.ShaderMaterial;
      mat.uniforms.uResolution.value.set(width * pr, height * pr);
    }
  });

  watch(
    [
      () => props.ior,
      () => props.thickness,
      () => props.roughness,
      () => props.chromaticAberration,
      () => props.color,
    ],
    () => {
      if (!glassMesh) return;
      const mat = glassMesh.material as THREE.ShaderMaterial;
      mat.uniforms.uIor.value = props.ior;
      mat.uniforms.uThickness.value = props.thickness;
      mat.uniforms.uRoughness.value = props.roughness;
      mat.uniforms.uChromatic.value = props.chromaticAberration;
      mat.uniforms.uColor.value.set(props.color);
    },
  );

  function cleanup() {
    if (animFrame !== null) cancelAnimationFrame(animFrame);
    containerRef.value?.removeEventListener('mousemove', onMouseMove);
    if (renderer) {
      renderer.domElement.parentElement?.removeChild(renderer.domElement);
      renderer.dispose();
    }
    if (renderTarget) renderTarget.dispose();
    if (glassMesh) {
      glassMesh.geometry.dispose();
      (glassMesh.material as THREE.Material).dispose();
    }
    renderer = null;
    scene = null;
    camera = null;
    glassMesh = null;
  }

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
    :class="cn('fluid-glass-container', $props.class)"
  ></div>
</template>

<style scoped>
  .fluid-glass-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .fluid-glass-container :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
