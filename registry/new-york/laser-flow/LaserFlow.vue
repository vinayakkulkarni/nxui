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
    DEFAULT_RGB,
    INTRO_DROP,
    INTRO_END,
    MAX_RENDER_DIM,
    buildTints,
    clamp,
    easeOut,
    linkProgram,
    locateUniforms,
    spring,
  } from './laser-flow-gl';
  import type { Rgb } from './laser-flow-gl';
  import type { LaserFlowProps, LaserFlowSurface } from './types';

  const props = withDefaults(defineProps<LaserFlowProps>(), {
    surfaceRef: null,
    beamPosition: 0.6,
    surfaceLevel: 1,
    color: '#3847ff',
    intensity: 1.8,
    beamWidth: 1.5,
    flare: 1.5,
    spread: 1.5,
    spill: 1,
    fog: 0.2,
    dust: 1.6,
    streaks: 1.5,
    dots: 1,
    pulse: 1.5,
    speed: 1.5,
    seed: 3,
    mouseInteraction: true,
    revealImage: undefined,
    revealRadius: 220,
    revealOpacity: 0.6,
    intro: true,
    theme: 'dark',
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  // Imperative hooks set once WebGL is up; no-ops before mount / after unmount.
  let wake: () => void = () => {};
  let resize: () => void = () => {};
  let dispose: () => void = () => {};
  let visible = true;
  const pointer = { x: 0, y: 0, inside: false };

  function onPointerMove(event: PointerEvent) {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointer.x = x;
    pointer.y = y;
    pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    wake();
  }

  function onPointerLeave() {
    pointer.inside = false;
    wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener(
    () => defaultDocument?.documentElement,
    'pointerleave',
    onPointerLeave,
  );
  useEventListener(defaultDocument, 'visibilitychange', () => wake());
  useResizeObserver(containerRef, () => resize());
  useResizeObserver(
    () => props.surfaceRef ?? null,
    () => resize(),
  );
  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
  });

  onMounted(() => {
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
    const program = linkProgram(gl);
    if (!program) return;
    const u = locateUniforms(gl, program);

    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const revealTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, revealTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const probeContext = probe.getContext('2d', { willReadFrequently: true });
    const isReduced = () => reducedMotion.value === 'reduce';

    const state = {
      time: 0,
      introTime: props.intro && !isReduced() ? 0 : INTRO_END,
      width: 1,
      height: 1,
      ratio: 1,
      colorKey: '',
      tints: buildTints(DEFAULT_RGB),
      lens: { x: 0, y: 0, vx: 0, vy: 0, strength: 0, placed: false },
      reveal: {
        src: '',
        ready: false,
        width: 1,
        height: 1,
      },
    };
    let revealImageEl: HTMLImageElement | null = null;
    let raf = 0;
    let last = 0;
    let alive = true;

    const toRgb = (value: string): Rgb => {
      if (!probeContext) return DEFAULT_RGB;
      probeContext.clearRect(0, 0, 1, 1);
      probeContext.fillStyle = '#3847ff';
      probeContext.fillStyle = value;
      probeContext.fillRect(0, 0, 1, 1);
      const data = probeContext.getImageData(0, 0, 1, 1).data;
      return [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255];
    };

    const resolveColor = () => {
      const color = String(props.color);
      if (color === state.colorKey) return;
      state.colorKey = color;
      state.tints = buildTints(toRgb(color));
    };

    const resolveReveal = () => {
      const src = props.revealImage ? String(props.revealImage) : '';
      const reveal = state.reveal;
      if (src === reveal.src) return;
      reveal.src = src;
      reveal.ready = false;
      if (revealImageEl) revealImageEl.onload = null;
      if (!src) return;
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        if (!alive || reveal.src !== src) return;
        const width = image.naturalWidth || image.width || 1;
        const height = image.naturalHeight || image.height || 1;
        const scale = Math.min(1, 2048 / Math.max(width, height));
        const sheet = document.createElement('canvas');
        sheet.width = Math.max(1, Math.round(width * scale));
        sheet.height = Math.max(1, Math.round(height * scale));
        sheet
          .getContext('2d')
          ?.drawImage(image, 0, 0, sheet.width, sheet.height);
        gl.bindTexture(gl.TEXTURE_2D, revealTexture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          sheet,
        );
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        reveal.width = sheet.width;
        reveal.height = sheet.height;
        reveal.ready = true;
        wake();
      };
      image.src = src;
      revealImageEl = image;
    };

    const measure = (width: number, height: number): LaserFlowSurface => {
      const element = props.surfaceRef ?? null;
      if (element) {
        const box = container.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        if (rect.width > 0) {
          const computed = getComputedStyle(element);
          const radius = Math.max(
            Number.parseFloat(computed.borderTopLeftRadius) || 0,
            Number.parseFloat(computed.borderTopRightRadius) || 0,
          );
          return {
            left: rect.left - box.left,
            top: rect.top - box.top,
            right: rect.right - box.left,
            bottom: rect.bottom - box.top,
            radius: Math.min(radius, rect.width / 2, rect.height / 2),
            real: true,
          };
        }
      }
      return {
        left: -width * 2,
        top: clamp(props.surfaceLevel, 0, 1) * height,
        right: width * 3,
        bottom: height * 3,
        radius: 0,
        real: false,
      };
    };

    const render = () => {
      resolveColor();
      const { width, height } = state;
      const scale = Math.max(0.2, Math.min(width / 585, height / 507));
      const spreadValue = clamp(props.spread, 0.1, 4);
      let surface = measure(width, height);
      let beamX = clamp(props.beamPosition, 0, 1) * width;
      if (surface.real) {
        const margin = surface.radius + 6;
        if (beamX >= surface.left && beamX <= surface.right) {
          beamX = clamp(beamX, surface.left + margin, surface.right - margin);
        } else {
          surface = {
            left: -width * 2,
            top: height,
            right: width * 3,
            bottom: height * 3,
            radius: 0,
            real: false,
          };
        }
      }
      const startY = -0.15 * height;
      const span = surface.top - startY + 0.3 * height;
      const it = state.introTime;
      const settled = it >= INTRO_END;
      const front = settled
        ? surface.top + 0.3 * height
        : startY + span * Math.pow(clamp(it / INTRO_DROP, 0, 1), 1.3);
      const impact =
        INTRO_DROP *
        Math.pow(Math.max(0, surface.top - startY) / span, 1 / 1.3);
      const tau = it - impact;
      const bloom = settled ? 1 : tau <= 0 ? 0 : spring(tau);
      const flash =
        settled || tau <= 0
          ? 0
          : Math.exp(-tau / 0.35) * (1 - Math.exp(-tau / 0.05));
      const runRange = spreadValue * 250 * 1.3 + 80;
      const runFront = settled
        ? 100000
        : tau <= 0
          ? -40
          : runRange * (1 - Math.exp(-1.15 * tau));
      const beadStrength =
        settled || tau <= 0
          ? 0
          : Math.exp(-1.15 * tau) * (1 - Math.exp(-tau / 0.08));
      const pour = (reach: number): [number, number] => {
        if (settled) return [1000, 1];
        if (tau <= 0) return [-reach, 0];
        const target = Math.min(reach, runRange * 0.97);
        const arrival = -Math.log(1 - target / runRange) / 1.15;
        const elapsed = tau - arrival;
        const ease = clamp((elapsed + 0.15) / 0.8, 0, 1);
        const fill = ease * ease * ease * (ease * (ease * 6 - 15) + 10);
        if (elapsed <= 0) return [runFront - target, fill];
        const pourSpeed = 1.15 * (runRange - target);
        return [pourSpeed * elapsed + 260 * elapsed * elapsed, fill];
      };
      const [frontL, fillL] = pour((beamX - surface.left) / scale);
      const [frontR, fillR] = pour((surface.right - beamX) / scale);
      const atmosphere = settled
        ? 1
        : tau <= 0
          ? 0.3 * easeOut(it / INTRO_DROP)
          : 0.3 + 0.7 * (1 - Math.exp(-1.3 * tau));
      const seedValue = Number(props.seed) || 0;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(u('uResolution'), width, height);
      gl.uniform1f(u('uDpr'), state.ratio);
      gl.uniform1f(u('uScale'), scale);
      gl.uniform1f(u('uTime'), state.time);
      gl.uniform1f(u('uBeamX'), beamX);
      gl.uniform4f(
        u('uSurface'),
        surface.left,
        surface.top,
        surface.right,
        surface.bottom,
      );
      gl.uniform1f(u('uRadius'), surface.radius);
      gl.uniform3f(u('uIntro'), front, bloom, flash);
      gl.uniform4f(u('uPour'), frontL, frontR, fillL, fillR);
      gl.uniform2f(u('uRun'), runFront, beadStrength);
      gl.uniform4f(
        u('uLens'),
        state.lens.x,
        state.lens.y,
        95 * scale,
        state.lens.strength,
      );
      resolveReveal();
      const { reveal } = state;
      const cover = Math.max(width / reveal.width, height / reveal.height);
      const coverWidth = reveal.width * cover;
      const coverHeight = reveal.height * cover;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, revealTexture);
      gl.uniform1i(u('uReveal'), 0);
      gl.uniform4f(
        u('uRevealMap'),
        1 / coverWidth,
        1 / coverHeight,
        (coverWidth - width) / 2 / coverWidth,
        (coverHeight - height) / 2 / coverHeight,
      );
      gl.uniform2f(
        u('uRevealInfo'),
        Math.max(1, props.revealRadius),
        reveal.ready ? clamp(props.revealOpacity, 0, 1) : 0,
      );
      gl.uniform1f(u('uAtmosphere'), atmosphere);
      gl.uniform4f(
        u('uAmount'),
        Math.max(0, props.intensity),
        Math.max(0, props.fog),
        Math.max(0, props.dust),
        Math.max(0, props.streaks),
      );
      gl.uniform4f(
        u('uShape'),
        clamp(props.beamWidth, 0.2, 5),
        clamp(props.flare, 0.2, 4),
        spreadValue,
        Math.max(0, props.spill),
      );
      gl.uniform4f(
        u('uExtra'),
        Math.max(0, props.pulse),
        Math.max(0, props.dots),
        34.34 + seedValue * 7.31,
        11.58 + seedValue * 3.17,
      );
      gl.uniform1f(u('uTheme'), props.theme === 'light' ? 1 : 0);
      gl.uniform3fv(u('uTint'), state.tints);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const reduce = isReduced();
      const moving = !props.paused && !reduce;
      if (moving) state.time += dt * props.speed;
      const introducing = state.introTime < INTRO_END;
      if (introducing) {
        state.introTime = Math.min(INTRO_END, state.introTime + dt);
      }

      const { lens } = state;
      const active = props.mouseInteraction && pointer.inside && !reduce;
      if (active && !lens.placed) {
        lens.x = pointer.x;
        lens.y = pointer.y;
        lens.vx = 0;
        lens.vy = 0;
        lens.placed = true;
      }
      const ax = 120 * (pointer.x - lens.x) - 19 * lens.vx;
      const ay = 120 * (pointer.y - lens.y) - 19 * lens.vy;
      lens.vx += ax * dt;
      lens.vy += ay * dt;
      lens.x += lens.vx * dt;
      lens.y += lens.vy * dt;
      const goal = active ? 1 : 0;
      lens.strength +=
        (goal - lens.strength) *
        (1 - Math.exp(-dt / (goal > lens.strength ? 0.3 : 0.55)));
      if (lens.strength < 0.001 && !active) lens.placed = false;

      render();
      const settling =
        Math.abs(
          lens.strength - (props.mouseInteraction && pointer.inside ? 1 : 0),
        ) > 0.002 || Math.hypot(lens.vx, lens.vy) > 0.5;
      if (moving || introducing || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const start = () => {
      if (!raf && alive && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const baseDpr = Math.min(props.dpr || window.devicePixelRatio || 1, 2);
      const longest = Math.max(width, height) * baseDpr;
      const ratio =
        longest > MAX_RENDER_DIM
          ? (baseDpr * MAX_RENDER_DIM) / longest
          : baseDpr;
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      state.width = width;
      state.height = height;
      state.ratio = canvas.width / width;
      render();
    };

    wake = () => {
      if (!alive) return;
      if (!raf) render();
      start();
    };

    dispose = () => {
      alive = false;
      cancelAnimationFrame(raf);
      raf = 0;
      wake = () => {};
      resize = () => {};
      if (revealImageEl) revealImageEl.onload = null;
      gl.deleteTexture(revealTexture);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };

    resize();
    start();
  });

  watch(
    [
      () => props.surfaceRef,
      () => props.beamPosition,
      () => props.surfaceLevel,
      () => props.color,
      () => props.intensity,
      () => props.beamWidth,
      () => props.flare,
      () => props.spread,
      () => props.spill,
      () => props.fog,
      () => props.dust,
      () => props.streaks,
      () => props.dots,
      () => props.pulse,
      () => props.speed,
      () => props.seed,
      () => props.mouseInteraction,
      () => props.revealImage,
      () => props.revealRadius,
      () => props.revealOpacity,
      () => props.theme,
      () => props.paused,
      () => reducedMotion.value,
    ],
    () => wake(),
    { flush: 'post' },
  );

  watch(
    () => props.dpr,
    () => resize(),
  );

  onBeforeUnmount(() => dispose());
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('pointer-events-none relative size-full', props.class)"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
