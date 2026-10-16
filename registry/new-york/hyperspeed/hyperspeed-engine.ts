import * as THREE from 'three';
import type { IUniform, ShaderMaterialParameters } from 'three';
import {
  CURVES,
  MAX_CARS,
  MAX_COLORS,
  MAX_DUST,
  MAX_POLES,
  TRAVEL,
  lookShapes,
} from './hyperspeed-config';
import {
  BLOOM_FRAGMENT,
  DOWN_FRAGMENT,
  DUST_FRAGMENT,
  DUST_VERTEX,
  POLE_FRAGMENT,
  POLE_VERTEX,
  QUAD_VERTEX,
  ROAD_FRAGMENT,
  ROAD_VERTEX,
  STREAK_FRAGMENT,
  STREAK_VERTEX,
  UP_FRAGMENT,
} from './hyperspeed-shaders';
import type {
  HyperspeedEngine,
  HyperspeedEngineOptions,
  HyperspeedSettings,
  HyperspeedVec3,
} from './types';

let colorContext: CanvasRenderingContext2D | null = null;

function toRgb(color: string): HyperspeedVec3 {
  colorContext =
    colorContext ?? document.createElement('canvas').getContext('2d');
  if (!colorContext) return [1, 1, 1];
  colorContext.fillStyle = '#000000';
  colorContext.fillStyle = color;
  const value = String(colorContext.fillStyle);
  if (value.startsWith('#')) {
    const hex = Number.parseInt(value.slice(1, 7), 16);
    return [
      ((hex >> 16) & 255) / 255,
      ((hex >> 8) & 255) / 255,
      (hex & 255) / 255,
    ];
  }
  const parts = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return [(parts[0] ?? 0) / 255, (parts[1] ?? 0) / 255, (parts[2] ?? 0) / 255];
}

function fillPalette(
  uniform: IUniform<THREE.Vector3[]>,
  count: IUniform<number>,
  colors: string[],
) {
  const list = colors.length ? colors : ['#ffffff'];
  for (let i = 0; i < MAX_COLORS; i++) {
    uniform.value[i]!.fromArray(toRgb(list[i % list.length]!));
  }
  count.value = Math.min(list.length, MAX_COLORS);
}

function instanced(source: THREE.BufferGeometry) {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(source.index);
  for (const [name, attribute] of Object.entries(source.attributes)) {
    geometry.setAttribute(name, attribute);
  }
  return geometry;
}

const swatches = (): IUniform<THREE.Vector3[]> => ({
  value: Array.from({ length: MAX_COLORS }, () => new THREE.Vector3(1, 1, 1)),
});

/**
 * Builds the highway scene inside `container` and runs its render loop.
 * Settings are read every frame, so prop changes apply live.
 */
