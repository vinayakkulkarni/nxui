// GLSL ported verbatim from React Bits GhostCursor (HEAD d9085a5).
export const GHOST_VERTEX = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const GHOST_NOISE = `
vec2 hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

vec3 gradientNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = hash2(i);
  vec2 gb = hash2(i + vec2(1.0, 0.0));
  vec2 gc = hash2(i + vec2(0.0, 1.0));
  vec2 gd = hash2(i + vec2(1.0, 1.0));
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  float k = va - vb - vc + vd;
  float value = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
  vec2 slope = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) + du * (u.yx * k + vec2(vb, vc) - va);
  return vec3(value, slope);
}
`;

export const GHOST_SIM = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uState;
uniform vec2 uSize;
uniform float uDt;
uniform float uTime;
uniform float uDecay;
uniform float uDrag;
uniform vec2 uDrift;
uniform float uTurbulence;
uniform float uSwirl;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uTrail;
uniform float uIdle;
uniform vec2 uVelocity;
uniform vec4 uPuff;
${GHOST_NOISE}
float erf(float x) {
  float x2 = x * x;
  return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732395 + 0.147 * x2) / (1.0 + 0.147 * x2)));
}
vec2 curl(vec2 p) {
  vec3 a = gradientNoise(p * uSwirl + vec2(uTime * 0.11, -uTime * 0.07));
  vec3 b = gradientNoise(p * uSwirl * 2.03 + vec2(-uTime * 0.13, uTime * 0.09) + 17.3);
  vec2 g = a.yz + b.yz * 0.5;
  return vec2(g.y, -g.x);
}
vec4 fetch(vec2 p) {
  if (p.x < 0.0 || p.y < 0.0 || p.x > uSize.x || p.y > uSize.y) return vec4(0.0);
  return texture(uState, p / uSize);
}
void main() {
  vec2 p = gl_FragCoord.xy;
  vec4 here = texture(uState, vUv);
  vec2 flow = here.gb + curl(p) * uTurbulence + uDrift;
  vec4 state = fetch(p - flow * uDt);
  float density = state.r * uDecay;
  vec2 velocity = state.gb * uDrag;

  float sigma = max(uRadius, 0.5);
  vec2 ab = uTo - uFrom;
  float len = length(ab);
  float trail = 0.0;
  if (len > 0.25) {
    vec2 dir = ab / len;
    vec2 ap = p - uFrom;
    float along = dot(ap, dir);
    float across = dot(ap, vec2(-dir.y, dir.x));
    float k = 1.4142136 * sigma;
    trail = exp(-across * across / (2.0 * sigma * sigma)) * 0.5 * (erf(along / k) - erf((along - len) / k));
  }
  vec2 dh = p - uTo;
  float head = exp(-dot(dh, dh) / (2.0 * sigma * sigma));
  density += uTrail * trail + uIdle * uDt * head;
  velocity += (uVelocity - velocity) * clamp(trail * 0.65, 0.0, 1.0);

  if (uPuff.w > 0.0) {
    vec2 d = p - uPuff.xy;
    float r2 = dot(d, d);
    float g = exp(-r2 / (2.0 * uPuff.z * uPuff.z));
    density += uPuff.w * g;
    velocity += (r2 > 0.0001 ? d / sqrt(r2) : vec2(0.0)) * g * uPuff.w * uPuff.z * 2.2;
  }

  fragColor = vec4(clamp(density, 0.0, 6.0), velocity, 1.0);
}`;

export const GHOST_SHADE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uState;
uniform vec2 uSimSize;
uniform vec2 uView;
uniform vec2 uHead;
uniform float uHeadSize;
uniform float uHeadAmount;
uniform float uTime;
uniform vec3 uColor;
uniform float uDetail;
uniform float uNoiseScale;
uniform vec2 uFlow;
uniform float uBrightness;
uniform float uTheme;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.8776, 0.4794, -0.4794, 0.8776);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p * 2.0;
    a *= 0.5;
  }
  return v;
}
float fbm5(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.8776, 0.4794, -0.4794, 0.8776);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p * 2.0;
    a *= 0.52;
  }
  return v;
}
vec4 cubic(sampler2D tex, vec2 uv, vec2 size) {
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 c0 = (i + 0.5 + w1 / g0 - 1.0) / size;
  vec2 c1 = (i + 0.5 + w3 / g1 + 1.0) / size;
  vec4 a = texture(tex, c0) * g0.x + texture(tex, vec2(c1.x, c0.y)) * g1.x;
  vec4 b = texture(tex, vec2(c0.x, c1.y)) * g0.x + texture(tex, c1) * g1.x;
  return a * g0.y + b * g1.y;
}
float field(vec2 uv, vec2 p) {
  vec2 d = p - uHead;
  return cubic(uState, uv, uSimSize).r + uHeadAmount * exp(-dot(d, d) / (2.0 * uHeadSize * uHeadSize));
}
void main() {
  vec2 p = vUv * uView;
  float density = field(vUv, p);
  if (density < 0.002) {
    fragColor = vec4(0.0);
    return;
  }
  vec2 step = vec2(1.5) / uSimSize;
  float dx = field(vUv + vec2(step.x, 0.0), p + vec2(step.x * uView.x, 0.0)) - field(vUv - vec2(step.x, 0.0), p - vec2(step.x * uView.x, 0.0));
  float dy = field(vUv + vec2(0.0, step.y), p + vec2(0.0, step.y * uView.y)) - field(vUv - vec2(0.0, step.y), p - vec2(0.0, step.y * uView.y));

  vec2 n = (p + uFlow) * uNoiseScale;
  float t = uTime;
  vec2 q = vec2(fbm(n + t * 0.1), fbm(n + vec2(5.2, 1.3) + t * 0.1));
  vec2 r = vec2(fbm(n + q * 1.8 + vec2(1.7, 9.2) + t * 0.15), fbm(n + q * 1.8 + vec2(8.3, 2.8) + t * 0.15));
  float smoke = fbm5(n + r * 1.1);
  float wisp = pow(smoothstep(0.18, 0.82, smoke), 2.0) * 2.8;
  float body = density * mix(1.0, wisp, uDetail);
  float cloud = body * smoothstep(0.0, 0.32, body) * 1.15;
  if (cloud <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  vec3 normal = normalize(vec3(-dx * 2.2, -dy * 2.2, 1.0) + vec3((q - 0.5) * 0.35 * uDetail, 0.0));
  float light = 0.7 + 0.5 * max(dot(normal, normalize(vec3(-0.35, 0.55, 0.75))), 0.0);
  float core = smoothstep(0.7, 2.2, cloud);

  vec3 tint = mix(uColor * light, mix(uColor, vec3(1.0), 0.55) * light, core);
  vec3 ink = mix(uColor, uColor * 0.78, core * 0.6) * (1.12 - 0.12 * light);
  vec3 color = mix(tint * uBrightness, ink, uTheme) * cloud;
  fragColor = vec4(color, cloud);
}`;

