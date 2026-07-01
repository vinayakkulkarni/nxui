<script setup lang="ts">
  // ─────────────────────────────────────────────────────────────────────────
  // The mesh-gradient fragment shader below is ported from Paper Shaders
  // (https://github.com/paper-design/shaders), Copyright Lost Coast Labs, Inc.,
  // licensed under the Apache License 2.0. The GLSL is redistributed here in
  // modified form (adapted to an OGL full-screen mount); this notice is
  // preserved per Apache-2.0 §4 and the upstream README's redistribution ask.
  //
  // PROOF-OF-CONCEPT — ship-gated pending license clarification. The repo
  // LICENSE + README state Apache-2.0, but the upstream docs site still claims
  // PolyForm Shield. Until that discrepancy is confirmed, this component is
  // intentionally NOT wired into scripts/build-registry.ts, so it cannot be
  // installed via `shadcn-vue add`. Add the build-registry.ts entry only after
  // the license question is resolved. Tracking issue:
  // https://github.com/paper-design/shaders/issues/269
  // ─────────────────────────────────────────────────────────────────────────
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { Renderer, Program, Mesh, Triangle } from 'ogl';
  import type { MeshGradientProps } from './types';
  import { cn } from '~/lib/utils';

  const MAX_COLORS = 10;

  const props = withDefaults(defineProps<MeshGradientProps>(), {
    colors: () => ['#e0eaff', '#241d9a', '#f75092', '#9f50d3'],
    speed: 1,
    distortion: 0.8,
    swirl: 0.1,
    grainMixer: 0,
    grainOverlay: 0,
    scale: 1,
    class: '',
  });

  function hexToRgba(hex: string): [number, number, number, number] {
    const clean = hex.replace('#', '');
    const full =
      clean.length === 3
        ? clean
            .split('')
            .map((c) => c + c)
            .join('')
        : clean;
    const r = Number.parseInt(full.slice(0, 2), 16) / 255;
    const g = Number.parseInt(full.slice(2, 4), 16) / 255;
    const b = Number.parseInt(full.slice(4, 6), 16) / 255;
    const a =
      full.length >= 8 ? Number.parseInt(full.slice(6, 8), 16) / 255 : 1;
    return [
      Number.isFinite(r) ? r : 0,
      Number.isFinite(g) ? g : 0,
      Number.isFinite(b) ? b : 0,
      Number.isFinite(a) ? a : 1,
    ];
  }

  // Flatten up to MAX_COLORS hex strings into a padded Float32Array of vec4s.
  function buildColorArray(colors: string[]): Float32Array {
    const data = new Float32Array(MAX_COLORS * 4);
    const count = Math.min(colors.length, MAX_COLORS);
    for (let i = 0; i < count; i++) {
      const [r, g, b, a] = hexToRgba(colors[i]!);
      data[i * 4 + 0] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = a;
    }
    return data;
  }

  const VERT = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
