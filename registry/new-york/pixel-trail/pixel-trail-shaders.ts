import type { PixelTrailDecay, PixelTrailShape } from './types';

export const TRAIL_SIZE = 512;
export const AGE_SIZE = 256;

export const SHAPES: Record<PixelTrailShape, number> = {
  square: 0,
  circle: 1,
  diamond: 2,
};

export const DECAYS: Record<PixelTrailDecay, number> = {
  fade: 0,
  shrink: 1,
  dither: 2,
};

export const identityEase = (x: number): number => x;

export const VERTEX = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D u_trail;
uniform sampler2D u_image;
uniform sampler2D u_age;
uniform vec2 u_resolution;
uniform float u_gridSize;
uniform float u_sigma;
uniform vec3 u_color;
uniform vec3 u_trailColor;
uniform float u_ramp;
uniform float u_shine;
uniform float u_glow;
uniform int u_shape;
uniform int u_decay;
uniform float u_gap;
uniform float u_sparkle;
uniform float u_time;
uniform float u_hasImage;
out vec4 outColor;

const float BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
const vec3 LIGHT = vec3(-0.42, 0.58, 0.7);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float erfApprox(float x) {
  float s = sign(x);
  x = abs(x);
  float t = 1.0 / (1.0 + 0.3275911 * x);
  float y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-x * x);
  return s * y;
}

float cellValue(ivec2 c) {
  vec2 center = (vec2(c) + 0.5) / u_gridSize;
  if (center.x < 0.0 || center.y < 0.0 || center.x > 1.0 || center.y > 1.0) return 0.0;
  float t = texelFetch(u_trail, clamp(ivec2(center * 512.0), ivec2(0), ivec2(511)), 0).r;
  if (t <= 0.0) return 0.0;
  if (u_sparkle > 0.0) {
    float n = hash(vec2(c) + floor(u_time * 14.0) * 7.31);
    float dim = 1.0 - t;
    if (n < u_sparkle * dim * 0.35) t = max(t, 0.85);
    else if (n > 1.0 - u_sparkle * dim * 0.5) t = 0.0;
  }
  if (u_decay == 2 && t * 2.2 <= (BAYER[(c.y & 3) * 4 + (c.x & 3)] + 0.5) / 16.0) return 0.0;
  return t;
}

vec3 baseColor(ivec2 owner, vec2 uv) {
  if (u_hasImage > 0.5) return texelFetch(u_image, clamp(owner, ivec2(0), ivec2(textureSize(u_image, 0)) - 1), 0).rgb;
  if (u_ramp > 0.5) return mix(u_trailColor, u_color, smoothstep(0.05, 0.95, texture(u_age, uv).r));
  return u_color;
}

vec3 tone(vec3 base, float strength) {
  vec3 body = mix(base * 0.55, base, smoothstep(0.3, 0.75, strength));
  return mix(body, mix(base, vec3(1.0), 0.22), smoothstep(0.85, 1.0, strength) * u_shine);
}

float seams(vec2 q, float cs) {
  if (u_gap <= 0.0) return 0.0;
  vec2 f = fract(q / cs);
  float border = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * cs;
  float width = max(1.0, u_gap * cs * 0.5);
  return 1.0 - smoothstep(width - 0.75, width + 0.75, border);
}

vec3 shade(vec3 base, vec3 n) {
  vec3 l = normalize(LIGHT);
  vec3 h = normalize(l + vec3(0.0, 0.0, 1.0));
  float lit = dot(n, l) - l.z;
  vec3 color = base * (1.0 + lit * 0.9 * u_shine);
  float spec = pow(max(dot(n, h), 0.0), 64.0) * 0.85 + pow(max(dot(n, h), 0.0), 10.0) * 0.08;
  color += spec * u_shine * mix(vec3(1.0), base, 0.15) * step(0.001, 1.0 - n.z);
  return clamp(color, 0.0, 1.0);
}

