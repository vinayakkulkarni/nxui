<script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import { cn } from '~/lib/utils';
  import type { SilkAuroraProps } from './types';

  const VERTEX_SHADER = `
attribute vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_res;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_speed;
uniform float u_intensity;
uniform float u_grain;
uniform float u_vignette;
uniform float u_mouseInfluence;
uniform vec3 u_base;
uniform vec3 u_mid;
uniform vec3 u_sheen;
uniform vec3 u_accent;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.93, 289.17))) * 43758.5453123);
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

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.82, 0.57, -0.57, 0.82);

  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p = rot * p * 2.03;
    amp *= 0.5;
  }

  return value;
}

float ribbon(vec2 p, float offset, float width, float softness) {
  float y = p.y + sin(p.x * 1.8 + offset) * 0.18;
  y += sin(p.x * 4.2 - offset * 0.7) * 0.045;
  return smoothstep(width + softness, width, abs(y));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / max(u_res.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  vec2 mouse = (u_mouse - 0.5) * vec2(aspect, 1.0);
  float t = u_time * 0.12 * u_speed;
  float pointerFalloff = smoothstep(0.72, 0.0, length(p - mouse));
  p += (mouse - p) * pointerFalloff * 0.05 * u_mouseInfluence;

  vec2 silk = p;
  silk.x += fbm(p * 1.6 + vec2(t * 0.8, -t * 0.35)) * 0.16;
  silk.y += fbm(p * 2.2 + vec2(-t * 0.25, t * 0.7)) * 0.10;

  float veilA = ribbon(silk + vec2(-0.18, 0.08), t * 2.1, 0.055, 0.22);
  float veilB = ribbon(silk * vec2(0.86, 1.18) + vec2(0.2, -0.14), -t * 2.8 + 1.7, 0.038, 0.18);
  float veilC = ribbon(silk * vec2(1.18, 0.9) + vec2(-0.08, 0.24), t * 1.4 - 2.1, 0.03, 0.16);

  float atmosphere = fbm(p * 1.35 + vec2(t * 0.22, -t * 0.1));
  float pearlescent = pow(max(0.0, sin((p.x - p.y) * 7.5 + atmosphere * 4.0 - t * 2.5)), 5.0);
  float glint = pow(max(0.0, noise(gl_FragCoord.xy * 0.065 + t * 18.0) - 0.72), 5.0);

  vec3 col = u_base;
  col = mix(col, u_mid, smoothstep(-0.45, 0.75, p.y + atmosphere * 0.75));
  col += u_accent * veilA * 0.72 * u_intensity;
  col += u_sheen * veilB * 0.64 * u_intensity;
  col += mix(u_sheen, u_accent, 0.35) * veilC * 0.42 * u_intensity;
  col += u_sheen * pearlescent * 0.075 * u_intensity;
  col += vec3(1.0, 0.93, 0.82) * glint * 0.22 * u_intensity;
  col += u_sheen * pointerFalloff * 0.08 * u_mouseInfluence;

  float vignette = smoothstep(1.25, 0.22, length(p));
  col *= mix(1.0 - u_vignette * 0.42, 1.06, vignette);

  float grain = (hash(gl_FragCoord.xy + t * 90.0) - 0.5) * 0.08 * u_grain;
  col += grain;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

  const HEX_COLOR_REGEX = /^#?[0-9a-f]{6}$/i;

  const DEFAULT_BASE = '#050507';
  const DEFAULT_MID = '#14151d';
  const DEFAULT_SHEEN = '#f4dfb8';
  const DEFAULT_ACCENT = '#6ed6c9';

  function sanitizeHexColor(value: string, fallback: string): string {
    const trimmed = value.trim();
    if (!HEX_COLOR_REGEX.test(trimmed)) return fallback;
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  }

  function hexToRgb01(hex: string, fallback: string): [number, number, number] {
    const normalized = sanitizeHexColor(hex, fallback).replace('#', '');
    return [
      Number.parseInt(normalized.slice(0, 2), 16) / 255,
      Number.parseInt(normalized.slice(2, 4), 16) / 255,
      Number.parseInt(normalized.slice(4, 6), 16) / 255,
    ];
  }

  const props = withDefaults(defineProps<SilkAuroraProps>(), {
    title: undefined,
    subtitle: undefined,
    description: undefined,
    baseColor: '#050507',
    midColor: '#14151d',
    sheenColor: '#f4dfb8',
    accentColor: '#6ed6c9',
    speed: 1,
    intensity: 1,
    grain: 0.85,
    vignette: 1,
    mouseInfluence: 1,
    interactive: true,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const hasWebGLError = ref(false);
  const mouse = { x: 0.5, y: 0.5 };
  const targetMouse = { x: 0.5, y: 0.5 };

  let cleanup: (() => void) | null = null;

  function setup(): void {
    cleanup?.();
    cleanup = null;

    if (hasWebGLError.value) return;
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const handlePointerMove = (event: PointerEvent): void => {
      if (!props.interactive) return;
      const rect = container.getBoundingClientRect();
      targetMouse.x = (event.clientX - rect.left) / rect.width;
      targetMouse.y = 1 - (event.clientY - rect.top) / rect.height;
    };

    const handlePointerLeave = (): void => {
      targetMouse.x = 0.5;
      targetMouse.y = 0.5;
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    const removeListeners = (): void => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };

    try {
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
      if (!gl) {
        hasWebGLError.value = true;
        cleanup = removeListeners;
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
        hasWebGLError.value = true;
        cleanup = removeListeners;
        return;
      }

      const program = gl.createProgram();
      if (!program) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        hasWebGLError.value = true;
        cleanup = removeListeners;
        return;
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        hasWebGLError.value = true;
        cleanup = removeListeners;
        return;
      }

      gl.useProgram(program);

      const position = gl.getAttribLocation(program, 'position');
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const uRes = gl.getUniformLocation(program, 'u_res');
      const uMouse = gl.getUniformLocation(program, 'u_mouse');
      const uTime = gl.getUniformLocation(program, 'u_time');
      const uSpeed = gl.getUniformLocation(program, 'u_speed');
      const uIntensity = gl.getUniformLocation(program, 'u_intensity');
      const uGrain = gl.getUniformLocation(program, 'u_grain');
      const uVignette = gl.getUniformLocation(program, 'u_vignette');
      const uMouseInfluence = gl.getUniformLocation(
        program,
        'u_mouseInfluence',
      );
      const uBase = gl.getUniformLocation(program, 'u_base');
      const uMid = gl.getUniformLocation(program, 'u_mid');
      const uSheen = gl.getUniformLocation(program, 'u_sheen');
      const uAccent = gl.getUniformLocation(program, 'u_accent');

      if (
        !uRes ||
        !uMouse ||
        !uTime ||
        !uSpeed ||
        !uIntensity ||
        !uGrain ||
        !uVignette ||
        !uMouseInfluence ||
        !uBase ||
        !uMid ||
        !uSheen ||
        !uAccent
      ) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        hasWebGLError.value = true;
        cleanup = removeListeners;
        return;
      }

      const resize = (): void => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const { width, height } = container.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(height * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
      };

      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      const base = hexToRgb01(props.baseColor, DEFAULT_BASE);
      const mid = hexToRgb01(props.midColor, DEFAULT_MID);
      const sheen = hexToRgb01(props.sheenColor, DEFAULT_SHEEN);
      const accent = hexToRgb01(props.accentColor, DEFAULT_ACCENT);

      gl.uniform3f(uBase, base[0], base[1], base[2]);
      gl.uniform3f(uMid, mid[0], mid[1], mid[2]);
      gl.uniform3f(uSheen, sheen[0], sheen[1], sheen[2]);
      gl.uniform3f(uAccent, accent[0], accent[1], accent[2]);

      let rafId = 0;
      const start = performance.now();

      const render = (now: number): void => {
        mouse.x += (targetMouse.x - mouse.x) * 0.045;
        mouse.y += (targetMouse.y - mouse.y) * 0.045;

        const elapsed = reducedMotion ? 8 : (now - start) / 1000;

        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform1f(uTime, elapsed);
        gl.uniform1f(uSpeed, reducedMotion ? 0 : props.speed);
        gl.uniform1f(uIntensity, props.intensity);
        gl.uniform1f(uGrain, props.grain);
        gl.uniform1f(uVignette, props.vignette);
        gl.uniform1f(
          uMouseInfluence,
          props.interactive && !reducedMotion ? props.mouseInfluence : 0,
        );
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        rafId = requestAnimationFrame(render);
      };

      rafId = requestAnimationFrame(render);

      cleanup = () => {
        removeListeners();
        cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      };
    } catch {
      hasWebGLError.value = true;
      cleanup = removeListeners;
    }
  }

  onMounted(setup);

  watch(
    [
      () => props.baseColor,
      () => props.midColor,
      () => props.sheenColor,
      () => props.accentColor,
      () => props.speed,
      () => props.intensity,
      () => props.grain,
      () => props.vignette,
      () => props.mouseInfluence,
      () => props.interactive,
    ],
    () => setup(),
  );

  onBeforeUnmount(() => {
    cleanup?.();
    cleanup = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative flex min-h-screen w-full items-center overflow-hidden bg-[#050507] text-white',
        props.class,
      )
    "
    style="container-type: size"
  >
    <canvas
      v-if="!hasWebGLError"
      ref="canvasRef"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 block size-full"
    />
    <div
      v-else
      class="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,#1a1c26_0%,#050507_65%)]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_34%,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_18%_74%,rgba(110,214,201,0.13),transparent_30%)]"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.46),rgba(0,0,0,0.14)_42%,rgba(0,0,0,0.42))]"
    />
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/55 to-transparent"
    />

    <div
      v-if="title || subtitle || description || $slots.default"
      class="relative z-10 mx-auto w-full max-w-310 px-6 py-20 md:px-10 md:py-28"
    >
      <div class="max-w-190">
        <p
          v-if="subtitle"
          class="mb-5 text-xs font-medium tracking-[0.24em] text-white/50 uppercase"
        >
          {{ subtitle }}
        </p>
        <h1
          v-if="title"
          class="max-w-205 text-[13cqi] leading-[0.86] font-semibold tracking-normal text-white md:text-[8cqi] lg:text-[6.4cqi]"
        >
          {{ title }}
        </h1>
        <p
          v-if="description"
          class="mt-7 max-w-155 text-base/relaxed text-white/68 md:text-xl"
        >
          {{ description }}
        </p>
        <div v-if="$slots.default" class="mt-10">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
