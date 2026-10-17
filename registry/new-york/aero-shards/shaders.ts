// GLSL ES 3.00 ports of the upstream WGSL passes. Every pass works in
// top-left pixel space like WebGPU; `pixelOf()` flips gl_FragCoord.y.

const HEAD = `#version 300 es
precision highp float;
precision highp int;
`;

const FRAME = `
uniform vec4 uFrame[9];
#define F_VIEW uFrame[0]
#define F_EYE uFrame[1]
#define F_FORWARD uFrame[2]
#define F_RIGHT uFrame[3]
#define F_UP uFrame[4]
#define F_SHARD uFrame[5]
#define F_ACCENT uFrame[6]
#define F_MARKER uFrame[7]
#define F_SURFACE uFrame[8]
`;

const SHARD_VARYINGS = `
flat VARY vec4 vCenter;
flat VARY vec4 vAxis;
flat VARY vec4 vNormal;
flat VARY vec4 vP01;
flat VARY vec4 vP23;
flat VARY vec4 vP4;
flat VARY vec4 vTopA;
flat VARY vec4 vTopB;
flat VARY vec4 vBotA;
flat VARY vec4 vBotB;
flat VARY vec4 vLast;
`;

export const SHARD_VERT = `${HEAD}${FRAME}
uniform vec4 uLayerView;
uniform vec4 uLayerLook;
layout(location = 0) in vec4 aA;
layout(location = 1) in vec4 aB;
layout(location = 2) in vec4 aC;
layout(location = 3) in vec4 aD;
layout(location = 4) in vec4 aE;
layout(location = 5) in vec4 aF;
#define VARY out
${SHARD_VARYINGS}

vec3 project(vec3 world) {
  vec3 offset = world - F_EYE.xyz;
  float depth = max(dot(offset, F_FORWARD.xyz), 0.05);
  float x = dot(offset, F_RIGHT.xyz);
  float y = dot(offset, F_UP.xyz);
  return vec3(uLayerView.x * 0.5 + x * uLayerView.z / depth, uLayerView.y * 0.5 - y * uLayerView.z / depth, depth);
}

void main() {
  vec3 center = aA.xyz;
  float size = aA.w;
  vec3 axis = normalize(aB.xyz);
  vec3 normal = normalize(aC.xyz);
  vec3 side = normalize(cross(normal, axis));
  vec3 middle = project(center);
  if (middle.z < 0.35 || size <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 0.5, 1.0);
    return;
  }
  int count = int(aF.z);
  vec2 points[5] = vec2[5](aD.xy, aD.zw, aE.xy, aE.zw, aF.xy);
  vec2 tops[5];
  vec2 bottoms[5];
  vec2 low = vec2(1e9);
  vec2 high = vec2(-1e9);
  for (int i = 0; i < 5; i += 1) {
    vec2 corner = points[min(i, count - 1)];
    vec3 onPlate = center + (axis * corner.x + side * corner.y) * size;
    vec3 top = project(onPlate + normal * aB.w * size);
    vec3 bottom = project(onPlate - normal * aB.w * size);
    tops[i] = top.xy;
    bottoms[i] = bottom.xy;
    low = min(low, min(top.xy, bottom.xy));
    high = max(high, max(top.xy, bottom.xy));
  }
  low -= vec2(2.0);
  high += vec2(2.0);
  vec2 corners[6] = vec2[6](vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, 1.0), vec2(1.0, 0.0), vec2(1.0, 1.0));
  vec2 pixel = mix(low, high, corners[gl_VertexID % 6]);
  gl_Position = vec4(pixel.x / uLayerView.x * 2.0 - 1.0, 1.0 - pixel.y / uLayerView.y * 2.0, 0.5, 1.0);
  vCenter = aA;
  vAxis = vec4(axis, aB.w);
  vNormal = vec4(normal, aC.w);
  vP01 = aD;
  vP23 = aE;
  vP4 = aF;
  vTopA = vec4(tops[0], tops[1]);
  vTopB = vec4(tops[2], tops[3]);
  vBotA = vec4(bottoms[0], bottoms[1]);
  vBotB = vec4(bottoms[2], bottoms[3]);
  vLast = vec4(tops[4], bottoms[4]);
}
`;

