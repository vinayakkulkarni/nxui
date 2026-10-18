/* GLSL ported verbatim from React Bits Radar. */

export const QUAD_VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const CAMERA = `
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uViewHeight;
uniform float uFocal;
uniform float uDistance;
uniform float uTilt;
`;

export const SCENE = `#version 300 es
precision highp float;
${CAMERA}
uniform float uMode;
uniform float uSweep;
uniform float uSwept;
uniform float uDirection;
uniform float uCycle;
uniform float uTrail;
uniform float uRings;
uniform float uSpokes;
uniform float uTicks;
uniform float uGrid;
uniform float uLine;
uniform float uClutter;
uniform float uTime;
uniform vec3 uAccent;
uniform vec3 uHeat;
uniform float uIntro;
uniform float uRange;
uniform float uPixel;
out vec4 outColor;

const float TAU = 6.28318531;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float stroke(float distance, float width) {
  float w = max(width, 1.0) * 0.5;
  return clamp(w + 0.5 - distance, 0.0, 1.0) * min(width, 1.0);
}

void main() {
  vec2 s = (gl_FragCoord.xy - uCenter) / uViewHeight;
  float ct = cos(uTilt);
  float st = sin(uTilt);
  vec3 forward = vec3(0.0, st, -ct);
  vec3 up = vec3(0.0, ct, st);
  vec3 dir = forward * uFocal + vec3(s.x, 0.0, 0.0) + up * s.y;
  vec3 eye = vec3(0.0, -uDistance * st, uDistance * ct);
  float hit = -eye.z / min(dir.z, -0.00001);
  vec2 p = eye.xy + dir.xy * hit;
  float r = length(p);
  vec2 dpdx = dFdx(p);
  vec2 dpdy = dFdy(p);
  if (dir.z > -0.0001 || r > 1.3) {
    outColor = vec4(0.0);
    return;
  }
  vec2 radial = p / max(r, 0.00001);
  vec2 tangent = vec2(radial.y, -radial.x);
  float pxR = max(length(vec2(dot(radial, dpdx), dot(radial, dpdy))), 0.000001);
  float pxT = max(length(vec2(dot(tangent, dpdx), dot(tangent, dpdy))), 0.000001);
  float bearing = atan(p.x, p.y);
  float turn = fract(bearing / TAU + 1.0);
  float inside = 1.0 - smoothstep(1.0 - pxR, 1.0 + pxR, r);

  float ringCoord = r * uRings;
  float ringIndex = clamp(floor(ringCoord + 0.5), 1.0, max(uRings - 1.0, 1.0));
  float rings = stroke(abs(ringCoord - ringIndex) / uRings / pxR, uLine) * step(ringIndex, uRings - 0.5);
  float arc = clamp(uIntro * (uRings + 3.0) - ringIndex, 0.0, 1.0) * 1.02;
  rings *= 1.0 - smoothstep(arc - 0.01, arc, turn);
  float outerArc = clamp(uIntro * (uRings + 3.0) - uRings, 0.0, 1.0) * 1.02;
  float outer = stroke(abs(r - 1.0) / pxR, uLine * 1.15) * (1.0 - smoothstep(outerArc - 0.01, outerArc, turn));

  float tickCoord = turn * 180.0;
  float tickIndex = floor(tickCoord + 0.5);
  float major = 1.0 - step(0.5, mod(tickIndex, 15.0));
  float middle = 1.0 - step(0.5, mod(tickIndex, 5.0));
  float tickLength = mix(mix(0.016, 0.03, middle), 0.05, major);
  float tickRadial = clamp((r - 1.0) / pxR + 0.5, 0.0, 1.0) * clamp((1.0 + tickLength - r) / pxR + 0.5, 0.0, 1.0);
  float spacing = TAU / 180.0 * r / pxT;
  float ticks = stroke(abs(tickCoord - tickIndex) / 180.0 * TAU * r / pxT, uLine) * tickRadial;
  ticks *= mix(mix(0.42 * smoothstep(2.5, 5.0, spacing), 0.7, middle), 1.0, major) * uTicks;
  ticks *= smoothstep(0.55, 0.9, uIntro);

  float spokeTotal = max(uSpokes, 1.0);
  float spokeCoord = turn * spokeTotal;
  float spokeIndex = floor(spokeCoord + 0.5);
  float spokes = stroke(abs(spokeCoord - spokeIndex) / spokeTotal * TAU * r / pxT, uLine) * smoothstep(0.05, 0.16, r);
  spokes *= inside * step(0.5, uSpokes);
  float cardinalCoord = turn * 4.0;
  float cardinal = stroke(abs(cardinalCoord - floor(cardinalCoord + 0.5)) / 4.0 * TAU * r / pxT, uLine) * smoothstep(0.02, 0.08, r) * inside;
  float hub = stroke(abs(r - 0.022) / pxR, uLine);
  float spokesIn = smoothstep(0.35, 0.8, uIntro);
  float axisDistance = abs(cardinalCoord - floor(cardinalCoord + 0.5)) / 4.0 * TAU * r / pxT;
  float rangeCoord = r * uRings * 5.0;
  float rangeMark = stroke(abs(rangeCoord - floor(rangeCoord + 0.5)) / (uRings * 5.0) / pxR, uLine);
  rangeMark *= 1.0 - smoothstep(3.0 * uPixel - 0.5, 3.0 * uPixel + 0.5, axisDistance);
  rangeMark *= smoothstep(0.06, 0.12, r) * inside;
  float bezel = stroke(abs(r - 1.065) / pxR, uLine) * uTicks * smoothstep(0.6, 0.95, uIntro);

  float grid = rings * 0.12 + outer * 0.24 + ticks * 0.22 + bezel * 0.08;
  grid += (spokes * 0.05 + cardinal * 0.08 + hub * 0.22 + rangeMark * 0.16) * spokesIn;
  grid *= uGrid;

  float behind;
  float edge;
  float trail;
  float lastPass;
  if (uMode < 0.5) {
    float ahead = fract((bearing - uSweep) / TAU + 0.5) - 0.5;
    behind = fract(uDirection * (uSweep - bearing) / TAU) * TAU;
    edge = stroke(abs(ahead) * TAU * r / pxT, uLine * 1.4) * smoothstep(0.0, 0.04, r) * inside;
    trail = exp(-behind / uTrail) * (1.0 - smoothstep(uSwept - 0.15, uSwept, behind));
    lastPass = floor(uCycle - behind / TAU);
  } else {
    behind = uSweep - r;
    edge = stroke(abs(behind) / pxR, uLine * 1.4) * inside;
    trail = behind >= 0.0 ? exp(-behind / uTrail) : 0.0;
    lastPass = behind >= 0.0 ? uCycle : uCycle - 1.0;
  }
  float sweepIn = smoothstep(0.45, 1.0, uIntro);
  trail *= inside * sweepIn;
  edge *= sweepIn;
  float glowTrail = pow(trail, 0.45);

  float returns = 0.0;
  if (uClutter > 0.0 && trail > 0.004) {
    float radialBin = floor(r * 120.0);
    float count = max(8.0, floor(radialBin * 5.0));
    float angularBin = floor(turn * count);
    vec2 drift = vec2(lastPass * 0.173, lastPass * 0.291);
    float weather = noise(p * 3.2 + drift) * 0.65 + noise(p * 7.1 - drift) * 0.35;
    float cluster = smoothstep(0.5, 0.78, weather);
    float density = uClutter * (0.02 + 0.35 * cluster) * (1.0 - smoothstep(0.55, 1.0, r));
    vec2 binSeed = vec2(radialBin, angularBin) + lastPass * 17.13;
    float speck = step(1.0 - density, hash(binSeed));
    vec2 inBin = vec2(fract(r * 120.0), fract(turn * count)) - 0.5;
    float shape = 1.0 - smoothstep(0.18, 0.5, length(inBin));
    speck *= shape * (0.45 + 0.55 * hash(binSeed + 7.7));
    returns = (speck * 1.1 + cluster * 0.16 * uClutter) * trail;
  }

  float heat = uHeat.z * exp(-dot(p - uHeat.xy, p - uHeat.xy) / 0.035);
  float lit = clamp(glowTrail * 0.9 + heat * 0.55, 0.0, 1.0);
  vec3 lineColor = mix(vec3(1.0), uAccent, lit);
  vec3 light = lineColor * grid * (1.0 + glowTrail * 3.0 + heat * 2.4);
  float fill = trail * 0.11 * (0.35 + 0.65 * smoothstep(0.0, 0.6, r));
  light += uAccent * (fill + returns * 0.55);
  light += mix(uAccent, vec3(1.0), 0.3) * edge * 1.3;
  outColor = vec4(light * uRange, 1.0);
}`;

