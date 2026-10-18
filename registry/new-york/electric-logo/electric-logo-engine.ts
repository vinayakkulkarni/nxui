import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
import { CELL, hexToRgb, spawnArc, traceShape } from './electric-logo-math';
import type {
  ElectricLogoFocus,
  ElectricLogoPoint,
  ElectricLogoPulse,
  ElectricLogoShape,
  ElectricLogoSlot,
  ElectricLogoSpark,
  ElectricLogoSettings,
} from './types';

const ARCS = 5;
const PULSES = 3;
const PIXEL_BUDGET = 4e6;

const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D tFieldFrom;
uniform sampler2D tGlowFrom;
uniform sampler2D tFieldTo;
uniform sampler2D tGlowTo;
uniform vec4 uMapFrom;
uniform vec4 uSizeFrom;
uniform vec4 uMapTo;
uniform vec4 uSizeTo;
uniform float uMorph;
uniform vec2 uResolution;
uniform float uUnit;
uniform float uTime;
uniform float uPresence;
uniform vec3 uHover;
uniform float uHoverRadius;
uniform vec4 uPulses[${PULSES}];
uniform float uPulseBoost;
uniform float uFlash;
uniform vec3 uColor;
uniform vec3 uGlowColor;
uniform float uIntensity;
uniform float uGlow;
uniform float uThickness;
uniform float uStrands;
uniform float uBend;
uniform float uCrackle;
uniform float uFlicker;
uniform float uFill;
uniform float uInk;
uniform vec4 uArcEnds[${ARCS}];
uniform vec4 uArcShape[${ARCS}];

in vec2 vUv;
out vec4 fragColor;

uint scramble(uint x) {
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}

float fieldAt(sampler2D tex, vec4 map, vec4 size, vec2 p) {
  vec2 f = (p - map.xy) / map.z;
  vec2 c = clamp(f, vec2(0.5), size.xy - 0.5);
  return (textureLod(tex, c / size.xy, 0.0).r + length(f - c)) * map.z;
}

vec2 glowAt(sampler2D tex, vec4 map, vec4 size, vec2 p) {
  vec2 f = (p - map.xy) / map.z - map.w;
  return textureLod(tex, f / (size.zw * ${CELL}.0), 0.0).rg;
}

float shape(vec2 p, float k) {
  float to = fieldAt(tFieldTo, uMapTo, uSizeTo, p);
  if (k >= 1.0) return to;
  return mix(fieldAt(tFieldFrom, uMapFrom, uSizeFrom, p), to, k);
}

vec2 aura(vec2 p, float k) {
  vec2 to = glowAt(tGlowTo, uMapTo, uSizeTo, p);
  if (k >= 1.0) return to;
  return mix(glowAt(tGlowFrom, uMapFrom, uSizeFrom, p), to, k);
}

vec4 corner(ivec2 c, uint seed) {
  uint h = scramble(uint(c.x) * 0x8da6b343u + uint(c.y) * 0xd8163841u + seed * 0xcb1ab31fu);
  return vec4(uvec4(h, h >> 8u, h >> 16u, h >> 24u) & 255u) / 127.5 - 1.0;
}

vec2 drift(vec2 p, uint seed, out mat2 jac) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  ivec2 c = ivec2(i);
  vec4 ga = corner(c, seed);
  vec4 gb = corner(c + ivec2(1, 0), seed);
  vec4 gc = corner(c + ivec2(0, 1), seed);
  vec4 gd = corner(c + ivec2(1, 1), seed);
  vec2 fb = f - vec2(1.0, 0.0);
  vec2 fc = f - vec2(0.0, 1.0);
  vec2 fd = f - vec2(1.0);
  vec2 va = vec2(dot(ga.xy, f), dot(ga.zw, f));
  vec2 vb = vec2(dot(gb.xy, fb), dot(gb.zw, fb));
  vec2 vc = vec2(dot(gc.xy, fc), dot(gc.zw, fc));
  vec2 vd = vec2(dot(gd.xy, fd), dot(gd.zw, fd));
  vec2 k = va - vb - vc + vd;
  vec4 g = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd);
  jac = mat2(
    g.xy + du * (u.yx * k.x + vec2(vb.x - va.x, vc.x - va.x)),
    g.zw + du * (u.yx * k.y + vec2(vb.y - va.y, vc.y - va.y))
  );
  return va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
}