const SHARD_SHADE = `${HEAD}${FRAME}
uniform vec4 uLayerView;
uniform vec4 uLayerLook;
#define VARY in
${SHARD_VARYINGS}
layout(location = 0) out vec4 outColor;

float cross2(vec2 a, vec2 b) {
  return a.x * b.y - a.y * b.x;
}

float outlineCoverage(vec2 p, vec2 points[5], int count) {
  float area = 0.0;
  for (int i = 0; i < 5; i += 1) {
    if (i < count) area += cross2(points[i], points[(i + 1) % count]);
  }
  float orient = area > 0.0 ? 1.0 : -1.0;
  float dist = -1e9;
  for (int i = 0; i < 5; i += 1) {
    if (i < count) {
      vec2 a = points[i];
      vec2 edge = points[(i + 1) % count] - a;
      float span = length(edge);
      if (span > 1e-4) {
        vec2 n = vec2(edge.y, -edge.x) * (orient / span);
        dist = max(dist, dot(p - a, n));
      }
    }
  }
  return clamp(0.5 - dist, 0.0, 1.0);
}

vec2 gPoints[5];
int gCount;
float gHalf;

vec4 plane(int k) {
  if (k == 0) return vec4(0.0, 0.0, 1.0, gHalf);
  if (k == 1) return vec4(0.0, 0.0, -1.0, gHalf);
  vec2 a = gPoints[k - 2];
  vec2 b = gPoints[(k - 1) % gCount];
  vec2 edge = b - a;
  vec2 n = normalize(vec2(edge.y, -edge.x));
  return vec4(n, 0.0, dot(n, a));
}

float gHitNear;
float gHitFar;
vec3 gHitNormal;

void trace(vec3 ro, vec3 rd) {
  gHitNear = -1e9;
  gHitFar = 1e9;
  gHitNormal = vec3(0.0, 0.0, 1.0);
  for (int k = 0; k < 7; k += 1) {
    if (k < gCount + 2) {
      vec4 p = plane(k);
      float denom = dot(p.xyz, rd);
      float gap = p.w - dot(p.xyz, ro);
      if (abs(denom) < 1e-7) {
        if (gap < 0.0) gHitFar = -1e9;
      } else {
        float t = gap / denom;
        if (denom < 0.0) {
          if (t > gHitNear) {
            gHitNear = t;
            gHitNormal = p.xyz;
          }
        } else if (t < gHitFar) {
          gHitFar = t;
        }
      }
    }
  }
}

vec4 exitFrom(vec3 ro, vec3 rd) {
  float best = 1e9;
  vec3 normal = vec3(0.0, 0.0, -1.0);
  for (int k = 0; k < 7; k += 1) {
    if (k < gCount + 2) {
      vec4 p = plane(k);
      float denom = dot(p.xyz, rd);
      if (denom > 1e-6) {
        float t = (p.w - dot(p.xyz, ro)) / denom;
        if (t < best) {
          best = t;
          normal = p.xyz;
        }
      }
    }
  }
  return vec4(normal, max(best, 0.0));
}

float rectLight(vec3 r, vec3 dir, vec3 across, vec2 extent, float soft) {
  float facing = dot(r, dir);
  if (facing <= 0.0) return 0.0;
  vec3 up = cross(dir, across);
  float u = dot(r, across) / facing;
  float v = dot(r, up) / facing;
  float a = 1.0 - smoothstep(extent.x - soft, extent.x + soft, abs(u));
  float b = 1.0 - smoothstep(extent.y - soft, extent.y + soft, abs(v));
  return a * b;
}

const vec3 KEY_DIR = normalize(vec3(-0.28, 0.72, 0.64));
const vec3 KEY_ACROSS = normalize(vec3(0.92, 0.0, 0.4));
const vec3 LEFT_DIR = normalize(vec3(-0.86, 0.12, 0.5));
const vec3 LEFT_ACROSS = normalize(vec3(0.5, 0.0, 0.86));
const vec3 RIM_DIR = normalize(vec3(0.78, 0.22, -0.58));
const vec3 RIM_ACROSS = vec3(0.6, 0.0, 0.8);
const vec3 TOP_DIR = normalize(vec3(0.05, 0.94, -0.33));
const vec3 TOP_ACROSS = vec3(1.0, 0.0, 0.0);

float lobe(vec3 r, vec3 dir, float width) {
  return exp((dot(r, dir) - 1.0) / (width * width));
}

vec3 studio(vec3 r, float soft, vec3 accent, vec3 ink) {
  float sky = clamp(r.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(ink * 0.03, ink * 0.12 + accent * 0.03, smoothstep(0.25, 0.95, sky));
  col += mix(ink, vec3(1.0), 0.6) * lobe(r, KEY_DIR, 0.38) * 3.6;
  col += mix(accent, vec3(1.0), 0.2) * lobe(r, RIM_DIR, 0.34) * 3.4;
  col += vec3(1.0, 0.98, 1.0) * rectLight(r, LEFT_DIR, LEFT_ACROSS, vec2(0.12, 0.8), 0.08 + soft) * 3.2;
  col += vec3(1.0, 0.98, 1.0) * rectLight(r, TOP_DIR, TOP_ACROSS, vec2(0.9, 0.1), 0.08 + soft) * 2.6;
  return col;
}

vec3 studioLight(vec3 r, float soft, vec3 accent) {
  vec3 ground = vec3(0.2, 0.2, 0.23);
  vec3 skyTone = vec3(0.97, 0.97, 0.99);
  vec3 col = mix(ground, skyTone, smoothstep(-0.08 - soft, 0.16 + soft, r.y));
  col = mix(col, vec3(0.55, 0.55, 0.6), lobe(r, vec3(0.0, -1.0, 0.0), 0.5) * 0.4);
  col += vec3(0.4) * rectLight(r, KEY_DIR, KEY_ACROSS, vec2(0.46, 0.3), 0.07 + soft);
  col -= vec3(0.55) * rectLight(r, LEFT_DIR, LEFT_ACROSS, vec2(0.1, 0.85), 0.05 + soft);
  col -= vec3(0.45) * rectLight(r, RIM_DIR, RIM_ACROSS, vec2(0.12, 0.9), 0.05 + soft);
  return clamp(col, vec3(0.05), vec3(1.2));
}

float schlick(float cosine, float f0) {
  return f0 + (1.0 - f0) * pow(1.0 - clamp(cosine, 0.0, 1.0), 5.0);
}

vec3 rayFor(vec2 pixel) {
  float x = pixel.x - uLayerView.x * 0.5;
  float y = uLayerView.y * 0.5 - pixel.y;
  return normalize(F_FORWARD.xyz * uLayerView.z + F_RIGHT.xyz * x + F_UP.xyz * y);
}

float sCoverage;
vec3 sColor;
float sAlpha;
float sDepth;

void shade(vec2 pixel) {
  vec3 center = vCenter.xyz;
  float size = vCenter.w;
  vec3 axis = vAxis.xyz;
  vec3 plateNormal = vNormal.xyz;
  vec3 side = normalize(cross(plateNormal, axis));
  gPoints[0] = vP01.xy;
  gPoints[1] = vP01.zw;
  gPoints[2] = vP23.xy;
  gPoints[3] = vP23.zw;
  gPoints[4] = vP4.xy;
  gCount = int(vP4.z);
  gHalf = vAxis.w;

  vec3 eye = F_EYE.xyz;
  mat3 fromLocal = mat3(axis, side, plateNormal);
  mat3 toLocal = transpose(fromLocal);
  vec3 origin = toLocal * (eye - center) / size;

  vec3 rd = rayFor(pixel);
  vec3 ray = toLocal * rd;
  float denom = ray.z;
  float flatT = -origin.z / (abs(denom) < 1e-4 ? 1e-4 : denom);
  vec2 flatPoint = origin.xy + ray.xy * flatT;
  float footprint = max(length(fwidth(flatPoint)) * 0.7, 1e-4);
  float softBase = clamp(length(fwidth(reflect(rd, plateNormal))) * 0.5, 0.0, 0.5);

  trace(origin, ray);
  vec2 tops[5] = vec2[5](vTopA.xy, vTopA.zw, vTopB.xy, vTopB.zw, vLast.xy);
  vec2 bottoms[5] = vec2[5](vBotA.xy, vBotA.zw, vBotB.xy, vBotB.zw, vLast.zw);
  float coverage = max(outlineCoverage(pixel, tops, gCount), outlineCoverage(pixel, bottoms, gCount));

  float facing = origin.z > 0.0 ? 1.0 : -1.0;
  float capT = (facing * gHalf - origin.z) / (abs(ray.z) < 1e-4 ? -1e-4 * facing : ray.z);
  bool missed = gHitNear > gHitFar;
  float hitT = missed ? capT : gHitNear;
  vec3 hitNormal = missed ? vec3(0.0, 0.0, facing) : gHitNormal;
  sCoverage = hitT > 0.0 ? coverage : 0.0;
  sColor = vec3(0.0);
  sAlpha = 0.0;
  sDepth = 1.0;
  if (sCoverage <= 0.0) return;

  vec3 local = origin + ray * hitT;
  vec3 worldRay = fromLocal * ray;
  float viewDepth = max(hitT * size * dot(worldRay, F_FORWARD.xyz), 0.05);
  sDepth = clamp(1.0 - 0.3 / viewDepth, 0.0, 1.0);

  float radius = max(gHalf * 1.15, footprint * 2.5);
  vec3 n = hitNormal;
  float bevel = 0.0;
  if (abs(n.z) > 0.5) {
    float gap = 1e9;
    for (int k = 2; k < 7; k += 1) {
      if (k < gCount + 2) {
        vec4 p = plane(k);
        gap = min(gap, p.w - dot(p.xy, local.xy));
      }
    }
    vec2 toward = vec2(0.0);
    for (int k = 2; k < 7; k += 1) {
      if (k < gCount + 2) {
        vec4 p = plane(k);
        float g = p.w - dot(p.xy, local.xy);
        toward += p.xy * exp(-(g - gap) / (radius * 0.35));
      }
    }
    toward = normalize(toward);
    bevel = clamp(1.0 - gap / radius, 0.0, 1.0);
    float angle = bevel * bevel * 0.7853982;
    n = normalize(n * cos(angle) + vec3(toward, 0.0) * sin(angle));
  } else {
    float gap = gHalf - abs(local.z);
    bevel = clamp(1.0 - gap / radius, 0.0, 1.0);
    float angle = bevel * bevel * 0.7853982;
    n = normalize(n * cos(angle) + vec3(0.0, 0.0, sign(local.z)) * sin(angle));
  }
  float bendRate = 1.8 / max(radius / footprint, 1.0);
  vec3 normal = normalize(fromLocal * n);
  vec3 view = -worldRay;
  vec3 reflected = reflect(worldRay, normal);
  float soft = softBase + bendRate * smoothstep(0.0, 0.25, bevel) * 1.2 + clamp(footprint * 0.6, 0.0, 0.5);
  float ndv = clamp(dot(normal, view), 0.0, 1.0);

  vec3 accent = F_ACCENT.rgb;
  vec3 base = F_SHARD.rgb;
  vec3 world = center + fromLocal * local * size;
  float height = clamp(0.5 + world.y * 0.45, 0.0, 1.0);
  vec3 tone = mix(accent, base, height);
  vec3 body = mix(tone, mix(base, accent, 0.5), vNormal.w * 0.3);
  float mode = F_SURFACE.x;
  bool lightMode = F_UP.w > 0.5;
  float wrap = clamp(dot(normal, KEY_DIR) * 0.5 + 0.5, 0.0, 1.0);

  vec3 color = vec3(0.0);
  float alpha = 1.0;
  bool chrome = mode > 0.5;
  if (lightMode) {
    vec3 env = studioLight(reflected, soft, accent);
    if (chrome) {
      color = env * mix(body, vec3(1.0), 0.6);
    } else {
      float fresnel = schlick(ndv, 0.05);
      float diffuse = clamp(dot(normal, KEY_DIR) * 0.5 + 0.5, 0.0, 1.0);
      alpha = clamp(0.32 + fresnel * 0.5 + (1.0 - abs(n.z)) * 0.5, 0.0, 1.0);
      color = mix(body, vec3(1.0), 0.15) * (0.5 + 0.4 * diffuse) * alpha + (env - vec3(0.78)) * fresnel * 0.8;
    }
  } else if (chrome) {
    vec3 env = studio(reflected, soft, accent, body);
    color = env * mix(body, vec3(1.0), 0.55) * 0.9 + body * 0.02;
  } else {
    float fresnel = schlick(ndv, 0.04);
    vec3 env = studio(reflected, soft, accent, body);
    vec3 light = vec3(0.0);
    vec3 cursor = local;
    vec3 direction = toLocal * refract(worldRay, normal, 1.0 / 1.5);
    float travelled = 0.0;
    float carry = 1.0 - fresnel;
    float through = 0.0;
    for (int bounce = 0; bounce < 3; bounce += 1) {
      vec4 outlet = exitFrom(cursor, direction);
      travelled += outlet.w;
      cursor = cursor + direction * outlet.w;
      vec3 outward = outlet.xyz;
      vec3 escaped = refract(direction, -outward, 1.5);
      if (dot(escaped, escaped) > 0.0) {
        float leave = schlick(dot(direction, outward), 0.04);
        vec3 worldOut = normalize(fromLocal * escaped);
        vec3 absorb = exp(-(vec3(1.0) - body) * travelled * size * 22.0);
        float straight = smoothstep(0.97, 0.999, dot(worldOut, worldRay));
        float energy = carry * (1.0 - leave);
        light += studio(worldOut, soft * 2.0 + 0.04, accent, body) * absorb * energy * (1.0 - straight) * 2.0;
        through += energy * straight * (absorb.r + absorb.g + absorb.b) / 3.0;
        carry *= leave;
      }
      direction = reflect(direction, outward);
    }
    float edge = max(pow(1.0 - abs(n.z), 1.2), bevel * bevel * 0.85);
    vec3 glow = mix(mix(body, accent, 0.35), vec3(1.0), 0.28) * edge * (0.35 + 0.45 * wrap);
    color = env * fresnel * 0.85 + light * (1.0 - smoothstep(0.0, 0.6, bevel)) + body * 0.02 + glow;
    alpha = clamp(1.0 - through + edge * 0.25, 0.0, 1.0);
  }

  color *= lightMode ? 1.0 : 1.3;
  float haze = smoothstep(3.5, 12.0, viewDepth) * uLayerLook.x;
  vec3 hazeColor = lightMode ? mix(base, vec3(1.0), 0.72) : mix(base, accent, 0.5) * 0.3;
  color = mix(color, hazeColor * alpha + color * 0.3, haze);
  float flash = vP4.w;
  color += mix(accent, vec3(1.0), 0.35) * flash * (lightMode ? 0.0 : 0.5) * max(alpha, 0.35);
  alpha = max(alpha, flash * 0.45 * (lightMode ? 0.0 : 1.0));
  sColor = color;
  sAlpha = alpha;
}

vec2 pixelOf() {
  return vec2(gl_FragCoord.x, uLayerView.y - gl_FragCoord.y);
}
`;

