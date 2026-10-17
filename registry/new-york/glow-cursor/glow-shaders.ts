export const VERTEX = `#version 300 es
in vec2 aPosition;
uniform vec2 uTexel;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const HEADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
`;

export const SPLAT = `${HEADER}
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec2 uA;
uniform vec2 uB;
uniform float uRadius;
uniform float uWide;
uniform vec3 uValue;
uniform float uMode;
uniform float uStrength;
float erf(float x) {
  float x2 = x * x;
  float a = 0.147;
  return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732395 + a * x2) / (1.0 + a * x2)));
}
float sweep(float along, float length, float across, float radius) {
  return exp(-across * across / (radius * radius)) * 0.5 * (erf(along / radius) - erf((along - length) / radius));
}
void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  vec2 a = vec2(uA.x * uAspect, uA.y);
  vec2 ab = vec2(uB.x * uAspect, uB.y) - a;
  float len = length(ab);
  vec2 dir = len > 1e-6 ? ab / len : vec2(1.0, 0.0);
  vec2 ap = p - a;
  vec3 base = texture(uTarget, vUv).xyz;
  if (uMode > 1.5) {
    float along = dot(ap, dir);
    float across = dot(ap, vec2(-dir.y, dir.x));
    if (uMode > 2.5) {
      outColor = vec4(mix(base, uValue, sweep(along, len, across, uRadius) * uStrength), 1.0);
      return;
    }
    vec3 add = vec3(uValue.xy * sweep(along, len, across, uRadius), uValue.z * sweep(along, len, across, uWide));
    outColor = vec4(base + add, 1.0);
    return;
  }
  float h = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-9), 0.0, 1.0);
  vec2 d = ap - ab * h;
  float r2 = dot(d, d);
  float falloff = exp(-r2 / (uRadius * uRadius));
  float wide = exp(-r2 / (uWide * uWide));
  vec3 result = uMode > 0.5 ? mix(base, uValue, falloff * uStrength) : base + vec3(uValue.xy * falloff, uValue.z * wide);
  outColor = vec4(result, 1.0);
}`;

export const ADVECT = `${HEADER}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uVelocityTexel;
uniform float uDt;
uniform vec4 uDecay;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uVelocityTexel;
  outColor = texture(uSource, coord) * uDecay;
}`;

export const MACCORMACK = `${HEADER}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform sampler2D uForward;
uniform sampler2D uBack;
uniform vec2 uVelocityTexel;
uniform vec2 uSourceTexel;
uniform float uDt;
uniform vec4 uDecay;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uVelocityTexel;
  vec4 forward = texture(uForward, vUv);
  vec4 corrected = forward + 0.5 * (texture(uSource, vUv) - texture(uBack, vUv));
  vec2 base = (floor(coord / uSourceTexel - 0.5) + 0.5) * uSourceTexel;
  vec4 a = texture(uSource, base);
  vec4 b = texture(uSource, base + vec2(uSourceTexel.x, 0.0));
  vec4 c = texture(uSource, base + vec2(0.0, uSourceTexel.y));
  vec4 d = texture(uSource, base + uSourceTexel);
  vec4 low = min(min(a, b), min(c, d));
  vec4 high = max(max(a, b), max(c, d));
  outColor = clamp(corrected, low, high) * uDecay;
}`;

export const DIVERGENCE = `${HEADER}
uniform sampler2D uVelocity;
void main() {
  float left = texture(uVelocity, vL).x;
  float right = texture(uVelocity, vR).x;
  float top = texture(uVelocity, vT).y;
  float bottom = texture(uVelocity, vB).y;
  vec2 center = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) left = -center.x;
  if (vR.x > 1.0) right = -center.x;
  if (vT.y > 1.0) top = -center.y;
  if (vB.y < 0.0) bottom = -center.y;
  outColor = vec4(0.5 * (right - left + top - bottom), 0.0, 0.0, 1.0);
}`;

export const SCALE = `${HEADER}
uniform sampler2D uSource;
uniform float uValue;
void main() {
  outColor = texture(uSource, vUv) * uValue;
}`;

export const PRESSURE = `${HEADER}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float left = texture(uPressure, vL).x;
  float right = texture(uPressure, vR).x;
  float top = texture(uPressure, vT).x;
  float bottom = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  outColor = vec4((left + right + bottom + top - divergence) * 0.25, 0.0, 0.0, 1.0);
}`;

export const GRADIENT = `${HEADER}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float left = texture(uPressure, vL).x;
  float right = texture(uPressure, vR).x;
  float top = texture(uPressure, vT).x;
  float bottom = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(right - left, top - bottom);
  outColor = vec4(velocity, 0.0, 1.0);
}`;

