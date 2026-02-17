<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import {
    Clock,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    SRGBColorSpace,
    MathUtils,
    Vector2,
    Vector3,
    MeshPhysicalMaterial,
    ShaderChunk,
    Color,
    Object3D,
    InstancedMesh,
    PMREMGenerator,
    SphereGeometry,
    AmbientLight,
    PointLight,
    ACESFilmicToneMapping,
    Raycaster,
    Plane,
  } from 'three';
  import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      count?: number;
      colors?: number[];
      followCursor?: boolean;
      ambientColor?: number;
      ambientIntensity?: number;
      lightIntensity?: number;
      minSize?: number;
      maxSize?: number;
      size0?: number;
      gravity?: number;
      friction?: number;
      wallBounce?: number;
      maxVelocity?: number;
      metalness?: number;
      roughness?: number;
      clearcoat?: number;
      clearcoatRoughness?: number;
      class?: string;
    }>(),
    {
      count: 200,
      colors: () => [0x000000],
      followCursor: true,
      ambientColor: 0xffffff,
      ambientIntensity: 1,
      lightIntensity: 200,
      minSize: 0.5,
      maxSize: 1,
      size0: 1,
      gravity: 0.5,
      friction: 0.9975,
      wallBounce: 0.95,
      maxVelocity: 0.15,
      metalness: 0.5,
      roughness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
      class: '',
    },
  );

  const containerRef = ref<HTMLCanvasElement>();

  let rendererRef: WebGLRenderer | null = null;
  let sceneRef: Scene | null = null;
  let cameraRef: PerspectiveCamera | null = null;
  let clockRef: Clock | null = null;
  let animationId = 0;
  let isVisible = true;
  let isRunning = false;
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  // Physics state
  let positionData: Float32Array;
  let velocityData: Float32Array;
  let sizeData: Float32Array;
  const center = new Vector3();
  let controlSphere0 = false;

  // Instanced mesh
  let sphereMesh: InstancedMesh | null = null;
  let pointLight: PointLight | null = null;
  const dummy = new Object3D();

  // Pointer state
  const pointerPos = new Vector2();
  const pointerNPos = new Vector2();
  const raycaster = new Raycaster();
  const planeHelper = new Plane(new Vector3(0, 0, 1), 0);
  const intersectPoint = new Vector3();

  // Size tracking
  const sizeInfo = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0 };

  const { randFloat, randFloatSpread } = MathUtils;

  // Temp vectors
  const tmpA = new Vector3();
  const tmpB = new Vector3();
  const tmpC = new Vector3();
  const tmpD = new Vector3();
  const tmpE = new Vector3();
  const tmpF = new Vector3();
  const tmpG = new Vector3();
  const tmpH = new Vector3();
  const tmpI = new Vector3();

  function initPhysics() {
    positionData = new Float32Array(3 * props.count).fill(0);
    velocityData = new Float32Array(3 * props.count).fill(0);
    sizeData = new Float32Array(props.count).fill(1);

    center.set(0, 0, 0);
    center.toArray(positionData, 0);

    for (let i = 1; i < props.count; i++) {
      const base = 3 * i;
      positionData[base] = randFloatSpread((2 * sizeInfo.wWidth) / 2);
      positionData[base + 1] = randFloatSpread((2 * sizeInfo.wHeight) / 2);
      positionData[base + 2] = randFloatSpread(2 * 2);
    }

    sizeData[0] = props.size0;
    for (let i = 1; i < props.count; i++) {
      sizeData[i] = randFloat(props.minSize, props.maxSize);
    }
  }

  function updatePhysics(delta: number) {
    const maxX = sizeInfo.wWidth / 2;
    const maxY = sizeInfo.wHeight / 2;
    const maxZ = 2;
    let startIdx = 0;

    if (controlSphere0) {
      startIdx = 1;
      tmpA.fromArray(positionData, 0);
      tmpA.lerp(center, 0.1).toArray(positionData, 0);
      velocityData[0] = 0;
      velocityData[1] = 0;
      velocityData[2] = 0;
    }

    // Apply gravity and friction
    for (let i = startIdx; i < props.count; i++) {
      const base = 3 * i;
      tmpB.fromArray(velocityData, base);
      tmpB.y -= delta * props.gravity * sizeData[i];
      tmpB.multiplyScalar(props.friction);
      tmpB.clampLength(0, props.maxVelocity);

      tmpA.fromArray(positionData, base);
      tmpA.add(tmpB);
      tmpA.toArray(positionData, base);
      tmpB.toArray(velocityData, base);
    }

    // Collision detection
    for (let i = startIdx; i < props.count; i++) {
      const base = 3 * i;
      tmpA.fromArray(positionData, base);
      tmpB.fromArray(velocityData, base);
      const radius = sizeData[i];

      for (let j = i + 1; j < props.count; j++) {
        const otherBase = 3 * j;
        tmpC.fromArray(positionData, otherBase);
        tmpD.fromArray(velocityData, otherBase);
        const otherRadius = sizeData[j];

        tmpE.copy(tmpC).sub(tmpA);
        const dist = tmpE.length();
        const sumRadius = radius + otherRadius;

        if (dist < sumRadius) {
          const overlap = sumRadius - dist;
          tmpF
            .copy(tmpE)
            .normalize()
            .multiplyScalar(0.5 * overlap);
          tmpG.copy(tmpF).multiplyScalar(Math.max(tmpB.length(), 1));
          tmpH.copy(tmpF).multiplyScalar(Math.max(tmpD.length(), 1));

          tmpA.sub(tmpF);
          tmpB.sub(tmpG);
          tmpA.toArray(positionData, base);
          tmpB.toArray(velocityData, base);

          tmpC.add(tmpF);
          tmpD.add(tmpH);
          tmpC.toArray(positionData, otherBase);
          tmpD.toArray(velocityData, otherBase);
        }
      }

      // Sphere 0 collision
      if (controlSphere0) {
        tmpI.fromArray(positionData, 0);
        tmpE.copy(tmpI).sub(tmpA);
        const dist = tmpE.length();
        const sumR = radius + sizeData[0];
        if (dist < sumR) {
          const diff = sumR - dist;
          tmpF.copy(tmpE.normalize()).multiplyScalar(diff);
          tmpG.copy(tmpF).multiplyScalar(Math.max(tmpB.length(), 2));
          tmpA.sub(tmpF);
          tmpB.sub(tmpG);
        }
      }

      // Wall bounds
      if (Math.abs(tmpA.x) + radius > maxX) {
        tmpA.x = Math.sign(tmpA.x) * (maxX - radius);
        tmpB.x = -tmpB.x * props.wallBounce;
      }
      if (props.gravity === 0) {
        if (Math.abs(tmpA.y) + radius > maxY) {
          tmpA.y = Math.sign(tmpA.y) * (maxY - radius);
          tmpB.y = -tmpB.y * props.wallBounce;
        }
      } else if (tmpA.y - radius < -maxY) {
        tmpA.y = -maxY + radius;
        tmpB.y = -tmpB.y * props.wallBounce;
      }
      const maxBound = Math.max(maxZ, props.maxSize);
      if (Math.abs(tmpA.z) + radius > maxBound) {
        tmpA.z = Math.sign(tmpA.z) * (maxZ - radius);
        tmpB.z = -tmpB.z * props.wallBounce;
      }

      tmpA.toArray(positionData, base);
      tmpB.toArray(velocityData, base);
    }
  }

  function updateMesh() {
    if (!sphereMesh || !pointLight) return;

    for (let i = 0; i < props.count; i++) {
      dummy.position.fromArray(positionData, 3 * i);
      if (i === 0 && !props.followCursor) {
        dummy.scale.setScalar(0);
      } else {
        dummy.scale.setScalar(sizeData[i]);
      }
      dummy.updateMatrix();
      sphereMesh.setMatrixAt(i, dummy.matrix);
      if (i === 0) pointLight.position.copy(dummy.position);
    }
    sphereMesh.instanceMatrix.needsUpdate = true;
  }

  function updateWorldSize() {
    if (!cameraRef) return;
    const fov = (cameraRef.fov * Math.PI) / 180;
    sizeInfo.wHeight = 2 * Math.tan(fov / 2) * cameraRef.position.length();
    sizeInfo.wWidth = sizeInfo.wHeight * cameraRef.aspect;
  }

  function handleResize() {
    const canvas = containerRef.value;
    if (!canvas || !rendererRef || !cameraRef) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.offsetWidth;
    const height = parent.offsetHeight;
    sizeInfo.width = width;
    sizeInfo.height = height;
    sizeInfo.ratio = width / height;

    cameraRef.aspect = width / height;
    // Limit max aspect to prevent extreme field of view
    const cameraMaxAspect = 1.5;
    if (cameraRef.aspect > cameraMaxAspect) {
      const origFov = 50;
      const t =
        Math.tan(MathUtils.degToRad(origFov / 2)) /
        (cameraRef.aspect / cameraMaxAspect);
      cameraRef.fov = 2 * MathUtils.radToDeg(Math.atan(t));
    } else {
      cameraRef.fov = 50;
    }
    cameraRef.updateProjectionMatrix();
    updateWorldSize();
    rendererRef.setSize(width, height);
  }

  useEventListener(containerRef, 'pointermove', (e: PointerEvent) => {
    const canvas = containerRef.value;
    if (!canvas || !cameraRef) return;
    const rect = canvas.getBoundingClientRect();
    pointerPos.set(e.clientX - rect.left, e.clientY - rect.top);
    pointerNPos.set(
      (pointerPos.x / rect.width) * 2 - 1,
      -(pointerPos.y / rect.height) * 2 + 1,
    );
    pointerHover = true;

    raycaster.setFromCamera(pointerNPos, cameraRef);
    cameraRef.getWorldDirection(planeHelper.normal);
    raycaster.ray.intersectPlane(planeHelper, intersectPoint);
    center.copy(intersectPoint);
    controlSphere0 = true;
  });

  useEventListener(containerRef, 'pointerleave', () => {
    pointerHover = false;
    controlSphere0 = false;
  });

  onMounted(() => {
    const canvas = containerRef.value;
    if (!canvas) return;

    // Setup renderer
    rendererRef = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    rendererRef.outputColorSpace = SRGBColorSpace;
    rendererRef.toneMapping = ACESFilmicToneMapping;

    // Setup camera
    cameraRef = new PerspectiveCamera(50, 1, 0.1, 100);
    cameraRef.position.set(0, 0, 20);
    cameraRef.lookAt(0, 0, 0);

    // Setup scene
    sceneRef = new Scene();

    // Initial resize to get world size
    handleResize();

    // Init physics
    initPhysics();

    // Create environment map
    const pmrem = new PMREMGenerator(rendererRef);
    pmrem.compileEquirectangularShader();
    const roomScene = new RoomEnvironment();
    const envMap = pmrem.fromScene(roomScene, 0.04).texture;

    // Create SSS material
    const mat = new MeshPhysicalMaterial({
      envMap,
      metalness: props.metalness,
      roughness: props.roughness,
      clearcoat: props.clearcoat,
      clearcoatRoughness: props.clearcoatRoughness,
    });
    mat.envMapRotation.x = -Math.PI / 2;

    // Add subsurface scattering via onBeforeCompile
    const sssUniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 },
    };
    mat.defines = { ...mat.defines, USE_UV: '' };
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, sssUniforms);
      shader.fragmentShader =
        `uniform float thicknessPower;
uniform float thicknessScale;
uniform float thicknessDistortion;
uniform float thicknessAmbient;
uniform float thicknessAttenuation;
` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
  vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));
  float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
  #ifdef USE_COLOR
    vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;
  #else
    vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;
  #endif
  reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;
}
void main() {`,
      );

      const lightsReplace = ShaderChunk.lights_fragment_begin.replaceAll(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
        `RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_fragment_begin>',
        lightsReplace,
      );
    };

    // Create instanced mesh
    const geo = new SphereGeometry();
    sphereMesh = new InstancedMesh(geo, mat, props.count);
    sceneRef.add(sphereMesh);

    // Set colors
    if (props.colors.length > 1) {
      const colorObjs = props.colors.map((c) => new Color(c));
      for (let i = 0; i < props.count; i++) {
        const ratio = i / props.count;
        const scaled = ratio * (colorObjs.length - 1);
        const idx = Math.floor(scaled);
        const start = colorObjs[idx];
        if (idx >= colorObjs.length - 1) {
          sphereMesh.setColorAt(i, start);
        } else {
          const alpha = scaled - idx;
          const end = colorObjs[idx + 1];
          const c = new Color(
            start.r + alpha * (end.r - start.r),
            start.g + alpha * (end.g - start.g),
            start.b + alpha * (end.b - start.b),
          );
          sphereMesh.setColorAt(i, c);
        }
      }
      if (sphereMesh.instanceColor) sphereMesh.instanceColor.needsUpdate = true;
    }

    // Lights
    const ambient = new AmbientLight(
      props.ambientColor,
      props.ambientIntensity,
    );
    sphereMesh.add(ambient);
    pointLight = new PointLight(
      props.colors[0] ?? 0xffffff,
      props.lightIntensity,
    );
    sphereMesh.add(pointLight);

    // Touch handling
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';

    // Resize observer
    const parent = canvas.parentElement;
    let observer: ResizeObserver | null = null;
    if (parent) {
      observer = new ResizeObserver(() => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 100);
      });
      observer.observe(parent);
    }

    // Clock
    clockRef = new Clock();
    const timeInfo = { elapsed: 0, delta: 0 };

    function animate() {
      animationId = requestAnimationFrame(animate);
      if (!rendererRef || !sceneRef || !cameraRef || !clockRef) return;

      timeInfo.delta = clockRef.getDelta();
      timeInfo.elapsed += timeInfo.delta;

      updatePhysics(timeInfo.delta);
      updateMesh();
      rendererRef.render(sceneRef, cameraRef);
    }

    // Visibility observer
    const intObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !isRunning) {
          isRunning = true;
          clockRef?.start();
          animationId = requestAnimationFrame(animate);
        } else if (!isVisible && isRunning) {
          isRunning = false;
          cancelAnimationFrame(animationId);
          clockRef?.stop();
        }
      },
      { threshold: 0 },
    );
    intObserver.observe(canvas);

    // Store cleanup refs
    (canvas as unknown as Record<string, unknown>).__cleanupBallpit = () => {
      intObserver.disconnect();
      observer?.disconnect();
      cancelAnimationFrame(animationId);
      geo.dispose();
      mat.dispose();
      envMap.dispose();
      pmrem.dispose();
      rendererRef?.dispose();
    };
  });

  onBeforeUnmount(() => {
    const canvas = containerRef.value;
    if (canvas) {
      const cleanup = (canvas as unknown as Record<string, unknown>)
        .__cleanupBallpit;
      if (typeof cleanup === 'function') cleanup();
    }
    if (resizeTimeout) clearTimeout(resizeTimeout);
  });
</script>

<template>
  <div :class="cn('size-full', $props.class)">
    <canvas ref="containerRef" class="block size-full"></canvas>
  </div>
</template>
