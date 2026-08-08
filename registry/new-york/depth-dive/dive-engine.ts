import * as THREE from 'three';
import type {
  DepthDiveConfig,
  DepthDiveHandle,
  DepthDiveHudRefs,
} from './types';
import { hash01, parseSections, renderSection } from './dive-text';

/** Distance ahead of the camera where planes finish dissolving. */
const NEAR_EDGE = 0.07;
/** Background quad distance. */
const BG_DIST = 300;

const NOISE_GLSL = /* glsl */ `
float dd_hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float dd_noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dd_hash(i), dd_hash(i + vec2(1.0, 0.0)), u.x),
    mix(dd_hash(i + vec2(0.0, 1.0)), dd_hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
float dd_fbm(vec2 p) {
  return dd_noise(p) * 0.55 +
    dd_noise(p * 2.3 + vec2(11.3, 7.9)) * 0.3 +
    dd_noise(p * 5.1 + vec2(3.7, 19.1)) * 0.15;
}
`;

const PLANE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/*
 * Section plane: the canvas texture packs body text in RED and the heading
 * in GREEN. Three taps with velocity-driven offsets colorize the channels
 * (chromatic aberration), a two-octave noise field gates the pass-through
 * dissolve, and a band-pass on that same field draws the burning edge.
 */
const PLANE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform float uTime;
uniform float uVel;
uniform float uRgbShift;
uniform float uRgbShiftVel;
uniform float uWarmth;
uniform float uWobble;
uniform float uDepthTint;
uniform vec3 uTextColor;
uniform vec3 uHeadingColor;
uniform vec3 uAccent;
uniform vec3 uAccent2;
uniform float uFog;
uniform float uDiss;
uniform float uAct;
uniform float uFar;
uniform float uSeed;
${NOISE_GLSL}
void main() {
  float wobX = sin(vUv.y * 15.0 + uTime * 1.4) * uWobble;
  float wobY = sin(vUv.x * 21.0 - uTime * 1.1) * uWobble * 0.7;
  vec2 c = vec2(vUv.x + wobX, 1.0 - (vUv.y + wobY));
  float speed = abs(uVel);
  float shift = uRgbShift + speed * uRgbShiftVel + uDiss * 0.012 + uAct * 0.004;
  vec2 off = (c - 0.5) * shift;
  vec4 tapA = texture2D(uMap, c + off);
  vec4 tapB = texture2D(uMap, c + off * uWarmth);
  vec4 tapC = texture2D(uMap, c - off);
  float g = dd_noise(c * vec2(9.0, 5.0) + uSeed) * 0.65 +
    dd_noise(c * vec2(27.0, 15.0) + uSeed) * 0.35;
  float th = uDiss * 1.15 - 0.1;
  float keep = smoothstep(th, th + 0.09, g);
  float edge = smoothstep(th, th + 0.16, g) *
    (1.0 - smoothstep(th + 0.16, th + 0.34, g));
  vec3 col = vec3(
    uTextColor.r * tapA.r + uHeadingColor.r * tapA.g,
    uTextColor.g * tapB.r + uHeadingColor.g * tapB.g,
    uTextColor.b * tapC.r + uHeadingColor.b * tapC.g
  );
  float density = max(tapB.r, tapB.g);
  col = mix(col, uAccent2 * 0.8 * density, uFar * uDepthTint);
  col = col * keep * uFog;
  vec3 glow = mix(uAccent, vec3(1.0, 0.9, 0.75), 0.35);
  col += glow * edge * density * uAct * uFog;
  gl_FragColor = vec4(col, 1.0);
}
`;

/*
 * Background: bgColor with optional psychedelic tunnel (domain-warped fbm
 * swirl phased by scroll), radial star streaks, then vignette, scanlines
 * and animated grain. With tunnel/stars at 0 it reduces to the grainy
 * near-black of the reference's default look.
 */
const BG_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uScroll;
uniform float uAspect;
uniform float uResY;
uniform float uTunnel;
uniform float uTwist;
uniform float uTunnelSpeed;
uniform float uPsy;
uniform float uHueDrift;
uniform float uStars;
uniform float uStreakBright;
uniform float uStreakTail;
uniform float uGrain;
uniform float uVignette;
uniform float uScanlines;
uniform vec3 uBg;
uniform vec3 uAccent;
uniform vec3 uAccent2;
${NOISE_GLSL}
void main() {
  const float TAU = 6.28318530718;
  vec2 t = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.0;
  float r = length(t);
  float ang = atan(t.y, t.x) / TAU + 0.5;
  float p = abs(ang - 0.5);
  float depth = 1.6 / (r + 0.16);
  float h = depth + uScroll * uTunnelSpeed * 1.1 + uTime * 0.22;
  float g = p + h * uTwist * 0.016 + uTime * 0.01;
  float n = dd_fbm(vec2(g * 6.0, h * 0.42));
  float hue = h * 0.055 + uTime * uHueDrift + n * 0.35;
  vec3 rainbow = cos((hue + vec3(0.0, 0.333, 0.667)) * TAU) * 0.5 + 0.5;
  vec3 duo = mix(uAccent2, uAccent, sin(hue * TAU) * 0.5 + 0.5);
  vec3 tint = mix(duo, rainbow, uPsy);
  float pulse = sin(h * 2.4) * 0.5 + 0.5;
  float mask = smoothstep(0.12, 0.8, r);
  vec3 col = uBg +
    tint * (n * n * n * (pulse * 0.5 + 0.5)) * uTunnel * mask * 0.75;
  float lane = p * 160.0;
  float laneId = floor(lane);
  float laneFrac = abs(fract(lane) - 0.5);
  float seed = dd_hash(vec2(laneId, 7.31));
  float gate = step(0.72, dd_hash(vec2(laneId, 3.77)));
  float travel = fract(
    depth * 0.5 * (seed * 0.7 + 0.6) +
    uScroll * uTunnelSpeed * 0.5 + uTime * 0.05 + seed * 9.0
  );
  float tail = pow(max(1.0 - travel, 0.0), uStreakTail);
  float lineMask = smoothstep(0.22, 0.0, laneFrac);
  float streak = gate * lineMask * tail * smoothstep(0.12, 0.5, r) * uStars;
  col += mix(vec3(1.0), tint, 0.55) * streak * uStreakBright;
  float vig = max(1.0 - dot(t, t) * uVignette * 0.16, 0.0);
  float scan = 1.0 -
    (sin(vUv.y * uResY * 3.14159265) * 0.5 + 0.5) * uScanlines * 0.3;
  float grain = fract(
    sin(dot(vUv * uResY + fract(uTime) * 7.13, vec2(12.9898, 78.233))) *
    43758.5453
  );
  col = col * vig * scan + (grain - 0.5) * uGrain * 0.14;
  gl_FragColor = vec4(col, 1.0);
}
`;

