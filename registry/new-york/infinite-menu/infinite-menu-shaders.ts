export const INFINITE_MENU_VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 aTile;
uniform vec4 uOrientation;
uniform mat4 uProjection;
uniform float uCamera;
uniform float uRadius;
uniform float uTileRadius;
uniform vec4 uSpin;
uniform float uStretch;
uniform float uShift;
out vec2 vUv;
out float vFront;
out float vItem;

vec3 rotate(vec4 q, vec3 v) {
  vec3 t = 2.0 * cross(q.xyz, v);
  return v + q.w * t + cross(q.xyz, t);
}

void main() {
  vec3 center = normalize(rotate(uOrientation, aTile.xyz));
  vec3 reference = abs(center.y) > 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
  vec3 tangent = normalize(cross(reference, center));
  vec3 bitangent = cross(center, tangent);
  float front = max(center.z, 0.0);
  vec3 offset = (tangent * aCorner.x + bitangent * aCorner.y) * uTileRadius * mix(0.5, 1.0, front);
  vec3 motion = cross(uSpin.xyz, center);
  float sweep = length(motion);
  if (sweep > 0.0001) {
    vec3 direction = motion / sweep;
    float amount = min(0.9, uSpin.w * uStretch * 0.12) * sweep;
    offset += direction * dot(offset, direction) * amount;
  }
  vec3 world = normalize(center * uRadius + offset) * uRadius * (1.0 + 0.003 * center.z);
  gl_Position = uProjection * vec4(world.xy, world.z - uCamera, 1.0);
  gl_Position.y += uShift * gl_Position.w;
  vUv = aCorner;
  vFront = center.z;
  vItem = aTile.w;
}`;

export const INFINITE_MENU_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
uniform float uCells;
uniform float uInset;
uniform float uRoundness;
uniform float uGrayscale;
uniform float uDim;
uniform float uReveal;
uniform vec3 uPlaceholder;
uniform vec3 uTone;
in vec2 vUv;
in float vFront;
in float vItem;
out vec4 outColor;

void main() {
  float corner = clamp(uRoundness, 0.0, 1.0);
  vec2 q = abs(vUv) - (1.0 - corner);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - corner;
  float aa = max(fwidth(d), 0.0001);
  float mask = 1.0 - smoothstep(-aa, aa, d);
  float alpha = mask * smoothstep(0.02, 0.4, vFront) * uReveal;
  if (alpha < 0.002) discard;
  vec2 cell = vec2(mod(vItem, uCells), floor(vItem / uCells));
  vec2 local = vec2(vUv.x, -vUv.y) * 0.5 + 0.5;
  vec4 sampled = texture(uAtlas, (cell + uInset + local * (1.0 - 2.0 * uInset)) / uCells);
  vec3 color = mix(uPlaceholder, sampled.rgb, sampled.a);
  float focus = smoothstep(0.93, 0.997, vFront);
  float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(color, vec3(gray), uGrayscale * (1.0 - focus));
  color = mix(color, uTone, uDim * (1.0 - focus));
  outColor = vec4(color * alpha, alpha);
}`;

export const INFINITE_MENU_UNIFORMS = [
  'uOrientation',
  'uProjection',
  'uCamera',
  'uRadius',
  'uTileRadius',
  'uSpin',
  'uStretch',
  'uShift',
  'uAtlas',
  'uCells',
  'uInset',
  'uRoundness',
  'uGrayscale',
  'uDim',
  'uReveal',
  'uPlaceholder',
  'uTone',
] as const;
