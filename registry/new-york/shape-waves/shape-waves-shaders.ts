export const MAX_DPR = 2;
export const MAX_MASK_SIZE = 1024;
export const NOISE_CELLS = 32;
export const TIME_RATE = 0.1;
export const SIMULATION_STEP = 1 / 60;
export const WAVE_SPEED = 0.42;
export const WAVE_FRICTION = 0.94;
export const WAVE_DECAY = 0.972;
export const SETTLED_THRESHOLD = 0.01;
const INTRO_BAND = 0.2;
const INTRO_WARP = 0.3;
const INTRO_JITTER = 0.16;
export const INTRO_END = 1 + INTRO_WARP + INTRO_JITTER + INTRO_BAND;
export const BLUR_SIGMA = 4;

export const SHAPE_MODES = {
  mixed: 0,
  squares: 1,
  circles: 2,
  triangles: 3,
} as const;

export const FULLSCREEN_VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const NOISE_GLSL = `
vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289v4(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fadeCurve(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289v3(Pi0);
  Pi1 = mod289v3(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(vec4(0.0), gx0) - 0.5);
  gy0 -= sz0 * (step(vec4(0.0), gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(vec4(0.0), gx1) - 0.5);
  gy1 -= sz1 * (step(vec4(0.0), gy1) - 0.5);

  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 f = fadeCurve(Pf0);
  vec4 nz = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), f.z);
  vec2 ny = mix(nz.xy, nz.zw, f.y);
  return 2.2 * mix(ny.x, ny.y, f.x);
}

float fbm(vec3 p) {
  float total = 0.0;
  float amplitude = 1.0;
  float weight = 0.0;
  float frequency = 1.0;
  for (int i = 0; i < 2; i++) {
    total += amplitude * cnoise(p * frequency);
    weight += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return total / weight;
}
`;

export const SCENE_FRAG = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

uniform vec2 uResolution;
uniform vec4 uPlacement;
uniform vec4 uGrid;
uniform vec4 uField;
uniform vec4 uMotion;
uniform vec3 uColor;
uniform vec4 uHover;
uniform vec3 uBackground;
uniform sampler2D uMask;
uniform sampler2D uCharges;

out vec4 fragColor;

const vec2 SEED = vec2(12.9898, 78.233);
const float GLOW_THRESHOLD = 0.6;
${NOISE_GLSL}

float sdIsoscelesTriangle(vec2 point, vec2 q) {
  vec2 p = vec2(abs(point.x), point.y);
  vec2 a = p - q * clamp(dot(p, q) / dot(q, q), 0.0, 1.0);
  vec2 b = p - q * vec2(clamp(p.x / q.x, 0.0, 1.0), 1.0);
  float s = -sign(q.y);
  vec2 d = min(vec2(dot(a, a), s * (p.x * q.y - p.y * q.x)), vec2(dot(b, b), s * (p.y - q.y)));
  return -sqrt(d.x) * sign(d.y);
}

