import type { ChaosState } from './types';

export const CHAOS_KEYS: ReadonlyArray<keyof ChaosState> = [
  'speed',
  'amplitude',
  'pulseMin',
  'pulseMax',
  'chaos',
];

export const RESTING: ChaosState = {
  speed: 0.35,
  amplitude: 80,
  pulseMin: 0.05,
  pulseMax: 0.2,
  chaos: 1,
};

export const ACTIVE: ChaosState = {
  speed: 0.8,
  amplitude: 10,
  pulseMin: 0.05,
  pulseMax: 0.2,
  chaos: 2.6,
};

export const VERTEX = /* glsl */ `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_tap;
  uniform float u_speed;
  uniform float u_amplitude;
  uniform float u_pulseMin;
  uniform float u_pulseMax;
  uniform float u_noiseType;

  float hash(float n) {
    return fract(sin(n) * 753.5453123);
  }

  float noiseHash(vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 157.0;
    return mix(
      mix(hash(n + 0.0), hash(n + 1.0), f.x),
      mix(hash(n + 157.0), hash(n + 158.0), f.x),
      f.y
    );
  }

  float noiseTrig(vec2 p) {
    float x = p.x;
    float y = p.y;
    float n = sin(x * 1.0 + sin(y * 1.3)) * 0.5;
    n += sin(y * 1.0 + sin(x * 1.1)) * 0.5;
    n += sin((x + y) * 0.5) * 0.25;
    n += sin((x - y) * 0.7) * 0.25;
    return n * 0.5 + 0.5;
  }

  float noise(vec2 p) {
    if (u_noiseType < 0.5) {
      return noiseHash(p);
    }
    return noiseTrig(p);
  }

  float fbm(vec2 p, vec3 a) {
    float v = 0.0;
    v += noise(p * a.x) * 0.50;
    v += noise(p * a.y) * 1.50;
    v += noise(p * a.z) * 0.125 * 0.1;
    return v;
  }

  vec3 drawLines(vec2 uv, vec3 fbmOffset, vec3 color1, float secs) {
    float timeVal = secs * 0.1;
    vec3 finalColor = vec3(0.0);

    vec3 colorSets[4];
    colorSets[0] = vec3(0.7, 0.05, 1.0);
    colorSets[1] = vec3(1.0, 0.19, 0.0);
    colorSets[2] = vec3(0.0, 1.0, 0.3);
    colorSets[3] = vec3(0.0, 0.38, 1.0);

    for (int i = 0; i < 4; i++) {
      float indexAsFloat = float(i);
      float amp = u_amplitude + (indexAsFloat * 0.0);
      float period = 2.0 + (indexAsFloat + 2.0);
      float thickness = mix(0.4, 0.2, noise(uv * 2.0));
      float t = abs(1.0 / (sin(uv.y + fbm(uv + timeVal * period, fbmOffset)) * amp) * thickness);
      finalColor += t * colorSets[i];
    }

    for (int i = 0; i < 4; i++) {
      float indexAsFloat = float(i);
      float amp = (u_amplitude * 0.5) + (indexAsFloat * 5.0);
      float period = 9.0 + (indexAsFloat + 2.0);
      float thickness = mix(0.1, 0.1, noise(uv * 12.0));
      float t = abs(1.0 / (sin(uv.y + fbm(uv + timeVal * period, fbmOffset)) * amp) * thickness);
      finalColor += t * colorSets[i] * color1;
    }

    return finalColor;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.x) * 1.0 - 1.0;
    uv *= 1.5;

    vec3 lineColor1 = vec3(1.0, 0.0, 0.5);
    vec3 lineColor2 = vec3(0.3, 0.5, 1.5);

    float spread = abs(u_tap);
    vec3 finalColor = vec3(0.0);

    float t = sin(u_time) * 0.5 + 0.5;
    float pulse = mix(u_pulseMin, u_pulseMax, t);

    finalColor = drawLines(uv, vec3(65.2, 40.0, 4.0), lineColor1, u_time * u_speed) * pulse;
    finalColor += drawLines(uv, vec3(5.0 * spread / 2.0, 2.1 * spread, 1.0), lineColor2, u_time * u_speed);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
