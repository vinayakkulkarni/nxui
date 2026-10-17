export const BLOOM_LEVELS = 4;
export const COARSE_RATIO = 3;
export const INTRO_SECONDS = 1.8;
export const MAX_LIGHT_PIXELS = 2400000;

export const QUAD_VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const COMMON = `#version 300 es
precision highp float;
const float PI = 3.14159265;
const float TAU = 6.28318531;
const float HALF_PI = 1.5707963;
`;

const TRACE = `
uniform vec2 uView;
uniform vec2 uOffset;
uniform float uRotation;
uniform float uFocalLength;
uniform float uTime;
uniform float uSpeed1;
uniform float uSpeed2;
uniform float uDir2;
uniform float uBend1;
uniform float uBend2;
uniform float uThickness;
uniform vec3 uHeat;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uCore;
uniform float uRange;

vec4 traceLight(vec2 pixel) {
  vec2 coord = pixel + uOffset - 0.5 * uView;
  float c = cos(uRotation);
  float sn = sin(uRotation);
  coord = mat2(c, -sn, sn, c) * coord;
  vec3 u = normalize(vec3(coord / uView.y, uFocalLength));
  vec3 o = vec3(0.0, 0.0, -7.0);
  float t = uTime * PI;
  float t1 = t * 0.7;
  float t2 = t * 0.9;
  float tSpeed1 = t * uSpeed1;
  float tSpeed2 = t * uSpeed2 * uDir2;
  float s = 1.0;
  float d = 0.0;
  vec2 k = vec2(0.0);
  for (int i = 0; i < 14; ++i) {
    vec3 p = o + u * d;
    p.x -= 15.0;
    float px = p.x;
    float swell = uHeat.y * exp(-pow((px - uHeat.x) / uHeat.z, 2.0));
    float wob1 = uBend1 + swell * (0.16 + 0.2 * uBend1) + sin(t1 + px * 0.8) * 0.1;
    float wob2 = uBend2 + swell * (0.16 + 0.2 * uBend2) + cos(t2 + px * 1.1) * 0.1;
    vec2 a = sin(vec2(px, px + HALF_PI) + tSpeed1) * wob1;
    vec2 b = cos(vec2(px, px + HALF_PI) + tSpeed2) * wob2;
    float cut = px + uThickness;
    k.x = max(cut, length(p.yz - a) - uThickness);
    k.y = max(cut, length(p.yz - b) - uThickness);
    s = min(s, min(k.x, k.y));
    if (s < 0.001 || d > 300.0) break;
    d += s * 0.7;
  }
  vec3 raw = max(cos(d * TAU) - s * sqrt(d) - vec3(k, 0.0), 0.0);
  float field = max(raw.r, max(raw.g, raw.b));
  raw.gb += 0.1;
  raw = raw * 0.4 + raw.brg * 0.6 + raw * raw;
  float lum = dot(raw, vec3(0.299, 0.587, 0.114));
  float w1 = max(0.0, 1.0 - k.x * 2.0) + 0.0001;
  float w2 = max(0.0, 1.0 - k.y * 2.0) + 0.0001;
  vec3 base = (uColor1 * w1 + uColor2 * w2) / (w1 + w2);
  float soft = smoothstep(0.03, 0.36, field);
  float hot = smoothstep(0.32, 0.8, field);
  vec3 light = base * lum * 2.6 * soft + mix(base, vec3(1.0), 0.55) * hot * uCore * 2.0;
  return vec4(light * uRange, field);
}
`;

export const COARSE = `${COMMON}
${TRACE}
uniform vec2 uScale;
out vec4 outColor;
void main() {
  outColor = traceLight(gl_FragCoord.xy * uScale);
}`;