float shapeDistance(vec2 p, int shape, float c) {
  if (shape == 0) { return max(abs(p.x), abs(p.y)) - c; }
  if (shape == 1) { return length(p) - c; }
  return sdIsoscelesTriangle(vec2(p.x, p.y + c), vec2(c, 2.0 * c));
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 resolution = uResolution;
  float cellPx = uGrid.x;
  float dotSize = uGrid.y;
  int mode = int(uGrid.z + 0.5);
  int cols = int(uGrid.w + 0.5);
  vec3 background = uBackground;
  bool toSurface = uHover.w < 0.5;
  vec4 empty = vec4(background, toSurface ? 1.0 : 0.0);

  vec2 pixel = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
  vec2 uv = pixel / resolution;
  vec2 origin = uPlacement.xy;
  int rows = int(uPlacement.z + 0.5);
  vec2 cell = floor((pixel - origin) / cellPx);
  if (cell.y < 0.0 || int(cell.y) >= rows || cell.x < 0.0 || int(cell.x) >= cols) {
    fragColor = empty;
    return;
  }
  vec2 center = origin + (cell + 0.5) * cellPx;
  vec2 local = (pixel - center) / (cellPx * 0.5);
  vec2 cellUv = center / resolution;

  if (uMotion.z > 0.5 && textureLod(uMask, cellUv, 0.0).r > 0.5) {
    fragColor = empty;
    return;
  }

  float level = 1.0;
  float fade = uMotion.w;
  if (fade > 0.0) {
    vec2 q = abs(uv * 2.0 - 1.0);
    float radius = pow(pow(q.x, 2.5) + pow(q.y, 2.5), 1.0 / 2.5) / pow(2.0, 1.0 / 2.5);
    level = 1.0 - smoothstep(max(0.0, 1.0 - fade * 2.2), 1.0, radius);
  }
  float noise = fbm(vec3((center + uMotion.xy) / uField.x + SEED, uField.w));
  float tone = clamp((noise * 0.5 + 0.5 - uField.y) * uField.z + 0.5, 0.0, 1.0);
  int band = int(min(tone, 0.999999) * 3.0);

  float charge = texelFetch(uCharges, ivec2(cell), 0).r;
  int stepped = (band + int(clamp(charge, 0.0, 0.999) * 3.0)) % 3;

  int shape = 2 - stepped;
  float size = dotSize;
  if (mode != 0) {
    shape = mode - 1;
    size = dotSize * mix(0.45, 1.0, float(stepped) / 2.0);
  }
  float introProgress = uPlacement.w;
  float front = 0.0;
  if (introProgress < ${INTRO_END.toFixed(2)}) {
    float radial = length((center - resolution * 0.5) / (resolution * 0.5)) * 0.70710678;
    float warp = cnoise(vec3(cellUv * vec2(3.2, 2.4) + SEED, 4.7)) * ${INTRO_WARP.toFixed(2)};
    float jitter = hash21(cell) * ${INTRO_JITTER.toFixed(2)};
    float spread = radial + warp + jitter + ${INTRO_WARP.toFixed(2)};
    float introBand = ${INTRO_BAND.toFixed(2)} * (0.6 + 0.8 * hash21(cell + vec2(17.0, 9.0)));
    float t = clamp((introProgress - spread) / introBand, 0.0, 1.0);
    if (t <= 0.0) {
      fragColor = empty;
      return;
    }
    float back = t - 1.0;
    size = max(size * (1.0 + 2.70158 * back * back * back + 1.70158 * back * back), 0.02);
    front = 1.0 - smoothstep(0.0, 1.0, abs(introProgress - spread) / introBand);
  }
  float aa = 2.0 / cellPx;
  float coverage = smoothstep(aa, -aa, shapeDistance(local, shape, size));

  vec3 tint = mix(uColor, uHover.rgb, max(smoothstep(0.15, 0.85, charge), front * 0.35));

  vec3 rgb = mix(background, tint, coverage * level);
  if (toSurface) {
    fragColor = vec4(rgb, 1.0);
    return;
  }
  float luminance = dot(tint * level, vec3(0.2126, 0.7152, 0.0722));
  float glow = max(0.0, (luminance - GLOW_THRESHOLD) / (1.0 - GLOW_THRESHOLD)) * coverage;
  fragColor = vec4(rgb, glow);
}
`;

export const BLUR_FRAG = `#version 300 es
precision highp float;
precision highp int;

uniform vec4 uDirection;
uniform vec2 uSize;
uniform sampler2D uSource;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  float sigma = uDirection.z;
  int radius = int(ceil(3.0 * sigma));
  vec3 sum = vec3(0.0);
  float weight = 0.0;
  for (int i = -radius; i <= radius; i++) {
    float offset = float(i);
    float w = exp(-(offset * offset) / (2.0 * sigma * sigma));
    vec4 texel = textureLod(uSource, uv + offset * uDirection.xy, 0.0);
    sum += (uDirection.w > 0.5 ? texel.rgb * texel.a : texel.rgb) * w;
    weight += w;
  }
  fragColor = vec4(sum / weight, 1.0);
}
`;

export const COMPOSITE_FRAG = `#version 300 es
precision highp float;

uniform float uStrength;
uniform vec2 uSize;
uniform sampler2D uScene;
uniform sampler2D uGlow;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  vec3 scene = textureLod(uScene, uv, 0.0).rgb;
  vec3 glow = textureLod(uGlow, uv, 0.0).rgb;
  fragColor = vec4(scene + glow * uStrength, 1.0);
}
`;

const HEX_PATTERN = /^#?([\da-f]{3}|[\da-f]{6})$/i;

export function parseColor(
  value: string | undefined,
  fallback: string,
): [number, number, number] {
  const source = typeof value === 'string' ? value.trim() : '';
  const match = HEX_PATTERN.exec(source) ?? HEX_PATTERN.exec(fallback);
  let hex = match?.[1] ?? '000000';
  if (hex.length === 3) hex = hex.replace(/./g, (char) => char + char);
  return [
    Number.parseInt(hex.slice(0, 2), 16) / 255,
    Number.parseInt(hex.slice(2, 4), 16) / 255,
    Number.parseInt(hex.slice(4, 6), 16) / 255,
  ];
}
