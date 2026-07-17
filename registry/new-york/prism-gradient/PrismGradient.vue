<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
  import { useColorMode } from '#imports';
  import { cn } from '~/lib/utils';
  import type { PrismGradientProps } from './types';

  const PRISM = {
    dark: ['#050505', '#66B3FF', '#FFFFFF'],
    light: ['#FAFAFA', '#66B3FF', '#050505'],
    rotation: -50,
    proportion: 1,
    scale: 0.01,
    speed: 30,
    distortion: 0,
    swirl: 50,
    swirlIterations: 16,
    softness: 47,
    offset: -299,
    shapeSize: 45,
  } as const;

  const NOISE_TEXTURE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABnRSTlMCCgkGBAVJOAVJAAAASklEQVQ4y2NgGAWjYBSMglEwCgY/YGRgZBQUYmJiZGQEkYwMjIyMgoKCjIyMIJKBgRFIMjIyAklGRkYGRkFBYEcwMDIyMjAOUQAA1I4HwVwZAkYAAAAASUVORK5CYII=';

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
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec4 blendColors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edgeBlur) {
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;
  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edgeBlur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edgeBlur, mixer);
  vec3 blendedColor2 = mix(color1, color2, r1);
  float blendedOpacity2 = mix(c1.a, c2.a, r1);
  vec3 color = mix(blendedColor2, color3, r2);
  float opacity = mix(blendedOpacity2, c3.a, r2);
  return vec4(color, opacity);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float time = .5 * u_time;
  float noiseScale = .0005 + .006 * u_scale;

  uv -= .5;
  uv *= noiseScale * u_resolution;
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;

  float n1 = noise(uv + time);
  float n2 = noise(uv * 2. - time);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iterations = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= iterations; i++) {
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(time + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(time + i * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);
  vec2 checksUv = uv * (.5 + 3.5 * u_shapeScale);
  float shape = .5 + .5 * sin(checksUv.x) * cos(checksUv.y);
  float mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  vec4 colorMix = blendColors(
    u_color1,
    u_color2,
    u_color3,
    mixer,
    1. - clamp(u_softness, 0., 1.),
    .01 + .01 * u_scale
  );
  fragColor = colorMix;
}
`;

  const props = withDefaults(defineProps<PrismGradientProps>(), {
    speed: 1,
    noise: undefined,
    radius: '0px',
    class: '',
  });

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const containerRef = ref<HTMLDivElement | null>(null);
  const webglFailed = ref(false);
  const mounted = ref(false);
  const colorMode = useColorMode();

  const colors = computed(() =>
    mounted.value && colorMode.value === 'light' ? PRISM.light : PRISM.dark,
  );

  function hexToRgba(hex: string): [number, number, number, number] {
    const value = hex.replace('#', '');
    const expanded =
      value.length === 3
        ? value
            .split('')
            .map((character) => character + character)
            .join('')
        : value;
    return [
      Number.parseInt(expanded.slice(0, 2), 16) / 255,
      Number.parseInt(expanded.slice(2, 4), 16) / 255,
      Number.parseInt(expanded.slice(4, 6), 16) / 255,
      expanded.length === 8
        ? Number.parseInt(expanded.slice(6, 8), 16) / 255
        : 1,
    ];
  }

  let cleanup: (() => void) | null = null;

  function setup(): void {
    cleanup?.();
    cleanup = null;

    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container || webglFailed.value) return;

    const gl = canvas.getContext('webgl2', {
      premultipliedAlpha: true,
      alpha: true,
      antialias: true,
    });
    if (!gl) {
      webglFailed.value = true;
      return;
    }

    const compileShader = (
      type: number,
      source: string,
    ): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      webglFailed.value = true;
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      webglFailed.value = true;
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      webglFailed.value = true;
      return;
    }
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      time: uniform('u_time'),
      resolution: uniform('u_resolution'),
      pixelRatio: uniform('u_pixelRatio'),
      scale: uniform('u_scale'),
      rotation: uniform('u_rotation'),
      color1: uniform('u_color1'),
      color2: uniform('u_color2'),
      color3: uniform('u_color3'),
      proportion: uniform('u_proportion'),
      softness: uniform('u_softness'),
      shapeScale: uniform('u_shapeScale'),
      distortion: uniform('u_distortion'),
      swirl: uniform('u_swirl'),
      swirlIterations: uniform('u_swirlIterations'),
    };

    const resize = (): void => {
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(
        1,
        Math.round(container.clientWidth * pixelRatio),
      );
      canvas.height = Math.max(
        1,
        Math.round(container.clientHeight * pixelRatio),
      );
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const startedAt = performance.now();
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let frameId: number | undefined;

    const draw = (time: number): void => {
      const elapsed = (time - startedAt) / 1000;
      const prismSpeed = (PRISM.speed / 100) * 5 * Math.max(0, props.speed);
      const color1 = hexToRgba(colors.value[0]!);
      const color2 = hexToRgba(colors.value[1]!);
      const color3 = hexToRgba(colors.value[2]!);

      gl.uniform1f(uniforms.time, elapsed * prismSpeed + PRISM.offset * 0.01);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.pixelRatio, window.devicePixelRatio || 1);
      gl.uniform1f(uniforms.scale, PRISM.scale);
      gl.uniform1f(uniforms.rotation, (PRISM.rotation * Math.PI) / 180);
      gl.uniform4fv(uniforms.color1, color1);
      gl.uniform4fv(uniforms.color2, color2);
      gl.uniform4fv(uniforms.color3, color3);
      gl.uniform1f(uniforms.proportion, PRISM.proportion / 100);
      gl.uniform1f(uniforms.softness, PRISM.softness / 100);
      gl.uniform1f(uniforms.shapeScale, PRISM.shapeSize / 100);
      gl.uniform1f(uniforms.distortion, PRISM.distortion / 50);
      gl.uniform1f(uniforms.swirl, PRISM.swirl / 100);
      gl.uniform1f(uniforms.swirlIterations, PRISM.swirlIterations);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reduceMotion && props.speed > 0) {
        frameId = requestAnimationFrame(draw);
      }
    };

    frameId = requestAnimationFrame(draw);

    cleanup = () => {
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }

  onMounted(() => {
    mounted.value = true;
    setup();
  });

  watch([colors, () => props.speed], () => {
    setup();
  });

  onBeforeUnmount(() => {
    cleanup?.();
    cleanup = null;
  });

  const noiseStyle = computed(() => {
    if (!props.noise || props.noise.opacity <= 0) return null;
    return {
      backgroundImage: `url("${NOISE_TEXTURE}")`,
      backgroundSize: `${(props.noise.scale ?? 1) * 200}px`,
      opacity: props.noise.opacity / 2,
    };
  });
</script>

<template>
  <div
    ref="containerRef"
    aria-hidden="true"
    :class="cn('absolute inset-0 z-0 overflow-hidden', props.class)"
    :style="{ borderRadius: radius }"
  >
    <div
      v-if="webglFailed"
      class="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,#66b3ff_0%,#050505_48%,#fff_100%)] dark:bg-[radial-gradient(circle_at_55%_45%,#66b3ff_0%,#050505_55%,#fff_100%)]"
    />
    <canvas v-else ref="canvasRef" class="block size-full" />
    <div
      v-if="noiseStyle"
      class="pointer-events-none absolute inset-0 bg-repeat"
      :style="noiseStyle"
    />
  </div>
</template>