void main() {
  float maxRes = max(u_resolution.x, u_resolution.y);
  vec2 q = gl_FragCoord.xy - 0.5 * u_resolution + 0.5 * maxRes;
  vec2 uv = q / maxRes;
  float cs = maxRes / u_gridSize;
  ivec2 base = ivec2(floor(q / cs));

  float alpha = 0.0;
  vec3 color = vec3(0.0);

  if (u_sigma > 0.0) {
    float inv = 0.70710678 / u_sigma;
    float norm = 0.39894228 / u_sigma;
    float spread = 0.5 / (u_sigma * u_sigma);
    int reach = int(clamp(ceil(3.0 * u_sigma / cs), 1.0, 3.0));
    float field = 0.0;
    vec2 grad = vec2(0.0);
    float best = -1.0;
    ivec2 owner = base;
    float wx[7];
    float gx[7];
    float wy[7];
    float gy[7];
    for (int i = 0; i < 7; i++) {
      int offset = i - 3;
      if (abs(offset) > reach) continue;
      vec2 lo = vec2(base + ivec2(offset)) * cs - q;
      vec2 hi = lo + cs;
      wx[i] = 0.5 * (erfApprox(hi.x * inv) - erfApprox(lo.x * inv));
      wy[i] = 0.5 * (erfApprox(hi.y * inv) - erfApprox(lo.y * inv));
      gx[i] = norm * (exp(-lo.x * lo.x * spread) - exp(-hi.x * hi.x * spread));
      gy[i] = norm * (exp(-lo.y * lo.y * spread) - exp(-hi.y * hi.y * spread));
    }
    for (int j = 0; j < 7; j++) {
      if (abs(j - 3) > reach) continue;
      for (int i = 0; i < 7; i++) {
        if (abs(i - 3) > reach) continue;
        ivec2 c = base + ivec2(i - 3, j - 3);
        float t = cellValue(c);
        if (t <= 0.0) continue;
        float weight = t * wx[i] * wy[j];
        field += weight;
        grad += t * vec2(gx[i] * wy[j], wx[i] * gy[j]);
        if (weight > best) {
          best = weight;
          owner = c;
        }
      }
    }
    float edge = max(0.0263, length(grad) * 0.6);
    alpha = smoothstep(0.5 - edge, 0.5 + edge, field);
    if (alpha > 0.0) {
      vec3 n = normalize(vec3(-grad * cs * 0.55, 1.0));
      float strength = max(cellValue(base), field);
      vec3 body = tone(baseColor(owner, uv), strength);
      body *= 1.0 - seams(q, cs) * 0.32;
      color = shade(body, n);
    }
  } else {
    float t = cellValue(base);
    if (t > 0.0) {
      float halfSize = 0.5 * (1.0 - u_gap);
      float fade = t;
      if (u_decay == 1) {
        halfSize *= sqrt(clamp(t * 2.5, 0.0, 1.0));
        fade = 1.0;
      } else if (u_decay == 2) {
        fade = 1.0;
      }
      vec2 local = fract(q / cs) - 0.5;
      float d;
      vec2 dir;
      if (u_shape == 1) {
        d = length(local) - halfSize;
        dir = normalize(local + 1e-5);
      } else if (u_shape == 2) {
        d = (abs(local.x) + abs(local.y) - halfSize * 1.2) * 0.7071;
        dir = sign(local) * 0.7071;
      } else {
        vec2 a = abs(local) - halfSize;
        d = max(a.x, a.y);
        dir = a.x > a.y ? vec2(sign(local.x), 0.0) : vec2(0.0, sign(local.y));
      }
      float px = 1.0 / cs;
      float coverage = clamp(0.5 - d / px, 0.0, 1.0);
      alpha = coverage * fade;
      if (alpha > 0.0) {
        float bevel = smoothstep(-0.16 * (1.0 - u_gap), 0.0, d);
        vec3 n = normalize(vec3(dir * bevel * 0.9, 1.0));
        color = shade(tone(baseColor(base, uv), t), n);
      }
    }
  }

  vec4 pixel = vec4(color * alpha, alpha);
  if (u_glow > 0.0) {
    float glow = texture(u_trail, uv).r;
    float amount = smoothstep(0.0, 0.7, glow) * u_glow * 0.55 * (1.0 - alpha);
    vec3 tint = u_hasImage > 0.5 ? texture(u_image, uv).rgb : (u_ramp > 0.5 ? mix(u_trailColor, u_color, 0.5) : u_color);
    pixel += vec4(tint * amount, amount);
  }
  if (pixel.a <= 0.002) discard;
  outColor = pixel;
}
`;
