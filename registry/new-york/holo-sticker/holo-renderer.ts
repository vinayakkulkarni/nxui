import * as THREE from 'three';
import type { StickerSettings } from './types';
import { peelAngles } from './sticker-settings';

const SEGS = 160;
const MAXD = 160; // distance-field range in pixels

/** Exact euclidean distance transform of a binary mask (Felzenszwalb). */
function edt(inside: Uint8Array, W: number, H: number): Float32Array {
  const INF = 1e20;
  const dsq = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) dsq[i] = inside[i] ? 0 : INF;
  const n = Math.max(W, H);
  const f = new Float64Array(n);
  const dOut = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  const dt1 = (len: number) => {
    let k = 0;
    v[0] = 0;
    z[0] = -INF;
    z[1] = INF;
    for (let q = 1; q < len; q++) {
      let s =
        (f[q] + q * q - (f[v[k]!]! + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!);
      while (s <= z[k]!) {
        k--;
        s = (f[q] + q * q - (f[v[k]!]! + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!);
      }
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < len; q++) {
      while (z[k + 1]! < q) k++;
      const dq = q - v[k]!;
      dOut[q] = dq * dq + f[v[k]!]!;
    }
  };
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) f[y] = dsq[y * W + x]!;
    dt1(H);
    for (let y = 0; y < H; y++) dsq[y * W + x] = dOut[y]!;
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) f[x] = dsq[y * W + x]!;
    dt1(W);
    for (let x = 0; x < W; x++) dsq[y * W + x] = dOut[x]!;
  }
  const dist = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) dist[i] = Math.sqrt(dsq[i]!);
  return dist;
}

/**
 * Distance to the die-cut source shape with cut tolerance: a morphological
 * closing (dilate by tol, erode by tol) fills interior counters and bridges
 * gaps smaller than the tolerance, like a real cut path.
 */
function distanceField(
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
  tolPx: number,
) {
  const pad = MAXD;
  const W = w + 2 * pad;
  const H = h + 2 * pad;
  const ink = new Uint8Array(W * H);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[(y * w + x) * 4 + 3]! > 127) ink[(y + pad) * W + x + pad] = 1;
    }
  }
  let dist = edt(ink, W, H);
  if (tolPx > 0.5) {
    // dilate by tol
    const dilated = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) dilated[i] = dist[i]! <= tolPx ? 0 : 1;
    // erode by tol: distance from inside the dilated set to its outside
    const dIn = edt(dilated, W, H); // dilated stores the COMPLEMENT (1 = outside)
    const closed = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) closed[i] = dIn[i]! > tolPx ? 1 : 0;
    dist = edt(closed, W, H);
  }
  return { dist, W, pad };
}

/** Procedural studio environment as an equirect texture (softboxes + sky). */
function studioEnvTexture(): THREE.Texture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // vertical gradient: bright ceiling, mid walls, darker floor
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f4f5f7');
  g.addColorStop(0.45, '#c9ccd2');
  g.addColorStop(0.55, '#aeb2b9');
  g.addColorStop(1, '#7c8087');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // softbox blobs
  const blob = (x: number, y: number, rx: number, ry: number, a: number) => {
    const r = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    r.addColorStop(0, `rgba(255,255,255,${a})`);
    r.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = r;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.translate(-x, -y);
    ctx.beginPath();
    ctx.arc(x, y, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  blob(w * 0.25, h * 0.22, 190, 110, 0.98);
  blob(w * 0.72, h * 0.3, 130, 80, 0.85);
  blob(w * 0.5, h * 0.75, 220, 60, 0.25);
  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

const VERT = /* glsl */ `
out vec2 vUv;
out vec3 vNormal;
out vec3 vWorldPos;
out float vAO;
uniform float uCurlH;
uniform float uLift; // layer offset along the surface normal
void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec3 p = position + normal * uLift;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  vAO = clamp(position.z / max(uCurlH, 1e-4), 0.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */ `
precision highp float;
in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPos;
in float vAO;
out vec4 outColor;

uniform sampler2D uMap;   // albedo, alpha = die-cut shape
uniform sampler2D uEnv;   // equirect studio environment
uniform vec3 uCamPos;
uniform float uMaxMip;
uniform float uMetal;
uniform float uRough;
uniform float uEnvIntensity;
uniform float uHolo;
uniform float uBands;
uniform float uHue;
uniform float uGrain;
uniform float uPattern;
uniform float uOverlay;
uniform float uInk;
uniform float uSeed; // per-layer texture variation
uniform float uBackStyle; // 0 = glossy foil liner, 1 = the layer's own map
uniform sampler2D uHeight; // ink coverage, mipmapped, drives the emboss
uniform float uRelief;
uniform float uPeelOn;
uniform vec2 uLight;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1, 0));
  float c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 srgb2lin(vec3 c) { return pow(c, vec3(2.2)); }
