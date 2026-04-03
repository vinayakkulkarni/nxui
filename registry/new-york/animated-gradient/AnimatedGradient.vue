<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import type { AnimatedGradientProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  type PatternShape = 'Checks' | 'Stripes' | 'Edge';

  const PatternShapes: Record<PatternShape, number> = {
    Checks: 0,
    Stripes: 1,
    Edge: 2,
  };

  interface PresetParams {
    color1: string;
    color2: string;
    color3: string;
    rotation: number;
    proportion: number;
    scale: number;
    speed: number;
    distortion: number;
    swirl: number;
    swirlIterations: number;
    softness: number;
    offset: number;
    shape: PatternShape;
    shapeSize: number;
  }

  type PresetName = 'Aurora' | 'Oceanic' | 'Amber' | 'Toxic' | 'Ghost';

  const presets: Record<PresetName, PresetParams> = {
    Aurora: {
      color1: '#0a001a',
      color2: '#1a0b2e',
      color3: '#f20089',
      rotation: -45,
      proportion: 60,
      scale: 0.6,
      speed: 15,
      distortion: 40,
      swirl: 80,
      swirlIterations: 10,
      softness: 100,
      offset: 200,
      shape: 'Edge',
      shapeSize: 50,
    },
    Oceanic: {
      color1: '#000814',
      color2: '#001d3d',
      color3: '#00b4d8',
      rotation: 0,
      proportion: 70,
      scale: 0.4,
      speed: 10,
      distortion: 15,
      swirl: 50,
      swirlIterations: 12,
      softness: 80,
      offset: 150,
      shape: 'Checks',
      shapeSize: 30,
    },
    Amber: {
      color1: '#140c00',
      color2: '#4a2500',
      color3: '#f57c00',
      rotation: 120,
      proportion: 80,
      scale: 0.8,
      speed: 20,
      distortion: 25,
      swirl: 60,
      swirlIterations: 8,
      softness: 90,
      offset: 500,
      shape: 'Stripes',
      shapeSize: 40,
    },
    Toxic: {
      color1: '#050d05',
      color2: '#0a240a',
      color3: '#39ff14',
      rotation: -90,
      proportion: 55,
      scale: 0.5,
      speed: 25,
      distortion: 60,
      swirl: 100,
      swirlIterations: 15,
      softness: 70,
      offset: -100,
      shape: 'Edge',
      shapeSize: 20,
    },
    Ghost: {
      color1: '#0a0a0a',
      color2: '#1c1c1c',
      color3: '#a3a3a3',
      rotation: 45,
      proportion: 50,
      scale: 0.3,
      speed: 8,
      distortion: 10,
      swirl: 30,
      swirlIterations: 5,
      softness: 100,
      offset: 0,
      shape: 'Checks',
      shapeSize: 60,
    },
  };

  const props = withDefaults(defineProps<AnimatedGradientProps>(), {
    config: () => ({ preset: 'Aurora' as const }),
    radius: '0px',
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let vShader: WebGLShader | null = null;
  let fShader: WebGLShader | null = null;
  let buffer: WebGLBuffer | null = null;
  let rafId = 0;
  let startTime = 0;

  type Uniforms = Record<string, WebGLUniformLocation>;
  const uniforms: Uniforms = {};

  const params = computed((): PresetParams => {
    const config = props.config;
    if (config.preset === 'custom') {
      return {
        color1: config.color1,
        color2: config.color2,
        color3: config.color3,
        rotation: config.rotation ?? 0,
        proportion: config.proportion ?? 35,
        scale: config.scale ?? 1,
        speed: config.speed ?? 25,
        distortion: config.distortion ?? 12,
        swirl: config.swirl ?? 80,
        swirlIterations: config.swirlIterations ?? 10,
        softness: config.softness ?? 100,
        offset: config.offset ?? 0,
        shape: config.shape ?? 'Checks',
        shapeSize: config.shapeSize ?? 10,
      };
    }
    const preset = presets[config.preset] || presets.Aurora;
    return {
      ...preset,
      speed: config.speed ?? preset.speed,
    };
  });

  const VERTEX_SHADER = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}`;

  const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
    vec3 color1 = c1.rgb * c1.a;
    vec3 color2 = c2.rgb * c2.a;
    vec3 color3 = c3.rgb * c3.a;

    float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
    float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);

    vec3 blended_color_2 = mix(color1, color2, r1);
    float blended_opacity_2 = mix(c1.a, c2.a, r1);

    vec3 c = mix(blended_color_2, color3, r2);
    float o = mix(blended_opacity_2, c3.a, r2);
    return vec4(c, o);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    float t = .5 * u_time;

    float noise_scale = .0005 + .006 * u_scale;

    uv -= .5;
    uv *= (noise_scale * u_resolution);
    uv = rotate(uv, u_rotation * .5 * PI);
    uv /= u_pixelRatio;
    uv += .5;

    float n1 = noise(uv * 1. + t);
    float n2 = noise(uv * 2. - t);
    float angle = n1 * TWO_PI;
    uv.x += 4. * u_distortion * n2 * cos(angle);
    uv.y += 4. * u_distortion * n2 * sin(angle);

    float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
    for (float i = 1.; i <= iterations_number; i++) {
        uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
        uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
    }

    float proportion = clamp(u_proportion, 0., 1.);

    float shape = 0.;
    float mixer = 0.;
    if (u_shape < .5) {
      vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
      shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
      mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
    } else if (u_shape < 1.5) {
      vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
      float f = fract(stripes_shape_uv.y);
      shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
      mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
    } else {
      float sh = 1. - uv.y;
      sh -= .5;
      sh /= (noise_scale * u_resolution.y);
      sh += .5;
      float shape_scaling = .2 * (1. - u_shapeScale);
      shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
      mixer = shape;
    }

    vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);

    fragColor = vec4(color_mix.rgb, color_mix.a);
}`;

  function hexToRgba(hex: string): [number, number, number, number] {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 1;

    if (hex.startsWith('rgba(')) {
      const parts = hex.slice(5, -1).split(',');
      r = Number.parseInt(parts[0] ?? '0') / 255;
      g = Number.parseInt(parts[1] ?? '0') / 255;
      b = Number.parseInt(parts[2] ?? '0') / 255;
      a = Number.parseFloat(parts[3] ?? '1');
    } else if (hex.startsWith('rgb(')) {
      const parts = hex.slice(4, -1).split(',');
      r = Number.parseInt(parts[0] ?? '0') / 255;
      g = Number.parseInt(parts[1] ?? '0') / 255;
      b = Number.parseInt(parts[2] ?? '0') / 255;
    } else if (hex.startsWith('hsla(') || hex.startsWith('hsl(')) {
      const isHsla = hex.startsWith('hsla(');
      const parts = hex.slice(isHsla ? 5 : 4, -1).split(',');
      const h = Number.parseFloat(parts[0] ?? '0') / 360;
      const s = Number.parseFloat(parts[1] ?? '0') / 100;
      const l = Number.parseFloat(parts[2] ?? '0') / 100;
      a = isHsla ? Number.parseFloat(parts[3] ?? '1') : 1;
      [r, g, b] = hslToRgb(h, s, l);
    } else if (hex.startsWith('#')) {
      const c = hex.slice(1);
      if (c.length === 3) {
        r = Number.parseInt(c.charAt(0) + c.charAt(0), 16) / 255;
        g = Number.parseInt(c.charAt(1) + c.charAt(1), 16) / 255;
        b = Number.parseInt(c.charAt(2) + c.charAt(2), 16) / 255;
      } else if (c.length >= 6) {
        r = Number.parseInt(c.slice(0, 2), 16) / 255;
        g = Number.parseInt(c.slice(2, 4), 16) / 255;
        b = Number.parseInt(c.slice(4, 6), 16) / 255;
        if (c.length === 8) {
          a = Number.parseInt(c.slice(6, 8), 16) / 255;
        }
      }
    }

    return [r, g, b, a];
  }

  function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r: number;
    let g: number;
    let b: number;

    if (s === 0) {
      r = l;
      g = l;
      b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        let tt = t;
        if (tt < 0) tt += 1;
        if (tt > 1) tt -= 1;
        if (tt < 1 / 6) return p + (q - p) * 6 * tt;
        if (tt < 1 / 2) return q;
        if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r, g, b];
  }

  function compileShader(
    ctx: WebGL2RenderingContext,
    type: number,
    src: string,
  ): WebGLShader | null {
    const s = ctx.createShader(type);
    if (!s) return null;
    ctx.shaderSource(s, src);
    ctx.compileShader(s);
    if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) {
      ctx.deleteShader(s);
      return null;
    }
    return s;
  }

  function resize() {
    if (!gl || !containerRef.value || !canvasRef.value) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = containerRef.value.getBoundingClientRect();
    canvasRef.value.width = Math.max(1, Math.floor(width * dpr));
    canvasRef.value.height = Math.max(1, Math.floor(height * dpr));
    canvasRef.value.style.width = `${width}px`;
    canvasRef.value.style.height = `${height}px`;
    gl.viewport(0, 0, canvasRef.value.width, canvasRef.value.height);
  }

  useResizeObserver(containerRef, resize);

  function render(now: number) {
    if (!gl || !canvasRef.value) return;
    const elapsed = (now - startTime) / 1000;
    const speed = (params.value.speed / 100) * 5;

    gl.uniform1f(uniforms.u_time, elapsed * speed + params.value.offset * 0.01);
    gl.uniform2f(
      uniforms.u_resolution,
      canvasRef.value.width,
      canvasRef.value.height,
    );
    gl.uniform1f(uniforms.u_pixelRatio, window.devicePixelRatio || 1);
    gl.uniform1f(uniforms.u_scale, params.value.scale);
    gl.uniform1f(uniforms.u_rotation, (params.value.rotation * Math.PI) / 180);

    const c1 = hexToRgba(params.value.color1);
    const c2 = hexToRgba(params.value.color2);
    const c3 = hexToRgba(params.value.color3);
    gl.uniform4f(uniforms.u_color1, c1[0], c1[1], c1[2], c1[3]);
    gl.uniform4f(uniforms.u_color2, c2[0], c2[1], c2[2], c2[3]);
    gl.uniform4f(uniforms.u_color3, c3[0], c3[1], c3[2], c3[3]);

    gl.uniform1f(uniforms.u_proportion, params.value.proportion / 100);
    gl.uniform1f(uniforms.u_softness, params.value.softness / 100);
    gl.uniform1f(uniforms.u_shape, PatternShapes[params.value.shape]);
    gl.uniform1f(uniforms.u_shapeScale, params.value.shapeSize / 100);
    gl.uniform1f(uniforms.u_distortion, params.value.distortion / 50);
    gl.uniform1f(uniforms.u_swirl, params.value.swirl / 100);
    gl.uniform1f(
      uniforms.u_swirlIterations,
      params.value.swirl === 0 ? 0 : params.value.swirlIterations,
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    rafId = requestAnimationFrame(render);
  }

  onMounted(() => {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;

    gl = canvas.getContext('webgl2', {
      premultipliedAlpha: true,
      alpha: true,
      antialias: true,
    });
    if (!gl) return;

    vShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    fShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vShader || !fShader) return;

    program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const names = [
      'u_time',
      'u_resolution',
      'u_pixelRatio',
      'u_scale',
      'u_rotation',
      'u_color1',
      'u_color2',
      'u_color3',
      'u_proportion',
      'u_softness',
      'u_shape',
      'u_shapeScale',
      'u_distortion',
      'u_swirl',
      'u_swirlIterations',
    ];
    for (const n of names) {
      const loc = gl.getUniformLocation(program, n);
      if (!loc) return;
      uniforms[n] = loc;
    }

    resize();
    startTime = performance.now();
    rafId = requestAnimationFrame(render);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (gl) {
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vShader) gl.deleteShader(vShader);
      if (fShader) gl.deleteShader(fShader);
    }
  });

  const NOISE_IMAGE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABnRSTlMCCgkGBAVJOAVJAAAASklEQVQ4y2NgGAWjYBSMglEwCgY/YGRgZBQUYmJiZGQEkYwMjIyMgoKCjIyMIJKBgRFIMjIyAklGRkYGRkFBYEcwMDIyMjAOUQAA1I4HwVwZAkYAAAAASUVORK5CYII=';

  const noiseStyle = computed(() => {
    if (!props.noise || props.noise.opacity <= 0) return null;
    return {
      position: 'absolute' as const,
      inset: '0',
      backgroundImage: `url("${NOISE_IMAGE}")`,
      backgroundSize: `${(props.noise.scale ?? 1) * 200}px`,
      backgroundRepeat: 'repeat',
      opacity: props.noise.opacity / 2,
      pointerEvents: 'none' as const,
    };
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('absolute inset-0 overflow-hidden', props.class)"
    :style="{ borderRadius: radius }"
  >
    <canvas ref="canvasRef" aria-hidden="true" class="block size-full"></canvas>
    <div v-if="noiseStyle" :style="noiseStyle"></div>
    <div v-if="$slots.default" class="relative z-10 size-full">
      <slot></slot>
    </div>
  </div>
</template>
