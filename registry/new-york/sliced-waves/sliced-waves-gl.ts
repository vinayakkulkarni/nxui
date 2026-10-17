import type { SlicedWavesUniformName } from './types';

export const BAR_VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 aShape;
in vec4 aTop;
in vec4 aBottom;
uniform vec2 uView;
uniform float uAngle;
out vec2 vLocal;
out vec4 vShape;
out vec4 vTop;
out vec4 vBottom;
void main() {
  float halo = aShape.z + 5.0;
  float reachX = aShape.z + max(aTop.w * 2.5, halo * 2.0);
  float reachY = aShape.w + max(aTop.w * 2.5, halo * 2.0);
  vec2 local = aCorner * vec2(reachX, reachY);
  vLocal = local;
  vShape = aShape;
  vTop = aTop;
  vBottom = aBottom;
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec2 p = aShape.xy + local - uView * 0.5;
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + uView * 0.5;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
}`;

export const BAR_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec4 vShape;
in vec4 vTop;
in vec4 vBottom;
uniform float uGlow;
uniform float uSlices;
uniform float uBase;
uniform float uHalfBar;
uniform float uScale;
out vec4 outColor;

float erfApprox(float x) {
  float a = x * x;
  float t = 1.0 - exp(-a * (1.2732395 + 0.147 * a) / (1.0 + 0.147 * a));
  return sign(x) * sqrt(max(t, 0.0));
}

float box(float d, float h, float s) {
  float k = 0.70710678 / max(s, 0.3);
  return 0.5 * (erfApprox((h - d) * k) + erfApprox((h + d) * k));
}

void main() {
  float blur = vTop.w;
  float body = box(vLocal.x, vShape.z, blur) * box(vLocal.y, vShape.w, blur * 1.15);
  float halo = vShape.z + 5.0;
  float glow = box(vLocal.x, vShape.z, halo) * box(vLocal.y, vShape.w, halo);
  float t = clamp(vLocal.y / max(vShape.w, 0.001) * 0.5 + 0.5, 0.0, 1.0);
  vec3 color = mix(vTop.rgb, vBottom.rgb, t);
  float v = clamp(vLocal.y / max(vShape.w, 0.001), -1.0, 1.0);
  float core = exp(-pow(vLocal.x / max(vShape.z + blur * 0.5, 0.5), 2.0) * 1.5);
  body *= (1.0 + 0.35 * core) * (1.0 - 0.35 * v * v * v * v);
  if (uSlices > 0.0) {
    float cell = vShape.z / max(uHalfBar, 0.00001) / uSlices;
    float y = (uBase - vShape.y - vLocal.y) / max(cell, 0.001);
    float f = 1.0 - abs(fract(y) - 0.5) * 2.0;
    float soft = clamp(blur / max(cell, 0.001) * 1.6, 0.04, 1.0);
    body *= smoothstep(0.28 - soft, 0.28 + soft, f);
  }
  vec3 tint = color * color / max(max(color.r, max(color.g, color.b)), 0.05);
  outColor = vec4((color * body + tint * uGlow * glow * 0.16) * vBottom.w * uScale, 1.0);
}`;

export const QUAD_VERTEX = `#version 300 es
in vec2 aCorner;
void main() {
  gl_Position = vec4(aCorner, 0.0, 1.0);
}`;

export const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uLight;
uniform vec2 uResolution;
uniform float uScale;
uniform float uExposure;
uniform float uGrain;
uniform float uTime;
uniform float uFade;
uniform float uOpacity;
uniform float uLightMode;
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
  vec3 hdr = texelFetch(uLight, ivec2(gl_FragCoord.xy), 0).rgb / uScale * uExposure;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  mask *= uOpacity;
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  float peak = max(hdr.r, max(hdr.g, hdr.b));
  if (uLightMode > 0.5) {
    vec3 hue = hdr / max(peak, 0.0001);
    float tone = dot(hue, vec3(0.2126, 0.7152, 0.0722));
    vec3 color = pow(clamp(hue * min(1.0, 0.66 / max(tone, 0.001)), 0.0, 1.0), vec3(1.0 / 2.2));
    float alpha = clamp((1.0 - exp(-peak * 1.1)) * 0.85 * (1.0 + grain), 0.0, 1.0) * mask;
    outColor = vec4(color * alpha, alpha);
  } else {
    vec3 mapped = 1.0 - exp(-hdr);
    mapped = mix(mapped, vec3(1.0), smoothstep(1.1, 3.2, peak) * 0.75);
    float level = max(mapped.r, max(mapped.g, mapped.b));
    mapped = clamp(mapped + grain * (0.25 + level), 0.0, 1.0) * mask;
    outColor = vec4(mapped, max(mapped.r, max(mapped.g, mapped.b)));
  }
}`;

export const TAU = Math.PI * 2;
export const MAX_RIBBONS = 6;
export const FOCAL = 1.1;
export const DISTANCE = 2.6;
export const INTRO_SECONDS = 1.5;
export const MAX_RENDER_DIM = 2560;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export const noise = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
};

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function link(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  attributes: readonly string[],
): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  attributes.forEach((name, index) =>
    gl.bindAttribLocation(program, index, name),
  );
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

export function locate(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: readonly SlicedWavesUniformName[],
) {
  const result = new Map<SlicedWavesUniformName, WebGLUniformLocation | null>();
  for (const name of names)
    result.set(name, gl.getUniformLocation(program, name));
  return (name: SlicedWavesUniformName) => result.get(name) ?? null;
}