export function createHyperspeedEngine(
  container: HTMLElement,
  { getSettings, reducedMotion }: HyperspeedEngineOptions,
): HyperspeedEngine {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.autoClear = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(getSettings().fov, 1, 0.1, 10000);
  camera.position.set(0, 8, -5);

  const shared = {
    uTime: { value: 0 },
    uCurvature: { value: 1 },
    uCurveA: { value: new THREE.Vector4() },
    uCurveB: { value: 0 },
    uFogNear: { value: TRAVEL * 0.22 },
    uFogFar: { value: TRAVEL * 0.95 },
    uTravel: { value: TRAVEL },
    uStretch: { value: 0 },
    uPixel: { value: 0.001 },
  };
  const disposables: { dispose: () => void }[] = [];
  const effectMaterials: THREE.ShaderMaterial[] = [];

  const material = (
    vertexShader: string,
    fragmentShader: string,
    uniforms: Record<string, IUniform>,
    options: ShaderMaterialParameters = {},
  ) => {
    const created = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { ...shared, ...uniforms },
      transparent: true,
      depthWrite: false,
      ...options,
    });
    disposables.push(created);
    return created;
  };

  const roadGeometry = new THREE.PlaneGeometry(1, TRAVEL, 1, 220);
  roadGeometry.rotateX(-Math.PI / 2);
  roadGeometry.translate(0, 0, -TRAVEL / 2);
  disposables.push(roadGeometry);
  const roadUniforms = {
    uWidth: { value: 1 },
    uRoadColor: { value: new THREE.Vector3() },
    uLineColor: { value: new THREE.Vector3() },
    uBackground: { value: new THREE.Vector3() },
    uRoadWidth: { value: 10 },
    uMedian: { value: 2 },
    uLanes: { value: 3 },
    uTransparent: { value: 0 },
    uOpacity: { value: 1 },
  };
  const roadMaterial = material(ROAD_VERTEX, ROAD_FRAGMENT, roadUniforms, {
    transparent: true,
    depthWrite: true,
  });
  const road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.frustumCulled = false;
  road.renderOrder = 0;
  road.layers.enable(1);
  scene.add(road);

  const tube = new THREE.TubeGeometry(
    new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ),
    24,
    1,
    7,
    false,
  );
  disposables.push(tube);

  const glowLayer = (
    vertexShader: string,
    fragmentShader: string,
    geometry: THREE.BufferGeometry,
    uniforms: Record<string, IUniform>,
    radiusScale: number,
    sharp: number,
    mirror: number,
    order: number,
  ) => {
    const intensity = { value: 1 };
    const core = { value: 0 };
    const layerMaterial = material(
      vertexShader,
      fragmentShader,
      {
        ...uniforms,
        uRadiusScale: { value: radiusScale },
        uSharp: { value: sharp },
        uMirror: { value: mirror },
        uIntensity: intensity,
        uCore: core,
      },
      { depthTest: !mirror },
    );
    effectMaterials.push(layerMaterial);
    const mesh = new THREE.Mesh(geometry, layerMaterial);
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    if (!mirror) mesh.layers.enable(1);
    scene.add(mesh);
    return { intensity, core };
  };

  const streakGroup = (
    direction: number,
    fade: [number, number],
    speedRange: [number, number],
  ) => {
    const geometry = instanced(tube);
    const seedA = new Float32Array(MAX_CARS * 2 * 4);
    const seedB = new Float32Array(MAX_CARS * 2 * 4);
    const pair = new Float32Array(MAX_CARS * 2);
    const tone = new Float32Array(MAX_CARS * 2);
    for (let i = 0; i < MAX_CARS; i++) {
      const a = [Math.random(), Math.random(), Math.random(), Math.random()];
      const b = [
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random() * Math.random(),
      ];
      const shade = Math.random();
      for (let side = 0; side < 2; side++) {
        const index = i * 2 + side;
        seedA.set(a, index * 4);
        seedB.set(b, index * 4);
        pair[index] = side ? 0.5 : -0.5;
        tone[index] = shade;
      }
    }
    geometry.setAttribute(
      'aSeedA',
      new THREE.InstancedBufferAttribute(seedA, 4),
    );
    geometry.setAttribute(
      'aSeedB',
      new THREE.InstancedBufferAttribute(seedB, 4),
    );
    geometry.setAttribute('aPair', new THREE.InstancedBufferAttribute(pair, 1));
    geometry.setAttribute('aTone', new THREE.InstancedBufferAttribute(tone, 1));
    geometry.instanceCount = 0;
    disposables.push(geometry);
    const uniforms = {
      uRoadX: { value: 0 },
      uRoadWidth: { value: 10 },
      uLanes: { value: 3 },
      uDirection: { value: direction },
      uSpeedRange: { value: new THREE.Vector2(speedRange[0], speedRange[1]) },
      uTrail: { value: 1 },
      uSize: { value: 1 },
      uColors: swatches(),
      uColorCount: { value: 1 },
      uFade: { value: new THREE.Vector2(fade[0], fade[1]) },
    };
    return {
      geometry,
      uniforms,
      reflection: glowLayer(
        STREAK_VERTEX,
        STREAK_FRAGMENT,
        geometry,
        uniforms,
        2.1,
        1.2,
        1,
        1,
      ),
      core: glowLayer(
        STREAK_VERTEX,
        STREAK_FRAGMENT,
        geometry,
        uniforms,
        1,
        0.85,
        0,
        3,
      ),
    };
  };

  const tail = streakGroup(1, [0, 0.6], [60, 80]);
  const head = streakGroup(-1, [1, 0.4], [120, 160]);

  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  disposables.push(cylinder);
  const poleGeometry = instanced(cylinder);
  const poleSeed = new Float32Array(MAX_POLES * 2 * 4);
  const poleIndex = new Float32Array(MAX_POLES * 2);
  const poleSide = new Float32Array(MAX_POLES * 2);
  for (let i = 0; i < MAX_POLES; i++) {
    for (let side = 0; side < 2; side++) {
      const index = i * 2 + side;
      poleSeed.set(
        [Math.random(), Math.random(), Math.random(), Math.random()],
        index * 4,
      );
      poleIndex[index] = i + (side ? 0.5 : 0);
      poleSide[index] = side ? 1 : -1;
    }
  }
  poleGeometry.setAttribute(
    'aSeed',
    new THREE.InstancedBufferAttribute(poleSeed, 4),
  );
  poleGeometry.setAttribute(
    'aIndex',
    new THREE.InstancedBufferAttribute(poleIndex, 1),
  );
  poleGeometry.setAttribute(
    'aSide',
    new THREE.InstancedBufferAttribute(poleSide, 1),
  );
  poleGeometry.instanceCount = 0;
  disposables.push(poleGeometry);
  const poleUniforms = {
    uCount: { value: 20 },
    uEdge: { value: 11 },
    uHeight: { value: 1 },
    uColors: swatches(),
    uColorCount: { value: 1 },
  };
  const polesLayers = {
    reflection: glowLayer(
      POLE_VERTEX,
      POLE_FRAGMENT,
      poleGeometry,
      poleUniforms,
      2.4,
      1.2,
      1,
      1,
    ),
    core: glowLayer(
      POLE_VERTEX,
      POLE_FRAGMENT,
      poleGeometry,
      poleUniforms,
      1,
      0.8,
      0,
      3,
    ),
  };

  const dustGeometry = new THREE.BufferGeometry();
  const dustSeed = new Float32Array(MAX_DUST * 2 * 4);
  const dustEnd = new Float32Array(MAX_DUST * 2);
  for (let i = 0; i < MAX_DUST; i++) {
    const seed = [Math.random(), Math.random(), Math.random(), Math.random()];
    dustSeed.set(seed, i * 8);
    dustSeed.set(seed, i * 8 + 4);
    dustEnd[i * 2 + 1] = 1;
  }
  dustGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(MAX_DUST * 2 * 3), 3),
  );
  dustGeometry.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 4));
  dustGeometry.setAttribute('aEnd', new THREE.BufferAttribute(dustEnd, 1));
  dustGeometry.setDrawRange(0, 0);
  disposables.push(dustGeometry);
  const dustUniforms = {
    uSpread: { value: 140 },
    uColor: { value: new THREE.Vector3(1, 1, 1) },
    uIntensity: { value: 0.5 },
  };
  const dustMaterial = material(DUST_VERTEX, DUST_FRAGMENT, dustUniforms);
  effectMaterials.push(dustMaterial);
  const dustLines = new THREE.LineSegments(dustGeometry, dustMaterial);
  dustLines.frustumCulled = false;
  dustLines.renderOrder = 4;
  scene.add(dustLines);

  const floatTargets =
    renderer.extensions.has('EXT_color_buffer_float') ||
    renderer.extensions.has('EXT_color_buffer_half_float');
  const levels = Array.from({ length: 5 }, (_, index) => {
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: floatTargets ? THREE.HalfFloatType : THREE.UnsignedByteType,
      depthBuffer: index === 0,
    });
    disposables.push(target);
    return target;
  });
  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeometry = new THREE.PlaneGeometry(2, 2);
  disposables.push(quadGeometry);
  const quad = new THREE.Mesh(quadGeometry);
  quad.frustumCulled = false;
  quadScene.add(quad);

  const blur = (fragmentShader: string, options: ShaderMaterialParameters) => {
    const uTexture: IUniform<THREE.Texture | null> = { value: null };
    const uniforms = {
      uTexture,
      uTexel: { value: new THREE.Vector2() },
      uStrength: { value: 1 },
      uCeiling: { value: 1 },
      uLight: { value: 0 },
    };
    const created = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERTEX,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
      ...options,
    });
    disposables.push(created);
    return { material: created, uniforms };
  };
  const down = blur(DOWN_FRAGMENT, { blending: THREE.NoBlending });
  const up = blur(UP_FRAGMENT, {
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
  });
  const bloom = blur(BLOOM_FRAGMENT, {
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
  });
  const pass = (
    step: ReturnType<typeof blur>,
    source: THREE.WebGLRenderTarget,
    target: THREE.WebGLRenderTarget | null,
  ) => {
    quad.material = step.material;
    step.uniforms.uTexture.value = source.texture;
    step.uniforms.uTexel.value.set(1 / source.width, 1 / source.height);
    renderer.setRenderTarget(target);
    renderer.render(quadScene, quadCamera);
  };
  const clearColor = new THREE.Color();
  let clearAlpha = 0;

  const state = {
    boost: 0,
    held: false,
    fov: getSettings().fov,
    fovVelocity: 0,
    steerX: 0,
    steerY: 0,
    pointerX: 0,
    pointerY: 0,
    weights: [0, 0, 0, 0, 0],
    visible: true,
  };
  const keys = {
    tail: '',
    head: '',
    poles: '',
    surface: '',
  };
  let lastLight: boolean | null = null;
  const lookTarget = new THREE.Vector3();
  let raf = 0;
  let last = performance.now();
  let alive = true;

  const syncColors = (s: HyperspeedSettings) => {
    const tailKey = s.tailColors.join();
    if (tailKey !== keys.tail) {
      keys.tail = tailKey;
      fillPalette(
        tail.uniforms.uColors,
        tail.uniforms.uColorCount,
        s.tailColors,
      );
    }
    const headKey = s.headColors.join();
    if (headKey !== keys.head) {
      keys.head = headKey;
      fillPalette(
        head.uniforms.uColors,
        head.uniforms.uColorCount,
        s.headColors,
      );
    }
    const poleKey = s.poleColors.join();
    if (poleKey !== keys.poles) {
      keys.poles = poleKey;
      fillPalette(poleUniforms.uColors, poleUniforms.uColorCount, s.poleColors);
    }
    const surfaceKey = [
      s.roadColor,
      s.lineColor,
      s.background,
      s.dustColor,
    ].join();
    if (surfaceKey !== keys.surface) {
      keys.surface = surfaceKey;
      roadUniforms.uRoadColor.value.fromArray(toRgb(s.roadColor));
      roadUniforms.uLineColor.value.fromArray(toRgb(s.lineColor));
      dustUniforms.uColor.value.fromArray(toRgb(s.dustColor));
      const transparent = s.background === 'transparent';
      const backdrop: HyperspeedVec3 = transparent
        ? [0, 0, 0]
        : toRgb(s.background);
      roadUniforms.uBackground.value.fromArray(backdrop);
      roadUniforms.uTransparent.value = transparent ? 1 : 0;
      clearColor.setRGB(
        backdrop[0],
        backdrop[1],
        backdrop[2],
        THREE.LinearSRGBColorSpace,
      );
      clearAlpha = transparent ? 0 : 1;
    }
    if (lastLight !== s.light) {
      lastLight = s.light;
      for (const item of effectMaterials) {
        item.blending = s.light ? THREE.NormalBlending : THREE.AdditiveBlending;
        item.needsUpdate = true;
      }
      bloom.material.blendDst = s.light
        ? THREE.OneMinusSrcAlphaFactor
        : THREE.OneFactor;
      bloom.material.blendSrcAlpha = s.light
        ? THREE.OneFactor
        : THREE.ZeroFactor;
      bloom.material.blendDstAlpha = s.light
        ? THREE.OneMinusSrcAlphaFactor
        : THREE.OneFactor;
      bloom.uniforms.uLight.value = s.light ? 1 : 0;
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive) return;
    const s = getSettings();
    const reduce = reducedMotion();
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    syncColors(s);

    const wanted = (state.held && s.interactive) || s.boosting ? 1 : 0;
    state.boost +=
      (wanted - state.boost) *
      (1 - Math.exp(-dt / (wanted > state.boost ? 0.28 : 0.85)));
    const pace =
      s.speed * (reduce ? 0.3 : 1) * (1 + (s.boost - 1) * state.boost);
    shared.uTime.value += dt * pace;
    shared.uStretch.value = state.boost * 1.1;
    shared.uCurvature.value = s.curvature;

    const target = CURVES.indexOf(s.curve) - 1;
    const blend = 1 - Math.exp(-dt / 0.6);
    state.weights = state.weights.map(
      (weight, index) => weight + ((index === target ? 1 : 0) - weight) * blend,
    );
    const w = state.weights;
    shared.uCurveA.value.set(w[0]!, w[1]!, w[2]!, w[3]!);
    shared.uCurveB.value = w[4]!;

    const halfRoad = s.roadWidth / 2 + s.medianWidth / 2;
    const surface = 0.45 + 0.55 * s.roadOpacity;
    for (const [index, group] of [tail, head].entries()) {
      group.geometry.instanceCount = s.density * 2;
      group.uniforms.uRoadX.value = index ? halfRoad : -halfRoad;
      group.uniforms.uRoadWidth.value = s.roadWidth;
      group.uniforms.uLanes.value = s.lanes;
      group.uniforms.uTrail.value = s.trailLength;
      group.uniforms.uSize.value = s.lightSize;
      group.core.intensity.value = s.light ? 0.95 : 1 + 0.35 * state.boost;
      group.core.core.value = s.light ? 0 : 0.75;
      group.reflection.intensity.value =
        s.reflections * (s.light ? 0.22 : 0.42) * surface;
    }

    poleGeometry.instanceCount = s.poles * 2;
    poleUniforms.uCount.value = Math.max(1, s.poles);
    poleUniforms.uEdge.value = s.roadWidth + s.medianWidth / 2 + 0.8;
    poleUniforms.uHeight.value = s.poleHeight;
    polesLayers.core.intensity.value = s.light ? 0.9 : 1;
    polesLayers.core.core.value = s.light ? 0 : 0.6;
    polesLayers.reflection.intensity.value =
      s.reflections * (s.light ? 0.2 : 0.38) * surface;

    dustGeometry.setDrawRange(0, s.dust * 2);
    dustUniforms.uIntensity.value = (s.light ? 0.35 : 0.45) * (1 + state.boost);
    dustUniforms.uSpread.value = (s.roadWidth * 2 + s.medianWidth) * 5;

    roadUniforms.uWidth.value = s.roadWidth * 2 + s.medianWidth + 3;
    roadUniforms.uRoadWidth.value = s.roadWidth;
    roadUniforms.uMedian.value = s.medianWidth;
    roadUniforms.uLanes.value = s.lanes;
    roadUniforms.uOpacity.value = s.roadOpacity;
    roadMaterial.depthWrite = s.roadOpacity > 0.5;

    const fovTarget = reduce
      ? s.fov
      : s.fov + (s.boostFov - s.fov) * state.boost;
    state.fovVelocity +=
      ((fovTarget - state.fov) * 90 - state.fovVelocity * 13) * dt;
    state.fov += state.fovVelocity * dt;
    camera.fov = state.fov;
    shared.uPixel.value =
      (2 * Math.tan((state.fov * Math.PI) / 360)) /
      Math.max(1, renderer.domElement.height);

    const steerBlend = 1 - Math.exp(-dt / 0.35);
    const follow = s.interactive ? s.steer : 0;
    state.steerX += (state.pointerX * follow - state.steerX) * steerBlend;
    state.steerY += (state.pointerY * follow - state.steerY) * steerBlend;
    camera.position.set(
      state.steerX * s.roadWidth * 0.45,
      8 - state.steerY * 2.5,
      -5,
    );

    const looks = lookShapes(shared.uTime.value, s.curvature);
    const straight = 1 - w.reduce((sum, weight) => sum + weight, 0);
    lookTarget.set(0, 0, -10 * straight);
    for (const [index, look] of looks.entries()) {
      const weight = w[index]!;
      lookTarget.x += look[0] * weight;
      lookTarget.y += look[1] * weight;
      lookTarget.z += look[2] * weight;
    }
    lookTarget.x += state.steerX * 2.5;
    lookTarget.add(camera.position);
    camera.lookAt(lookTarget);
    camera.updateProjectionMatrix();

    renderer.setRenderTarget(null);
    renderer.setClearColor(clearColor, clearAlpha);
    renderer.clear();
    renderer.render(scene, camera);

    if (s.glow > 0) {
      const first = levels[0]!;
      const pixel = shared.uPixel.value;
      shared.uPixel.value = pixel * (renderer.domElement.height / first.height);
      camera.layers.set(1);
      roadMaterial.colorWrite = false;
      renderer.setRenderTarget(first);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, camera);
      roadMaterial.colorWrite = true;
      camera.layers.set(0);
      shared.uPixel.value = pixel;
      for (let i = 1; i < levels.length; i++) {
        pass(down, levels[i - 1]!, levels[i]!);
      }
      for (let i = levels.length - 1; i > 1; i--) {
        pass(up, levels[i]!, levels[i - 1]!);
      }
      bloom.uniforms.uStrength.value = s.glow * (s.light ? 0.5 : 1.4);
      bloom.uniforms.uCeiling.value = s.glow * (s.light ? 0.3 : 0.5);
      pass(bloom, levels[1]!, null);
    }

    if (state.visible) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf || !alive || !state.visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    for (const [index, target] of levels.entries()) {
      target.setSize(
        Math.max(1, Math.round(width / 2 ** (index + 1))),
        Math.max(1, Math.round(height / 2 ** (index + 1))),
      );
    }
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    wake();
  };

  resize();

  return {
    resize,
    setVisible(visible) {
      state.visible = visible;
      if (visible) wake();
    },
    setHeld(held) {
      state.held = held;
    },
    setPointer(x, y) {
      state.pointerX = x;
      state.pointerY = y;
    },
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      for (const item of disposables) item.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
