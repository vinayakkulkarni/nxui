import * as THREE from 'three';
import {
  advance,
  clamp,
  createPaperPath,
  finite,
  randomSource,
  spring,
} from './paper-path';
import type {
  PaperCrumpleEngine,
  PaperCrumpleEngineContext,
  PaperCrumpleState,
  PaperPath,
} from './types';

let pathCache: { key: string; value: PaperPath } | null = null;

const at = (list: ArrayLike<number>, i: number) => list[i] ?? 0;

export function createPaperEngine(
  ctx: PaperCrumpleEngineContext,
): PaperCrumpleEngine | null {
  const { root, canvas, hit, scene: cfg } = ctx;
  ctx.onStatus('loading');
  hit.dataset.held = 'false';
  hit.setAttribute('aria-pressed', 'false');
  const initialRect = root.getBoundingClientRect();
  const paperWidth = Math.max(1, finite(cfg.width, 320));
  const paperHeight = Math.max(1, finite(cfg.height, 400));
  const initialScale = Math.min(
    1,
    Math.max(1, initialRect.width - 48) / paperWidth,
    Math.max(1, initialRect.height - 48) / paperHeight,
  );
  root.style.setProperty('--pc-image-width', `${paperWidth * initialScale}px`);
  root.style.setProperty(
    '--pc-image-height',
    `${paperHeight * initialScale}px`,
  );

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch (error) {
    ctx.onStatus('error');
    ctx.onError(
      error instanceof Error ? error : new Error('WebGL is unavailable.'),
    );
    return null;
  }

  const aspect = paperHeight / paperWidth;
  const shortSide = Math.min(1, aspect);
  const resolution = Math.round(clamp(finite(cfg.detail, 64) / 4, 8, 24));
  const columns = Math.max(8, Math.round(resolution / Math.max(1, aspect)));
  const rows = Math.max(8, Math.round(resolution * Math.min(1, aspect)));
  const seed = finite(cfg.seed, 7);
  const rng = randomSource(seed);
  const sharpness = clamp(finite(cfg.foldSharpness, 0.6), 0, 1);
  const foldTotal = Math.round(clamp(finite(cfg.foldCount, 6), 3, 16));
  const depth = clamp(finite(cfg.wrinkleDepth, 0.65), 0, 2);
  const count = (columns + 1) * (rows + 1);
  const original = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      const index = row * (columns + 1) + col;
      const u =
        (col + (col > 0 && col < columns ? (rng() - 0.5) * 0.5 : 0)) / columns;
      const v =
        (row + (row > 0 && row < rows ? (rng() - 0.5) * 0.5 : 0)) / rows;
      original[index * 3] = u - 0.5;
      original[index * 3 + 1] = (v - 0.5) * aspect;
      uvs[index * 2] = u;
      uvs[index * 2 + 1] = v;
      if (col < columns && row < rows) {
        const a = index;
        const b = index + 1;
        const c = index + columns + 1;
        const d = c + 1;
        if (rng() > 0.5) indices.push(a, b, d, a, d, c);
        else indices.push(a, b, c, b, d, c);
      }
    }
  }
  const pathKey = JSON.stringify([
    paperWidth,
    paperHeight,
    resolution,
    foldTotal,
    sharpness,
    depth,
    seed,
  ]);
  if (pathCache?.key !== pathKey) {
    pathCache = {
      key: pathKey,
      value: createPaperPath(
        original,
        indices,
        shortSide,
        foldTotal,
        sharpness,
        depth,
        seed,
      ),
    };
  }
  const paperPath = pathCache.value;
  const lastSample = paperPath.samples.length - 1;
  const renderPositions = new Float32Array(indices.length * 3);
  const renderNormals = new Float32Array(indices.length * 3);
  const renderUvs = new Float32Array(indices.length * 2);
  const faceNormals = new Float32Array(indices.length);
  const incidentFaces: number[][] = Array.from({ length: count }, () => []);
  for (let i = 0; i < indices.length; i++) {
    const idx = at(indices, i);
    renderUvs[i * 2] = at(uvs, idx * 2);
    renderUvs[i * 2 + 1] = at(uvs, idx * 2 + 1);
    incidentFaces[idx]?.push(Math.floor(i / 3) * 3);
  }
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(
    renderPositions,
    3,
  ).setUsage(THREE.DynamicDrawUsage);
  const normalAttribute = new THREE.BufferAttribute(renderNormals, 3).setUsage(
    THREE.DynamicDrawUsage,
  );
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('normal', normalAttribute);
  geometry.setAttribute('uv', new THREE.BufferAttribute(renderUvs, 2));

  const grainData = new Uint8Array(128 * 128 * 4);
  for (let i = 0; i < grainData.length; i += 4) {
    const value = 100 + Math.floor(rng() * 155);
    grainData[i] = value;
    grainData[i + 1] = value;
    grainData[i + 2] = value;
    grainData[i + 3] = 255;
  }
  const grain = new THREE.DataTexture(grainData, 128, 128);
  grain.wrapS = THREE.RepeatWrapping;
  grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(5, 5 * aspect);
  grain.magFilter = THREE.LinearFilter;
  grain.minFilter = THREE.LinearFilter;
  grain.needsUpdate = true;

  const materialOptions = {
    roughness: clamp(finite(cfg.roughness, 0.92), 0, 1),
    metalness: 0,
    bumpMap: grain,
    bumpScale: clamp(finite(cfg.paperTexture, 0.08), 0, 1) * 0.32,
    alphaTest: 0.04,
    alphaToCoverage: true,
    flatShading: false,
  };
  const frontMaterial = new THREE.MeshStandardMaterial({
    ...materialOptions,
    side: THREE.FrontSide,
  });
  const backMaterial = new THREE.MeshStandardMaterial({
    ...materialOptions,
    side: THREE.BackSide,
    color: cfg.backSrc ? '#ffffff' : cfg.paperColor,
  });
  const lighting = { value: 0 };
  for (const material of [frontMaterial, backMaterial]) {
    const stock = material === backMaterial && !cfg.backSrc;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.paperLighting = lighting;
      shader.fragmentShader =
        'uniform float paperLighting;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        #ifdef USE_MAP
          if (vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0) discard;
          ${stock ? 'diffuseColor.rgb = diffuse;' : ''}
        #endif
      `,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `
        outgoingLight = mix(diffuseColor.rgb, outgoingLight, paperLighting);
        #include <opaque_fragment>
      `,
      );
    };
    material.customProgramCacheKey = () => `paper-${stock ? 'stock' : 'print'}`;
  }
  const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    alphaTest: 0.04,
    side: THREE.DoubleSide,
  });
  depthMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #include <map_fragment>
      #ifdef USE_MAP
        if (vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0) discard;
      #endif
    `,
    );
  };

  const sheet = new THREE.Group();
  const front = new THREE.Mesh(geometry, frontMaterial);
  const back = new THREE.Mesh(geometry, backMaterial);
  front.castShadow = cfg.shadow;
  front.receiveShadow = cfg.shadow;
  back.receiveShadow = cfg.shadow;
  front.customDepthMaterial = depthMaterial;
  sheet.add(front, back);
  const scene = new THREE.Scene();
  scene.add(sheet);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
  scene.add(new THREE.HemisphereLight('#ffffff', '#a4a0b0', 1.35));
  const light = new THREE.DirectionalLight(
    '#fffaf0',
    Math.max(0, finite(cfg.lightIntensity, 1.8)),
  );
  light.castShadow = cfg.shadow;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0002;
  light.shadow.normalBias = 0.6;
  light.shadow.radius = 3;
  scene.add(light, light.target);
  const floorGeometry = new THREE.PlaneGeometry(1, 1);
  const floorMaterial = new THREE.ShadowMaterial({
    opacity: clamp(finite(cfg.shadowOpacity, 0.08), 0, 1),
    depthWrite: false,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  floor.visible = cfg.shadow;
  scene.add(floor);
  renderer.setClearColor('#000000', 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = cfg.shadow;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const amount = spring();
  const memory = spring();
  const posX = spring();
  const posY = spring();
  const tiltX = spring();
  const tiltY = spring();
  const springs = [amount, memory, posX, posY, tiltX, tiltY];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const anchor = new THREE.Vector3();
  const world = new THREE.Vector3();
  const corner = new THREE.Vector3();
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const weights = new THREE.Vector3(1, 0, 0);
  let gripIndices = [Math.floor(count / 2), 0, 0];
  let viewportWidth = 1;
  let viewportHeight = 1;
  let scale = paperWidth;
  let pointerX = 0;
  let pointerY = 0;
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let speedX = 0;
  let speedY = 0;
  let held = false;
  let keyboard = false;
  let pointerId: number | null = null;
  let peak = 0;
  let disposed = false;
  let ready = false;
  let inView = true;
  let hidden = false;
  let contextLost = false;
  let frame = 0;
  let lastTime = 0;
  let state: PaperCrumpleState = 'flat';
  const textures = new Set<THREE.Texture>();
  let previousAmount = -1;
  let previousMemory = -1;
  const baseRotation = THREE.MathUtils.degToRad(finite(cfg.rotation, 0));

  function publish(next: PaperCrumpleState) {
    if (next === state) return;
    state = next;
    ctx.onState(next);
  }

  function deform() {
    if (amount.value === previousAmount && memory.value === previousMemory)
      return;
    previousAmount = amount.value;
    previousMemory = memory.value;
    const fold = clamp(amount.value, 0, 1);
    const position = fold * lastSample;
    const lower = Math.floor(position);
    const upper = Math.min(lower + 1, lastSample);
    const mix = position - lower;
    const from = paperPath.samples[lower] ?? original;
    const to = paperPath.samples[upper] ?? original;
    const creaseMix = memory.value * (1 - fold);
    for (let i = 0; i < positions.length; i++) {
      const f = at(from, i);
      positions[i] =
        f +
        (at(to, i) - f) * mix +
        (at(paperPath.creased, i) - at(original, i)) * creaseMix;
    }
    for (let face = 0; face < indices.length; face += 3) {
      const a = at(indices, face) * 3;
      const b = at(indices, face + 1) * 3;
      const c = at(indices, face + 2) * 3;
      const ax = at(positions, a);
      const ay = at(positions, a + 1);
      const az = at(positions, a + 2);
      const bx = at(positions, b) - ax;
      const by = at(positions, b + 1) - ay;
      const bz = at(positions, b + 2) - az;
      const cx = at(positions, c) - ax;
      const cy = at(positions, c + 1) - ay;
      const cz = at(positions, c + 2) - az;
      const nx = by * cz - bz * cy;
      const ny = bz * cx - bx * cz;
      const nz = bx * cy - by * cx;
      const length = Math.hypot(nx, ny, nz) || 1;
      faceNormals[face] = nx / length;
      faceNormals[face + 1] = ny / length;
      faceNormals[face + 2] = nz / length;
    }
    const low = 0.88 - (1 - sharpness) * 0.18;
    for (let i = 0; i < indices.length; i++) {
      const idx = at(indices, i);
      const source = idx * 3;
      const face = Math.floor(i / 3) * 3;
      const fx = at(faceNormals, face);
      const fy = at(faceNormals, face + 1);
      const fz = at(faceNormals, face + 2);
      let nx = 0;
      let ny = 0;
      let nz = 0;
      for (const neighbor of incidentFaces[idx] ?? []) {
        const gx = at(faceNormals, neighbor);
        const gy = at(faceNormals, neighbor + 1);
        const gz = at(faceNormals, neighbor + 2);
        const weight = THREE.MathUtils.smoothstep(
          fx * gx + fy * gy + fz * gz,
          low,
          0.98,
        );
        nx += gx * weight;
        ny += gy * weight;
        nz += gz * weight;
      }
      const length = Math.hypot(nx, ny, nz) || 1;
      renderPositions[i * 3] = at(positions, source);
      renderPositions[i * 3 + 1] = at(positions, source + 1);
      renderPositions[i * 3 + 2] = at(positions, source + 2);
      renderNormals[i * 3] = nx / length;
      renderNormals[i * 3 + 1] = ny / length;
      renderNormals[i * 3 + 2] = nz / length;
    }
    positionAttribute.needsUpdate = true;
    normalAttribute.needsUpdate = true;
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    lighting.value = THREE.MathUtils.smoothstep(fold + memory.value, 0, 0.4);
  }

  function setCorner(bounds: THREE.Box3, i: number) {
    corner.set(
      i & 1 ? bounds.max.x : bounds.min.x,
      i & 2 ? bounds.max.y : bounds.min.y,
      i & 4 ? bounds.max.z : bounds.min.z,
    );
  }

  function placeHitTarget() {
    const bounds = geometry.boundingBox;
    if (!bounds) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < 8; i++) {
      setCorner(bounds, i);
      corner.applyMatrix4(sheet.matrixWorld).project(camera);
      const x = ((corner.x + 1) * viewportWidth) / 2;
      const y = ((1 - corner.y) * viewportHeight) / 2;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    hit.style.transform = `translate3d(${minX}px, ${minY}px, 0)`;
    hit.style.width = `${Math.max(24, maxX - minX)}px`;
    hit.style.height = `${Math.max(24, maxY - minY)}px`;
  }

  function setPointer(x: number, y: number) {
    pointer.set((x / viewportWidth) * 2 - 1, 1 - (y / viewportHeight) * 2);
    raycaster.setFromCamera(pointer, camera);
  }

  function canRun() {
    return !disposed && ready && !contextLost && inView && !hidden;
  }

  function render(time: number) {
    frame = 0;
    if (!canRun()) return;
    const dt = lastTime ? Math.min(0.04, (time - lastTime) / 1000) : 1 / 60;
    lastTime = time;
    const opts = ctx.live();
    let moving = false;
    const duration = held
      ? finite(opts.crumpleDuration, 0.55)
      : finite(opts.releaseDuration, 0.4);
    for (const s of springs) {
      const d = s === amount || s === memory ? duration : 0.42;
      moving = advance(s, dt, d, opts.reduceMotion || keyboard) || moving;
    }
    peak = Math.max(peak, amount.value);
    deform();
    sheet.rotation.set(tiltX.value, tiltY.value, baseRotation);
    if (held && !keyboard && opts.draggable) {
      anchor.set(0, 0, 0);
      for (let i = 0; i < 3; i++) {
        va.fromBufferAttribute(positionAttribute, gripIndices[i] ?? 0);
        anchor.addScaledVector(va, weights.getComponent(i));
      }
      anchor.multiplyScalar(scale).applyEuler(sheet.rotation);
      plane.constant = -anchor.z;
      setPointer(pointerX, pointerY);
      if (raycaster.ray.intersectPlane(plane, world)) {
        posX.value = posX.target = world.x - anchor.x;
        posY.value = posY.target = world.y - anchor.y;
        posX.velocity = 0;
        posY.velocity = 0;
      }
    }
    sheet.position.set(posX.value, posY.value, 0);
    sheet.updateMatrixWorld(true);
    const shadowBounds = geometry.boundingBox;
    if (shadowBounds) {
      let backZ = Infinity;
      for (let i = 0; i < 8; i++) {
        setCorner(shadowBounds, i);
        corner.applyMatrix4(sheet.matrixWorld);
        backZ = Math.min(backZ, corner.z);
      }
      floor.position.z = backZ - scale * shortSide * 0.08;
    }
    renderer.render(scene, camera);
    placeHitTarget();
    if (moving) wake();
  }

  function wake() {
    if (!frame && canRun()) frame = requestAnimationFrame(render);
  }

  function resize() {
    if (disposed) return;
    const rect = root.getBoundingClientRect();
    viewportWidth = Math.max(1, rect.width);
    viewportHeight = Math.max(1, rect.height);
    scale =
      paperWidth *
      Math.min(
        1,
        Math.max(1, viewportWidth - 48) / paperWidth,
        Math.max(1, viewportHeight - 48) / paperHeight,
      );
    sheet.scale.setScalar(scale);
    camera.aspect = viewportWidth / viewportHeight;
    camera.position.z =
      viewportHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(viewportWidth, viewportHeight, false);
    const reach = Math.max(viewportWidth, viewportHeight);
    const angle = THREE.MathUtils.degToRad(finite(cfg.lightAngle, -35));
    light.position.set(
      Math.sin(angle) * reach,
      Math.cos(angle) * reach,
      reach * 4,
    );
    light.shadow.camera.left = -reach;
    light.shadow.camera.bottom = -reach;
    light.shadow.camera.right = reach;
    light.shadow.camera.top = reach;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = reach * 6;
    light.shadow.camera.updateProjectionMatrix();
    floor.position.z = -scale * shortSide * 0.12;
    floor.scale.set(viewportWidth * 4, viewportHeight * 4, 1);
    root.style.setProperty('--pc-image-width', `${scale}px`);
    root.style.setProperty('--pc-image-height', `${scale * aspect}px`);
    if (!held) {
      const limitX = Math.max(0, (viewportWidth - scale) / 2 - 16);
      const limitY = Math.max(0, (viewportHeight - scale * aspect) / 2 - 16);
      posX.value = posX.target = clamp(posX.value, -limitX, limitX);
      posY.value = posY.target = clamp(posY.value, -limitY, limitY);
    }
    wake();
  }

  function finish(instant = false) {
    if (!held) return;
    const opts = ctx.live();
    held = false;
    hit.setAttribute('aria-pressed', 'false');
    hit.dataset.held = 'false';
    const captured = pointerId;
    pointerId = null;
    if (captured !== null && hit.hasPointerCapture(captured))
      hit.releasePointerCapture(captured);
    if (opts.releaseBehavior === 'stay') {
      amount.target = amount.value;
      amount.velocity = 0;
    } else {
      amount.target = 0;
      memory.target =
        opts.releaseBehavior === 'creased'
          ? Math.max(
              memory.value,
              peak * clamp(finite(opts.creaseStrength, 0.18), 0, 1),
            )
          : 0;
    }
    tiltX.target = 0;
    tiltY.target = 0;
    if (opts.returnToOrigin && opts.releaseBehavior !== 'stay') {
      posX.target = 0;
      posY.target = 0;
    } else {
      const bounds = geometry.boundingBox;
      const stay = opts.releaseBehavior === 'stay' && bounds;
      const spanX = stay ? bounds.max.x - bounds.min.x : 1;
      const spanY = stay ? bounds.max.y - bounds.min.y : aspect;
      const cos = Math.abs(Math.cos(baseRotation));
      const sin = Math.abs(Math.sin(baseRotation));
      const halfWidth = ((cos * spanX + sin * spanY) * scale) / 2;
      const halfHeight = ((sin * spanX + cos * spanY) * scale) / 2;
      const radius = Math.max(0, finite(opts.dragRadius, 180));
      const limitX = Math.min(
        radius,
        Math.max(0, viewportWidth / 2 - halfWidth - 16),
      );
      const limitY = Math.min(
        radius,
        Math.max(0, viewportHeight / 2 - halfHeight - 16),
      );
      const coast =
        !opts.reduceMotion && !keyboard && performance.now() - lastMove < 90
          ? 0.06
          : 0;
      posX.target = clamp(posX.value + speedX * coast, -limitX, limitX);
      posY.target = clamp(posY.value - speedY * coast, -limitY, limitY);
    }
    if (instant || keyboard || opts.reduceMotion) {
      for (const s of springs) advance(s, 0, 0, true);
    }
    keyboard = false;
    publish(
      opts.releaseBehavior === 'stay' && amount.target > 0.001
        ? 'crumpled'
        : memory.target > 0.001
          ? 'creased'
          : 'flat',
    );
    wake();
  }

  function reset() {
    finish(true);
    for (const s of springs) {
      s.target = 0;
      s.value = 0;
      s.velocity = 0;
    }
    peak = 0;
    publish('flat');
    wake();
  }

  function start() {
    held = true;
    peak = amount.value;
    amount.target = clamp(finite(ctx.live().crumpleAmount, 0.85), 0, 1);
    hit.setAttribute('aria-pressed', 'true');
    hit.dataset.held = 'true';
    publish('holding');
    wake();
  }

  function pointerDown(event: PointerEvent) {
    if (
      !ready ||
      ctx.live().disabled ||
      held ||
      event.button !== 0 ||
      !event.isPrimary
    )
      return;
    const rect = root.getBoundingClientRect();
    pointerX = lastX = event.clientX - rect.left;
    pointerY = lastY = event.clientY - rect.top;
    setPointer(pointerX, pointerY);
    sheet.updateMatrixWorld(true);
    const intersection = raycaster.intersectObjects([front, back], false)[0];
    const face = intersection?.face;
    if (!intersection || !face) return;
    event.preventDefault();
    hit.dataset.pointer = 'true';
    hit.focus({ preventScroll: true });
    gripIndices = [face.a, face.b, face.c];
    va.fromBufferAttribute(positionAttribute, face.a);
    vb.fromBufferAttribute(positionAttribute, face.b);
    vc.fromBufferAttribute(positionAttribute, face.c);
    THREE.Triangle.getBarycoord(
      sheet.worldToLocal(intersection.point.clone()),
      va,
      vb,
      vc,
      weights,
    );
    keyboard = false;
    pointerId = event.pointerId;
    speedX = 0;
    speedY = 0;
    lastMove = performance.now();
    hit.setPointerCapture(event.pointerId);
    start();
  }

  function pointerMove(event: PointerEvent) {
    const opts = ctx.live();
    if (!held || event.pointerId !== pointerId || !opts.draggable) return;
    const rect = root.getBoundingClientRect();
    const now = performance.now();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dt = Math.max(0.008, (now - lastMove) / 1000);
    speedX = (x - lastX) / dt;
    speedY = (y - lastY) / dt;
    lastX = x;
    lastY = y;
    lastMove = now;
    pointerX = clamp(x, 12, viewportWidth - 12);
    pointerY = clamp(y, 12, viewportHeight - 12);
    const maxTilt = opts.reduceMotion
      ? 0
      : THREE.MathUtils.degToRad(clamp(finite(opts.dragRotation, 10), 0, 60));
    tiltX.target = clamp(speedY / 1800, -1, 1) * maxTilt;
    tiltY.target = clamp(speedX / 1800, -1, 1) * maxTilt;
    wake();
  }

  function pointerUp(event: PointerEvent) {
    if (event.pointerId === pointerId) finish();
  }

  function pointerCancel(event: PointerEvent) {
    if (event.pointerId === pointerId) finish(true);
  }

  function cancel() {
    finish(true);
  }

  function blur() {
    hit.dataset.pointer = 'false';
    cancel();
  }

  function keyDown(event: KeyboardEvent) {
    const opts = ctx.live();
    if (opts.disabled || !ready) return;
    hit.dataset.pointer = 'false';
    if (event.key === 'Escape') {
      event.preventDefault();
      reset();
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (event.repeat || held) return;
      keyboard = true;
      start();
      advance(amount, 0, 0, true);
      peak = Math.max(peak, amount.value);
      return;
    }
    const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (held && keyboard && opts.draggable && arrows.includes(event.key)) {
      event.preventDefault();
      const step = event.shiftKey ? 30 : 12;
      const limit = Math.max(0, finite(opts.dragRadius, 180));
      const dx =
        event.key === 'ArrowRight'
          ? step
          : event.key === 'ArrowLeft'
            ? -step
            : 0;
      const dy =
        event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0;
      const limitX = Math.min(limit, viewportWidth / 3);
      const limitY = Math.min(limit, viewportHeight / 3);
      posX.target = clamp(posX.target + dx, -limitX, limitX);
      posY.target = clamp(posY.target + dy, -limitY, limitY);
      wake();
    }
  }

  function keyUp(event: KeyboardEvent) {
    if (keyboard && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      finish(true);
    }
  }

  function setInView(visible: boolean) {
    inView = visible;
    lastTime = 0;
    if (!visible) cancel();
    else wake();
  }

  function setHidden(value: boolean) {
    hidden = value;
    lastTime = 0;
    if (value) cancel();
    else wake();
  }

  function motionChange() {
    if (ctx.live().reduceMotion) {
      tiltX.target = 0;
      tiltY.target = 0;
    }
    wake();
  }

  function contextLostHandler(event: Event) {
    event.preventDefault();
    contextLost = true;
    cancel();
    ctx.onStatus('error');
    ctx.onError(new Error('The WebGL context was lost.'));
  }

  function contextRestored() {
    contextLost = false;
    if (ready) {
      ctx.onStatus('ready');
      wake();
    }
  }

  deform();
  resize();

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  function load(url: string): Promise<THREE.Texture<HTMLImageElement>> {
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (texture) => {
          if (disposed) {
            texture.dispose();
            resolve(texture);
            return;
          }
          textures.add(texture);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(
            8,
            renderer.capabilities.getMaxAnisotropy(),
          );
          const image = texture.image;
          const imageAspect = image.width / image.height;
          const targetAspect = paperWidth / paperHeight;
          let rx = 1;
          let ry = 1;
          if (cfg.imageFit === 'cover') {
            if (imageAspect > targetAspect) rx = targetAspect / imageAspect;
            else ry = imageAspect / targetAspect;
          } else if (imageAspect > targetAspect)
            ry = imageAspect / targetAspect;
          else rx = targetAspect / imageAspect;
          texture.repeat.set(rx, ry);
          texture.offset.set((1 - rx) / 2, (1 - ry) / 2);
          resolve(texture);
        },
        undefined,
        () =>
          reject(
            new Error(
              `Unable to load paper image: ${url}. Remote images must allow CORS.`,
            ),
          ),
      );
    });
  }

  if (cfg.src) {
    Promise.all([
      load(cfg.src),
      cfg.backSrc ? load(cfg.backSrc) : Promise.resolve(null),
    ])
      .then(([frontTexture, backTexture]) => {
        if (disposed) return;
        if (backTexture) {
          backTexture.repeat.x *= -1;
          backTexture.offset.x = 1 - backTexture.offset.x;
        }
        frontMaterial.map = frontTexture;
        backMaterial.map = backTexture ?? frontTexture;
        depthMaterial.map = frontTexture;
        frontMaterial.needsUpdate = true;
        backMaterial.needsUpdate = true;
        depthMaterial.needsUpdate = true;
        ready = true;
        ctx.onStatus('ready');
        wake();
      })
      .catch((error: unknown) => {
        if (disposed) return;
        ctx.onStatus('error');
        ctx.onError(error instanceof Error ? error : new Error(String(error)));
      });
  } else {
    ctx.onStatus('error');
    ctx.onError(new Error('PaperCrumple requires an image src.'));
  }

  function dispose() {
    disposed = true;
    cancelAnimationFrame(frame);
    if (pointerId !== null && hit.hasPointerCapture(pointerId))
      hit.releasePointerCapture(pointerId);
    geometry.dispose();
    floorGeometry.dispose();
    frontMaterial.dispose();
    backMaterial.dispose();
    depthMaterial.dispose();
    floorMaterial.dispose();
    grain.dispose();
    for (const texture of textures) texture.dispose();
    light.shadow.dispose();
    renderer.dispose();
  }

  return {
    resize,
    setInView,
    setHidden,
    motionChange,
    reset,
    cancel,
    pointerDown,
    pointerMove,
    pointerUp,
    pointerCancel,
    keyDown,
    keyUp,
    blur,
    contextLost: contextLostHandler,
    contextRestored,
    dispose,
  };
}