export const SHARD_FRAG_SOLID = `${SHARD_SHADE}
void main() {
  shade(pixelOf());
  if (sCoverage < 0.999 || sAlpha < 0.6) discard;
  outColor = vec4(sColor, sAlpha);
  gl_FragDepth = sDepth;
}
`;

export const SHARD_FRAG_EDGE = `${SHARD_SHADE}
void main() {
  shade(pixelOf());
  if (sCoverage <= 0.001 || (sCoverage >= 0.9996 && sAlpha >= 0.62)) discard;
  outColor = vec4(sColor, sAlpha) * sCoverage;
  gl_FragDepth = sDepth;
}
`;

export const FULLSCREEN_VERT = `${HEAD}
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const LAYER_BLUR_FRAG = `${HEAD}
uniform sampler2D uSource;
uniform vec4 uTexel;
in vec2 vUv;
layout(location = 0) out vec4 outColor;
void main() {
  float sigma = max(uTexel.z, 0.3);
  int reach = min(int(ceil(sigma * 2.6)), 20);
  vec4 total = textureLod(uSource, vUv, 0.0);
  float weight = 1.0;
  for (int i = 1; i <= 20; i += 1) {
    if (i > reach) break;
    float w = exp(-float(i * i) / (2.0 * sigma * sigma));
    vec2 o = uTexel.xy * float(i);
    total += (textureLod(uSource, vUv + o, 0.0) + textureLod(uSource, vUv - o, 0.0)) * w;
    weight += 2.0 * w;
  }
  outColor = total / weight;
}
`;

// Top-left pixel space: "down" in WebGPU is -y in GL, so y offsets flip.
export const SHADOW_FRAG = `${HEAD}
uniform sampler2D uSource;
uniform sampler2D uDepth;
uniform vec4 uInfo;
uniform vec4 uMore;
layout(location = 0) out vec4 outColor;
void main() {
  ivec2 bounds = textureSize(uSource, 0) - ivec2(1);
  ivec2 here = ivec2(gl_FragCoord.xy);
  vec4 color = texelFetch(uSource, here, 0);
  if (color.a <= 0.002 || uInfo.z <= 0.0) {
    outColor = color;
    return;
  }
  float depth = texelFetch(uDepth, here, 0).r;
  float east = texelFetch(uDepth, clamp(here + ivec2(1, 0), ivec2(0), bounds), 0).r;
  float west = texelFetch(uDepth, clamp(here - ivec2(1, 0), ivec2(0), bounds), 0).r;
  float south = texelFetch(uDepth, clamp(here - ivec2(0, 1), ivec2(0), bounds), 0).r;
  float north = texelFetch(uDepth, clamp(here + ivec2(0, 1), ivec2(0), bounds), 0).r;
  float limit = uMore.x * 0.5;
  float slopeX = clamp(abs(depth - west) < abs(east - depth) ? depth - west : east - depth, -limit, limit);
  float slopeY = clamp(abs(depth - north) < abs(south - depth) ? depth - north : south - depth, -limit, limit);
  float occlusion = 0.0;
  for (int i = 1; i <= 12; i += 1) {
    vec2 offset = -uInfo.xy * float(i);
    ivec2 probe = clamp(ivec2(gl_FragCoord.xy + vec2(offset.x, -offset.y)), ivec2(0), bounds);
    float other = texelFetch(uDepth, probe, 0).r;
    float expected = depth + slopeX * offset.x + slopeY * offset.y;
    float closer = smoothstep(uMore.x * 0.6, uMore.x * 2.4, expected - other);
    float reach = 1.0 - float(i - 1) / 12.0;
    occlusion = max(occlusion, closer * reach * reach);
  }
  outColor = vec4(color.rgb * (1.0 - occlusion * uInfo.z), color.a);
}
`;

export const COMPOSITE_FRAG = `${HEAD}
uniform sampler2D uSource;
uniform vec4 uInfo;
in vec2 vUv;
layout(location = 0) out vec4 outColor;
void main() {
  outColor = textureLod(uSource, vUv, 0.0) * uInfo.x;
}
`;

export const MARKER_VERT = `${HEAD}${FRAME}
layout(location = 0) in vec4 aA;
layout(location = 1) in vec4 aB;
out vec2 vLocal;
flat out vec4 vShape;
flat out vec4 vLight;
void main() {
  vec3 offset = aA.xyz - F_EYE.xyz;
  float depth = max(dot(offset, F_FORWARD.xyz), 0.05);
  vec2 center = vec2(
    F_VIEW.x * 0.5 + dot(offset, F_RIGHT.xyz) * F_VIEW.z / depth,
    F_VIEW.y * 0.5 - dot(offset, F_UP.xyz) * F_VIEW.z / depth
  );
  float pixel = F_MARKER.y;
  float size = F_MARKER.z * clamp(sqrt(F_MARKER.w / depth), 0.6, 1.3) * aB.z;
  float blur = min(F_FORWARD.w * abs(1.0 - F_EYE.w / depth), F_RIGHT.w) * 0.18;
  float frame = aB.y;
  float reach = (frame > 0.001 ? size * 2.6 : size) + blur + 1.5 * pixel;
  vec2 corners[6] = vec2[6](vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0), vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0));
  vec2 corner = corners[gl_VertexID % 6] * reach;
  vLocal = corner;
  vShape = vec4(size, blur, frame, pixel);
  vLight = vec4(aB.x, aA.w, 0.0, 0.0);
  if (depth < 0.35 || aA.w <= 0.002) {
    gl_Position = vec4(2.0, 2.0, 0.5, 1.0);
    return;
  }
  vec2 at = center + corner;
  gl_Position = vec4(at.x / F_VIEW.x * 2.0 - 1.0, 1.0 - at.y / F_VIEW.y * 2.0, 0.5, 1.0);
}
`;

export const MARKER_FRAG = `${HEAD}${FRAME}
in vec2 vLocal;
flat in vec4 vShape;
flat in vec4 vLight;
layout(location = 0) out vec4 outColor;
float bar(float value, float edge, float soft) {
  return clamp((edge - value) / soft + 0.5, 0.0, 1.0);
}
void main() {
  float size = vShape.x;
  float blur = vShape.y;
  float frame = vShape.z;
  float pixel = vShape.w;
  vec2 q = abs(vLocal);
  float soft = 1.0 + blur;
  float thick = 0.6 * pixel + blur * 0.5;
  float energy = (0.6 * pixel) / thick;
  float cover = 0.0;
  if (F_MARKER.x < 0.5) {
    float across = bar(q.x, size, soft) * bar(q.y, thick, soft);
    float down = bar(q.y, size, soft) * bar(q.x, thick, soft);
    cover = max(across, down) * energy;
  } else {
    cover = bar(length(vLocal), size * 0.42 + blur * 0.3, soft) * mix(1.0, energy, 0.6);
  }
  if (frame > 0.001) {
    float edge = size * 2.3;
    float span = edge * 0.45;
    float line = 0.5 * pixel;
    float sides = bar(abs(q.x - edge), line, 1.0) * bar(edge - span - q.y, 0.0, 1.0) * bar(q.y - edge - line, 0.0, 1.0);
    float caps = bar(abs(q.y - edge), line, 1.0) * bar(edge - span - q.x, 0.0, 1.0) * bar(q.x - edge - line, 0.0, 1.0);
    cover = max(cover, max(sides, caps) * frame * 0.85);
  }
  float glow = vLight.x;
  float fade = vLight.y;
  vec3 tint = mix(F_SHARD.rgb, F_ACCENT.rgb, 0.4);
  if (F_UP.w > 0.5) {
    float ink = (1.0 - exp(-glow * 1.6)) * 0.85 * cover * fade;
    outColor = vec4(mix(tint, F_ACCENT.rgb, 0.5) * 0.55 * ink, ink);
    return;
  }
  float light = cover * glow * fade;
  vec3 color = (1.0 - exp(-mix(tint, vec3(1.0), 0.35) * light * 1.6)) * 1.4;
  outColor = vec4(color, max(max(color.r, color.g), color.b) * 0.8);
}
`;

export const PREFILTER_FRAG = `${HEAD}
uniform sampler2D uSource;
uniform vec4 uTexel;
in vec2 vUv;
layout(location = 0) out vec4 outColor;
vec3 bright(vec2 uv) {
  vec3 color = textureLod(uSource, uv, 0.0).rgb;
  float peak = max(max(color.r, color.g), color.b);
  return color * smoothstep(uTexel.z, uTexel.z + uTexel.w, peak);
}
void main() {
  vec2 o = uTexel.xy;
  vec3 total = bright(vUv + vec2(o.x, o.y)) + bright(vUv + vec2(-o.x, o.y)) + bright(vUv + vec2(o.x, -o.y)) + bright(vUv - o);
  outColor = vec4(total * 0.25, 0.0);
}
`;

export const DOWNSAMPLE_FRAG = `${HEAD}
uniform sampler2D uSource;
uniform vec4 uTexel;
in vec2 vUv;
layout(location = 0) out vec4 outColor;
void main() {
  vec2 o = uTexel.xy;
  vec4 color = textureLod(uSource, vUv, 0.0) * 0.25;
  color += textureLod(uSource, vUv + vec2(o.x, o.y), 0.0) * 0.1875;
  color += textureLod(uSource, vUv + vec2(-o.x, o.y), 0.0) * 0.1875;
  color += textureLod(uSource, vUv + vec2(o.x, -o.y), 0.0) * 0.1875;
  color += textureLod(uSource, vUv - o, 0.0) * 0.1875;
  outColor = color;
}
`;

export const BLUR_FRAG = `${HEAD}
uniform sampler2D uSource;
uniform vec4 uTexel;
in vec2 vUv;
layout(location = 0) out vec4 outColor;
void main() {
  vec2 delta = uTexel.xy;
  vec4 color = textureLod(uSource, vUv, 0.0) * 0.181862;
  color += (textureLod(uSource, vUv + delta * 1.423135, 0.0) + textureLod(uSource, vUv - delta * 1.423135, 0.0)) * 0.284316;
  color += (textureLod(uSource, vUv + delta * 3.326702, 0.0) + textureLod(uSource, vUv - delta * 3.326702, 0.0)) * 0.106598;
  color += (textureLod(uSource, vUv + delta * 5.242989, 0.0) + textureLod(uSource, vUv - delta * 5.242989, 0.0)) * 0.018156;
  outColor = color;
}
`;

export const FINISH_FRAG = `${HEAD}
uniform sampler2D uScene;
uniform sampler2D uBloom0;
uniform sampler2D uBloom1;
uniform sampler2D uBloom2;
uniform sampler2D uBloom3;
uniform vec4 uInfo;
uniform vec4 uPaper;
uniform vec4 uMode;
in vec2 vUv;
layout(location = 0) out vec4 outColor;