export const GHOST_DOWN = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uThreshold;
void main() {
  vec4 a = texture(uSource, vUv + uTexel * vec2(-0.5, -0.5));
  vec4 b = texture(uSource, vUv + uTexel * vec2(0.5, -0.5));
  vec4 c = texture(uSource, vUv + uTexel * vec2(-0.5, 0.5));
  vec4 d = texture(uSource, vUv + uTexel * vec2(0.5, 0.5));
  vec4 color = (a + b + c + d) * 0.25;
  float peak = max(color.r, max(color.g, color.b));
  float keep = peak > 0.0 ? max(peak - uThreshold, 0.0) / peak : 0.0;
  fragColor = color * keep;
}`;

export const GHOST_BLUR = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSource;
uniform vec2 uDirection;
void main() {
  vec4 color = texture(uSource, vUv) * 0.181862;
  color += (texture(uSource, vUv + uDirection * 1.423135) + texture(uSource, vUv - uDirection * 1.423135)) * 0.284316;
  color += (texture(uSource, vUv + uDirection * 3.326702) + texture(uSource, vUv - uDirection * 3.326702)) * 0.106598;
  color += (texture(uSource, vUv + uDirection * 5.242989) + texture(uSource, vUv - uDirection * 5.242989)) * 0.018156;
  fragColor = color;
}`;

export const GHOST_COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uShade;
uniform sampler2D uBloom0;
uniform sampler2D uBloom1;
uniform sampler2D uBloom2;
uniform vec2 uShadeSize;
uniform vec3 uWeights;
uniform float uBloom;
uniform float uPresence;
uniform float uGrain;
uniform float uEdge;
uniform float uTime;
uniform float uTheme;
uniform vec3 uColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec4 cubic(sampler2D tex, vec2 uv, vec2 size) {
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 c0 = (i + 0.5 + w1 / g0 - 1.0) / size;
  vec2 c1 = (i + 0.5 + w3 / g1 + 1.0) / size;
  vec4 a = texture(tex, c0) * g0.x + texture(tex, vec2(c1.x, c0.y)) * g1.x;
  vec4 b = texture(tex, vec2(c0.x, c1.y)) * g0.x + texture(tex, c1) * g1.x;
  return a * g0.y + b * g1.y;
}
void main() {
  vec4 shade = cubic(uShade, vUv, uShadeSize);
  vec4 bloom = texture(uBloom0, vUv) * uWeights.x + texture(uBloom1, vUv) * uWeights.y + texture(uBloom2, vUv) * uWeights.z;
  vec2 edge = min(vUv, 1.0 - vUv);
  float vignette = mix(1.0 - uEdge, 1.0, clamp(min(edge.x, edge.y) * 2.0, 0.0, 1.0));
  float fade = uPresence * vignette;
  float grain = hash(gl_FragCoord.xy + fract(uTime * 7.13) * 91.7) - 0.5;
  if (uTheme > 0.5) {
    float coverage = 1.0 - exp(-(shade.a + bloom.a * uBloom * 0.6) * 0.95);
    coverage = clamp(coverage * fade * (1.0 + grain * uGrain * 2.0), 0.0, 1.0);
    vec3 pigment = shade.a > 0.0001 ? clamp(shade.rgb / shade.a, 0.0, 1.0) : uColor;
    fragColor = vec4(pow(pigment, vec3(1.0 / 2.2)) * coverage, coverage);
    return;
  }
  vec3 color = (shade.rgb + bloom.rgb * uBloom) * fade;
  color = pow(1.0 - exp(-color * 0.95), vec3(1.0 / 2.2));
  color += color * grain * uGrain * 2.0;
  color = clamp(color + (hash(gl_FragCoord.xy * 1.37) - 0.5) / 255.0, 0.0, 1.0);
  fragColor = vec4(color, max(color.r, max(color.g, color.b)));
}`;
