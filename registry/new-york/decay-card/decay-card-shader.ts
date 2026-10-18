import type { DecayCardUniform } from './types';

/** Overscan factor: the canvas is 24% larger than the card so tears can bleed out. */
export const BLEED = 1.24;

export const UNIFORMS: DecayCardUniform[] = [
  'uImage',
  'uSize',
  'uImageSize',
  'uUnit',
  'uScale',
  'uIdle',
  'uFrequency',
  'uOctaves',
  'uSeed',
  'uRadius',
  'uTime',
  'uFlow',
  'uChroma',
  'uGray',
  'uReady',
];

const VERTEX = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform vec2 uSize;
uniform vec2 uImageSize;
uniform float uUnit;
uniform float uScale;
uniform float uIdle;
uniform float uFrequency;
uniform int uOctaves;
uniform float uSeed;
uniform float uRadius;
uniform float uTime;
uniform float uFlow;
uniform float uChroma;
uniform float uGray;
uniform float uReady;
in vec2 vUv;
out vec4 fragColor;

vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n = 1.0 / 7.0;
  vec3 ns = n * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float turbulence(vec2 p, float z) {
  float sum = 0.0;
  float amp = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= uOctaves) break;
    sum += abs(snoise(vec3(p, z))) * amp;
    p = p * 2.0 + 19.19;
    amp *= 0.5;
  }
  return clamp(sum * 0.45 + 0.231, 0.0, 1.0);
}

float roundedBox(vec2 p, vec2 extent, float r) {
  vec2 q = abs(p) - extent + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec3 sampleImage(vec2 view) {
  vec2 uv = view / vec2(600.0, 750.0);
  float card = 600.0 / 750.0;
  float image = uImageSize.x / max(1.0, uImageSize.y);
  vec2 scale = card > image ? vec2(1.0, image / card) : vec2(card / image, 1.0);
  return texture(uImage, (uv - 0.5) * scale + 0.5).rgb;
}

void main() {
  vec2 view = vec2(300.0, 375.0) + (vUv * uSize - uSize * 0.5) / uUnit;
  float inside = min(min(view.x, 600.0 - view.x), min(view.y, 750.0 - view.y));
  float rim = 1.0 - smoothstep(0.0, 160.0, inside);
  float drift = snoise(vec3(view * 0.004 + uSeed * 0.37, uTime * 0.12)) * 0.5 + 0.5;
  float idle = uIdle * mix(smoothstep(0.55, 0.95, drift) * 0.5, 0.25 + 0.75 * smoothstep(0.3, 0.8, drift), rim);
  float scale = uScale * mix(0.2, 1.0, rim) + idle * 120.0;
  vec2 offset = vec2(0.0);
  if (scale > 0.01) {
    vec2 p = view * uFrequency + vec2(uSeed * 17.31, uSeed * 9.17);
    float z = uTime * (uFlow * 0.35 + uIdle * 0.5) + uSeed * 3.1;
    float red = turbulence(p, z);
    float blue = turbulence(p + vec2(31.7, 47.3), z + 5.3);
    offset = scale * (vec2(red, blue) - 0.5);
  }
  vec2 source = view + offset;
  float edge = roundedBox(source - vec2(300.0, 375.0), vec2(300.0, 375.0), uRadius);
  float alpha = (1.0 - smoothstep(-0.75 / uUnit, 0.75 / uUnit, edge)) * uReady;
  vec3 color = sampleImage(source);
  if (uChroma > 0.0) {
    vec2 split = offset * uChroma * 0.08 + vec2(uChroma * min(scale, 200.0) * 0.012, 0.0);
    color.r = sampleImage(source + split).r;
    color.b = sampleImage(source - split).b;
  }
  color = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), uGray);
  fragColor = vec4(color * alpha, alpha);
}`;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Lets a value pass up to `bound`, then only 20% of the overshoot. */
export const soften = (value: number, bound: number): number => {
  if (value > bound) return bound + (value - bound) * 0.2;
  if (value < -bound) return -bound + (value + bound) * 0.2;
  return value;
};

const compile = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

/** Compiles and links the decay program, or returns null when WebGL2 fails. */
export const createDecayProgram = (
  gl: WebGL2RenderingContext,
): WebGLProgram | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
};
