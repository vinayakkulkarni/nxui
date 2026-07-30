import * as THREE from 'three';
import { animate } from 'motion-v';
import type {
  LiquidGlassCarouselCallbacks,
  LiquidGlassCarouselHandle,
  LiquidGlassCarouselOptions,
} from './types';

// GSAP eases from the original, expressed as cubic-beziers.
const EASE_POWER3_OUT: [number, number, number, number] = [
  0.215, 0.61, 0.355, 1,
];
const EASE_POWER4_OUT: [number, number, number, number] = [
  0.165, 0.84, 0.44, 1,
];
const EASE_POWER3_IN_OUT: [number, number, number, number] = [
  0.645, 0.045, 0.355, 1,
];
const EASE_POWER2_IN_OUT: [number, number, number, number] = [
  0.455, 0.03, 0.515, 0.955,
];
const EASE_EXPO_IN_OUT: [number, number, number, number] = [1, 0, 0, 1];

interface Tween {
  stop: () => void;
}

/**
 * The carousel engine: an infinite flat row of image panels rendered into an
 * offscreen buffer, then drawn to screen through the liquid-glass lens
 * shader. Framework-agnostic — the Vue component only mounts it and listens
 * to the callbacks.
 */
export function createCarousel(
  mount: HTMLElement,
  options: LiquidGlassCarouselOptions,
  callbacks: LiquidGlassCarouselCallbacks = {},
): LiquidGlassCarouselHandle {
  const {
    items: PROJECTS,
    config: CONFIG,
    lens: LENS,
    focus: FOCUS,
    entry: ENTRY,
  } = options;
  const {
    cursorElement = null,
    onActiveChange = () => {},
    onFocusChange = () => {},
    onEntryDone = () => {},
  } = callbacks;

  let W = mount.clientWidth;
  let H = mount.clientHeight;

  // ---- renderer / scene / camera (orthographic, 1 unit = 1 px) ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor('#ffffff', 1); // match page bg so FBO gaps blend
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    -W / 2,
    W / 2,
    H / 2,
    -H / 2,
    -100,
    100,
  );
  camera.position.z = 10;

  // ---- load the source images (textures + measured aspect) ----
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  interface Source {
    tex: THREE.Texture | null;
    aspect: number;
    locked: boolean;
  }
  const sources: Source[] = PROJECTS.map((img) => {
    const s: Source = {
      tex: null,
      aspect: img.aspect ?? 1,
      locked: img.aspect != null,
    };
    loader.load(img.src, (tex) => {
      // mipmaps + anisotropy keep panels crisp while they render small
      // (the entry animation starts them at ~80px tall)
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.colorSpace = THREE.SRGBColorSpace;
      if (!s.locked && tex.image) s.aspect = tex.image.width / tex.image.height;
      s.tex = tex;
      // aspect is now known -> rebuild slot offsets so spacing matches widths,
      // and re-center the row while the user hasn't scrolled yet
      recomputeTotal();
      if (!userInteracted) {
        scroll = centerForIndex(0);
        target = scroll;
      }
    });
    return s;
  });

  // width of one slot: height is fixed (panelH), so width = aspect * panelH + gap
  function slotWidth(srcIndex: number) {
    return sources[srcIndex]!.aspect * CONFIG.panelH + CONFIG.gap;
  }

  // cumulative x of each source's slot, and the total loop width
  let offsets: number[] = [];
  let totalWidth = 0;
  function recomputeTotal() {
    offsets = [];
    let acc = 0;
    for (let i = 0; i < sources.length; i++) {
      offsets.push(acc);
      acc += slotWidth(i);
    }
    totalWidth = acc;
  }
  recomputeTotal();

  // scroll value that puts panel `idx` dead-center. idx is an unbounded
  // integer (loop k, source = idx mod N) so focus / click / entry can aim
  // at an exact panel copy.
  function centerForIndex(idx: number) {
    const N = sources.length;
    const loop = Math.floor(idx / N);
    const s = ((idx % N) + N) % N;
    return offsets[s]! + slotWidth(s) / 2 - CONFIG.gap / 2 + loop * totalWidth;
  }

  // integer index (including loop) whose center is closest to `value`
  function nearestIndex(value: number) {
    if (!totalWidth) return 0;
    const N = sources.length;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < N; i++) {
      const center = offsets[i]! + slotWidth(i) / 2 - CONFIG.gap / 2;
      const k = Math.round((value - center) / totalWidth);
      const dist = Math.abs(center + k * totalWidth - value);
      if (dist < bestDist) {
        bestDist = dist;
        best = i + k * N;
      }
    }
    return best;
  }

  // which source index is closest to screen center (for the overlay text)
  function centerIndex(value: number) {
    if (!totalWidth) return 0;
    let bestI = 0;
    let bestDist = Infinity;
    for (let i = 0; i < sources.length; i++) {
      const center = offsets[i]! + slotWidth(i) / 2 - CONFIG.gap / 2;
      const k = Math.round((value - center) / totalWidth);
      const dist = Math.abs(center + k * totalWidth - value);
      if (dist < bestDist) {
        bestDist = dist;
        bestI = i;
      }
    }
    return bestI;
  }
  let lastCenter = -1;

  // ---- mesh pool ----
  // REPEATS copies of the whole image set so wide screens never run dry.
  const REPEATS = 4;
  interface PoolEntry {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    srcIndex: number;
    bound?: boolean;
  }
  const pool: PoolEntry[] = [];
  for (let r = 0; r < REPEATS; r++) {
    for (let i = 0; i < sources.length; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: '#dddddd',
        transparent: true,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), mat);
      mesh.visible = false;
      scene.add(mesh);
      pool.push({ mesh, mat, srcIndex: i });
    }
  }

  // ---- scroll state ----
  let scroll = centerForIndex(0); // current (image 01 centered)
  let target = scroll; // desired
  let userInteracted = false; // true once the user scrolls (stops auto-recenter)
  let prevScroll = 0;
  let scrollEnergy = 0; // smoothed 0..1 scroll activity, drives panel shrink
  let pendingFocus: { srcIndex: number } | null = null;
  let lastWheelAt = 0;
  let snapArmed = false; // wheel input arms the settle-snap; it fires once

  // ---- liquid-glass lens: FBO + fullscreen pass ----
  // The carousel renders into rt at device resolution (CSS-sized would render
  // at 1x and upscale — blurry on retina); a fullscreen quad then samples it
  // through the lens shader.
  const dpr = renderer.getPixelRatio();
  const rt = new THREE.WebGLRenderTarget(W * dpr, H * dpr);
  const lensScene = new THREE.Scene();
  const lensCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const lensUniforms: Record<string, THREE.IUniform> = {
    uTex: { value: rt.texture },
    uRes: { value: new THREE.Vector2(W * dpr, H * dpr) },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uSizeX: { value: LENS.sizeX },
    uSizeY: { value: LENS.sizeY },
    uShape: { value: LENS.shape === 'square' ? 1 : 0 },
    uSquareRound: { value: LENS.squareRound },
    uRotation: { value: 0 },
    uAspect: { value: W / H },
    uZoom: { value: LENS.zoom },
    uDispersion: { value: LENS.dispersion },
    uBlur: { value: LENS.blur },
    uGlow: { value: LENS.glow },
    uWhiteGlow: { value: LENS.whiteGlow },
    uNovaSize: { value: LENS.novaSize },
    uBlueRing: { value: LENS.blueRing },
    uRingRadius: { value: LENS.ringRadius },
    uRingWidth: { value: LENS.ringWidth },
    uShimmer: { value: LENS.shimmer ? 1 : 0 },
    uShimmerFreq: { value: LENS.shimmerFreq },
    uShimmerSpeed: { value: LENS.shimmerSpeed },
    uShimmerDepth: { value: LENS.shimmerDepth },
    uTime: { value: 0 },
    uRimStart: { value: LENS.rimStart },
    uRimTangential: { value: LENS.rimTangential },
    uRimInward: { value: LENS.rimInward },
    uRimFreq1: { value: LENS.rimFreq1 },
    uRimFreq2: { value: LENS.rimFreq2 },
    uBlueColor: { value: new THREE.Color(LENS.blueColor) },
    uRimLine: { value: LENS.rimLine },
    uRimLinePos: { value: LENS.rimLinePos },
    uRimLineWidth: { value: LENS.rimLineWidth },
    uVignette: { value: LENS.vignette },
    uVignetteSize: { value: LENS.vignetteSize },
    uSamples: { value: LENS.samples },
  };
  const lensMat = new THREE.ShaderMaterial({
    uniforms: lensUniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      #define PI 3.14159265
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTex;
      uniform vec2  uRes;
      uniform vec2  uCenter;
      uniform float uSizeX;         // half-width (height-fraction units)
      uniform float uSizeY;         // half-height (height-fraction units)
      uniform float uAspect;        // W/H
      uniform float uZoom;
      uniform float uDispersion;
      uniform float uBlur;
      uniform float uGlow;
      uniform float uWhiteGlow;
      uniform float uNovaSize;
      uniform float uBlueRing;
      uniform float uRingRadius;
      uniform float uRingWidth;
      uniform float uShimmer;
      uniform float uShimmerFreq;
      uniform float uShimmerSpeed;
      uniform float uShimmerDepth;
      uniform float uTime;
      uniform float uRimStart;
      uniform float uRimTangential;
      uniform float uRimInward;
      uniform float uRimFreq1;
      uniform float uRimFreq2;
      uniform vec3  uBlueColor;
      uniform float uRimLine;
      uniform float uRimLinePos;
      uniform float uRimLineWidth;
      uniform float uVignette;     // overall vignette strength (0 = off)
      uniform float uVignetteSize; // radius where vignette begins
      uniform float uShape;        // 0 = circle, 1 = square
      uniform float uSquareRound;  // corner rounding for square (0..1)
      uniform float uRotation;     // lens rotation in radians
      uniform int   uSamples;

      const int MAX_SAMPLES = 16;

      // rounded-box signed distance (negative inside)
      float sdRoundBox(vec2 p, vec2 b, float r){
        vec2 q = abs(p) - b + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
      }

      // Evaluate the disc lens centered at 'center' (screen-UV). Returns the
      // lensed color; 'outA' = how opaque this lens is here (0 outside disc).
      vec3 discLens(vec2 center, float aspectCorrect, out float outA) {
        // local coords, aspect-corrected so x/y are in the same screen units
        vec2 p = (vUv - center);
        p.x *= aspectCorrect;
        // rotate local space so the rect + all internals spin together
        float ca = cos(uRotation), sa = sin(uRotation);
        p = mat2(ca, -sa, sa, ca) * p;
        vec2 halfSize = vec2(uSizeX, uSizeY);
        // elliptical distance: 0 center .. 1 boundary
        float dist = length(p / halfSize);
        outA = 0.0;

        // mask shape: ellipse OR rounded rect, drives the cutoff.
        // maskND: 0 inside .. 1 at the shape boundary (>1 outside).
        float maskND;
        if (uShape > 0.5) {
          float corner = min(uSizeX, uSizeY) * clamp(uSquareRound, 0.0, 1.0);
          float sd = sdRoundBox(p, halfSize, corner);
          maskND = 1.0 + sd / min(uSizeX, uSizeY);
        } else {
          maskND = dist;
        }
        if (maskND > 1.0) return vec3(0.0);

        // shapeND: 0 center .. 1 boundary, following the chosen shape. Used by
        // nova / ring / border so they take the SAME shape.
        float shapeND = clamp(maskND, 0.0, 1.0);

        // deflection uses the elliptical radial nd so it bends smoothly from
        // the center even when the boundary is rectangular
        float nd = clamp(dist, 0.0, 1.0);
        vec2  offset = vUv - center;
        vec2  radialDir = normalize(offset + 1e-6);
        vec2  tangentDir = vec2(-radialDir.y, radialDir.x);
        // angle measured in ROTATED local space so the rim wave/shimmer spin too
        float angle = atan(p.y, p.x);

        // inward pull + fluid rim waves
        float pull = uZoom * 0.30 * (nd * nd);
        float rimStrength = smoothstep(uRimStart, 1.0, nd);
        float fluidWave = sin(angle * uRimFreq1) * 0.55 + sin(angle * uRimFreq2) * 0.25;
        float rScreen = (uSizeX + uSizeY) * 0.5;
        vec2  rimOff = tangentDir * fluidWave * rimStrength * rScreen * uRimTangential;
        vec2  rimPull = -radialDir * rimStrength * rScreen * uRimInward;

        vec2 baseUV = center + offset * (1.0 - pull) + rimOff + rimPull;

        // chromatic dispersion (weighted multi-sample, per-channel normalized)
        float rimMask = smoothstep(0.55, 1.0, nd);
        vec2  dispDir = offset * uDispersion * 0.004 * rimMask;
        int N = uSamples;
        if (N < 2) N = 2;
        if (N > MAX_SAMPLES) N = MAX_SAMPLES;
        vec3 col = vec3(0.0);
        vec3 caW = vec3(0.0);
        for (int i = 0; i < MAX_SAMPLES; i++) {
          if (i >= N) break;
          float t = float(i) / float(N - 1);
          vec2 sUV = baseUV + dispDir * (t - 0.5);
          vec3 s = texture2D(uTex, sUV).rgb;
          vec3 w = vec3(
            exp(-pow((t - 0.00) / 0.38, 2.0)),
            exp(-pow((t - 0.50) / 0.38, 2.0)),
            exp(-pow((t - 1.00) / 0.38, 2.0))
          );
          col += s * w;
          caW += w;
        }
        col /= max(caW, vec3(0.001));

        // optional blur near the rim
        float blurFade = 1.0 - smoothstep(0.72, 0.98, nd);
        if (uBlur > 0.01 && blurFade > 0.01) {
          vec2 blurRad = vec2(uBlur) / uRes * blurFade;
          vec3 bcol = vec3(0.0);
          float btw = 0.0;
          for (float a = 0.0; a < PI * 2.0; a += PI * 2.0 / 6.0) {
            for (float rr = 0.4; rr <= 1.001; rr += 0.3) {
              vec2 o = vec2(cos(a), sin(a)) * blurRad * rr;
              float w = 1.0 - rr * 0.38;
              bcol += texture2D(uTex, baseUV + o).rgb * w;
              btw += w;
            }
          }
          col = mix(bcol / btw, col, rimMask);
        }

        // glassy darkening toward center
        col *= mix(0.91, 1.0, smoothstep(0.0, 0.38, shapeND));

        // white nova glow at center
        float r2 = shapeND * shapeND * 0.25;
        float gs = max(uNovaSize * uGlow * 0.003, 0.004);
        float nova = exp(-r2 / gs) + exp(-r2 / (gs * 7.0)) * 0.18;
        nova *= uWhiteGlow * (uGlow / 17.0) * 1.15;
        col += vec3(nova);

        // blue ring + aura
        float dC = shapeND * 0.5;
        float tR = clamp(uRingRadius, 0.1, 0.49);
        float rW = max(uRingWidth, 0.003);
        float ring = exp(-pow((dC - tR) / rW, 2.0));
        ring *= uBlueRing * (uGlow / 17.0) * 1.8;
        if (uShimmer > 0.5) ring *= sin(angle * uShimmerFreq + uTime * uShimmerSpeed) * uShimmerDepth + (1.0 - uShimmerDepth);
        float ringAura = exp(-pow((dC - tR) / (rW * 6.0), 2.0)) * 0.28 * uBlueRing * (uGlow / 17.0);
        col += uBlueColor * (ring + ringAura);
        // bright border line
        col += vec3(exp(-pow((dC - uRimLinePos) / max(uRimLineWidth, 0.0001), 2.0)) * uRimLine);

        // lens alpha: solid inside, soft falloff at the very edge
        outA = smoothstep(1.0, 0.93, maskND);
        return col;
      }

      void main(){
        vec3 base = texture2D(uTex, vUv).rgb;  // carousel, untouched
        vec3 outc = base;

        float a = 0.0;
        vec3 c = discLens(uCenter, uAspect, a);
        outc = mix(outc, c, a);

        // overall vignette: darken toward screen corners (aspect-correct)
        if (uVignette > 0.001) {
          vec2 vc = vUv - 0.5;
          vc.x *= uAspect;
          float d = length(vc) / max(uVignetteSize, 0.0001);
          float vig = 1.0 - uVignette * smoothstep(0.5, 1.0, d);
          outc *= clamp(vig, 0.0, 1.0);
        }

        gl_FragColor = vec4(outc, 1.0);
      }
    `,
  });
  const lensQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lensMat);
  lensScene.add(lensQuad);

  // ---- focus state ----
  // When focused, the lens props fade out (lensFx 1->0) and every panel
  // except the focused one slides down off-screen, staggered center-out.
  const focusState = {
    active: false,
    srcIndex: -1,
    poolIdx: -1,
    lensFx: ENTRY.enabled ? 0 : 1, // 0 during entry; blooms in later
  };
  const focusTweens: Tween[] = [];
  const drop: number[] = Array.from(
    { length: REPEATS * sources.length },
    () => 0,
  );
  let focusScale = 1; // eased scale-up applied to the focused panel
  const lastCenterX: (number | undefined)[] = Array.from(
    { length: REPEATS * sources.length },
    () => undefined,
  );

  // ---- entry state ----
  // pEntry[poolIdx]: 0 = below screen at startH, 1 = settled in the real row.
  const pEntry: number[] = Array.from(
    { length: REPEATS * sources.length },
    () => (ENTRY.enabled ? 0 : 1),
  );
  let entryActive = ENTRY.enabled;
  let entrySettled = false; // rise finished but panels held at small size
  const growArr: number[] = Array.from(
    { length: REPEATS * sources.length },
    () => (ENTRY.enabled ? 0 : 1),
  );
  const entryTweens: Tween[] = [];
  let entryTimers: ReturnType<typeof setTimeout>[] = [];

  function killTweens(list: Tween[]) {
    for (const t of list) t.stop();
    list.length = 0;
  }

  // lens props that fade out for focus/entry, with their full values
  const LENS_FX_KEYS = [
    'uDispersion',
    'uBlueRing',
    'uRimLine',
    'uVignette',
    'uZoom',
    'uRimTangential',
    'uRimInward',
  ];
  const lensFxFull: Record<string, number> = {};
  for (const k of LENS_FX_KEYS) lensFxFull[k] = lensUniforms[k]!.value;

  // ---- layout: place pooled meshes for the current scroll (every frame) ----
  interface PanelRect {
    left: number;
    right: number;
    top: number;
    bottom: number;
    poolIdx: number;
    srcIndex: number;
    centerX: number;
  }
  let panelRects: PanelRect[] = [];
  let centeredPanel: {
    srcIndex: number;
    centerX: number;
    wPx: number;
    h: number;
    poolIdx: number;
  } | null = null;

  function layout() {
    panelRects = [];
    centeredPanel = null;
    let centeredDist = Infinity;
    const half = W / 2;
    const buffer = CONFIG.panelH; // generous horizontal buffer
    pool.forEach((p, poolIdx) => {
      const rep = Math.floor(poolIdx / sources.length);
      const i = p.srcIndex;
      const src = sources[i]!;

      // slot center within one loop, shifted by scroll, wrapped, then pushed
      // out by this pool entry's repetition rung
      const slotCenterInLoop = offsets[i]! + slotWidth(i) / 2 - CONFIG.gap / 2;
      let x = slotCenterInLoop - scroll;
      x = ((x % totalWidth) + totalWidth) % totalWidth;
      x += (rep - Math.floor(REPEATS / 2)) * totalWidth;
      if (x > half + totalWidth) x -= totalWidth * REPEATS;

      const centerX = x;
      const inEntry = entryActive || entrySettled;
      if (!inEntry && (centerX < -half - buffer || centerX > half + buffer)) {
        p.mesh.visible = false;
        lastCenterX[poolIdx] = undefined;
        return;
      }
      lastCenterX[poolIdx] = centerX;

      // fixed size for every panel; shrink up to 25% with scroll speed
      const shrink = 1 - 0.25 * scrollEnergy;
      const h = CONFIG.panelH * shrink;
      const wPx = src.aspect * CONFIG.panelH * shrink;

      // bind texture once available
      if (src.tex && !p.bound) {
        p.mat.map = src.tex;
        p.mat.color.set('#ffffff');
        p.mat.needsUpdate = true;
        p.bound = true;
      }

      let y = 0;

      // focus: the focused panel grows and stays put, others slide down
      const isFocused = focusState.active && focusState.poolIdx === poolIdx;
      const d = drop[poolIdx] || 0;
      let drawW = wPx;
      let drawH = h;
      if (isFocused) {
        drawW = wPx * focusScale;
        drawH = h * focusScale;
      } else if (d > 0) {
        y = -d * H * FOCUS.dropDist;
      }

      p.mesh.visible = true;

      // entry: interpolate from (below screen, startH) up to the real state
      let finalX = centerX;
      let finalY = y;
      let finalW = drawW;
      let finalH = drawH;
      if (entryActive || entrySettled) {
        const pe = pEntry[poolIdx] || 0;
        const g = growArr[poolIdx] || 0;

        const curH = ENTRY.startH + (drawH - ENTRY.startH) * g;
        finalH = curH;
        finalW = curH * src.aspect;

        // constant-gap walk from the centered source, one copy per source.
        // Each slot uses ITS OWN current grow height, so a grown panel takes
        // more space and pushes neighbours outward.
        const cSrc = centerIndex(scroll);
        let di = i - cSrc;
        if (di > sources.length / 2) di -= sources.length;
        if (di < -sources.length / 2) di += sources.length;
        const N = sources.length;
        const midRep = Math.floor(REPEATS / 2);
        if (rep !== midRep) {
          p.mesh.visible = false;
          lastCenterX[poolIdx] = undefined;
          return;
        }
        const slotH = (s: number) => {
          const gg = growArr[midRep * N + s] || 0;
          return ENTRY.startH + (CONFIG.panelH - ENTRY.startH) * gg;
        };
        let off = 0;
        if (di > 0) {
          for (let k = 0; k < di; k++) {
            const sa = (((cSrc + k) % N) + N) % N;
            const sb = (((cSrc + k + 1) % N) + N) % N;
            off +=
              (sources[sa]!.aspect * slotH(sa) +
                sources[sb]!.aspect * slotH(sb)) /
                2 +
              CONFIG.gap;
          }
        } else if (di < 0) {
          for (let k = 0; k < -di; k++) {
            const sa = (((cSrc - k) % N) + N) % N;
            const sb = (((cSrc - k - 1) % N) + N) % N;
            off -=
              (sources[sa]!.aspect * slotH(sa) +
                sources[sb]!.aspect * slotH(sb)) /
                2 +
              CONFIG.gap;
          }
        }
        finalX = off;
        if (finalX < -half - buffer || finalX > half + buffer) {
          p.mesh.visible = false;
          lastCenterX[poolIdx] = undefined;
          return;
        }

        // vertical: rise from below the screen up to real y
        const below = -H * ENTRY.fromBelow;
        finalY = below + (y - below) * pe;
      }

      p.mesh.position.set(finalX, finalY, 0);
      p.mesh.scale.set(finalW, finalH, 1);

      // screen rect (px, top-left origin) for pointer hit-testing
      const sx = centerX + W / 2;
      const sy = H / 2 - y;
      panelRects.push({
        left: sx - drawW / 2,
        right: sx + drawW / 2,
        top: sy - drawH / 2,
        bottom: sy + drawH / 2,
        poolIdx,
        srcIndex: i,
        centerX,
      });

      if (Math.abs(centerX) < centeredDist) {
        centeredDist = Math.abs(centerX);
        centeredPanel = { srcIndex: i, centerX, wPx, h, poolIdx };
      }
    });
  }

  // which visible panel (if any) is under a viewport point?
  function panelAtPointer(px: number, py: number) {
    const rect = renderer.domElement.getBoundingClientRect();
    const lx = px - rect.left;
    const ly = py - rect.top;
    for (const r of panelRects) {
      if (lx >= r.left && lx <= r.right && ly >= r.top && ly <= r.bottom)
        return r;
    }
    return null;
  }

  const el = renderer.domElement;

  // ---- "View" cursor follower ----
  let cursorX = 0;
  let cursorY = 0;
  let cursorTX = 0;
  let cursorTY = 0;
  let overPanel = false;
  let cursorShown = 0;

  if (cursorElement) {
    cursorElement.style.opacity = '0';
    cursorElement.style.transform = 'translate3d(0px, 0px, 0) scale(0)';
  }

  function setView(on: boolean) {
    if (entryActive || entrySettled) on = false; // not during entry
    el.style.cursor = on ? 'pointer' : '';
    if (on === overPanel || !cursorElement) return;
    overPanel = on;
  }

  // ---- input ----
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    if (focusState.active || entryActive || entrySettled) return;
    userInteracted = true;
    pendingFocus = null; // manual scroll cancels a click-to-center in flight
    target += (e.deltaY || e.deltaX) * CONFIG.wheel;
    lastWheelAt = performance.now();
    snapArmed = true;
  }

  function onPointerMove(e: PointerEvent) {
    cursorTX = e.clientX;
    cursorTY = e.clientY;
    if (focusState.active) {
      setView(false);
      return;
    }
    setView(panelAtPointer(e.clientX, e.clientY) !== null);
  }
  function onLeave() {
    setView(false);
  }

  function onClick(e: MouseEvent) {
    if (focusState.active || entryActive || entrySettled) return;
    const hit = panelAtPointer(e.clientX, e.clientY);
    if (!hit) return;
    // centered panel -> open right away; anything else glides to center
    // first and the tick loop opens focus once it arrives
    if (centeredPanel && hit.poolIdx === centeredPanel.poolIdx) {
      pendingFocus = null;
      openFocus();
      return;
    }
    userInteracted = true;
    target = centerForIndex(nearestIndex(scroll + hit.centerX));
    pendingFocus = { srcIndex: hit.srcIndex };
    setView(false);
  }

  // ---- focus open / close ----
  function openFocus() {
    if (focusState.active || !centeredPanel) return;
    const panel = centeredPanel;
    const src = sources[panel.srcIndex];
    if (!src || !src.tex) return;

    focusState.active = true;
    focusState.srcIndex = panel.srcIndex;
    const focusPoolIdx = panel.poolIdx;
    focusState.poolIdx = focusPoolIdx;

    // pull scroll precisely to center so the focused panel is dead-centre
    target = centerForIndex(nearestIndex(scroll));

    // order the OTHER panels by distance from the focused card and group
    // near-equal distances, so left/right pairs leave together — a real
    // center-out wave radiating from the clicked card
    const focusX = lastCenterX[focusPoolIdx] || 0;
    const others = pool
      .map((p, idx) => ({ idx, x: lastCenterX[idx] }))
      .filter((o) => o.idx !== focusPoolIdx && o.x !== undefined)
      .map((o) => ({ idx: o.idx, dist: Math.abs((o.x as number) - focusX) }))
      .sort((a, b) => a.dist - b.dist);

    let rank = 0;
    let prevDist = -1;
    const ranked = others.map((o) => {
      if (prevDist >= 0 && o.dist - prevDist > 1) rank++;
      prevDist = o.dist;
      return { idx: o.idx, rank };
    });

    // re-snapshot lens values so the fade/restore tracks live overrides
    for (const k of LENS_FX_KEYS) lensFxFull[k] = lensUniforms[k]!.value;

    killTweens(focusTweens);
    focusTweens.push(
      animate(focusState.lensFx, 0, {
        duration: FOCUS.lensFade,
        ease: EASE_POWER3_OUT,
        onUpdate: (v) => {
          focusState.lensFx = v;
        },
      }),
      animate(focusScale, FOCUS.centerScale, {
        duration: FOCUS.focusDuration,
        ease: EASE_POWER3_OUT,
        onUpdate: (v) => {
          focusScale = v;
        },
      }),
    );
    for (const o of ranked) {
      focusTweens.push(
        animate(drop[o.idx] ?? 0, 1, {
          duration: FOCUS.cardDuration,
          delay: o.rank * FOCUS.stagger,
          ease: EASE_POWER4_OUT,
          onUpdate: (v) => {
            drop[o.idx] = v;
          },
        }),
      );
    }

    setView(false);
    el.style.cursor = '';
    onFocusChange(true);
  }

  function closeFocus() {
    if (!focusState.active) return;
    killTweens(focusTweens);

    // return wave: farthest cards first (edges-in), symmetric pairs together
    const focusX = lastCenterX[focusState.poolIdx] || 0;
    const others = pool
      .map((p, idx) => ({ idx, x: lastCenterX[idx] }))
      .filter((o) => o.x !== undefined && (drop[o.idx] || 0) > 0)
      .map((o) => ({ idx: o.idx, dist: Math.abs((o.x as number) - focusX) }))
      .sort((a, b) => b.dist - a.dist);

    let rank = 0;
    let prevDist = -1;
    const ranked = others.map((o) => {
      if (prevDist >= 0 && prevDist - o.dist > 1) rank++;
      prevDist = o.dist;
      return { idx: o.idx, rank };
    });

    // notify the host NOW so its UI animates in sync with the cards
    // returning; focusState.active stays true until the timeline finishes
    // (it still gates scroll input)
    onFocusChange(false);

    let longest = 0;
    focusTweens.push(
      animate(focusState.lensFx, 1, {
        duration: FOCUS.lensFade * 0.8,
        ease: EASE_POWER3_IN_OUT,
        onUpdate: (v) => {
          focusState.lensFx = v;
        },
      }),
      animate(focusScale, 1, {
        duration: FOCUS.focusDuration * 0.85,
        ease: EASE_POWER3_OUT,
        onUpdate: (v) => {
          focusScale = v;
        },
      }),
    );
    for (const o of ranked) {
      const delay = o.rank * FOCUS.stagger * 0.7;
      longest = Math.max(longest, delay + FOCUS.cardDuration * 0.85);
      focusTweens.push(
        animate(drop[o.idx] ?? 1, 0, {
          duration: FOCUS.cardDuration * 0.85,
          delay,
          ease: EASE_POWER4_OUT,
          onUpdate: (v) => {
            drop[o.idx] = v;
          },
        }),
      );
    }
    const done = setTimeout(
      () => {
        focusState.active = false;
        focusState.srcIndex = -1;
      },
      Math.max(longest, FOCUS.focusDuration) * 1000,
    );
    entryTimers.push(done);
  }

  // ---- entry animation: rise from below, hold small, grow to full ----
  function playEntry() {
    killTweens(entryTweens);
    for (const t of entryTimers) clearTimeout(t);
    entryTimers = [];
    for (let k = 0; k < pEntry.length; k++) pEntry[k] = 0;
    entryActive = true;
    entrySettled = false;
    onEntryDone(false);
    for (let k = 0; k < growArr.length; k++) growArr[k] = 0;
    focusState.lensFx = 0; // no lens distortion during entry

    // center a panel cleanly; that panel rises first
    target = centerForIndex(nearestIndex(scroll));
    scroll = target;

    layout(); // populate lastCenterX
    const visible: number[] = [];
    for (let k = 0; k < lastCenterX.length; k++) {
      if (lastCenterX[k] !== undefined) visible.push(k);
    }

    // each card rises after its own random delay
    const spread = ENTRY.stagger * Math.max(visible.length - 1, 1);
    let lastRiseEnd = 0;
    for (const idx of visible) {
      const at = Math.random() * spread;
      lastRiseEnd = Math.max(lastRiseEnd, at + ENTRY.riseDuration);
      entryTweens.push(
        animate(0, 1, {
          duration: ENTRY.riseDuration,
          delay: ENTRY.delay + at,
          ease: EASE_POWER3_OUT,
          onUpdate: (v) => {
            pEntry[idx] = v;
          },
        }),
      );
    }

    // rise done -> hold at small size, then grow to full (staggered)
    entryTimers.push(
      setTimeout(
        () => {
          entryActive = false;
          entrySettled = true;
        },
        (ENTRY.delay + lastRiseEnd) * 1000,
      ),
    );

    // grow stagger ranked by slot distance from the centered source, so
    // symmetric left/right pairs grow together. outward = center first,
    // inward = edges first.
    const cSrcG = centerIndex(scroll);
    const Ng = sources.length;
    const midRepG = Math.floor(REPEATS / 2);
    const growList: { idx: number; rank: number }[] = [];
    let maxRank = 0;
    for (let k = 0; k < lastCenterX.length; k++) {
      if (lastCenterX[k] === undefined) continue;
      if (Math.floor(k / Ng) !== midRepG) continue;
      let di = (k % Ng) - cSrcG;
      if (di > Ng / 2) di -= Ng;
      if (di < -Ng / 2) di += Ng;
      const r = Math.abs(di);
      maxRank = Math.max(maxRank, r);
      growList.push({ idx: k, rank: r });
    }
    const growRanked = growList.map((v) => ({
      idx: v.idx,
      rank: ENTRY.growDir === 'outward' ? v.rank : maxRank - v.rank,
    }));

    const growStart = lastRiseEnd + ENTRY.growDelay;
    let growEnd = growStart;

    // lens blooms back in the moment the grow begins
    entryTweens.push(
      animate(0, 1, {
        duration: ENTRY.lensBloom,
        delay: ENTRY.delay + growStart,
        ease: EASE_POWER2_IN_OUT,
        onUpdate: (v) => {
          focusState.lensFx = v;
        },
      }),
    );

    for (const o of growRanked) {
      const at = growStart + o.rank * ENTRY.growStagger;
      growEnd = Math.max(growEnd, at + ENTRY.growDuration);
      entryTweens.push(
        animate(0, 1, {
          duration: ENTRY.growDuration,
          delay: ENTRY.delay + at,
          ease: EASE_EXPO_IN_OUT,
          onUpdate: (v) => {
            growArr[o.idx] = v;
          },
        }),
      );
    }
    // hand off to the normal full-size carousel
    entryTimers.push(
      setTimeout(
        () => {
          entrySettled = false;
          for (let k = 0; k < growArr.length; k++) growArr[k] = 1;
          onEntryDone(true);
        },
        (ENTRY.delay + growEnd) * 1000,
      ),
    );
  }

  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('click', onClick);

  // ---- animation loop ----
  let raf = 0;
  function tick() {
    // settle-snap: wheel quiet + glide almost done -> aim at nearest center.
    // Redirecting the target (not the scroll) keeps it one continuous glide.
    if (
      CONFIG.snap &&
      snapArmed &&
      !focusState.active &&
      Math.abs(target - scroll) < CONFIG.snapDist &&
      performance.now() - lastWheelAt > CONFIG.snapDelay
    ) {
      target = centerForIndex(nearestIndex(target));
      snapArmed = false;
    }

    scroll += (target - scroll) * CONFIG.ease;

    // tell the host which image is centered (overlay text)
    const ci = centerIndex(scroll);
    if (ci !== lastCenter) {
      lastCenter = ci;
      onActiveChange(ci);
    }

    // scroll speed -> energy 0..1, drives the panel shrink. Attack fast when
    // speeding up, decay slow when settling.
    const rawSpeed = scroll - prevScroll;
    prevScroll = scroll;
    const norm = Math.min(
      1,
      Math.abs(rawSpeed) / Math.max(1, CONFIG.shrinkMax),
    );
    const k = norm > scrollEnergy ? CONFIG.shrinkAttack : CONFIG.shrinkDecay;
    scrollEnergy += (norm - scrollEnergy) * k;

    layout();

    // click-to-center: once the glide has settled on the clicked panel, focus it
    if (pendingFocus && !focusState.active) {
      if (Math.abs(target - scroll) < 0.5) {
        const pf = pendingFocus;
        pendingFocus = null;
        if (centeredPanel && centeredPanel.srcIndex === pf.srcIndex)
          openFocus();
      }
    }

    // "View" label trails the pointer with an eased follow
    if (cursorElement) {
      cursorX += (cursorTX - cursorX) * 0.12;
      cursorY += (cursorTY - cursorY) * 0.12;
      const want = overPanel ? 1 : 0;
      cursorShown += (want - cursorShown) * 0.16;
      cursorElement.style.opacity = String(cursorShown);
      cursorElement.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) scale(${cursorShown})`;
    }

    // lens uniforms + focus/entry fade of the distortion props
    (lensUniforms.uCenter!.value as THREE.Vector2).set(LENS.posX, LENS.posY);
    lensUniforms.uAspect!.value = W / H;
    lensUniforms.uTime!.value = performance.now() * 0.001;
    const rad = (a: number) => (a * Math.PI) / 180;
    lensUniforms.uRotation!.value =
      rad(LENS.rotation) + rad(LENS.spin) * (performance.now() * 0.001);
    const fx = focusState.lensFx;
    for (const key of LENS_FX_KEYS) {
      lensUniforms[key]!.value = lensFxFull[key]! * fx;
    }

    // render the carousel into the FBO, then the FBO through the lens
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(lensScene, lensCam);

    raf = requestAnimationFrame(tick);
  }
  tick();

  if (ENTRY.enabled) playEntry();

  // ---- resize / teardown ----
  function onResize() {
    W = mount.clientWidth;
    H = mount.clientHeight;
    if (W === 0 || H === 0) return;
    renderer.setSize(W, H);
    camera.left = -W / 2;
    camera.right = W / 2;
    camera.top = H / 2;
    camera.bottom = -H / 2;
    camera.updateProjectionMatrix();
    rt.setSize(W * dpr, H * dpr);
    (lensUniforms.uRes!.value as THREE.Vector2).set(W * dpr, H * dpr);
  }
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(mount);

  function destroy() {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerleave', onLeave);
    el.removeEventListener('click', onClick);
    killTweens(focusTweens);
    killTweens(entryTweens);
    for (const t of entryTimers) clearTimeout(t);
    entryTimers = [];
    renderer.dispose();
    rt.dispose();
    lensQuad.geometry.dispose();
    lensMat.dispose();
    for (const p of pool) {
      p.mesh.geometry.dispose();
      p.mat.dispose();
    }
    for (const s of sources) {
      if (s.tex) s.tex.dispose();
    }
    if (el.parentNode) el.parentNode.removeChild(el);
  }

  return {
    closeFocus,
    replayEntry: playEntry,
    refreshLayout: recomputeTotal,
    destroy,
  };
}