export const FINE = `${COMMON}
${TRACE}
uniform vec2 uScale;
uniform sampler2D uCoarse;
uniform vec2 uCoarseSize;
uniform vec2 uFineSize;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uFineSize;
  vec2 pos = uv * uCoarseSize - 0.5;
  ivec2 cell = ivec2(floor(pos));
  ivec2 last = ivec2(uCoarseSize) - 1;
  float a = texelFetch(uCoarse, clamp(cell, ivec2(0), last), 0).a;
  float b = texelFetch(uCoarse, clamp(cell + ivec2(1, 0), ivec2(0), last), 0).a;
  float c = texelFetch(uCoarse, clamp(cell + ivec2(0, 1), ivec2(0), last), 0).a;
  float d = texelFetch(uCoarse, clamp(cell + ivec2(1, 1), ivec2(0), last), 0).a;
  float high = max(max(a, b), max(c, d));
  float low = min(min(a, b), min(c, d));
  if (high > 0.02 && low < 0.4) outColor = traceLight(gl_FragCoord.xy * uScale);
  else outColor = texture(uCoarse, uv);
}`;

export const DOWN = `${COMMON}
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec4 sum = texture(uSource, uv) * 4.0;
  sum += texture(uSource, uv - uTexel);
  sum += texture(uSource, uv + uTexel);
  sum += texture(uSource, uv + vec2(uTexel.x, -uTexel.y));
  sum += texture(uSource, uv - vec2(uTexel.x, -uTexel.y));
  outColor = sum / 8.0;
}`;

export const UP = `${COMMON}
uniform sampler2D uSource;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec2 h = uTexel * 0.5;
  vec4 sum = texture(uSource, uv + vec2(-h.x * 2.0, 0.0));
  sum += texture(uSource, uv + vec2(h.x * 2.0, 0.0));
  sum += texture(uSource, uv + vec2(0.0, -h.y * 2.0));
  sum += texture(uSource, uv + vec2(0.0, h.y * 2.0));
  sum += texture(uSource, uv + vec2(-h.x, h.y)) * 2.0;
  sum += texture(uSource, uv + h) * 2.0;
  sum += texture(uSource, uv + vec2(h.x, -h.y)) * 2.0;
  sum += texture(uSource, uv - h) * 2.0;
  outColor = sum / 12.0 + texture(uBase, uv);
}`;

export const COMPOSITE = `${COMMON}
uniform sampler2D uLight;
uniform sampler2D uBloom;
uniform vec2 uResolution;
uniform float uExposure;
uniform float uGlow;
uniform float uCore;
uniform float uPresence;
uniform float uGrain;
uniform float uFade;
uniform float uOpacity;
uniform float uTime;
uniform float uLightMode;
uniform vec3 uLens;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float smootherstep(float edge, float x) {
  float t = clamp(x / max(edge, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 offset = gl_FragCoord.xy - uLens.xy;
  float lens = uLens.z * exp(-dot(offset, offset) / (uResolution.y * uResolution.y * 0.045));
  vec4 source = texture(uLight, uv);
  vec3 hdr = source.rgb * uExposure * uPresence * (1.0 + lens * 0.35);
  hdr += texture(uBloom, uv).rgb * uExposure * uPresence * uGlow * (0.18 + lens * 0.08);
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  float peak = max(hdr.r, max(hdr.g, hdr.b));
  if (uLightMode > 0.5) {
    vec3 hue = hdr / max(peak, 0.0001);
    float tone = dot(hue, vec3(0.2126, 0.7152, 0.0722));
    vec3 ink = pow(clamp(hue * min(1.0, 0.6 / max(tone, 0.001)), 0.0, 1.0), vec3(1.0 / 2.2));
    float feather = max(fwidth(source.a) * 1.25, 0.02);
    float body = smoothstep(0.15 - feather, 0.15 + feather, source.a) * uPresence;
    vec3 color = mix(ink, vec3(1.0), smoothstep(12.0, 26.0, peak) * uCore);
    float halo = (1.0 - exp(-peak * 0.5)) * 0.3 * min(uGlow, 1.5);
    float alpha = clamp(body * 0.92 + (1.0 - body) * halo, 0.0, 1.0) * mask * uOpacity;
    color = mix(ink, color, body);
    outColor = vec4(clamp(color + grain, 0.0, 1.0) * alpha, alpha);
  } else {
    vec3 mapped = 1.0 - exp(-hdr);
    float level = max(mapped.r, max(mapped.g, mapped.b));
    mapped = clamp(mapped + grain * level, 0.0, 1.0) * mask * uOpacity;
    outColor = vec4(mapped, max(mapped.r, max(mapped.g, mapped.b)));
  }
}`;
