<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      cardModelUrl?: string;
      lanyardTextureUrl?: string;
      position?: [number, number, number];
      gravity?: number;
      fov?: number;
      transparent?: boolean;
      segmentCount?: number;
      segmentLength?: number;
      damping?: number;
      maxSpeed?: number;
      minSpeed?: number;
      bandColor?: string;
      bandWidth?: number;
      class?: string;
    }>(),
    {
      cardModelUrl: '',
      lanyardTextureUrl: '',
      position: () => [0, 0, 30],
      gravity: -40,
      fov: 20,
      transparent: true,
      segmentCount: 4,
      segmentLength: 1,
      damping: 4,
      maxSpeed: 50,
      minSpeed: 0,
      bandColor: '#ffffff',
      bandWidth: 0.15,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  let renderer: THREE.WebGLRenderer | undefined;
  let scene: THREE.Scene | undefined;
  let camera: THREE.PerspectiveCamera | undefined;
  let animationId = 0;

  // Rope physics state
  interface RopeNode {
    position: THREE.Vector3;
    prevPosition: THREE.Vector3;
    fixed: boolean;
  }

  let ropeNodes: RopeNode[] = [];
  let cardMesh: THREE.Group | undefined;
  let bandLine: THREE.Line | undefined;
  let isDragging = false;
  const dragOffset = new THREE.Vector3();
  let isHovered = false;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function initRope(): void {
    ropeNodes = [];
    const startY = 4;
    for (let i = 0; i < props.segmentCount; i++) {
      const pos = new THREE.Vector3(i * 0.5, startY, 0);
      ropeNodes.push({
        position: pos.clone(),
        prevPosition: pos.clone(),
        fixed: i === 0,
      });
    }
    // card node at the end
    const cardPos = new THREE.Vector3(props.segmentCount * 0.5, startY, 0);
    ropeNodes.push({
      position: cardPos.clone(),
      prevPosition: cardPos.clone(),
      fixed: false,
    });
  }

  function updateRopePhysics(dt: number): void {
    const gravity = new THREE.Vector3(0, props.gravity * dt * dt, 0);
    const dampFactor = Math.max(0, 1 - props.damping * dt);

    for (const node of ropeNodes) {
      if (node.fixed) continue;
      const vel = node.position
        .clone()
        .sub(node.prevPosition)
        .multiplyScalar(dampFactor);
      node.prevPosition.copy(node.position);
      node.position.add(vel).add(gravity);
    }

    // Constraint satisfaction (multiple iterations for stability)
    const iterations = 8;
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < ropeNodes.length - 1; i++) {
        const a = ropeNodes[i];
        const b = ropeNodes[i + 1];
        const diff = b.position.clone().sub(a.position);
        const dist = diff.length();
        if (dist < 0.0001) continue;
        const error = dist - props.segmentLength;
        const correction = diff.normalize().multiplyScalar(error * 0.5);
        if (!a.fixed) a.position.add(correction);
        if (!b.fixed) b.position.sub(correction);
      }
    }
  }

  function createBand(): THREE.Line {
    const curve = new THREE.CatmullRomCurve3(
      ropeNodes.map((n) => n.position.clone()),
      false,
      'chordal',
    );
    const points = curve.getPoints(32);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(props.bandColor),
      linewidth: 1,
    });
    return new THREE.Line(geometry, material);
  }

  function updateBand(): void {
    if (!bandLine) return;
    const curve = new THREE.CatmullRomCurve3(
      ropeNodes.map((n) => n.position.clone()),
      false,
      'chordal',
    );
    const points = curve.getPoints(32);
    const positions = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = points[i].y;
      positions[i * 3 + 2] = points[i].z;
    }
    bandLine.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );
    bandLine.geometry.attributes.position.needsUpdate = true;
  }

  function createDefaultCard(): THREE.Group {
    const group = new THREE.Group();

    // Card body
    const cardGeom = new THREE.BoxGeometry(1.6, 2.25, 0.02);
    const cardMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a2e,
      roughness: 0.3,
      metalness: 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
    });
    const card = new THREE.Mesh(cardGeom, cardMat);
    group.add(card);

    // Clip
    const clipGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16);
    const clipMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.3,
      metalness: 0.9,
    });
    const clip = new THREE.Mesh(clipGeom, clipMat);
    clip.position.set(0, 1.2, 0);
    group.add(clip);

    return group;
  }

  async function loadCardModel(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          // Normalize model size
          const box = new THREE.Box3().setFromObject(model);
          const sphere = box.getBoundingSphere(new THREE.Sphere());
          const s = 1 / (sphere.radius * 2);
          model.scale.setScalar(s * 2.25);
          model.position.set(
            -sphere.center.x * s,
            -sphere.center.y * s,
            -sphere.center.z * s,
          );

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          resolve(model);
        },
        undefined,
        reject,
      );
    });
  }

  function onPointerDown(e: PointerEvent): void {
    if (!camera || !scene || !cardMesh || !containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(cardMesh.children, true);
    if (intersects.length > 0) {
      isDragging = true;
      const cardNode = ropeNodes[ropeNodes.length - 1];
      const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5).unproject(
        camera,
      );
      const dir = vec.sub(camera.position).normalize();
      const point = camera.position
        .clone()
        .add(dir.multiplyScalar(camera.position.length()));
      dragOffset.copy(point).sub(cardNode.position);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
  }

  function onPointerMove(e: PointerEvent): void {
    if (!camera || !containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDragging) {
      const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5).unproject(
        camera,
      );
      const dir = vec.sub(camera.position).normalize();
      const point = camera.position
        .clone()
        .add(dir.multiplyScalar(camera.position.length()));
      const cardNode = ropeNodes[ropeNodes.length - 1];
      cardNode.position.copy(point.sub(dragOffset));
      cardNode.prevPosition.copy(cardNode.position);
      // Wake up all nodes
      for (const node of ropeNodes) {
        if (node.fixed) continue;
        node.prevPosition.copy(node.position);
      }
    }

    // Hover detection
    if (!isDragging && cardMesh) {
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(cardMesh.children, true);
      const wasHovered = isHovered;
      isHovered = intersects.length > 0;
      if (isHovered !== wasHovered && containerRef.value) {
        containerRef.value.style.cursor = isHovered ? 'grab' : 'default';
      }
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (isDragging) {
      isDragging = false;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      if (containerRef.value) {
        containerRef.value.style.cursor = isHovered ? 'grab' : 'default';
      }
    }
  }

  function init(): void {
    if (!containerRef.value) return;
    const container = containerRef.value;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: props.transparent,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (!props.transparent) {
      renderer.setClearColor(0x000000, 1);
    }
    container.appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(props.fov, width / height, 0.1, 1000);
    camera.position.set(
      props.position[0],
      props.position[1],
      props.position[2],
    );

    // Scene
    scene = new THREE.Scene();

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, Math.PI);
    scene.add(ambient);

    const dir1 = new THREE.DirectionalLight(0xffffff, 2);
    dir1.position.set(5, 5, 5);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xffffff, 3);
    dir2.position.set(-1, -1, 1);
    scene.add(dir2);

    const dir3 = new THREE.DirectionalLight(0xffffff, 3);
    dir3.position.set(1, 1, 1);
    scene.add(dir3);

    // Initialize rope
    initRope();

    // Band line
    bandLine = createBand();
    scene.add(bandLine);

    // Card
    if (props.cardModelUrl) {
      loadCardModel(props.cardModelUrl)
        .then((model) => {
          cardMesh = model;
          scene?.add(model);
        })
        .catch(() => {
          cardMesh = createDefaultCard();
          scene?.add(cardMesh);
        });
    } else {
      cardMesh = createDefaultCard();
      scene.add(cardMesh);
    }

    // Events
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);

    // Animation loop
    let lastTime = performance.now();

    function animate(): void {
      animationId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      // Update physics
      if (!isDragging) {
        updateRopePhysics(dt);
      } else {
        // Still run constraints when dragging
        const iterations = 8;
        for (let iter = 0; iter < iterations; iter++) {
          for (let i = 0; i < ropeNodes.length - 1; i++) {
            const a = ropeNodes[i];
            const b = ropeNodes[i + 1];
            const diff = b.position.clone().sub(a.position);
            const dist = diff.length();
            if (dist < 0.0001) continue;
            const error = dist - props.segmentLength;
            const correction = diff.normalize().multiplyScalar(error * 0.5);
            if (!a.fixed) a.position.add(correction);
            if (!b.fixed) b.position.sub(correction);
          }
        }
      }

      // Update band visual
      updateBand();

      // Update card position & rotation
      if (cardMesh) {
        const cardNode = ropeNodes[ropeNodes.length - 1];
        cardMesh.position.copy(cardNode.position);
        cardMesh.position.y -= 1.2;

        // Calculate card rotation from velocity
        if (ropeNodes.length >= 2) {
          const prev = ropeNodes[ropeNodes.length - 2];
          const dir = cardNode.position.clone().sub(prev.position).normalize();
          const angle = Math.atan2(dir.x, dir.y);
          cardMesh.rotation.z = -angle * 0.3;
        }
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
    if (containerRef.value) {
      containerRef.value.removeEventListener('pointerdown', onPointerDown);
      containerRef.value.removeEventListener('pointermove', onPointerMove);
      containerRef.value.removeEventListener('pointerup', onPointerUp);
    }
    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
    }
    scene?.clear();
    renderer = undefined;
    scene = undefined;
    camera = undefined;
    cardMesh = undefined;
    bandLine = undefined;
    ropeNodes = [];
  }

  useResizeObserver(containerRef, () => resize());

  onMounted(() => init());
  onBeforeUnmount(() => dispose());
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative z-0 flex size-full items-center justify-center',
        $props.class,
      )
    "
  ></div>
</template>
