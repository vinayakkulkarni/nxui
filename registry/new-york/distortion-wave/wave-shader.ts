export const VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

/* One pass. Coordinates are CSS pixels from the top left of the element.
   d is the distance from the source box (its rounded outline grown
   outward), x = (d - reach) / band is the position across the front:
   negative behind it (the revealed view), positive ahead (the first view). */
export const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uFirst;
uniform sampler2D uNext;
uniform vec2 uSize;
uniform float uScale;
uniform vec4 uSource;
uniform vec2 uLean;
uniform float uReach;
uniform float uBand;
uniform float uPull;
uniform float uGlow;
uniform float uRim;
uniform float uSettle;
uniform float uTime;
uniform float uRefract;
uniform float uSplit;
uniform float uSparks;
uniform float uRadius;
uniform float uLight;
uniform vec3 uColors[4];
out vec4 outColor;

float box(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Distance from the source, measured on a widened ellipse so a wide button
// sends a dome and a round icon sends a ring. uSource.z widens, .w is the
// source's own radius.
float field(vec2 p) {
  vec2 q = p - uSource.xy;
  float d = max(length(q / vec2(uSource.z, 1.0)) - uSource.w, 0.0);
  float l = max(length(q), 1.0);
  return d * (1.0 - dot(q / l, uLean));
}

vec3 palette(float t) {
  t = fract(t) * 4.0;
  float i = floor(t);
  float f = smoothstep(0.0, 1.0, t - i);
  vec3 a = uColors[int(mod(i, 4.0))];
  vec3 b = uColors[int(mod(i + 1.0, 4.0))];
  return mix(a, b, f);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 sampleView(sampler2D tex, vec2 p, vec2 n, float lod, float split) {
  vec2 px = 1.0 / uSize;
  float s = exp2(lod) * 0.5;
  vec2 t = vec2(-n.y, n.x);
  vec3 c = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    float a = float(i) * 1.5708 + 0.785;
    vec2 o = (cos(a) * n + sin(a) * t) * s;
    vec2 uv = (p + o) * px;
    c.r += textureLod(tex, uv + n * split * px, lod).r;
    c.g += textureLod(tex, uv, lod).g;
    c.b += textureLod(tex, uv - n * split * px, lod).b;
  }
  return c * 0.25;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uScale - gl_FragCoord.y) / uScale;
  float edge = box(p - uSize * 0.5, uSize * 0.5, min(uRadius, min(uSize.x, uSize.y) * 0.5));
  float inside = clamp(0.5 - edge * uScale, 0.0, 1.0);
  if (inside <= 0.0) { outColor = vec4(0.0); return; }

  float d = field(p);
  vec2 e = vec2(1.0, 0.0);
  vec2 g = vec2(field(p + e.xy) - field(p - e.xy), field(p + e.yx) - field(p - e.yx));
  vec2 n = length(g) > 1e-4 ? normalize(g) : normalize(p - uSource.xy + 1e-3);
  float x = (d - uReach) / uBand;

  // Before launch the view is drawn toward the source.
  vec2 toSrc = uSource.xy - p;
  float near = exp(-length(toSrc) / (0.45 * max(uSize.x, uSize.y)));
  vec2 q = p + toSrc * uPull * 0.08 * near;

  // The lens: what lies under the front swells outward and bends.
  float lens = x * exp(-x * x * 1.6);
  q -= n * lens * uBand * 0.32 * uRefract * uGlow;
  float split = (uPull * near * 3.0 + exp(-x * x * 0.7) * 7.0 * uGlow) * uSplit;

  float ahead = max(x, 0.0);
  float behind = max(-x, 0.0);
  float lodA = (exp(-ahead * 1.4) * 3.2 * uGlow) + uPull * near * 0.8;
  float lodB = (exp(-behind * 0.9) * 3.6 + 1.6 * (1.0 - uSettle)) * (1.0 - uSettle * uSettle);

  vec3 first = sampleView(uFirst, q, n, lodA, split);
  vec3 next = sampleView(uNext, q, n, lodB, split * 0.8);
  float side = smoothstep(-0.35, 0.35, x);
  vec3 col = mix(next, first, side);

  // Haze just behind the front.
  float haze = exp(-pow((x + 0.9) / 0.9, 2.0)) * uGlow;
  col = mix(col, col * 0.5, haze * (1.0 - uLight * 0.8));

  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  float hue = atan(n.y, n.x) / 6.2832 + uTime * 0.07;

  // The colourful band, its soft halo and a fine bright line at the front.
  float band = exp(-pow((x + 0.3) / 0.65, 2.0)) * 0.8 + exp(-x * x * 0.3) * 0.1;
  float line = exp(-pow(x / 0.04, 2.0)) * 0.2;
  vec3 tint = palette(hue + x * 0.22);
  float amount = band * uGlow;

  // The rim keeps colour where the front has passed, then fades.
  float passed = smoothstep(0.2, -1.2, x);
  float rimGlow = (exp(edge / 14.0) * 0.6 + exp(edge / 3.0) * 0.45) * passed * uRim;
  vec2 c = p - uSize * 0.5;
  vec3 rimTint = palette(atan(c.y, c.x) / 6.2832 + uTime * 0.05);

  // Sparks: fine dots scattered just behind the front.
  float sparks = 0.0;
  if (uSparks > 0.5) {
    vec2 cell = floor(p / 15.0);
    float h = hash(cell);
    vec2 at = (cell + 0.2 + 0.6 * vec2(h, hash(cell + 7.1))) * 15.0;
    float on = step(0.72, hash(cell + 3.7));
    float zone = smoothstep(-2.4, -1.4, x) * smoothstep(0.25, -0.1, x);
    float tw = 0.55 + 0.45 * sin(uTime * 9.0 + h * 40.0);
    sparks = on * zone * tw * smoothstep(1.3, 0.2, length(p - at)) * uGlow;
  }

  // On a dark view the colour is light added on top; on a light view it is
  // paint laid over, so it does not wash out to white.
  vec3 add = tint * amount + rimTint * rimGlow + vec3(line * uGlow) + vec3(sparks);
  vec3 onDark = col + add * (1.0 - luma * 0.7);
  vec3 onLight = mix(col, tint * 0.92, clamp(amount * 0.85, 0.0, 1.0));
  onLight = mix(onLight, rimTint * 0.95, clamp(rimGlow * 0.8, 0.0, 1.0));
  onLight = mix(onLight, tint * 0.7, clamp(line * uGlow * 1.5 + sparks, 0.0, 1.0));
  col = min(mix(onDark, onLight, uLight), vec3(1.0));
  outColor = vec4(col * inside, inside);
}`;