export const SPRITE_VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 aSprite;
in vec4 aStyle;
${CAMERA}
out vec2 vLocal;
out vec4 vStyle;
out float vKind;
void main() {
  float ct = cos(uTilt);
  float st = sin(uTilt);
  float c = cos(aStyle.w);
  float s = sin(aStyle.w);
  vec2 local = aCorner * 1.25;
  vec2 offset = vec2(c * local.x - s * local.y, s * local.x + c * local.y) * aSprite.z;
  vec3 world = vec3(aSprite.xy + offset, 0.0);
  vec3 eye = vec3(0.0, -uDistance * st, uDistance * ct);
  vec3 rel = world - eye;
  float xc = rel.x;
  float yc = dot(rel, vec3(0.0, ct, st));
  float zc = max(dot(rel, vec3(0.0, st, -ct)), 0.0001);
  vec2 center = uCenter / uResolution * 2.0 - 1.0;
  gl_Position = vec4(center * zc + 2.0 * uFocal * uViewHeight * vec2(xc, yc) / uResolution, 0.0, zc);
  vLocal = local;
  vStyle = aStyle;
  vKind = aSprite.w;
}`;

export const SPRITE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec4 vStyle;
in float vKind;
uniform vec3 uAccent;
uniform float uRange;
out vec4 outColor;
void main() {
  float shape;
  vec3 tint;
  if (vKind < 0.5) {
    float d = length(vLocal * vec2(0.62, 1.0));
    float aa = max(fwidth(d), 0.0001);
    shape = clamp((1.0 - d) / aa + 0.5, 0.0, 1.0);
    shape *= 0.5 + 0.5 * exp(-d * d * 2.5);
    tint = mix(uAccent, vec3(1.0), vStyle.y * 0.45 * exp(-d * d * 5.0));
  } else {
    float d = length(vLocal);
    float aa = max(fwidth(d), 0.0001);
    shape = clamp(1.0 - abs(d - 1.0) / (aa * 0.75), 0.0, 1.0);
    tint = mix(uAccent, vec3(1.0), 0.2);
  }
  outColor = vec4(tint * shape * vStyle.x * uRange, 1.0);
}`;