float hash12(vec2 value) {
  vec2 p = fract(value * vec2(0.1031, 0.1030));
  vec2 mixed = p + dot(p, p.yx + 33.33);
  return fract((mixed.x + mixed.y) * mixed.x);
}

float smootherstep01(float x) {
  float t = clamp(x, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec4 scene = texelFetch(uScene, ivec2(gl_FragCoord.xy), 0);
  float alpha = clamp(scene.a, 0.0, 1.0);
  float noise = hash12(floor(gl_FragCoord.xy) + vec2(uInfo.y, uInfo.y * 1.618)) - 0.5;
  float grain = 1.0 + noise * uInfo.x;
  vec3 rgb = vec3(0.0);
  float a = alpha;
  if (uMode.x > 0.5) {
    rgb = clamp(scene.rgb, vec3(0.0), vec3(alpha)) * grain;
  } else {
    vec3 halo = textureLod(uBloom0, vUv, 0.0).rgb * 0.4;
    halo += textureLod(uBloom1, vUv, 0.0).rgb * 0.3;
    halo += textureLod(uBloom2, vUv, 0.0).rgb * 0.2;
    halo += textureLod(uBloom3, vUv, 0.0).rgb * 0.1;
    halo = halo * uInfo.z;
    rgb = (1.0 - exp(-max(scene.rgb, vec3(0.0)) * uInfo.w)) * grain + halo / (1.0 + halo);
    a = max(alpha, max(max(rgb.r, rgb.g), rgb.b));
  }
  float vignette = uMode.y;
  if (vignette > 0.0) {
    vec2 size = vec2(textureSize(uScene, 0));
    float reach = max(vignette * 0.5 * min(size.x, size.y), 1.0);
    vec2 fromEdge = min(gl_FragCoord.xy, size - gl_FragCoord.xy);
    float mask = smootherstep01(fromEdge.x / reach) * smootherstep01(fromEdge.y / reach);
    rgb *= mask;
    a *= mask;
  }
  rgb = clamp(rgb, vec3(0.0), vec3(max(a, 0.0)));
  if (uPaper.a > 0.5) {
    outColor = vec4(uPaper.rgb * (1.0 - a) + rgb, 1.0);
    return;
  }
  outColor = vec4(rgb, a);
}
`;