float wobble(vec2 p, uint seed) {
  mat2 jac;
  return drift(p, seed, jac).x;
}

vec2 ripple(vec2 p, out float surge) {
  vec2 push = vec2(0.0);
  surge = 0.0;
  float width = uUnit * 10.0;
  for (int i = 0; i < ${PULSES}; i++) {
    vec4 pulse = uPulses[i];
    if (pulse.w <= 0.0) continue;
    vec2 d = p - pulse.xy;
    float dist = length(d);
    float front = (dist - pulse.z * uUnit * 150.0) / width;
    float env = exp(-front * front) * pulse.w * exp(-pulse.z * 1.7) * smoothstep(0.0, uUnit * 8.0, dist);
    push += d / max(dist, 1.0) * env * cos(front * 2.2) * uUnit * 7.5;
    surge += env;
  }
  return push;
}

vec2 wander(vec2 p, float t, uint seed, float reachScale, out mat2 jac, out vec2 sway) {
  vec2 q = p / uUnit;
  mat2 ja;
  mat2 jb;
  mat2 jc;
  mat2 jd;
  vec2 a = drift(q * 0.028 + vec2(t * 0.29, t * 0.21), seed, ja);
  vec2 b = drift(q * 0.085 + a * 0.4 + vec2(t * 0.83, -t * 0.61) + 17.0, seed + 1u, jb);
  vec2 c = drift(p / 9.0 + b * 0.6 + vec2(t * 1.9, t * 1.3) + 5.0, seed + 2u, jc);
  vec2 d = drift(p / 4.1 + vec2(-t * 2.7, t * 2.2) + 11.0, seed + 3u, jd);
  float bendAmp = uBend * 8.0 * reachScale;
  float rippleAmp = uBend * 3.2 * reachScale;
  float crinkleAmp = uCrackle * 1.5 * reachScale;
  jac = ja * (0.028 * bendAmp) + jb * (0.085 * rippleAmp) + jc * (crinkleAmp / 9.0) + jd * (crinkleAmp * 0.35 / 4.1);
  sway = (a * bendAmp + b * rippleAmp) * uUnit;
  return sway + (c + d * 0.35) * crinkleAmp;
}

vec2 glowShape(float line, float spread, float w) {
  float x = abs(line);
  float y = abs(spread);
  return vec2(exp(-x * x / (w * w * 0.5)) + exp(-y / (w * 2.2)) * 0.6, exp(-y / (w * 4.5)) * 0.5);
}