vec3 lin2srgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }

vec2 equirectUv(vec3 d) {
  d = normalize(d);
  float phi = atan(d.z, d.x);
  float theta = acos(clamp(d.y, -1.0, 1.0));
  return vec2((phi + 3.14159265) / 6.2831853, theta / 3.14159265);
}

/*
 * Embossed print relief (concept from konvert.design's sticker tool):
 * the ink coverage, blurred via mip levels, acts as a height field whose
 * gradient tilts the normal - the mark sits proud with a real bevel.
 * Cotangent-frame normal perturbation after Schueler.
 */
vec3 perturbNormal(vec3 N, vec3 P, vec2 uv, vec2 dGrad) {
  vec3 dp1 = dFdx(P);
  vec3 dp2 = dFdy(P);
  vec2 duv1 = dFdx(uv);
  vec2 duv2 = dFdy(uv);
  vec3 dp2perp = cross(dp2, N);
  vec3 dp1perp = cross(N, dp1);
  vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
  vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
  float invmax = inversesqrt(max(dot(T, T), dot(B, B)) + 1e-12);
  return normalize(N - (T * dGrad.x + B * dGrad.y) * invmax);
}

vec3 envSample(vec3 R, float rough) {
  return srgb2lin(textureLod(uEnv, equirectUv(R), rough * uMaxMip).rgb);
}

// diffraction phase pattern across the sticker surface
float patternPhase(vec2 uv) {
  float n = vnoise(uv * 5.0 + uLight + uSeed * 2.7);
  if (uPattern < 0.5) {
    return dot(uv - uLight, normalize(vec2(0.85, 0.55))) * uBands + n * 1.5;
  } else if (uPattern < 1.5) {
    return length(uv - uLight) * uBands * 1.6 + n * 1.2;
  }
  return n * 5.0 + vnoise(uv * 11.0) * 2.5;
}

// refractor overlay: facet cells (triangles / squares / stripes) that each
// carry their own diffraction phase, like embossed holo facet foils
float facetOffset(vec2 uv) {
  if (uOverlay < 0.5) return 0.0;
  if (uOverlay < 1.5) { // triangles
    vec2 g = uv * 9.0;
    vec2 i = floor(g);
    vec2 f = fract(g);
    float t = step(f.x + f.y, 1.0);
    return hash(i + t * 0.37) * 0.85;
  }
  if (uOverlay < 2.5) { // squares
    return hash(floor(uv * 7.0)) * 0.85;
  }
  // diagonal stripes
  return hash(vec2(floor(dot(uv, normalize(vec2(1.0, 0.6))) * 16.0), 3.0)) * 0.85;
}

float fbm(vec2 p) {
  float a = 0.54;
  float r = 0.0;
  for (int i = 0; i < 4; i++) {
    r += a * vnoise(p);
    p = p * 2.13 + vec2(31.4, 47.2);
    a *= 0.46;
  }
  return r;
}

/*
 * Two-layer laminate with ink-tinted metallic reflections, film "pooling"
 * via domain-warped fbm so the rainbow flows in broad sweeps, curl-driven
 * spectrum shift, and per-cell glitter twinkle. Colors stay Holosticker's
 * own sine palette. Credit to konvert.design for the layering approach.
 */
// pooling field for the flare zones; the pattern select shapes the flow
float poolField(vec2 uv) {
  vec2 pu;
  if (uPattern < 0.5) {
    // anisotropic: stretched along a diagonal, broad flowing sweeps
    pu = vec2((uv.x + uv.y) * 0.5, (uv.y - uv.x) * 1.1) * (uBands * 0.28);
  } else if (uPattern < 1.5) {
    vec2 d = uv - uLight;
    pu = vec2(length(d) * 1.7, atan(d.y, d.x) * 0.6) * (uBands * 0.24);
  } else {
    pu = uv * (uBands * 0.3);
  }
  pu += uSeed * 3.1;
  vec2 warp = vec2(fbm(pu + vec2(5.2, 1.3)), fbm(pu + vec2(1.7, 8.6)));
  return fbm(pu * 1.4 + warp * 2.0);
}

