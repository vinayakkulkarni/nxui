<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    defaultDocument,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    MAX_COLORS,
    buildPalette,
    clamp,
    createStrandsProgram,
    locateStrandsUniforms,
    speech,
  } from './strands-gl';
  import type { StrandsUniform } from './strands-gl';
  import type { StrandsProps } from './types';

  const props = withDefaults(defineProps<StrandsProps>(), {
    colors: () => [
      '#d95b56',
      '#ba5046',
      '#ffa24c',
      '#ffe0b3',
      '#93f1ff',
      '#3569fa',
      '#193d9b',
    ],
    count: 3,
    speed: 1,
    amplitude: 1,
    waviness: 1,
    thickness: 1,
    glow: 1,
    taper: 1,
    spread: 1,
    hueShift: 0,
    intensity: 1,
    saturation: 1,
    opacity: 1,
    scale: 1,
    glass: true,
    refraction: 1,
    dispersion: 1,
    glassSize: 1,
    rim: 1,
    energy: 0.65,
    listening: false,
    level: undefined,
    interactive: true,
    clickPulse: true,
    intro: true,
    lightMode: false,
    maxDevicePixelRatio: 2,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const st = {
    clock: 0,
    pace: 0,
    activity: 0,
    hover: 0,
    hoverTarget: 0,
    burst: 0,
    lean: [0, 0],
    leanTarget: [0, 0],
    pulse: 0,
    pulseV: 0,
    introStart: -1,
    intro: props.intro ? 0 : 1,
    visible: false,
    lost: false,
    raf: 0,
    last: 0,
    width: 0,
    height: 0,
    speechT: 0,
    paletteKey: '',
    palette: new Float32Array(MAX_COLORS * 3),
  };

  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let loc: (name: StrandsUniform) => WebGLUniformLocation | null = () => null;
  let mounted = false;

  function setup(): boolean {
    if (!gl) return false;
    const next = createStrandsProgram(gl);
    if (!next) return false;
    program = next;
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(next);
    loc = locateStrandsUniforms(gl, next);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    return true;
  }

  function resize() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      Math.max(0.5, props.maxDevicePixelRatio),
    );
    const w = Math.max(1, Math.round(container.clientWidth * dpr));
    const h = Math.max(1, Math.round(container.clientHeight * dpr));
    if (w !== st.width || h !== st.height) {
      st.width = w;
      st.height = h;
      canvas.width = w;
      canvas.height = h;
    }
  }

  function updatePalette() {
    const list = Array.isArray(props.colors) ? props.colors : [];
    const key = list.join(',');
    if (key === st.paletteKey) return;
    st.paletteKey = key;
    st.palette = buildPalette(list);
  }

  function draw() {
    if (!gl || st.lost || !program) return;
    updatePalette();
    gl.viewport(0, 0, st.width, st.height);
    gl.uniform2f(loc('uResolution'), st.width, st.height);
    const c = st.clock;
    const sway = 0.75 + 0.45 * st.pace;
    gl.uniform3f(
      loc('uMotion'),
      (0.26 * Math.sin(0.53 * c) + 0.1 * Math.sin(1.19 * c + 1.3)) * sway,
      1 + (0.06 * Math.sin(0.71 * c) + 0.035 * Math.sin(1.37 * c + 0.4)) * sway,
      0.06 * Math.sin(0.41 * c + 2) * sway,
    );
    gl.uniform1f(loc('uLevel'), clamp(st.activity, 0, 1));
    gl.uniform3fv(loc('uColors'), st.palette);
    gl.uniform1i(loc('uCount'), clamp(Math.round(props.count), 1, 3));
    gl.uniform1f(loc('uAmplitude'), props.amplitude);
    gl.uniform1f(loc('uWaviness'), props.waviness);
    gl.uniform1f(loc('uThickness'), props.thickness);
    gl.uniform1f(loc('uGlow'), props.glow);
    gl.uniform1f(loc('uTaper'), Math.max(0.05, props.taper));
    gl.uniform1f(loc('uSpread'), props.spread);
    gl.uniform1f(loc('uHueShift'), props.hueShift);
    gl.uniform1f(loc('uIntensity'), props.intensity);
    gl.uniform1f(loc('uSaturation'), props.saturation);
    gl.uniform1f(loc('uScale'), Math.max(0.05, props.scale));
    gl.uniform1f(loc('uGlass'), props.glass ? 1 : 0);
    gl.uniform1f(loc('uRadius'), 0.42 * props.glassSize);
    gl.uniform1f(loc('uRefraction'), props.refraction);
    gl.uniform1f(loc('uDispersion'), props.dispersion);
    gl.uniform1f(loc('uRim'), props.rim);
    gl.uniform2f(loc('uLean'), st.lean[0] ?? 0, st.lean[1] ?? 0);
    gl.uniform1f(loc('uIntro'), st.intro);
    gl.uniform1f(loc('uPulse'), st.pulse);
    gl.uniform1f(loc('uLight'), props.lightMode ? 1 : 0);
    gl.uniform1f(loc('uOpacity'), props.opacity);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now: number) {
    st.raf = 0;
    const dt = st.last ? clamp((now - st.last) / 1000, 0, 0.05) : 0;
    st.last = now;
    const reduced = reducedMotion.value === 'reduce';
    if (st.introStart < 0 && st.visible) st.introStart = now;
    if (props.intro && !reduced && st.introStart >= 0) {
      const t = clamp((now - st.introStart) / 1400, 0, 1);
      st.intro = 1 - Math.pow(1 - t, 3);
    } else {
      st.intro = 1;
    }
    st.hover +=
      (st.hoverTarget - st.hover) *
      (1 - Math.exp(-dt / (st.hoverTarget > st.hover ? 0.25 : 0.6)));
    for (let i = 0; i < 2; i++) {
      const cur = st.lean[i] ?? 0;
      st.lean[i] =
        cur + ((st.leanTarget[i] ?? 0) - cur) * (1 - Math.exp(-dt / 0.35));
    }
    st.pulseV += (-170 * st.pulse - 14 * st.pulseV) * dt;
    st.pulse += st.pulseV * dt;
    st.burst *= Math.exp(-dt / 0.45);
    if (props.listening && !reduced) st.speechT += dt;
    const voice =
      typeof props.level === 'number'
        ? clamp(props.level, 0, 1)
        : props.listening && !reduced
          ? speech(st.speechT)
          : 0;
    const target = Math.min(
      1.2,
      Math.max(clamp(props.energy, 0, 1), voice) + st.hover * 0.18 + st.burst,
    );
    st.activity +=
      (target - st.activity) *
      (1 - Math.exp(-dt / (target > st.activity ? 0.12 : 0.4)));
    st.pace += (Math.min(1, st.activity) - st.pace) * (1 - Math.exp(-dt / 0.8));
    if (!reduced) st.clock += dt * props.speed * (0.6 + 1.6 * st.pace);
    draw();
    const settled =
      reduced &&
      Math.abs(st.activity - target) < 1e-3 &&
      Math.abs(st.pulse) < 1e-3 &&
      Math.abs(st.pulseV) < 1e-3 &&
      st.burst < 1e-3 &&
      Math.abs(st.hover - st.hoverTarget) < 1e-3 &&
      Math.abs((st.lean[0] ?? 0) - (st.leanTarget[0] ?? 0)) < 1e-3 &&
      Math.abs((st.lean[1] ?? 0) - (st.leanTarget[1] ?? 0)) < 1e-3;
    if (st.visible && !document.hidden && !st.lost && !settled) {
      st.raf = requestAnimationFrame(frame);
    }
  }

  function wake() {
    if (mounted && !st.raf && st.visible && !st.lost) {
      st.last = 0;
      st.raf = requestAnimationFrame(frame);
    }
  }

  function local(e: PointerEvent): [number, number] {
    const container = containerRef.value;
    if (!container) return [0, 0];
    const r = container.getBoundingClientRect();
    const m = Math.min(r.width, r.height) || 1;
    return [
      (e.clientX - r.left - r.width / 2) / (m / 2),
      (e.clientY - r.top - r.height / 2) / (m / 2),
    ];
  }

  function onMove(e: PointerEvent) {
    if (!props.interactive) return;
    const [x, y] = local(e);
    st.hoverTarget = clamp(1.6 - Math.hypot(x, y), 0, 1);
    st.leanTarget = [clamp(x, -1.2, 1.2) * 0.8, clamp(-y, -1.2, 1.2) * 0.8];
    wake();
  }

  function onLeave() {
    st.hoverTarget = 0;
    st.leanTarget = [0, 0];
    wake();
  }

  function onDown() {
    if (!props.clickPulse) return;
    st.pulseV += 5;
    st.burst = Math.min(1.2, st.burst + 0.9);
    wake();
  }

  function onLost(e: Event) {
    e.preventDefault();
    st.lost = true;
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
  }

  function onRestored() {
    st.lost = false;
    if (setup()) wake();
  }

  useEventListener(canvasRef, 'webglcontextlost', onLost);
  useEventListener(canvasRef, 'webglcontextrestored', onRestored);
  useEventListener(defaultDocument, 'visibilitychange', () => {
    if (!defaultDocument?.hidden) wake();
  });
  useResizeObserver(containerRef, () => {
    resize();
    draw();
  });
  useIntersectionObserver(containerRef, (entries) => {
    st.visible = entries[entries.length - 1]?.isIntersecting ?? false;
    if (st.visible) wake();
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    gl =
      canvas?.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
      }) ?? null;
    if (!gl || !setup()) return;
    mounted = true;
    resize();
    draw();
    wake();
  });

  // The loop runs while visible; this only matters once it has settled (reduced motion).
  watch(
    () => props,
    () => {
      draw();
      wake();
    },
    { deep: true, flush: 'post' },
  );
  watch(reducedMotion, wake);

  onBeforeUnmount(() => {
    mounted = false;
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
    if (gl) {
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    gl = null;
    program = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full bg-transparent', props.class)"
    style="-webkit-tap-highlight-color: transparent"
    @pointermove="onMove"
    @pointerleave="onLeave"
    @pointerdown="onDown"
  >
    <canvas ref="canvasRef" class="block size-full" aria-hidden="true" />
  </div>
</template>