void addArc(vec2 p, vec4 ends, vec4 info, float t, inout vec3 light, inout float energy, inout float hot) {
  if (info.y < 0.002) return;
  vec2 ab = ends.zw - ends.xy;
  float len = max(length(ab), 1.0);
  vec2 dir = ab / len;
  vec2 rel = p - ends.xy;
  float s = dot(rel, dir);
  float h = dot(rel, vec2(-dir.y, dir.x));
  float margin = abs(info.x) + uCrackle * (2.0 + len * 0.08) + uThickness * 12.0 + 10.0;
  if (s < -margin || s > len + margin || abs(h) > margin) return;
  float u = clamp(s / len, 0.0, 1.0);
  float taper = sin(3.14159265 * u);
  float bendSlope = s > 0.0 && s < len ? 3.14159265 / len * cos(3.14159265 * u) : 0.0;
  float beyond = max(-s, 0.0) + max(s - len, 0.0);
  for (int c = 0; c < 2; c++) {
    uint seed = uint(info.z * 131.0) + uint(c) * 29u + 7u;
    float jag = 0.0;
    float jagSlope = 0.0;
    float wave = max(len * 0.3, 14.0);
    float weight = uCrackle * (1.5 + len * 0.05) * (c == 0 ? 1.0 : 1.5);
    for (int o = 0; o < 3; o++) {
      mat2 jac;
      float n = drift(vec2(s / wave + info.z * 3.0, t * (1.4 + float(o) * 1.1)), seed + uint(o), jac).x;
      jag += n * weight;
      jagSlope += jac[0].x * weight / wave;
      wave *= 0.42;
      weight *= 0.4;
    }
    float offset = (info.x + jag) * taper;
    float offsetSlope = (info.x + jag) * bendSlope + jagSlope * taper;
    float across = (h - offset) / sqrt(1.0 + offsetSlope * offsetSlope);
    float gap = length(vec2(beyond, across));
    float w = uThickness * (c == 0 ? 0.9 : 0.6);
    vec2 g = glowShape(gap, gap, w);
    float k = info.y * (c == 0 ? 1.0 : 0.45);
    light += (uColor * g.x + uGlowColor * g.y * uGlow) * k;
    energy += (g.x + g.y * uGlow) * k;
    hot += exp(-gap * gap / (w * w * 0.16)) * k * (c == 0 ? 1.0 : 0.0);
  }
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  float t = uTime;
  vec3 light = vec3(0.0);
  float energy = 0.0;
  float hot = 0.0;

  float surge;
  vec2 pr = p - ripple(p, surge);
  float k = uMorph >= 1.0 ? 1.0 : smoothstep(0.0, 1.0, clamp(uMorph * 1.7 - 0.35 + 0.35 * wobble(p / uUnit * 0.018, 41u), 0.0, 1.0));
  float transit = uMorph >= 1.0 ? 0.0 : sin(3.14159265 * uMorph);
  float base = shape(pr, k);

  vec2 toHover = p - uHover.xy;
  float heat = min(uHover.z * exp(-dot(toHover, toHover) / (uHoverRadius * uHoverRadius)) + surge * 1.4 + transit * 0.5, 2.0);
  float heatCap = min(uHover.z + uPulseBoost * 1.4 + transit * 0.5, 2.0);
  float breath = 1.0 + uFlicker * 0.6 * wobble(vec2(t * 2.1, 7.0), 3u);
  float grow = uPresence;

  float edge = abs(base);
  vec2 halo = aura(pr, k);
  float ink = uInk;
  float bloom = (halo.x * 0.16 + halo.y * 0.08) * (1.0 - ink * 0.65) * uGlow * (1.0 + heat * 1.2);
  float body = smoothstep(0.75, -0.75, base) * uFill * (0.06 + 1.2 * min(halo.x, 1.0)) * (1.0 + heat * 0.5);
  light += uGlowColor * bloom * grow * grow;
  energy += bloom * grow * grow;

  float reachScale = mix(0.15, 1.0, grow) * (1.0 + heat * 0.9);
  float reach = (uUnit * uBend * 16.0 + uCrackle * 3.0) * (1.0 + heatCap * 0.9) + uThickness * 20.0 + 8.0;
  if (edge < reach && grow > 0.0) {
    float fade = smoothstep(reach, reach * 0.55, edge);
    vec2 q = pr / uUnit;
    float count = min(uStrands + heat * 2.5, 6.0);
    float limit = min(uStrands + heatCap * 2.5, 6.0);
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      if (fi >= limit) break;
      float present = clamp(count - fi, 0.0, 1.0);
      if (present <= 0.0) continue;
      uint seed = uint(i) * 7u + 3u;
      mat2 jac;
      vec2 sway;
      float lead = i == 0 ? 1.0 : 0.0;
      vec2 warped = pr + wander(pr, t * (1.0 + fi * 0.19), seed, reachScale * mix(0.6 + fi * 0.2, 0.7, lead), jac, sway);
      float dw = shape(warped, k);
      vec2 slope = vec2(shape(warped + vec2(1.0, 0.0), k), shape(warped + vec2(0.0, 1.0), k)) - dw;
      float d = dw / max(length(slope + jac * slope), 0.3);
      float spread = shape(pr + sway, k);
      float swell = 0.5 + 0.5 * wobble(q * 0.06 + vec2(t * 0.9, fi * 5.1 - t * 0.6), seed + 8u);
      float w = uThickness * mix(0.5, 1.0, lead) * (0.5 + swell);
      float vis = mix(0.3 + 0.45 * smoothstep(-0.25, 0.2, wobble(q * 0.035 + vec2(t * 0.21, fi * 3.7), seed + 5u)), 1.0, lead);
      float spark = 1.0 - uFlicker * 0.3 * (0.5 + 0.5 * wobble(vec2(t * 6.0, fi * 2.3), seed + 6u));
      float weight = max(vis, heat * 0.85) * spark * fade * present * (0.7 + 0.6 * swell);
      vec2 g = glowShape(d, spread, w) * weight;
      float soft = mix(1.0, mix(0.5, 1.0, lead), ink);
      vec3 stroke = mix(uColor, uGlowColor, ink * (1.0 - lead) * 0.65);
      float haze = uGlow * (1.0 + heat) * (1.0 - ink * 0.7);
      light += stroke * g.x * soft + uGlowColor * g.y * haze;
      energy += g.x * soft + g.y * haze;
      hot += exp(-d * d / (w * w * 0.16)) * lead * weight;
    }
    light *= grow;
    energy *= grow;
  }

  for (int i = 0; i < ${ARCS}; i++) addArc(pr, uArcEnds[i], uArcShape[i], t, light, energy, hot);

  float gain = uIntensity * breath * (1.0 + heat * 0.45) * (1.0 + uFlash * 0.3) * 1.4;
  float alpha = 1.0 - exp(-energy * gain);
  vec3 color = mix(1.0 - exp(-light * gain), alpha * light / max(energy, 1e-4), ink);
  color = mix(color, vec3(alpha), clamp(hot * grow, 0.0, 1.0) * ink * 0.85);
  float tint = (1.0 - exp(-body * gain * 1.2)) * grow * grow * (1.0 - ink * 0.82);
  color += uGlowColor * tint * (1.0 - alpha);
  alpha += tint * (1.0 - alpha);
  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  alpha = clamp(alpha + grain, 0.0, 1.0);
  fragColor = vec4(clamp(color + grain, 0.0, alpha), alpha);
}
`;

export function createElectricLogoEngine(
  container: HTMLElement,
  getSettings: () => ElectricLogoSettings,
  isReducedMotion: () => boolean,
): { destroy: () => void } | null {
  const renderer = new Renderer({
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  const gl = renderer.gl;
  if (!renderer.isWebgl2 || !(gl instanceof WebGL2RenderingContext)) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const makeSlot = (): ElectricLogoSlot => ({
    shape: null,
    field: new Texture(gl, {
      image: new Float32Array([1000]),
      width: 1,
      height: 1,
      internalFormat: gl.R16F,
      format: gl.RED,
      type: gl.FLOAT,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      generateMipmaps: false,
      flipY: false,
      unpackAlignment: 1,
    }),
    glow: new Texture(gl, {
      image: new Float32Array([0, 0]),
      width: 1,
      height: 1,
      internalFormat: gl.RG16F,
      format: gl.RG,
      type: gl.FLOAT,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      generateMipmaps: false,
      flipY: false,
      unpackAlignment: 1,
    }),
  });
  const slots: [ElectricLogoSlot, ElectricLogoSlot] = [makeSlot(), makeSlot()];

  const arcEnds = Array.from({ length: ARCS * 4 }, () => 0);
  const arcShape = Array.from({ length: ARCS * 4 }, () => 0);
  const pulseData = Array.from({ length: PULSES * 4 }, () => 0);
  const uniforms = {
    tFieldFrom: { value: slots[1].field },
    tGlowFrom: { value: slots[1].glow },
    tFieldTo: { value: slots[0].field },
    tGlowTo: { value: slots[0].glow },
    uMapFrom: { value: [0, 0, 1, 0] },
    uSizeFrom: { value: [1, 1, 1, 1] },
    uMapTo: { value: [0, 0, 1, 0] },
    uSizeTo: { value: [1, 1, 1, 1] },
    uMorph: { value: 1 },
    uResolution: { value: [1, 1] },
    uUnit: { value: 1 },
    uTime: { value: 0 },
    uPresence: { value: 0 },
    uHover: { value: [0, 0, 0] },
    uHoverRadius: { value: 120 },
    uPulses: { value: pulseData },
    uPulseBoost: { value: 0 },
    uFlash: { value: 0 },
    uColor: { value: [1, 1, 1] },
    uGlowColor: { value: [0.43, 0.48, 1] },
    uIntensity: { value: 1 },
    uGlow: { value: 1 },
    uThickness: { value: 1.8 },
    uStrands: { value: 3 },
    uBend: { value: 1 },
    uCrackle: { value: 1 },
    uFlicker: { value: 0.4 },
    uFill: { value: 0.5 },
    uInk: { value: 0 },
    uArcEnds: { value: arcEnds },
    uArcShape: { value: arcShape },
  };
  const geometry = new Triangle(gl);
  const mesh = new Mesh(gl, {
    geometry,
    program: new Program(gl, {
      vertex,
      fragment,
      uniforms,
      depthTest: false,
      depthWrite: false,
    }),
  });

  const pointer = { x: 0, y: 0, over: false };
  const hover = { x: 0, y: 0, vx: 0, vy: 0, power: 0 };
  const sparks: ElectricLogoSpark[] = [];
  const pulses: ElectricLogoPulse[] = [];
  let target: 0 | 1 = 0;
  let pending: ElectricLogoShape | null = null;
  let morph = 1;
  let burst: ElectricLogoPoint | null = null;
  let progress = 0;
  let ink = 0;
  const hues: [number, number, number][] = [
    [1, 1, 1],
    [1, 1, 1],
  ];
  let settled = false;
  let time = 0;
  let width = 1;
  let height = 1;
  let raf = 0;
  let last = performance.now();
  let visible = true;
  let lastSrc: string | null = null;
  let incomingShape: ElectricLogoShape | null = null;
  let image: HTMLImageElement | null = null;

  const releaseImage = (): void => {
    if (image) image.onload = null;
    image = null;
  };

  const tryTrace = (source: HTMLImageElement): ElectricLogoShape | null => {
    try {
      return traceShape(source);
    } catch {
      return null;
    }
  };

  const loadImage = (src: string): void => {
    releaseImage();
    const next = new Image();
    next.crossOrigin = 'anonymous';
    next.decoding = 'async';
    next.onload = () => {
      if (image !== next) return;
      const traced = tryTrace(next);
      if (traced) incomingShape = traced;
    };
    image = next;
    next.src = src;
  };

  const load = (slot: ElectricLogoSlot, next: ElectricLogoShape): void => {
    slot.shape = next;
    slot.field.image = next.field;
    slot.field.width = next.width;
    slot.field.height = next.height;
    slot.field.needsUpdate = true;
    slot.glow.image = next.glow;
    slot.glow.width = next.glowWidth;
    slot.glow.height = next.glowHeight;
    slot.glow.needsUpdate = true;
  };

  const place = (shape: ElectricLogoShape, s: ElectricLogoSettings) => {
    const fit = Math.max(
      1e-4,
      Math.min(
        (width * s.scale) / shape.logoWidth,
        (height * s.scale) / shape.logoHeight,
      ),
    );
    return {
      fit,
      ox: width / 2 - (shape.pad + shape.logoWidth / 2) * fit,
      oy: height / 2 - (shape.pad + shape.logoHeight / 2) * fit,
      unit: (Math.max(shape.logoWidth, shape.logoHeight) * fit) / 100,
    };
  };

  const resize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    renderer.dpr = Math.min(
      window.devicePixelRatio || 1,
      2,
      Math.sqrt(PIXEL_BUDGET / (width * height)),
    );
    renderer.setSize(width, height);
    uniforms.uResolution.value = [width, height];
  };

  const frame = (now: number): void => {
    raf = 0;
    const s = getSettings();
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    if (s.src !== lastSrc) {
      lastSrc = s.src;
      loadImage(s.src);
    }

    const reducedMotion = isReducedMotion();
    const incoming = incomingShape;
    if (incoming && incoming !== slots[target].shape) pending = incoming;
    if (pending && morph >= 1) {
      if (slots[target].shape) {
        target = target === 0 ? 1 : 0;
        morph = 0;
        sparks.length = 0;
      }
      load(slots[target], pending);
      pending = null;
    }
    if (morph < 1) morph = Math.min(1, morph + dt / (pending ? 0.3 : 1.6));

    const to = slots[target].shape;
    const from = morph < 1 ? slots[target === 0 ? 1 : 0].shape : null;
    if (to) progress = Math.min(1, progress + dt / 1.4);
    const presence = progress * progress * (3 - 2 * progress);

    if (to && s) {
      const near = place(to, s);
      const far = from ? place(from, s) : near;
      const blend = morph * morph * (3 - 2 * morph);
      const unit = far.unit + (near.unit - far.unit) * blend;

      const engaged = s.interactive && pointer.over;
      if (engaged && hover.power < 0.01) {
        hover.x = pointer.x;
        hover.y = pointer.y;
        hover.vx = 0;
        hover.vy = 0;
      }
      hover.vx += ((pointer.x - hover.x) * 120 - hover.vx * 19) * dt;
      hover.vy += ((pointer.y - hover.y) * 120 - hover.vy * 19) * dt;
      hover.x += hover.vx * dt;
      hover.y += hover.vy * dt;
      hover.power +=
        ((engaged ? 1 : 0) - hover.power) *
        (1 - Math.exp(-dt / (engaged ? 0.3 : 0.55)));

      const motion = reducedMotion ? 0.2 : 1;
      time += dt * s.speed * motion;

      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i]!;
        if (time - spark.born > spark.life) sparks.splice(i, 1);
      }
      const focus = (spot: ElectricLogoPoint): ElectricLogoFocus => ({
        x: (spot.x - near.ox) / near.fit,
        y: (spot.y - near.oy) / near.fit,
        radius: Math.max(1, s.cursorRadius) / near.fit,
      });
      if (burst && morph >= 1 && s.arcs > 0) {
        for (let i = 0; i < 3 && sparks.length < ARCS; i++) {
          const spark = spawnArc(to, time, focus(burst));
          if (spark) sparks.push(spark);
        }
      }
      burst = null;
      if (
        !reducedMotion &&
        presence > 0.8 &&
        morph >= 1 &&
        sparks.length < ARCS
      ) {
        const chance = dt * s.speed * s.arcs;
        if (Math.random() < chance * 6 * hover.power * s.cursorIntensity) {
          const spark = spawnArc(to, time, focus(hover));
          if (spark) sparks.push(spark);
        } else if (Math.random() < chance * 2.2) {
          const spark = spawnArc(to, time, null);
          if (spark) sparks.push(spark);
        }
      }

      for (let i = 0; i < ARCS; i++) {
        const o = i * 4;
        const spark = sparks[i];
        if (!spark) {
          arcShape[o + 1] = 0;
          continue;
        }
        const k = (time - spark.born) / spark.life;
        arcEnds[o] = near.ox + spark.ax * near.fit;
        arcEnds[o + 1] = near.oy + spark.ay * near.fit;
        arcEnds[o + 2] = near.ox + spark.bx * near.fit;
        arcEnds[o + 3] = near.oy + spark.by * near.fit;
        arcShape[o] = spark.bow * near.fit;
        arcShape[o + 1] =
          Math.sin(Math.PI * Math.min(1, Math.max(0, k))) * presence;
        arcShape[o + 2] = spark.seed;
      }

      let boost = 0;
      let flash = 0;
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i]!;
        if ((now - pulse.born) / 1000 > 2) pulses.splice(i, 1);
      }
      for (let i = 0; i < PULSES; i++) {
        const o = i * 4;
        const pulse = pulses[i];
        if (!pulse) {
          pulseData[o + 3] = 0;
          continue;
        }
        const age = (now - pulse.born) / 1000;
        pulseData[o] = pulse.x;
        pulseData[o + 1] = pulse.y;
        pulseData[o + 2] = age;
        pulseData[o + 3] = 1;
        boost = Math.max(boost, Math.exp(-age * 1.7));
        flash += Math.exp(-age * 7);
      }

      const fromSlot = slots[target === 0 ? 1 : 0];
      uniforms.tFieldTo.value = slots[target].field;
      uniforms.tGlowTo.value = slots[target].glow;
      uniforms.tFieldFrom.value = fromSlot.field;
      uniforms.tGlowFrom.value = fromSlot.glow;
      uniforms.uMapTo.value = [near.ox, near.oy, near.fit, to.glowOffset];
      uniforms.uSizeTo.value = [
        to.width,
        to.height,
        to.glowWidth,
        to.glowHeight,
      ];
      if (from) {
        uniforms.uMapFrom.value = [far.ox, far.oy, far.fit, from.glowOffset];
        uniforms.uSizeFrom.value = [
          from.width,
          from.height,
          from.glowWidth,
          from.glowHeight,
        ];
      }
      uniforms.uMorph.value = morph;
      uniforms.uUnit.value = unit;
      uniforms.uTime.value = time;
      uniforms.uPresence.value = presence;
      uniforms.uHover.value = [
        hover.x,
        hover.y,
        hover.power * Math.max(0, s.cursorIntensity),
      ];
      uniforms.uHoverRadius.value = Math.max(1, s.cursorRadius);
      uniforms.uPulseBoost.value = boost;
      uniforms.uFlash.value = flash;
      const targets = [hexToRgb(s.color), hexToRgb(s.glowColor)];
      const shift = settled ? 1 - Math.exp(-dt / 0.35) : 1;
      settled = true;
      for (let i = 0; i < 2; i++) {
        const hue = hues[i]!;
        const goal = targets[i]!;
        for (let c = 0; c < 3; c++) hue[c]! += (goal[c]! - hue[c]!) * shift;
      }
      uniforms.uColor.value = hues[0]!.slice();
      uniforms.uGlowColor.value = hues[1]!.slice();
      uniforms.uIntensity.value = s.intensity;
      uniforms.uGlow.value = s.glow;
      uniforms.uThickness.value = s.thickness;
      uniforms.uStrands.value = Math.max(1, Math.min(6, Math.round(s.strands)));
      uniforms.uBend.value = s.bend;
      uniforms.uCrackle.value = s.crackle;
      uniforms.uFlicker.value = reducedMotion ? 0 : s.flicker;
      ink += ((s.theme === 'light' ? 1 : 0) - ink) * (1 - Math.exp(-dt / 0.25));
      uniforms.uFill.value = s.fill;
      uniforms.uInk.value = ink;
      renderer.render({ scene: mesh });
      s.onRender?.(canvas);
    }

    if (visible) raf = requestAnimationFrame(frame);
  };

  const start = (): void => {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const onMove = (e: PointerEvent): void => {
    const rect = container.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.over = true;
  };
  const onDown = (e: PointerEvent): void => {
    onMove(e);
    if (!getSettings().interactive || isReducedMotion()) return;
    pulses.push({ x: pointer.x, y: pointer.y, born: performance.now() });
    if (pulses.length > PULSES) pulses.shift();
    burst = { x: pointer.x, y: pointer.y };
  };
  const onLeave = (): void => {
    pointer.over = false;
  };
  container.addEventListener('pointermove', onMove);
  container.addEventListener('pointerdown', onDown);
  container.addEventListener('pointerleave', onLeave);
  container.addEventListener('pointercancel', onLeave);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    if (!entry) return;
    visible = entry.isIntersecting;
    start();
  });
  intersectionObserver.observe(container);

  resize();
  start();

  return {
    destroy(): void {
      releaseImage();
      visible = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('pointercancel', onLeave);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    },
  };
}
