import type { IUniform, WebGLProgramParametersWithUniforms } from 'three';

export const CORE = 8;
export const HEAD_RADIUS = 0.7;
export const HEAD_BLEND = 0.6;
export const MAX_TRAIL = 16;
export const MAX_DROPS = 96;
export const MAX_PARTS = 48;
export const DROP_LIFE = 30;
export const INTERACTIVE =
  'a, button, input, select, textarea, label, summary, [role="button"], [data-blob-grow]';

const FIELD = `
#define BLOB_MAX ${MAX_PARTS}
uniform vec4 blobSeg[BLOB_MAX];
uniform vec4 blobInfo[BLOB_MAX];
uniform int blobCount;
uniform int blobHeadEnd;
uniform int blobTubeEnd;
uniform float blobJoin;
uniform float blobLift;
uniform float blobTop;
uniform float blobRef;
uniform vec2 blobDepth;
varying vec2 vBlobSpot;

vec4 blobPart(vec2 p, int i, float z) {
  vec4 seg = blobSeg[i];
  vec2 r = blobInfo[i].xy;
  vec2 axis = seg.zw - seg.xy;
  float len = length(axis);
  if (len <= abs(r.x - r.y) + 0.001) {
    vec2 d = p - (r.x >= r.y ? seg.xy : seg.zw);
    float dist = max(sqrt(dot(d, d) + z * z), 0.0001);
    return vec4(dist - max(r.x, r.y), vec3(d, z) / dist);
  }
  vec2 dir = axis / len;
  vec2 rel = p - seg.xy;
  float u = dot(rel, dir);
  vec2 side = rel - dir * u;
  float w = sqrt(dot(side, side) + z * z);
  float b = (r.x - r.y) / len;
  float a = sqrt(1.0 - b * b);
  float along = a * u - b * w;
  vec3 f = vec3(a * w + b * u - r.x, a, b);
  if (along < 0.0) {
    float d = max(sqrt(w * w + u * u), 0.0001);
    f = vec3(d - r.x, w / d, u / d);
  } else if (along > a * len) {
    float d = max(sqrt(w * w + (u - len) * (u - len)), 0.0001);
    f = vec3(d - r.y, w / d, (u - len) / d);
  }
  return vec4(f.x, vec3(dir * f.z, 0.0) + vec3(side, z) / max(w, 0.0001) * f.y);
}

vec4 blobSmooth(vec4 a, vec4 b, float k) {
  float h = k > 0.0 ? max(k - abs(a.x - b.x), 0.0) / k : 0.0;
  float weight = b.x < a.x ? 1.0 - 0.5 * h * h : 0.5 * h * h;
  return vec4(min(a.x, b.x) - h * h * h * k / 6.0, mix(a.yzw, b.yzw, weight));
}

vec4 blobShape(vec2 p, float z) {
  vec4 body = blobPart(p, 0, z);
  for (int i = 1; i < BLOB_MAX; i++) {
    if (i >= blobHeadEnd) break;
    body = blobSmooth(body, blobPart(p, i, z), blobInfo[i].z);
  }
  if (blobTubeEnd > blobHeadEnd) {
    vec4 tube = blobPart(p, blobHeadEnd, z);
    for (int i = blobHeadEnd + 1; i < BLOB_MAX; i++) {
      if (i >= blobTubeEnd) break;
      tube = blobSmooth(tube, blobPart(p, i, z), blobInfo[i].z);
    }
    body = blobSmooth(body, tube, blobJoin);
  }
  for (int i = blobTubeEnd; i < BLOB_MAX; i++) {
    if (i >= blobCount) break;
    body = blobSmooth(body, blobPart(p, i, z), blobInfo[i].z);
  }
  return body;
}
`;

export const SURFACE = `
  vec4 blobBase = blobShape(vBlobSpot, 0.0);
  float blobAlpha = clamp(0.5 - blobBase.x / max(fwidth(blobBase.x), 0.0001), 0.0, 1.0);
  if (blobAlpha <= 0.0) discard;
  float blobLow = 0.0;
  float blobHigh = blobTop;
  float blobZ = min(sqrt(max(-blobBase.x, 0.0) * max(2.0 * blobRef + blobBase.x, 0.0)), blobTop);
  for (int k = 0; k < 8; k++) {
    vec4 blobTry = blobShape(vBlobSpot, blobZ);
    if (blobTry.x > 0.0) blobHigh = blobZ;
    else blobLow = blobZ;
    float blobNext = blobZ - blobTry.x / max(blobTry.w, 0.0001);
    blobZ = blobNext > blobLow && blobNext < blobHigh ? blobNext : 0.5 * (blobLow + blobHigh);
  }
  vec4 blobAt = blobShape(vBlobSpot, blobZ);
  vec3 blobNormal = normalize(vec3(blobAt.yz, blobAt.w / blobLift));
  gl_FragDepth = blobDepth.x - blobDepth.y * blobZ * blobLift;
`;

const SURFACE_NORMAL = `
  float faceDirection = 1.0;
  vec3 normal = normalize((viewMatrix * vec4(blobNormal, 0.0)).xyz);
  vec3 nonPerturbedNormal = normal;
`;

export function sculpt(
  shader: WebGLProgramParametersWithUniforms,
  uniforms: Record<string, IUniform>,
  body: string,
): void {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('void main() {', 'varying vec2 vBlobSpot;\nvoid main() {')
    .replace(
      '#include <project_vertex>',
      '#include <project_vertex>\n\tvBlobSpot = (modelMatrix * vec4(transformed, 1.0)).xy;',
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('void main() {', `${FIELD}\nvoid main() {\n${body}`)
    .replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      'vec4 diffuseColor = vec4( diffuse, opacity * blobAlpha );',
    )
    .replace('#include <normal_fragment_begin>', SURFACE_NORMAL);
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