// the rainbow: original sine palette, phased by view angle, surface
// pattern, facets, and curl height
vec3 rainbowFilm(float cosT, vec2 uv, vec3 R, float flatness) {
  float sweep = dot(R.xy, normalize(vec2(0.8, 0.6))) * (uBands * 0.4) * flatness;
  float phase = 6.2831853 *
    (0.35 + 1.15 * (1.0 - cosT) + patternPhase(uv) * 0.18 + sweep +
     facetOffset(uv) + (1.0 - vAO) * uPeelOn * 0.35 + uHue);
  return 0.5 + 0.5 * vec3(sin(phase), sin(phase + 2.094), sin(phase + 4.188));
}

// shared film color (backside + flakes)
vec3 filmColor(float cosT, vec2 uv, vec3 R, float flatness) {
  return mix(vec3(1.0), rainbowFilm(cosT, uv, R, flatness), uHolo);
}

void main() {
  vec4 base = texture(uMap, vUv);
  if (base.a < 0.05) discard;
  base.rgb = srgb2lin(base.rgb);

  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCamPos - vWorldPos);
  if (!gl_FrontFacing) {
    N = -N;
    vec3 Rb = reflect(-V, N);
    float cosT = clamp(dot(N, V), 0.0, 1.0);
    float shade = mix(1.0, 0.5, (1.0 - vAO) * uPeelOn);
    vec3 col;
    if (uBackStyle > 0.5) {
      // the layer's own surface, seen from behind (what the peel reveals)
      vec3 env = envSample(Rb, clamp(uRough, 0.0, 1.0));
      float fres = 0.06 + 0.5 * pow(1.0 - cosT, 4.0) * (1.0 - uRough);
      col = base.rgb * (0.62 + 0.5 * cosT) + env * fres * uMetal;
    } else {
      // classic glossy foil liner: mirror-like with rainbow catch
      col = vec3(0.55);
      vec3 env = envSample(Rb, 0.1) * 1.6;
      float fres = 0.4 + 0.6 * pow(1.0 - cosT, 3.0);
      col += env * (0.5 + 0.5 * fres) * mix(vec3(1.0), filmColor(cosT, vUv, Rb, smoothstep(0.25, 0.85, abs(N.z))), 0.75);
    }
    col *= shade;
    outColor = vec4(lin2srgb(col), base.a);
    return;
  }

  // embossed ink: bevel the normal along the blurred coverage gradient
  if (uRelief > 0.005) {
    float e = 2.5 / 1024.0;
    float hC = textureLod(uHeight, vUv, 1.6).r;
    float hX = textureLod(uHeight, vUv + vec2(e, 0.0), 1.6).r;
    float hY = textureLod(uHeight, vUv + vec2(0.0, e), 1.6).r;
    N = perturbNormal(N, vWorldPos, vUv,
                      vec2(hX - hC, hY - hC) * (uRelief * 5.0));
  }

  vec3 R = reflect(-V, N);
  float cosT = clamp(dot(N, V), 0.0, 1.0);
  float brightness = lum(base.rgb);
  // ink > 100% also deepens the ink itself
  base.rgb = mix(base.rgb, base.rgb * base.rgb,
                 max(uInk - 1.0, 0.0) * (1.0 - brightness) * 0.8);

  // ---- metallic flakes ----
  float flakeI = 0.0;
  vec3 flakeEnv = vec3(0.0);
  if (uGrain > 0.01) {
    float cell = hash(floor(vUv * 700.0));
    float mask = smoothstep(1.0 - uGrain * 0.6, 1.0, cell);
    float angleOff = (hash(vec2(cell, cell + 3.0)) - 0.5) * 0.3;
    vec3 pN = normalize(N + vec3(angleOff, angleOff * 0.7, 0.0));
    vec3 PR = reflect(-V, pN);
    float spark = pow(clamp(dot(pN, V) * 0.5 + 0.5, 0.0, 1.0), 8.0);
    flakeEnv = envSample(PR, 0.15) * mix(vec3(1.0), filmColor(dot(pN, V), vUv, PR, smoothstep(0.25, 0.85, N.z)), 0.9);
    flakeI = clamp(mask * max(spark, 0.2) * 6.0, 0.0, 1.0) * min(uGrain * 2.0, 1.0);
  }

  // ---- environment reflection with fresnel ----
  // each layer gets its own finish: subtle roughness variation by seed
  float rough = mix(uRough, 0.9, flakeI) *
    mix(0.7, 1.45, fract(uSeed * 0.617));
  vec3 env = envSample(R, rough) * uEnvIntensity;
  env = mix(env, flakeEnv * uEnvIntensity, flakeI);

  float F0 = mix(0.05, 0.9, uMetal);
  float fres = F0 + (1.0 - F0) * pow(1.0 - cosT, 5.0);

  // ---- key light (follows the light position control) ----
  vec3 L = normalize(vec3((uLight.x - 0.5) * 2.2, (uLight.y - 0.5) * 2.2, 1.4));
  float dif = clamp(dot(N, L), 0.0, 1.0);
  float specKey = pow(clamp(dot(R, L), 0.0, 1.0), 60.0);

  vec3 diffuse = base.rgb * (1.0 - uMetal * 0.55) * (0.5 + 0.6 * dif);

  // two-layer laminate (konvert-style): the metallic base reflects in
  // the ink's own color, while the thin-film flare lives in the clear
  // laminate above the print, so rainbows stay vivid over dark ink
  float inkA = clamp(1.0 - brightness / 0.62, 0.0, 1.0);
  vec3 specTint = mix(vec3(1.0), base.rgb * 1.25 + 0.08, 0.8 * inkA * uHolo);
  // slight foil dim so the flares read brighter than the base
  diffuse *= 1.0 - 0.18 * uHolo * (1.0 - inkA);
  vec3 rawSpec = env * (1.0 - rough * 0.6) * 1.35 + vec3(specKey * 0.6);

  float pool = poolField(vUv);
  float band = smoothstep(0.35, 0.7, pool);
  float flatness = smoothstep(0.25, 0.85, N.z);
  vec3 film = rainbowFilm(cosT, vUv, R, flatness);

  // per-cell glitter twinkle: micro-facets light up as the angle sweeps
  float twk = 1.0 + pow(0.5 + 0.5 * sin(hash(floor(vUv * 950.0)) * 6.28318 +
                                        cosT * 48.0),
                        20.0) *
                    (uGrain * 1.2);

  vec3 specCol = rawSpec * specTint * fres;
  specCol *= mix(1.0, 0.5, uHolo * band);
  // calm foil still whispers the film: soft pearly sheen everywhere
  specCol += rawSpec * mix(vec3(1.0), film, 0.75) * (0.3 * uHolo);
  specCol *= mix(0.3, 1.0, brightness);
  // metal-backed flare bypasses the dielectric fresnel: vivid head-on,
  // and it lives above the ink so it only softens slightly over darks
  vec3 flare = rawSpec * film * (2.3 * uHolo * band) *
               mix(0.55, 1.0, brightness);

  vec3 spec = (specCol + flare) * twk;
  // ink > 100%: dark ink covers the holo, reading as solid print
  float inkCover = max(uInk - 1.0, 0.0) * (1.0 - brightness);
  spec *= 1.0 - inkCover * 0.85;
  vec3 color = diffuse + spec + flakeEnv * flakeI * 0.5;

  // slight shadowing where the sheet curls up from the surface
  color *= mix(1.0, 0.88, (1.0 - vAO) * uPeelOn * step(0.02, vAO));

  outColor = vec4(lin2srgb(color), base.a);
}`;

/** Uniform overrides per layer material preset. */
const LAYER_MATERIAL_PRESETS: Record<
  string,
  Record<string, number> | undefined
> = {
  auto: undefined,
  gloss: { uGrain: 0.0, uRough: 0.06, uMetal: 0.3, uHolo: 0.0 },
  glitter: { uGrain: 1.0, uRough: 0.45, uMetal: 0.8, uHolo: 1.0 },
  chrome: { uGrain: 0.0, uRough: 0.04, uMetal: 1.0, uHolo: 0.25 },
  matte: { uGrain: 0.08, uRough: 0.85, uMetal: 0.05, uHolo: 0.15 },
  prism: { uHolo: 1.0, uBands: 16, uOverlay: 1, uMetal: 0.7, uRough: 0.15 },
  satin: { uRough: 0.35, uMetal: 0.5, uHolo: 0.5, uGrain: 0.15 },
};

/** Metal/roughness per finish preset. */
const FINISH_PARAMS: Record<string, { metal: number; rough: number }> = {
  holo: { metal: 0.6, rough: 0.18 },
  glitter: { metal: 0.65, rough: 0.3 },
  gloss: { metal: 0.3, rough: 0.06 },
  matte: { metal: 0.05, rough: 0.8 },
  chrome: { metal: 1.0, rough: 0.045 },
};

export class HoloRenderer {
  canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private geometry: THREE.PlaneGeometry;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;
  private shadowMat: THREE.Material & { opacity: number };
  private shadowMesh!: THREE.Mesh;
  private source: ImageBitmap | null = null;
  private geomKey = '';
  private mapsKey = '';
  private layerMeshes: THREE.Mesh[] = [];
  private mapAspect = 1;
  private tilt = new THREE.Vector2(0, 0);
  private tiltTarget = new THREE.Vector2(0, 0);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(24, 1, 0.1, 20);
    this.camera.position.set(0, 0, 3.2);

    this.geometry = new THREE.PlaneGeometry(1, 1, SEGS, SEGS);

    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uMap: { value: null },
        uEnv: { value: studioEnvTexture() },
        uCamPos: { value: this.camera.position },
        uMaxMip: { value: 8 },
        uMetal: { value: 0.6 },
        uRough: { value: 0.18 },
        uEnvIntensity: { value: 1.0 },
        uHolo: { value: 0.85 },
        uBands: { value: 9 },
        uHue: { value: 0 },
        uGrain: { value: 0.35 },
        uPattern: { value: 0 },
        uOverlay: { value: 0 },
        uInk: { value: 1 },
        uSeed: { value: 0 },
        uHeight: { value: null },
        uRelief: { value: 0 },
        uBackStyle: { value: 0 },
        uLift: { value: 0 },
        uPeelOn: { value: 0 },
        uLight: { value: new THREE.Vector2(0.65, 0.7) },
        uCurlH: { value: 0.1 },
      },
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    // soft blob shadow under the sticker
    const sc = document.createElement('canvas');
    sc.width = sc.height = 256;
    const sctx = sc.getContext('2d')!;
    const grad = sctx.createRadialGradient(128, 128, 30, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 256);
    this.shadowMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(sc),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      this.shadowMat,
    );
    this.shadowMesh.position.z = -0.05;
    this.scene.add(this.shadowMesh);
  }

  setImage(source: ImageBitmap | null) {
    this.source = source;
    this.mapsKey = '';
  }

  /** Pointer position in [-1, 1]; the sticker tilts toward it. */
  setTilt(x: number, y: number) {
    this.tiltTarget.set(x, y);
  }

  hasImage() {
    return this.source !== null;
  }

  /** Build the albedo+shape texture from the artwork and its distance field. */
  private updateMaps(s: StickerSettings) {
    const src = this.source;
    if (!src) return;
    const key = `${s.border}|${s.cutTolerance}|${s.ink}|${s.layersOn}|${s.layerMaterials.join()}|${src.width}x${src.height}`;
    if (key === this.mapsKey) return;
    this.mapsKey = key;

    const scale = Math.min(1024 / Math.max(src.width, src.height), 1);
    const w = Math.round(src.width * scale);
    const h = Math.round(src.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(src, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const tolPx = s.cutTolerance * 2.3 * w;
    const { dist, W, pad } = distanceField(img.data, w, h, tolPx);

    const borderPx = s.border * 2.3 * w;
    const off = Math.ceil(borderPx + 6);
    const ow = w + 2 * off;
    const oh = h + 2 * off;
    const out = new Uint8ClampedArray(new ArrayBuffer(ow * oh * 4));
    for (let y = 0; y < oh; y++) {
      for (let x = 0; x < ow; x++) {
        const ax = x - off;
        const ay = y - off;
        const o = (y * ow + x) * 4;
        const inArt = ax >= 0 && ax < w && ay >= 0 && ay < h;
        const d =
          ax >= -pad && ax < w + pad && ay >= -pad && ay < h + pad
            ? dist[(ay + pad) * W + ax + pad]!
            : MAXD;
        // antialiased die-cut shape edge
        const shape = Math.max(
          0,
          Math.min(255, Math.round((borderPx - d + 0.5) * 255)),
        );
        // silver foil base
        let r = 214;
        let g = 216;
        let b = 220;
        if (inArt) {
          const i = (ay * w + ax) * 4;
          // ink control: <1 fades ink into the foil, >1 densifies soft edges
          const a0 = img.data[i + 3]! / 255;
          const a = Math.min(1, s.ink) * Math.pow(a0, 1 / Math.max(s.ink, 1));
          r = Math.round(r * (1 - a) + img.data[i]! * a);
          g = Math.round(g * (1 - a) + img.data[i + 1]! * a);
          b = Math.round(b * (1 - a) + img.data[i + 2]! * a);
        }
        out[o] = r;
        out[o + 1] = g;
        out[o + 2] = b;
        out[o + 3] = shape;
      }
    }
    const c = document.createElement('canvas');
    c.width = ow;
    c.height = oh;
    c.getContext('2d')!.putImageData(new ImageData(out, ow, oh), 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.NoColorSpace;
    tex.premultiplyAlpha = false;

    const old = this.material.uniforms.uMap.value as THREE.Texture | null;
    old?.dispose();
    this.material.uniforms.uMap.value = tex;
    this.mapAspect = ow / oh;

    // height map for the relief: the vinyl plateaus over the artwork and
    // ramps down across the border, reaching zero at the kiss-cut edge
    const hout = new Uint8ClampedArray(new ArrayBuffer(ow * oh * 4));
    // the vinyl plateau covers artwork AND border, stepping down with a
    // narrow rounded shoulder just inside the kiss-cut edge
    const shoulder = Math.min(9, borderPx * 0.3 + 3);
    for (let y = 0; y < oh; y++) {
      for (let x = 0; x < ow; x++) {
        const ax = x - off;
        const ay = y - off;
        const d =
          ax >= -pad && ax < w + pad && ay >= -pad && ay < h + pad
            ? dist[(ay + pad) * W + ax + pad]!
            : MAXD;
        // 1 across the sticker body, rolling to 0 at the cut line
        const t = Math.max(0, Math.min(1, (borderPx - d) / shoulder));
        const o = (y * ow + x) * 4;
        hout[o] = Math.round(255 * t * t * (3 - 2 * t));
        hout[o + 3] = 255;
      }
    }
    const hc = document.createElement('canvas');
    hc.width = ow;
    hc.height = oh;
    hc.getContext('2d')!.putImageData(new ImageData(hout, ow, oh), 0, 0);
    const htex = new THREE.CanvasTexture(hc);
    htex.colorSpace = THREE.NoColorSpace;
    htex.generateMipmaps = true;
    htex.minFilter = THREE.LinearMipmapLinearFilter;
    const oldH = this.material.uniforms.uHeight.value as THREE.Texture | null;
    oldH?.dispose();
    this.material.uniforms.uHeight.value = htex;

    // ---- exploded production layers: backing / kiss-cut blank / art ----
    for (const m of this.layerMeshes) {
      this.mesh.remove(m);
      (m.material as THREE.ShaderMaterial).uniforms.uMap.value?.dispose?.();
      (m.material as THREE.ShaderMaterial).dispose();
    }
    this.layerMeshes = [];
    if (s.layersOn) {
      const layers: Uint8ClampedArray<ArrayBuffer>[] = [];

      // 1. backing: the kiss-cut silhouette seen from the liner side,
      // matte paper white in the exact die-cut shape
      const back = new Uint8ClampedArray(new ArrayBuffer(ow * oh * 4));
      for (let i = 0; i < ow * oh; i++) {
        back[i * 4] = 245;
        back[i * 4 + 1] = 244;
        back[i * 4 + 2] = 240;
        back[i * 4 + 3] = out[i * 4 + 3]!; // same die-cut alpha
      }
      layers.push(back);

      // 2. kiss-cut blank: the die-cut shape in bare foil, no ink
      const blank = new Uint8ClampedArray(new ArrayBuffer(ow * oh * 4));
      for (let i = 0; i < ow * oh; i++) {
        blank[i * 4] = 214;
        blank[i * 4 + 1] = 216;
        blank[i * 4 + 2] = 220;
        blank[i * 4 + 3] = out[i * 4 + 3]!; // same die-cut alpha as the base
      }
      layers.push(blank);

      // 3. the original artwork, printed alone
      const art = new Uint8ClampedArray(new ArrayBuffer(ow * oh * 4));
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (img.data[i + 3] === 0) continue;
          const o = ((y + off) * ow + x + off) * 4;
          art[o] = img.data[i]!;
          art[o + 1] = img.data[i + 1]!;
          art[o + 2] = img.data[i + 2]!;
          art[o + 3] = img.data[i + 3]!;
        }
      }
      layers.push(art);

      layers.forEach((lout, li) => {
        const lc = document.createElement('canvas');
        lc.width = ow;
        lc.height = oh;
        lc.getContext('2d')!.putImageData(new ImageData(lout, ow, oh), 0, 0);
        const ltex = new THREE.CanvasTexture(lc);
        ltex.anisotropy = 8;
        ltex.colorSpace = THREE.NoColorSpace;
        ltex.premultiplyAlpha = false;
        // preset overrides get their own uniform objects so they hold
        // their value; everything else keeps tracking the sliders
        const preset =
          LAYER_MATERIAL_PRESETS[s.layerMaterials[li] ?? 'auto'] ?? {};
        const overrides = Object.fromEntries(
          Object.entries(preset).map(([k, v]) => [k, { value: v }]),
        );
        const lmat = new THREE.ShaderMaterial({
          glslVersion: this.material.glslVersion,
          vertexShader: this.material.vertexShader,
          fragmentShader: this.material.fragmentShader,
          side: this.material.side,
          transparent: true,
          uniforms: {
            ...this.material.uniforms,
            ...overrides,
            uMap: { value: ltex },
            uSeed: { value: li + 1 },
            uBackStyle: { value: 1 },
            uLift: { value: 0 },
          },
        });
        const lmesh = new THREE.Mesh(this.geometry, lmat);
        // remember the preset's holo level so render() can scale it by
        // the global intensity (a matte global must stay matte)
        lmesh.userData.presetHolo = preset.uHolo;
        lmesh.renderOrder = li + 1;
        this.mesh.add(lmesh);
        this.layerMeshes.push(lmesh);
      });
    }
  }

  /** Bend the plane: gentle bow + cylinder page-curl for the peel. */
  private updateGeometry(s: StickerSettings) {
    const aspect = this.mapAspect;
    const key = `${s.peelAmount}|${s.peelDirection}|${s.curl}|${aspect}`;
    if (key === this.geomKey) return;
    this.geomKey = key;

    const ang = peelAngles[s.peelDirection];
    const d = new THREE.Vector2(Math.cos(ang), Math.sin(ang));
    const pos = this.geometry.attributes.position;
    const sx = aspect >= 1 ? 1 : aspect;
    const sy = aspect >= 1 ? 1 / aspect : 1;

    const ext = 0.5 * Math.hypot(sx, sy);
    const foldC = ext - s.peelAmount * 2 * ext;
    const r = Math.max(s.curl, 0.02) * 2.2;
    // conical bend: tighter near the peel corner, opening outward
    const perp = new THREE.Vector2(-d.y, d.x);
    const corner = new THREE.Vector2(
      Math.sign(-d.x) * sx * 0.5,
      Math.sign(-d.y) * sy * 0.5,
    );
    const qc = corner.x * perp.x + corner.y * perp.y;
    const cone = 2 * Math.abs(d.x * d.y); // 1 on diagonals, 0 on edges
    // total fold-back angle: deepens slightly as the peel progresses
    const maxTheta = Math.PI * (0.55 + 0.28 * s.peelAmount);

    for (let i = 0; i < pos.count; i++) {
      const ux = ((i % (SEGS + 1)) / SEGS - 0.5) * sx;
      const uy = (0.5 - Math.floor(i / (SEGS + 1)) / SEGS) * sy;
      let x = ux;
      let y = uy;
      let z = 0;
      const c = -(ux * d.x + uy * d.y); // distance toward the peel corner
      const u = c - foldC;
      if (s.peelAmount > 0.001 && u > 0) {
        const lq = Math.abs(ux * perp.x + uy * perp.y - qc) / ext;
        // smooth cone falloff: zero slope at the centerline (no crease),
        // no hard clamp
        const rEff = r * (0.55 + cone * ((1.15 * lq * lq) / (lq + 0.45)));
        // graded hinge rotation: the bend saturates, so curvature
        // concentrates at the fold and the flap tail stays flat
        const theta = maxTheta * (1 - Math.exp(-u / rEff));
        const newC = foldC + u * Math.cos(theta);
        z = u * Math.sin(theta);
        const shift = newC - c;
        x -= d.x * shift;
        y -= d.y * shift;
      }
      // gentle overall bow so the sticker doesn't look laser-flat
      const bx = (ux / (sx * 0.5)) ** 2;
      const by = (uy / (sy * 0.5)) ** 2;
      z += 0.05 * (1 - 0.5 * bx - 0.5 * by);
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.material.uniforms.uCurlH.value = Math.max(0.15, ext * 0.7);
  }

  render(input: { settings: StickerSettings; imgAspect: number }) {
    const s = input.settings;
    this.updateMaps(s);
    if (this.source) this.updateGeometry(s);

    this.mesh.visible = this.source !== null;
    this.mesh.scale.set(s.size * 1.15, s.size * 1.15, 1);

    // layered construction: hide the flat composite; lift each layer
    // along the surface normal so the stack flips correctly on the peel
    this.material.visible = !s.layersOn || this.layerMeshes.length === 0;
    for (let i = 0; i < this.layerMeshes.length; i++) {
      this.layerMeshes[i]!.position.z = 0;
      const u = (this.layerMeshes[i]!.material as THREE.ShaderMaterial)
        .uniforms;
      u.uLift.value = 0.004 + i * s.layerDepth;
      const presetHolo = this.layerMeshes[i]!.userData.presetHolo as
        | number
        | undefined;
      if (presetHolo !== undefined) {
        u.uHolo.value = presetHolo * Math.min(1, s.holoIntensity / 0.85);
      }
    }

    // smooth pointer tilt: makes reflections and iridescence sweep
    this.tilt.lerp(this.tiltTarget, 0.09);
    this.mesh.rotation.set(-this.tilt.y * 0.38, this.tilt.x * 0.42, 0);

    const u = this.material.uniforms;
    u.uHolo.value = s.holoIntensity;
    u.uBands.value = s.bands;
    u.uHue.value = s.hueShift;
    u.uGrain.value = s.grain;
    u.uPattern.value =
      s.pattern === 'linear' ? 0 : s.pattern === 'radial' ? 1 : 2;
    u.uOverlay.value =
      s.overlay === 'none'
        ? 0
        : s.overlay === 'triangles'
          ? 1
          : s.overlay === 'squares'
            ? 2
            : 3;
    // smooth ramp so shading terms fade in with the peel instead of popping
    u.uPeelOn.value = Math.min(1, s.peelAmount / 0.05);
    u.uInk.value = s.ink;
    u.uRelief.value = s.relief;
    const fin = FINISH_PARAMS[s.finish] ?? FINISH_PARAMS.holo;
    u.uMetal.value = fin.metal;
    u.uRough.value = fin.rough;
    (u.uLight.value as THREE.Vector2).set(s.light.x, s.light.y);

    // blob shadow follows sticker size, offset away from the light
    const ba = this.mapAspect;
    const bsx = ba >= 1 ? 1 : ba;
    const bsy = ba >= 1 ? 1 / ba : 1;
    this.shadowMesh.visible = this.source !== null;
    this.shadowMesh.scale.set(
      s.size * 1.15 * bsx * 1.12,
      s.size * 1.15 * bsy * 1.12,
      1,
    );
    this.shadowMesh.position.set(
      -(s.light.x - 0.5) * 0.12,
      -(s.light.y - 0.5) * 0.12,
      -0.05,
    );
    this.shadowMat.opacity = 0.5 * s.shadow;

    this.renderer.setSize(this.canvas.width, this.canvas.height, false);
    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.material.uniforms.uMap.value?.dispose?.();
    this.material.uniforms.uHeight.value?.dispose?.();
    this.material.dispose();
    for (const m of this.layerMeshes) {
      (m.material as THREE.ShaderMaterial).uniforms.uMap.value?.dispose?.();
      (m.material as THREE.ShaderMaterial).dispose();
    }
    this.geometry.dispose();
    this.renderer.dispose();
  }
}
