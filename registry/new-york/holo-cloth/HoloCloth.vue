<script setup lang="ts">
  // A sheet of simulated cloth floating in zero gravity, draped in an
  // iridescent holo-foil material. Grab the fabric to pull it around; it
  // wrinkles, settles, and floats like cloth suspended in gel. Ported from
  // Dmitry Kurash's Holocloth (https://github.com/dmitrykurash/holocloth).
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
  import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
  import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
  import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
  import { cn } from '~/lib/utils';
  import { ClothSim } from './cloth';
  import { createHoloMaterial } from './holoMaterial';
  import type { HoloUniforms } from './holoMaterial';
  import { makeWeaveNormalMap } from './textures';
  import { BAKED_POSE } from './bakedPose';
  import type { HoloClothProps, HoloClothPreset } from './types';

  const props = withDefaults(defineProps<HoloClothProps>(), {
    preset: 'holo',
    image: '',
    background: '#0b0c12',
    interactive: true,
    zoom: false,
    quality: 'high',
    class: '',
  });

  interface MaterialBundle {
    baseColor: string;
    holoIntensity: number;
    holoScale: number;
    bandFreq: number;
    saturation: number;
    hueShift: number;
    sparkle: number;
    specTint: number;
    iridescence: number;
    metalness: number;
    sheen: number;
    bump: number;
    bumpTiling: number;
    roughness: number;
    clearcoat: number;
    coatRoughness: number;
  }

  // Preset bundles lifted verbatim from the upstream tool.
  const PRESETS: Record<HoloClothPreset, MaterialBundle> = {
    holo: {
      baseColor: '#20242d',
      holoIntensity: 3.78,
      holoScale: 400,
      bandFreq: 1.1,
      saturation: 1.0,
      hueShift: 0.37,
      sparkle: 0.73,
      specTint: 0.33,
      iridescence: 0.81,
      metalness: 1.0,
      sheen: 0,
      bump: 3.0,
      bumpTiling: 3,
      roughness: 0.62,
      clearcoat: 0.06,
      coatRoughness: 0.7,
    },
    chrome: {
      baseColor: '#dfe3e8',
      holoIntensity: 0,
      holoScale: 400,
      bandFreq: 1.1,
      saturation: 1.0,
      hueShift: 0.37,
      sparkle: 0.2,
      specTint: 0,
      iridescence: 0,
      metalness: 1,
      sheen: 0,
      bump: 0.05,
      bumpTiling: 3,
      roughness: 0.04,
      clearcoat: 1.0,
      coatRoughness: 0.04,
    },
    'black-cloth': {
      baseColor: '#101114',
      holoIntensity: 0.1,
      holoScale: 8,
      bandFreq: 0.2,
      saturation: 0,
      hueShift: 0,
      sparkle: 0,
      specTint: 0.82,
      iridescence: 0,
      metalness: 0.43,
      sheen: 0.08,
      bump: 0,
      bumpTiling: 3,
      roughness: 0.83,
      clearcoat: 0.22,
      coatRoughness: 0.32,
    },
  };

  const PHYSICS = {
    viscosity: 0.6,
    stiffness: 1,
    iterations: 14,
    smoothing: 0.045,
    grabRadius: 0.27,
  };

  const CLOTH_LONG_SIDE = 3;
  const WHITE = new THREE.Color(0xffffff);

  const GrainShader = {
    uniforms: {
      tDiffuse: { value: null as THREE.Texture | null },
      uAmount: { value: 0.345 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float uAmount;
      uniform float uTime;
      varying vec2 vUv;
      float gHash(vec3 p3) {
        p3 = fract(p3 * 0.1031);
        p3 += dot(p3, p3.zyx + 31.32);
        return fract((p3.x + p3.y) * p3.z);
      }
      void main() {
        vec4 c = texture2D(tDiffuse, vUv);
        vec2 p = mod(gl_FragCoord.xy, 1024.0);
        float n = gHash(vec3(p, mod(uTime * 120.0, 512.0))) - 0.5;
        c.rgb += n * uAmount;
        gl_FragColor = c;
      }
    `,
  };

  const host = ref<HTMLElement | null>(null);

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let controls: OrbitControls | null = null;
  let composer: EffectComposer | null = null;
  let bloomPass: UnrealBloomPass | null = null;
  let grainPass: ShaderPass | null = null;
  let sim: ClothSim | null = null;
  let clothMesh: THREE.Mesh | null = null;
  let clothGeometry: THREE.BufferGeometry | null = null;
  let cavityAttr: THREE.BufferAttribute | null = null;
  let holoMaterial: THREE.MeshPhysicalMaterial | null = null;
  let holoUniforms: HoloUniforms | null = null;
  let surfaceCanvas: HTMLCanvasElement | null = null;
  let surfaceTexture: THREE.CanvasTexture | null = null;
  let clothImage: HTMLImageElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let raycaster: THREE.Raycaster | null = null;
  const pointerNdc = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  let grabbing = false;
  let grabPointerId: number | null = null;
  let hoverCursor = 'default';
  let clock: THREE.Clock | null = null;
  let elapsed = 0;
  let clothSegments = 48;
  let clothAspect = 1;
  let disposed = false;

  function qualitySettings(q: string) {
    if (q === 'low') return { pr: 1, samples: 0, segs: 28 };
    if (q === 'medium')
      return {
        pr: Math.min(window.devicePixelRatio, 1.5),
        samples: 4,
        segs: 36,
      };
    return { pr: Math.min(window.devicePixelRatio, 2), samples: 8, segs: 48 };
  }

  function redrawSurface() {
    if (!surfaceCanvas || !surfaceTexture) return;
    const ctx = surfaceCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, surfaceCanvas.width, surfaceCanvas.height);
    if (clothImage) {
      ctx.drawImage(
        clothImage,
        0,
        0,
        surfaceCanvas.width,
        surfaceCanvas.height,
      );
    }
    surfaceTexture.needsUpdate = true;
  }

  function buildCloth(aspect: number) {
    if (!clothMesh || !holoUniforms) return;
    clothAspect = aspect;
    const w = aspect >= 1 ? CLOTH_LONG_SIDE : CLOTH_LONG_SIDE * aspect;
    const h = aspect >= 1 ? CLOTH_LONG_SIDE / aspect : CLOTH_LONG_SIDE;
    const segs = clothSegments;
    const segX = aspect >= 1 ? segs : Math.max(10, Math.round(segs * aspect));
    const segY = aspect >= 1 ? Math.max(10, Math.round(segs / aspect)) : segs;
    sim = new ClothSim(w, h, segX, segY);
    const geo = new THREE.PlaneGeometry(w, h, segX, segY);
    const posAttr = new THREE.BufferAttribute(sim.positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    cavityAttr = new THREE.BufferAttribute(new Float32Array(sim.count), 1);
    cavityAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aCavity', cavityAttr);
    geo.computeVertexNormals();
    const old = clothMesh.geometry;
    clothMesh.geometry = geo;
    clothGeometry = geo;
    if (old) old.dispose();
    holoUniforms.uClothSize.value.set(w, h);
    endGrabInteraction();
  }

  function applyPreset(name: HoloClothPreset) {
    if (!holoMaterial || !holoUniforms) return;
    const b = PRESETS[name] ?? PRESETS.holo;
    const m = holoMaterial;
    m.color.set(b.baseColor);
    m.roughness = b.roughness;
    m.metalness = b.metalness;
    m.clearcoat = b.clearcoat;
    m.clearcoatRoughness = b.coatRoughness;
    m.sheen = b.sheen;
    m.sheenColor.set(b.baseColor).lerp(WHITE, 0.5);
    m.iridescence = b.iridescence;
    m.normalScale.set(b.bump, b.bump);
    if (m.normalMap) m.normalMap.repeat.set(b.bumpTiling, b.bumpTiling);
    const u = holoUniforms;
    u.uHoloIntensity.value = b.holoIntensity;
    u.uHoloScale.value = b.holoScale;
    u.uBandFreq.value = b.bandFreq;
    u.uRadialFreq.value = 1.6;
    u.uSaturation.value = b.saturation;
    u.uHueShift.value = b.hueShift;
    u.uSparkle.value = b.sparkle;
    u.uSpecTint.value = b.specTint;
  }

  function applyBackground(value: string) {
    if (!scene || !renderer) return;
    if (value === 'transparent') {
      scene.background = null;
      renderer.setClearColor(0x000000, 0);
    } else {
      scene.background = new THREE.Color(value);
    }
  }

  function loadClothImage(url: string) {
    if (!url) {
      clothImage = null;
      redrawSurface();
      if (clothAspect !== 1) buildCloth(1);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (disposed) return;
      clothImage = img;
      const iw = img.naturalWidth || img.width || 1;
      const ih = img.naturalHeight || img.height || 1;
      const aspect = Math.min(3, Math.max(1 / 3, iw / ih));
      redrawSurface();
      if (aspect !== clothAspect) buildCloth(aspect);
    };
    img.src = url;
  }

  function updatePointer(e: PointerEvent) {
    if (!renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  function raycastCloth(): THREE.Intersection | null {
    if (!raycaster || !camera || !clothMesh || !clothGeometry) return null;
    raycaster.setFromCamera(pointerNdc, camera);
    clothGeometry.computeBoundingSphere();
    const hits = raycaster.intersectObject(clothMesh, false);
    return hits.length > 0 ? (hits[0] ?? null) : null;
  }

  function endGrabInteraction() {
    if (
      renderer &&
      grabPointerId !== null &&
      renderer.domElement.hasPointerCapture(grabPointerId)
    ) {
      renderer.domElement.releasePointerCapture(grabPointerId);
    }
    grabbing = false;
    grabPointerId = null;
    sim?.endGrab();
    if (controls) controls.enabled = true;
  }

  function onPointerDown(e: PointerEvent) {
    if (!props.interactive || e.button !== 0 || grabbing) return;
    if (!renderer || !camera || !sim) return;
    updatePointer(e);
    const hit = raycastCloth();
    if (!hit) return;
    if (!sim.startGrab(hit.point, PHYSICS.grabRadius)) return;
    grabbing = true;
    grabPointerId = e.pointerId;
    if (controls) controls.enabled = false;
    const normal = new THREE.Vector3();
    camera.getWorldDirection(normal);
    dragPlane.setFromNormalAndCoplanarPoint(normal, hit.point);
    renderer.domElement.setPointerCapture(e.pointerId);
    renderer.domElement.style.cursor = 'grabbing';
  }

  function onPointerMove(e: PointerEvent) {
    if (grabbing && e.pointerId !== grabPointerId) return;
    updatePointer(e);
    if (!grabbing || !raycaster || !camera || !sim) return;
    raycaster.setFromCamera(pointerNdc, camera);
    const target = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(dragPlane, target)) {
      sim.moveGrab(target);
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (!grabbing || e.pointerId !== grabPointerId) return;
    endGrabInteraction();
    if (renderer) renderer.domElement.style.cursor = hoverCursor;
  }

  function tick() {
    if (disposed || !renderer || !clock) return;
    const dt = clock.getDelta();
    elapsed += dt;
    if (grainPass) grainPass.uniforms.uTime!.value = elapsed % 61.7;

    if (sim && clothGeometry) {
      sim.step(dt, PHYSICS);
      clothGeometry.attributes.position!.needsUpdate = true;
      clothGeometry.computeVertexNormals();
      if (cavityAttr) {
        sim.computeCavity(
          clothGeometry.attributes.normal!.array,
          cavityAttr.array as Float32Array,
        );
        cavityAttr.needsUpdate = true;
      }
    }

    // hover cursor feedback (skip while dragging; skip on low quality)
    if (!grabbing && props.interactive && props.quality !== 'low') {
      const hit = raycastCloth();
      const cursor = hit ? 'grab' : 'default';
      if (cursor !== hoverCursor) {
        hoverCursor = cursor;
        renderer.domElement.style.cursor = cursor;
      }
    }

    controls?.update();
    composer?.render();
  }

  /** Give the cloth a gentle random poke. */
  function poke() {
    sim?.poke(1);
  }

  /** Reset the cloth back to its draped rest pose. */
  function reset() {
    if (!sim || !clothGeometry) return;
    sim.reset();
    clothGeometry.attributes.position!.needsUpdate = true;
    clothGeometry.computeVertexNormals();
  }

  defineExpose({ poke, reset });

  onMounted(() => {
    const el = host.value;
    if (!el) return;
    const width = el.clientWidth || 640;
    const height = el.clientHeight || 480;
    const q = qualitySettings(props.quality);
    clothSegments = q.segs;

    renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: true,
    });
    renderer.setPixelRatio(q.pr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.5;
    el.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    applyBackground(props.background);
    camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);
    camera.position.set(...BAKED_POSE.camera);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.73;
    pmrem.dispose();

    const rimA = new THREE.DirectionalLight(0x7fd4ff, 1.1);
    rimA.position.set(-4, 2.5, -3);
    const rimB = new THREE.DirectionalLight(0xff9ad5, 0.9);
    rimB.position.set(4.5, -1.5, -2.5);
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(1.5, 3, 4);
    scene.add(rimA, rimB, key);

    // surface texture: optional draped image in cloth UV space
    surfaceCanvas = document.createElement('canvas');
    surfaceCanvas.width = 1024;
    surfaceCanvas.height = 1024;
    surfaceTexture = new THREE.CanvasTexture(surfaceCanvas);
    surfaceTexture.colorSpace = THREE.SRGBColorSpace;
    redrawSurface();

    const holo = createHoloMaterial(surfaceTexture);
    holoMaterial = holo.material;
    holoUniforms = holo.uniforms;
    // fold occlusion on by default (upstream render defaults)
    holoUniforms.uCavityAmount.value = 1;
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    if (holoMaterial.roughnessMap)
      holoMaterial.roughnessMap.anisotropy = maxAniso;
    surfaceTexture.anisotropy = maxAniso;

    // procedural woven normal map (upstream ships a scratches photo; the
    // registry component stays asset-free with the generated weave)
    const weave = makeWeaveNormalMap();
    weave.anisotropy = maxAniso;
    holoMaterial.normalMap = weave;
    holoMaterial.needsUpdate = true;

    clothMesh = new THREE.Mesh(undefined, holoMaterial);
    clothMesh.frustumCulled = false;
    buildCloth(1);
    scene.add(clothMesh);
    applyPreset(props.preset);

    raycaster = new THREE.Raycaster();
    clock = new THREE.Clock();

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.6;
    controls.maxDistance = 30;
    controls.enableZoom = props.zoom;
    controls.enabled = props.interactive;
    controls.target.set(...BAKED_POSE.target);
    controls.update();

    const rt = new THREE.WebGLRenderTarget(width, height, {
      samples: q.samples,
      type: THREE.HalfFloatType,
    });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(q.pr);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.05,
      0.85,
      1.41,
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    grainPass = new ShaderPass(GrainShader);
    composer.addPass(grainPass);

    if (props.image) loadClothImage(props.image);

    resizeObserver = new ResizeObserver(() => {
      if (!renderer || !camera || !composer || !host.value) return;
      const w = host.value.clientWidth;
      const h = host.value.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    });
    resizeObserver.observe(el);

    renderer.setAnimationLoop(tick);
  });

  watch(
    () => props.preset,
    (next) => applyPreset(next),
  );
  watch(
    () => props.background,
    (next) => applyBackground(next),
  );
  watch(
    () => props.image,
    (next) => loadClothImage(next),
  );
  watch([() => props.interactive, () => props.zoom], () => {
    if (!controls) return;
    controls.enabled = props.interactive;
    controls.enableZoom = props.zoom;
    if (!props.interactive) endGrabInteraction();
  });

  onBeforeUnmount(() => {
    disposed = true;
    if (renderer) {
      renderer.setAnimationLoop(null);
      const canvas = renderer.domElement;
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    }
    resizeObserver?.disconnect();
    controls?.dispose();
    composer?.dispose();
    clothGeometry?.dispose();
    if (holoMaterial) {
      holoMaterial.normalMap?.dispose();
      holoMaterial.roughnessMap?.dispose();
      holoMaterial.dispose();
    }
    surfaceTexture?.dispose();
    if (scene) {
      scene.environment?.dispose();
    }
    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
    }
  });
</script>

<template>
  <div
    ref="host"
    :class="cn('relative size-full overflow-hidden', props.class)"
    role="img"
    aria-label="Interactive holographic cloth simulation"
  />
</template>