uniform vec2 u_resolution;
uniform float u_scale;
out vec2 v_objectUV;
void main() {
  // Aspect-corrected, centered object UV (paper-design's v_objectUV contract:
  // centered at 0, the fragment shader re-centers with uv += .5).
  vec2 centered = uv - 0.5;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  if (aspect > 1.0) {
    centered.x *= aspect;
  } else {
    centered.y /= max(aspect, 1e-4);
  }
  v_objectUV = centered / max(u_scale, 1e-4);
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  // ── Fragment shader ported verbatim from paper-design/shaders ──────────────
  // Source: packages/shaders/src/shaders/mesh-gradient.ts (+ shader-utils.ts
  // helpers declarePI / rotation2 / proceduralHash21, inlined below).
  const FRAG = `#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colors[${MAX_COLORS}];
uniform float u_colorsCount;

uniform float u_distortion;
uniform float u_swirl;
uniform float u_grainMixer;
uniform float u_grainOverlay;

in vec2 v_objectUV;
out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float hash21(vec2 p) {
  p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

float noise(vec2 n, vec2 seedOffset) {
  return valueNoise(n + seedOffset);
}

vec2 getPosition(int i, float t) {
  float a = float(i) * .37;
  float b = .6 + fract(float(i) / 3.) * .9;
  float c = .8 + fract(float(i + 1) / 4.);

  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);

  return .5 + .5 * vec2(x, y);
}

void main() {
  vec2 uv = v_objectUV;
  uv += .5;
  vec2 grainUV = uv * 1000.;

  float grain = noise(grainUV, vec2(0.));
  float mixerGrain = .4 * u_grainMixer * (grain - .5);

  const float firstFrameOffset = 41.5;
  float t = .5 * (u_time + firstFrameOffset);

  float radius = smoothstep(0., 1., length(uv - .5));
  float center = 1. - radius;
  for (float i = 1.; i <= 2.; i++) {
    uv.x += u_distortion * center / i * sin(t + i * .4 * smoothstep(.0, 1., uv.y)) * cos(.2 * t + i * 2.4 * smoothstep(.0, 1., uv.y));
    uv.y += u_distortion * center / i * cos(t + i * 2. * smoothstep(.0, 1., uv.x));
  }

  vec2 uvRotated = uv;
  uvRotated -= vec2(.5);
  float angle = 3. * u_swirl * radius;
  uvRotated = rotate(uvRotated, -angle);
  uvRotated += vec2(.5);

  vec3 color = vec3(0.);
  float opacity = 0.;
  float totalWeight = 0.;

  for (int i = 0; i < ${MAX_COLORS}; i++) {
    if (i >= int(u_colorsCount)) break;

    vec2 pos = getPosition(i, t) + mixerGrain;
    vec3 colorFraction = u_colors[i].rgb * u_colors[i].a;
    float opacityFraction = u_colors[i].a;

    float dist = length(uvRotated - pos);

    dist = pow(dist, 3.5);
    float weight = 1. / (dist + 1e-3);
    color += colorFraction * weight;
    opacity += opacityFraction * weight;
    totalWeight += weight;
  }

  color /= max(1e-4, totalWeight);
  opacity /= max(1e-4, totalWeight);

  float grainOverlay = valueNoise(rotate(grainUV, 1.) + vec2(3.));
  grainOverlay = mix(grainOverlay, valueNoise(rotate(grainUV, 2.) + vec2(-1.)), .5);
  grainOverlay = pow(grainOverlay, 1.3);

  float grainOverlayV = grainOverlay * 2. - 1.;
  vec3 grainOverlayColor = vec3(step(0., grainOverlayV));
  float grainOverlayStrength = u_grainOverlay * abs(grainOverlayV);
  grainOverlayStrength = pow(grainOverlayStrength, .8);
  color = mix(color, grainOverlayColor, .35 * grainOverlayStrength);

  opacity += .5 * grainOverlayStrength;
  opacity = clamp(opacity, 0., 1.);

  fragColor = vec4(color, opacity);
}`;

  const containerRef = ref<HTMLDivElement | null>(null);
  let animationId = 0;
  let renderer: InstanceType<typeof Renderer> | null = null;
  let glContext: WebGL2RenderingContext | null = null;
  let program: InstanceType<typeof Program> | null = null;
  let mesh: InstanceType<typeof Mesh> | null = null;
  let t0 = 0;

  useResizeObserver(containerRef, (entries) => {
    if (!renderer || !program || !containerRef.value) return;
    const rect = entries[0]!.contentRect;
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height);
    const gl = renderer.gl;
    const res = program.uniforms.u_resolution.value as Float32Array;
    res[0] = gl.drawingBufferWidth;
    res[1] = gl.drawingBufferHeight;
  });

  watch(
    () => props.colors,
    (colors) => {
      if (!program) return;
      program.uniforms.u_colors.value = buildColorArray(colors);
      program.uniforms.u_colorsCount.value = Math.min(
        colors.length,
        MAX_COLORS,
      );
    },
    { deep: true },
  );

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl as WebGL2RenderingContext;
    glContext = gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const geometry = new Triangle(gl);

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new Float32Array([1, 1]) },
        u_scale: { value: props.scale },
        u_colors: { value: buildColorArray(props.colors) },
        u_colorsCount: {
          value: Math.min(props.colors.length, MAX_COLORS),
        },
        u_distortion: { value: props.distortion },
        u_swirl: { value: props.swirl },
        u_grainMixer: { value: props.grainMixer },
        u_grainOverlay: { value: props.grainOverlay },
      },
    });

    mesh = new Mesh(gl, { geometry, program });

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height);
    const res = program.uniforms.u_resolution.value as Float32Array;
    res[0] = gl.drawingBufferWidth;
    res[1] = gl.drawingBufferHeight;

    t0 = performance.now();

    function loop(now: number) {
      if (!renderer || !program || !mesh) return;

      program.uniforms.u_time.value = (now - t0) * 0.001 * props.speed;
      program.uniforms.u_scale.value = props.scale;
      program.uniforms.u_distortion.value = props.distortion;
      program.uniforms.u_swirl.value = props.swirl;
      program.uniforms.u_grainMixer.value = props.grainMixer;
      program.uniforms.u_grainOverlay.value = props.grainOverlay;

      renderer.render({ scene: mesh });
      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    if (glContext) {
      const canvas = glContext.canvas as HTMLCanvasElement;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      glContext.getExtension('WEBGL_lose_context')?.loseContext();
    }
    renderer = null;
    program = null;
    mesh = null;
    glContext = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', $props.class)"
  ></div>
</template>
