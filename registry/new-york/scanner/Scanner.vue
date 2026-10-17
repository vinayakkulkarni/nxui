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
  import type { ScannerProps, ScannerSettings } from './types';
  import {
    DIRECTIONS,
    INTRO_SECONDS,
    MAX_PINGS,
    clamp,
    link,
    toRgb,
  } from './scanner-gl';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<ScannerProps>(), {
    color1: '#5227FF',
    color2: '#FF9FFC',
    color3: '#FFFFFF',
    speed: 0.5,
    sweepSpeed: 0.25,
    sweepWidth: 1.6,
    trail: 0.5,
    reverse: false,
    scale: 1.5,
    frequency: 2,
    ripple: 0.22,
    bandDensity: 11,
    lineWidth: 1.2,
    glow: 0.6,
    scanDirection: 'vertical',
    colorSpread: 0.7,
    brightness: 1,
    vignette: 0.3,
    scanline: true,
    scanlineIntensity: 0.5,
    grain: true,
    grainIntensity: 0.04,
    opacity: 1,
    mouseInteraction: true,
    mouseRadius: 0.5,
    mouseStrength: 0.7,
    mouseMode: 'repel',
    clickEffect: 'ping',
    intro: true,
    lightMode: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const docRef = shallowRef<Document | null>(null);
  const rootRef = shallowRef<HTMLElement | null>(null);
  const motionPreference = usePreferredReducedMotion();

  const settings = computed<ScannerSettings>(() => ({
    color1: props.color1,
    color2: props.color2,
    color3: props.color3,
    speed: props.speed,
    sweepSpeed: props.reverse ? -props.sweepSpeed : props.sweepSpeed,
    sweepWidth: Math.max(0.05, props.sweepWidth),
    trail: clamp(props.trail, 0, 1),
    scale: Math.max(0.05, props.scale),
    frequency: props.frequency,
    ripple: props.ripple,
    bandDensity: Math.max(0.5, props.bandDensity),
    lineWidth: Math.max(0.2, props.lineWidth),
    glow: Math.max(0, props.glow),
    direction: DIRECTIONS[props.scanDirection] ?? 0,
    colorSpread: clamp(props.colorSpread, 0, 1),
    brightness: Math.max(0, props.brightness),
    vignette: clamp(props.vignette, 0, 1),
    scanline: props.scanline ? clamp(props.scanlineIntensity, 0, 1) : 0,
    grain: props.grain ? Math.max(0, props.grainIntensity) : 0,
    opacity: clamp(props.opacity, 0, 1),
    mouseInteraction: props.mouseInteraction,
    mouseRadius: Math.max(0.05, props.mouseRadius),
    mouseStrength: Math.max(0, props.mouseStrength),
    attract: props.mouseMode === 'attract',
    clickEffect: props.clickEffect,
    intro: props.intro,
    lightMode: props.lightMode,
    dpr: props.dpr,
  }));

  const view = { width: 1, height: 1, ratio: 1 };
  const pointer = { x: 0, y: 0, inside: false };
  const mouse = { x: 0, y: 0, ready: false };
  const pings = new Float32Array(MAX_PINGS * 3);
  for (let k = 0; k < MAX_PINGS; k++) pings[k * 3 + 2] = -1;
  let pingIndex = 0;
  let presence = 0;
  let wave = 0;
  let sweep = -0.39;
  let clock = 0;
  let introClock = 1;
  let raf = 0;
  let last = 0;
  let visible = true;
  let quiet = 0;
  let sizedDpr: number | undefined;
  let draw: (() => void) | null = null;
  let resize: (() => void) | null = null;
  let dispose: (() => void) | null = null;

  function isReduced() {
    return motionPreference.value === 'reduce';
  }

  function isHidden() {
    return docRef.value?.hidden ?? false;
  }

  function toUv(x: number, y: number) {
    return [
      (x * 2 - view.width) / view.height,
      (view.height - y * 2) / view.height,
    ];
  }

  function frame(now: number) {
    raf = 0;
    if (!visible || isHidden() || !draw) return;
    const s = settings.value;
    const reduce = isReduced();
    if (s.dpr !== sizedDpr) resize?.();
    const dt = last ? clamp((now - last) / 1000, 0, 1 / 20) : 1 / 60;
    last = now;
    clock += dt;
    if (!reduce) {
      wave += dt * s.speed;
      sweep += dt * s.sweepSpeed;
    }
    if (introClock < 1)
      introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
    const [targetX = 0, targetY = 0] = toUv(pointer.x, pointer.y);
    const follow = 1 - Math.exp(-dt / 0.09);
    mouse.x += (targetX - mouse.x) * follow;
    mouse.y += (targetY - mouse.y) * follow;
    presence +=
      ((pointer.inside && s.mouseInteraction ? 1 : 0) - presence) *
      (1 - Math.exp(-dt / 0.3));
    let busy =
      (!reduce && (s.speed !== 0 || s.sweepSpeed !== 0)) ||
      introClock < 1 ||
      presence > 0.001;
    for (let k = 0; k < MAX_PINGS; k++) {
      const age = pings[k * 3 + 2] ?? -1;
      if (age < 0) continue;
      const next = age + dt;
      if (next > 4) pings[k * 3 + 2] = -1;
      else {
        pings[k * 3 + 2] = next;
        busy = true;
      }
    }
    draw();
    quiet = busy ? 0 : quiet + dt;
    if (quiet < 0.5) raf = requestAnimationFrame(frame);
  }

  function wake() {
    quiet = 0;
    if (!raf && visible && !isHidden() && draw) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function locate(event: PointerEvent) {
    const container = containerRef.value;
    if (!container) return { x: 0, y: 0, inside: false };
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return {
      x,
      y,
      inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
    };
  }

  function onPointerMove(event: PointerEvent) {
    const { x, y, inside } = locate(event);
    const was = pointer.inside;
    pointer.inside = inside;
    if (inside) {
      pointer.x = x;
      pointer.y = y;
      if (!was || !mouse.ready) {
        const [ux = 0, uy = 0] = toUv(x, y);
        mouse.x = ux;
        mouse.y = uy;
        mouse.ready = true;
      }
    }
    if (inside || was) wake();
  }

  function onPointerDown(event: PointerEvent) {
    if (settings.value.clickEffect !== 'ping' || isReduced()) return;
    const { x, y, inside } = locate(event);
    if (!inside) return;
    const [ux = 0, uy = 0] = toUv(x, y);
    pings[pingIndex * 3] = ux;
    pings[pingIndex * 3 + 1] = uy;
    pings[pingIndex * 3 + 2] = 0;
    pingIndex = (pingIndex + 1) % MAX_PINGS;
    wake();
  }

  function onPointerLeave() {
    pointer.inside = false;
    wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener(rootRef, 'pointerleave', onPointerLeave);
  useEventListener(docRef, 'visibilitychange', wake);

  useResizeObserver(containerRef, () => {
    resize?.();
  });

  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
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
    const shader = link(gl);
    if (!shader) return;
    const u = shader.uniforms;
    const vao = gl.createVertexArray();
    introClock = settings.value.intro && !isReduced() ? 0 : 1;

    draw = () => {
      const s = settings.value;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(shader.program);
      gl.uniform2f(u.uResolution ?? null, canvas.width, canvas.height);
      gl.uniform1f(u.uWave ?? null, wave);
      gl.uniform1f(u.uSweep ?? null, sweep);
      gl.uniform1f(u.uSweepWidth ?? null, s.sweepWidth);
      gl.uniform1f(u.uTrail ?? null, s.trail);
      gl.uniform1f(u.uScale ?? null, s.scale);
      gl.uniform1f(u.uFrequency ?? null, s.frequency);
      gl.uniform1f(u.uRipple ?? null, s.ripple);
      gl.uniform1f(u.uDensity ?? null, s.bandDensity);
      gl.uniform1f(u.uLineWidth ?? null, s.lineWidth * view.ratio);
      gl.uniform1f(u.uGlow ?? null, s.glow);
      gl.uniform1f(u.uDirection ?? null, s.direction);
      gl.uniform1f(u.uSpread ?? null, s.colorSpread);
      gl.uniform1f(u.uBrightness ?? null, s.brightness);
      gl.uniform1f(u.uVignette ?? null, s.vignette);
      gl.uniform1f(u.uOpacity ?? null, s.opacity);
      gl.uniform1f(u.uScanline ?? null, s.scanline);
      gl.uniform1f(u.uRatio ?? null, view.ratio);
      gl.uniform1f(u.uGrain ?? null, s.grain);
      gl.uniform1f(u.uTime ?? null, clock);
      gl.uniform2f(u.uMouse ?? null, mouse.x, mouse.y);
      gl.uniform1f(u.uPresence ?? null, s.mouseInteraction ? presence : 0);
      gl.uniform1f(u.uMouseRadius ?? null, s.mouseRadius);
      gl.uniform1f(u.uMouseStrength ?? null, s.mouseStrength);
      gl.uniform1f(u.uAttract ?? null, s.attract ? 1 : 0);
      gl.uniform3fv(u.uPings ?? null, pings);
      gl.uniform1f(u.uIntro ?? null, introClock);
      gl.uniform1f(u.uLightMode ?? null, s.lightMode ? 1 : 0);
      gl.uniform3fv(u.uColor1 ?? null, toRgb(s.color1));
      gl.uniform3fv(u.uColor2 ?? null, toRgb(s.color2));
      gl.uniform3fv(u.uColor3 ?? null, toRgb(s.color3));
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    resize = () => {
      const s = settings.value;
      sizedDpr = s.dpr;
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      draw?.();
      wake();
    };

    dispose = () => {
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };

    resize();
  });

  watch(settings, () => {
    wake();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    raf = 0;
    draw = null;
    resize = null;
    dispose?.();
    dispose = null;
  });
</script>

<template>
  <div ref="containerRef" :class="cn('scanner-container', props.class)">
    <canvas ref="canvasRef" class="scanner-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .scanner-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .scanner-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