interface Layer {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  tex: THREE.CanvasTexture;
  hRatio: number;
  lastAbs: number;
  offX: number;
  offY: number;
  rot: number;
}

export function createDepthDive(
  container: HTMLElement,
  hud: DepthDiveHudRefs,
): DepthDiveHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 600);

  let config: DepthDiveConfig | null = null;
  let layers: Layer[] = [];
  let disposed = false;
  let booted = false;
  let visible = true;
  let hintDismissed = false;
  let counterText = '';
  let textKey = '';
  let buildId = 0;

  const size = {
    w: container.clientWidth || 1,
    h: container.clientHeight || 1,
  };
  let target = 0;
  let smooth = 0;
  let velocity = 0;
  let lastTime = performance.now();
  let pointerX = 0;
  let pointerY = 0;
  let swayX = 0;
  let swayY = 0;

  const reducedMotionQuery = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  );
  let reducedMotion = reducedMotionQuery.matches;
  const onMotionChange = () => {
    reducedMotion = reducedMotionQuery.matches;
  };
  reducedMotionQuery.addEventListener('change', onMotionChange);

  const planeGeo = new THREE.PlaneGeometry(1, 1);

  const bgUniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uAspect: { value: 1 },
    uResY: { value: 1000 },
    uTunnel: { value: 0 },
    uTwist: { value: 0 },
    uTunnelSpeed: { value: 0 },
    uPsy: { value: 0 },
    uHueDrift: { value: 0 },
    uStars: { value: 0 },
    uStreakBright: { value: 0 },
    uStreakTail: { value: 7 },
    uGrain: { value: 0.34 },
    uVignette: { value: 0.25 },
    uScanlines: { value: 0.48 },
    uBg: { value: new THREE.Color('#05030a') },
    uAccent: { value: new THREE.Color('#000000') },
    uAccent2: { value: new THREE.Color('#7b5cff') },
  };
  const bgMat = new THREE.ShaderMaterial({
    vertexShader: PLANE_VERT,
    fragmentShader: BG_FRAG,
    uniforms: bgUniforms,
    depthWrite: false,
    depthTest: false,
  });
  const bgMesh = new THREE.Mesh(planeGeo, bgMat);
  bgMesh.position.z = -BG_DIST;
  bgMesh.renderOrder = -1;
  bgMesh.frustumCulled = false;
  scene.add(bgMesh);

  const sectionCount = () => Math.max(1, layers.length);

  const clampTarget = () => {
    if (config && !config.infinite) {
      target = Math.min(sectionCount() - 1, Math.max(0, target));
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const speed = config?.scrollSpeed ?? 1;
    target += (e.deltaY / size.h) * speed * 1.4;
    clampTarget();
  };
  container.addEventListener('wheel', onWheel, { passive: false });

  let dragging = false;
  let dragY = 0;
  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    dragY = e.clientY;
    container.setPointerCapture(e.pointerId);
    container.style.cursor = 'grabbing';
  };
  const onPointerMove = (e: PointerEvent) => {
    pointerX = (e.clientX / size.w - 0.5) * 2;
    pointerY = (e.clientY / size.h - 0.5) * 2;
    if (!dragging) return;
    const dy = e.clientY - dragY;
    dragY = e.clientY;
    const speed = config?.scrollSpeed ?? 1;
    target -= (dy / size.h) * speed * 2;
    clampTarget();
  };
  const onPointerUp = () => {
    dragging = false;
    container.style.cursor = 'grab';
  };
  container.style.cursor = 'grab';
  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerup', onPointerUp);
  container.addEventListener('pointercancel', onPointerUp);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!visible) return;
    const t = e.target as HTMLElement | null;
    if (
      t &&
      (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
    ) {
      return;
    }
    if (e.code === 'ArrowDown' || e.code === 'PageDown') {
      e.preventDefault();
      target += 0.5;
    } else if (e.code === 'ArrowUp' || e.code === 'PageUp') {
      e.preventDefault();
      target -= 0.5;
    } else if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      target = Math.round(smooth) + (e.shiftKey ? -1 : 1);
    } else {
      return;
    }
    clampTarget();
  };
  window.addEventListener('keydown', onKeyDown);

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    size.w = w;
    size.h = h;
    const cap = config?.renderScale ?? 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    renderer.setSize(w, h, false);
    bgUniforms.uAspect.value = w / h;
    bgUniforms.uResY.value = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(() => {
    if (booted) resize();
  });
  resizeObserver.observe(container);

  const intersectionObserver = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  });
  intersectionObserver.observe(container);

  const clearLayers = () => {
    for (const layer of layers) {
      scene.remove(layer.mesh);
      layer.mat.dispose();
      layer.tex.dispose();
    }
    layers = [];
  };

  const buildLayers = async (cfg: DepthDiveConfig) => {
    const id = ++buildId;
    try {
      await document.fonts.load(`${cfg.fontWeight} 20px "${cfg.fontFamily}"`);
      await document.fonts.load(`500 20px "${cfg.fontFamily}"`);
      await document.fonts.ready;
    } catch {
      // canvas falls back to sans-serif
    }
    if (disposed || id !== buildId) return;
    const sections = parseSections(cfg.text);
    const next: Layer[] = [];
    for (const section of sections) {
      const canvas = renderSection(section, cfg);
      const tex = new THREE.CanvasTexture(canvas);
      tex.flipY = false;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.anisotropy = 4;
      const mat = new THREE.ShaderMaterial({
        vertexShader: PLANE_VERT,
        fragmentShader: PLANE_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uMap: { value: tex },
          uTime: { value: 0 },
          uVel: { value: 0 },
          uRgbShift: { value: cfg.rgbShift },
          uRgbShiftVel: { value: cfg.rgbShiftVel },
          uWarmth: { value: cfg.rgbShiftWarmth },
          uWobble: { value: cfg.wobble },
          uDepthTint: { value: cfg.depthTint },
          uTextColor: { value: new THREE.Color(cfg.textColor) },
          uHeadingColor: { value: new THREE.Color(cfg.headingColor) },
          uAccent: { value: new THREE.Color(cfg.accentColor) },
          uAccent2: { value: new THREE.Color(cfg.accentColor2) },
          uFog: { value: 0 },
          uDiss: { value: 0 },
          uAct: { value: 0 },
          uFar: { value: 0 },
          uSeed: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.frustumCulled = false;
      mesh.visible = false;
      scene.add(mesh);
      next.push({
        mesh,
        mat,
        tex,
        hRatio: canvas.height / canvas.width,
        lastAbs: Number.NaN,
        offX: 0,
        offY: 0,
        rot: 0,
      });
    }
    clearLayers();
    layers = next;
    clampTarget();
  };

  const sync = (cfg: DepthDiveConfig) => {
    const prev = config;
    config = cfg;
    bgUniforms.uTunnel.value = cfg.tunnel;
    bgUniforms.uTwist.value = cfg.tunnelTwist;
    bgUniforms.uTunnelSpeed.value = cfg.tunnelSpeed;
    bgUniforms.uPsy.value = cfg.psychedelia;
    bgUniforms.uHueDrift.value = cfg.hueDrift;
    bgUniforms.uStars.value = cfg.stars;
    bgUniforms.uGrain.value = cfg.grain;
    bgUniforms.uVignette.value = cfg.vignette;
    bgUniforms.uScanlines.value = cfg.scanlines;
    (bgUniforms.uBg.value as THREE.Color).set(cfg.bgColor);
    (bgUniforms.uAccent.value as THREE.Color).set(cfg.accentColor);
    (bgUniforms.uAccent2.value as THREE.Color).set(cfg.accentColor2);
    for (const layer of layers) {
      layer.mat.uniforms.uRgbShift!.value = cfg.rgbShift;
      layer.mat.uniforms.uRgbShiftVel!.value = cfg.rgbShiftVel;
      layer.mat.uniforms.uWarmth!.value = cfg.rgbShiftWarmth;
      layer.mat.uniforms.uWobble!.value = cfg.wobble;
      layer.mat.uniforms.uDepthTint!.value = cfg.depthTint;
      (layer.mat.uniforms.uTextColor!.value as THREE.Color).set(cfg.textColor);
      (layer.mat.uniforms.uHeadingColor!.value as THREE.Color).set(
        cfg.headingColor,
      );
      (layer.mat.uniforms.uAccent!.value as THREE.Color).set(cfg.accentColor);
      (layer.mat.uniforms.uAccent2!.value as THREE.Color).set(cfg.accentColor2);
    }
    if (booted && prev && prev.renderScale !== cfg.renderScale) resize();
    const key = JSON.stringify([
      cfg.text,
      cfg.fontFamily,
      cfg.fontWeight,
      cfg.fontSize,
      cfg.headingSize,
      cfg.lineHeight,
      cfg.letterSpacing,
      cfg.sideMargin,
      cfg.uppercase,
    ]);
    if (key !== textKey) {
      textKey = key;
      void buildLayers(cfg);
    }
  };

  const frame = () => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (!visible || !config) return;
    const cfg = config;

    if (!reducedMotion && !dragging) {
      target += cfg.autoScroll * dt;
      clampTarget();
    }
    const ease = 1 - (1 - Math.min(0.99, cfg.damping)) ** (dt * 60);
    const prevSmooth = smooth;
    smooth += (target - smooth) * ease;
    const rawVel = (smooth - prevSmooth) / Math.max(dt, 1e-4);
    velocity += (rawVel - velocity) * Math.min(1, dt * 8);
    const speed = Math.min(Math.abs(velocity), 3);

    bgUniforms.uScroll.value = smooth;
    bgUniforms.uTime.value += dt;
    bgUniforms.uStreakTail.value = 1.4 + 6.5 / (1 + speed * 3);
    bgUniforms.uStreakBright.value = cfg.streaks * (0.18 + speed * 0.55);

    const fov = cfg.fov + (reducedMotion ? 0 : speed * cfg.warp);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    swayX += (pointerX - swayX) * Math.min(1, dt * 3);
    swayY += (pointerY - swayY) * Math.min(1, dt * 3);
    camera.position.set(swayX * cfg.sway, -swayY * cfg.sway * 0.6, 0);
    camera.lookAt(
      swayX * cfg.sway * 0.35,
      -swayY * cfg.sway * 0.2,
      -cfg.layerGap * 2,
    );

    const bgSize = 2 * BG_DIST * Math.tan((camera.fov * Math.PI) / 360) * 1.35;
    bgMesh.scale.set(bgSize * Math.max(camera.aspect, 1), bgSize, 1);

    const frustumW =
      2 *
      cfg.layerGap *
      Math.tan((cfg.fov * Math.PI) / 360) *
      camera.aspect *
      cfg.fill;
    const maxH = 2 * cfg.layerGap * Math.tan((cfg.fov * Math.PI) / 360) * 0.86;
    const count = layers.length;
    for (let i = 0; i < count; i++) {
      const layer = layers[i]!;
      const rel = i - smooth;
      const wraps = cfg.infinite ? Math.ceil((-0.75 - rel) / count) : 0;
      const o = rel + count * wraps;
      const show = o > NEAR_EDGE - 0.05 && o < cfg.fogFar + 0.3;
      layer.mesh.visible = show;
      if (!show) continue;
      const abs = i + count * wraps;
      if (abs !== layer.lastAbs) {
        layer.lastAbs = abs;
        layer.offX = (hash01(abs * 13.7 + 1.3) - 0.5) * 2;
        layer.offY = (hash01(abs * 27.9 + 5.1) - 0.5) * 2;
        layer.rot = (hash01(abs * 7.3 + 9.7) - 0.5) * 2;
        layer.mat.uniforms.uSeed!.value = hash01(abs * 3.1 + 0.7) * 37;
      }
      let w = frustumW;
      if (w * layer.hRatio > maxH) w = maxH / layer.hRatio;
      layer.mesh.scale.set(w, w * layer.hRatio, 1);
      layer.mesh.position.set(
        layer.offX * cfg.scatter * frustumW * 0.35,
        layer.offY * cfg.scatter * frustumW * 0.16,
        -o * cfg.layerGap,
      );
      layer.mesh.rotation.z =
        layer.rot * cfg.tilt * (Math.PI / 180) +
        Math.sin(bgUniforms.uTime.value * 0.3 + i * 2.1) * 0.015;

      const fog =
        1 -
        Math.min(
          1,
          Math.max(
            0,
            (o - cfg.fogNear) / Math.max(cfg.fogFar - cfg.fogNear, 0.01),
          ),
        );
      const diss =
        1 -
        Math.min(
          1,
          Math.max(
            0,
            (o - NEAR_EDGE) / Math.max(cfg.dissolveStart - NEAR_EDGE, 0.01),
          ),
        );
      layer.mat.uniforms.uFog!.value = fog * fog * fog;
      layer.mat.uniforms.uDiss!.value = diss;
      layer.mat.uniforms.uAct!.value =
        diss *
        (1 - diss) *
        4 *
        (0.75 + 0.25 * Math.sin(bgUniforms.uTime.value * 13 + i * 5));
      layer.mat.uniforms.uFar!.value = Math.min(
        1,
        Math.max(0, (o - 1) / Math.max(cfg.fogFar - 1, 0.01)),
      );
      layer.mat.uniforms.uTime!.value = bgUniforms.uTime.value;
      layer.mat.uniforms.uVel!.value = Math.max(-3, Math.min(3, velocity));
    }

    if (hud.counter && count > 0) {
      const idx = ((Math.round(smooth) % count) + count) % count;
      const text = `${String(idx + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
      if (text !== counterText) {
        counterText = text;
        hud.counter.textContent = text;
      }
    }
    if (hud.bar && count > 0) {
      const frac = (((smooth % count) + count) % count) / count;
      hud.bar.style.transform = `scaleY(${frac})`;
    }
    if (!hintDismissed && hud.hint && Math.abs(smooth) > 0.4) {
      hintDismissed = true;
      hud.hint.style.opacity = '0';
    }
    renderer.render(scene, camera);
  };

  booted = true;
  resize();
  renderer.setAnimationLoop(frame);

  return {
    sync,
    dispose: () => {
      disposed = true;
      buildId++;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      reducedMotionQuery.removeEventListener('change', onMotionChange);
      window.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      clearLayers();
      bgMat.dispose();
      planeGeo.dispose();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