export const DOWN = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec4 sum = texture(uSource, uv) * 4.0;
  sum += texture(uSource, uv - uTexel);
  sum += texture(uSource, uv + uTexel);
  sum += texture(uSource, uv + vec2(uTexel.x, -uTexel.y));
  sum += texture(uSource, uv - vec2(uTexel.x, -uTexel.y));
  outColor = sum / 8.0;
}`;

export const UP = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec2 h = uTexel * 0.5;
  vec4 sum = texture(uSource, uv + vec2(-h.x * 2.0, 0.0));
  sum += texture(uSource, uv + vec2(h.x * 2.0, 0.0));
  sum += texture(uSource, uv + vec2(0.0, -h.y * 2.0));
  sum += texture(uSource, uv + vec2(0.0, h.y * 2.0));
  sum += texture(uSource, uv + vec2(-h.x, h.y)) * 2.0;
  sum += texture(uSource, uv + h) * 2.0;
  sum += texture(uSource, uv + vec2(h.x, -h.y)) * 2.0;
  sum += texture(uSource, uv - h) * 2.0;
  outColor = sum / 12.0 + texture(uBase, uv);
}`;

export const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2 uResolution;
uniform float uExposure;
uniform float uGlow;
uniform float uGrain;
uniform float uFade;
uniform float uOpacity;
uniform float uTime;
uniform float uLightMode;
uniform vec4 uBackground;
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
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 hdr = texelFetch(uScene, ivec2(gl_FragCoord.xy), 0).rgb * uExposure;
  vec3 bloom = texture(uBloom, uv).rgb * uExposure * uGlow * 0.5;
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  mask *= uOpacity;
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  vec4 color;
  if (uLightMode > 0.5) {
    float bloomPeak = max(bloom.r, max(bloom.g, bloom.b));
    float bloomLow = min(bloom.r, min(bloom.g, bloom.b));
    vec3 total = hdr + bloom * 0.3 * (bloomPeak - bloomLow) / max(bloomPeak, 0.0001);
    float peak = max(total.r, max(total.g, total.b));
    vec3 hue = total / max(peak, 0.0001);
    float tone = dot(hue, vec3(0.2126, 0.7152, 0.0722));
    float depth = mix(0.36, 0.09, smoothstep(0.06, 0.7, peak));
    vec3 ink = pow(clamp(hue * min(1.0, depth / max(tone, 0.001)), 0.0, 1.0), vec3(1.0 / 2.2));
    float alpha = clamp((1.0 - exp(-peak * 2.6)) * (1.0 + grain), 0.0, 1.0) * mask;
    color = vec4(ink * alpha, alpha);
  } else {
    vec3 mapped = 1.0 - exp(-(hdr + bloom));
    float level = max(mapped.r, max(mapped.g, mapped.b));
    mapped = clamp(mapped + grain * level, 0.0, 1.0) * mask;
    color = vec4(mapped, max(mapped.r, max(mapped.g, mapped.b)));
  }
  vec4 back = vec4(uBackground.rgb * uBackground.a, uBackground.a);
  outColor = color + back * (1.0 - color.a);
}`;
