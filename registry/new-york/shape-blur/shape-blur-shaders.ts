// GLSL ES 3.00 shaders for ShapeBlur: shape SDF -> blur pyramid -> lens composite.

export const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const SHAPE_SHADER = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uDpr;
uniform int uShape;
uniform float uSides;
uniform vec2 uHalf;
uniform float uRadius;
uniform float uRound;
uniform sampler2D uFieldTexture;
uniform vec2 uField;
uniform float uThickness;
uniform float uFill;
uniform float uEchoes;
uniform float uSpacing;
uniform float uAngle;
out vec4 outColor;

const float PI = 3.14159265;

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sdPolygon(vec2 p, float r, float n) {
  float an = PI / n;
  vec2 acs = vec2(cos(an), sin(an));
  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p.y += clamp(-p.y, 0.0, r * acs.y);
  return length(p) * sign(p.x);
}

float sdStar(vec2 p, float r, float n, float m) {
  float an = PI / n;
  float en = PI / m;
  vec2 acs = vec2(cos(an), sin(an));
  vec2 ecs = vec2(cos(en), sin(en));
  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
  return length(p) * sign(p.x);
}

float shapeDistance(vec2 p) {
  if (uShape < 0) return 1e5;
  float c = cos(uAngle);
  float s = sin(uAngle);
  p = mat2(c, -s, s, c) * p;
  if (uShape == 0) return sdRoundBox(p, uHalf, uRound);
  if (uShape == 1) return length(p) - uRadius;
  if (uShape == 2) return sdPolygon(p, uRadius - uRound, uSides) - uRound;
  if (uShape == 3) return sdStar(p, uRadius - uRound, uSides, mix(2.0, uSides, 0.42)) - uRound;
  vec2 uv = p / (2.0 * uField.x) + 0.5;
  vec2 inside = clamp(uv, 0.0, 1.0);
  float d = texture(uFieldTexture, vec2(inside.x, 1.0 - inside.y)).r * uField.y;
  return d + length((uv - inside) * 2.0 * uField.x);
}

void main() {
  vec2 p = gl_FragCoord.xy / uDpr - 0.5 * uResolution;
  float d = shapeDistance(p);
  float aa = 1.0 / uDpr;
  float hw = 0.5 * uThickness;
  float cover = uFill > 0.5 ? clamp(0.5 - d / aa, 0.0, 1.0) : 0.0;
  for (int i = 0; i < 24; i++) {
    if (float(i) >= uEchoes) break;
    if (uFill > 0.5 && i == 0) continue;
    float x = uFill > 0.5 ? d - float(i) * uSpacing : d + float(i) * uSpacing;
    cover = max(cover, clamp((hw - abs(x)) / aa + 0.5, 0.0, 1.0));
  }
  outColor = vec4(cover, 0.0, 0.0, 1.0);
}`;

export const BLUR_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform float uLod;
uniform vec2 uStep;
uniform vec2 uScale;
out vec4 outColor;

void main() {
  vec2 size = vec2(textureSize(uSource, int(uLod)));
  vec2 center = gl_FragCoord.xy * uScale;
  float sum = textureLod(uSource, center / size, uLod).r * 6.0;
  sum += textureLod(uSource, (center - uStep) / size, uLod).r * 4.0;
  sum += textureLod(uSource, (center + uStep) / size, uLod).r * 4.0;
  sum += textureLod(uSource, (center - 2.0 * uStep) / size, uLod).r;
  sum += textureLod(uSource, (center + 2.0 * uStep) / size, uLod).r;
  outColor = vec4(sum / 16.0, 0.0, 0.0, 1.0);
}`;

export const COMPOSITE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uPyramid;
uniform float uMaxLod;
uniform vec2 uResolution;
uniform float uDpr;
uniform float uThickness;
uniform float uFill;
uniform float uEchoes;
uniform float uSpacing;
uniform vec3 uColor;
uniform float uBackdrop;
uniform float uBlur;
uniform vec3 uLens;
uniform vec2 uLensShape;
uniform float uFocus;
uniform float uChroma;
out vec4 outColor;

float bspline(vec2 uv, float lod) {
  vec2 size = vec2(textureSize(uPyramid, int(lod)));
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
  vec2 p0 = (i - 0.5 + w1 / g0) / size;
  vec2 p1 = (i + 1.5 + w3 / g1) / size;
  float a = textureLod(uPyramid, p0, lod).r;
  float b = textureLod(uPyramid, vec2(p1.x, p0.y), lod).r;
  float c = textureLod(uPyramid, vec2(p0.x, p1.y), lod).r;
  float d = textureLod(uPyramid, p1, lod).r;
  return g0.y * (g0.x * a + g1.x * b) + g1.y * (g0.x * c + g1.x * d);
}

float blurred(vec2 uv, float sigma) {
  if (sigma <= 0.6) return textureLod(uPyramid, uv, 0.0).r;
  float lod = sigma < 1.7 ? (sigma - 0.6) / 1.1 : log2(sigma / 0.866);
  lod = clamp(lod, 0.0, uMaxLod);
  float base = floor(lod);
  float t = lod - base;
  float a = base < 0.5 ? textureLod(uPyramid, uv, 0.0).r : bspline(uv, base);
  if (t < 0.001) return a;
  return mix(a, bspline(uv, min(base + 1.0, uMaxLod)), t);
}

void main() {
  vec2 texel = 1.0 / vec2(textureSize(uPyramid, 0));
  vec2 uv = gl_FragCoord.xy * texel;
  vec2 p = gl_FragCoord.xy / uDpr - 0.5 * uResolution;
  vec2 toLens = p - uLens.xy;
  float lensDistance = length(toLens);
  float lens = uLens.z * (1.0 - smoothstep(uLensShape.x * (1.0 - uLensShape.y), uLensShape.x, lensDistance));
  float amount = mix(lens, 1.0 - lens, uFocus);
  float sigma = uBlur * amount * uDpr;
  vec2 dir = lensDistance > 0.001 ? toLens / lensDistance : vec2(0.0);
  vec2 split = dir * uChroma * 0.3 * sigma * texel;
  vec3 cover = vec3(
    blurred(uv - split, sigma * (1.0 + uChroma * 0.25)),
    blurred(uv, sigma),
    blurred(uv + split, sigma * (1.0 - uChroma * 0.2))
  );
  if (uFill < 0.5) {
    float spread = sigma / uDpr;
    float reach = uEchoes > 1.5 ? min(spread, uSpacing) : spread;
    cover *= 1.0 + 0.6 * max(reach - 0.5, 0.0) / max(uThickness, 0.5);
  }
  cover = mix(cover, 0.85 + 0.15 * (1.0 - exp((0.85 - cover) / 0.15)), step(0.85, cover));
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  cover = clamp(cover + grain / 255.0, 0.0, 1.0);
  float alpha = max(max(cover.r, cover.g), cover.b);
  outColor = vec4(uColor * cover + (alpha - cover) * uBackdrop, alpha);
}`;
