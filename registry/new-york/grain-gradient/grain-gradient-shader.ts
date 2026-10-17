import type { GrainGradientPalette } from './types';

export const GRAIN_GRADIENT_VERTEX = `attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0., 1.); }`;

export const GRAIN_GRADIENT_FRAGMENT = `precision highp float;
uniform vec2 u_resolution;
uniform float u_ratio, u_angle, u_position, u_curve, u_softness, u_scale;
uniform float u_grain, u_grainSize, u_seed, u_time;
uniform vec3 u_light, u_mid, u_dark;
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1. - uv.y;
  vec2 p = uv - .5;
  float aspect = u_resolution.x / u_resolution.y;
  p.x *= aspect;
  float c = cos(u_angle), s = sin(u_angle);
  p = mat2(c, -s, s, c) * p;
  p.x /= aspect;
  p = p / u_scale + .5;
  // A continuous breathing cycle: the silhouette, diffusion and light move
  // together. The slower secondary wave prevents a mechanical back-and-forth.
  float breath = sin(u_time * .52);
  float undertow = sin(u_time * .31);
  float bend = u_curve + sin(u_time * .52 - .7) * .12;
  float edge = .32 + bend * pow(1. - p.y, 2.) + u_position
    + breath * .115 + undertow * .035;
  float distanceToEdge = p.x - edge
    + sin(p.y * 4. + u_time * .38) * .035;
  float diffusion = u_softness * (1. + breath * .28);
  float shadow = smoothstep(-diffusion, diffusion * .45, distanceToEdge);
  vec2 lightCenter = vec2(.04 + breath * .13, .04 + undertow * .16);
  vec2 lightUV = (p - lightCenter) * vec2(1.9, 1.7);
  float mint = exp(-dot(lightUV, lightUV));
  vec3 light = mix(u_light, u_mid, mint * (.66 + breath * .1));
  vec3 color = mix(light, u_mid * (.68 + breath * .035),
    smoothstep(-diffusion * 1.8, .02, distanceToEdge));
  color = mix(color, u_dark, shadow);
  vec2 grainUV = floor(gl_FragCoord.xy / (u_ratio * u_grainSize));
  float noise = hash(grainUV + mod(u_seed, 1000.) * 13.7) - .5;
  // Slightly stronger texture in the shadows, without a flickering noise layer.
  color += noise * u_grain * mix(.48, .32, shadow);
  gl_FragColor = vec4(clamp(color, 0., 1.), 1.);
}`;

export const GRAIN_GRADIENT_UNIFORMS = [
  'resolution',
  'ratio',
  'angle',
  'position',
  'curve',
  'softness',
  'scale',
  'grain',
  'grainSize',
  'seed',
  'time',
  'light',
  'mid',
  'dark',
] as const;

export type GrainGradientUniform = (typeof GRAIN_GRADIENT_UNIFORMS)[number];

export const GRAIN_GRADIENT_PALETTES: readonly GrainGradientPalette[] = [
  {
    name: 'Sea glass',
    colorLight: '#dce5df',
    colorMid: '#83b9ad',
    colorDark: '#031419',
  },
  {
    name: 'Dusk',
    colorLight: '#e8dce8',
    colorMid: '#a594c4',
    colorDark: '#191426',
  },
  {
    name: 'Sand',
    colorLight: '#f1e4ce',
    colorMid: '#c7a780',
    colorDark: '#26201d',
  },
];

/** Parses a three- or six-digit hex color to normalized RGB, using `fallback` when invalid. */
export function hexToRgb(
  value: string,
  fallback: string,
): [number, number, number] {
  let clean = /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value)
    ? value.slice(1)
    : fallback.slice(1);
  if (clean.length === 3)
    clean = clean
      .split('')
      .map((part) => part + part)
      .join('');
  return [
    Number.parseInt(clean.slice(0, 2), 16) / 255,
    Number.parseInt(clean.slice(2, 4), 16) / 255,
    Number.parseInt(clean.slice(4, 6), 16) / 255,
  ];
}

/** Clamps a finite number to [min, max]; non-finite values return `fallback`. */
export function bounded(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}
