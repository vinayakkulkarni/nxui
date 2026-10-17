<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    BLEED,
    UNIFORMS,
    clamp,
    createDecayProgram,
    soften,
  } from './decay-card-shader';
  import type {
    DecayCardProps,
    DecayCardSettings,
    DecayCardUniform,
  } from './types';

  const props = withDefaults(defineProps<DecayCardProps>(), {
    image:
      'https://images.unsplash.com/photo-1762846818262-33c197852fa8?w=900&q=80&auto=format&fit=crop',
    width: 300,
    height: 400,
    intensity: 0.5,
    sensitivity: 0.5,
    hoverDecay: 0.05,
    recovery: 0.6,
    idle: 0.35,
    grain: 0.25,
    detail: 5,
    pattern: 4,
    flow: 0,
    chroma: 0,
    travel: 50,
    tilt: 10,
    scope: 'window',
    radius: 0,
    grayscale: false,
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const fallback = ref(false);
  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');

  const settings = computed<DecayCardSettings>(() => ({
    intensity: clamp(props.intensity, 0, 2),
    sensitivity: clamp(props.sensitivity, 0, 1),
    hoverDecay: clamp(props.hoverDecay, 0, 1),
    recovery: Math.max(0.05, props.recovery),
    frequency: 0.003 + clamp(props.grain, 0, 1) * 0.047,
    octaves: clamp(Math.round(props.detail), 1, 8),
    seed: Math.round(props.pattern),
    idle: clamp(props.idle, 0, 1),
    flow: clamp(props.flow, 0, 2),
    chroma: clamp(props.chroma, 0, 2),
    travel: Math.max(0, props.travel),
    tilt: clamp(props.tilt, 0, 45),
    scope: props.scope === 'card' ? 'card' : 'window',
    radius: Math.max(0, props.radius),
    grayscale: props.grayscale,
  }));

  const rootStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.height}px`,
  }));
  const fallbackStyle = computed(() => ({
    borderRadius: `${props.radius}px`,
    filter: props.grayscale ? 'grayscale(1)' : undefined,
  }));

  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let texture: WebGLTexture | null = null;
  let buffer: WebGLBuffer | null = null;
  const uniforms = new Map<DecayCardUniform, WebGLUniformLocation | null>();
  let alive = true;
  let calm = 0;
  let tick = 0;
  let loadToken = 0;

  const state = {
    x: 0,
    y: 0,
    rotate: 0,
    level: 0,
    time: 0,
    cursorX: 0,
    cursorY: 0,
    lastX: 0,
    lastY: 0,
    seen: false,
    hovered: false,
    visible: true,
    ready: false,
    imageWidth: 1,
    imageHeight: 1,
  };

  function setupGl(canvas: HTMLCanvasElement): void {
    gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (gl) program = createDecayProgram(gl);
    if (!gl || !program) {
      fallback.value = true;
      return;
    }
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
    for (const name of UNIFORMS) {
      uniforms.set(name, gl.getUniformLocation(program, name));
    }
  }

  function u(name: DecayCardUniform): WebGLUniformLocation | null {
    return uniforms.get(name) ?? null;
  }

  function draw(): void {
    const canvas = canvasRef.value;
    if (!gl || !program || !canvas) return;
    const s = settings.value;
    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return;
    const unit = Math.max(w / 720, h / 900) / BLEED;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(u('uImage'), 0);
    gl.uniform2f(u('uSize'), w, h);
    gl.uniform2f(u('uImageSize'), state.imageWidth, state.imageHeight);
    gl.uniform1f(u('uUnit'), unit);
    gl.uniform1f(u('uScale'), state.level * s.intensity * 440);
    gl.uniform1f(u('uIdle'), s.idle);
    gl.uniform1f(u('uFrequency'), s.frequency);
    gl.uniform1i(u('uOctaves'), s.octaves);
    gl.uniform1f(u('uSeed'), s.seed);
    gl.uniform1f(
      u('uRadius'),
      Math.min(300, (s.radius * (w / Math.max(1, canvas.clientWidth))) / unit),
    );
    gl.uniform1f(u('uTime'), state.time);
    gl.uniform1f(u('uFlow'), reduce.value ? 0 : s.flow);
    gl.uniform1f(u('uChroma'), s.chroma);
    gl.uniform1f(u('uGray'), s.grayscale ? 1 : 0);
    gl.uniform1f(u('uReady'), state.ready ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(deltaMs: number): void {
    const root = rootRef.value;
    if (!alive || !root) return;
    const s = settings.value;
    const still = reduce.value;
    const dt = Math.min(0.05, Math.max(0.001, deltaMs / 1000));
    state.time += dt;

    const speed =
      Math.hypot(state.cursorX - state.lastX, state.cursorY - state.lastY) / dt;
    state.lastX = state.cursorX;
    state.lastY = state.cursorY;

    let nx = 0;
    let ny = 0;
    if (s.scope === 'card') {
      if (state.hovered) {
        const rect = root.getBoundingClientRect();
        nx = clamp(
          ((state.cursorX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
          -1,
          1,
        );
        ny = clamp(
          ((state.cursorY - rect.top) / Math.max(1, rect.height)) * 2 - 1,
          -1,
          1,
        );
      }
    } else if (state.seen) {
      nx = clamp(
        (state.cursorX / Math.max(1, window.innerWidth)) * 2 - 1,
        -1,
        1,
      );
      ny = clamp(
        (state.cursorY / Math.max(1, window.innerHeight)) * 2 - 1,
        -1,
        1,
      );
    }
    const follow = 1 - Math.exp(-dt / 0.16);
    const targetX = still ? 0 : soften(nx * 120, s.travel);
    const targetY = still ? 0 : soften(ny * 120, s.travel);
    const targetRotate = still ? 0 : nx * s.tilt;
    state.x += (targetX - state.x) * follow;
    state.y += (targetY - state.y) * follow;
    state.rotate += (targetRotate - state.rotate) * follow;

    const active = s.scope === 'window' || state.hovered;
    let wanted = active
      ? clamp(speed / (2400 - 2100 * s.sensitivity), 0, 1) ** 2
      : 0;
    if (state.hovered) wanted = Math.max(wanted, s.hoverDecay);
    const tau = wanted > state.level ? 0.08 : s.recovery;
    state.level += (wanted - state.level) * (1 - Math.exp(-dt / tau));

    root.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${state.rotate.toFixed(3)}deg)`;

    const settling =
      Math.abs(targetX - state.x) +
        Math.abs(targetY - state.y) +
        Math.abs(targetRotate - state.rotate) >
        0.05 ||
      Math.abs(wanted - state.level) > 0.002 ||
      (state.level > 0.002 && s.flow > 0 && !still) ||
      speed > 1;
    const animating = s.idle > 0 && !still;
    tick = (tick + 1) % 2;
    if (settling || !animating || tick === 0) draw();
    calm = settling ? 0 : calm + dt;
    if (!state.visible || (calm >= 0.25 && !animating)) pause();
  }

  const { pause, resume, isActive } = useRafFn(({ delta }) => frame(delta), {
    immediate: false,
  });

  function wake(): void {
    if (isActive.value || !alive || !state.visible) return;
    calm = 0;
    resume();
  }

  function resize(): void {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    draw();
  }

  function load(src: string): void {
    const token = ++loadToken;
    state.ready = false;
    draw();
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      if (!alive || token !== loadToken) return;
      if (!gl || !program) {
        fallback.value = true;
        return;
      }
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img,
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        state.imageWidth = img.naturalWidth || 1;
        state.imageHeight = img.naturalHeight || 1;
        state.ready = true;
        fallback.value = false;
        draw();
      } catch {
        fallback.value = true;
      }
    };
    img.onerror = () => {
      if (alive && token === loadToken) fallback.value = true;
    };
    img.src = src;
  }

  function onPointerMove(event: PointerEvent): void {
    state.cursorX = event.clientX;
    state.cursorY = event.clientY;
    if (!state.seen) {
      state.seen = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
    }
    wake();
  }

  function onPointerEnter(): void {
    state.hovered = true;
    wake();
  }

  function onPointerLeave(): void {
    state.hovered = false;
    wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener(rootRef, 'pointerenter', onPointerEnter);
  useEventListener(rootRef, 'pointerleave', onPointerLeave);
  useResizeObserver(canvasRef, resize);
  useIntersectionObserver(rootRef, (entries) => {
    state.visible = entries.some((entry) => entry.isIntersecting);
    if (state.visible) wake();
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    state.cursorX = window.innerWidth / 2;
    state.cursorY = window.innerHeight / 2;
    state.lastX = state.cursorX;
    state.lastY = state.cursorY;
    setupGl(canvas);
    resize();
    load(props.image);
    wake();
  });

  watch(
    () => props.image,
    (src) => load(src),
  );
  watch([settings, reduce], () => {
    draw();
    wake();
  });

  onBeforeUnmount(() => {
    alive = false;
    pause();
    if (gl) {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    gl = null;
    program = null;
  });
</script>

<template>
  <div ref="rootRef" :class="cn('decay-card', props.class)" :style="rootStyle">
    <canvas ref="canvasRef" class="decay-card__canvas" aria-hidden="true" />
    <img
      v-if="fallback && image"
      class="decay-card__fallback"
      :src="image"
      alt=""
      :style="fallbackStyle"
    />
    <div v-if="$slots.default" class="decay-card__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .decay-card {
    position: relative;
    flex: none;
    will-change: transform;
  }

  .decay-card__canvas {
    position: absolute;
    top: -12%;
    left: -12%;
    display: block;
    width: 124%;
    height: 124%;
    pointer-events: none;
  }

  .decay-card__fallback {
    position: absolute;
    top: 8.33%;
    left: 8.33%;
    width: 83.33%;
    height: 83.33%;
    object-fit: cover;
  }

  .decay-card__content {
    position: absolute;
    right: 8.33%;
    bottom: 8.33%;
    left: 8.33%;
    padding: 1.25rem;
    color: #ffffff;
    pointer-events: none;
  }
</style>
