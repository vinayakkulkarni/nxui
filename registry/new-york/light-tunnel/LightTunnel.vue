<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import type { LightTunnelProps, LightTunnelSettings } from './types';
  import {
    INTRO_SECONDS,
    clamp,
    createColorParser,
    link,
  } from './light-tunnel-gl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<LightTunnelProps>(), {
    cableColor: '#ffffff',
    pulseColor: '#ffffff',
    tunnelColor: '#ffffff',
    tunnelOpacity: 0,
    speed: 0.1,
    flowDirection: 'inward',
    pulseSpeed: 2,
    pulseLength: 0.28,
    pulseBlend: 0.6,
    pulseWidth: 1,
    pulseDensity: 0.5,
    cableCount: 56,
    thickness: 0.35,
    rimWidth: 0.15,
    waviness: 0.3,
    sway: 0.5,
    bend: 0.4,
    size: 1,
    centerX: 0,
    centerY: 0,
    glow: 1,
    fadeNear: 0.5,
    fadeFar: 2,
    brightness: 1,
    colorVariance: true,
    grain: false,
    grainIntensity: 0.05,
    opacity: 1,
    mouseInteraction: true,
    mouseStrength: 0.1,
    clickSurge: true,
    intro: true,
    variation: 0,
    lightMode: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const docRef = shallowRef<Document | null>(null);
  const rootRef = shallowRef<HTMLElement | null>(null);
  const motionPreference = usePreferredReducedMotion();

  const settings = computed<LightTunnelSettings>(() => ({
    cableColor: props.cableColor,
    pulseColor: props.pulseColor,
    tunnelColor: props.tunnelColor,
    tunnelOpacity: clamp(props.tunnelOpacity, 0, 1),
    speed: Math.max(0, props.speed),
    flow: props.flowDirection === 'outward' ? 1 : -1,
    pulseSpeed: Math.max(0, props.pulseSpeed),
    pulseLength: clamp(props.pulseLength, 0.02, 1),
    pulseBlend: clamp(props.pulseBlend, 0, 1),
    pulseWidth: clamp(props.pulseWidth, 0.1, 3),
    pulseDensity: clamp(props.pulseDensity, 0, 1),
    cableCount: clamp(Math.round(props.cableCount), 4, 200),
    thickness: clamp(props.thickness, 0.05, 2),
    rimWidth: clamp(props.rimWidth, 0, 1),
    waviness: Math.max(0, props.waviness),
    sway: Math.max(0, props.sway),
    bend: Math.max(0, props.bend),
    size: Math.max(0.05, props.size),
    centerX: props.centerX,
    centerY: props.centerY,
    glow: Math.max(0, props.glow),
    fadeNear: Math.max(0.001, props.fadeNear),
    fadeFar: Math.max(0.01, props.fadeFar),
    brightness: Math.max(0, props.brightness),
    colorVariance: props.colorVariance,
    grain: props.grain,
    grainIntensity: Math.max(0, props.grainIntensity),
    opacity: clamp(props.opacity, 0, 1),
    mouseInteraction: props.mouseInteraction,
    mouseStrength: Math.max(0, props.mouseStrength),
    clickSurge: props.clickSurge,
    intro: props.intro,
    variation: props.variation,
    lightMode: props.lightMode,
    dpr: props.dpr,
  }));

  const pointer = { x: 0, y: 0, inside: false };
  const steer = { x: 0, y: 0 };
  const surge = { age: 10 };
  let time = 0;
  let drift = 0;
  let reveal = 1;
  let raf = 0;
  let last = 0;
  let visible = true;
  let lastDpr: number | undefined;
  let render: (() => void) | null = null;
  let resize: (() => void) | null = null;
  let dispose: (() => void) | null = null;

  function isReduced() {
    return motionPreference.value === 'reduce';
  }

  function isHidden() {
    return docRef.value?.hidden ?? false;
  }

  function frame(now: number) {
    raf = 0;
    if (!visible || isHidden() || !render) return;
    const s = settings.value;
    const reduce = isReduced();
    const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
    last = now;
    const motion = reduce ? 0 : 1;
    time += dt * s.speed * motion;
    drift += dt * (s.speed + 0.2) * motion;
    surge.age += dt;
    if (s.intro && !reduce && reveal < 1)
      reveal = Math.min(1, reveal + dt / INTRO_SECONDS);
    else if (!s.intro || reduce) reveal = 1;

    const engaged = s.mouseInteraction && pointer.inside && !reduce;
    const reach = s.mouseStrength * 2.5;
    const targetX = engaged ? pointer.x * reach : 0;
    const targetY = engaged ? pointer.y * reach : 0;
    const follow = 1 - Math.exp(-dt / 0.6);
    steer.x += (targetX - steer.x) * follow;
    steer.y += (targetY - steer.y) * follow;

    render();
    const settled =
      Math.abs(targetX - steer.x) < 0.0005 &&
      Math.abs(targetY - steer.y) < 0.0005;
    const busy = motion > 0 || !settled || reveal < 1 || surge.age < 2.4;
    if (busy) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  function wake() {
    if (!raf && visible && !isHidden() && render)
      raf = requestAnimationFrame(frame);
  }

  function locate(event: PointerEvent) {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    const scale = Math.min(rect.width, rect.height) * 0.5;
    pointer.x = (x - rect.width / 2) / Math.max(1, scale);
    pointer.y = (rect.height / 2 - y) / Math.max(1, scale);
  }

  function onPointerMove(event: PointerEvent) {
    locate(event);
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    locate(event);
    if (!pointer.inside || !settings.value.clickSurge || isReduced()) return;
    surge.age = 0;
    wake();
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerType !== 'mouse') pointer.inside = false;
  }

  function onPointerLeave() {
    pointer.inside = false;
  }

  function onVisibility() {
    last = 0;
    wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootRef, 'pointerleave', onPointerLeave);
  useEventListener(docRef, 'visibilitychange', onVisibility);

  useResizeObserver(containerRef, () => {
    resize?.();
  });

  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      last = 0;
      wake();
    }
  });

  onMounted(() => {
    docRef.value = document;
    rootRef.value = document.documentElement;
    const container = containerRef.value;
    const canvas = canvasRef.value;
    const gl = canvas?.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!container || !canvas || !gl) return;

    const program = link(gl);
    if (!program) return;
    const u = program.uniforms;

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const parse = createColorParser();
    reveal = settings.value.intro && !isReduced() ? 0 : 1;

    render = () => {
      const s = settings.value;
      const width = canvas.width;
      const height = canvas.height;
      const ratio = width / Math.max(1, container.clientWidth);
      const minSide = Math.min(width, height);
      const flow = s.flow;
      const span = 3.4;
      const travel = surge.age * 2.6;
      const surgeDepth = flow > 0 ? span - travel : -0.6 + travel;
      const surgeLevel =
        surge.age < 2.4
          ? Math.min(1, surge.age / 0.12) * Math.exp(-surge.age * 1.1)
          : 0;
      const eased = reveal * reveal * (3 - 2 * reveal);
      gl.viewport(0, 0, width, height);
      gl.useProgram(program.program);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.uResolution ?? null, width, height);
      gl.uniform2f(u.uCenter ?? null, s.centerX * minSide, s.centerY * minSide);
      gl.uniform1f(u.uScale ?? null, minSide * 0.5 * s.size);
      gl.uniform1f(u.uRatio ?? null, ratio);
      gl.uniform1f(u.uTime ?? null, time);
      gl.uniform1f(u.uDrift ?? null, drift);
      gl.uniform2f(u.uSteer ?? null, steer.x, steer.y);
      gl.uniform1f(u.uBend ?? null, s.bend * 0.45);
      gl.uniform1f(u.uCount ?? null, s.cableCount);
      gl.uniform1f(
        u.uSwing ?? null,
        (Math.sin(drift * 0.9) * s.sway * 0.5) / (Math.PI * 2),
      );
      gl.uniform1f(u.uWave ?? null, s.waviness * 0.15);
      gl.uniform1f(u.uWidth ?? null, (0.25 + s.thickness * 1.5) * ratio);
      gl.uniform1f(u.uPulseWidth ?? null, 0.6 + s.pulseWidth * 0.9);
      const length = s.pulseLength * 1.2;
      gl.uniform1f(u.uHead ?? null, length * (0.08 + s.pulseBlend * 0.22));
      gl.uniform1f(u.uTail ?? null, length * (0.5 + s.pulseBlend * 0.7));
      gl.uniform1f(u.uChance ?? null, s.pulseDensity);
      gl.uniform1f(u.uSpacing ?? null, 0.4);
      gl.uniform1f(u.uPulseSpeed ?? null, s.pulseSpeed * 4);
      gl.uniform1f(u.uFlow ?? null, flow);
      gl.uniform1f(u.uHalo ?? null, 1.2 + s.rimWidth * 8);
      gl.uniform1f(u.uGlow ?? null, s.glow);
      gl.uniform1f(u.uBrightness ?? null, s.brightness);
      gl.uniform1f(u.uVariance ?? null, s.colorVariance ? 1 : 0);
      gl.uniform1f(u.uBody ?? null, s.tunnelOpacity);
      gl.uniform1f(u.uFadeNear ?? null, s.fadeNear);
      gl.uniform1f(u.uFadeFar ?? null, s.fadeFar);
      gl.uniform3fv(u.uCable ?? null, parse(s.cableColor, [1, 1, 1]));
      gl.uniform3fv(u.uPulse ?? null, parse(s.pulseColor, [1, 1, 1]));
      gl.uniform3fv(u.uTunnel ?? null, parse(s.tunnelColor, [1, 1, 1]));
      gl.uniform3f(u.uSurge ?? null, surgeDepth, surgeLevel, 0.22);
      gl.uniform1f(u.uReveal ?? null, 1.7 - eased * 3.6);
      gl.uniform1f(u.uGrain ?? null, s.grain ? s.grainIntensity : 0);
      gl.uniform1f(u.uSeed ?? null, s.variation);
      gl.uniform1f(u.uLight ?? null, s.lightMode ? 1 : 0);
      gl.uniform1f(u.uOpacity ?? null, s.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    resize = () => {
      const s = settings.value;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      render?.();
      wake();
    };

    dispose = () => {
      gl.deleteProgram(program.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };

    lastDpr = settings.value.dpr;
    resize();
  });

  watch(settings, (s) => {
    if (s.dpr !== lastDpr) {
      lastDpr = s.dpr;
      resize?.();
      return;
    }
    if (!raf) render?.();
    wake();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    raf = 0;
    render = null;
    resize = null;
    dispose?.();
    dispose = null;
  });
</script>

<template>
  <div ref="containerRef" :class="cn('light-tunnel-container', props.class)">
    <canvas ref="canvasRef" class="light-tunnel-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .light-tunnel-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .light-tunnel-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