const SHADE = `
uniform vec3 uColor;
uniform vec3 uSecondary;
uniform float uIntensity;
uniform float uHotspot;
vec3 shade(vec3 dye) {
  float energy = max(dye.x, 0.0);
  float heat = clamp(dye.y, 0.0, energy);
  float gas = max(dye.z, 0.0);
  float fresh = heat / max(energy, 0.0001);
  vec3 tint = mix(uSecondary, uColor, fresh);
  return (tint * energy + uSecondary * gas + vec3(heat * heat * 0.3 * uHotspot)) * uIntensity;
}`;

export const PREFILTER = `${HEADER}${SHADE}
uniform sampler2D uDye;
uniform vec2 uDyeTexel;
void main() {
  vec2 o = uDyeTexel * 0.5;
  vec3 light = shade(texture(uDye, vUv + vec2(-o.x, -o.y)).xyz);
  light += shade(texture(uDye, vUv + vec2(o.x, -o.y)).xyz);
  light += shade(texture(uDye, vUv + vec2(-o.x, o.y)).xyz);
  light += shade(texture(uDye, vUv + vec2(o.x, o.y)).xyz);
  outColor = vec4(light * 0.25, 1.0);
}`;

export const DOWN = `${HEADER}
uniform sampler2D uSource;
uniform vec2 uSourceTexel;
void main() {
  vec2 o = uSourceTexel;
  vec3 color = texture(uSource, vUv).rgb * 4.0;
  color += texture(uSource, vUv + vec2(-o.x, -o.y)).rgb;
  color += texture(uSource, vUv + vec2(o.x, -o.y)).rgb;
  color += texture(uSource, vUv + vec2(-o.x, o.y)).rgb;
  color += texture(uSource, vUv + vec2(o.x, o.y)).rgb;
  outColor = vec4(color / 8.0, 1.0);
}`;

export const UP = `${HEADER}
uniform sampler2D uSource;
uniform vec2 uSourceTexel;
void main() {
  vec2 o = uSourceTexel;
  vec3 color = texture(uSource, vUv + vec2(-o.x * 2.0, 0.0)).rgb;
  color += texture(uSource, vUv + vec2(o.x * 2.0, 0.0)).rgb;
  color += texture(uSource, vUv + vec2(0.0, -o.y * 2.0)).rgb;
  color += texture(uSource, vUv + vec2(0.0, o.y * 2.0)).rgb;
  color += texture(uSource, vUv + vec2(-o.x, -o.y)).rgb * 2.0;
  color += texture(uSource, vUv + vec2(o.x, -o.y)).rgb * 2.0;
  color += texture(uSource, vUv + vec2(-o.x, o.y)).rgb * 2.0;
  color += texture(uSource, vUv + vec2(o.x, o.y)).rgb * 2.0;
  outColor = vec4(color / 12.0, 1.0);
}`;

export const DISPLAY = `${HEADER}${SHADE}
uniform sampler2D uDye;
uniform sampler2D uBloom;
uniform float uGlow;
uniform float uGrain;
uniform float uTime;
uniform float uLight;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  vec3 dye = texture(uDye, vUv).xyz;
  vec3 light = shade(dye);
  vec3 bloom = texture(uBloom, vUv).rgb * uGlow;
  float edge = smoothstep(0.0, 0.02, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
  float grain = 1.0 + (hash(gl_FragCoord.xy + fract(uTime * 13.7) * 97.0) - 0.5) * uGrain * 2.0;
  if (uLight > 0.5) {
    float energy = max(dye.x, 0.0);
    float heat = clamp(dye.y, 0.0, energy);
    float gas = max(dye.z, 0.0);
    float fresh = heat / max(energy, 0.0001);
    vec3 tint = mix(uSecondary, uColor, fresh);
    float halo = dot(bloom, vec3(0.2126, 0.7152, 0.0722));
    float density = 1.0 - exp(-((energy * 1.1 + gas * 0.8) * uIntensity + halo * 0.25));
    float tone = dot(tint, vec3(0.2126, 0.7152, 0.0722));
    vec3 ink = tint * min(1.0, 0.5 / max(tone, 0.001)) * mix(0.95, 0.72, smoothstep(0.5, 3.0, energy));
    ink = mix(ink, vec3(1.0), clamp(heat * heat * 0.05 * uHotspot, 0.0, 0.45));
    density = clamp(density * grain, 0.0, 1.0) * edge;
    outColor = vec4(ink * density, density);
  } else {
    vec3 color = 1.0 - exp(-(light + bloom) * grain);
    color *= edge;
    outColor = vec4(color, max(color.r, max(color.g, color.b)));
  }
}`;

export const QUALITY = {
  low: { sim: 96, dye: 384 },
  medium: { sim: 128, dye: 576 },
  high: { sim: 160, dye: 768 },
} as const;

export const PRESSURE_STEPS = 20;
export const FLOW = 0.75;
export const BLOOM_LEVELS = 5;
