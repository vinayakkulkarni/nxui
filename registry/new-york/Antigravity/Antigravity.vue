<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import * as THREE from 'three';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      count?: number;
      magnetRadius?: number;
      ringRadius?: number;
      waveSpeed?: number;
      waveAmplitude?: number;
      particleSize?: number;
      lerpSpeed?: number;
      color?: string;
      autoAnimate?: boolean;
      particleVariance?: number;
      rotationSpeed?: number;
      depthFactor?: number;
      pulseSpeed?: number;
      particleShape?: 'capsule' | 'sphere' | 'box' | 'tetrahedron';
      fieldStrength?: number;
      class?: string;
    }>(),
    {
      count: 300,
      magnetRadius: 10,
      ringRadius: 10,
      waveSpeed: 0.4,
      waveAmplitude: 1,
      particleSize: 2,
      lerpSpeed: 0.1,
      color: '#FF9FFC',
      autoAnimate: false,
      particleVariance: 1,
      rotationSpeed: 0,
      depthFactor: 1,
      pulseSpeed: 3,
      particleShape: 'capsule',
      fieldStrength: 10,
      class: '',
    },
  );

  interface Particle {
    t: number;
    speed: number;
    mx: number;
    my: number;
    mz: number;
    cx: number;
    cy: number;
    cz: number;
    randomRadiusOffset: number;
  }

  const containerRef = ref<HTMLElement | null>(null);

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let mesh: THREE.InstancedMesh | null = null;
  let animFrame: number | null = null;
  let particles: Particle[] = [];
  const dummy = new THREE.Object3D();
  const timer = new THREE.Timer();

  const mouseNDC = { x: 0, y: 0 };
  let lastMouseMove = 0;
  const virtualMouse = { x: 0, y: 0 };

  function createGeometry(): THREE.BufferGeometry {
    switch (props.particleShape) {
      case 'sphere': return new THREE.SphereGeometry(0.2, 16, 16);
      case 'box': return new THREE.BoxGeometry(0.3, 0.3, 0.3);
      case 'tetrahedron': return new THREE.TetrahedronGeometry(0.3);
      default: return new THREE.CapsuleGeometry(0.1, 0.4, 4, 8);
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

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 1000);
    camera.position.z = 50;

    // Calculate viewport dimensions at z=0
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(vFOV / 2) * camera.position.z;
    const width = height * camera.aspect;

    const geometry = createGeometry();
    const material = new THREE.MeshBasicMaterial({ color: props.color });
    mesh = new THREE.InstancedMesh(geometry, material, props.count);
    scene.add(mesh);

    particles = [];
    for (let i = 0; i < props.count; i++) {
      const t = Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const x = (Math.random() - 0.5) * width;
      const y = (Math.random() - 0.5) * height;
      const z = (Math.random() - 0.5) * 20;
      const randomRadiusOffset = (Math.random() - 0.5) * 2;

      particles.push({
        t, speed,
        mx: x, my: y, mz: z,
        cx: x, cy: y, cz: z,
        randomRadiusOffset,
      });
    }

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    animate();
  }

  function onMouseMove(e: MouseEvent) {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    lastMouseMove = Date.now();
  }

  function onMouseLeave() {
    mouseNDC.x = 0;
    mouseNDC.y = 0;
  }

  function animate() {
    animFrame = requestAnimationFrame(animate);
    if (!renderer || !scene || !camera || !mesh) return;

    timer.update();
    const elapsed = timer.getElapsed();

    // Calculate viewport at z=0
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const vpHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
    const vpWidth = vpHeight * camera.aspect;

    let destX = (mouseNDC.x * vpWidth) / 2;
    let destY = (mouseNDC.y * vpHeight) / 2;

    if (props.autoAnimate && Date.now() - lastMouseMove > 2000) {
      destX = Math.sin(elapsed * 0.5) * (vpWidth / 4);
      destY = Math.cos(elapsed) * (vpHeight / 4);
    }

    virtualMouse.x += (destX - virtualMouse.x) * 0.05;
    virtualMouse.y += (destY - virtualMouse.y) * 0.05;

    const targetX = virtualMouse.x;
    const targetY = virtualMouse.y;
    const globalRotation = elapsed * props.rotationSpeed;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.t += p.speed / 2;

      const projectionFactor = 1 - p.cz / 50;
      const projectedTargetX = targetX * projectionFactor;
      const projectedTargetY = targetY * projectionFactor;

      const dx = p.mx - projectedTargetX;
      const dy = p.my - projectedTargetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let tpx = p.mx;
      let tpy = p.my;
      let tpz = p.mz * props.depthFactor;

      if (dist < props.magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation;
        const wave = Math.sin(p.t * props.waveSpeed + angle) * (0.5 * props.waveAmplitude);
        const deviation = p.randomRadiusOffset * (5 / (props.fieldStrength + 0.1));
        const currentRingRadius = props.ringRadius + wave + deviation;

        tpx = projectedTargetX + currentRingRadius * Math.cos(angle);
        tpy = projectedTargetY + currentRingRadius * Math.sin(angle);
        tpz = p.mz * props.depthFactor + Math.sin(p.t) * props.waveAmplitude * props.depthFactor;
      }

      p.cx += (tpx - p.cx) * props.lerpSpeed;
      p.cy += (tpy - p.cy) * props.lerpSpeed;
      p.cz += (tpz - p.cz) * props.lerpSpeed;

      dummy.position.set(p.cx, p.cy, p.cz);
      dummy.lookAt(projectedTargetX, projectedTargetY, p.cz);
      dummy.rotateX(Math.PI / 2);

      const currentDistToMouse = Math.sqrt(
        (p.cx - projectedTargetX) ** 2 + (p.cy - projectedTargetY) ** 2,
      );
      const distFromRing = Math.abs(currentDistToMouse - props.ringRadius);
      const scaleFactor = Math.max(0, Math.min(1, 1 - distFromRing / 10));
      const finalScale = scaleFactor * (0.8 + Math.sin(p.t * props.pulseSpeed) * 0.2 * props.particleVariance) * props.particleSize;
      dummy.scale.set(finalScale, finalScale, finalScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }

  useResizeObserver(containerRef, (entries) => {
    const { width, height } = entries[0].contentRect;
    if (!renderer || !camera || width <= 0 || height <= 0) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  function cleanup() {
    if (animFrame !== null) cancelAnimationFrame(animFrame);
    containerRef.value?.removeEventListener('mousemove', onMouseMove);
    containerRef.value?.removeEventListener('mouseleave', onMouseLeave);
    if (renderer) {
      renderer.domElement.parentElement?.removeChild(renderer.domElement);
      renderer.dispose();
    }
    if (mesh) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    renderer = null;
    scene = null;
    camera = null;
    mesh = null;
  }

  onMounted(() => { init(); });
  onBeforeUnmount(() => { cleanup(); });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('antigravity-container', $props.class)"
  ></div>
</template>

<style scoped>
  .antigravity-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .antigravity-container :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
