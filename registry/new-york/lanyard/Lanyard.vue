<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import * as THREE from 'three';
  import { cn } from '~/lib/utils';
  import {
    ANCHORS,
    BAND_BEND,
    BAND_COLUMNS,
    BEVEL,
    CLAMP_BODY,
    EYELET_RADIUS,
    FACE_WIDTH,
    FINISHES,
    FLIP_SPIN,
    FOV,
    JOINTS,
    METALS,
    RING_RADIUS,
    RING_TUBE,
    SAMPLES,
    STRAP_WIDTH,
    THICKNESS,
    buildBandGeometry,
    buildCardGeometry,
    buildClampGeometry,
    buildEnvironment,
    buildGrainTexture,
    buildWeaveTexture,
    cardLayout,
    clamp,
    loadImage,
    makeCanvasTexture,
    mix,
    paintFace,
    paintStrap,
    parseColor,
  } from './lanyard-assets';
  import {
    FOIL_FRAGMENT_BODY,
    FOIL_FRAGMENT_HEAD,
    FOIL_VERTEX_BODY,
    FOIL_VERTEX_HEAD,
  } from './lanyard-foil';
  import {
    buildPhysics,
    configureSimulation,
    createSimulation,
    placeHanging,
    stepSimulation,
  } from './lanyard-physics';
  import type {
    LanyardApplied,
    LanyardCardLayout,
    LanyardImages,
    LanyardPress,
    LanyardProps,
  } from './types';

  const props = withDefaults(defineProps<LanyardProps>(), {
    frontImage: undefined,
    backImage: undefined,
    imageFit: 'cover',
    cardColor: '#ffffff',
    orientation: 'portrait',
    finish: 'glossy',
    cornerRadius: 0.3,
    size: 0.6,
    anchor: 'center',
    strapLength: 0.5,
    strapImage: undefined,
    strapColor: '#111111',
    strapWidth: 0.65,
    metal: 'silver',
    gravity: 1,
    damping: 0.5,
    elasticity: 0.5,
    breeze: 0.5,
    interactive: true,
    intro: true,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const sim = createSimulation();
  const view = { width: 1, height: 1 };
  const images: LanyardImages = { front: null, back: null, strap: null };
  const imageCache = new Map<string, Promise<HTMLImageElement | null>>();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const controls: THREE.Vector3[] = [];
  const mouth = new THREE.Vector3();
  const tuck = new THREE.Vector3();
  const curve = new THREE.CatmullRomCurve3(controls, false, 'centripetal');
  const points = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
  const sides = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
  const bends = BAND_BEND.map((angle) => [Math.cos(angle), Math.sin(angle)]);
  const work = {
    tangent: new THREE.Vector3(),
    toCamera: new THREE.Vector3(),
    basis: new THREE.Matrix4(),
    up: new THREE.Vector3(),
    across: new THREE.Vector3(),
    facing: new THREE.Vector3(),
    end: new THREE.Vector3(),
    a: new THREE.Vector3(),
    b: new THREE.Vector3(),
    c: new THREE.Vector3(),
  };

  let layout: LanyardCardLayout = cardLayout('portrait', 0.3);
  let applied: LanyardApplied = {};
  let strapScale = STRAP_WIDTH;
  let tileRatio = 2;
  let raf = 0;
  let last = 0;
  let time = 0;
  let visible = true;
  let alive = false;
  let placed = false;
  let hovering = false;
  let press: LanyardPress | null = null;
  let imageToken = 0;

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let environment: THREE.WebGLRenderTarget | null = null;
  let frontCanvas: HTMLCanvasElement | null = null;
  let backCanvas: HTMLCanvasElement | null = null;
  let strapCanvas: HTMLCanvasElement | null = null;
  let frontTexture: THREE.CanvasTexture | null = null;
  let backTexture: THREE.CanvasTexture | null = null;
  let strapTexture: THREE.CanvasTexture | null = null;
  let grain: THREE.CanvasTexture | null = null;
  let weave: THREE.DataTexture | null = null;
  let frontMaterial: THREE.MeshPhysicalMaterial | null = null;
  let backMaterial: THREE.MeshPhysicalMaterial | null = null;
  let edgeMaterial: THREE.MeshPhysicalMaterial | null = null;
  let metalMaterial: THREE.MeshStandardMaterial | null = null;
  let bandMaterial: THREE.MeshPhysicalMaterial | null = null;
  let cardGroup: THREE.Group | null = null;
  let bodyMesh: THREE.Mesh | null = null;
  let frontMesh: THREE.Mesh | null = null;
  let backMesh: THREE.Mesh | null = null;
  let ring: THREE.Mesh | null = null;
  let band: THREE.Mesh | null = null;
  let bandGeometry: THREE.BufferGeometry | null = null;
  let clampGroup: THREE.Group | null = null;
  let clampMesh: THREE.Mesh | null = null;
  let eyelet: THREE.Mesh | null = null;

  const foilUniforms = {
    foilStrength: { value: 0 },
    foilAspect: { value: 1.4 },
    foilKey: { value: new THREE.Vector3() },
    foilFill: { value: new THREE.Vector3() },
    foilTop: { value: new THREE.Vector3() },
  };

  function injectFoil(shader: THREE.WebGLProgramParametersWithUniforms) {
    Object.assign(shader.uniforms, foilUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${FOIL_VERTEX_HEAD}`)
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>\n${FOIL_VERTEX_BODY}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FOIL_FRAGMENT_HEAD}`)
      .replace(
        '#include <opaque_fragment>',
        `${FOIL_FRAGMENT_BODY}\n#include <opaque_fragment>`,
      );
  }

  function isReduced() {
    return reducedMotion.value === 'reduce';
  }

  function paintFaces() {
    if (!frontCanvas || !backCanvas || !frontTexture || !backTexture) return;
    const color = parseColor(props.cardColor, [1, 1, 1]);
    const fit = props.imageFit === 'contain' ? 'contain' : 'cover';
    const width = FACE_WIDTH;
    const height = Math.round((FACE_WIDTH * layout.height) / layout.width);
    if (frontCanvas.width !== width || frontCanvas.height !== height) {
      frontCanvas.width = width;
      frontCanvas.height = height;
      backCanvas.width = width;
      backCanvas.height = height;
      frontTexture.dispose();
      backTexture.dispose();
    }
    paintFace(frontCanvas, images.front, color, fit);
    paintFace(backCanvas, images.back ?? images.front, color, fit);
    frontTexture.needsUpdate = true;
    backTexture.needsUpdate = true;
    start();
  }

  function repaintStrap() {
    if (!strapCanvas || !strapTexture || !weave) return;
    tileRatio = paintStrap(
      strapCanvas,
      images.strap,
      parseColor(props.strapColor, [0.07, 0.07, 0.07]),
    );
    weave.repeat.set(2, 2 * tileRatio);
    strapTexture.dispose();
    strapTexture.needsUpdate = true;
    start();
  }

  function frameView() {
    if (!camera) return;
    const aspect = view.width / view.height;
    let viewHeight = layout.height / clamp(props.size, 0.15, 0.9);
    const minimumWidth = layout.width / 0.72;
    if (viewHeight * aspect < minimumWidth) viewHeight = minimumWidth / aspect;
    const viewWidth = viewHeight * aspect;
    camera.aspect = aspect;
    camera.position.set(0, 0, viewHeight / 2 / Math.tan((FOV * Math.PI) / 360));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    foilUniforms.foilKey.value
      .set(-2.5, 4, 6)
      .normalize()
      .transformDirection(camera.matrixWorldInverse);
    foilUniforms.foilFill.value
      .set(3, -1, 4)
      .normalize()
      .transformDirection(camera.matrixWorldInverse);
    foilUniforms.foilTop.value
      .set(0.5, 4.5, 8)
      .normalize()
      .transformDirection(camera.matrixWorldInverse);
    const anchorX = ((ANCHORS[props.anchor] ?? 0.5) - 0.5) * viewWidth;
    const anchorY = viewHeight / 2 + 0.2;
    const cardTop =
      viewHeight / 2 -
      viewHeight * mix(0.12, 0.42, clamp(props.strapLength, 0, 1));
    const hangTop = cardTop + (layout.hangY - layout.height / 2);
    sim.anchor.set(anchorX, anchorY, 0);
    configureSimulation(sim, layout, anchorY - hangTop);
    sim.nodes[0]!.copy(sim.anchor);
    sim.previous[0]!.copy(sim.anchor);
  }

  function apply() {
    if (
      !bodyMesh ||
      !frontMesh ||
      !backMesh ||
      !ring ||
      !frontMaterial ||
      !backMaterial ||
      !edgeMaterial ||
      !metalMaterial ||
      !clampMesh ||
      !canvasRef.value
    )
      return;
    const orientation =
      props.orientation === 'landscape' ? 'landscape' : 'portrait';
    const layoutKey = `${orientation}|${props.cornerRadius}`;
    if (layoutKey !== applied.layoutKey) {
      layout = cardLayout(orientation, props.cornerRadius);
      const geometry = buildCardGeometry(layout);
      bodyMesh.geometry.dispose();
      frontMesh.geometry.dispose();
      backMesh.geometry.dispose();
      bodyMesh.geometry = geometry.body;
      frontMesh.geometry = geometry.face;
      backMesh.geometry = geometry.face.clone();
      frontMesh.position.z = THICKNESS / 2 + BEVEL + 0.0006;
      backMesh.rotation.y = Math.PI;
      backMesh.position.z = -(THICKNESS / 2 + BEVEL + 0.0006);
      ring.position.set(0, layout.ringY, 0);
      applied.framingKey = '';
    }
    const framingKey = `${layoutKey}|${props.size}|${props.anchor}|${props.strapLength}|${view.width}|${view.height}`;
    if (framingKey !== applied.framingKey) {
      frameView();
      if (!placed) {
        placeHanging(sim, layout, props.intro && !isReduced());
        placed = true;
      } else if (layoutKey !== applied.layoutKey) {
        placeHanging(sim, layout, false);
      }
    }

    const imageKey = `${props.frontImage}|${props.backImage}|${props.strapImage}`;
    if (imageKey !== applied.imageKey) {
      const token = ++imageToken;
      Promise.all([
        loadImage(imageCache, props.frontImage),
        loadImage(imageCache, props.backImage),
        loadImage(imageCache, props.strapImage),
      ]).then(([front, back, strap]) => {
        if (!alive || token !== imageToken) return;
        images.front = front;
        images.back = back;
        images.strap = strap;
        paintFaces();
        repaintStrap();
      });
    }
    const faceKey = `${layoutKey}|${props.cardColor}|${props.imageFit}`;
    if (faceKey !== applied.faceKey) paintFaces();
    if (props.strapColor !== applied.strapColor) repaintStrap();

    const finish = FINISHES[props.finish] ?? FINISHES.glossy;
    const card = parseColor(props.cardColor, [1, 1, 1]);
    for (const material of [frontMaterial, backMaterial]) {
      material.roughness = finish.roughness;
      material.metalness = finish.metalness;
      material.clearcoat = finish.clearcoat;
      material.clearcoatRoughness = finish.clearcoatRoughness;
      material.anisotropy = finish.anisotropy;
    }
    foilUniforms.foilStrength.value = finish.foil;
    foilUniforms.foilAspect.value = layout.height / layout.width;
    edgeMaterial.color.setRGB(
      card[0] * 0.92,
      card[1] * 0.92,
      card[2] * 0.92,
      THREE.SRGBColorSpace,
    );
    edgeMaterial.roughness = Math.min(finish.roughness, 0.35);
    edgeMaterial.metalness = finish.metalness;
    edgeMaterial.clearcoat = 1;
    edgeMaterial.clearcoatRoughness = 0.08;
    const metalLook = METALS[props.metal] ?? METALS.silver;
    metalMaterial.color.set(metalLook.color);
    metalMaterial.roughness = metalLook.roughness;
    strapScale = STRAP_WIDTH * clamp(props.strapWidth, 0.4, 2);
    if (strapScale !== applied.strapScale) {
      clampMesh.geometry.dispose();
      clampMesh.geometry = buildClampGeometry(strapScale);
    }
    canvasRef.value.style.touchAction = props.interactive ? 'pan-y' : 'auto';

    applied = {
      layoutKey,
      framingKey,
      imageKey,
      faceKey,
      strapColor: props.strapColor,
      strapScale,
    };
    start();
  }

  /** Rebuilds the band ribbon along a centripetal Catmull-Rom through the joints, twisted with the card. */
  function updateBand() {
    if (!bandGeometry || !camera || !clampGroup) return;
    const hang = sim.nodes[JOINTS]!;
    const reach = EYELET_RADIUS + CLAMP_BODY + 0.05;
    let guide = JOINTS - 1;
    while (guide > 0 && sim.nodes[guide]!.distanceTo(hang) < reach * 1.1)
      guide--;
    const axis = work.up.subVectors(sim.nodes[guide]!, hang);
    if (axis.lengthSq() < 1e-8)
      axis.set(0, 1, 0).applyQuaternion(sim.body.quaternion);
    axis.normalize();
    mouth.copy(hang).addScaledVector(axis, reach);
    tuck.copy(hang).addScaledVector(axis, EYELET_RADIUS + CLAMP_BODY * 0.35);
    controls.length = 0;
    for (let i = 0; i <= guide; i++) controls.push(sim.nodes[i]!);
    controls.push(mouth, tuck);
    curve.updateArcLengths();
    for (let i = 0; i < SAMPLES; i++)
      curve.getPointAt(i / (SAMPLES - 1), points[i]!);
    const length = curve.getLength();
    const held = 1 - mouth.distanceTo(tuck) / Math.max(length, 0.001);
    const position = bandGeometry.getAttribute('position');
    const normal = bandGeometry.getAttribute('normal');
    const uv = bandGeometry.getAttribute('uv');
    const columns = BAND_COLUMNS.length;
    const restLength = sim.rest * JOINTS;
    const repeats = restLength / (strapScale * tileRatio);
    const width =
      strapScale /
      Math.pow(Math.max(1, length / Math.max(restLength, 0.001)), 0.35);
    const { tangent, toCamera, across, facing } = work;
    for (let i = 0; i < SAMPLES; i++) {
      tangent.subVectors(
        points[Math.min(SAMPLES - 1, i + 1)]!,
        points[Math.max(0, i - 1)]!,
      );
      if (tangent.lengthSq() < 1e-12) tangent.set(0, -1, 0);
      tangent.normalize();
      toCamera.subVectors(camera.position, points[i]!).normalize();
      const side = sides[i]!.crossVectors(toCamera, tangent);
      if (side.lengthSq() < 1e-10)
        side.copy(i > 0 ? sides[i - 1]! : work.a.set(1, 0, 0));
      side.normalize();
      if (i > 0 && side.dot(sides[i - 1]!) < 0) side.negate();
      const angle =
        -sim.twist * Math.pow(Math.min(1, i / (SAMPLES - 1) / held), 1.3);
      facing.crossVectors(tangent, side);
      across
        .copy(side)
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(facing, Math.sin(angle));
      facing.crossVectors(tangent, across);
      const p = points[i]!;
      const v = (1 - i / (SAMPLES - 1)) * repeats;
      for (let c = 0; c < columns; c++) {
        const k = i * columns + c;
        const offset = (BAND_COLUMNS[c]! - 0.5) * width;
        const bendCos = bends[c]![0]!;
        const bendSin = bends[c]![1]!;
        position.setXYZ(
          k,
          p.x + across.x * offset,
          p.y + across.y * offset,
          p.z + across.z * offset,
        );
        normal.setXYZ(
          k,
          facing.x * bendCos + across.x * bendSin,
          facing.y * bendCos + across.y * bendSin,
          facing.z * bendCos + across.z * bendSin,
        );
        uv.setXY(k, BAND_COLUMNS[c]!, v);
      }
    }
    work.end.copy(across);
    position.needsUpdate = true;
    normal.needsUpdate = true;
    uv.needsUpdate = true;

    across
      .copy(work.end)
      .addScaledVector(axis, -work.end.dot(axis))
      .normalize();
    facing.crossVectors(across, axis).normalize();
    work.basis.makeBasis(across, axis, facing);
    clampGroup.quaternion.setFromRotationMatrix(work.basis);
    clampGroup.position.copy(hang);
  }

  function render() {
    if (!renderer || !scene || !camera || !cardGroup) return;
    cardGroup.position.copy(sim.body.position);
    cardGroup.quaternion.copy(sim.body.quaternion);
    updateBand();
    renderer.render(scene, camera);
  }

  function tick(now: number) {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
    last = now;
    time += dt;
    const current = buildPhysics(
      props.gravity,
      props.elasticity,
      props.damping,
      isReduced() ? 0 : props.breeze,
    );
    stepSimulation(sim, dt, current, time);
    const body = sim.body;
    if (
      !Number.isFinite(
        body.position.x + body.position.y + body.position.z + body.quaternion.w,
      )
    ) {
      sim.grab = null;
      placeHanging(sim, layout, false);
    }
    render();
    const resting = sim.calm > 1.2 && !sim.grab && current.breeze === 0;
    if (visible && !resting) raf = requestAnimationFrame(tick);
  }

  function start() {
    if (raf || !visible || !alive) return;
    sim.calm = 0;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function toPointer(clientX: number, clientY: number) {
    const canvas = canvasRef.value;
    if (!canvas || !camera) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
  }

  function pickCard(): THREE.Intersection | null {
    if (!cardGroup || !bodyMesh || !frontMesh || !backMesh) return null;
    cardGroup.updateMatrixWorld();
    const hits = raycaster.intersectObjects(
      [bodyMesh, frontMesh, backMesh],
      false,
    );
    return hits[0] ?? null;
  }

  function setCursor(value: string) {
    const canvas = canvasRef.value;
    if (canvas && canvas.style.cursor !== value) canvas.style.cursor = value;
  }

  /** Click = flip: target a half-turn around the card's up axis and kick it spinning toward it. */
  function flip(point: THREE.Vector3) {
    if (!camera) return;
    const body = sim.body;
    const up = work.a.set(0, 1, 0).applyQuaternion(body.quaternion);
    let direction = sim.turn > 0 ? -1 : 1;
    if (sim.turn === 0) {
      const away = work.c.subVectors(point, camera.position).normalize();
      direction =
        work.b.subVectors(point, body.position).cross(away).dot(up) < 0
          ? -1
          : 1;
    }
    sim.turn = sim.turn === 0 ? Math.PI * direction : 0;
    body.angular.addScaledVector(up, FLIP_SPIN * direction);
  }

  function onPointerDown(event: PointerEvent) {
    if (!props.interactive || event.button > 0) return;
    toPointer(event.clientX, event.clientY);
    const hit = pickCard();
    if (!hit) return;
    sim.grab = {
      local: hit.point
        .clone()
        .sub(sim.body.position)
        .applyQuaternion(sim.body.quaternion.clone().invert()),
      rotation: sim.body.quaternion.clone(),
      reach: hit.distance,
      from: hit.point.clone(),
      target: hit.point.clone(),
    };
    press = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      point: hit.point.clone(),
    };
    canvasRef.value?.setPointerCapture(event.pointerId);
    setCursor('grabbing');
    event.preventDefault();
    start();
  }

  function onPointerMove(event: PointerEvent) {
    if (!props.interactive) return;
    toPointer(event.clientX, event.clientY);
    if (sim.grab) {
      if (
        press &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6
      )
        press = null;
      raycaster.ray.at(sim.grab.reach, sim.grab.target);
      start();
      return;
    }
    if (event.pointerType === 'touch') return;
    hovering = pickCard() !== null;
    setCursor(hovering ? 'grab' : '');
  }

  function onPointerUp(event: PointerEvent) {
    if (!sim.grab) return;
    sim.grab = null;
    if (
      press &&
      event.type === 'pointerup' &&
      performance.now() - press.time < 450
    )
      flip(press.point);
    press = null;
    const canvas = canvasRef.value;
    if (canvas?.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    setCursor(hovering && event.pointerType !== 'touch' ? 'grab' : '');
    start();
  }

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    if (!props.interactive || event.touches.length !== 1 || !touch) return;
    toPointer(touch.clientX, touch.clientY);
    if (pickCard()) event.preventDefault();
  }

  function resize() {
    const container = containerRef.value;
    if (!renderer || !container) return;
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(view.width, view.height, false);
    apply();
    render();
  }

  useEventListener(canvasRef, 'pointerdown', onPointerDown);
  useEventListener(canvasRef, 'pointermove', onPointerMove);
  useEventListener(canvasRef, 'pointerup', onPointerUp);
  useEventListener(canvasRef, 'pointercancel', onPointerUp);
  useEventListener(canvasRef, 'lostpointercapture', onPointerUp);
  useEventListener(canvasRef, 'touchstart', onTouchStart, { passive: false });
  useEventListener(
    () => (containerRef.value ? containerRef.value.ownerDocument : null),
    'visibilitychange',
    () => {
      if (!document.hidden) start();
    },
  );

  useResizeObserver(containerRef, resize);
  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) start();
  });

  watch(props, apply);

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      renderer = null;
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;

    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    scene = new THREE.Scene();
    environment = buildEnvironment(renderer);
    scene.environment = environment.texture;
    camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(-2.5, 4, 6);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    fillLight.position.set(3, -1, 4);
    scene.add(keyLight, fillLight);

    frontCanvas = document.createElement('canvas');
    backCanvas = document.createElement('canvas');
    strapCanvas = document.createElement('canvas');
    frontTexture = makeCanvasTexture(frontCanvas, anisotropy);
    backTexture = makeCanvasTexture(backCanvas, anisotropy);
    strapTexture = makeCanvasTexture(strapCanvas, anisotropy);
    strapTexture.wrapS = THREE.ClampToEdgeWrapping;
    strapTexture.wrapT = THREE.RepeatWrapping;
    grain = buildGrainTexture();
    weave = buildWeaveTexture();

    frontMaterial = new THREE.MeshPhysicalMaterial({
      map: frontTexture,
      normalMap: grain,
      normalScale: new THREE.Vector2(0.06, 0.06),
    });
    backMaterial = new THREE.MeshPhysicalMaterial({
      map: backTexture,
      normalMap: grain,
      normalScale: new THREE.Vector2(0.06, 0.06),
    });
    frontMaterial.onBeforeCompile = injectFoil;
    backMaterial.onBeforeCompile = injectFoil;
    edgeMaterial = new THREE.MeshPhysicalMaterial();
    metalMaterial = new THREE.MeshStandardMaterial({ metalness: 1 });
    bandMaterial = new THREE.MeshPhysicalMaterial({
      map: strapTexture,
      normalMap: weave,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.68,
      sheen: 1,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(0.32, 0.32, 0.34),
      side: THREE.DoubleSide,
    });

    cardGroup = new THREE.Group();
    bodyMesh = new THREE.Mesh(new THREE.BufferGeometry(), edgeMaterial);
    frontMesh = new THREE.Mesh(new THREE.BufferGeometry(), frontMaterial);
    backMesh = new THREE.Mesh(new THREE.BufferGeometry(), backMaterial);
    ring = new THREE.Mesh(
      new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 18, 72),
      metalMaterial,
    );
    ring.rotation.y = Math.PI / 2 - 0.7;
    cardGroup.add(bodyMesh, frontMesh, backMesh, ring);
    scene.add(cardGroup);

    bandGeometry = buildBandGeometry(SAMPLES);
    band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.frustumCulled = false;
    scene.add(band);

    clampGroup = new THREE.Group();
    clampMesh = new THREE.Mesh(buildClampGeometry(STRAP_WIDTH), metalMaterial);
    clampMesh.position.y = EYELET_RADIUS + CLAMP_BODY / 2 - 0.004;
    eyelet = new THREE.Mesh(
      new THREE.TorusGeometry(EYELET_RADIUS, 0.0105, 14, 40),
      metalMaterial,
    );
    clampGroup.add(clampMesh, eyelet);
    scene.add(clampGroup);

    alive = true;
    resize();
  });

  onBeforeUnmount(() => {
    alive = false;
    cancelAnimationFrame(raf);
    raf = 0;
    for (const mesh of [
      bodyMesh,
      frontMesh,
      backMesh,
      ring,
      clampMesh,
      eyelet,
      band,
    ])
      mesh?.geometry.dispose();
    for (const material of [
      frontMaterial,
      backMaterial,
      edgeMaterial,
      metalMaterial,
      bandMaterial,
    ])
      material?.dispose();
    for (const texture of [
      frontTexture,
      backTexture,
      strapTexture,
      grain,
      weave,
    ])
      texture?.dispose();
    environment?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer = null;
    scene = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  >
    <canvas ref="canvasRef" class="block size-full" aria-hidden="true" />
  </div>
</template>
